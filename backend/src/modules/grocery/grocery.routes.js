const express = require('express');
const router = express.Router();
const groceryController = require('./grocery.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop, requireGrocery } = require('../../middlewares/seller.middleware');
const upload = require('../../middlewares/upload.middleware');

// Protect all routes
// 1. Verify User Token
// 2. Load Seller/User Context
// 3. Load Shop Context (Strictly required for adding items)
// 4. Enforce Grocery Business Type
router.use(verifyToken, loadSeller, loadShop, requireGrocery);

// --- Items Management ---
router.post('/items', groceryController.createItem);
router.get('/items', groceryController.getItems);
router.get('/items/:id', groceryController.getItemById);
router.put('/items/:id', groceryController.updateItem);
router.delete('/items/:id', groceryController.deleteItem);
router.post('/items/:id/image', upload.single('image'), groceryController.uploadImage);

// --- Inventory & status ---
router.put('/items/:id/stock', groceryController.updateStock);
router.put('/items/:id/availability', groceryController.toggleAvailability);

// --- Category Management (Optional for Grocery) ---
router.post('/categories', groceryController.createCategory);
router.get('/categories', groceryController.getCategories);
router.put('/categories/:id', groceryController.updateCategory);
router.delete('/categories/:id', groceryController.deleteCategory);

module.exports = router;
