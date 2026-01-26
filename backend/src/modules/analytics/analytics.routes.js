const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.get('/daily', analyticsController.getDailyAnalytics);
router.get('/summary', analyticsController.getSummary);

module.exports = router;
