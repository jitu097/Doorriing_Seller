const express = require('express');
const router = express.Router();
const shopController = require('./shop.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireSeller } = require('../../middlewares/seller.middleware');

router.use(authenticate, requireSeller);

router.get('/', shopController.getMyShop);
router.post('/', shopController.createShop);
router.patch('/', shopController.updateShop);         // General update (includes business_type)
router.patch('/status', shopController.updateShopStatus); // Kept for backward compatibility

module.exports = router;
