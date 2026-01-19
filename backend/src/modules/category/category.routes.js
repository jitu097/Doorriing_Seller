const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireSeller } = require('../../middlewares/seller.middleware');

router.use(authenticate, requireSeller);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.patch('/:id', categoryController.updateCategory);

module.exports = router;
