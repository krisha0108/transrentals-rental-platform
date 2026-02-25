'use client';

import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 30_000; // 30 seconds

/**
 * Polls the vendor notifications API and shows Browser Notification API popups
 * when new unread notifications arrive. Works only on the vendor web dashboard.
 * No Firebase Web SDK needed — uses the existing REST polling endpoint.
 */
export function useVendorWebNotifications() {
  const shownIds = useRef<Set<string>>(new Set());
  const lastCount = useRef<number>(-1);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Ask for permission once
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const poll = async () => {
      try {
        if (Notification.permission !== 'granted') return;

        // Lightweight check: get unread count
        const countRes = await fetch('/api/vendor/notifications/unread-count', {
          credentials: 'include',
        });
        if (!countRes.ok) return;
        const { unreadCount } = await countRes.json();

        if (lastCount.current === -1) {
          // First poll — just record baseline, don't show old notifications
          lastCount.current = unreadCount;
          // Still pre-fill shownIds so we don't re-show existing ones
          if (unreadCount > 0) {
            const notifRes = await fetch('/api/vendor/notifications', { credentials: 'include' });
            if (notifRes.ok) {
              const { notifications } = await notifRes.json();
              (notifications || []).forEach((n: any) => shownIds.current.add(n.id));
            }
          }
          return;
        }

        if (unreadCount > lastCount.current) {
          // New notifications arrived — fetch full list and show new ones
          const notifRes = await fetch('/api/vendor/notifications', { credentials: 'include' });
          if (!notifRes.ok) return;
          const { notifications } = await notifRes.json();

          const newOnes = (notifications || []).filter(
            (n: any) => !n.read && !shownIds.current.has(n.id)
          );

          for (const notif of newOnes.slice(0, 3)) {
            shownIds.current.add(notif.id);
            try {
              const bNotif = new Notification(notif.title || 'New Notification', {
                body: notif.body || '',
                icon: '/favicon.ico',
                tag: notif.id, // Prevents duplicate system popups
              });
              // Click → focus the window
              bNotif.onclick = () => {
                window.focus();
                bNotif.close();
              };
            } catch (_) {
              // Ignore if notification creation fails
            }
          }
        }

        lastCount.current = unreadCount;
      } catch (_) {
        // Silent fail — never break the UI
      }
    };

    // First poll after 5 s (let page settle), then every 30 s
    const initialTimer = setTimeout(poll, 5_000);
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
}
