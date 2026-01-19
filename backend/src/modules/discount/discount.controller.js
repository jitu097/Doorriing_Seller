const discountService = require('./discount.service');
const shopService = require('../shop/shop.service');
const { successResponse } = require('../../utils/response');
const { BadRequestError } = require('../../utils/errors');

const getDiscounts = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found');

        const discounts = await discountService.getDiscounts(shop.id);
        successResponse(res, discounts);
    } catch (error) {
        next(error);
    }
};

const createDiscount = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found');

        const discount = await discountService.createDiscount(shop.id, req.body);
        successResponse(res, discount, 'Discount created', 201);
    } catch (error) {
        next(error);
    }
};

const updateDiscount = async (req, res, next) => {
    try {
        const shop = await shopService.getShopByOwnerId(req.user.id);
        if (!shop) throw new BadRequestError('Shop not found');

        const { id } = req.params;
        const discount = await discountService.updateDiscount(id, shop.id, req.body);
        successResponse(res, discount, 'Discount updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDiscounts,
    createDiscount,
    updateDiscount
};
