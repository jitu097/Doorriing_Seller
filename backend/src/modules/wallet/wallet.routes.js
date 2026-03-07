const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

router.use(verifyToken, loadSeller, loadShop);

router.get('/summary', walletController.getSummary);
router.get('/transactions', walletController.getTransactions);

module.exports = router;
