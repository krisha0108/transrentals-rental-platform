'use client';

import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 20_000; // 20 seconds (more frequent for drivers)

/**
 * Polls /api/driver/notifications every 20 seconds and shows Browser
 * Notification API popups when new unread notifications arrive.
 * Works for the driver web/PWA — no Firebase Web SDK needed.
 * Auth is via cookie (driver-token) set during login.
 */
export function useDriverWebNotifications() {
  const shownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const poll = async () => {
      try {
        if (Notification.permission !== 'granted') return;

        const res = await fetch('/api/driver/notifications', {
          credentials: 'include', // sends driver-token cookie
        });
        if (!res.ok) return;

        const { notifications } = await res.json();
        if (!Array.isArray(notifications)) return;

        if (!initialized.current) {
          // First poll: pre-fill shownIds so we don't re-show old notifications
          notifications.forEach((n: any) => shownIds.current.add(n.id));
          initialized.current = true;
          return;
        }

        // Show browser notification for each new unread one
        const newOnes = notifications.filter(
          (n: any) => !n.read && !shownIds.current.has(n.id)
        );

        for (const notif of newOnes.slice(0, 3)) {
          shownIds.current.add(notif.id);
          try {
            const bNotif = new Notification(notif.title || 'New Notification', {
              body: notif.body || '',
              icon: '/favicon.ico',
              tag: notif.id, // prevents duplicate system popups
              requireInteraction: true, // stays until driver taps it
            });
            bNotif.onclick = () => {
              window.focus();
              // Navigate to bookings list if booking-related
              if (notif.bookingNumber) {
                window.location.href = `/driver/bookings`;
              }
              bNotif.close();
            };
          } catch (_) {
            // Ignore if notification creation fails (e.g., focus check on some browsers)
          }
        }

        // Auto-mark shown notifications as read
        if (newOnes.length > 0) {
          fetch('/api/driver/notifications', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'markRead',
              notificationIds: newOnes.map((n: any) => n.id),
            }),
          }).catch(() => {});
        }
      } catch (_) {
        // Silent fail — never break the UI
      }
    };

    // First poll after 3 s (let auth settle), then every 20 s
    const initialTimer = setTimeout(poll, 3_000);
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
}
