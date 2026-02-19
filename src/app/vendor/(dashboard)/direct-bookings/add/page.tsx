'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Phone, Mail, Car, Calendar,
  MapPin, MessageSquare, Save, Loader2,
  CheckCircle2, IndianRupee, Users, Clock,
  Package, Wrench, FileText, Shield,
} from 'lucide-react';

/* ─────────────────────────── Static data ─────────────────────────── */

const SERVICE_TYPES = [
  { value: 'car-with-driver', label: 'Car w/ Driver', icon: '🚗', bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-700',    grad: 'from-blue-500 to-cyan-500' },
  { value: 'self-drive',      label: 'Self-Drive',    icon: '🚙', bg: 'bg-violet-50',  border: 'border-violet-300',  text: 'text-violet-700',  grad: 'from-violet-500 to-purple-500' },
  { value: 'bike',            label: 'Bike',          icon: '🏍️', bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-700',  grad: 'from-orange-400 to-amber-500' },
  { value: 'bus',             label: 'Bus & Tempo',   icon: '🚌', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', grad: 'from-emerald-500 to-green-500' },
  { value: 'luxury',          label: 'Luxury Car',    icon: '✨', bg: 'bg-yellow-50',  border: 'border-yellow-300',  text: 'text-yellow-700',  grad: 'from-yellow-400 to-orange-400' },
  { value: 'transporter',     label: 'Transporter',   icon: '🚛', bg: 'bg-slate-50',   border: 'border-slate-300',   text: 'text-slate-700',   grad: 'from-slate-500 to-gray-600' },
  { value: 'packers-movers',  label: 'Packers',       icon: '📦', bg: 'bg-sky-50',     border: 'border-sky-300',     text: 'text-sky-700',     grad: 'from-sky-500 to-cyan-500' },
  { value: 'equipment',       label: 'Equipment',     icon: '🔧', bg: 'bg-red-50',     border: 'border-red-300',     text: 'text-red-700',     grad: 'from-red-500 to-rose-500' },
  { value: 'general',         label: 'General',       icon: '📋', bg: 'bg-gray-50',    border: 'border-gray-300',    text: 'text-gray-600',    grad: 'from-gray-400 to-gray-500' },
];

const VEHICLE_OPTIONS: Record<string, string[]> = {
  bike:              ['Activa', 'Royal Enfield', 'KTM', 'Pulsar', 'Apache', 'Splendor', 'Other'],
  bus:               ['12 Seater Tempo', '17 Seater Tempo', '20 Seater Tempo', '26 Seater Bus', '32 Seater Bus', '45 Seater Bus', 'Other'],
  'car-with-driver': ['Sedan', 'SUV', 'Hatchback', 'Innova', 'Fortuner', 'Ertiga', 'Other'],
  'self-drive':      ['Hatchback', 'Sedan', 'SUV', 'Creta', 'Seltos', 'Other'],
  luxury:            ['BMW', 'Mercedes', 'Audi', 'Range Rover', 'Jaguar', 'Other'],
  transporter:       ['Mini Truck', 'Pickup Van', 'Tata Ace', 'Tata 407', 'Truck (1 ton)', 'Truck (2 ton)', 'Truck (5 ton)', 'Other'],
  'packers-movers':  ['Small Move (1BHK)', 'Medium Move (2BHK)', 'Large Move (3BHK+)', 'Office Relocation', 'Other'],
  equipment:         ['JCB / Excavator', 'Crane', 'Hydra Crane', 'Generator', 'Concrete Mixer', 'Other'],
  general:           [],
};

const CAR_TRIP_TYPES   = ['Local (within city)', 'Outstation – One Way', 'Outstation – Round Trip', 'Airport Pickup', 'Airport Drop'];
const BUS_TRIP_TYPES   = ['Local / Sightseeing', 'Outstation Trip', 'Wedding', 'Pilgrimage / Religious', 'Corporate / Office', 'School / College'];
const LUXURY_OCCASIONS = ['Wedding', 'Corporate Event', 'Birthday', 'Anniversary', 'Photoshoot', 'Airport Transfer', 'Other'];
const MOVE_SIZES       = ['1 BHK', '2 BHK', '3 BHK', '3+ BHK / Villa', 'Office / Commercial'];
const GOODS_TYPES      = ['Household Goods', 'Raw Materials', 'Agricultural Produce', 'Electronics / Fragile', 'Machinery / Heavy', 'Other'];
const EQUIP_DURATIONS  = ['Half Day (4 hrs)', 'Full Day (8 hrs)', '2 Days', '3 Days', 'Weekly', 'Monthly'];

/* ─────────────────────────── Shared styles ───────────────────────── */
const inp     = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const inpIcon = 'w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const iconPos = 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400';
const lbl     = 'block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2';

function SectionTitle({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
    </div>
  );
}

/* ─────────────────────── Service-specific fields ─────────────────── */
function ServiceFields({ serviceType, form, set }: { serviceType: string; form: any; set: (k: string, v: string) => void }) {
  if (serviceType === 'car-with-driver') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Trip Type</label>
        <select value={form.tripType} onChange={e => set('tripType', e.target.value)} className={inp + ' appearance-none bg-white'}>
          <option value="">Select trip type</option>
          {CAR_TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>Pickup Time</label>
        <div className="relative">
          <Clock className={iconPos} />
          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
        </div>
      </div>
    </div>
  );

  if (serviceType === 'self-drive') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Pickup Time</label>
        <div className="relative">
          <Clock className={iconPos} />
          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
        </div>
      </div>
      <div>
        <label className={lbl}>License No. <span className="normal-case font-normal text-gray-400">(optional)</span></label>
        <div className="relative">
          <Shield className={iconPos} />
          <input type="text" placeholder="DL-XXXX-XXXXXXXX" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} className={inpIcon} />
        </div>
      </div>
    </div>
  );

  if (serviceType === 'bike') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Pickup Time</label>
        <div className="relative">
          <Clock className={iconPos} />
          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
        </div>
      </div>
      <div>
        <label className={lbl}>Helmets Required</label>
        <select value={form.helmetCount} onChange={e => set('helmetCount', e.target.value)} className={inp + ' appearance-none bg-white'}>
          <option value="">No helmet</option>
          <option value="1">1 Helmet</option>
          <option value="2">2 Helmets</option>
        </select>
      </div>
    </div>
  );

  if (serviceType === 'bus') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Trip Type</label>
        <select value={form.tripType} onChange={e => set('tripType', e.target.value)} className={inp + ' appearance-none bg-white'}>
          <option value="">Select trip type</option>
          {BUS_TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>No. of Passengers</label>
        <div className="relative">
          <Users className={iconPos} />
          <input type="number" min="1" placeholder="e.g. 20" value={form.passengerCount} onChange={e => set('passengerCount', e.target.value)} className={inpIcon} />
        </div>
      </div>
    </div>
  );

  if (serviceType === 'luxury') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Occasion</label>
        <select value={form.occasion} onChange={e => set('occasion', e.target.value)} className={inp + ' appearance-none bg-white'}>
          <option value="">Select occasion</option>
          {LUXURY_OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>Pickup Time</label>
        <div className="relative">
          <Clock className={iconPos} />
          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
        </div>
      </div>
    </div>
  );

  if (serviceType === 'transporter') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Goods Type</label>
        <select value={form.goodsType} onChange={e => set('goodsType', e.target.value)} className={inp + ' appearance-none bg-white'}>
          <option value="">Select goods type</option>
          {GOODS_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>Approx. Weight / Load</label>
        <div className="relative">
          <Package className={iconPos} />
          <input type="text" placeholder="e.g. 500 kg, 2 tons" value={form.loadInfo} onChange={e => set('loadInfo', e.target.value)} className={inpIcon} />
        </div>
      </div>
    </div>
  );

  if (serviceType === 'packers-movers') return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Move Size</label>
          <select value={form.moveSize} onChange={e => set('moveSize', e.target.value)} className={inp + ' appearance-none bg-white'}>
            <option value="">Select size</option>
            {MOVE_SIZES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Packing Required?</label>
          <div className="flex gap-2 pt-0.5">
            {['Yes', 'No', 'Partial'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => set('packingRequired', opt)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition ${
                  form.packingRequired === opt
                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className={lbl}>Floor / Lift Access Info <span className="normal-case font-normal text-gray-400">(optional)</span></label>
        <div className="relative">
          <FileText className={iconPos} />
          <input type="text" placeholder="e.g. 3rd floor, no lift" value={form.floorInfo} onChange={e => set('floorInfo', e.target.value)} className={inpIcon} />
        </div>
      </div>
    </div>
  );

  if (serviceType === 'equipment') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Rental Duration</label>
        <select value={form.equipDuration} onChange={e => set('equipDuration', e.target.value)} className={inp + ' appearance-none bg-white'}>
          <option value="">Select duration</option>
          {EQUIP_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>Work / Site Location</label>
        <div className="relative">
          <MapPin className={iconPos} />
          <input type="text" placeholder="Site address or area" value={form.siteLocation} onChange={e => set('siteLocation', e.target.value)} className={inpIcon} />
        </div>
      </div>
    </div>
  );

  return null; // general — no extra fields
}

/* ─────────────────────────── Main page ──────────────────────────── */
export default function AddDirectBookingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    serviceType: 'car-with-driver', vehicleType: '',
    pickupDate: '', returnDate: '', pickupTime: '',
    pickupLocation: '', dropLocation: '',
    notes: '',
    // service-specific
    tripType: '', passengerCount: '', helmetCount: '',
    occasion: '', licenseNumber: '',
    goodsType: '', loadInfo: '',
    moveSize: '', packingRequired: '', floorInfo: '',
    equipDuration: '', siteLocation: '',
    // payment
    totalAmount: '', paymentStatus: 'pending', paymentMode: '', paidAmount: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const vehicles = VEHICLE_OPTIONS[form.serviceType] ?? [];
  const today = new Date().toISOString().split('T')[0];
  const selectedSvc = SERVICE_TYPES.find(s => s.value === form.serviceType)!;

  /* Reset service-specific fields when service changes */
  const changeService = (svc: string) => {
    setForm(p => ({
      ...p, serviceType: svc, vehicleType: '',
      tripType: '', passengerCount: '', helmetCount: '',
      occasion: '', licenseNumber: '',
      goodsType: '', loadInfo: '',
      moveSize: '', packingRequired: '', floorInfo: '',
      equipDuration: '', siteLocation: '', pickupTime: '',
    }));
  };

  /* Build notes string including service-specific extras */
  const buildNotes = () => {
    const extras: string[] = [];
    if (form.tripType)        extras.push(`Trip type: ${form.tripType}`);
    if (form.pickupTime)      extras.push(`Pickup time: ${form.pickupTime}`);
    if (form.passengerCount)  extras.push(`Passengers: ${form.passengerCount}`);
    if (form.helmetCount)     extras.push(`Helmets: ${form.helmetCount}`);
    if (form.occasion)        extras.push(`Occasion: ${form.occasion}`);
    if (form.licenseNumber)   extras.push(`License: ${form.licenseNumber}`);
    if (form.goodsType)       extras.push(`Goods: ${form.goodsType}`);
    if (form.loadInfo)        extras.push(`Load: ${form.loadInfo}`);
    if (form.moveSize)        extras.push(`Move size: ${form.moveSize}`);
    if (form.packingRequired) extras.push(`Packing: ${form.packingRequired}`);
    if (form.floorInfo)       extras.push(`Floor info: ${form.floorInfo}`);
    if (form.equipDuration)   extras.push(`Duration: ${form.equipDuration}`);
    if (form.siteLocation)    extras.push(`Site: ${form.siteLocation}`);
    return [form.notes, ...extras].filter(Boolean).join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customerName.trim()) return setError('Customer name is required');
    if (form.customerPhone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit phone number');

    setSaving(true);
    try {
      const payload = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        serviceType: form.serviceType,
        vehicleType: form.vehicleType,
        pickupDate: form.pickupDate,
        returnDate: form.returnDate,
        pickupLocation: form.pickupLocation || form.siteLocation,
        dropLocation: form.dropLocation,
        notes: buildNotes(),
        totalAmount: form.totalAmount,
        paymentStatus: form.paymentStatus,
        paymentMode: form.paymentMode,
        paidAmount: form.paidAmount,
      };
      const res = await fetch('/api/vendor/direct-bookings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.push(`/vendor/direct-bookings/${data.booking.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasServiceFields = !['general'].includes(form.serviceType);

  return (
    <div className="min-h-screen -m-6 bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pt-5 pb-16">
        <Link href="/vendor/direct-bookings" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition text-sm font-medium mb-5">
          <ArrowLeft className="w-4 h-4" /> All Bookings
        </Link>
        <h1 className="text-2xl font-bold text-white">Add Direct Booking</h1>
        <p className="text-blue-200 text-sm mt-1">Manually create a booking from your personal client</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 sm:px-6 -mt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-4">

              {/* 1. Service type picker */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<Car className="w-4 h-4 text-blue-500" />} title="Service Type" color="bg-blue-50" />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {SERVICE_TYPES.map(s => {
                    const active = form.serviceType === s.value;
                    return (
                      <button
                        key={s.value} type="button"
                        onClick={() => changeService(s.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-150 active:scale-95 ${
                          active ? `${s.bg} ${s.border} shadow-sm` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl leading-none">{s.icon}</span>
                        <span className={`text-[11px] font-semibold leading-tight ${active ? s.text : 'text-gray-500'}`}>{s.label}</span>
                        {active && <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${s.grad}`} />}
                      </button>
                    );
                  })}
                </div>

                {/* Vehicle */}
                {vehicles.length > 0 && (
                  <div className="mt-4">
                    <label className={lbl}>Vehicle <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                    <div className="relative">
                      <Car className={iconPos} />
                      <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className={inpIcon + ' appearance-none bg-white'}>
                        <option value="">Select vehicle</option>
                        {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Service-specific fields */}
              {hasServiceFields && (
                <div className={`bg-white rounded-2xl border-2 ${selectedSvc.border} shadow-sm p-5`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${selectedSvc.bg}`}>
                      {selectedSvc.icon}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-800">{selectedSvc.label} Details</h2>
                      <p className="text-xs text-gray-400">Specific info for this service</p>
                    </div>
                  </div>
                  <ServiceFields serviceType={form.serviceType} form={form} set={set} />
                </div>
              )}

              {/* 3. Customer details */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<User className="w-4 h-4 text-indigo-500" />} title="Customer Details" color="bg-indigo-50" />
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Full Name <span className="text-red-400 normal-case">*</span></label>
                    <div className="relative">
                      <User className={iconPos} />
                      <input type="text" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Customer full name" className={inpIcon} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Phone <span className="text-red-400 normal-case">*</span></label>
                      <div className="relative">
                        <Phone className={iconPos} />
                        <input type="tel" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} placeholder="10-digit mobile" className={inpIcon} required />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Email <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                      <div className="relative">
                        <Mail className={iconPos} />
                        <input type="email" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)} placeholder="email@example.com" className={inpIcon} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Trip / Schedule */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<MapPin className="w-4 h-4 text-emerald-500" />} title="Schedule & Location" color="bg-emerald-50" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>
                        {form.serviceType === 'equipment' ? 'Start Date' : 'Pickup Date'}
                      </label>
                      <div className="relative">
                        <Calendar className={iconPos} />
                        <input type="date" value={form.pickupDate} min={today} onChange={e => set('pickupDate', e.target.value)} className={inpIcon} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>
                        {form.serviceType === 'packers-movers' ? 'Move-in Date' : form.serviceType === 'equipment' ? 'End Date' : 'Return Date'}
                      </label>
                      <div className="relative">
                        <Calendar className={iconPos} />
                        <input type="date" value={form.returnDate} min={form.pickupDate || today} onChange={e => set('returnDate', e.target.value)} className={inpIcon} />
                      </div>
                    </div>
                  </div>

                  {/* Location fields — contextual labels */}
                  {form.serviceType !== 'equipment' && (
                    <div>
                      <label className={lbl}>
                        {form.serviceType === 'packers-movers' ? 'Current Address (Pickup)' : 'Pickup Location'}
                      </label>
                      <div className="relative">
                        <MapPin className={iconPos} />
                        <input type="text" value={form.pickupLocation} onChange={e => set('pickupLocation', e.target.value)}
                          placeholder={form.serviceType === 'packers-movers' ? 'Current home / office address' : 'Pickup address or area'}
                          className={inpIcon}
                        />
                      </div>
                    </div>
                  )}

                  {['car-with-driver', 'self-drive', 'bike', 'bus', 'luxury', 'transporter', 'packers-movers'].includes(form.serviceType) && (
                    <div>
                      <label className={lbl}>
                        {form.serviceType === 'packers-movers' ? 'New Address (Drop)' : 'Drop Location'}
                        <span className="normal-case font-normal text-gray-400 ml-1">(optional)</span>
                      </label>
                      <div className="relative">
                        <MapPin className={iconPos} />
                        <input type="text" value={form.dropLocation} onChange={e => set('dropLocation', e.target.value)}
                          placeholder={form.serviceType === 'packers-movers' ? 'New home / office address' : 'Drop address (outstation / one-way)'}
                          className={inpIcon}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={lbl}>Additional Notes <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any special requirements or remarks…" rows={2} className={inpIcon + ' resize-none'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-4">

              {/* Payment */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <SectionTitle icon={<IndianRupee className="w-4 h-4 text-amber-500" />} title="Payment" color="bg-amber-50" />
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Total Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className={iconPos} />
                      <input type="number" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} placeholder="0" min="0" className={inpIcon} />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Payment Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'pending',   label: 'Pending',  cls: 'bg-orange-50 border-orange-300 text-orange-700' },
                        { value: 'partial',   label: 'Advance',  cls: 'bg-amber-50 border-amber-300 text-amber-700' },
                        { value: 'collected', label: 'Paid',     cls: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                      ].map(opt => (
                        <button key={opt.value} type="button" onClick={() => set('paymentStatus', opt.value)}
                          className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${form.paymentStatus === opt.value ? opt.cls : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                        >
                          {form.paymentStatus === opt.value && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(form.paymentStatus === 'collected' || form.paymentStatus === 'partial') && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className={lbl}>{form.paymentStatus === 'partial' ? 'Advance Collected (₹)' : 'Amount Collected (₹)'}</label>
                        <div className="relative">
                          <IndianRupee className={iconPos} />
                          <input type="number" value={form.paidAmount} onChange={e => set('paidAmount', e.target.value)} placeholder="0" min="0" className={inpIcon} />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Payment Mode</label>
                        <select value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)} className={inp + ' appearance-none bg-white'}>
                          <option value="">Select mode</option>
                          <option value="cash">💵 Cash</option>
                          <option value="upi">📱 UPI</option>
                          <option value="card">💳 Card</option>
                          <option value="bank_transfer">🏦 Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live summary */}
              <div className={`rounded-2xl border-2 p-4 ${selectedSvc.bg} ${selectedSvc.border}`}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Booking Summary</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-semibold text-gray-800">{selectedSvc.icon} {selectedSvc.label}</span>
                  </div>
                  {form.vehicleType && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle</span>
                      <span className="font-semibold text-gray-800">{form.vehicleType}</span>
                    </div>
                  )}
                  {form.tripType && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Trip</span>
                      <span className="font-semibold text-gray-800 text-right max-w-[160px]">{form.tripType}</span>
                    </div>
                  )}
                  {form.passengerCount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Passengers</span>
                      <span className="font-semibold text-gray-800">{form.passengerCount}</span>
                    </div>
                  )}
                  {form.occasion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Occasion</span>
                      <span className="font-semibold text-gray-800">{form.occasion}</span>
                    </div>
                  )}
                  {form.moveSize && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Move Size</span>
                      <span className="font-semibold text-gray-800">{form.moveSize}</span>
                    </div>
                  )}
                  {form.equipDuration && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-semibold text-gray-800">{form.equipDuration}</span>
                    </div>
                  )}
                  {form.customerName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[150px]">{form.customerName}</span>
                    </div>
                  )}
                  {form.pickupDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(form.pickupDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {form.returnDate && ` → ${new Date(form.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
                      </span>
                    </div>
                  )}
                  {form.totalAmount && (
                    <div className="flex justify-between pt-1.5 border-t border-gray-200 mt-1">
                      <span className="text-gray-500 font-semibold">Total</span>
                      <span className="font-bold text-gray-900 text-base">₹{Number(form.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  ⚠ {error}
                </div>
              )}

              {/* Submit */}
              <div className="space-y-2.5">
                <button
                  type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-blue-200 active:scale-[0.98] text-base"
                >
                  {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : <><Save className="w-5 h-5" /> Save Booking</>}
                </button>
                <Link href="/vendor/direct-bookings" className="w-full flex items-center justify-center py-3.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
