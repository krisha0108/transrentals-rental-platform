'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Car,
  Bike,
  Bus,
  Truck,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  Building2,
  Heart,
  Cake,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Edit3,
  Fuel,
  Settings,
  Gauge,
  Loader2,
  KeyRound,
  Crown,
} from 'lucide-react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { LocationAutocomplete } from './LocationAutocomplete';
import { useBookingSubmission } from './useBookingSubmission';
import { useCustomerAuth } from '@/hooks/useCustomer';

// Types
interface SelectedVehicle {
  vehicleId: string;
  count: number;
}

interface ServiceItem {
  id: string;
  serviceType: 'bike' | 'car' | 'bus' | 'truck' | 'selfdrive' | 'luxury';
  selectedVehicles: SelectedVehicle[];
  peopleCount: number;
  pickupLocation: string;
  pickupLocationId: string;
  dropLocation: string;
  pickupTime: string;
  notes: string;
}

interface DayBooking {
  id: string;
  date: string;
  services: ServiceItem[];
}

interface FormData {
  occasionType: string;
  occasionName: string;
  totalDays: number;
  totalPeople: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  baseLocation: string;
  baseLocationId: string;
  baseLocationSlug: string;
  customerAddress: string;
  destinationAddress: string;
  days: DayBooking[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequirements: string;
}

// Service categories — sub-types load dynamically from /api/services/<slug>/fleet
// (same endpoint that powers /bike-on-rent/<city>, /car-rental/<city>, etc.)
const SERVICE_TYPES = {
  bike: {
    label: 'Bike Rental',
    icon: Bike,
    color: 'bg-orange-500',
    serviceSlug: 'bike-on-rent',
  },
  car: {
    label: 'Car Rental',
    icon: Car,
    color: 'bg-blue-500',
    serviceSlug: 'car-rental',
  },
  selfdrive: {
    label: 'Self-Drive Car',
    icon: KeyRound,
    color: 'bg-teal-500',
    serviceSlug: 'self-drive-car-rentals',
  },
  luxury: {
    label: 'Luxury Car',
    icon: Crown,
    color: 'bg-amber-500',
    serviceSlug: 'luxury-car-rental',
  },
  bus: {
    label: 'Bus Rental',
    icon: Bus,
    color: 'bg-green-500',
    serviceSlug: 'bus-rental',
  },
  truck: {
    label: 'Truck / Logistics',
    icon: Truck,
    color: 'bg-purple-500',
    serviceSlug: 'transporter',
  },
} as const;

type ServiceTypeKey = keyof typeof SERVICE_TYPES;

// Bus fleet is rarely listed per-city, so we always show seater presets instead.
const BUS_SEATER_PRESETS: FleetItem[] = [
  { id: 'bus-12', name: '12-Seater Tempo Traveller', slug: 'bus-12', seatingCapacity: 12, price: 0, source: 'category' },
  { id: 'bus-17', name: '17-Seater Tempo Traveller', slug: 'bus-17', seatingCapacity: 17, price: 0, source: 'category' },
  { id: 'bus-26', name: '26-Seater Mini Bus', slug: 'bus-26', seatingCapacity: 26, price: 0, source: 'category' },
  { id: 'bus-35', name: '35-Seater Bus', slug: 'bus-35', seatingCapacity: 35, price: 0, source: 'category' },
  { id: 'bus-45', name: '45-Seater Luxury Bus', slug: 'bus-45', seatingCapacity: 45, price: 0, source: 'category' },
  { id: 'bus-50', name: '50+ Seater Coach', slug: 'bus-50', seatingCapacity: 50, price: 0, source: 'category' },
];

// Truck fleet is also rarely listed per-city — preset sizes mirror transporter FAQ types.
interface TruckPreset extends FleetItem {
  tonnage: string;
  examples?: string;
}
const TRUCK_PRESETS: TruckPreset[] = [
  { id: 'truck-mini', name: 'Mini Truck', slug: 'truck-mini', tonnage: '1 Ton', examples: 'Tata Ace, Mahindra Jeeto', price: 0, source: 'category' },
  { id: 'truck-light', name: 'Light Commercial', slug: 'truck-light', tonnage: '1.5 – 5 Ton', examples: 'Tata 407, Bolero Pickup', price: 0, source: 'category' },
  { id: 'truck-medium', name: 'Medium Truck', slug: 'truck-medium', tonnage: '3 – 7 Ton', examples: 'Eicher 14/17/19 ft', price: 0, source: 'category' },
  { id: 'truck-container-20', name: 'Container Truck (20 ft)', slug: 'truck-container-20', tonnage: '10 – 15 Ton', price: 0, source: 'category' },
  { id: 'truck-container-24', name: 'Container Truck (24 ft)', slug: 'truck-container-24', tonnage: '15 – 20 Ton', price: 0, source: 'category' },
  { id: 'truck-container-32', name: 'Container Truck (32 ft)', slug: 'truck-container-32', tonnage: '20 – 25 Ton', price: 0, source: 'category' },
  { id: 'truck-trailer-40', name: 'Trailer (40 ft)', slug: 'truck-trailer-40', tonnage: '25 – 40 Ton', examples: 'Flatbed / Container', price: 0, source: 'category' },
];

// Service types where each "vehicle" is really a category — no per-vehicle people count makes sense.
const CARGO_OR_CAPACITY_TYPES: ReadonlySet<string> = new Set(['bus', 'truck']);

interface FleetItem {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  brandLogo?: string | null;
  price: number;
  image?: string | null;
  category?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  seatingCapacity?: number | null;
  engineCC?: number | null;
  mileage?: string | null;
  luggageCapacity?: string | null;
  acType?: string | null;
  exampleVehicles?: string[];
  source?: 'vehicle_model' | 'category';
}

const slugifyCity = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

// 12-hour AM/PM time picker — keeps internal value as "HH:MM" 24h string
function TimePicker12({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [h24Str = '09', m = '00'] = (value || '09:00').split(':');
  const h24 = parseInt(h24Str, 10) || 0;
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = ((h24 + 11) % 12) + 1; // 0→12, 1-11→1-11, 12→12, 13-23→1-11

  const emit = (h12Next: number, mNext: string, periodNext: 'AM' | 'PM') => {
    let h24Next = h12Next % 12;
    if (periodNext === 'PM') h24Next += 12;
    onChange(`${String(h24Next).padStart(2, '0')}:${mNext.padStart(2, '0')}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <select
        value={h12}
        onChange={(e) => emit(parseInt(e.target.value, 10), m, period)}
        className="px-1.5 py-1 text-sm font-medium text-gray-900 bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
      >
        {hours.map(h => (
          <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
        ))}
      </select>
      <span className="text-sm text-gray-400">:</span>
      <select
        value={minutes.includes(m) ? m : '00'}
        onChange={(e) => emit(h12, e.target.value, period)}
        className="px-1.5 py-1 text-sm font-medium text-gray-900 bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
      >
        {minutes.map(mm => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
      <div className="inline-flex bg-gray-100 rounded-md p-0.5 ml-1">
        {(['AM', 'PM'] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => emit(h12, m, p)}
            className={`px-2 py-0.5 text-xs font-semibold rounded transition ${
              period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

const OCCASION_TYPES = [
  { id: 'wedding', name: 'Wedding', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-50' },
  { id: 'corporate', name: 'Corporate Event', icon: Building2, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { id: 'birthday', name: 'Birthday Party', icon: Cake, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  { id: 'party', name: 'Party / Get-together', icon: PartyPopper, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { id: 'tour', name: 'Group Tour', icon: MapPin, color: 'text-green-500', bgColor: 'bg-green-50' },
  { id: 'other', name: 'Other Event', icon: Sparkles, color: 'text-gray-500', bgColor: 'bg-gray-50' },
];

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

// Format a Date as YYYY-MM-DD using LOCAL components.
// Avoid toISOString() — it converts to UTC, which in IST shifts midnight back to the previous day.
const toLocalISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatDayFull = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime12 = (hhmm: string) => {
  if (!hhmm) return '';
  const [hStr = '0', m = '00'] = hhmm.split(':');
  const h = parseInt(hStr, 10) || 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m.padStart(2, '0')} ${period}`;
};

const getDaysBetween = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  while (startDate <= endDate) {
    dates.push(toLocalISODate(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }
  return dates;
};

const lookupVehicle = (
  fleet: Record<string, FleetItem[]>,
  serviceType: string,
  vehicleId: string
): FleetItem | undefined =>
  fleet[serviceType]?.find(v => v.id === vehicleId || v.slug === vehicleId);

const sumServiceVehicles = (service: ServiceItem): number =>
  service.selectedVehicles.reduce((sum, sv) => sum + sv.count, 0);

const sumServiceCost = (
  fleet: Record<string, FleetItem[]>,
  service: ServiceItem
): number =>
  service.selectedVehicles.reduce((sum, sv) => {
    const vehicle = lookupVehicle(fleet, service.serviceType, sv.vehicleId);
    return sum + (vehicle?.price || 0) * sv.count;
  }, 0);

// Create empty service — selectedVehicles stays empty until user picks
const createEmptyService = (): ServiceItem => ({
  id: generateId(),
  serviceType: 'car',
  selectedVehicles: [],
  peopleCount: 4,
  pickupLocation: '',
  pickupLocationId: '',
  dropLocation: '',
  pickupTime: '09:00',
  notes: '',
});

// Create empty day booking
const createDayBooking = (date: string): DayBooking => ({
  id: generateId(),
  date,
  services: [createEmptyService()],
});

// Parse a "YYYY-MM-DD" string into a LOCAL Date (avoids UTC shift from new Date(str))
const parseLocalISO = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

// ── Zoomcar-style range calendar + time picker for the event dates ──
function EventDateTimePicker({
  startDate,
  endDate,
  startTime,
  endTime,
  totalDays,
  onChange,
}: {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalDays: number;
  onChange: (patch: Partial<{ startDate: string; endDate: string; startTime: string; endTime: string }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState(1);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = parseLocalISO(startDate);
    if (!from) return undefined;
    return { from, to: parseLocalISO(endDate) || from };
  });
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // Bookings need at least 7 days' notice → earliest selectable day is today + 7 days
  const LEAD_DAYS = 7;
  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + LEAD_DAYS);
    return d;
  }, []);

  // Keep internal range in sync when the form values change elsewhere (e.g. presets)
  useEffect(() => {
    const from = parseLocalISO(startDate);
    setRange(from ? { from, to: parseLocalISO(endDate) || from } : undefined);
  }, [startDate, endDate]);

  // 2 months on larger screens, 1 on mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const apply = () => setMonths(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (r: DateRange | undefined) => {
    setRange(r);
    if (!r?.from) {
      onChange({ startDate: '', endDate: '' });
      return;
    }
    const s = toLocalISODate(r.from);
    // While mid-selection (no `to` yet) keep end = start so day-count stays valid
    const e = r.to ? toLocalISODate(r.to) : s;
    onChange({ startDate: s, endDate: e });
  };

  // Presets all start on/after minDate (today + 7 days) to honour the lead-time rule
  const presets = React.useMemo(() => {
    const base = new Date(minDate); // earliest allowed day
    const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const tenOut = addDays(base, 3); // minDate + 3 ≈ 10 days from today
    // First Friday on/after minDate, and its Sunday
    const friday = addDays(base, (5 - base.getDay() + 7) % 7);
    const sunday = addDays(friday, 2);
    return [
      { label: 'In 1 week', start: toLocalISODate(base), end: toLocalISODate(base) },
      { label: 'In 10 days', start: toLocalISODate(tenOut), end: toLocalISODate(tenOut) },
      { label: 'Weekend', start: toLocalISODate(friday), end: toLocalISODate(sunday) },
      { label: '3-day trip', start: toLocalISODate(base), end: toLocalISODate(addDays(base, 2)) },
      { label: 'Week-long', start: toLocalISODate(base), end: toLocalISODate(addDays(base, 6)) },
    ];
  }, [minDate]);

  const triggerCard = (which: 'start' | 'end') => {
    const date = which === 'start' ? startDate : endDate;
    const time = which === 'start' ? startTime : endTime;
    const accent = which === 'start' ? 'text-blue-500' : 'text-purple-500';
    const open_ = open;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-left bg-white rounded-xl border-2 p-3 transition w-full ${
          open_ ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className={`flex items-center gap-2 mb-1.5 text-xs font-semibold uppercase tracking-wide ${accent}`}>
          <Calendar className="w-3.5 h-3.5" /> {which === 'start' ? 'Starts' : 'Ends'}
        </div>
        {date ? (
          <>
            <p className="text-base font-bold text-gray-900 leading-tight">
              {parseLocalISO(date)!.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime12(time)}
              <span className="text-gray-300">·</span>
              {parseLocalISO(date)!.getFullYear()}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400 font-medium">Select date</p>
        )}
      </button>
    );
  };

  return (
    <div className="relative" ref={wrapRef}>
      {/* Quick-pick chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => {
          const active = startDate === p.start && endDate === p.end;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange({ startDate: p.start, endDate: p.end })}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Trigger cards */}
      <div className="grid grid-cols-2 gap-3">
        {triggerCard('start')}
        {triggerCard('end')}
      </div>

      {/* Lead-time notice */}
      <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
        <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
        Bookings need at least {LEAD_DAYS} days&apos; notice — earliest date is{' '}
        <span className="font-semibold text-gray-700">
          {minDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
        .
      </p>

      {/* Calendar popover */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[calc(100vw-2rem)] sm:w-auto max-w-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 sm:p-4"
            style={
              {
                '--rdp-accent-color': '#2563eb',
                '--rdp-accent-background-color': '#dbeafe',
                '--rdp-range_middle-background-color': '#dbeafe',
                '--rdp-range_middle-color': '#1e3a8a',
                '--rdp-day-width': '32px',
                '--rdp-day-height': '32px',
                '--rdp-day_button-width': '32px',
                '--rdp-day_button-height': '32px',
                '--rdp-nav_button-width': '26px',
                '--rdp-nav_button-height': '26px',
                '--rdp-weekday-padding': '2px 0',
              } as React.CSSProperties
            }
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-900">Select event dates</p>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center text-[13px] [&_.rdp]:m-0 [&_.rdp-month_caption]:text-sm [&_.rdp-months]:gap-4">
              <DayPicker
                mode="range"
                numberOfMonths={months}
                selected={range}
                onSelect={handleSelect}
                defaultMonth={range?.from ?? minDate}
                startMonth={minDate}
                disabled={{ before: minDate }}
              />
            </div>

            {/* Time pickers */}
            <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-gray-100">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" /> Pickup time
                </p>
                <TimePicker12 value={startTime} onChange={(t) => onChange({ startTime: t })} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-500" /> Drop time
                </p>
                <TimePicker12 value={endTime} onChange={(t) => onChange({ endTime: t })} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="text-sm">
                {startDate && endDate ? (
                  <span className="font-semibold text-gray-700">
                    {totalDays} day{totalDays === 1 ? '' : 's'}
                    {totalDays > 1 ? ` · ${totalDays - 1} night${totalDays - 1 === 1 ? '' : 's'}` : ''}
                  </span>
                ) : (
                  <span className="text-gray-400">Pick a start &amp; end date</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setRange(undefined); onChange({ startDate: '', endDate: '' }); }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg shadow-sm transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CustomBookingForm() {
  const { submitBooking, isSubmitting, error: submitError } = useBookingSubmission('custom-bulk', 'CustomBookingForm');
  const { customer, isAuthenticated } = useCustomerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [fleetByService, setFleetByService] = useState<Record<string, FleetItem[]>>({});
  const [fleetLoading, setFleetLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    occasionType: '',
    occasionName: '',
    totalDays: 1,
    totalPeople: 10,
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    baseLocation: '',
    baseLocationId: '',
    baseLocationSlug: '',
    customerAddress: '',
    destinationAddress: '',
    days: [],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequirements: '',
  });

  // Fetch real fleet for all 4 service categories whenever the base city changes.
  // Same data path as /bike-on-rent/<city>, /car-rental/<city>, etc.
  useEffect(() => {
    const slug = formData.baseLocationSlug;
    if (!slug) {
      setFleetByService({});
      return;
    }

    let cancelled = false;
    setFleetLoading(true);

    Promise.all(
      (Object.entries(SERVICE_TYPES) as [ServiceTypeKey, typeof SERVICE_TYPES[ServiceTypeKey]][]).map(
        async ([key, cfg]) => {
          try {
            const res = await fetch(
              `/api/booking/picker?service=${encodeURIComponent(cfg.serviceSlug)}&location=${encodeURIComponent(slug)}`
            );
            const data = await res.json();
            if (!data.success) return [key, [] as FleetItem[]] as const;
            const vehicles: FleetItem[] = (data.items || []).map((v: any) => ({
              id: v.id,
              name: v.name,
              slug: v.slug,
              brand: v.brand,
              brandLogo: v.brandLogo,
              price: v.basePricePerDay || 0,
              image: v.image,
              category: v.category,
              fuelType: v.fuelType,
              transmission: v.transmission,
              seatingCapacity: v.seatingCapacity,
              engineCC: v.engineCC,
              mileage: v.mileage,
              luggageCapacity: v.luggageCapacity,
              acType: v.acType,
              exampleVehicles: v.exampleVehicles,
              source: v.source,
            }));
            return [key, vehicles] as const;
          } catch (e) {
            console.error(`Picker fetch failed for ${key}:`, e);
            return [key, [] as FleetItem[]] as const;
          }
        }
      )
    ).then(results => {
      if (cancelled) return;
      const map: Record<string, FleetItem[]> = {};
      results.forEach(([k, v]) => { map[k] = v; });
      setFleetByService(map);
      setFleetLoading(false);
    });

    return () => { cancelled = true; };
  }, [formData.baseLocationSlug]);

  // Pre-fill contact details when the user is logged in (only if fields are still empty)
  useEffect(() => {
    if (!isAuthenticated || !customer) return;
    setFormData(prev => ({
      ...prev,
      customerName: prev.customerName || customer.name || '',
      customerEmail: prev.customerEmail || customer.email || '',
      customerPhone: prev.customerPhone || customer.phone || '',
    }));
  }, [isAuthenticated, customer]);

  // Initialize days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const dates = getDaysBetween(formData.startDate, formData.endDate);
      const existingDays = formData.days;

      const newDays = dates.map(date => {
        const existing = existingDays.find(d => d.date === date);
        return existing || createDayBooking(date);
      });

      setFormData(prev => ({ ...prev, days: newDays, totalDays: dates.length }));
      if (newDays.length > 0 && expandedDays.length === 0) {
        setExpandedDays([newDays[0].id]);
      }
    }
  }, [formData.startDate, formData.endDate]);

  // Calculate totals
  const calculateTotals = () => {
    let totalVehicles = 0;
    let totalServices = 0;
    let estimatedCost = 0;
    let totalPeopleCapacity = 0;

    formData.days.forEach(day => {
      day.services.forEach(service => {
        const serviceVehicles = sumServiceVehicles(service);
        totalVehicles += serviceVehicles;
        totalServices += 1;
        estimatedCost += sumServiceCost(fleetByService, service);
        // For bus/truck use the vehicle's own seatingCapacity (preset seater size).
        // For others fall back to user-entered peopleCount per vehicle.
        const isCapacityType = CARGO_OR_CAPACITY_TYPES.has(service.serviceType);
        if (isCapacityType) {
          for (const sv of service.selectedVehicles) {
            const presetList = service.serviceType === 'bus' ? BUS_SEATER_PRESETS : TRUCK_PRESETS;
            const preset = presetList.find(p => p.id === sv.vehicleId);
            totalPeopleCapacity += (preset?.seatingCapacity || 0) * sv.count;
          }
        } else {
          totalPeopleCapacity += service.peopleCount * serviceVehicles;
        }
      });
    });

    return { totalVehicles, totalServices, estimatedCost, totalPeopleCapacity };
  };

  // Handlers
  const toggleDay = (dayId: string) => {
    setExpandedDays(prev =>
      prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
    );
  };

  const addServiceToDay = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, services: [...day.services, createEmptyService()] }
          : day
      ),
    }));
  };

  const removeServiceFromDay = (dayId: string, serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, services: day.services.filter(s => s.id !== serviceId) }
          : day
      ),
    }));
  };

  const updateService = (dayId: string, serviceId: string, updates: Partial<ServiceItem>) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              services: day.services.map(s =>
                s.id === serviceId ? { ...s, ...updates } : s
              ),
            }
          : day
      ),
    }));
  };

  const copyDayServices = (fromDayId: string, toDayId: string) => {
    const fromDay = formData.days.find(d => d.id === fromDayId);
    if (!fromDay) return;

    setFormData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === toDayId
          ? { ...day, services: fromDay.services.map(s => ({ ...s, id: generateId() })) }
          : day
      ),
    }));
  };

  const handleSubmit = async () => {
    // Validate phone
    const phoneDigits = formData.customerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]/.test(phoneDigits)) {
      alert('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    const totals = calculateTotals();

    const bookingPayload = {
      bookingType: 'custom-bulk',
      customerInfo: {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
      },
      bookingData: {
        service_id: 99, // Custom booking service ID
        service_name: 'Custom Bulk Booking',
        occasion_type: formData.occasionType,
        occasion_name: formData.occasionName,
        total_days: formData.totalDays,
        total_people: formData.totalPeople,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_date: formData.endDate,
        end_time: formData.endTime,
        start_datetime: formData.startDate ? `${formData.startDate} ${formData.startTime}:00` : null,
        end_datetime: formData.endDate ? `${formData.endDate} ${formData.endTime}:00` : null,
        base_location: formData.baseLocation,
        base_location_id: formData.baseLocationId,
        base_location_slug: formData.baseLocationSlug,
        customer_address: formData.customerAddress,
        destination_address: formData.destinationAddress,
        total_vehicles: totals.totalVehicles,
        total_services: totals.totalServices,
        estimated_cost: totals.estimatedCost,
        special_requirements: formData.specialRequirements,
        days: formData.days.map(day => ({
          date: day.date,
          services: day.services.map(service => ({
            service_type: service.serviceType,
            total_vehicles: sumServiceVehicles(service),
            estimated_cost: sumServiceCost(fleetByService, service),
            vehicles: service.selectedVehicles.map(sv => {
              const vehicle = lookupVehicle(fleetByService, service.serviceType, sv.vehicleId);
              return {
                vehicle_id: vehicle?.id || sv.vehicleId,
                vehicle_slug: vehicle?.slug || null,
                vehicle_name: vehicle ? `${vehicle.brand ? vehicle.brand + ' ' : ''}${vehicle.name}` : null,
                vehicle_brand: vehicle?.brand || null,
                daily_rate: vehicle?.price || 0,
                count: sv.count,
              };
            }),
            people_count: service.peopleCount,
            pickup_location: service.pickupLocation,
            pickup_location_id: service.pickupLocationId,
            drop_location: service.dropLocation,
            pickup_time: service.pickupTime,
            notes: service.notes,
          })),
        })),
      },
    };

    await submitBooking(bookingPayload.customerInfo, bookingPayload.bookingData);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.occasionType && formData.startDate && formData.endDate && formData.baseLocationId && formData.customerAddress.trim() && formData.destinationAddress.trim();
    }
    if (currentStep === 2) {
      return formData.days.length > 0 && formData.days.every(day => day.services.length > 0);
    }
    if (currentStep === 3) {
      return formData.customerName && formData.customerEmail && formData.customerPhone;
    }
    return false;
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => {
            const isPast = step < currentStep;
            return (
            <React.Fragment key={step}>
              <button
                type="button"
                onClick={() => { if (isPast) setCurrentStep(step); }}
                disabled={!isPast}
                title={isPast ? `Go back to ${step === 1 ? 'Event Details' : step === 2 ? 'Day-wise Services' : 'Contact Info'}` : undefined}
                className={`flex items-center ${isPast ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } ${isPast ? 'ring-2 ring-blue-200 ring-offset-1' : ''}`}
                >
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block ${
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 && 'Event Details'}
                  {step === 2 && 'Day-wise Services'}
                  {step === 3 && 'Contact Info'}
                  {step === 4 && 'Review & Book'}
                </span>
              </button>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-4 rounded ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step 1: Event Details */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <PartyPopper className="w-6 h-6 text-purple-500" />
                Event Details
              </h2>

              {/* Occasion Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What's the occasion? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {OCCASION_TYPES.map((occasion) => {
                    const Icon = occasion.icon;
                    return (
                      <button
                        key={occasion.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, occasionType: occasion.id }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.occasionType === occasion.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${occasion.color}`} />
                        <span className="text-sm font-medium">{occasion.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Occasion Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.occasionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, occasionName: e.target.value }))}
                  placeholder="e.g., Sharma Wedding, Annual Sales Meet"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date & Time Range */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Event Dates &amp; Time *
                  </label>
                  {formData.startDate && formData.endDate && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {formData.totalDays} day{formData.totalDays === 1 ? '' : 's'}
                      {formData.totalDays > 1 ? ` · ${formData.totalDays - 1} night${formData.totalDays - 1 === 1 ? '' : 's'}` : ''}
                    </span>
                  )}
                </div>

                <EventDateTimePicker
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  startTime={formData.startTime}
                  endTime={formData.endTime}
                  totalDays={formData.totalDays}
                  onChange={(patch) => setFormData(prev => ({ ...prev, ...patch }))}
                />
              </div>

              {/* Base Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Location / City *
                </label>
                <LocationAutocomplete
                  value={formData.baseLocation}
                  locationId={formData.baseLocationId}
                  onChange={(id, name) => setFormData(prev => ({
                    ...prev,
                    baseLocation: name,
                    baseLocationId: id,
                    baseLocationSlug: id ? slugifyCity(name) : '',
                  }))}
                  placeholder="Search city..."
                />
              </div>

              {/* Estimated People */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Total Guests/People
                </label>
                <input
                  type="number"
                  value={formData.totalPeople}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPeople: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Customer Full Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Full Address *
                </label>
                <textarea
                  value={formData.customerAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                  rows={3}
                  placeholder="House / Flat no., street, area, landmark, city, pincode"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Destination Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Address *
                </label>
                <textarea
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationAddress: e.target.value }))}
                  rows={3}
                  placeholder="Venue / drop address with landmark and pincode"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Day-wise Services */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-4">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" />
                Plan Your {formData.totalDays}-Day Event
              </h2>
              <p className="text-gray-600">
                Add vehicles and services for each day. You can have multiple services per day.
              </p>
            </div>

            {formData.days.map((day, dayIndex) => (
              <div key={day.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Day Header */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">D{dayIndex + 1}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg flex flex-wrap items-baseline gap-x-2">
                        <span>Day {dayIndex + 1}</span>
                        <span className="text-sm font-normal text-gray-600">
                          · {formatDayFull(day.date)}
                        </span>
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {day.services.length} service{day.services.length !== 1 ? 's' : ''}
                    </span>
                    {expandedDays.includes(day.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Day Content */}
                <AnimatePresence>
                  {expandedDays.includes(day.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-6 space-y-4">
                        {/* Copy from any previous day */}
                        {dayIndex > 0 && (
                          <div className="flex items-center flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                              <Copy className="w-4 h-4" />
                              Copy services from:
                            </span>
                            {formData.days.slice(0, dayIndex).map((srcDay, srcIdx) => {
                              const hasServices = srcDay.services.some(s => s.selectedVehicles.length > 0);
                              return (
                                <button
                                  key={srcDay.id}
                                  type="button"
                                  disabled={!hasServices}
                                  onClick={() => copyDayServices(srcDay.id, day.id)}
                                  title={hasServices ? `Copy ${srcDay.services.length} service(s) from Day ${srcIdx + 1}` : `Day ${srcIdx + 1} has no vehicles selected yet`}
                                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                                    hasServices
                                      ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  Day {srcIdx + 1}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Services */}
                        {day.services.map((service, serviceIndex) => (
                          <div key={service.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-700">
                                Service {serviceIndex + 1}
                              </h4>
                              {day.services.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeServiceFromDay(day.id, service.id)}
                                  className="text-red-500 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Service Type tabs */}
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-500 mb-2">
                                Service Type
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(Object.entries(SERVICE_TYPES) as [ServiceTypeKey, typeof SERVICE_TYPES[ServiceTypeKey]][]).map(([key, cfg]) => {
                                  const Icon = cfg.icon;
                                  const isActive = service.serviceType === key;
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => {
                                        if (service.serviceType === key) return;
                                        updateService(day.id, service.id, {
                                          serviceType: key,
                                          selectedVehicles: [],
                                        });
                                      }}
                                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                                        isActive
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                                      }`}
                                    >
                                      <Icon className="w-4 h-4" />
                                      {cfg.label}
                                      <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                        ({key === 'bus' ? BUS_SEATER_PRESETS.length : key === 'truck' ? TRUCK_PRESETS.length : (fleetByService[key]?.length ?? 0)})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Self-drive disclaimer — customer drives the
                                vehicle themselves, so no driver/chauffeur. */}
                            {service.serviceType === 'selfdrive' && (
                              <div className="mb-4 flex items-start gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800">
                                <KeyRound className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
                                <div>
                                  <span className="font-semibold">Driver is not included.</span>{' '}
                                  Self-drive means you drive the vehicle yourself —
                                  the price covers only the vehicle. Carry your driving licence
                                  &amp; ID at pickup.
                                </div>
                              </div>
                            )}

                            {/* Vehicle picker — multi-select card grid with per-vehicle quantity */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-gray-500">
                                  Choose Vehicles <span className="text-gray-400">(select multiple)</span>
                                </label>
                                <span className="text-xs font-semibold text-blue-600">
                                  {sumServiceVehicles(service)} vehicle{sumServiceVehicles(service) === 1 ? '' : 's'} selected
                                </span>
                              </div>
                              {(() => {
                                // Bus + Truck never have a reliable per-city fleet — always show presets
                                const isBus = service.serviceType === 'bus';
                                const isTruck = service.serviceType === 'truck';
                                const usesPresets = isBus || isTruck;
                                const fleetList: FleetItem[] = isBus
                                  ? BUS_SEATER_PRESETS
                                  : isTruck
                                    ? TRUCK_PRESETS
                                    : (fleetByService[service.serviceType] || []);
                                if (!formData.baseLocationSlug && !usesPresets) {
                                  return (
                                    <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                                      Select a base city first to see available vehicles.
                                    </div>
                                  );
                                }
                                if (!usesPresets && fleetLoading && fleetList.length === 0) {
                                  return (
                                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                      <Loader2 className="w-6 h-6 mx-auto mb-2 text-blue-500 animate-spin" />
                                      <p className="text-sm text-gray-500">Loading fleet for {formData.baseLocation}…</p>
                                    </div>
                                  );
                                }
                                if (!usesPresets && fleetList.length === 0) {
                                  return (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                                      No {SERVICE_TYPES[service.serviceType as ServiceTypeKey].label.toLowerCase()} listed in {formData.baseLocation} yet. You can still submit this booking — our team will arrange a custom quote.
                                    </div>
                                  );
                                }
                                const setVehicleCount = (vehicleId: string, nextCount: number) => {
                                  const current = service.selectedVehicles;
                                  let updated: SelectedVehicle[];
                                  if (nextCount <= 0) {
                                    updated = current.filter(s => s.vehicleId !== vehicleId);
                                  } else if (current.some(s => s.vehicleId === vehicleId)) {
                                    updated = current.map(s => s.vehicleId === vehicleId ? { ...s, count: nextCount } : s);
                                  } else {
                                    updated = [...current, { vehicleId, count: nextCount }];
                                  }
                                  updateService(day.id, service.id, { selectedVehicles: updated });
                                };

                                // Truck tab: compact chip picker with tonnage prominent
                                if (isTruck) {
                                  return (
                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                      <p className="text-xs text-gray-500 mb-3">
                                        Pick truck size(s) by tonnage / load capacity. Add quantity per type.
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {(fleetList as TruckPreset[]).map((v) => {
                                          const selected = service.selectedVehicles.find(s => s.vehicleId === v.id);
                                          const isSelected = !!selected;
                                          const count = selected?.count || 0;
                                          return (
                                            <div
                                              key={v.id}
                                              className={`rounded-lg border-2 transition overflow-hidden ${
                                                isSelected
                                                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                                                  : 'border-gray-200 hover:border-blue-300 bg-white'
                                              }`}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => setVehicleCount(v.id, isSelected ? 0 : 1)}
                                                className="w-full px-3 py-2.5 text-left flex items-center gap-3"
                                              >
                                                <Truck className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-gray-900 leading-tight">
                                                      {v.name}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                                      {v.tonnage}
                                                    </span>
                                                  </div>
                                                  {v.examples && (
                                                    <div className="text-[11px] text-gray-500 truncate mt-0.5">
                                                      e.g. {v.examples}
                                                    </div>
                                                  )}
                                                </div>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                              </button>
                                              {isSelected && (
                                                <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-blue-100">
                                                  <span className="text-[11px] font-medium text-blue-700">Qty</span>
                                                  <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => setVehicleCount(v.id, count - 1)}
                                                      className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-semibold leading-none"
                                                      aria-label="Decrease"
                                                    >−</button>
                                                    <input
                                                      type="number"
                                                      min={1}
                                                      max={50}
                                                      value={count}
                                                      onChange={(e) => {
                                                        const n = parseInt(e.target.value, 10);
                                                        if (!isNaN(n)) setVehicleCount(v.id, Math.max(0, Math.min(50, n)));
                                                      }}
                                                      className="w-10 text-center px-1 py-0.5 text-xs border border-blue-200 rounded-md"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => setVehicleCount(v.id, count + 1)}
                                                      className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-semibold leading-none"
                                                      aria-label="Increase"
                                                    >+</button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }

                                // Bus tab: compact chip-style picker (no images, just seat-size buttons)
                                if (isBus) {
                                  return (
                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                      <p className="text-xs text-gray-500 mb-3">
                                        Pick the seater size(s) you need. Add quantity per size.
                                      </p>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {fleetList.map((v) => {
                                          const selected = service.selectedVehicles.find(s => s.vehicleId === v.id);
                                          const isSelected = !!selected;
                                          const count = selected?.count || 0;
                                          return (
                                            <div
                                              key={v.id}
                                              className={`rounded-lg border-2 transition overflow-hidden ${
                                                isSelected
                                                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                                                  : 'border-gray-200 hover:border-blue-300 bg-white'
                                              }`}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => setVehicleCount(v.id, isSelected ? 0 : 1)}
                                                className="w-full px-3 py-2.5 text-left flex items-center gap-2"
                                              >
                                                <Bus className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                                <div className="min-w-0 flex-1">
                                                  <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                    {v.seatingCapacity} Seater
                                                  </div>
                                                  <div className="text-[11px] text-gray-500 truncate">
                                                    {v.name.replace(/^\d+(-Seater|\+? Seater)\s*/, '')}
                                                  </div>
                                                </div>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                              </button>
                                              {isSelected && (
                                                <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-blue-100">
                                                  <span className="text-[11px] font-medium text-blue-700">Qty</span>
                                                  <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => setVehicleCount(v.id, count - 1)}
                                                      className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-semibold leading-none"
                                                      aria-label="Decrease"
                                                    >−</button>
                                                    <input
                                                      type="number"
                                                      min={1}
                                                      max={50}
                                                      value={count}
                                                      onChange={(e) => {
                                                        const n = parseInt(e.target.value, 10);
                                                        if (!isNaN(n)) setVehicleCount(v.id, Math.max(0, Math.min(50, n)));
                                                      }}
                                                      className="w-10 text-center px-1 py-0.5 text-xs border border-blue-200 rounded-md"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => setVehicleCount(v.id, count + 1)}
                                                      className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-semibold leading-none"
                                                      aria-label="Increase"
                                                    >+</button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[28rem] overflow-y-auto pr-1">
                                    {fleetList.map((v) => {
                                      const selected = service.selectedVehicles.find(s => s.vehicleId === v.id);
                                      const isSelected = !!selected;
                                      const count = selected?.count || 0;
                                      const imgSrc = v.image || '/images/fleet/honda-city.jpg';
                                      return (
                                        <div
                                          key={v.id}
                                          className={`bg-white rounded-xl border-2 transition overflow-hidden ${
                                            isSelected
                                              ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                                              : 'border-gray-200 hover:border-blue-300 hover:shadow'
                                          }`}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => setVehicleCount(v.id, isSelected ? 0 : 1)}
                                            className="text-left w-full"
                                          >
                                            <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                                              <Image
                                                src={imgSrc}
                                                alt={v.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                              />
                                              {isSelected && (
                                                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow">
                                                  <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                              )}
                                              {v.category && (
                                                <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded">
                                                  {v.category}
                                                </span>
                                              )}
                                            </div>
                                            <div className="p-3 pb-2">
                                              <div className="flex items-center gap-2 mb-1">
                                                {v.brandLogo && (
                                                  <Image
                                                    src={v.brandLogo}
                                                    alt={v.brand || ''}
                                                    width={20}
                                                    height={20}
                                                    className="object-contain"
                                                  />
                                                )}
                                                {v.brand && (
                                                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">
                                                    {v.brand}
                                                  </span>
                                                )}
                                              </div>
                                              <h5 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{v.name}</h5>
                                              {v.source === 'category' && v.exampleVehicles && v.exampleVehicles.length > 0 && (
                                                <p className="text-[11px] text-gray-500 mb-2 line-clamp-1">
                                                  e.g. {v.exampleVehicles.slice(0, 3).join(', ')}
                                                </p>
                                              )}
                                              <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                                                {v.seatingCapacity != null && (
                                                  <span className="inline-flex items-center gap-1">
                                                    <Users className="w-3 h-3" />{v.seatingCapacity} seats
                                                  </span>
                                                )}
                                                {v.fuelType && (
                                                  <span className="inline-flex items-center gap-1">
                                                    <Fuel className="w-3 h-3" />{v.fuelType}
                                                  </span>
                                                )}
                                                {v.transmission && (
                                                  <span className="inline-flex items-center gap-1">
                                                    <Settings className="w-3 h-3" />{v.transmission}
                                                  </span>
                                                )}
                                                {v.acType && (
                                                  <span className="inline-flex items-center gap-1">
                                                    ❄ {v.acType}
                                                  </span>
                                                )}
                                                {v.luggageCapacity && (
                                                  <span className="inline-flex items-center gap-1">
                                                    🧳 {v.luggageCapacity}
                                                  </span>
                                                )}
                                                {v.mileage && (
                                                  <span className="inline-flex items-center gap-1">
                                                    <Gauge className="w-3 h-3" />{v.mileage}
                                                  </span>
                                                )}
                                                {v.engineCC != null && v.engineCC > 0 && (
                                                  <span className="inline-flex items-center gap-1">
                                                    <Settings className="w-3 h-3" />{v.engineCC}cc
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </button>
                                          {isSelected && (
                                            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-t border-blue-100">
                                              <span className="text-xs font-medium text-blue-700">Quantity</span>
                                              <div className="inline-flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setVehicleCount(v.id, count - 1)}
                                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-base font-semibold leading-none"
                                                  aria-label="Decrease quantity"
                                                >
                                                  −
                                                </button>
                                                <input
                                                  type="number"
                                                  min={1}
                                                  max={50}
                                                  value={count}
                                                  onChange={(e) => {
                                                    const n = parseInt(e.target.value, 10);
                                                    if (!isNaN(n)) setVehicleCount(v.id, Math.max(0, Math.min(50, n)));
                                                  }}
                                                  className="w-12 text-center px-1 py-0.5 text-sm border border-blue-200 rounded-md bg-white"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => setVehicleCount(v.id, count + 1)}
                                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-base font-semibold leading-none"
                                                  aria-label="Increase quantity"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* People Count — hidden for bus/truck (capacity is on the vehicle card itself) */}
                            {!CARGO_OR_CAPACITY_TYPES.has(service.serviceType) && (
                              <div className="max-w-xs">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  People per Vehicle
                                </label>
                                <input
                                  type="number"
                                  value={service.peopleCount}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    peopleCount: parseInt(e.target.value) || 1
                                  })}
                                  min="1"
                                  max="50"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}

                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                              {/* Pickup Location */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Pickup Location
                                </label>
                                <input
                                  type="text"
                                  value={service.pickupLocation}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    pickupLocation: e.target.value
                                  })}
                                  placeholder="Enter pickup point"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Drop Location */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Drop Location
                                </label>
                                <input
                                  type="text"
                                  value={service.dropLocation}
                                  onChange={(e) => updateService(day.id, service.id, {
                                    dropLocation: e.target.value
                                  })}
                                  placeholder="Enter drop point"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Pickup Time */}
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Pickup Time
                                </label>
                                <div className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white">
                                  <TimePicker12
                                    value={service.pickupTime}
                                    onChange={(t) => updateService(day.id, service.id, { pickupTime: t })}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="mt-4">
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Special Notes (optional)
                              </label>
                              <input
                                type="text"
                                value={service.notes}
                                onChange={(e) => updateService(day.id, service.id, { notes: e.target.value })}
                                placeholder="Any special requirements for this service..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Service summary — vehicles selected (no pricing shown) */}
                            {service.selectedVehicles.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                  {sumServiceVehicles(service)} vehicle{sumServiceVehicles(service) === 1 ? '' : 's'} across {service.selectedVehicles.length} model{service.selectedVehicles.length === 1 ? '' : 's'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add Service Button */}
                        <button
                          type="button"
                          onClick={() => addServiceToDay(day.id)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add Another Service
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}

        {/* Step 3: Contact Info */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-green-500" />
                Contact Information
              </h2>

              {isAuthenticated && customer && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Auto-filled from your account
                    {customer.email ? <span className="text-green-600/80"> · {customer.email}</span> : null}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setFormData(prev => ({ ...prev, customerPhone: val }));
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requirements (optional)
                  </label>
                  <textarea
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                    placeholder="Any special requirements, decorations, preferences..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Book */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Review Your Booking
              </h2>

              {/* Event Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    OCCASION_TYPES.find(o => o.id === formData.occasionType)?.bgColor || 'bg-gray-100'
                  }`}>
                    {(() => {
                      const Icon = OCCASION_TYPES.find(o => o.id === formData.occasionType)?.icon || Sparkles;
                      return <Icon className={`w-6 h-6 ${
                        OCCASION_TYPES.find(o => o.id === formData.occasionType)?.color || 'text-gray-500'
                      }`} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {formData.occasionName || OCCASION_TYPES.find(o => o.id === formData.occasionType)?.name}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(formData.startDate)} {formatTime12(formData.startTime)} → {formatDate(formData.endDate)} {formatTime12(formData.endTime)} · {formData.totalDays} day{formData.totalDays === 1 ? '' : 's'}
                    </p>
                    <p className="text-gray-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {formData.baseLocation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{formData.totalDays}</div>
                  <div className="text-sm text-gray-500">Days</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{totals.totalVehicles}</div>
                  <div className="text-sm text-gray-500">Vehicles</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{totals.totalServices}</div>
                  <div className="text-sm text-gray-500">Services</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">{totals.totalPeopleCapacity}</div>
                  <div className="text-sm text-gray-500">Capacity</div>
                </div>
              </div>

              {/* Day-wise Summary */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-700">Day-wise Breakdown</h4>
                {formData.days.map((day, idx) => (
                  <div key={day.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Day {idx + 1} - {formatDate(day.date)}</span>
                      <button
                        type="button"
                        onClick={() => { setCurrentStep(2); setExpandedDays([day.id]); }}
                        className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <div className="space-y-2">
                      {day.services.map((service, sIdx) => {
                        const serviceConfig = SERVICE_TYPES[service.serviceType as ServiceTypeKey];
                        if (service.selectedVehicles.length === 0) {
                          return (
                            <div key={service.id} className="flex justify-between text-sm text-gray-500 italic">
                              <span>
                                {serviceConfig.label} — no vehicle selected (custom quote)
                                {service.pickupLocation && ` · ${service.pickupLocation}`}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={service.id} className="bg-white rounded-lg p-2 border border-gray-100">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              {serviceConfig.label}
                              {service.pickupLocation && <span className="ml-1 normal-case font-normal text-gray-400">· {service.pickupLocation}</span>}
                            </div>
                            {service.selectedVehicles.map((sv) => {
                              const vehicle = lookupVehicle(fleetByService, service.serviceType, sv.vehicleId);
                              const displayName = vehicle
                                ? `${vehicle.brand ? vehicle.brand + ' ' : ''}${vehicle.name}`
                                : 'Vehicle';
                              return (
                                <div key={sv.vehicleId} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{sv.count}x {displayName}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Contact Details</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium">{formData.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{formData.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>{' '}
                    <span className="font-medium">{formData.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Quote info */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">Custom Quote</p>
                    <p className="text-green-100 text-sm mt-1">Our team will share detailed pricing based on your requirements.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-sm">You'll receive</p>
                    <p className="font-semibold">Detailed quotation</p>
                    <p className="text-green-100 text-sm">within 2 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{submitError}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Summary Bar */}
      {currentStep === 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totals.totalVehicles}</div>
                <div className="text-xs text-gray-500">Vehicles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totals.totalServices}</div>
                <div className="text-xs text-gray-500">Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totals.totalPeopleCapacity}</div>
                <div className="text-xs text-gray-500">Capacity</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <ChevronDown className="w-4 h-4 rotate-90" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceed()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {currentStep !== 2 && (
        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Booking Request
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spacer for floating bar */}
      {currentStep === 2 && <div className="h-24" />}
    </div>
  );
}
