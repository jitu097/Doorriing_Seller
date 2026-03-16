const payoutService = require('./payout.service');
const { successResponse } = require('../../utils/response');

const VALID_PAYOUT_TYPES = ['upi', 'bank'];
const isValidAccountType = (type) => VALID_PAYOUT_TYPES.includes(type);
const sendBadRequest = (res, message) => res.status(400).json({ success: false, message });

const getPayoutAccounts = async (req, res, next) => {
    try {
        const accounts = await payoutService.getPayoutAccounts(req.shop.id);
        successResponse(res, accounts);
    } catch (error) {
        next(error);
    }
};

const addPayoutAccount = async (req, res, next) => {
    try {
        // Validate request body depending on 'type' (upi vs bank)
        const accountData = req.body;
        if (!isValidAccountType(accountData.type)) {
            return sendBadRequest(res, 'Invalid payout account type');
        }

        const newAccount = await payoutService.addPayoutAccount(req.shop.id, accountData);
        successResponse(res, newAccount, 'Payout account added successfully', 201);
    } catch (error) {
        next(error);
    }
};

const updatePayoutAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedAccount = await payoutService.updatePayoutAccount(req.shop.id, id, updates);
        successResponse(res, updatedAccount, 'Payout account updated successfully');
    } catch (error) {
        next(error);
    }
};

const deletePayoutAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        await payoutService.deletePayoutAccount(req.shop.id, id);
        successResponse(res, null, 'Payout account deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPayoutAccounts,
    addPayoutAccount,
    updatePayoutAccount,
    deletePayoutAccount
};
