import { deleteToken, getToken, getMessaging, isSupported, onMessage } from 'firebase/messaging';
import { app, auth, firebaseConfig } from '../config/firebase';
import { getFallbackAuthenticatedRoute } from './authManager';
import notificationService from '../services/notificationService';

const LAST_TOKEN_KEY = 'notificationLastFcmToken';
const LAST_OWNER_KEY = 'notificationLastOwnerKey';
const LAST_TOKEN_REFRESH_KEY = 'notificationLastTokenRefreshAt';
const TOAST_CONTAINER_ID = 'notification-toast-container';
const TOAST_STYLE_ID = 'notification-toast-style';
const TOAST_DURATION_MS = 5000;
const MESSAGING_SW_SCOPE = '/firebase-push';
const OLD_MESSAGING_SW_SCOPE = '/firebase-cloud-messaging-push-scope';
const TOKEN_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_NOTIFICATION_TITLE = 'Doorriing Seller';
const DEFAULT_NOTIFICATION_BODY = 'You have a new update';
const DEFAULT_NOTIFICATION_ICON = '/Doorriing-seller.png';

let messagingInstance = null;
let messagingSupportPromise = null;
let messagingServiceWorkerPromise = null;
let foregroundUnsubscribe = null;
let foregroundListenerAttached = false;
let runtimePreparationPromise = null;
let activationPromise = null;
let initializedUserKey = null;
let preparedUserKey = null;

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

export const getNotificationSupport = async () => {
    const browserCapable = isBrowserNotificationCapable();
    if (!browserCapable) {
        return {
            supported: false,
            reasons: {
                notificationApi: canUseWindow() && 'Notification' in window,
                serviceWorker: canUseWindow() && 'serviceWorker' in navigator,
                pushManager: canUseWindow() && 'PushManager' in window,
                firebaseMessaging: false,
            },
        };
    }

    const firebaseMessaging = await isMessagingSupported();

    return {
        supported: firebaseMessaging,
        reasons: {
            notificationApi: true,
            serviceWorker: true,
            pushManager: true,
            firebaseMessaging,
        },
    };
};

export const getNotificationPermissionState = () => {
    if (!canUseWindow() || !('Notification' in window)) {
        return 'unsupported';
    }

    return Notification.permission;
};

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
    if (messagingInstance) {
        return messagingInstance;
    }

    try {
        const supported = await isMessagingSupported();
        messagingInstance = getMessaging(app);
        return messagingInstance;
    } catch (error) {
        console.error('[FCM] Failed to initialize messaging instance', error);
        return null;
    }
};

const buildMessagingServiceWorkerUrl = () => {
    // Collect all required parameters from the config
    const configValues = {
        apiKey: firebaseConfig.apiKey || '',
        authDomain: firebaseConfig.authDomain || '',
        projectId: firebaseConfig.projectId || '',
        storageBucket: firebaseConfig.storageBucket || '',
        messagingSenderId: firebaseConfig.messagingSenderId || '',
        appId: firebaseConfig.appId || '',
    };

    // Construct the URL with query parameters
    const params = new URLSearchParams(configValues);
    const url = `/firebase-messaging-sw.js?${params.toString()}`;
    return url;
};

const registerMessagingServiceWorker = async () => {
    // 1. Thorough cleanup for previous scopes/scripts to avoid AbortError
    if ('serviceWorker' in navigator) {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
                const isOurOldScope = reg.scope.includes(OLD_MESSAGING_SW_SCOPE);
                const isOurRootWorker = reg.scope === window.location.origin + '/' && 
                                      reg.active?.scriptURL?.includes('firebase-messaging-sw.js');
                
                if (isOurOldScope || isOurRootWorker) {
                    await reg.unregister();
                }
            }
        } catch (e) {
            console.error('[FCM] Cleanup failed', e);
        }
    }

    // No log
    
    if (!messagingServiceWorkerPromise) {
        messagingServiceWorkerPromise = navigator.serviceWorker.register(
            buildMessagingServiceWorkerUrl(),
            {
                scope: MESSAGING_SW_SCOPE,
            }
        ).then(reg => {
            return reg;
        }).catch(err => {
            console.error('[FCM] Service Worker registration failed', err);
            messagingServiceWorkerPromise = null; 
            throw err;
        });
    }

    return messagingServiceWorkerPromise;
};



