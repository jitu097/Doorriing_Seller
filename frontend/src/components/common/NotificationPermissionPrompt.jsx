import React, { useEffect, useMemo, useState } from 'react';
import PrimaryButton from './PrimaryButton';
import { useAuthSession } from '../../utils/authManager';
import {
    enableNotifications,
    getNotificationPermissionState,
    getNotificationSupport,
    prepareNotifications,
} from '../../utils/notificationManager';
import './NotificationPermissionPrompt.css';

const NotificationPermissionPrompt = () => {
    const { user } = useAuthSession();
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState(getNotificationPermissionState());
    const [supported, setSupported] = useState(true);
    const [supportDetails, setSupportDetails] = useState(null);
    const [message, setMessage] = useState('');
    const [subscriptionPreview, setSubscriptionPreview] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadState = async () => {
            const support = await getNotificationSupport();
            if (!mounted) {
                return;
            }

            setSupported(support.supported);
            setSupportDetails(support.reasons);
            setPermission(getNotificationPermissionState());

            if (user?.uid) {
                await prepareNotifications(user);
            }
        };

        loadState();

        return () => {
            mounted = false;
        };
    }, [user?.uid]);

    const statusText = useMemo(() => {
        if (!supported) {
            return 'Notifications are not supported on this device/browser.';
        }

        if (permission === 'granted') {
            return 'Notifications are enabled for order and delivery updates.';
        }

        if (permission === 'denied') {
            return 'Notifications are blocked. Enable them from browser site settings.';
        }

        return 'Enable notifications to get instant order updates.';
    }, [permission, supported]);

    const shouldShowEnableButton = supported && permission !== 'granted';

    const handleAgree = async () => {
        if (!user?.uid) {
            setMessage('You need to be signed in before enabling notifications.');
            return;
        }

        setLoading(true);
        setMessage('');
        setSubscriptionPreview('');

        try {
            const result = await enableNotifications(user);
            const nextPermission = result.permission || getNotificationPermissionState();
            setPermission(nextPermission);

            if (result.supported === false) {
                setSupported(false);
                setSupportDetails(result.support?.reasons || supportDetails);
                setMessage('This browser does not support push notifications.');
                return;
            }

            if (result.initialized) {
                const preview = result.pushSubscription
                    ? JSON.stringify(result.pushSubscription.toJSON(), null, 2)
                    : '';

                setSubscriptionPreview(preview);
                setMessage('Notifications enabled successfully.');
                setModalOpen(false);
                return;
            }

            if (nextPermission === 'denied' || result.reason === 'denied') {
                setMessage('Notifications are blocked. Open browser site settings and allow notifications for this app.');
                return;
            }

            if (nextPermission === 'default') {
                setMessage('Notification permission was dismissed. Tap Enable Notifications again when you are ready.');
                return;
            }

            setMessage('Unable to enable notifications right now. Please try again.');
        } catch (error) {
            console.error('Notification permission flow failed', error);
            setMessage('Unable to enable notifications right now. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="notification-permission-inline">
                {shouldShowEnableButton && (
                    <button
                        type="button"
                        className="notification-enable-btn"
                        onClick={() => setModalOpen(true)}
                    >
                        Enable Notifications 🔔
                    </button>
                )}
                {(!shouldShowEnableButton || message) && (
                    <p className={`notification-permission-status ${permission === 'denied' ? 'is-warning' : ''}`}>
                        {message || statusText}
                    </p>
                )}
            </div>

            {modalOpen && (
                <div className="notification-permission-modal-overlay">
                    <div className="notification-permission-modal">
                        <div className="notification-permission-header">
                            <h2>Turn On Notifications</h2>
                            <button
                                type="button"
                                className="notification-permission-close"
                                onClick={() => setModalOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="notification-permission-body">
                            <p>
                                Stay ahead of new orders, delivery updates, and important store alerts.
                            </p>
                            <ul className="notification-permission-list">
                                <li>Instant order alerts even when the app is in the background</li>
                                <li>Delivery and status update notifications</li>
                                <li>Fewer missed orders during busy periods</li>
                            </ul>

                            {!supported && (
                                <div className="notification-permission-note is-warning">
                                    Notifications are not supported on this browser.
                                </div>
                            )}

                            {permission === 'denied' && (
                                <div className="notification-permission-note is-warning">
                                    Notifications are blocked. Open browser site settings and allow notifications for this app.
                                </div>
                            )}

                            {supportDetails && !supported && (
                                <pre className="notification-support-debug">
                                    {JSON.stringify(supportDetails, null, 2)}
                                </pre>
                            )}

                            {subscriptionPreview && (
                                <pre className="notification-support-debug">{subscriptionPreview}</pre>
                            )}
                        </div>

                        <div className="notification-permission-footer">
                            <button
                                type="button"
                                className="notification-secondary-btn"
                                onClick={() => setModalOpen(false)}
                                disabled={loading}
                            >
                                Maybe Later
                            </button>
                            <div className="notification-primary-btn-wrap">
                                <PrimaryButton onClick={handleAgree} disabled={loading || !supported}>
                                    {loading ? 'Enabling...' : 'Allow Notifications'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationPermissionPrompt;
