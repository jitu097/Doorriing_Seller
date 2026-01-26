const categoryService = require('./category.service');
const { successResponse } = require('../../utils/response');
const { validateRequired } = require('../../utils/validators');

const createCategory = async (req, res, next) => {
    try {
        validateRequired(['name'], req.body);
        
        const category = await categoryService.createCategory(req.shop.id, req.body);
        successResponse(res, category, 'Category created successfully', 201);
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.getCategories(req.shop.id);
        successResponse(res, categories);
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await categoryService.updateCategory(id, req.shop.id, req.body);
        successResponse(res, category, 'Category updated successfully');
    } catch (error) {
        next(error);
    }
};

const toggleVisibility = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_hidden } = req.body;
        const category = await categoryService.toggleCategoryVisibility(id, req.shop.id, is_hidden);
        successResponse(res, category, 'Category visibility updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    toggleVisibility
};
