const notificationService = require('./notification.service');
const { successResponse } = require('../../utils/response');

const getNotifications = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
        const notifications = await notificationService.getNotifications(req.shop.id, numericLimit);
        successResponse(res, notifications);
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id, req.shop.id);
        successResponse(res, notification, 'Notification marked as read');
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationService.markAllAsRead(req.shop.id);
        successResponse(res, result, 'All notifications marked as read');
    } catch (error) {
        next(error);
    }
};

const getUnreadCount = async (req, res, next) => {
    try {
        const result = await notificationService.getUnreadCount(req.shop.id);
        successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

const registerPushToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        const result = await notificationService.upsertNotificationToken({
            sellerId: req.user.id,
            shopId: req.shop.id,
            token,
        });

        successResponse(res, result, 'Push token saved successfully');
    } catch (error) {
        next(error);
    }
};

const createNewOrderNotification = async (req, res, next) => {
    try {
        const { orderId, orderNumber } = req.body;
        const result = await notificationService.createNewOrderNotification(
            req.shop.id,
            orderId,
            orderNumber
        );

        successResponse(res, result, 'New order notification created');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    registerPushToken,
    createNewOrderNotification
};
