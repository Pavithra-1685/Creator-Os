const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAssets = async (userId, { page = 1, limit = 20, type, folderId, search, tags }) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(type && { type }),
    ...(folderId !== undefined && { folderId: folderId || null }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
    ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
  };
  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: { folder: true, _count: { select: { versions: true } } },
    }),
    prisma.asset.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

const getAssetById = async (id, userId) => {
  return prisma.asset.findFirst({
    where: { id, userId },
    include: { versions: { orderBy: { version: 'desc' } }, folder: true },
  });
};

const createAsset = async (userId, data) => {
  return prisma.asset.create({ data: { ...data, userId } });
};

const updateAsset = async (id, userId, data) => {
  return prisma.asset.updateMany({ where: { id, userId }, data });
};

const deleteAsset = async (id, userId) => {
  return prisma.asset.deleteMany({ where: { id, userId } });
};

const addAssetVersion = async (assetId, userId, { url, version }) => {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
  if (!asset) throw Object.assign(new Error('Asset not found'), { status: 404 });
  return prisma.assetVersion.create({ data: { assetId, url, version } });
};

// Folders
const getFolders = async (userId) => {
  return prisma.assetFolder.findMany({ where: { userId }, orderBy: { name: 'asc' } });
};

const createFolder = async (userId, data) => {
  return prisma.assetFolder.create({ data: { ...data, userId } });
};

const deleteFolder = async (id, userId) => {
  return prisma.assetFolder.deleteMany({ where: { id, userId } });
};

module.exports = {
  getAssets, getAssetById, createAsset, updateAsset, deleteAsset, addAssetVersion,
  getFolders, createFolder, deleteFolder,
};
