import { getToken, getMessaging, isSupported, onMessage } from 'firebase/messaging';
import { app, auth, firebaseConfig } from '../config/firebase';
import { getFallbackAuthenticatedRoute } from './authManager';
import notificationService from '../services/notificationService';

const PROMPTED_PERMISSION_KEY = 'notificationPermissionPrompted';
const LAST_TOKEN_KEY = 'notificationLastFcmToken';
const LAST_OWNER_KEY = 'notificationLastOwnerKey';
const TOAST_CONTAINER_ID = 'notification-toast-container';
const TOAST_STYLE_ID = 'notification-toast-style';
const TOAST_DURATION_MS = 5000;
const MESSAGING_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

let messagingInstance = null;
let messagingSupportPromise = null;
let messagingServiceWorkerPromise = null;
let foregroundUnsubscribe = null;
let foregroundListenerAttached = false;
let initializationPromise = null;
let initializedUserKey = null;

const canUseWindow = () => typeof window !== 'undefined';

const readStorage = (key) => {
    if (!canUseWindow()) return null;

    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        console.error(`Failed to read localStorage key "${key}"`, error);
        return null;
    }
};

const writeStorage = (key, value) => {
    if (!canUseWindow()) return;

    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        console.error(`Failed to write localStorage key "${key}"`, error);
    }
};

const isBrowserNotificationCapable = () =>
    canUseWindow() &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

const isMessagingSupported = async () => {
    if (!messagingSupportPromise) {
        messagingSupportPromise = (async () => {
            if (!isBrowserNotificationCapable()) {
                return false;
            }

            try {
                return await isSupported();
            } catch (error) {
                console.error('Failed to check Firebase Messaging support', error);
                return false;
            }
        })();
    }

    return messagingSupportPromise;
};

const getMessagingInstance = async () => {
    const supported = await isMessagingSupported();
    if (!supported) {
        return null;
    }

    if (!messagingInstance) {
        messagingInstance = getMessaging(app);
    }

    return messagingInstance;
};

const buildMessagingServiceWorkerUrl = () => {
    const params = new URLSearchParams({
        apiKey: firebaseConfig.apiKey || '',
        authDomain: firebaseConfig.authDomain || '',
        projectId: firebaseConfig.projectId || '',
        storageBucket: firebaseConfig.storageBucket || '',
        messagingSenderId: firebaseConfig.messagingSenderId || '',
        appId: firebaseConfig.appId || '',
    });

    return `/firebase-messaging-sw.js?${params.toString()}`;
};

const registerMessagingServiceWorker = async () => {
    if (!messagingServiceWorkerPromise) {
        messagingServiceWorkerPromise = navigator.serviceWorker.register(
            buildMessagingServiceWorkerUrl(),
            {
                scope: MESSAGING_SW_SCOPE,
                type: 'module',
            }
        );
    }

    return messagingServiceWorkerPromise;
};

