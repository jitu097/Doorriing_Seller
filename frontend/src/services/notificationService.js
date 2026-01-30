import api from './api';

export const getNotifications = async (limit = 20) => {
    return api(`/notifications?limit=${limit}`, {
        method: 'GET'
    });
};

export const getUnreadCount = async () => {
    return api('/notifications/unread-count', {
        method: 'GET'
    });
};

export const markAsRead = async (notificationId) => {
    return api(`/notifications/${notificationId}/read`, {
        method: 'PATCH'
    });
};

export const markAllAsRead = async () => {
    return api('/notifications/read-all', {
        method: 'PATCH'
    });
};

export default {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
