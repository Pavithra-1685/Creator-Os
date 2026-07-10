const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ──── REVENUE ────

const getRevenues = async (userId, { page = 1, limit = 20, source, from, to }) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(source && { source }),
    ...(from || to ? {
      date: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.revenue.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.revenue.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const createRevenue = async (userId, data) => {
  return prisma.revenue.create({ data: { ...data, userId, date: new Date(data.date) } });
};

const updateRevenue = async (id, userId, data) => {
  return prisma.revenue.updateMany({ where: { id, userId }, data });
};

const deleteRevenue = async (id, userId) => {
  return prisma.revenue.deleteMany({ where: { id, userId } });
};

// ──── EXPENSES ────

const getExpenses = async (userId, { page = 1, limit = 20, category, from, to }) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(category && { category }),
    ...(from || to ? {
      date: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.expense.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.expense.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const createExpense = async (userId, data) => {
  return prisma.expense.create({ data: { ...data, userId, date: new Date(data.date) } });
};

const updateExpense = async (id, userId, data) => {
  return prisma.expense.updateMany({ where: { id, userId }, data });
};

const deleteExpense = async (id, userId) => {
  return prisma.expense.deleteMany({ where: { id, userId } });
};

// ──── SUMMARY REPORTS ────

const getFinancialSummary = async (userId, { from, to } = {}) => {
  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to) }),
  };
  const dateWhere = Object.keys(dateFilter).length ? { date: dateFilter } : {};

  const [totalRevenue, totalExpenses, revenueBySource, expenseByCategory, monthlyData] = await Promise.all([
    prisma.revenue.aggregate({ where: { userId, ...dateWhere }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId, ...dateWhere }, _sum: { amount: true } }),
    prisma.revenue.groupBy({ by: ['source'], where: { userId, ...dateWhere }, _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ['category'], where: { userId, ...dateWhere }, _sum: { amount: true } }),
    getMonthlyBreakdown(userId, from, to),
  ]);

  const revenue = totalRevenue._sum.amount || 0;
  const expenses = totalExpenses._sum.amount || 0;
  return {
    totalRevenue: revenue,
    totalExpenses: expenses,
    netProfit: revenue - expenses,
    profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
    revenueBySource: revenueBySource.map(r => ({ source: r.source, amount: r._sum.amount })),
    expenseByCategory: expenseByCategory.map(e => ({ category: e.category, amount: e._sum.amount })),
    monthlyData,
  };
};

const getMonthlyBreakdown = async (userId, from, to) => {
  // Get last 12 months of data
  const months = [];
  const now = new Date(to || Date.now());
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const [rev, exp] = await Promise.all([
      prisma.revenue.aggregate({ where: { userId, date: { gte: start, lte: end } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId, date: { gte: start, lte: end } }, _sum: { amount: true } }),
    ]);
    months.push({
      month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: rev._sum.amount || 0,
      expenses: exp._sum.amount || 0,
      profit: (rev._sum.amount || 0) - (exp._sum.amount || 0),
    });
  }
  return months;
};

module.exports = {
  getRevenues, createRevenue, updateRevenue, deleteRevenue,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getFinancialSummary,
};
