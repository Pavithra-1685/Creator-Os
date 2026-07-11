const goalService = require('../services/goalService');

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) { next(err); }
};

const getGoals = wrap(async (req, res) => {
  const goals = await goalService.getGoals(req.user.id, req.query);
  res.json({ success: true, message: 'Goals fetched', data: { goals } });
});

const getGoal = wrap(async (req, res) => {
  const goal = await goalService.getGoalById(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ success: false, message: 'Goal not found', data: {} });
  res.json({ success: true, message: 'Goal fetched', data: { goal } });
});

const createGoal = wrap(async (req, res) => {
  const goal = await goalService.createGoal(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Goal created', data: { goal } });
});

const updateGoal = wrap(async (req, res) => {
  await goalService.updateGoal(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Goal updated', data: {} });
});

const incrementGoal = wrap(async (req, res) => {
  const goal = await goalService.incrementGoal(req.params.id, req.user.id, Number(req.body.increment || 1));
  res.json({ success: true, message: 'Goal progress updated', data: { goal } });
});

const deleteGoal = wrap(async (req, res) => {
  await goalService.deleteGoal(req.params.id, req.user.id);
  res.json({ success: true, message: 'Goal deleted', data: {} });
});

const getSummary = wrap(async (req, res) => {
  const summary = await goalService.getGoalSummary(req.user.id);
  res.json({ success: true, message: 'Goal summary fetched', data: { summary } });
});

module.exports = { getGoals, getGoal, createGoal, updateGoal, incrementGoal, deleteGoal, getSummary };
