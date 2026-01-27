const itemService = require('./item.service');
const { successResponse } = require('../../utils/response');
const { validateRequired, validatePositiveNumber } = require('../../utils/validators');

const createItem = async (req, res, next) => {
    try {
        validateRequired(['name', 'price'], req.body);

        const item = await itemService.createItem(req.shop.id, req.body);
        successResponse(res, item, 'Item created successfully', 201);
    } catch (error) {
        next(error);
    }
};

const getItems = async (req, res, next) => {
    try {
        const { category_id } = req.query;
        const items = await itemService.getItems(req.shop.id, category_id);
        successResponse(res, items);
    } catch (error) {
        next(error);
    }
};

const getItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await itemService.getItem(id, req.shop.id);
        successResponse(res, item);
    } catch (error) {
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await itemService.updateItem(id, req.shop.id, req.body);
        successResponse(res, item, 'Item updated successfully');
    } catch (error) {
        next(error);
    }
};

const updateStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stock_quantity, change_type, notes } = req.body;

        validateRequired(['stock_quantity'], req.body);
        const validatedStock = validatePositiveNumber(new_stock_quantity, 'Stock quantity');

        const item = await itemService.updateStock(id, req.shop.id, validatedStock, reason);
        successResponse(res, item, 'Stock updated successfully');
    } catch (error) {
        next(error);
    }
};

const toggleAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_available } = req.body;

        const item = await itemService.toggleAvailability(id, req.shop.id, is_available);
        successResponse(res, item, 'Item availability updated');
    } catch (error) {
        next(error);
    }
};

const uploadImage = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            throw new Error('No image file provided');
        }

        const item = await itemService.uploadItemImage(id, req.shop.id, req.file);
        successResponse(res, item, 'Item image uploaded successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createItem,
    getItems,
    getItem,
    updateItem,
    updateStock,
    toggleAvailability,
    uploadImage
};
