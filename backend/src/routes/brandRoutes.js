const router = require('express').Router();
const c = require('../controllers/brandController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Stats
router.get('/stats', c.getStats);

// Brands
router.get('/brands', c.getBrands);
router.post('/brands', c.createBrand);
router.get('/brands/:id', c.getBrand);
router.patch('/brands/:id', c.updateBrand);
router.delete('/brands/:id', c.deleteBrand);

// Campaigns
router.get('/campaigns', c.getCampaigns);
router.post('/campaigns', c.createCampaign);
router.get('/campaigns/:id', c.getCampaign);
router.patch('/campaigns/:id', c.updateCampaign);
router.delete('/campaigns/:id', c.deleteCampaign);

// Deliverables (nested under campaign)
router.post('/campaigns/:campaignId/deliverables', c.createDeliverable);
router.patch('/deliverables/:id', c.updateDeliverable);

// Payments (nested under campaign)
router.post('/campaigns/:campaignId/payments', c.createPayment);
router.patch('/payments/:id', c.updatePayment);

module.exports = router;
