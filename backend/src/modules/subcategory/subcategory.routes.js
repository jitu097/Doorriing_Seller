const express = require('express');
const router = express.Router();
const subcategoryController = require('./subcategory.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.get('/', subcategoryController.getSubcategories);
router.get('/:id', subcategoryController.getSubcategoryById);
router.post('/', subcategoryController.createSubcategory);
router.patch('/:id', subcategoryController.updateSubcategory);
router.patch('/:id/toggle', subcategoryController.toggleVisibility);
router.delete('/:id', subcategoryController.deleteSubcategory);

module.exports = router;
