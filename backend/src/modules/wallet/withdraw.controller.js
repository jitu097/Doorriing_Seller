const withdrawService = require('./withdraw.service');
const { successResponse } = require('../../utils/response');

const sendBadRequest = (res, message) => res.status(400).json({ success: false, message });
const isClientErrorMessage = (message = '') => {
    if (typeof message !== 'string') return false;
    const keywords = ['Insufficient', 'Sum of pending', 'Invalid', 'Wallet not found'];
    return keywords.some(keyword => message.includes(keyword));
};

const getRequests = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await withdrawService.getWithdrawRequests(req.shop.id, page, limit);
        successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

const createRequest = async (req, res, next) => {
    try {
        const { amount, payoutAccountId } = req.body;
        
        if (!amount || !payoutAccountId) {
            return sendBadRequest(res, 'Amount and payout account are required');
        }

        const request = await withdrawService.createWithdrawRequest(req.shop.id, amount, payoutAccountId);
        successResponse(res, request, 'Withdrawal request submitted successfully', 201);
    } catch (error) {
        // Distinguish between bad request vs server error depending on service throw
        if (isClientErrorMessage(error.message)) {
            return sendBadRequest(res, error.message);
        }
        next(error);
    }
};

module.exports = {
    getRequests,
    createRequest
};
