const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getGoals = async (userId, { type } = {}) => {
  return prisma.goal.findMany({
    where: { userId, ...(type && { type }) },
    orderBy: [{ isAchieved: 'asc' }, { deadline: 'asc' }],
  });
};

const getGoalById = async (id, userId) => {
  return prisma.goal.findFirst({ where: { id, userId } });
};

const createGoal = async (userId, data) => {
  const goal = await prisma.goal.create({ data: { ...data, userId, deadline: data.deadline ? new Date(data.deadline) : undefined } });
  const { triggerRealtimeNotification } = require('../utils/realtime');
  await triggerRealtimeNotification(
    userId,
    'Goal Defined',
    `Created goal: "${goal.title}" to reach ${goal.targetValue} ${goal.unit}`,
    'GOAL_ACHIEVED'
  );
  return goal;
};

const updateGoal = async (id, userId, data) => {
  const payload = {
    ...data,
    ...(data.deadline && { deadline: new Date(data.deadline) }),
  };
  if (data.currentValue !== undefined && data.targetValue !== undefined) {
    payload.isAchieved = data.currentValue >= data.targetValue;
  }
  return prisma.goal.updateMany({ where: { id, userId }, data: payload });
};

const incrementGoal = async (id, userId, increment) => {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw Object.assign(new Error('Goal not found'), { status: 404 });
  const newValue = goal.currentValue + increment;
  const isAchieved = newValue >= goal.targetValue;
  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: { currentValue: newValue, isAchieved },
  });

  const { triggerRealtimeNotification } = require('../utils/realtime');
  if (isAchieved && !goal.isAchieved) {
    await triggerRealtimeNotification(
      userId,
      'Goal Achieved! 🎯',
      `You successfully reached your goal: "${goal.title}" (${goal.targetValue} ${goal.unit})`,
      'GOAL_ACHIEVED'
    );
  } else {
    await triggerRealtimeNotification(
      userId,
      'Goal Progress',
      `"${goal.title}" progress updated: ${newValue}/${goal.targetValue} ${goal.unit}`,
      'GOAL_ACHIEVED'
    );
  }

  return updatedGoal;
};

const deleteGoal = async (id, userId) => {
  return prisma.goal.deleteMany({ where: { id, userId } });
};

const getGoalSummary = async (userId) => {
  const [total, achieved, inProgress] = await Promise.all([
    prisma.goal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, isAchieved: true } }),
    prisma.goal.count({ where: { userId, isAchieved: false } }),
  ]);
  return { total, achieved, inProgress, completionRate: total > 0 ? (achieved / total) * 100 : 0 };
};

module.exports = { getGoals, getGoalById, createGoal, updateGoal, incrementGoal, deleteGoal, getGoalSummary };
