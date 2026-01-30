const express = require('express');
const router = express.Router();
const shopController = require('./shop.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSellerContext, requireShop } = require('../../middlewares/seller.middleware');
const upload = require('../../middlewares/upload.middleware');

router.use(verifyToken, loadSellerContext);

router.post('/', shopController.createShop);
router.get('/', shopController.getShop);
router.patch('/', shopController.updateShop);
router.patch('/status', shopController.toggleStatus);
router.post('/image', requireShop, upload.single('image'), shopController.uploadShopImage);

module.exports = router;