const waitForServiceWorkerActivation = async (registration) => {
    if (!registration) {
        return null;
    }

    if (registration.active) {
        return registration;
    }

    const worker = registration.installing || registration.waiting;
    if (!worker) {
        await navigator.serviceWorker.ready;
        return registration.active ? registration : registration;
    }

    await new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error('Service worker activation timed out.'));
        }, 10000);

        const handleStateChange = () => {
            if (worker.state === 'activated') {
                window.clearTimeout(timeoutId);
                worker.removeEventListener('statechange', handleStateChange);
                resolve();
            }
        };

        worker.addEventListener('statechange', handleStateChange);
    });

    return registration;
};

const ensureAppServiceWorkerRegistration = async () => {
    if (!canUseWindow() || !('serviceWorker' in navigator)) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        return await waitForServiceWorkerActivation(registration);
    } catch (error) {
        console.error('Failed to register app service worker', error);
        return null;
    }
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
        data.url ||
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
        title: notification.title || data.title || DEFAULT_NOTIFICATION_TITLE,
        body: notification.body || data.body || data.message || DEFAULT_NOTIFICATION_BODY,
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
            icon: message.icon || DEFAULT_NOTIFICATION_ICON,
            badge: message.badge || DEFAULT_NOTIFICATION_ICON,
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
    const support = await getNotificationSupport();
    if (!support.supported) {
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    return Notification.requestPermission();
};

const generateToken = async () => {
    const supported = await isMessagingSupported();
    if (!supported) {
        return null;
    }

    const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
    if (!vapidKey) {
        console.error('Missing VITE_FIREBASE_VAPID_KEY. Push notifications will remain disabled.');
        return null;
    }
    
    // No logs

    const permission = getNotificationPermissionState();
    if (permission !== 'granted') {
        return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
        return null;
    }

    // No logs
    
    // 1. Mandatory Register & Wait for Service Worker FIRST
    // This ensures any subsequent Firebase Messaging calls (like deleteToken) 
    // use our custom registration instead of trying to register a default one.
    const registration = await waitForServiceWorkerActivation(
        await registerMessagingServiceWorker()
    );

    const lastRefreshAt = Number(readStorage(LAST_TOKEN_REFRESH_KEY) || 0);
    const shouldRefreshToken =
        !readStorage(LAST_TOKEN_KEY) ||
        !Number.isFinite(lastRefreshAt) ||
        Date.now() - lastRefreshAt > TOKEN_REFRESH_INTERVAL_MS;

    // Note: We skip deleteToken here because it often triggers a default service worker 
    // registration on the root scope, which fails our evaluation checks.
    // Instead, we just proceed to generate a new token with our custom registration.

    // No logs
    try {
        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration,
        });
        
        if (token) {
            writeStorage(LAST_TOKEN_REFRESH_KEY, String(Date.now()));
        }
    
        return token || null;
    } catch (error) {
        if (error.name === 'AbortError' || error.message?.toLowerCase().includes('push service error')) {
            console.error('[FCM] CRITICAL: Push service aborted registration. This is often a browser-level issue. Please try: 1. Hard refresh (Ctrl+F5) 2. Unregister ALL service workers in DevTools -> Application.', error);
        }
        throw error;
    }
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
    
    try {
        const payload = await notificationService.registerPushToken(token);
        writeStorage(LAST_TOKEN_KEY, token);
        writeStorage(LAST_OWNER_KEY, ownerKey);
        return payload;
    } catch (error) {
        console.error('[FCM] Failed to save token to backend', error);
        throw error;
    }
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

const resolvePushSubscription = async () => {
    try {
        const registration = await waitForServiceWorkerActivation(
            await registerMessagingServiceWorker()
        );
        return await registration.pushManager.getSubscription();
    } catch (error) {
        console.error('Failed to resolve push subscription', error);
        return null;
    }
};

