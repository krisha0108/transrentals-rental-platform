'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Car,
  X,
  Trash2,
  Edit2,
  Filter,
  ListFilter,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Fleet {
  id: string;
  vehicleName: string;
  vehicleType: string;
  registrationNumber: string | null;
  isActive: boolean;
}

interface Booking {
  id: string;
  fleetId: string;
  startDate: string;
  endDate: string;
  bookingType: 'CUSTOMER' | 'MANUAL_BLOCK' | 'MAINTENANCE' | 'RESERVED';
  status: 'CONFIRMED' | 'TENTATIVE' | 'COMPLETED' | 'CANCELLED';
  customerName: string | null;
  customerPhone: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  amount: number | null;
  notes: string | null;
  vehicleName?: string;
  registrationNumber?: string | null;
}

const TYPE_COLORS: Record<
  string,
  { bg: string; text: string; soft: string; softText: string; label: string }
> = {
  CUSTOMER:     { bg: 'bg-emerald-500',  text: 'text-white', soft: 'bg-emerald-100', softText: 'text-emerald-800', label: 'Booking' },
  MANUAL_BLOCK: { bg: 'bg-slate-500',    text: 'text-white', soft: 'bg-slate-100',   softText: 'text-slate-800',   label: 'Blocked' },
  MAINTENANCE:  { bg: 'bg-amber-500',    text: 'text-white', soft: 'bg-amber-100',   softText: 'text-amber-800',   label: 'Maintenance' },
  RESERVED:     { bg: 'bg-indigo-500',   text: 'text-white', soft: 'bg-indigo-100',  softText: 'text-indigo-800',  label: 'Reserved' },
};

