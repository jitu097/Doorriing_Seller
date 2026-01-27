const express = require('express');
const router = express.Router();
const itemController = require('./item.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');
const upload = require('../../middlewares/upload.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.post('/', itemController.createItem);
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItem);
router.patch('/:id', itemController.updateItem);
router.patch('/:id/stock', itemController.updateStock);
router.patch('/:id/availability', itemController.toggleAvailability);
router.post('/:id/image', upload.single('image'), itemController.uploadImage);

module.exports = router;
