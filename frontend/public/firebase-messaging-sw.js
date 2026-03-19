import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-sw.js';

const params = new URL(self.location.href).searchParams;

const firebaseConfig = {
    apiKey: params.get('apiKey') || '',
    authDomain: params.get('authDomain') || '',
    projectId: params.get('projectId') || '',
    storageBucket: params.get('storageBucket') || '',
    messagingSenderId: params.get('messagingSenderId') || '',
    appId: params.get('appId') || '',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const DEFAULT_APP_ROUTE = '/';
const DEFAULT_TITLE = 'Doorriing Seller';
const DEFAULT_BODY = 'You have a new update';
const DEFAULT_ICON = '/Doorriing-seller.png';
const DEFAULT_BADGE = '/Doorriing-seller.png';

const normalizeTargetUrl = (value) => {
    const fallbackRoute = DEFAULT_APP_ROUTE;

    try {
        const url = new URL(value || fallbackRoute, self.location.origin);
        if (url.origin !== self.location.origin) {
            return new URL(fallbackRoute, self.location.origin).href;
        }

        return url.href;
    } catch (error) {
        const normalized = String(value || fallbackRoute).trim();
        const pathname = normalized.startsWith('/') ? normalized : `/${normalized}`;
        return new URL(pathname, self.location.origin).href;
    }
};

const resolveNotificationUrl = (payload) => {
    const data = payload?.data || {};
    const target =
        data.url ||
        data.click_action ||
        data.route ||
        payload?.fcmOptions?.link ||
        payload?.notification?.click_action ||
        DEFAULT_APP_ROUTE;

    return normalizeTargetUrl(target);
};

const buildNotificationOptions = (payload) => {
    const notification = payload?.notification || {};
    const data = payload?.data || {};
    const resolvedUrl = resolveNotificationUrl(payload);

    return {
        body: notification.body || data.body || data.message || DEFAULT_BODY,
        icon: notification.icon || data.icon || DEFAULT_ICON,
        badge: notification.badge || data.badge || DEFAULT_BADGE,
        image: notification.image || data.image || undefined,
        vibrate: [200, 100, 200],
        tag: data.tag || data.referenceId || data.reference_id || notification.tag || 'doorriing-notification',
        renotify: true,
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View',
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
            },
        ],
        data: {
            ...data,
            url: resolvedUrl,
            click_action: resolvedUrl,
        },
    };
};

const findBestClient = async (targetUrl) => {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!clientList.length) {
        return null;
    }

    const target = new URL(targetUrl);

    const exactMatch = clientList.find((client) => client.url === target.href);
    if (exactMatch) {
        return exactMatch;
    }

    const samePath = clientList.find((client) => {
        try {
            const clientUrl = new URL(client.url);
            return clientUrl.origin === target.origin && clientUrl.pathname === target.pathname;
        } catch (error) {
            return false;
        }
    });

    if (samePath) {
        return samePath;
    }

    return clientList.find((client) => {
        try {
            return new URL(client.url).origin === target.origin;
        } catch (error) {
            return false;
        }
    }) || clientList[0];
};

onBackgroundMessage(messaging, (payload) => {
    const notification = payload?.notification || {};
    const title = notification.title || payload?.data?.title || DEFAULT_TITLE;
    self.registration.showNotification(title, buildNotificationOptions(payload));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const targetUrl = normalizeTargetUrl(
        event.notification?.data?.url || event.notification?.data?.click_action || DEFAULT_APP_ROUTE
    );

    event.waitUntil(
        (async () => {
            const client = await findBestClient(targetUrl);

            if (client) {
                const focusedClient = await client.focus();

                if ('navigate' in focusedClient) {
                    await focusedClient.navigate(targetUrl);
                }

                return focusedClient;
            }

            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }

            return null;
        })()
    );
});
