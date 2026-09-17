'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';

// Site-wide payment-safety reminder. Mirrors the floating chat launcher, but
// on the opposite (left) edge so the two never collide. It surfaces as a
// repeating pop-up: a full minute on screen, long enough to read without
// hurrying, then a short pause before it returns. The pause is randomised so
// the reappearance does not feel like clockwork. Closing it is the only way
// to stop the cycle, and that choice is final: the alert never appears again
// on any page, in any later session.
const DISMISS_KEY = 'tr_payment_safety_alert_dismissed';

const FIRST_DELAY_MS = 10_000; // breathing room after the page settles
const VISIBLE_MS = 60_000; // a full minute to read it, unhurried
const HIDDEN_MIN_MS = 15_000; // shortest pause before it comes back
const HIDDEN_MAX_MS = 30_000; // longest pause before it comes back

// Randomised so the pop-up does not return on a predictable beat.
function pauseBeforeReturn(): number {
  return HIDDEN_MIN_MS + Math.random() * (HIDDEN_MAX_MS - HIDDEN_MIN_MS);
}

function readDismissed(): boolean {
  // Private mode / blocked site data can throw on access, in which case we
  // simply treat the alert as not-yet-dismissed for this session.
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function PaymentSafetyFloatingAlert() {
  // Starts dismissed so nothing can flash before localStorage has been read
  // on the client; the effect below opens the gate when it is genuinely unseen.
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());

    // If it is closed in another tab, drop it here too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === DISMISS_KEY && e.newValue === '1') {
        setDismissed(true);
        setVisible(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (dismissed) return;

    let timer: ReturnType<typeof setTimeout>;

    const hide = () => {
      setVisible(false);
      timer = setTimeout(show, pauseBeforeReturn());
    };

    function show() {
      setVisible(true);
      timer = setTimeout(hide, VISIBLE_MS);
    }

    timer = setTimeout(show, FIRST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Storage unavailable — it still stays gone for the rest of this session.
    }
    setVisible(false);
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`fixed z-50 bottom-20 left-4 lg:bottom-6 lg:left-6 w-[min(19rem,calc(100vw-2rem))] transition-all duration-500 ease-out motion-reduce:transition-none ${
        visible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-6 pointer-events-none'
      }`}
    >
      <div className="relative rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 shadow-2xl p-3.5 pr-9">
        <div className="absolute inset-0 rounded-xl border-2 border-red-400 animate-pulse pointer-events-none motion-reduce:animate-none" />

        {/* Diagonal light sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div className="tr-safety-sweep absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close this notice and do not show it again"
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-red-700/70 hover:text-red-900 hover:bg-red-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex items-start gap-2.5">
          <div className="relative w-8 h-8 shrink-0">
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping motion-reduce:animate-none" />
            <div className="tr-safety-icon-breathe relative w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug text-red-800">
              Please Keep Every Payment and Conversation on TransRentals
            </p>
            <p className="text-[12px] leading-relaxed text-gray-700 mt-1">
              Paying a vendor outside the platform leaves your booking unprotected. If anyone asks
              you to, please decline and report it to us.
            </p>
            <Link
              href="/safety-security"
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-300 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition-colors hover:bg-white hover:text-red-900"
            >
              Learn more
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
