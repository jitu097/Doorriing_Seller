const walletService = require('./wallet.service');
const { successResponse } = require('../../utils/response');

const getSummary = async (req, res, next) => {
    try {
        const wallet = await walletService.getWalletSummary(req.shop.id);
        successResponse(res, wallet);
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await walletService.getWalletTransactions(req.shop.id, page, limit);
        successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSummary,
    getTransactions
};
