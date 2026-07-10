const dashboardService = require('../services/dashboardService');
const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

const getDashboard = wrap(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user.id);
  res.json({ success: true, message: 'Dashboard fetched', data: summary });
});

module.exports = { getDashboard };