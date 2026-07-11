const analyticsService = require('../services/analyticsService');

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) { next(err); }
};

const getAnalytics = wrap(async (req, res) => {
  const data = await analyticsService.getAnalytics(req.user.id, req.query);
  res.json({ success: true, message: 'Analytics fetched', data: { analytics: data } });
});

const logAnalytics = wrap(async (req, res) => {
  const entry = await analyticsService.logAnalytics(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Analytics logged', data: { entry } });
});

const updateAnalytics = wrap(async (req, res) => {
  await analyticsService.updateAnalytics(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Analytics updated', data: {} });
});

const getOverview = wrap(async (req, res) => {
  const stats = await analyticsService.getOverviewStats(req.user.id);
  res.json({ success: true, message: 'Overview fetched', data: { stats } });
});

const getGrowth = wrap(async (req, res) => {
  const data = await analyticsService.getGrowthData(req.user.id, req.query);
  res.json({ success: true, message: 'Growth data fetched', data: { growth: data } });
});

module.exports = { getAnalytics, logAnalytics, updateAnalytics, getOverview, getGrowth };
