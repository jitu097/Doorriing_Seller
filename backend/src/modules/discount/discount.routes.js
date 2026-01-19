const express = require('express');
const router = express.Router();
const discountController = require('./discount.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireSeller } = require('../../middlewares/seller.middleware');

router.use(authenticate, requireSeller);

router.get('/', discountController.getDiscounts);
router.post('/', discountController.createDiscount);
router.patch('/:id', discountController.updateDiscount);

module.exports = router;
