const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { loadSeller, loadShop } = require('../../middlewares/seller.middleware');

const withdrawController = require('./withdraw.controller');
const payoutController = require('./payout.controller');

router.use(verifyToken, loadSeller, loadShop);

router.get('/summary', walletController.getSummary);
router.get('/transactions', walletController.getTransactions);

// Payout Accounts Routes
router.get('/payout-accounts', payoutController.getPayoutAccounts);
router.post('/payout-accounts', payoutController.addPayoutAccount);
router.patch('/payout-accounts/:id', payoutController.updatePayoutAccount);
router.delete('/payout-accounts/:id', payoutController.deletePayoutAccount);

// Withdraw Requests Routes
router.get('/withdraw-requests', withdrawController.getRequests);
router.post('/withdraw-requests', withdrawController.createRequest);

module.exports = router;
