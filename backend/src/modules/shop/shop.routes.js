const express = require('express');
const router = express.Router();
const shopController = require('./shop.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSellerContext, requireShop } = require('../../middlewares/seller.middleware');
const upload = require('../../middlewares/upload.middleware');

router.use(verifyToken, loadSellerContext);

router.post('/', upload.single('image'), shopController.createShop);
router.get('/', shopController.getShop);
router.patch('/', requireShop, upload.single('image'), shopController.updateShop);
router.patch('/status', requireShop, shopController.toggleStatus);
router.put('/:id/status', requireShop, shopController.updateStatusById);
router.post('/image', requireShop, upload.single('image'), shopController.uploadShopImage);
router.post('/cover', requireShop, upload.single('cover'), shopController.uploadCoverImage);

module.exports = router;
