const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop, requireRestaurant } = require('../../middlewares/seller.middleware');

// Public route for customers to create bookings
router.post('/create', bookingController.createBooking);

// Debug endpoint - check all bookings in database
router.get('/debug/all', async (req, res) => {
    try {
        const supabase = require('../../config/supabaseClient');
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Debug: Latest 10 bookings from database',
            data: data,
            count: data?.length || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint - show current logged-in shop
router.get('/debug/my-shop', async (req, res) => {
    try {
        const { verifyToken } = require('../../middlewares/auth.middleware');
        const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');
        
        // Apply middlewares manually for this debug route
        await new Promise((resolve, reject) => {
            verifyToken(req, res, (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            loadSeller(req, res, (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            loadShop(req, res, (err) => err ? reject(err) : resolve());
        });
        
        res.json({
            success: true,
            message: 'Your current logged-in shop details',
            shop: req.shop,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint - compare shop IDs
router.get('/debug/compare', async (req, res) => {
    try {
        const { verifyToken } = require('../../middlewares/auth.middleware');
        const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');
        const supabase = require('../../config/supabaseClient');
        
        // Apply middlewares
        await new Promise((resolve, reject) => {
            verifyToken(req, res, (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            loadSeller(req, res, (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
            loadShop(req, res, (err) => err ? reject(err) : resolve());
        });
        
        // Get bookings shop_ids
        const { data: bookings } = await supabase
            .from('bookings')
            .select('shop_id')
            .limit(10);
        
        const uniqueShopIds = [...new Set(bookings.map(b => b.shop_id))];
        const yourShopId = req.shop.id;
        const match = uniqueShopIds.includes(yourShopId);
        
        res.json({
            success: true,
            your_shop_id: yourShopId,
            your_shop_name: req.shop.name,
            booking_shop_ids: uniqueShopIds,
            match: match,
            message: match 
                ? '✅ Shop IDs match! Bookings should be visible.' 
                : '❌ Shop ID mismatch! Run FIX_BOOKINGS_SHOPID.sql to fix.',
            sql_fix: `UPDATE bookings SET shop_id = '${yourShopId}';`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Protected routes for restaurant owners
router.use(verifyToken, loadSeller, loadShop, requireRestaurant);

router.get('/', bookingController.getBookings);
router.get('/today', bookingController.getTodayBookings);
router.patch('/:id/status', bookingController.updateStatus);

module.exports = router;