const normalizeRoute = (route) => {
    if (!route) {
        return getFallbackAuthenticatedRoute();
    }

    try {
        const url = new URL(route, window.location.origin);
        if (url.origin !== window.location.origin) {
            return getFallbackAuthenticatedRoute();
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch (error) {
        const normalized = String(route || '').trim();
        if (!normalized) {
            return getFallbackAuthenticatedRoute();
        }

        return normalized.startsWith('/') ? normalized : `/${normalized}`;
    }
};

const resolveClickAction = (payload) => {
    const data = payload?.data || {};
    const directRoute =
        data.click_action ||
        data.route ||
        payload?.fcmOptions?.link ||
        payload?.notification?.click_action;

    if (directRoute) {
        return normalizeRoute(directRoute);
    }

    const notificationType = String(data.type || '').toLowerCase();
    if (notificationType.includes('booking')) {
        return '/restaurant/bookings';
    }
    if (notificationType.includes('stock')) {
        return '/grocery/products';
    }
    if (notificationType.includes('product')) {
        return '/grocery/products';
    }
    if (notificationType.includes('menu')) {
        return '/restaurant/menu';
    }
    if (notificationType.includes('order')) {
        const fallbackRoute = getFallbackAuthenticatedRoute();
        if (fallbackRoute.startsWith('/grocery/')) {
            return '/grocery/orders';
        }

        return '/restaurant/orders';
    }

    return getFallbackAuthenticatedRoute();
};

const normalizePayload = (payload) => {
    const notification = payload?.notification || {};
    const data = payload?.data || {};

    return {
        title: notification.title || data.title || 'New notification',
        body: notification.body || data.body || data.message || '',
        image: notification.image || data.image || null,
        data,
        clickAction: resolveClickAction(payload),
    };
};

const injectToastStyles = () => {
    if (!canUseWindow() || document.getElementById(TOAST_STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = TOAST_STYLE_ID;
    style.textContent = `
        #${TOAST_CONTAINER_ID} {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        }

        .notification-toast {
            min-width: 280px;
            max-width: 360px;
            padding: 14px 16px;
            border-radius: 14px;
            background: rgba(17, 24, 39, 0.96);
            color: #fff;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
            border: 1px solid rgba(255, 255, 255, 0.08);
            pointer-events: auto;
            cursor: pointer;
            opacity: 0;
            transform: translateY(-8px);
            transition: opacity 160ms ease, transform 160ms ease;
        }

        .notification-toast.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .notification-toast-title {
            margin: 0 0 6px;
            font-size: 0.95rem;
            font-weight: 700;
        }

        .notification-toast-body {
            margin: 0;
            font-size: 0.85rem;
            line-height: 1.45;
            color: rgba(255, 255, 255, 0.84);
        }
    `;

    document.head.appendChild(style);
};

const ensureToastContainer = () => {
    if (!canUseWindow()) return null;

    injectToastStyles();

    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (container) {
        return container;
    }

    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    document.body.appendChild(container);
    return container;
};

const navigateToNotificationTarget = (route) => {
    if (!canUseWindow() || !route) return;

    const targetRoute = normalizeRoute(route);
    const currentRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentRoute === targetRoute) {
        return;
    }

    window.location.assign(targetRoute);
};

const showForegroundToast = (message) => {
    const container = ensureToastContainer();
    if (!container) return;

    const toast = document.createElement('button');
    toast.type = 'button';
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <p class="notification-toast-title"></p>
        <p class="notification-toast-body"></p>
    `;

    toast.querySelector('.notification-toast-title').textContent = message.title;
    toast.querySelector('.notification-toast-body').textContent = message.body;

    const removeToast = () => {
        toast.classList.remove('is-visible');
        window.setTimeout(() => {
            toast.remove();
        }, 180);
    };

    toast.addEventListener('click', () => {
        navigateToNotificationTarget(message.clickAction);
        removeToast();
    });

    container.appendChild(toast);

    window.requestAnimationFrame(() => {
        toast.classList.add('is-visible');
    });

    window.setTimeout(removeToast, TOAST_DURATION_MS);
};

const showBrowserNotification = (message) => {
    if (!canUseWindow() || !('Notification' in window)) {
        return null;
    }

    if (Notification.permission !== 'granted') {
        return null;
    }

    try {
        const notification = new Notification(message.title, {
            body: message.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: message.tag || undefined,
        });

        notification.onclick = () => {
            window.focus();
            navigateToNotificationTarget(message.clickAction);
            notification.close();
        };

        return notification;
    } catch (error) {
        console.error('Failed to show browser notification', error);
        return null;
    }
};

export const showAppNotification = (message) => {
    if (!message?.title) {
        return;
    }

    showForegroundToast(message);
    showBrowserNotification(message);

    if (canUseWindow()) {
        window.dispatchEvent(
            new CustomEvent('push-notification-received', {
                detail: message,
            })
        );
    }
};

export const requestPermission = async () => {
    const supported = await isMessagingSupported();
    if (!supported) {
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    if (readStorage(PROMPTED_PERMISSION_KEY) === '1') {
        return 'default';
    }

    const permission = await Notification.requestPermission();
    writeStorage(PROMPTED_PERMISSION_KEY, '1');
    return permission;
};

export const generateToken = async () => {
    const supported = await isMessagingSupported();
    if (!supported) {
        return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
        console.error('Missing VITE_FIREBASE_VAPID_KEY. Push notifications will remain disabled.');
        return null;
    }

    const permission = await requestPermission();
    if (permission !== 'granted') {
        return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
        return null;
    }

    const registration = await registerMessagingServiceWorker();
    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
    });

    return token || null;
};

const buildOwnerKey = (user) => String(user?.uid || auth.currentUser?.uid || 'anonymous');

const ensureAuthenticatedSession = async (user) => {
    const activeUser = user || auth.currentUser;
    if (!activeUser?.uid) {
        throw new Error('Cannot register push notifications without an authenticated user.');
    }

    await activeUser.getIdToken(true);
    return activeUser;
};

export const saveTokenToSupabase = async (user, token) => {
    if (!token) {
        return null;
    }

    const activeUser = await ensureAuthenticatedSession(user);
    const ownerKey = buildOwnerKey(activeUser);
    const previousToken = readStorage(LAST_TOKEN_KEY);
    const previousOwnerKey = readStorage(LAST_OWNER_KEY);

    if (previousToken === token && previousOwnerKey === ownerKey) {
        return {
            fcm_token: token,
            skipped: true,
        };
    }

    const payload = await notificationService.registerPushToken(token);

    writeStorage(LAST_TOKEN_KEY, token);
    writeStorage(LAST_OWNER_KEY, ownerKey);
    return payload;
};

export const listenForegroundMessages = async () => {
    if (foregroundListenerAttached) {
        return foregroundUnsubscribe;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
        return null;
    }

    foregroundUnsubscribe = onMessage(messaging, (payload) => {
        const message = normalizePayload(payload);
        showAppNotification({
            ...message,
            payload,
        });
    });

    foregroundListenerAttached = true;
    return foregroundUnsubscribe;
};

export const initNotifications = async (user) => {
    if (!user?.uid) {
        return {
            supported: false,
            initialized: false,
            reason: 'missing-user',
        };
    }

    if (initializedUserKey === user.uid) {
        return {
            supported: true,
            initialized: true,
        };
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        const supported = await isMessagingSupported();
        if (!supported) {
            return {
                supported: false,
                initialized: false,
                reason: 'unsupported-browser',
            };
        }

        await listenForegroundMessages();

        const token = await generateToken();
        if (!token) {
            return {
                supported: true,
                initialized: false,
                reason: Notification.permission,
            };
        }

        try {
            await saveTokenToSupabase(user, token);
        } catch (error) {
            console.error('Failed to persist push notification token', error);
            return {
                supported: true,
                initialized: false,
                reason: error?.message || 'token-save-failed',
            };
        }

        initializedUserKey = user.uid;

        return {
            supported: true,
            initialized: true,
            token,
        };
    })();

    try {
        return await initializationPromise;
    } finally {
        initializationPromise = null;
    }
};

export default {
    initNotifications,
    requestPermission,
    generateToken,
    saveTokenToSupabase,
    listenForegroundMessages,
    showAppNotification,
};
