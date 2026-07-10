const brandService = require('../services/brandService');

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) { next(err); }
};

// BRANDS
const getBrands = wrap(async (req, res) => {
  const result = await brandService.getBrands(req.user.id, req.query);
  res.json({ success: true, message: 'Brands fetched', data: result });
});

const getBrand = wrap(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.id, req.user.id);
  if (!brand) return res.status(404).json({ success: false, message: 'Brand not found', data: {} });
  res.json({ success: true, message: 'Brand fetched', data: { brand } });
});

const createBrand = wrap(async (req, res) => {
  const brand = await brandService.createBrand(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Brand created', data: { brand } });
});

const updateBrand = wrap(async (req, res) => {
  await brandService.updateBrand(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Brand updated', data: {} });
});

const deleteBrand = wrap(async (req, res) => {
  await brandService.deleteBrand(req.params.id, req.user.id);
  res.json({ success: true, message: 'Brand deleted', data: {} });
});

// CAMPAIGNS
const getCampaigns = wrap(async (req, res) => {
  const result = await brandService.getCampaigns(req.user.id, req.query);
  res.json({ success: true, message: 'Campaigns fetched', data: result });
});

const getCampaign = wrap(async (req, res) => {
  const campaign = await brandService.getCampaignById(req.params.id, req.user.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found', data: {} });
  res.json({ success: true, message: 'Campaign fetched', data: { campaign } });
});

const createCampaign = wrap(async (req, res) => {
  const campaign = await brandService.createCampaign(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Campaign created', data: { campaign } });
});

const updateCampaign = wrap(async (req, res) => {
  await brandService.updateCampaign(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Campaign updated', data: {} });
});

const deleteCampaign = wrap(async (req, res) => {
  await brandService.deleteCampaign(req.params.id, req.user.id);
  res.json({ success: true, message: 'Campaign deleted', data: {} });
});

// DELIVERABLES
const createDeliverable = wrap(async (req, res) => {
  const d = await brandService.createDeliverable(req.params.campaignId, req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Deliverable created', data: { deliverable: d } });
});

const updateDeliverable = wrap(async (req, res) => {
  const d = await brandService.updateDeliverable(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Deliverable updated', data: { deliverable: d } });
});

// PAYMENTS
const createPayment = wrap(async (req, res) => {
  const p = await brandService.createPayment(req.params.campaignId, req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Payment created', data: { payment: p } });
});

const updatePayment = wrap(async (req, res) => {
  const p = await brandService.updatePayment(req.params.id, req.user.id, req.body);
  res.json({ success: true, message: 'Payment updated', data: { payment: p } });
});

// STATS
const getStats = wrap(async (req, res) => {
  const stats = await brandService.getBrandDealStats(req.user.id);
  res.json({ success: true, message: 'Stats fetched', data: { stats } });
});

module.exports = {
  getBrands, getBrand, createBrand, updateBrand, deleteBrand,
  getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
  createDeliverable, updateDeliverable,
  createPayment, updatePayment,
  getStats,
};
