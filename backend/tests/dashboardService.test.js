const test = require('node:test');
const assert = require('node:assert/strict');
const dashboardService = require('../src/services/dashboardService');
const prisma = require('../src/prisma/client');

test('dashboard service fetches dashboard summary', async () => {
  const restoreTask = prisma.task.findMany;
  const restoreContent = prisma.contentItem.findMany;
  const restoreGoals = prisma.goal.findMany;
  const restoreNotifications = prisma.notification.findMany;

  prisma.task.findMany = async (query) => {
    assert.equal(query.where.userId, 'user-123');
    return [{ id: 'task-1' }];
  };
  prisma.contentItem.findMany = async (query) => {
    assert.equal(query.where.userId, 'user-123');
    return [{ id: 'content-1' }];
  };
  prisma.goal.findMany = async (query) => {
    assert.equal(query.where.userId, 'user-123');
    return [{ id: 'goal-1' }];
  };
  prisma.notification.findMany = async (query) => {
    assert.equal(query.where.userId, 'user-123');
    return [{ id: 'notification-1' }];
  };

  const summary = await dashboardService.getDashboardSummary('user-123');
  assert.deepEqual(summary, {
    tasks: [{ id: 'task-1' }],
    contentItems: [{ id: 'content-1' }],
    goals: [{ id: 'goal-1' }],
    notifications: [{ id: 'notification-1' }],
  });

  prisma.task.findMany = restoreTask;
  prisma.contentItem.findMany = restoreContent;
  prisma.goal.findMany = restoreGoals;
  prisma.notification.findMany = restoreNotifications;
});
