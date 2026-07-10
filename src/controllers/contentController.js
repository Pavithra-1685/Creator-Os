const contentService = require('../services/contentService');
const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

const listContent = wrap(async (req, res) => {
  const items = await contentService.listContent(req.user.id);
  res.json({ success: true, message: 'Content items fetched', data: { items } });
});

const createContent = wrap(async (req, res) => {
  const item = await contentService.createContent(req.user.id, req.body);
  res.json({ success: true, message: 'Content item created', data: { item } });
});

const updateContent = wrap(async (req, res) => {
  const item = await contentService.updateContent(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Content item updated', data: { item } });
});

module.exports = { listContent, createContent, updateContent };