const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ──── NOTIFICATIONS ────

const getNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
  const skip = (page - 1) * limit;
  const where = { userId, ...(unreadOnly && { isRead: false }) };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, total, page, limit, unreadCount };
};

const createNotification = async (userId, data) => {
  return prisma.notification.create({ data: { ...data, userId } });
};

const markAsRead = async (id, userId) => {
  return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
};

const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
};

const deleteNotification = async (id, userId) => {
  return prisma.notification.deleteMany({ where: { id, userId } });
};

// ──── TASKS ────

const getTasks = async (userId, { status, priority, page = 1, limit = 20, teamId, assigneeId }) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(teamId && { teamId }),
    ...(assigneeId && { assigneeId }),
  };
  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where, skip, take: limit, orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      include: { assignee: { select: { id: true, name: true, profileImage: true } }, content: { select: { id: true, title: true } } },
    }),
    prisma.task.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const createTask = async (userId, data) => {
  return prisma.task.create({
    data: { ...data, userId, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
    include: { assignee: { select: { id: true, name: true, profileImage: true } } },
  });
};

const updateTask = async (id, userId, data) => {
  return prisma.task.updateMany({
    where: { id, userId },
    data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
  });
};

const deleteTask = async (id, userId) => {
  return prisma.task.deleteMany({ where: { id, userId } });
};

const addComment = async (taskId, userId, content) => {
  return prisma.taskComment.create({ data: { taskId, authorId: userId, content } });
};

// ──── TEAMS ────

const getTeams = async (userId) => {
  return prisma.team.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: { members: { include: { user: { select: { id: true, name: true, profileImage: true, email: true } } } }, _count: { select: { tasks: true } } },
  });
};

const createTeam = async (userId, data) => {
  const team = await prisma.team.create({ data: { ...data, ownerId: userId } });
  // Auto-add owner as OWNER member
  await prisma.teamMember.create({ data: { teamId: team.id, userId, role: 'OWNER' } });
  return team;
};

const inviteToTeam = async (teamId, ownerId, { email, role }) => {
  const team = await prisma.team.findFirst({ where: { id: teamId, ownerId } });
  if (!team) throw Object.assign(new Error('Team not found or insufficient permissions'), { status: 403 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId: user.id } },
    update: { role },
    create: { teamId, userId: user.id, role },
  });
};

const removeMember = async (teamId, ownerId, memberId) => {
  const team = await prisma.team.findFirst({ where: { id: teamId, ownerId } });
  if (!team) throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  return prisma.teamMember.deleteMany({ where: { teamId, userId: memberId } });
};

module.exports = {
  getNotifications, createNotification, markAsRead, markAllAsRead, deleteNotification,
  getTasks, createTask, updateTask, deleteTask, addComment,
  getTeams, createTeam, inviteToTeam, removeMember,
};
