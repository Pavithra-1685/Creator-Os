const aiService = require('../services/aiService');

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) { next(err); }
};

const generate = wrap(async (req, res) => {
  const { type, prompt, tone, platform, niche, extra } = req.body;
  if (!type) return res.status(400).json({ success: false, message: 'type is required', data: {} });

  const result = await aiService.generateContent(req.user.id, { type, prompt, tone, platform, niche, extra });
  res.json({ success: true, message: 'Content generated', data: result });
});

const getHistory = wrap(async (req, res) => {
  const data = await aiService.getAIHistory(req.user.id, req.query);
  res.json({ success: true, message: 'AI history fetched', data });
});

const getTypes = wrap(async (req, res) => {
  res.json({ success: true, message: 'AI types fetched', data: { types: aiService.AI_TYPES } });
});

module.exports = { generate, getHistory, getTypes };
