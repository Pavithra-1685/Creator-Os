const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ──── BRANDS ────

const getBrands = async (userId, { page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };
  const [items, total] = await Promise.all([
    prisma.brand.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { _count: { select: { campaigns: true } } } }),
    prisma.brand.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const getBrandById = async (id, userId) => {
  return prisma.brand.findFirst({
    where: { id, userId },
    include: { campaigns: { include: { deliverables: true, payments: true } } },
  });
};

const createBrand = async (userId, data) => {
  return prisma.brand.create({ data: { ...data, userId } });
};

const updateBrand = async (id, userId, data) => {
  return prisma.brand.updateMany({ where: { id, userId }, data });
};

const deleteBrand = async (id, userId) => {
  return prisma.brand.deleteMany({ where: { id, userId } });
};

// ──── CAMPAIGNS ────

const getCampaigns = async (userId, { page = 1, limit = 20, status, brandId }) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(status && { status }),
    ...(brandId && { brandId }),
  };
  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: { brand: true, deliverables: true, payments: true },
    }),
    prisma.campaign.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const getCampaignById = async (id, userId) => {
  return prisma.campaign.findFirst({
    where: { id, userId },
    include: { brand: true, deliverables: true, payments: true, contentItems: true },
  });
};

const createCampaign = async (userId, data) => {
  return prisma.campaign.create({
    data: { ...data, userId },
    include: { brand: true },
  });
};

const updateCampaign = async (id, userId, data) => {
  return prisma.campaign.updateMany({ where: { id, userId }, data });
};

const deleteCampaign = async (id, userId) => {
  return prisma.campaign.deleteMany({ where: { id, userId } });
};

// ──── DELIVERABLES ────

const createDeliverable = async (campaignId, userId, data) => {
  // Verify campaign ownership
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  return prisma.deliverable.create({ data: { ...data, campaignId } });
};

const updateDeliverable = async (id, userId, data) => {
  const deliverable = await prisma.deliverable.findFirst({
    where: { id },
    include: { campaign: true },
  });
  if (!deliverable || deliverable.campaign.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 });
  return prisma.deliverable.update({ where: { id }, data });
};

// ──── PAYMENTS ────

const createPayment = async (campaignId, userId, data) => {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  return prisma.payment.create({ data: { ...data, campaignId } });
};

const updatePayment = async (id, userId, data) => {
  const payment = await prisma.payment.findFirst({
    where: { id },
    include: { campaign: true },
  });
  if (!payment || payment.campaign.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 });
  return prisma.payment.update({ where: { id }, data });
};

// ──── BRAND DEAL STATS ────

const getBrandDealStats = async (userId) => {
  const [total, active, completed, totalRevenue] = await Promise.all([
    prisma.campaign.count({ where: { userId } }),
    prisma.campaign.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.campaign.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      where: { campaign: { userId }, status: 'PAID' },
      _sum: { amount: true },
    }),
  ]);
  return { total, active, completed, totalRevenue: totalRevenue._sum.amount || 0 };
};

module.exports = {
  getBrands, getBrandById, createBrand, updateBrand, deleteBrand,
  getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign,
  createDeliverable, updateDeliverable,
  createPayment, updatePayment,
  getBrandDealStats,
};
