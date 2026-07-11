const router = require('express').Router();
const c = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/overview', c.getOverview);
router.get('/growth', c.getGrowth);
router.get('/', c.getAnalytics);
router.post('/', c.logAnalytics);
router.patch('/:id', c.updateAnalytics);

module.exports = router;
