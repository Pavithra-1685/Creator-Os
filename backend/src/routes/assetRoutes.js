const router = require('express').Router();
const multer = require('multer');
const c = require('../controllers/assetController');
const { authenticate } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

router.use(authenticate);

// Folders
router.get('/folders', c.getFolders);
router.post('/folders', c.createFolder);
router.delete('/folders/:id', c.deleteFolder);

// Assets
router.get('/', c.getAssets);
router.post('/upload', upload.single('file'), c.uploadAsset);
router.get('/:id', c.getAsset);
router.patch('/:id', c.updateAsset);
router.delete('/:id', c.deleteAsset);

module.exports = router;
