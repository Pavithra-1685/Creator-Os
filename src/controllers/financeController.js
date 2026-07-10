const financeService = require('../services/financeService');

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) { next(err); }
};

// REVENUE
const getRevenues = wrap(async (req, res) => {
  const data = await financeService.getRevenues(req.user.id, req.query);
  res.json({ success: true, message: 'Revenues fetched', data });
});

const createRevenue = wrap(async (req, res) => {
  const revenue = await financeService.createRevenue(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Revenue created', data: { revenue } });
});

const updateRevenue = wrap(async (req, res) => {
  await financeService.updateRevenue(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Revenue updated', data: {} });
});

const deleteRevenue = wrap(async (req, res) => {
  await financeService.deleteRevenue(req.params.id, req.user.id);
  res.json({ success: true, message: 'Revenue deleted', data: {} });
});

// EXPENSES
const getExpenses = wrap(async (req, res) => {
  const data = await financeService.getExpenses(req.user.id, req.query);
  res.json({ success: true, message: 'Expenses fetched', data });
});

const createExpense = wrap(async (req, res) => {
  const expense = await financeService.createExpense(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Expense created', data: { expense } });
});

const updateExpense = wrap(async (req, res) => {
  await financeService.updateExpense(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Expense updated', data: {} });
});

const deleteExpense = wrap(async (req, res) => {
  await financeService.deleteExpense(req.params.id, req.user.id);
  res.json({ success: true, message: 'Expense deleted', data: {} });
});

// SUMMARY
const getSummary = wrap(async (req, res) => {
  const summary = await financeService.getFinancialSummary(req.user.id, req.query);
  res.json({ success: true, message: 'Summary fetched', data: { summary } });
});

module.exports = {
  getRevenues, createRevenue, updateRevenue, deleteRevenue,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getSummary,
};
