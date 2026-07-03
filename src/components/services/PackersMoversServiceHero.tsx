'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Star, Shield, Package, CheckCircle2,
  Headphones, BadgeCheck, MapPin, Calendar,
  Phone, User, ChevronRight, ArrowLeft,
  Loader2, Check, Clock, Lock,
  ChevronDown, Search, X,
  Home, Building2, Car, Bike, ArrowLeftRight,
  Bed, Refrigerator, Tv2, Weight,
  Armchair, Warehouse, Sofa, Utensils,
  WashingMachine, DoorClosed, Microwave,
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomer';
import { DynamicChatBookingHero } from '@/components/booking/DynamicChatBookingHero';

/* ─── City Picker ────────────────────────────────────────── */

function CityPicker({
  value, onChange, placeholder, locations, allowCustom,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  locations: { name: string }[];
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
      <button type="button" onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={`w-full h-[44px] pl-9 pr-8 bg-white border text-sm text-left rounded-xl transition-all ${value ? 'text-gray-800 font-medium' : 'text-gray-400'} ${open ? 'border-blue-400 ring-4 ring-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
        {value || placeholder}
      </button>
      {value && (
        <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search city…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {allowCustom && search.trim() && !filtered.some(l => l.name.toLowerCase() === search.toLowerCase()) && (
              <button type="button" onClick={() => { onChange(search.trim()); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 border-b border-gray-50">
                + Add &ldquo;{search.trim()}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !(allowCustom && search.trim()) && (
              <p className="text-center text-sm text-gray-400 py-5">No cities found</p>
            )}
            {filtered.map(loc => (
              <button key={loc.name} type="button" onClick={() => { onChange(loc.name); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === loc.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step Progress Bar ──────────────────────────────────── */

const STEPS = [
  { n: 1, label: 'Move' },
  { n: 2, label: 'Pickup' },
  { n: 3, label: 'Drop' },
  { n: 4, label: 'Schedule' },
  { n: 5, label: 'Goods' },
  { n: 6, label: 'Services' },
  { n: 7, label: 'Contact' },
];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-5">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              step > s.n ? 'bg-blue-600 text-white' :
              step === s.n ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
              'bg-white border border-gray-200 text-gray-400'
            }`}>
              {step > s.n ? <Check className="w-3 h-3" /> : s.n}
            </div>
            <span className={`text-[9px] font-semibold mt-0.5 ${step >= s.n ? 'text-blue-700' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-[2px] bg-gray-200 rounded-full overflow-hidden mb-3">
              <div className={`h-full bg-blue-600 transition-all duration-500 ${step > s.n ? 'w-full' : 'w-0'}`} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Small toggle chips ─────────────────────────────────── */

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[{ v: true, label: 'Yes' }, { v: false, label: 'No' }].map(opt => (
        <button key={String(opt.v)} type="button" onClick={() => onChange(opt.v)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
            value === opt.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}>
          {opt.v ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Full Quote Form ────────────────────────────────────── */

function PackersQuoteWidget({ cityName }: { cityName: string }) {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [done, setDone] = useState(false);

  // ── Step 1: Move type
  const [shiftingScope,  setShiftingScope]  = useState('INTERCITY');
  const [shiftingType,   setShiftingType]   = useState('Home');
  const [homeSize,       setHomeSize]       = useState('BHK_2');
  const [officeSize,     setOfficeSize]     = useState('UPTO_10_EMPLOYEES');
  const [vehicleSubType, setVehicleSubType] = useState('CAR');

  // ── Step 2: Pickup
  const [fromCity,      setFromCity]      = useState(cityName || '');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [pickupFloor,   setPickupFloor]   = useState('');
  const [pickupLift,    setPickupLift]    = useState<boolean | null>(null);

  // ── Step 3: Drop
  const [toCity,      setToCity]      = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropPincode, setDropPincode] = useState('');
  const [dropFloor,   setDropFloor]   = useState('');
  const [dropLift,    setDropLift]    = useState<boolean | null>(null);

  // ── Step 4: Schedule
  const [shiftDate,      setShiftDate]      = useState('');
  const [shiftTime,      setShiftTime]      = useState('09:00');
  const [deliveryDate,   setDeliveryDate]   = useState('');
  const [deliveryTime,   setDeliveryTime]   = useState('');

  // ── Step 5: Goods
  const INVENTORY_ITEMS = [
    { key: 'bedroom',  label: 'Bedroom set',    icon: <Bed className="w-4 h-4" /> },
    { key: 'kitchen',  label: 'Kitchen items',  icon: <Utensils className="w-4 h-4" /> },
    { key: 'sofa',     label: 'Sofa',           icon: <Sofa className="w-4 h-4" /> },
    { key: 'dining',   label: 'Dining set',     icon: <Armchair className="w-4 h-4" /> },
    { key: 'fridge',   label: 'Fridge',         icon: <Refrigerator className="w-4 h-4" /> },
    { key: 'tv',       label: 'TV',             icon: <Tv2 className="w-4 h-4" /> },
    { key: 'almirah',  label: 'Almirah',        icon: <DoorClosed className="w-4 h-4" /> },
    { key: 'washing',  label: 'Washing machine',icon: <WashingMachine className="w-4 h-4" /> },
  ];
  const [itemCounts,      setItemCounts]      = useState<Record<string, number>>({});
  const [inventoryExtra,  setInventoryExtra]  = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [hasHeavyItems,   setHasHeavyItems]   = useState<boolean | null>(null);
  const [heavyItemsDesc,  setHeavyItemsDesc]  = useState('');
  const [hasFragileItems, setHasFragileItems] = useState<boolean | null>(null);
  const [fragileItemsDesc, setFragileItemsDesc] = useState('');

  // ── Step 6: Services
  const [needPacking,       setNeedPacking]       = useState<boolean | null>(null);
  const [needLoading,       setNeedLoading]       = useState<boolean | null>(null);
  const [needUnloading,     setNeedUnloading]     = useState<boolean | null>(null);
  const [labourCount,       setLabourCount]       = useState('');
  const [vehicleTypeReq,    setVehicleTypeReq]    = useState('DEDICATED');
  const [partLoad,          setPartLoad]          = useState<boolean | null>(null);
  const [needInsurance,     setNeedInsurance]     = useState<boolean | null>(null);
  const [insuranceValue,    setInsuranceValue]    = useState('');
  const [requiresPod,       setRequiresPod]       = useState<boolean | null>(null);
  const [multipleStops,     setMultipleStops]     = useState<boolean | null>(null);
  const [multipleStopsDesc, setMultipleStopsDesc] = useState('');

  // ── Step 7: Contact
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [receiverName,  setReceiverName]  = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [notes,         setNotes]         = useState('');
  const [err,           setErr]           = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/locations?serviceSlug=packers-and-movers&type=CITY')
      .then(r => r.json()).then(d => { if (d.locations) setLocations(d.locations); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated && customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
    }
  }, [isAuthenticated, customer]);

  const go = (n: number) => { setErr(''); setStep(n); };

  const validate = (n: number): string => {
    if (n === 2) {
      if (!fromCity.trim()) return 'Select pickup city';
      if (!pickupAddress.trim()) return 'Enter pickup address';
    }
    if (n === 3) {
      if (!toCity.trim()) return 'Enter destination city';
      if (!dropAddress.trim()) return 'Enter drop address';
    }
    if (n === 7) {
      if (!name.trim()) return 'Enter your name';
      if (phone.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit mobile';
    }
    return '';
  };

  const next = (to: number) => {
    const e = validate(step);
    if (e) { setErr(e); return; }
    go(to);
  };

  const onSubmit = async () => {
    const e = validate(7);
    if (e) { setErr(e); return; }
    setLoading(true); setSubmitErr('');
    const bookingType = shiftingType === 'Office' ? 'packers-office' : shiftingType === 'Vehicle' ? 'packers-vehicle' : 'packers-home';
    const inventoryStr = (() => {
      const parts = INVENTORY_ITEMS
        .filter(i => (itemCounts[i.key] || 0) > 0)
        .map(i => `${itemCounts[i.key]} ${i.label}${(itemCounts[i.key] || 0) > 1 ? 's' : ''}`);
      if (inventoryExtra.trim()) parts.push(inventoryExtra.trim());
      return parts.join(', ') || null;
    })();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingType,
          customerInfo: {
            name:  name.trim(),
            phone: phone.trim(),
            email: `${phone.trim()}@transrentals.in`,
          },
          bookingData: {
            location_name:          fromCity.trim(),
            pickup_full_address:    pickupAddress.trim(),
            destination:            toCity.trim(),
            destination_full_address: dropAddress.trim(),
            journey_datetime:       shiftDate ? `${shiftDate} ${shiftTime || '09:00'}:00` : undefined,
            shifting_scope:         shiftingScope,
            shifting_type:          shiftingType,
            home_shifting:          shiftingType === 'Home'    ? homeSize    : undefined,
            office_shifting:        shiftingType === 'Office'  ? officeSize  : undefined,
            vehicle_shifting:       shiftingType === 'Vehicle' ? vehicleSubType : undefined,
            pickup_pincode:         pickupPincode || undefined,
            pickup_floor:           pickupFloor !== '' ? parseInt(pickupFloor) : undefined,
            has_pickup_lift:        pickupLift ?? undefined,
            drop_pincode:           dropPincode || undefined,
            drop_floor:             dropFloor !== '' ? parseInt(dropFloor) : undefined,
            has_drop_lift:          dropLift ?? undefined,
            expected_delivery_date: deliveryDate || undefined,
            expected_delivery_time: deliveryTime || undefined,
            inventory_list:         inventoryStr || undefined,
            estimated_weight:       estimatedWeight ? parseFloat(estimatedWeight) : undefined,
            has_heavy_items:        hasHeavyItems ?? false,
            heavy_items_desc:       heavyItemsDesc || undefined,
            has_fragile_items:      hasFragileItems ?? false,
            fragile_items_desc:     fragileItemsDesc || undefined,
            need_packing:           needPacking ?? true,
            need_loading:           needLoading ?? true,
            need_unloading:         needUnloading ?? true,
            labour_count:           labourCount ? parseInt(labourCount) : undefined,
            vehicle_type_req:       vehicleTypeReq,
            part_load_accepted:     partLoad ?? false,
            need_insurance:         needInsurance ?? false,
            insurance_value:        insuranceValue ? parseFloat(insuranceValue) : undefined,
            requires_pod:           requiresPod ?? false,
            receiver_name:          receiverName || undefined,
            receiver_phone:         receiverPhone || undefined,
            has_multiple_stops:     multipleStops ?? false,
            multiple_stops_details: multipleStopsDesc || undefined,
            other_info:             notes || undefined,
          },
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Something went wrong'); }
      setDone(true);
    } catch (err: unknown) {
      setSubmitErr(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-[44px] px-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all';
  const lbl = 'block text-xs font-semibold text-gray-700 mb-1.5';
  const backBtn = 'flex-none w-[80px] h-11 border border-gray-200 bg-white text-gray-400 font-bold rounded-2xl flex items-center justify-center gap-1 hover:bg-gray-50 hover:text-gray-700 transition-all text-sm';
  const nextBtn = 'flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 text-sm';

  /* ── SUCCESS ── */
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <svg viewBox="0 0 52 52" className="w-16 h-16 mb-3">
          <circle cx="26" cy="26" r="24" fill="none" stroke="#2563EB" strokeWidth="2.5" />
          <path fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
        </svg>
        <h2 className="text-lg font-black text-gray-900 mb-1">Quote Request Sent!</h2>
        <p className="text-sm text-gray-500 mb-4">You will get the best quote soon from multiple vendors.</p>
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5 mb-4">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="text-left">
            <small className="block text-[11px] text-gray-400">Expected response</small>
            <b className="text-sm text-blue-700">within 15 minutes</b>
          </div>
        </div>
        <button onClick={() => { setDone(false); setStep(1); setFromCity(cityName || ''); setToCity(''); }}
          className="text-sm text-gray-400 hover:text-gray-600 font-medium">New Request</button>
      </div>
    );
  }

  return (
    <div>
      <StepBar step={step} />

      {/* ── STEP 1: Move type ── */}
      {step === 1 && (
        <div>
          <h2 className="text-[16px] font-black text-gray-900 mb-0.5">What is your move?</h2>
          <p className="text-[11.5px] text-gray-400 mb-4">Tell us the scope and type of your shift.</p>

          <label className={lbl}>Scope of Move</label>
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {([
              { v: 'LOCAL',     icon: <MapPin className="w-5 h-5" />,          label: 'Local',     sub: 'Within city'   },
              { v: 'DOMESTIC',  icon: <ArrowLeftRight className="w-5 h-5" />,  label: 'Domestic',  sub: 'Within state'  },
              { v: 'INTERCITY', icon: <Truck className="w-5 h-5" />,           label: 'Intercity', sub: 'Across states' },
            ] as const).map(o => (
              <button key={o.v} type="button" onClick={() => setShiftingScope(o.v)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${shiftingScope === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <span className={shiftingScope === o.v ? 'text-blue-600' : 'text-gray-400'}>{o.icon}</span>
                <b className={`text-[11px] font-bold leading-tight ${shiftingScope === o.v ? 'text-blue-700' : 'text-gray-700'}`}>{o.label}</b>
                <small className={`text-[9px] ${shiftingScope === o.v ? 'text-blue-500' : 'text-gray-400'}`}>{o.sub}</small>
              </button>
            ))}
          </div>

          <label className={lbl}>Type of Shifting</label>
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {([
              { v: 'Home',    icon: <Home className="w-5 h-5" />,      sub: 'Household'  },
              { v: 'Office',  icon: <Building2 className="w-5 h-5" />, sub: 'Office move' },
              { v: 'Vehicle', icon: <Car className="w-5 h-5" />,       sub: 'Car / Bike' },
            ] as const).map(o => (
              <button key={o.v} type="button" onClick={() => setShiftingType(o.v)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${shiftingType === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <span className={shiftingType === o.v ? 'text-blue-600' : 'text-gray-400'}>{o.icon}</span>
                <b className={`text-[11px] font-bold ${shiftingType === o.v ? 'text-blue-700' : 'text-gray-700'}`}>{o.v}</b>
                <small className={`text-[9px] ${shiftingType === o.v ? 'text-blue-500' : 'text-gray-400'}`}>{o.sub}</small>
              </button>
            ))}
          </div>

          {shiftingType === 'Home' && (
            <>
              <label className={lbl}>Home Size</label>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {[
                  { v: 'BHK_1',  label: '1 BHK' },
                  { v: 'BHK_2',  label: '2 BHK' },
                  { v: 'BHK_3',  label: '3 BHK' },
                  { v: 'BHK_4',  label: '4 BHK' },
                  { v: 'VILLA',  label: 'Villa'  },
                  { v: 'STUDIO', label: 'Studio' },
                ].map(o => (
                  <button key={o.v} type="button" onClick={() => setHomeSize(o.v)}
                    className={`py-2 text-sm font-semibold rounded-xl border transition-all ${homeSize === o.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {shiftingType === 'Office' && (
            <>
              <label className={lbl}>Office Size</label>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {[
                  { v: 'UPTO_10_EMPLOYEES',          label: '1–10 Employees'   },
                  { v: 'UPTO_50_EMPLOYEES',           label: '11–50 Employees'  },
                  { v: 'UPTO_100_EMPLOYEES',          label: '51–100 Employees' },
                  { v: 'MORE_THAN_100_EMPLOYEES',     label: '100+ Employees'   },
                ].map(o => (
                  <button key={o.v} type="button" onClick={() => setOfficeSize(o.v)}
                    className={`py-2 text-sm font-semibold rounded-xl border transition-all ${officeSize === o.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {shiftingType === 'Vehicle' && (
            <>
              <label className={lbl}>Vehicle Type</label>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {([
                  { v: 'CAR',  label: 'Car',  icon: <Car className="w-4 h-4" /> },
                  { v: 'BIKE', label: 'Bike', icon: <Bike className="w-4 h-4" /> },
                  { v: 'BOTH', label: 'Both', icon: <Truck className="w-4 h-4" /> },
                ] as const).map(o => (
                  <button key={o.v} type="button" onClick={() => setVehicleSubType(o.v)}
                    className={`flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border transition-all ${vehicleSubType === o.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    {o.icon}{o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <button type="button" onClick={() => next(2)} className={`${nextBtn} w-full`}>
            Next: Pickup Details <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Pickup ── */}
      {step === 2 && (
        <div>
          <h2 className="text-[16px] font-black text-gray-900 mb-0.5">Pickup Details</h2>
          <p className="text-[11.5px] text-gray-400 mb-4">Where are we picking up from?</p>

          <label className={lbl}>Pickup City <span className="text-red-500">*</span></label>
          <div className="mb-3">
            <CityPicker value={fromCity} onChange={v => { setFromCity(v); setErr(''); }} placeholder="Select pickup city" locations={locations} />
          </div>

          <label className={lbl}>Full Pickup Address <span className="text-red-500">*</span></label>
          <textarea value={pickupAddress} onChange={e => { setPickupAddress(e.target.value); setErr(''); }} rows={2}
            placeholder="Building, street, area, landmark…"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none mb-3" />

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div>
              <label className={lbl}>Pincode</label>
              <input type="tel" maxLength={6} placeholder="6-digit pincode" value={pickupPincode}
                onChange={e => setPickupPincode(e.target.value.replace(/\D/g, ''))} className={inputCls} />
            </div>
            <div>
              <label className={lbl}>Floor No.</label>
              <input type="number" min={0} placeholder="0 = ground" value={pickupFloor}
                onChange={e => setPickupFloor(e.target.value)} className={inputCls} />
            </div>
          </div>

          <label className={lbl}>Lift / Elevator at Pickup?</label>
          <div className="mb-1"><YesNo value={pickupLift} onChange={setPickupLift} /></div>

          {err && <p className="text-xs text-red-500 font-semibold mt-2">{err}</p>}
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => go(1)} className={backBtn}><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={() => next(3)} className={nextBtn}>Next: Drop Details <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Drop ── */}
      {step === 3 && (
        <div>
          <h2 className="text-[16px] font-black text-gray-900 mb-0.5">Drop Details</h2>
          <p className="text-[11.5px] text-gray-400 mb-4">Where are we delivering to?</p>

          <label className={lbl}>Destination City <span className="text-red-500">*</span></label>
          <div className="mb-3">
            <CityPicker value={toCity} onChange={v => { setToCity(v); setErr(''); }} placeholder="Enter destination city" locations={locations} allowCustom />
          </div>

          <label className={lbl}>Full Drop Address <span className="text-red-500">*</span></label>
          <textarea value={dropAddress} onChange={e => { setDropAddress(e.target.value); setErr(''); }} rows={2}
            placeholder="Building, street, area, landmark…"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none mb-3" />

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div>
              <label className={lbl}>Pincode</label>
              <input type="tel" maxLength={6} placeholder="6-digit pincode" value={dropPincode}
                onChange={e => setDropPincode(e.target.value.replace(/\D/g, ''))} className={inputCls} />
            </div>
            <div>
              <label className={lbl}>Floor No.</label>
              <input type="number" min={0} placeholder="0 = ground" value={dropFloor}
                onChange={e => setDropFloor(e.target.value)} className={inputCls} />
            </div>
          </div>

          <label className={lbl}>Lift / Elevator at Drop?</label>
          <div className="mb-1"><YesNo value={dropLift} onChange={setDropLift} /></div>

          {err && <p className="text-xs text-red-500 font-semibold mt-2">{err}</p>}
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => go(2)} className={backBtn}><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={() => next(4)} className={nextBtn}>Next: Schedule <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Schedule ── */}
      {step === 4 && (
        <div>
          <h2 className="text-[16px] font-black text-gray-900 mb-0.5">Schedule</h2>
          <p className="text-[11.5px] text-gray-400 mb-4">When do you need the move?</p>

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div>
              <label className={lbl}>Shift Date</label>
              <label className="relative block cursor-pointer">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="date" min={today} value={shiftDate} onChange={e => setShiftDate(e.target.value)}
                  className={`${inputCls} pl-9 cursor-pointer`} />
              </label>
            </div>
            <div>
              <label className={lbl}>Pickup Time</label>
              <label className="relative block cursor-pointer">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="time" value={shiftTime} onChange={e => setShiftTime(e.target.value)}
                  className={`${inputCls} pl-9 cursor-pointer`} />
              </label>
            </div>
          </div>

          <label className={lbl}>Expected Delivery Date <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
          <label className="relative block cursor-pointer mb-3">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="date" min={shiftDate || today} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
              className={`${inputCls} pl-9 cursor-pointer`} />
          </label>

          <label className={lbl}>Preferred Delivery Time</label>
          <div className="grid grid-cols-2 gap-1.5 mb-1">
            {[
              { v: 'MORNING',   label: 'Morning (8–12)'   },
              { v: 'AFTERNOON', label: 'Afternoon (12–4)' },
              { v: 'EVENING',   label: 'Evening (4–8)'    },
              { v: 'ANYTIME',   label: 'Anytime'          },
            ].map(o => (
              <button key={o.v} type="button" onClick={() => setDeliveryTime(o.v)}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${deliveryTime === o.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                {o.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => go(3)} className={backBtn}><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={() => next(5)} className={nextBtn}>Next: Goods <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Goods ── */}
      {step === 5 && (
        <div>
          <h2 className="text-[16px] font-black text-gray-900 mb-0.5">Goods Details</h2>
          <p className="text-[11.5px] text-gray-400 mb-4">Help vendors quote accurately.</p>

          <label className={lbl}>Main Items / Inventory</label>
          <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3">
            {INVENTORY_ITEMS.map((item, idx) => {
              const count = itemCounts[item.key] || 0;
              return (
                <div key={item.key}
                  className={`flex items-center justify-between px-3 py-2.5 ${idx < INVENTORY_ITEMS.length - 1 ? 'border-b border-gray-100' : ''} ${count > 0 ? 'bg-blue-50' : 'bg-white'}`}>
                  <span className="flex items-center gap-2 text-sm">
                    <span className={count > 0 ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                    <span className={`font-medium ${count > 0 ? 'text-blue-700' : 'text-gray-700'}`}>{item.label}</span>
                    {count > 0 && <span className="text-xs text-blue-500 font-semibold">× {count}</span>}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button type="button"
                      onClick={() => setItemCounts(prev => ({ ...prev, [item.key]: Math.max(0, (prev[item.key] || 0) - 1) }))}
                      disabled={count === 0}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center text-lg font-bold transition-all ${count > 0 ? 'border-blue-300 text-blue-600 hover:bg-blue-100' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}>
                      −
                    </button>
                    <span className={`w-5 text-center text-sm font-bold ${count > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{count}</span>
                    <button type="button"
                      onClick={() => setItemCounts(prev => ({ ...prev, [item.key]: (prev[item.key] || 0) + 1 }))}
                      className="w-7 h-7 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-100 flex items-center justify-center text-lg font-bold transition-all">
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <textarea value={inventoryExtra} onChange={e => setInventoryExtra(e.target.value)} rows={2}
            placeholder="Any other items? (e.g. 3 ACs, treadmill, piano…)"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none mb-3" />

          <label className={lbl}>Estimated Weight / Volume</label>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {([
              { v: '250',  icon: <Package className="w-3.5 h-3.5" />,  label: 'Light (< 500 kg)'      },
              { v: '1000', icon: <Package className="w-3.5 h-3.5" />,  label: 'Medium (500–1500 kg)'  },
              { v: '2250', icon: <Weight className="w-3.5 h-3.5" />,   label: 'Heavy (1500–3000 kg)'  },
              { v: '4000', icon: <Truck className="w-3.5 h-3.5" />,    label: 'Very Heavy (> 3000 kg)' },
            ] as const).map(o => (
              <button key={o.v} type="button" onClick={() => setEstimatedWeight(o.v)}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border transition-all ${estimatedWeight === o.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                {o.icon}{o.label}
              </button>
            ))}
          </div>

          <label className={lbl}>Heavy Items? (piano, safe, large appliances)</label>
          <div className="mb-2"><YesNo value={hasHeavyItems} onChange={setHasHeavyItems} /></div>
          {hasHeavyItems && (
            <input type="text" placeholder="Describe heavy items…" value={heavyItemsDesc} onChange={e => setHeavyItemsDesc(e.target.value)}
              className={`${inputCls} mb-3`} />
          )}

          <label className={lbl}>Fragile Items? (glassware, artwork, electronics)</label>
          <div className="mb-2"><YesNo value={hasFragileItems} onChange={setHasFragileItems} /></div>
          {hasFragileItems && (
            <input type="text" placeholder="Describe fragile items…" value={fragileItemsDesc} onChange={e => setFragileItemsDesc(e.target.value)}
              className={`${inputCls} mb-1`} />
          )}

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => go(4)} className={backBtn}><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={() => next(6)} className={nextBtn}>Next: Services <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ── STEP 6: Services & Insurance ── */}
      {step === 6 && (
        <div>
          <h2 className="text-[16px] font-black text-gray-900 mb-0.5">Services & Insurance</h2>
          <p className="text-[11.5px] text-gray-400 mb-4">What do you need from the movers?</p>

          <div className="space-y-3 mb-3">
            <div>
              <label className={lbl}>Packing Service Needed?</label>
              <YesNo value={needPacking} onChange={setNeedPacking} />
            </div>
            <div>
              <label className={lbl}>Loading Help Needed?</label>
              <YesNo value={needLoading} onChange={setNeedLoading} />
            </div>
            <div>
              <label className={lbl}>Unloading Help Needed?</label>
              <YesNo value={needUnloading} onChange={setNeedUnloading} />
            </div>
          </div>

          <label className={lbl}>Labour Workers Needed <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
          <input type="number" min={1} placeholder="e.g. 2" value={labourCount} onChange={e => setLabourCount(e.target.value)}
            className={`${inputCls} mb-3`} />

          <label className={lbl}>Truck Type</label>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {([
              { v: 'SHARED',    icon: <Warehouse className="w-4 h-4" />, label: 'Shared (cheaper)' },
              { v: 'DEDICATED', icon: <Truck className="w-4 h-4" />,     label: 'Dedicated truck'  },
            ] as const).map(o => (
              <button key={o.v} type="button" onClick={() => setVehicleTypeReq(o.v)}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border transition-all ${vehicleTypeReq === o.v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                {o.icon}{o.label}
              </button>
            ))}
          </div>

          <label className={lbl}>Part Load OK? (sharing truck space)</label>
          <div className="mb-3"><YesNo value={partLoad} onChange={setPartLoad} /></div>

          <label className={lbl}>Transit Insurance?</label>
          <div className="mb-2"><YesNo value={needInsurance} onChange={setNeedInsurance} /></div>
          {needInsurance && (
            <>
              <label className={lbl}>Estimated Goods Value (₹)</label>
              <input type="number" placeholder="e.g. 200000" value={insuranceValue} onChange={e => setInsuranceValue(e.target.value)}
                className={`${inputCls} mb-3`} />
            </>
          )}

          <label className={lbl}>Proof of Delivery (POD)?</label>
          <div className="mb-3"><YesNo value={requiresPod} onChange={setRequiresPod} /></div>

          <label className={lbl}>Multiple Stops?</label>
          <div className="mb-2"><YesNo value={multipleStops} onChange={setMultipleStops} /></div>
          {multipleStops && (
            <input type="text" placeholder="Describe the stops…" value={multipleStopsDesc} onChange={e => setMultipleStopsDesc(e.target.value)}
              className={`${inputCls} mb-1`} />
          )}

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => go(5)} className={backBtn}><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={() => next(7)} className={nextBtn}>Next: Contact <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ── STEP 7: Contact ── */}
      {step === 7 && (
        <div>
          <h2 className="text-[16px] font-black text-gray-900 mb-0.5">Your Contact Details</h2>
          <p className="text-[11.5px] text-gray-400 mb-4">We&apos;ll send quotes here.</p>

          <label className={lbl}>Name <span className="text-red-500">*</span></label>
          <div className="relative mb-3">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input required type="text" placeholder="Your full name" value={name}
              onChange={e => { setName(e.target.value); setErr(''); }} className={`${inputCls} pl-9`} />
          </div>

          <label className={lbl}>Mobile <span className="text-red-500">*</span></label>
          <div className="relative mb-3">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input required type="tel" maxLength={10} placeholder="10-digit mobile" value={phone}
              onChange={e => { setPhone(e.target.value); setErr(''); }} className={`${inputCls} pl-9`} />
          </div>

          {(shiftingScope === 'INTERCITY' || shiftingScope === 'DOMESTIC') && (
            <>
              <label className={lbl}>Receiver Name at Destination <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
              <div className="relative mb-3">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Who will receive the goods?" value={receiverName}
                  onChange={e => setReceiverName(e.target.value)} className={`${inputCls} pl-9`} />
              </div>
              <label className={lbl}>Receiver Phone <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
              <div className="relative mb-3">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" maxLength={10} placeholder="Receiver's mobile number" value={receiverPhone}
                  onChange={e => setReceiverPhone(e.target.value.replace(/\D/g, ''))} className={`${inputCls} pl-9`} />
              </div>
            </>
          )}

          <label className={lbl}>Additional Notes <small className="text-[10px] text-gray-400 font-normal">(optional)</small></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Any special requirements…"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 resize-none mb-1" />

          {err && <p className="text-xs text-red-500 font-semibold mb-2">{err}</p>}
          {submitErr && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">{submitErr}</p>}

          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => go(6)} className={backBtn}><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={onSubmit} disabled={loading}
              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-100 text-sm transition-all">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Get Free Quotes'}
            </button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-2">
            <Lock className="w-3 h-3" /> No advance payment · Best price guaranteed
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Hero ──────────────────────────────────────────── */

export function PackersMoversServiceHero({ cityName = '' }: { cityName?: string }) {
  const [showChat, setShowChat] = useState(false);

  return (
    <section id="booking" className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-cyan-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="container-custom relative py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center">

          {/* ── LEFT ── */}
          <div className="w-full lg:flex-1 order-2 lg:order-1">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 px-3.5 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {cityName ? `Packers & Movers in ${cityName}` : 'Packers & Movers'}
              </div>
              <div className="inline-flex items-center gap-1 bg-amber-400/15 border border-amber-400/25 text-amber-300 px-3 py-1.5 rounded-full text-xs font-bold">
                ₹ 1 BHK from ₹3,999
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-4 tracking-tight">
              Professional Packers<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                & Movers You Can Trust
              </span>
            </h1>

            <p className="text-gray-300 text-base leading-relaxed mb-6 max-w-sm">
              Verified, insured relocation teams for home shifting, office moves & vehicle transport.
              Get free quotes from top-rated movers near you.
            </p>

            <ul className="space-y-2.5 mb-7">
              {[
                'IBA-approved movers — home, office & vehicle shifting',
                'Transit insurance included — goods 100% protected',
                '150+ verified operators · compare quotes instantly',
              ].map((h, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  </span>
                  <span className="text-gray-200 text-sm">{h}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="text-white text-xs font-bold">4.8 / 5</span>
                <span className="text-gray-500 text-xs">1,800+ reviews</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                <Headphones className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-white text-xs font-bold">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
                <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white text-xs font-bold">150+ Verified</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: booking card ── */}
          <div className="w-full lg:w-[500px] shrink-0 order-1 lg:order-2">
            <div className="bg-white rounded-[28px] shadow-2xl shadow-black/20 overflow-hidden flex flex-col lg:h-[640px]">

              {/* Header */}
              <div className="flex items-center justify-between px-[18px] h-[72px] border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative w-[42px] h-[42px] rounded-[13px] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200/60">
                    <Truck className="w-[22px] h-[22px] text-white" />
                    <span className="absolute bottom-[-1px] right-[-1px] w-[11px] h-[11px] rounded-full bg-blue-400 border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-[17px] font-black text-gray-900 leading-tight">Get Free Quotes</p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">No advance payment required</p>
                  </div>
                </div>
                {showChat ? (
                  <button onClick={() => setShowChat(false)}
                    className="text-[11.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-[9px] px-3 py-1.5 hover:bg-blue-100 transition-colors whitespace-nowrap">
                    ← Back to form
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                    <Shield className="w-3 h-3" /> 100% Safe
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-y-auto px-[18px] py-4
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-200
                [&::-webkit-scrollbar-thumb]:rounded-full">
                {showChat
                  ? <DynamicChatBookingHero hideHeader serviceType="packers-and-movers" defaultLocation={cityName} />
                  : <PackersQuoteWidget cityName={cityName} />
                }
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-[18px] h-[60px] border-t border-gray-100 bg-white shrink-0">
                <div className="flex flex-col gap-[3px]">
                  {['Best Price Guarantee', '150+ Verified Movers', '15 Min Callback'].map(item => (
                    <div key={item} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                      <Check className="w-[13px] h-[13px] text-blue-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowChat(s => !s)}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-blue-700 hover:text-blue-500 transition-colors whitespace-nowrap">
                  {showChat ? '← Back to form' : <>Book with AI <ChevronRight className="w-3.5 h-3.5" /></>}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
