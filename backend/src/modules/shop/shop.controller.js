const shopService = require('./shop.service');
const { successResponse } = require('../../utils/response');
const { validateRequired } = require('../../utils/validators');

const createShop = async (req, res, next) => {
    try {
        validateRequired(['shop_name', 'owner_name', 'phone', 'category', 'subcategory', 'address'], req.body);
        
        const shop = await shopService.createShop(req.user.id, req.body);
        successResponse(res, shop, 'Shop created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/shop
 * Returns shop status - SINGLE SOURCE OF TRUTH for frontend
 */
const getShop = async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user,
                shop: req.shop,
                hasShop: !!req.shop
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateShop = async (req, res, next) => {
    try {
        const shop = await shopService.updateShop(req.seller.id, req.body);
        successResponse(res, shop, 'Shop updated successfully');
    } catch (error) {
        next(error);
    }
};

const toggleStatus = async (req, res, next) => {
    try {
        const { is_open } = req.body;
        const shop = await shopService.toggleShopStatus(req.seller.id, is_open);
        successResponse(res, shop, 'Shop status updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShop,
    getShop,
    updateShop,
    toggleStatus
};
