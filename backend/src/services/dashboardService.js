const prisma = require('../prisma/client');
const { getTargetUserId } = require('../utils/workspace');

const getDashboardSummary = async (userId) => {
  const targetUserId = await getTargetUserId(userId);
  const [tasks, contentItems, goals, notifications] = await Promise.all([
    prisma.task.findMany({ where: { userId: targetUserId }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.contentItem.findMany({ where: { userId: targetUserId }, orderBy: { scheduledFor: 'asc' }, take: 5 }),
    prisma.goal.findMany({ where: { userId: targetUserId }, take: 5 }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  return { tasks, contentItems, goals, notifications };
};

module.exports = { getDashboardSummary };