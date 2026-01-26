const express = require('express');
const router = express.Router();
const discountController = require('./discount.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.post('/', discountController.createDiscount);
router.get('/', discountController.getDiscounts);
router.patch('/:id', discountController.updateDiscount);
router.patch('/:id/toggle', discountController.toggleDiscount);

module.exports = router;
