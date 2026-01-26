const discountService = require('./discount.service');
const { successResponse } = require('../../utils/response');
const { validateRequired, validatePositiveNumber } = require('../../utils/validators');

const createDiscount = async (req, res, next) => {
    try {
        validateRequired(['code', 'name', 'discount_type', 'discount_value'], req.body);
        
        const validatedValue = validatePositiveNumber(req.body.discount_value, 'Discount value');
        req.body.discount_value = validatedValue;
        
        const discount = await discountService.createDiscount(req.shop.id, req.body);
        successResponse(res, discount, 'Discount created successfully', 201);
    } catch (error) {
        next(error);
    }
};

const getDiscounts = async (req, res, next) => {
    try {
        const discounts = await discountService.getDiscounts(req.shop.id);
        successResponse(res, discounts);
    } catch (error) {
        next(error);
    }
};

const updateDiscount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const discount = await discountService.updateDiscount(id, req.shop.id, req.body);
        successResponse(res, discount, 'Discount updated successfully');
    } catch (error) {
        next(error);
    }
};

const toggleDiscount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        
        const discount = await discountService.toggleDiscount(id, req.shop.id, is_active);
        successResponse(res, discount, 'Discount status updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createDiscount,
    getDiscounts,
    updateDiscount,
    toggleDiscount
};
