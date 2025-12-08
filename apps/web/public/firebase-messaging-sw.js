// Firebase Cloud Messaging Service Worker
// This file must be in the public directory and served from the root

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here if you have imported
// the service worker script from a CDN.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// This config should match the one in your app (lib/firebase.ts)
// Note: In production, consider fetching this from an endpoint or using environment-specific scripts
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY_PLACEHOLDER',
  authDomain: 'YOUR_AUTH_DOMAIN_PLACEHOLDER',
  projectId: 'YOUR_PROJECT_ID_PLACEHOLDER',
  storageBucket: 'YOUR_STORAGE_BUCKET_PLACEHOLDER',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID_PLACEHOLDER',
  appId: 'YOUR_APP_ID_PLACEHOLDER',
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    tag: payload.data?.category || 'general',
    data: {
      url: payload.data?.clickAction || payload.fcmOptions?.link || '/',
      ...payload.data,
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png',
      },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  // Handle action clicks
  if (event.action === 'view') {
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if no matching window found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the URL
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle push event (alternative to onBackgroundMessage)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);

  if (event.data) {
    const data = event.data.json();
    const notificationTitle = data.notification?.title || 'New Notification';
    const notificationOptions = {
      body: data.notification?.body || 'You have a new notification',
      icon: data.notification?.icon || '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
  }
});

// Optional: Add service worker lifecycle logging
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim());
});
