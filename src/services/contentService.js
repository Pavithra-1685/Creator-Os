const prisma = require('../prisma/client');

const listContent = async (userId) => {
  return prisma.contentItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
};

const createContent = async (userId, data) => {
  return prisma.contentItem.create({
    data: {
      userId,
      title: data.title,
      type: data.type,
      status: data.status || 'IDEA',
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      notes: data.notes || null,
    },
  });
};

const updateContent = async (id, userId, data) => {
  const existing = await prisma.contentItem.findFirst({ where: { id, userId } });
  if (!existing) throw { status: 404, message: 'Content item not found' };

  return prisma.contentItem.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      type: data.type ?? existing.type,
      status: data.status ?? existing.status,
      scheduledFor: data.scheduledFor !== undefined ? new Date(data.scheduledFor) : existing.scheduledFor,
      notes: data.notes ?? existing.notes,
    },
  });
};

module.exports = { listContent, createContent, updateContent };