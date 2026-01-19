const categoryService = require('./category.service');
const shopService = require('../shop/shop.service');
const { successResponse } = require('../../utils/response');
const { BadRequestError } = require('../../utils/errors');

const getCategories = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found for this seller');

        const categories = await categoryService.getCategories(shop.id);
        successResponse(res, categories);
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found for this seller');

        const category = await categoryService.createCategory(shop.id, req.body);
        successResponse(res, category, 'Category created', 201);
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found for this seller');

        const { id } = req.params;
        const category = await categoryService.updateCategory(id, shop.id, req.body);
        successResponse(res, category, 'Category updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory
};
