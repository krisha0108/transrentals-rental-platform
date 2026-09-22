'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  CalendarDays,
  Car,
  ChevronRight,
  History,
  Home,
  Search,
  Star,
  User,
  Wallet,
} from 'lucide-react';

/**
 * The driver-app phone, tilting toward the cursor.
 *
 * A fixed hover transform looked the same wherever you pointed, which reads as
 * a picture rather than an object. Here the rotation tracks the pointer's
 * position over the device, so moving across it turns the phone as though it
 * were sitting on the page, and a glare highlight follows the same point.
 *
 * Pointer maths runs through requestAnimationFrame and writes straight to the
 * node's style, so a fast mouse cannot queue up more work than a frame can
 * absorb and React never re-renders on move. Touch devices never fire these
 * events and get the resting state, as does anyone who asked their OS to
 * reduce motion.
 */

const MAX_TILT = 11; // degrees; beyond this the screen starts to look bent

export function DriverPhoneFrame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  const apply = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    const frame = frameRef.current;
    if (!el || !frame) return;

    const r = el.getBoundingClientRect();
    // -0.5 … 0.5 from the centre of the device
    const px = (clientX - r.left) / r.width - 0.5;
    const py = (clientY - r.top) / r.height - 0.5;

    frame.style.transform =
      'rotateY(' + (px * MAX_TILT * 2).toFixed(2) + 'deg) ' +
      'rotateX(' + (-py * MAX_TILT * 2).toFixed(2) + 'deg) ' +
      'translateY(-10px) scale(1.02)';

    if (glareRef.current) {
      glareRef.current.style.background =
        'radial-gradient(420px circle at ' +
        ((px + 0.5) * 100).toFixed(1) + '% ' +
        ((py + 0.5) * 100).toFixed(1) + '%, rgba(255,255,255,.16), transparent 55%)';
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const { clientX, clientY } = e;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => apply(clientX, clientY));
    },
    [apply]
  );

  const onPointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setActive(true);
  }, []);

  const onPointerLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setActive(false);
    if (frameRef.current) frameRef.current.style.transform = '';
    if (glareRef.current) glareRef.current.style.background = '';
  }, []);

  return (
    <div
      ref={wrapRef}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="group/phone relative mx-auto w-[292px] [perspective:1100px]"
    >
      {/* glow — brightens while the pointer is over the device */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-10 rounded-full blur-3xl transition-all duration-500 ${
          active ? 'bg-emerald-300/35' : 'bg-emerald-400/20'
        }`}
      />

      <div
        ref={frameRef}
        className="relative [transform-style:preserve-3d] will-change-transform"
        style={{ transition: active ? 'transform .12s ease-out' : 'transform .6s ease-out' }}
      >
        {/* glare follows the pointer across the glass */}
        <span
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 rounded-[2.9rem] transition-opacity duration-300"
          style={{ opacity: active ? 1 : 0 }}
        />

        {/* side buttons */}
        <span
          aria-hidden
          className="absolute -left-[3px] top-[110px] h-9 w-[3px] rounded-l bg-gray-500/80"
        />
        <span
          aria-hidden
          className="absolute -left-[3px] top-[160px] h-9 w-[3px] rounded-l bg-gray-500/80"
        />
        <span
          aria-hidden
          className="absolute -right-[3px] top-[140px] h-14 w-[3px] rounded-r bg-gray-500/80"
        />

        {/* titanium rail → frame → screen */}
        <div className="relative rounded-[2.9rem] bg-gradient-to-b from-gray-400 via-gray-600 to-gray-800 p-[2px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.75)] transition-shadow duration-300">
          <div className="rounded-[2.8rem] bg-black p-[10px]">
            <div className="relative overflow-hidden rounded-[2.15rem] bg-emerald-50">
              {/* dynamic island */}
              <div className="absolute left-1/2 top-[9px] z-20 flex h-[26px] w-[95px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5">
                <span className="h-[9px] w-[9px] rounded-full bg-gray-800 ring-1 ring-gray-700" />
              </div>

              {/* status bar */}
              <div className="relative z-10 flex items-center justify-between bg-emerald-600 px-5 pb-0.5 pt-3 text-[11px] font-semibold text-white">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 18 12" className="h-2.5 w-4" fill="currentColor" aria-hidden>
                    <rect x="0" y="8" width="3" height="4" rx="1" />
                    <rect x="4.5" y="6" width="3" height="6" rx="1" />
                    <rect x="9" y="3" width="3" height="9" rx="1" />
                    <rect x="13.5" y="0" width="3" height="12" rx="1" />
                  </svg>
                  <svg viewBox="0 0 16 12" className="h-2.5 w-3.5" fill="currentColor" aria-hidden>
                    <path d="M8 10.5 10.5 8a3.5 3.5 0 0 0-5 0L8 10.5Zm0-4.8a6 6 0 0 1 4.3 1.8l1.4-1.4a8 8 0 0 0-11.4 0l1.4 1.4A6 6 0 0 1 8 5.7Z" />
                  </svg>
                  <span className="ml-0.5 flex h-2.5 w-5 items-center rounded-[3px] border border-white/70 p-[1.5px]">
                    <span className="h-full w-4/5 rounded-[1px] bg-white" />
                  </span>
                </span>
              </div>

              {/* ── green header ── */}
              <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 pb-5 pt-2 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-emerald-100/80">Good Afternoon</p>
                    <p className="mt-0.5 text-[19px] font-black leading-none">mehul 👋</p>
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
                    <Bell className="h-4 w-4" />
                  </span>
                </div>

                {/* employer chip */}
                <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5">
                  <Briefcase className="h-3 w-3 shrink-0 text-emerald-600" />
                  <span className="truncate text-[9.5px] font-bold text-gray-800">
                    TransRentals India Pvt Ltd
                  </span>
                  <span className="text-[9px] text-gray-400">· Staff Driver</span>
                </div>

                {/* month-to-date card */}
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-2.5">
                  {[
                    { Icon: Wallet, v: '₹8,700', l: 'This Month', tint: 'bg-emerald-400/25' },
                    { Icon: Star, v: '—', l: 'Avg Rating', tint: 'bg-amber-400/25' },
                    { Icon: Car, v: '27', l: 'Total Trips', tint: 'bg-sky-400/25' },
                  ].map(({ Icon, v, l, tint }) => (
                    <div key={l} className="text-center">
                      <span
                        className={`mx-auto grid h-6 w-6 place-items-center rounded-lg ${tint}`}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <p className="mt-1 text-[12px] font-black leading-none tabular-nums">{v}</p>
                      <p className="mt-0.5 text-[8px] text-emerald-100/70">{l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── body ── */}
              <div className="space-y-2.5 bg-emerald-50/60 px-3 pb-2 pt-3">
                {/* trip counters */}
                <div className="grid grid-cols-3 rounded-2xl bg-white py-2.5 shadow-sm">
                  {[
                    { v: '27', l: 'Total', c: 'text-gray-900' },
                    { v: '12', l: 'Completed', c: 'text-emerald-600' },
                    { v: '15', l: 'Active', c: 'text-amber-500' },
                  ].map((s) => (
                    <div key={s.l} className="text-center">
                      <p className={`text-[15px] font-black leading-none tabular-nums ${s.c}`}>
                        {s.v}
                      </p>
                      <p className="mt-0.5 text-[8px] text-gray-400">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* quick actions */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { Icon: Search, l: 'Find Trips', bg: 'bg-emerald-100', fg: 'text-emerald-600' },
                    { Icon: Car, l: 'My Fleet', bg: 'bg-sky-100', fg: 'text-sky-600' },
                    { Icon: Wallet, l: 'Earnings', bg: 'bg-violet-100', fg: 'text-violet-600' },
                    { Icon: History, l: 'History', bg: 'bg-amber-100', fg: 'text-amber-600' },
                  ].map(({ Icon, l, bg, fg }) => (
                    <div
                      key={l}
                      className="rounded-xl bg-white py-2.5 text-center shadow-sm"
                    >
                      <span className={`mx-auto grid h-7 w-7 place-items-center rounded-lg ${bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${fg}`} />
                      </span>
                      <p className="mt-1.5 text-[8px] font-semibold text-gray-600">{l}</p>
                    </div>
                  ))}
                </div>

                {/* available bookings */}
                <div className="flex items-center justify-between px-0.5 pt-0.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-black text-gray-900">
                    Available Bookings
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-[8px] font-bold text-white">
                      1
                    </span>
                  </p>
                  <span className="text-[9px] font-semibold text-emerald-600">See all →</span>
                </div>

                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <span className="text-[8px] font-bold tracking-wide text-sky-600">
                      CB-2026-RAYE2E
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700">
                      New
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] font-black text-gray-900">
                    Ahmedabad → Ahmedabad
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 text-[8px] font-medium text-gray-500">
                      <CalendarDays className="h-2.5 w-2.5" />
                      11 Apr, 5:30 AM
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 text-[8px] font-medium text-gray-500">
                      <Car className="h-2.5 w-2.5" />
                      sedan
                    </span>
                  </div>
                  <p className="mt-2.5 flex items-center gap-1 border-t border-gray-100 pt-2 text-[9px] font-bold text-emerald-600">
                    Tap to view &amp; accept
                    <ChevronRight className="h-2.5 w-2.5" />
                  </p>
                </div>
              </div>

              {/* ── bottom nav ── */}
              <div className="flex items-center justify-around bg-white px-2 pb-3 pt-2">
                {[
                  { Icon: Home, l: 'Home', on: true },
                  { Icon: CalendarDays, l: 'Bookings', on: false },
                  { Icon: Car, l: 'Fleet', on: false },
                  { Icon: Wallet, l: 'Earnings', on: false },
                  { Icon: User, l: 'Profile', on: false },
                ].map(({ Icon, l, on }) => (
                  <span
                    key={l}
                    className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 ${
                      on ? 'bg-emerald-600 text-white' : 'text-gray-400'
                    }`}
                  >
                    <Icon className="h-[13px] w-[13px]" />
                    <span className="text-[7.5px] font-semibold">{l}</span>
                  </span>
                ))}
              </div>

              {/* home indicator */}
              <div className="flex justify-center bg-white pb-1.5">
                <span className="h-1 w-24 rounded-full bg-gray-900/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
