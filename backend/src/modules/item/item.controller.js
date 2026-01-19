const itemService = require('./item.service');
const shopService = require('../shop/shop.service');
const { successResponse } = require('../../utils/response');
const { BadRequestError } = require('../../utils/errors');

const getItems = async (req, res, next) => {
    try {
        const { categoryId } = req.query;
        if (!categoryId) throw new BadRequestError('Category ID is required');

        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found');

        const items = await itemService.getItems(shop.id, categoryId);
        successResponse(res, items);
    } catch (error) {
        next(error);
    }
};

const createItem = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found');

        const { price } = req.body;
        if (price < 0) throw new BadRequestError('Price must be non-negative');

        const item = await itemService.createItem(shop.id, req.body);
        successResponse(res, item, 'Item created', 201);
    } catch (error) {
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found');

        const { id } = req.params;
        if (req.body.price !== undefined && req.body.price < 0) {
            throw new BadRequestError('Price must be non-negative');
        }

        const item = await itemService.updateItem(id, shop.id, req.body);
        successResponse(res, item, 'Item updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getItems,
    createItem,
    updateItem
};
