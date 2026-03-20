// firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker for Doorriing Seller
// Supports both dynamic configuration (via query params) and hardcoded fallbacks

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// 1. Get configuration from URL parameters (dynamic source)
const params = new URL(self.location).searchParams;

// 2. Define fallback configuration (hardcoded source as backup)
// These values are "baked" in based on the .env file during standardizing process
const fallbackConfig = {
    apiKey: "AIzaSyDx0UGfBc-5hC539VVksN011N5DImznzEQ",
    authDomain: "bazarse-d4963.firebaseapp.com",
    projectId: "bazarse-d4963",
    storageBucket: "bazarse-d4963.firebasestorage.app",
    messagingSenderId: "1049973675081",
    appId: "1:1049973675081:web:44a9e65e94c375e0ab5b98"
};

const firebaseConfig = {
    apiKey: params.get('apiKey') || fallbackConfig.apiKey,
    authDomain: params.get('authDomain') || fallbackConfig.authDomain,
    projectId: params.get('projectId') || fallbackConfig.projectId,
    storageBucket: params.get('storageBucket') || fallbackConfig.storageBucket,
    messagingSenderId: params.get('messagingSenderId') || fallbackConfig.messagingSenderId,
    appId: params.get('appId') || fallbackConfig.appId,
};

// No log

// 3. Initialize Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// 4. Background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Received background message:', payload);

    const notificationTitle = payload.notification?.title || "New Message";
    const notificationOptions = {
        body: payload.notification?.body || "Check your app for details",
        icon: "/logo.png",
        badge: "/logo.png",
        data: payload.data,
        tag: payload.data?.order_id || 'general-notification',
        renotify: true,
        requireInteraction: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM-SW] Notification clicked:', event.notification);
    event.notification.close();

    const orderId = event.notification.data?.order_id;
    const path = orderId ? `/orders?id=${orderId}` : '/orders';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.postMessage({ type: 'NOTIFICATION_CLICK', path });
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(path);
            }
        })
    );
});