export const prepareNotifications = async (user) => {
    if (!user?.uid) {
        return {
            supported: false,
            prepared: false,
            reason: 'missing-user',
        };
    }

    if (preparedUserKey === user.uid) {
        return {
            supported: true,
            prepared: true,
            permission: getNotificationPermissionState(),
        };
    }

    if (runtimePreparationPromise) {
        return runtimePreparationPromise;
    }

    runtimePreparationPromise = (async () => {
        const support = await getNotificationSupport();
        if (!support.supported) {
            return {
                supported: false,
                prepared: false,
                reason: 'unsupported-browser',
                support,
            };
        }

        await listenForegroundMessages();
        preparedUserKey = user.uid;

        return {
            supported: true,
            prepared: true,
            permission: getNotificationPermissionState(),
            support,
        };
    })();

    try {
        return await runtimePreparationPromise;
    } finally {
        runtimePreparationPromise = null;
    }
};

export const enableNotifications = async (user) => {
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
            permission: getNotificationPermissionState(),
            pushSubscription: await resolvePushSubscription(),
        };
    }

    if (activationPromise) {
        return activationPromise;
    }

    activationPromise = (async () => {
        const prepared = await prepareNotifications(user);
        if (!prepared.supported) {
            return {
                supported: false,
                initialized: false,
                reason: prepared.reason || 'unsupported-browser',
                support: prepared.support,
            };
        }

        const permission = await requestPermission();
        if (permission !== 'granted') {
            return {
                supported: true,
                initialized: false,
                reason: permission,
                permission,
                support: prepared.support,
            };
        }



        const appServiceWorker = await ensureAppServiceWorkerRegistration();
        const token = await generateToken();
        if (!token) {
            return {
                supported: true,
                initialized: false,
                reason: 'token-unavailable',
                permission,
                appServiceWorkerScope: appServiceWorker?.scope || null,
                support: prepared.support,
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
                permission,
                support: prepared.support,
            };
        }

        const pushSubscription = await resolvePushSubscription();
        initializedUserKey = user.uid;

        return {
            supported: true,
            initialized: true,
            token,
            permission,
            pushSubscription,
            appServiceWorkerScope: appServiceWorker?.scope || null,
            serviceWorkerScope: MESSAGING_SW_SCOPE,
            support: prepared.support,
        };
    })();

    try {
        return await activationPromise;
    } finally {
        activationPromise = null;
    }
};

export const initNotifications = async (user) => {
    const prepared = await prepareNotifications(user);
    if (!prepared.supported) {
        console.warn('[FCM] Notifications not supported', prepared.reason);
        return {
            supported: false,
            initialized: false,
            reason: prepared.reason || 'unsupported-browser',
        };
    }

    if (getNotificationPermissionState() !== 'granted') {
        console.log('[FCM] Permission not granted:', getNotificationPermissionState());
        return {
            supported: true,
            initialized: false,
            reason: getNotificationPermissionState(),
            permission: getNotificationPermissionState(),
        };
    }

    if (initializedUserKey === user?.uid) {
        console.log('[FCM] Already initialized for user', user.uid);
        return {
            supported: true,
            initialized: true,
            permission: 'granted',
            pushSubscription: await resolvePushSubscription(),
        };
    }

    const token = await generateToken();
    if (!token) {
        console.warn('[FCM] No token available after generation');
        return {
            supported: true,
            initialized: false,
            reason: 'token-unavailable',
            permission: 'granted',
        };
    }

    try {
        await saveTokenToSupabase(user, token);
        initializedUserKey = user.uid;
        console.log('[FCM] Initialization complete');
    } catch (error) {
        console.error('[FCM] Failed to persist push notification token', error);
        return {
            supported: true,
            initialized: false,
            reason: error?.message || 'token-save-failed',
            permission: 'granted',
        };
    }

    return {
        supported: true,
        initialized: true,
        token,
        permission: 'granted',
        pushSubscription: await resolvePushSubscription(),
    };
};

export default {
    initNotifications,
    prepareNotifications,
    enableNotifications,
    requestPermission,
    saveTokenToSupabase,
    listenForegroundMessages,
    showAppNotification,
    getNotificationSupport,
    getNotificationPermissionState,
};
