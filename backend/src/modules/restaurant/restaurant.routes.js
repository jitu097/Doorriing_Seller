const express = require('express');
const router = express.Router();
const categoryController = require('../category/category.controller');
const subcategoryController = require('../subcategory/subcategory.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop, requireRestaurant } = require('../../middlewares/seller.middleware');
const upload = require('../../middlewares/upload.middleware');

router.use(verifyToken, loadSeller, loadShop, requireRestaurant);

// Category routes
router.post('/categories', upload.single('image'), categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.patch('/categories/:id', categoryController.updateCategory);
router.patch('/categories/:id/toggle', categoryController.toggleVisibility);
router.delete('/categories/:id', categoryController.deleteCategory);

// Subcategory routes
router.get('/subcategories', subcategoryController.getSubcategories);
router.get('/subcategories/:id', subcategoryController.getSubcategoryById);
router.post('/subcategories', upload.single('image'), subcategoryController.createSubcategory);
router.patch('/subcategories/:id', subcategoryController.updateSubcategory);
router.patch('/subcategories/:id/toggle', subcategoryController.toggleVisibility);
router.delete('/subcategories/:id', subcategoryController.deleteSubcategory);

module.exports = router;
