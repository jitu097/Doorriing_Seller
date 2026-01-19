const shopService = require('./shop.service');
const { successResponse } = require('../../utils/response');
const { SHOP_STATUS } = require('../../utils/constants');
const { BadRequestError } = require('../../utils/errors');

const getMyShop = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        successResponse(res, shop);
    } catch (error) {
        next(error);
    }
};

const createShop = async (req, res, next) => {
    try {
        // business_type_id validation happens in service
        const shop = await shopService.createShop(req.user.id, req.body);
        successResponse(res, shop, 'Shop created successfully', 201);
    } catch (error) {
        next(error);
    }
};

// General update handler
const updateShop = async (req, res, next) => {
    try {
        const updates = req.body;

        // Validate status if present
        if (updates.status && !Object.values(SHOP_STATUS).includes(updates.status)) {
            throw new BadRequestError('Invalid status');
        }

        const shop = await shopService.updateShop(req.user.id, updates);
        successResponse(res, shop, 'Shop updated successfully');
    } catch (error) {
        next(error);
    }
};

// Deprecated but kept for backward compatibility if routes use it specificly
const updateShopStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!Object.values(SHOP_STATUS).includes(status)) {
            throw new BadRequestError('Invalid status');
        }
        const shop = await shopService.updateShopStatus(req.user.id, status);
        successResponse(res, shop, 'Shop status updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyShop,
    createShop,
    updateShop,
    updateShopStatus
};
