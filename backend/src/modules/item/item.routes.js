const express = require('express');
const router = express.Router();
const itemController = require('./item.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop, requireRestaurant } = require('../../middlewares/seller.middleware');
const upload = require('../../middlewares/upload.middleware');

router.use(verifyToken, loadSeller, loadShop, requireRestaurant);

router.post('/', itemController.createItem);
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItem);
router.patch('/:id', itemController.updateItem);
router.patch('/:id/stock', itemController.updateStock);
router.patch('/:id/toggle', itemController.toggleAvailability);
router.delete('/:id', itemController.deleteItem);
router.post('/:id/image', upload.single('image'), itemController.uploadImage);

module.exports = router;
