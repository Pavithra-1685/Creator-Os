const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, contentController.listContent);
router.post('/', requireAuth, contentController.createContent);
router.put('/:id', requireAuth, contentController.updateContent);

module.exports = router;