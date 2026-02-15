const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const shopRoutes = require('../modules/shop/shop.routes');
const categoryRoutes = require('../modules/category/category.routes');
const subcategoryRoutes = require('../modules/subcategory/subcategory.routes');
const itemRoutes = require('../modules/item/item.routes');
const orderRoutes = require('../modules/order/order.routes');
const discountRoutes = require('../modules/discount/discount.routes');
const reviewRoutes = require('../modules/review/review.routes');
const bookingRoutes = require('../modules/booking/booking.routes');
const notificationRoutes = require('../modules/notification/notification.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const groceryRoutes = require('../modules/grocery/grocery.routes');

router.use('/auth', authRoutes);
router.use('/shop', shopRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/items', itemRoutes);
router.use('/grocery', groceryRoutes); // Grocery specific namespace
router.use('/orders', orderRoutes);
router.use('/discounts', discountRoutes);
router.use('/reviews', reviewRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
