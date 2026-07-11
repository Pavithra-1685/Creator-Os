const assetService = require('../services/assetService');
const cloudinary = require('../utils/cloudinary');

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) { next(err); }
};

const getAssets = wrap(async (req, res) => {
  const data = await assetService.getAssets(req.user.id, {
    ...req.query,
    tags: req.query.tags ? req.query.tags.split(',') : undefined,
  });
  res.json({ success: true, message: 'Assets fetched', data });
});

const getAsset = wrap(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id, req.user.id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found', data: {} });
  res.json({ success: true, message: 'Asset fetched', data: { asset } });
});

const uploadAsset = wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided', data: {} });

  let url = null;
  let publicId = null;

  // Try Cloudinary first
  try {
    const uploaded = await cloudinary.uploadBuffer(req.file.buffer, {
      folder: `creatoros/${req.user.id}`,
      resource_type: 'auto',
    });
    url = uploaded.secure_url;
    publicId = uploaded.public_id;
  } catch (e) {
    // Cloudinary not configured or failed — save locally
  }

  // Fallback: save to local uploads directory
  if (!url) {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', req.user.id);
    fs.mkdirSync(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, req.file.buffer);
    url = `/uploads/${req.user.id}/${safeName}`;
  }

  const asset = await assetService.createAsset(req.user.id, {
    name: req.body.name || req.file.originalname,
    url,
    publicId,
    mimeType: req.file.mimetype,
    size: req.file.size,
    type: req.body.type || 'OTHER',
    tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
    folderId: req.body.folderId || null,
  });
  res.status(201).json({ success: true, message: 'Asset uploaded', data: { asset } });
});

const updateAsset = wrap(async (req, res) => {
  const data = { ...req.body, tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : undefined };
  await assetService.updateAsset(req.params.id, req.user.id, data);
  res.json({ success: true, message: 'Asset updated', data: {} });
});

const deleteAsset = wrap(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id, req.user.id);
  if (asset?.publicId) {
    try { await cloudinary.destroy(asset.publicId); } catch (e) { /* ignore */ }
  }
  await assetService.deleteAsset(req.params.id, req.user.id);
  res.json({ success: true, message: 'Asset deleted', data: {} });
});

// FOLDERS
const getFolders = wrap(async (req, res) => {
  const folders = await assetService.getFolders(req.user.id);
  res.json({ success: true, message: 'Folders fetched', data: { folders } });
});

const createFolder = wrap(async (req, res) => {
  const folder = await assetService.createFolder(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Folder created', data: { folder } });
});

const deleteFolder = wrap(async (req, res) => {
  await assetService.deleteFolder(req.params.id, req.user.id);
  res.json({ success: true, message: 'Folder deleted', data: {} });
});

module.exports = { getAssets, getAsset, uploadAsset, updateAsset, deleteAsset, getFolders, createFolder, deleteFolder };
