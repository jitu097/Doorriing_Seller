const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller } = require('../../middlewares/seller.middleware');

router.post('/bootstrap', verifyToken, authController.bootstrap);
router.get('/profile', verifyToken, loadSeller, authController.getProfile);

module.exports = router;
