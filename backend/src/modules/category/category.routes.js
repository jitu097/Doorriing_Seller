const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.patch('/:id', categoryController.updateCategory);
router.patch('/:id/toggle', categoryController.toggleVisibility);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
