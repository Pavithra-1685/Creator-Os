const router = require('express').Router();
const c = require('../controllers/aiController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/types', c.getTypes);
router.post('/generate', c.generate);
router.get('/history', c.getHistory);

module.exports = router;
