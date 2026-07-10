const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAnalytics = async (userId, { platform, from, to, contentId }) => {
  const where = {
    userId,
    ...(platform && { platform }),
    ...(contentId && { contentId }),
    ...(from || to ? {
      date: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    } : {}),
  };
  return prisma.analytics.findMany({
    where, orderBy: { date: 'desc' }, include: { content: { select: { id: true, title: true, type: true } } },
  });
};

const logAnalytics = async (userId, data) => {
  return prisma.analytics.create({ data: { ...data, userId, date: new Date(data.date) } });
};

const updateAnalytics = async (id, userId, data) => {
  return prisma.analytics.updateMany({ where: { id, userId }, data });
};

const getOverviewStats = async (userId) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [current, previous, byPlatform, topContent] = await Promise.all([
    prisma.analytics.aggregate({
      where: { userId, date: { gte: thirtyDaysAgo } },
      _sum: { views: true, likes: true, comments: true, shares: true, impressions: true, subscribers: true },
    }),
    prisma.analytics.aggregate({
      where: { userId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { views: true, likes: true, comments: true },
    }),
    prisma.analytics.groupBy({
      by: ['platform'],
      where: { userId, date: { gte: thirtyDaysAgo } },
      _sum: { views: true, likes: true, subscribers: true },
    }),
    prisma.analytics.findMany({
      where: { userId, contentId: { not: null }, date: { gte: thirtyDaysAgo } },
      include: { content: { select: { title: true, type: true } } },
      orderBy: { views: 'desc' },
      take: 5,
    }),
  ]);

  return { current: current._sum, previous: previous._sum, byPlatform, topContent };
};

const getGrowthData = async (userId, { platform, months = 6 }) => {
  const data = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const agg = await prisma.analytics.aggregate({
      where: { userId, ...(platform && { platform }), date: { gte: start, lte: end } },
      _sum: { views: true, subscribers: true, followers: true, likes: true },
      _avg: { engagementRate: true },
    });
    data.push({
      month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      views: agg._sum.views || 0,
      subscribers: agg._sum.subscribers || 0,
      followers: agg._sum.followers || 0,
      likes: agg._sum.likes || 0,
      engagementRate: agg._avg.engagementRate || 0,
    });
  }
  return data;
};

module.exports = { getAnalytics, logAnalytics, updateAnalytics, getOverviewStats, getGrowthData };
