'use client';

/**
 * Firebase Web SDK — client-side only.
 * Gracefully skips if env vars are not configured.
 *
 * Required env vars (add to .env):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_VAPID_KEY
 *
 * project_id, authDomain, storageBucket are derived from the project.
 */

let messagingInstance: any = null;
let initialized = false;

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDbzt9FghIxEPbr_eQzEVszzME7rktebFU',
  authDomain: 'transrentals-5f65e.firebaseapp.com',
  projectId: 'transrentals-5f65e',
  storageBucket: 'transrentals-5f65e.firebasestorage.app',
  messagingSenderId: '365663447950',
  appId: '1:365663447950:web:1d6d8747882d4f7b4f52df',
};

// VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function initFirebaseMessaging(): Promise<any | null> {
  if (initialized) return messagingInstance;
  initialized = true;

  if (!VAPID_KEY) {
    console.warn('[Firebase Web] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — web push disabled');
    return null;
  }

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);

    // Register service worker
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
      if (token) {
        messagingInstance = { messaging, token };
      }
    }

    return messagingInstance;
  } catch (e) {
    console.warn('[Firebase Web] Init failed:', e);
    return null;
  }
}
