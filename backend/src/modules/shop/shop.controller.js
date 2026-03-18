const shopService = require('./shop.service');
const { successResponse } = require('../../utils/response');
const { validateRequired } = require('../../utils/validators');
const { BadRequestError } = require('../../utils/errors');

const ensureStatusPayloadProvided = (status, isOpen) => {
    if (typeof isOpen !== 'boolean' && typeof status !== 'string') {
        throw new BadRequestError('Either status or is_open is required');
    }
};

const ensureImageFileProvided = (file, fieldName = 'image') => {
    if (!file) {
        throw new BadRequestError(`No ${fieldName} file provided`);
    }
};

const createShop = async (req, res, next) => {
    try {
        validateRequired(['shop_name', 'owner_name', 'phone', 'category', 'subcategory', 'address'], req.body);

        // Require explicit Terms & Conditions acceptance
        const termsAccepted = req.body.termsAccepted === 'true' || req.body.termsAccepted === true;
        if (!termsAccepted) {
            throw new BadRequestError('You must accept the Terms & Conditions to register your shop.');
        }

        const imageFile = req.file;
        const shop = await shopService.createShop(req.user.id, req.body, imageFile);
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
        const imageFile = req.file;
        const shop = await shopService.updateShop(req.seller.id, req.body, imageFile);
        successResponse(res, shop, 'Shop updated successfully');
    } catch (error) {
        next(error);
    }
};

const toggleStatus = async (req, res, next) => {
    try {
        const { status, is_open } = req.body;
        ensureStatusPayloadProvided(status, is_open);

        const shop = await shopService.updateShopStatusById(
            req.seller.id,
            req.shop.id,
            status,
            is_open
        );
        successResponse(res, shop, 'Shop status updated');
    } catch (error) {
        next(error);
    }
};

const updateStatusById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, is_open } = req.body;

        ensureStatusPayloadProvided(status, is_open);

        const shop = await shopService.updateShopStatusById(req.seller.id, id, status, is_open);
        successResponse(res, shop, 'Shop status updated');
    } catch (error) {
        next(error);
    }
};

const uploadShopImage = async (req, res, next) => {
    try {
        ensureImageFileProvided(req.file);

        const shop = await shopService.uploadShopImage(req.seller.id, req.file);
        successResponse(res, shop, 'Shop image uploaded successfully');
    } catch (error) {
        next(error);
    }
};

const uploadCoverImage = async (req, res, next) => {
    try {
        ensureImageFileProvided(req.file, 'cover');

        const shop = await shopService.uploadCoverImage(req.seller.id, req.file);
        successResponse(res, shop, 'Shop image uploaded successfully');
    } catch (error) {
        next(error);
    }
};

const toggleBookingStatus = async (req, res, next) => {
    try {
        const { is_booking_enabled } = req.body;
        if (typeof is_booking_enabled !== 'boolean') {
            throw new BadRequestError('is_booking_enabled must be a boolean');
        }

        const shop = await shopService.updateBookingStatusById(
            req.seller.id,
            req.shop.id,
            is_booking_enabled
        );
        successResponse(res, shop, 'Booking availability status updated');
    } catch (error) {
        next(error);
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        const result = await shopService.deleteSellerAccount(req.user.id);
        successResponse(res, result, 'Account and all data deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShop,
    getShop,
    updateShop,
    toggleStatus,
    updateStatusById,
    uploadShopImage,
    uploadCoverImage,
    toggleBookingStatus,
    deleteAccount
};
