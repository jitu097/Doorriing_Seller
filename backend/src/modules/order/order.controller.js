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

const acceptOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.acceptOrder(id, req.shop.id);
        successResponse(res, order, 'Order accepted successfully');
    } catch (error) {
        next(error);
    }
};

const rejectOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.rejectOrder(id, req.shop.id);
        successResponse(res, order, 'Order rejected successfully');
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await orderService.updateOrderStatus(id, req.shop.id, status, 'seller');
        successResponse(res, order, 'Order status updated successfully');
    } catch (error) {
        next(error);
    }
};

const getActiveDeliveryPartners = async (req, res, next) => {
    try {
        const partners = await orderService.getActiveDeliveryPartners();
        successResponse(res, partners);
    } catch (error) {
        next(error);
    }
};

const assignDriver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { delivery_partner_id } = req.body;
        const order = await orderService.assignDriver(id, req.shop.id, delivery_partner_id);
        successResponse(res, order, 'Driver assigned successfully');
    } catch (error) {
        next(error);
    }
};

const markReady = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.markReadyForPickup(id, req.shop.id);
        successResponse(res, order, 'Order marked ready for pickup');
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
    acceptOrder,
    rejectOrder,
    updateStatus,
    getActiveDeliveryPartners,
    assignDriver,
    markReady,
    getStats
};
