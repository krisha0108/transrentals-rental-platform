// Firebase Messaging Service Worker
// Handles background push notifications for the driver web portal

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDbzt9FghIxEPbr_eQzEVszzME7rktebFU',
  authDomain: 'transrentals-5f65e.firebaseapp.com',
  projectId: 'transrentals-5f65e',
  storageBucket: 'transrentals-5f65e.firebasestorage.app',
  messagingSenderId: '365663447950',
  appId: '1:365663447950:web:1d6d8747882d4f7b4f52df',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};

  const notifTitle = title || 'New Notification';
  const notifOptions = {
    body: body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.bookingNumber || 'driver-notif',
    requireInteraction: true,
    data: {
      bookingNumber: data.bookingNumber || '',
      url: data.bookingNumber
        ? `/driver/bookings/${data.bookingNumber}`
        : '/driver/notifications',
    },
  };

  self.registration.showNotification(notifTitle, notifOptions);
});

// Navigate to booking when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/driver/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If tab already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes('/driver') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