const WEEK_STARTS_ON = 1; // 0 = Sunday, 1 = Monday
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── date helpers ───────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function diffDays(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtRange(a: string | Date, b: string | Date) {
  const f = new Date(a);
  const t = new Date(b);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${fmt(f)} → ${fmt(t)}`;
}

// Day-of-week index relative to WEEK_STARTS_ON (0..6)
function dowIndex(d: Date) {
  const real = d.getDay(); // 0=Sun..6=Sat
  return (real - WEEK_STARTS_ON + 7) % 7;
}

// Build the matrix of weeks shown for a month (each week = 7 dates).
// Includes leading/trailing days from adjacent months so the grid is full.
function buildMonthMatrix(anchor: Date) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = addDays(firstOfMonth, -dowIndex(firstOfMonth));
  const totalDays = dowIndex(firstOfMonth) + lastOfMonth.getDate();
  const weeksCount = Math.ceil(totalDays / 7);
  const totalCells = weeksCount * 7;

  const days: Date[] = [];
  for (let i = 0; i < totalCells; i++) days.push(addDays(gridStart, i));
  const weeks: Date[][] = [];
  for (let w = 0; w < weeksCount; w++) weeks.push(days.slice(w * 7, w * 7 + 7));
  return { weeks, gridStart, weeksCount };
}

// Compute "lanes" inside one week so overlapping multi-day bars stack nicely
function laneBarsForWeek(
  weekStart: Date,
  weekEnd: Date,
  bookings: Booking[],
): Array<Booking & { _startCol: number; _endCol: number; _lane: number }> {
  // Items overlapping the week, segmented to this week's [startCol..endCol]
  const segments = bookings
    .map((b) => {
      const bs = startOfDay(new Date(b.startDate));
      const be = startOfDay(new Date(b.endDate));
      if (be < weekStart || bs > weekEnd) return null;
      const startCol = Math.max(0, diffDays(weekStart, bs));
      const endCol = Math.min(6, diffDays(weekStart, be));
      return { ...b, _startCol: startCol, _endCol: endCol };
    })
    .filter(Boolean) as Array<Booking & { _startCol: number; _endCol: number }>;

  // Sort by start column then by total span (longer bars first for nicer stacking)
  segments.sort((a, b) => a._startCol - b._startCol || (b._endCol - b._startCol) - (a._endCol - a._startCol));

  // Greedy lane assignment per week
  const laneEnds: number[] = []; // last endCol used in each lane
  const result: Array<Booking & { _startCol: number; _endCol: number; _lane: number }> = [];
  for (const s of segments) {
    let lane = laneEnds.findIndex((end) => end < s._startCol);
    if (lane === -1) {
      laneEnds.push(s._endCol);
      lane = laneEnds.length - 1;
    } else {
      laneEnds[lane] = s._endCol;
    }
    result.push({ ...s, _lane: lane });
  }
  return result;
}

const MAX_VISIBLE_LANES = 3; // remaining shown as "+N more"

export default function FleetCalendarPage() {
  const { showToast } = useToast();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'ALL' | Booking['bookingType']>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL'); // fleetId or 'ALL'

  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const { weeks } = useMemo(() => buildMonthMatrix(anchor), [anchor]);

  // Modal state
  const [modal, setModal] = useState<null | {
    mode: 'create' | 'edit';
    booking?: Booking;
    initialFleetId?: string;
    initialDate?: Date;
  }>(null);

  // Day-detail popover
  const [dayDetail, setDayDetail] = useState<null | { date: Date; items: Booking[] }>(null);

  const loadFleets = async () => {
    const res = await fetch('/api/travel-agent/fleet');
    if (res.ok) {
      const j = await res.json();
      setFleets((j.fleets || []).filter((f: Fleet) => f.isActive));
    }
  };

  const loadBookings = async () => {
    // Fetch a generous window: from 1 week before grid start to ~6 weeks
    const gridStart = addDays(anchor, -7);
    const gridEnd = addDays(anchor, 49);
    const from = gridStart.toISOString();
    const to = gridEnd.toISOString();
    const res = await fetch(`/api/travel-agent/fleet/bookings?from=${from}&to=${to}`);
    if (res.ok) {
      const j = await res.json();
      setBookings(j.bookings || []);
    }
  };

  const reload = async () => {
    setLoading(true);
    await Promise.all([loadFleets(), loadBookings()]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  // Apply filters once
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status === 'CANCELLED') return false;
      if (typeFilter !== 'ALL' && b.bookingType !== typeFilter) return false;
      if (vehicleFilter !== 'ALL' && b.fleetId !== vehicleFilter) return false;
      return true;
    });
  }, [bookings, typeFilter, vehicleFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const res = await fetch(`/api/travel-agent/fleet/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast({ type: 'success', title: 'Removed from calendar' });
      await loadBookings();
      setModal(null);
    } else {
      const j = await res.json().catch(() => ({}));
      showToast({ type: 'error', title: j.error || 'Failed to delete' });
    }
  };

  const today = startOfDay(new Date());
  const monthLabel = anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Items on a specific date (for the day-detail panel)
  const itemsOnDate = (d: Date): Booking[] => {
    const day = startOfDay(d);
    return filtered.filter((b) => {
      const bs = startOfDay(new Date(b.startDate));
      const be = startOfDay(new Date(b.endDate));
      return day >= bs && day <= be;
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/travel-agent/fleet" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Back to fleet">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Calendar</h1>
            <p className="text-sm text-gray-500">Bookings, blocks &amp; maintenance for every vehicle</p>
          </div>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Add Booking / Block
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
        {/* Top row: month nav + vehicle picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const d = new Date(anchor); d.setMonth(d.getMonth() - 1); setAnchor(d); }}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 font-semibold text-sm text-gray-800 min-w-[160px] text-center">
              {monthLabel}
            </div>
            <button
              onClick={() => { const d = new Date(anchor); d.setMonth(d.getMonth() + 1); setAnchor(d); }}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); setAnchor(d); }}
              className="ml-1 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-gray-400" />
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
            >
              <option value="ALL">All vehicles</option>
              {fleets.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.vehicleName}
                  {f.registrationNumber ? ` (${f.registrationNumber})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['ALL', 'CUSTOMER', 'MANUAL_BLOCK', 'MAINTENANCE', 'RESERVED'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                typeFilter === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {t === 'ALL' ? 'All' : TYPE_COLORS[t].label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} entries this view</span>
        </div>
      </div>

      {/* ── Calendar grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : fleets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No vehicles to schedule</p>
          <p className="text-sm text-gray-400 mb-4">Add a vehicle first to start tracking availability</p>
          <Link href="/travel-agent/fleet/add" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={`px-3 py-2.5 text-center text-[11px] font-bold tracking-wide uppercase ${
                  i >= 5 ? 'text-rose-500' : 'text-gray-500'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="divide-y divide-gray-200">
            {weeks.map((week, wi) => {
              const weekStart = week[0];
              const weekEnd = week[6];
              const lanes = laneBarsForWeek(startOfDay(weekStart), startOfDay(weekEnd), filtered);
              const hiddenByDay: number[] = new Array(7).fill(0);
              for (const l of lanes) {
                if (l._lane >= MAX_VISIBLE_LANES) {
                  for (let c = l._startCol; c <= l._endCol; c++) hiddenByDay[c]++;
                }
              }

              return (
                <div key={wi} className="relative">
                  {/* Day cells (background) */}
                  <div className="grid grid-cols-7 min-h-[120px]">
                    {week.map((d, di) => {
                      const isToday = d.getTime() === today.getTime();
                      const isCurrentMonth = d.getMonth() === anchor.getMonth();
                      const isWeekend = di >= 5;
                      return (
                        <button
                          key={di}
                          onClick={() => setModal({ mode: 'create', initialDate: d })}
                          className={`group relative text-left px-2 pt-2 pb-1 border-r border-gray-100 last:border-r-0 transition-colors ${
                            !isCurrentMonth
                              ? 'bg-gray-50/70 hover:bg-gray-100'
                              : isWeekend
                                ? 'bg-rose-50/30 hover:bg-rose-50/60'
                                : 'bg-white hover:bg-emerald-50/40'
                          }`}
                          title={`Add for ${fmtDate(d)}`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                isToday
                                  ? 'bg-emerald-600 text-white'
                                  : isCurrentMonth
                                    ? 'text-gray-700'
                                    : 'text-gray-400'
                              }`}
                            >
                              {d.getDate()}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="w-3.5 h-3.5 text-emerald-500" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Booking bars overlayed (one row per lane) */}
                  <div className="absolute left-0 right-0 top-9 bottom-6 pointer-events-none">
                    {lanes
                      .filter((l) => l._lane < MAX_VISIBLE_LANES)
                      .map((l) => {
                        const c = TYPE_COLORS[l.bookingType] || TYPE_COLORS.CUSTOMER;
                        const tentative = l.status === 'TENTATIVE';
                        const completed = l.status === 'COMPLETED';
                        const span = l._endCol - l._startCol + 1;
                        const left = (l._startCol / 7) * 100;
                        const width = (span / 7) * 100;
                        const top = l._lane * 24; // 22px bar + 2 gap
                        const startsHere = isoDate(startOfDay(new Date(l.startDate))) === isoDate(addDays(weekStart, l._startCol));
                        const endsHere = isoDate(startOfDay(new Date(l.endDate))) === isoDate(addDays(weekStart, l._endCol));

                        const vehicle = fleets.find((f) => f.id === l.fleetId);
                        const titleText =
                          (l.customerName || c.label) +
                          (vehicleFilter === 'ALL' && vehicle ? ` · ${vehicle.vehicleName}` : '');
                        return (
                          <button
                            key={l.id + '-' + wi}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ mode: 'edit', booking: l });
                            }}
                            className={[
                              'absolute h-[22px] px-2 text-[11px] font-semibold flex items-center gap-1 truncate shadow-sm pointer-events-auto',
                              c.bg,
                              c.text,
                              'hover:brightness-110 transition',
                              tentative ? 'ring-1 ring-dashed ring-white/70 opacity-80' : '',
                              completed ? 'opacity-80' : '',
                              startsHere ? 'rounded-l-md' : '',
                              endsHere ? 'rounded-r-md' : '',
                              !startsHere && !endsHere ? '' : '',
                            ].join(' ')}
                            style={{
                              left: `calc(${left}% + ${startsHere ? 4 : 0}px)`,
                              width: `calc(${width}% - ${(startsHere ? 4 : 0) + (endsHere ? 4 : 0)}px)`,
                              top,
                            }}
                            title={`${titleText} (${fmtRange(l.startDate, l.endDate)})`}
                          >
                            {!startsHere && <span className="text-[10px] opacity-70">↩</span>}
                            <span className="truncate">{titleText}</span>
                          </button>
                        );
                      })}
                  </div>

                  {/* "+N more" indicators per day, bottom of cell */}
                  <div className="absolute left-0 right-0 bottom-1 grid grid-cols-7 pointer-events-none">
                    {hiddenByDay.map((n, di) => (
                      <div key={di} className="flex justify-center">
                        {n > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDayDetail({ date: week[di], items: itemsOnDate(week[di]) });
                            }}
                            className="pointer-events-auto text-[10px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                          >
                            +{n} more
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        {Object.entries(TYPE_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${v.bg}`} />
            {v.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white border border-dashed border-gray-400" />
          Tentative
        </div>
      </div>

      {modal && (
        <BookingModal
          fleets={fleets}
          mode={modal.mode}
          booking={modal.booking}
          initialFleetId={modal.initialFleetId || (vehicleFilter !== 'ALL' ? vehicleFilter : undefined)}
          initialDate={modal.initialDate}
          onClose={() => setModal(null)}
          onSaved={async () => {
            await loadBookings();
            setModal(null);
          }}
          onDelete={modal.booking ? () => handleDelete(modal.booking!.id) : undefined}
        />
      )}

      {dayDetail && (
        <DayDetailModal
          date={dayDetail.date}
          items={dayDetail.items}
          fleets={fleets}
          onClose={() => setDayDetail(null)}
          onAdd={() => {
            const date = dayDetail.date;
            setDayDetail(null);
            setModal({ mode: 'create', initialDate: date });
          }}
          onEdit={(b) => {
            setDayDetail(null);
            setModal({ mode: 'edit', booking: b });
          }}
        />
      )}
    </div>
  );
}

// ─── Day detail modal ──────────────────────────────────────────────────────

function DayDetailModal({
  date,
  items,
  fleets,
  onClose,
  onAdd,
  onEdit,
}: {
  date: Date;
  items: Booking[];
  fleets: Fleet[];
  onClose: () => void;
  onAdd: () => void;
  onEdit: (b: Booking) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {date.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
            </h2>
            <p className="text-xs text-gray-500">{items.length} entries</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No entries on this date</p>
          ) : (
            items.map((b) => {
              const c = TYPE_COLORS[b.bookingType] || TYPE_COLORS.CUSTOMER;
              const vehicle = fleets.find((f) => f.id === b.fleetId);
              return (
                <button
                  key={b.id}
                  onClick={() => onEdit(b)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition"
                >
                  <span className={`w-2 self-stretch rounded-full ${c.bg}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.soft} ${c.softText}`}>
                        {c.label}
                      </span>
                      {b.status === 'TENTATIVE' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                          TENTATIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {vehicle?.vehicleName || 'Vehicle'}
                      {b.customerName && <span className="text-gray-500 font-normal"> · {b.customerName}</span>}
                    </p>
                    <p className="text-xs text-gray-500">{fmtRange(b.startDate, b.endDate)}</p>
                    {b.pickupLocation && (
                      <p className="text-xs text-gray-500 truncate">📍 {b.pickupLocation}{b.dropLocation ? ` → ${b.dropLocation}` : ''}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end">
          <button onClick={onAdd} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> Add for this date
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking modal ─────────────────────────────────────────────────────────

interface ModalProps {
  fleets: Fleet[];
  mode: 'create' | 'edit';
  booking?: Booking;
  initialFleetId?: string;
  initialDate?: Date;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDelete?: () => void;
}

function BookingModal({
  fleets,
  mode,
  booking,
  initialFleetId,
  initialDate,
  onClose,
  onSaved,
  onDelete,
}: ModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const toInput = (v: string | Date | null | undefined) => {
    if (!v) return '';
    const d = typeof v === 'string' ? new Date(v) : v;
    return isoDate(d);
  };

  const [form, setForm] = useState({
    fleetId: booking?.fleetId || initialFleetId || fleets[0]?.id || '',
    startDate: toInput(booking?.startDate || initialDate || new Date()),
    endDate: toInput(booking?.endDate || initialDate || new Date()),
    bookingType: booking?.bookingType || 'CUSTOMER',
    status: booking?.status || 'CONFIRMED',
    customerName: booking?.customerName || '',
    customerPhone: booking?.customerPhone || '',
    pickupLocation: booking?.pickupLocation || '',
    dropLocation: booking?.dropLocation || '',
    amount: booking?.amount != null ? String(booking.amount) : '',
    notes: booking?.notes || '',
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fleetId) return showToast({ type: 'error', title: 'Pick a vehicle' });
    if (!form.startDate || !form.endDate) return showToast({ type: 'error', title: 'Both start and end dates are required' });

    setSaving(true);
    try {
      const payload: any = {
        ...form,
        startDate: new Date(form.startDate + 'T00:00:00').toISOString(),
        endDate: new Date(form.endDate + 'T23:59:59').toISOString(),
        amount: form.amount === '' ? null : Number(form.amount),
      };
      const res =
        mode === 'create'
          ? await fetch('/api/travel-agent/fleet/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/travel-agent/fleet/bookings/${booking!.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
      const j = await res.json();
      if (!res.ok) {
        showToast({
          type: 'error',
          title: j.error || 'Failed to save',
          message: j.conflict ? `Conflict with: ${j.conflict.customerName || 'existing entry'}` : undefined,
        });
        return;
      }
      showToast({ type: 'success', title: mode === 'create' ? 'Added to calendar' : 'Updated' });
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'Add to fleet calendar' : 'Edit calendar entry'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">Vehicle</label>
            <select
              value={form.fleetId}
              onChange={(e) => set('fleetId', e.target.value)}
              required
              disabled={mode === 'edit'}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
            >
              <option value="">Select vehicle…</option>
              {fleets.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.vehicleName}
                  {f.registrationNumber ? ` (${f.registrationNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">From</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">To</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                required
                min={form.startDate}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Type</label>
              <select
                value={form.bookingType}
                onChange={(e) => set('bookingType', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CUSTOMER">Customer Booking</option>
                <option value="MANUAL_BLOCK">Manual Block</option>
                <option value="MAINTENANCE">Maintenance / Service</option>
                <option value="RESERVED">Reserved (Hold)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="TENTATIVE">Tentative</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {form.bookingType === 'CUSTOMER' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => set('customerName', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => set('customerPhone', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Pickup</label>
                  <input
                    type="text"
                    value={form.pickupLocation}
                    onChange={(e) => set('pickupLocation', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Drop</label>
                  <input
                    type="text"
                    value={form.dropLocation}
                    onChange={(e) => set('dropLocation', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {mode === 'edit' && onDelete ? (
              <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 text-red-600 text-sm font-semibold hover:text-red-700">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {mode === 'create' ? 'Add to calendar' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
