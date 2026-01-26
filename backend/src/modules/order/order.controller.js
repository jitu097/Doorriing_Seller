const orderService = require('./order.service');
const { successResponse } = require('../../utils/response');

const getOrders = async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;
        const result = await orderService.getOrders(req.shop.id, page, limit, status);
        successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

const getOrderDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.getOrderDetails(id, req.shop.id);
        successResponse(res, order);
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, cancellation_reason } = req.body;
        
        const order = await orderService.updateOrderStatus(id, req.shop.id, status, cancellation_reason);
        successResponse(res, order, 'Order status updated successfully');
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await orderService.getOrderStats(req.shop.id);
        successResponse(res, stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrders,
    getOrderDetails,
    updateStatus,
    getStats
};
