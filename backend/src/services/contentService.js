const prisma = require('../prisma/client');
const { triggerRealtimeNotification } = require('../utils/realtime');

const listContent = async (userId) => {
  return prisma.contentItem.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
};

const createContent = async (userId, data) => {
  const item = await prisma.contentItem.create({
    data: {
      userId,
      title: data.title,
      type: data.type,
      status: data.status || 'IDEA',
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      notes: data.notes || null,
    },
  });

  await triggerRealtimeNotification(
    userId,
    'New Content Idea',
    `Added "${item.title}" to your ${item.type.replace('_', ' ')} list`,
    'PUBLISH_REMINDER'
  );

  return item;
};

const updateContent = async (id, userId, data) => {
  const existing = await prisma.contentItem.findFirst({ where: { id, userId } });
  if (!existing) throw { status: 404, message: 'Content item not found' };

  const updated = await prisma.contentItem.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      type: data.type ?? existing.type,
      status: data.status ?? existing.status,
      scheduledFor: data.scheduledFor !== undefined ? new Date(data.scheduledFor) : existing.scheduledFor,
      notes: data.notes ?? existing.notes,
    },
  });

  if (data.status && data.status !== existing.status) {
    await triggerRealtimeNotification(
      userId,
      'Content Stage Advanced',
      `"${updated.title}" moved to ${updated.status}`,
      'PUBLISH_REMINDER'
    );
  }

  return updated;
};

module.exports = { listContent, createContent, updateContent };