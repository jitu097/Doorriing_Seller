import api from './api';

export const getNotifications = async (limit = 20) => {
    return api(`/seller/notifications?limit=${limit}`, {
        method: 'GET'
    });
};

export const getUnreadCount = async () => {
    return api('/seller/notifications/unread-count', {
        method: 'GET'
    });
};

export const markAsRead = async (notificationId) => {
    return api(`/seller/notifications/${notificationId}/read`, {
        method: 'PATCH'
    });
};

export const markAllAsRead = async () => {
    return api('/seller/notifications/read-all', {
        method: 'PATCH'
    });
};

export const registerPushToken = async (token) => {
    return api('/seller/notifications/token', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
};

export const createNewOrderNotification = async (orderId, orderNumber) => {
    return api('/seller/notifications/new-order', {
        method: 'POST',
        body: JSON.stringify({ orderId, orderNumber }),
    });
};

export default {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    registerPushToken,
    createNewOrderNotification
};
