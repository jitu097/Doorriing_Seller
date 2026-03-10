import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isGrocery = location.pathname.includes('/grocery');
    const basePath = isGrocery ? '/grocery' : '/restaurant';

    const fetchUnreadCount = async () => {
        try {
            const { count } = await notificationService.getUnreadCount();
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications(20);
            setNotifications(data || []);
            // Update unread count based on fetched data if needed, or re-fetch count
            // But usually fetchUnreadCount is separate.
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    // Add realtime subscription for notifications
    useRealtimeSubscription('notifications', () => {
        setTimeout(() => {
            fetchUnreadCount();
            if (isOpen) fetchNotifications();
        }, 0);
    });

    useEffect(() => {
        fetchUnreadCount();

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        if (!isOpen) {
            fetchNotifications();
            // Optimistically reset badge if we consider "opening" as "seen" (optional, user said clicking mark as read)
            // User requirement: "Clicking a notification: Marks it as read".
            // So we KEEP badge until clicked or "Mark all read".
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.is_read) {
                await notificationService.markAsRead(notification.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, is_read: true } : n
                ));
            }

            // Navigation
            setIsOpen(false);
            if (notification.type.includes('order')) {
                navigate(`${basePath}/orders`);
            } else if (notification.type.includes('stock')) {
                navigate(`${basePath}/products`);
            } else if (notification.type.includes('booking')) {
                navigate(`${basePath}/bookings`);
            }
        } catch (error) {
            console.error('Failed to process notification click', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-container" ref={dropdownRef}>
            <button className="notification-bell-btn" onClick={toggleDropdown}>
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <button className="mark-all-btn" onClick={handleMarkAllRead}>Mark all as read</button>
                    </div>
                    <div className="notification-list">
                        {loading ? (
                            <div className="loading-spinner">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">No notifications</div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-title">{notification.title}</div>
                                    <div className="notification-message">{notification.message}</div>
                                    <div className="notification-time">{formatTime(notification.created_at)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
