const notificationService = require('./notification.service');
const { successResponse } = require('../../utils/response');

const getNotifications = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const notifications = await notificationService.getNotifications(req.shop.id, limit);
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

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
