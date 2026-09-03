'use client';

// Custom-styled date & time pickers standing in for native
// <input type="date">/<input type="time">, so every browser/OS shows the
// same widget instead of its own native picker UI. Adapted from the
// marketplace hero's inline MiniDateInput/MiniTimeInput (worktree
// worktree-marketplace-custom-timepicker, src/app/marketplace/page.tsx) —
// pulled out here so other booking forms (e.g. CarSearchHero) can reuse the
// same calendar/time-list logic. Unlike the marketplace originals, these
// don't render their own label — callers that already show their own label
// above the field (like CarSearchHero) just get the trigger + dropdown.

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function ymdToDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function MiniDateInput({
  value, onChange, min, error, placeholder = 'dd/mm/yyyy', triggerClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  error?: string;
  placeholder?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ? ymdToDate(value) : min ? ymdToDate(min) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Jump the visible month back to the selected/min date whenever the
  // picker is reopened, so it doesn't stay stuck wherever it was last browsed.
  useEffect(() => {
    if (!open) return;
    const base = value ? ymdToDate(value) : min ? ymdToDate(min) : new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const minDate = min ? ymdToDate(min) : null;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const monthLabel = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const canGoPrevMonth = !minDate || new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0) >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  const displayText = value
    ? ymdToDate(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : placeholder;

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3.5 border-2 rounded-xl text-base text-left bg-white transition-all',
          open ? 'border-primary ring-2 ring-primary/30' : (error ? 'border-red-500' : 'border-gray-200'),
          triggerClassName,
        )}
      >
        <span className={value ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>{displayText}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] font-bold text-slate-900">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold text-slate-400">
            {WEEKDAY_LABELS.map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const thisYmd = dateToYmd(thisDate);
              const isDisabled = !!minDate && thisDate < minDate;
              const isSelected = thisYmd === value;
              return (
                <div key={day} className="flex items-center justify-center">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { onChange(thisYmd); setOpen(false); }}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors',
                      isSelected
                        ? 'bg-primary text-white'
                        : isDisabled
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-slate-700 hover:bg-primary-50',
                    )}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeSlot(t: string) {
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
})();

export function MiniTimeInput({
  value, onChange, error, placeholder = 'Select Time', triggerClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Scroll the selected (or nearest) slot into view whenever the panel opens,
  // instead of always starting the list at 12:00 AM.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3.5 border-2 rounded-xl text-base text-left bg-white transition-all',
          open ? 'border-primary ring-2 ring-primary/30' : (error ? 'border-red-500' : 'border-gray-200'),
          triggerClassName,
        )}
      >
        <span className={value ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>{value ? formatTimeSlot(value) : placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div ref={listRef} className="absolute left-0 top-full z-[60] mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl">
          {TIME_SLOTS.map((t) => {
            const isSelected = t === value;
            return (
              <button
                key={t}
                type="button"
                data-active={isSelected ? 'true' : undefined}
                onClick={() => { onChange(t); setOpen(false); }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
                  isSelected ? 'font-semibold text-primary-700' : 'text-slate-700',
                )}
              >
                {formatTimeSlot(t)}
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
