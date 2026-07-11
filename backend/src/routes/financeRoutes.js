const router = require('express').Router();
const c = require('../controllers/financeController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Financial summary
router.get('/summary', c.getSummary);

// Revenue
router.get('/revenue', c.getRevenues);
router.post('/revenue', c.createRevenue);
router.patch('/revenue/:id', c.updateRevenue);
router.delete('/revenue/:id', c.deleteRevenue);

// Expenses
router.get('/expenses', c.getExpenses);
router.post('/expenses', c.createExpense);
router.patch('/expenses/:id', c.updateExpense);
router.delete('/expenses/:id', c.deleteExpense);

module.exports = router;
