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

const normalizeClickAction = (payload) => {
    const data = payload?.data || {};
    const route =
        data.click_action ||
        data.route ||
        payload?.fcmOptions?.link ||
        payload?.notification?.click_action ||
        '/';

    try {
        const url = new URL(route, self.location.origin);
        if (url.origin !== self.location.origin) {
            return '/';
        }

        return `${url.pathname}${url.search}${url.hash}`;
    } catch (error) {
        return String(route || '/').startsWith('/') ? route : `/${route}`;
    }
};

onBackgroundMessage(messaging, (payload) => {
    const notification = payload?.notification || {};
    const title = notification.title || payload?.data?.title || 'New notification';
    const body = notification.body || payload?.data?.body || payload?.data?.message || '';
    const clickAction = normalizeClickAction(payload);

    self.registration.showNotification(title, {
        body,
        icon: notification.icon || '/icons/icon-192.png',
        badge: notification.badge || '/icons/icon-192.png',
        image: notification.image || payload?.data?.image || undefined,
        data: {
            ...payload?.data,
            click_action: clickAction,
        },
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetRoute = event.notification?.data?.click_action || '/';
    const targetUrl = new URL(targetRoute, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin)) {
                    return client.focus().then(() => {
                        if ('navigate' in client) {
                            return client.navigate(targetUrl);
                        }

                        return client;
                    });
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }

            return null;
        })
    );
});
