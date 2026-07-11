const prisma = require('../prisma/client');

const getDashboardSummary = async (userId) => {
  const [tasks, contentItems, goals, notifications] = await Promise.all([
    prisma.task.findMany({ where: { userId }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.contentItem.findMany({ where: { userId }, orderBy: { scheduledFor: 'asc' }, take: 5 }),
    prisma.goal.findMany({ where: { userId }, take: 5 }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  return { tasks, contentItems, goals, notifications };
};

module.exports = { getDashboardSummary };