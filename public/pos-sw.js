// MenuVibe POS Service Worker
// Handles Web Push notifications even when the app is closed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'New Order', body: event.data.text() };
  }

  const title   = data.title  || '🍽 New Order';
  const options = {
    body:    data.body    || 'A new order has been placed.',
    icon:    data.icon    || '/menuvibe-logo.png',
    badge:   data.badge   || '/menuvibe-logo.png',
    vibrate: [200, 100, 200, 100, 200],
    tag:     'new-order',
    renotify: true,
    data:    data.data    || {},
    actions: [
      { action: 'open', title: '📋 View Orders' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const locationId = event.notification.data?.locationId;
  const url = locationId ? `/pos/${locationId}` : '/pos';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing POS tab if open
      for (const client of clientList) {
        if (client.url.includes('/pos') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Cache strategy: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return; // Skip API calls
  // Let Next.js handle everything else
});
