const withdrawService = require('./withdraw.service');
const { successResponse, errorResponse } = require('../../utils/response');

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
            return res.status(400).json({ success: false, message: 'Amount and payout account are required' });
        }

        const request = await withdrawService.createWithdrawRequest(req.shop.id, amount, payoutAccountId);
        successResponse(res, request, 'Withdrawal request submitted successfully', 201);
    } catch (error) {
        // Distinguish between bad request vs server error depending on service throw
        if (error.message.includes('Insufficient') || error.message.includes('Sum of pending') || error.message.includes('Invalid') || error.message.includes('Wallet not found')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    getRequests,
    createRequest
};
