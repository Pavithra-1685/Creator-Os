const router = require('express').Router();
const c = require('../controllers/goalController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/summary', c.getSummary);
router.get('/', c.getGoals);
router.post('/', c.createGoal);
router.get('/:id', c.getGoal);
router.patch('/:id', c.updateGoal);
router.post('/:id/increment', c.incrementGoal);
router.delete('/:id', c.deleteGoal);

module.exports = router;
