const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.get('/', orderController.getOrders);
router.get('/stats', orderController.getStats);
router.get('/:id', orderController.getOrderDetails);
router.patch('/:id/accept', orderController.acceptOrder);
router.patch('/:id/reject', orderController.rejectOrder);
router.patch('/:id/update-status', orderController.updateStatus);

module.exports = router;
