const subcategoryService = require('./subcategory.service');
const { successResponse } = require('../../utils/response');

/**
 * Get all subcategories, optionally filtered by category_id
 * Query params: ?category_id=uuid
 */
const getSubcategories = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { category_id } = req.query;

        const subcategories = await subcategoryService.getSubcategories(shopId, category_id);
        successResponse(res, subcategories);
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single subcategory by ID
 */
const getSubcategoryById = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;

        const subcategory = await subcategoryService.getSubcategoryById(shopId, id);
        successResponse(res, subcategory);
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new subcategory
 */
const createSubcategory = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const subcategory = await subcategoryService.createSubcategory(shopId, req.body, req.file);

        successResponse(res, subcategory, 'Subcategory created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Update a subcategory
 */
const updateSubcategory = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;

        const subcategory = await subcategoryService.updateSubcategory(shopId, id, req.body);
        successResponse(res, subcategory, 'Subcategory updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle subcategory visibility
 */
const toggleVisibility = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;

        const subcategory = await subcategoryService.toggleSubcategoryVisibility(shopId, id);
        successResponse(res, subcategory, 'Subcategory visibility updated');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a subcategory
 */
const deleteSubcategory = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;

        const result = await subcategoryService.deleteSubcategory(shopId, id);
        successResponse(res, result, 'Subcategory deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    toggleVisibility,
    deleteSubcategory
};
