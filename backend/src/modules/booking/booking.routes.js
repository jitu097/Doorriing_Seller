const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop, requireRestaurant } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop, requireRestaurant);

router.get('/', bookingController.getBookings);
router.get('/today', bookingController.getTodayBookings);
router.patch('/:id/status', bookingController.updateStatus);

module.exports = router;
