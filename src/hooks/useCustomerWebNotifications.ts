'use client';

import { useEffect, useRef } from 'react';

const POLL_INTERVAL = 30_000; // 30 seconds

/**
 * Polls the customer notifications API and shows Browser Notification API popups
 * when new unread notifications arrive. Reads customer_id from localStorage
 * (set during login). No Firebase Web SDK needed.
 */
export function useCustomerWebNotifications() {
  const shownIds = useRef<Set<string | number>>(new Set());
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

        // Get customer ID from localStorage (set on login)
        const stored = localStorage.getItem('customer');
        if (!stored) return;
        const customer = JSON.parse(stored);
        const customerId = customer?.id;
        if (!customerId) return;

        // Lightweight check: get unread count
        const countRes = await fetch(
          `/api/customer/notifications/unread-count?customer_id=${customerId}`
        );
        if (!countRes.ok) return;
        const json = await countRes.json();
        const unreadCount: number = json.total_unread ?? 0;

        if (lastCount.current === -1) {
          // First poll — record baseline, pre-fill shownIds for existing notifications
          lastCount.current = unreadCount;
          if (unreadCount > 0) {
            const notifRes = await fetch(
              `/api/customer/notifications?customer_id=${customerId}`
            );
            if (notifRes.ok) {
              const data = await notifRes.json();
              (data.notifications || []).forEach((n: any) => shownIds.current.add(n.id));
            }
          }
          return;
        }

        if (unreadCount > lastCount.current) {
          // New notifications arrived — fetch and show
          const notifRes = await fetch(
            `/api/customer/notifications?customer_id=${customerId}`
          );
          if (!notifRes.ok) return;
          const data = await notifRes.json();

          const newOnes = (data.notifications || []).filter(
            (n: any) => !n.is_read && !shownIds.current.has(n.id)
          );

          for (const notif of newOnes.slice(0, 3)) {
            shownIds.current.add(notif.id);
            try {
              const bNotif = new Notification(notif.title || 'New Notification', {
                body: notif.body || '',
                icon: '/favicon.ico',
                tag: String(notif.id),
              });
              bNotif.onclick = () => {
                window.focus();
                bNotif.close();
              };
            } catch (_) {
              // Ignore
            }
          }
        }

        lastCount.current = unreadCount;
      } catch (_) {
        // Silent fail
      }
    };

    const initialTimer = setTimeout(poll, 5_000);
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
}
