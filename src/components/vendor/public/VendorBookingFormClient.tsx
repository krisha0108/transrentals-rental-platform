'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Phone, MapPin, Calendar, Car, User, Mail,
  MessageSquare, Clock, Users, Star, ChevronRight, Send,
  Loader2, ArrowLeft, Shield, Zap, Package, Weight,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface VendorInfo {
  id: string;
  businessName: string;
  logo: string | null;
  city: string | null;
  phone: string | null;
}
interface LinkConfig {
  formTitle: string | null;
  welcomeMsg: string | null;
  visibleFields: any;
}
interface Props {
  vendorSlug: string;
  serviceType: string;
  serviceName: string;
  vehicles: string[];
  vendor: VendorInfo;
  link: LinkConfig | null;
}

/* ─── Static data ────────────────────────────────────────────────────────── */
const SERVICE_OPTIONS = [
  { value: 'car-with-driver', label: 'Car with Driver',   icon: '🚗', color: '#3B82F6', bg: 'from-blue-500 to-cyan-500' },
  { value: 'self-drive',      label: 'Self-Drive Car',    icon: '🚙', color: '#8B5CF6', bg: 'from-violet-500 to-purple-600' },
  { value: 'bike',            label: 'Bike Rental',       icon: '🏍️', color: '#F97316', bg: 'from-orange-400 to-amber-500' },
  { value: 'bus',             label: 'Bus & Tempo',       icon: '🚌', color: '#10B981', bg: 'from-emerald-500 to-green-600' },
  { value: 'luxury',          label: 'Luxury Car',        icon: '✨', color: '#F59E0B', bg: 'from-yellow-400 to-orange-500' },
  { value: 'transporter',     label: 'Transporter',       icon: '🚛', color: '#64748B', bg: 'from-slate-500 to-gray-600' },
  { value: 'packers-movers',  label: 'Packers & Movers',  icon: '📦', color: '#0EA5E9', bg: 'from-sky-500 to-cyan-600' },
  { value: 'equipment',       label: 'Equipment Rental',  icon: '🔧', color: '#EF4444', bg: 'from-red-500 to-rose-600' },
];

const SERVICE_VEHICLES: Record<string, string[]> = {
  bike:              ['Activa', 'Royal Enfield', 'KTM', 'Pulsar', 'Apache', 'Splendor', 'Other'],
  bus:               ['12 Seater Tempo', '17 Seater Tempo', '20 Seater Tempo', '26 Seater Bus', '32 Seater Bus', '45 Seater Bus', 'Other'],
  'car-with-driver': ['Sedan', 'SUV', 'Hatchback', 'Innova', 'Fortuner', 'Ertiga', 'Other'],
  'self-drive':      ['Hatchback', 'Sedan', 'SUV', 'Creta', 'Seltos', 'Other'],
  luxury:            ['BMW', 'Mercedes', 'Audi', 'Range Rover', 'Jaguar', 'Other'],
  transporter:       ['Mini Truck', 'Pickup Van', 'Tata Ace', 'Tata 407', 'Truck (1 ton)', 'Truck (2 ton)', 'Truck (5 ton)', 'Other'],
  'packers-movers':  ['Small Move (1BHK)', 'Medium Move (2BHK)', 'Large Move (3BHK+)', 'Office Relocation', 'Other'],
  equipment:         ['JCB / Excavator', 'Crane', 'Hydra Crane', 'Generator', 'Concrete Mixer', 'Other'],
};

const CAR_TRIP_TYPES = [
  { value: 'local',              label: 'Local (within city)' },
  { value: 'outstation-one-way', label: 'Outstation – One Way' },
  { value: 'outstation-round',   label: 'Outstation – Round Trip' },
  { value: 'airport-pickup',     label: 'Airport Pickup' },
  { value: 'airport-drop',       label: 'Airport Drop' },
];
const BUS_TRIP_TYPES = [
  { value: 'local',      label: 'Local / Sightseeing' },
  { value: 'outstation', label: 'Outstation Trip' },
  { value: 'wedding',    label: 'Wedding' },
  { value: 'pilgrimage', label: 'Pilgrimage / Religious' },
  { value: 'corporate',  label: 'Corporate / Office' },
];
const LUXURY_OCCASIONS = [
  { value: 'wedding',     label: 'Wedding' },
  { value: 'corporate',   label: 'Corporate Event' },
  { value: 'birthday',    label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'photoshoot',  label: 'Photoshoot' },
  { value: 'airport',     label: 'Airport Transfer' },
  { value: 'other',       label: 'Other' },
];

const TRUCK_TYPES = [
  { value: 'Tata Ace',                  label: '🚚 Tata Ace',              sub: 'Upto 0.75 MT' },
  { value: 'Tata 407 (2.5 MT)',         label: '🚚 Tata 407',              sub: '2.5 MT' },
  { value: 'Canter 17ft (4 Wheel)',     label: '🚚 Canter 17ft',           sub: '4 Wheel' },
  { value: 'Truck 9MT (6 Wheel)',       label: '🚛 Truck 9MT',             sub: '6 Wheel' },
  { value: 'Truck 16MT (10 Wheel)',     label: '🚚 Truck 16MT',            sub: '10 Wheel' },
  { value: 'Truck 20MT (12 Wheel)',     label: '🚚 Truck 20MT',            sub: '12 Wheel' },
  { value: 'Truck 25MT (14 Wheel)',     label: '🚛 Truck 25MT',            sub: '14 Wheel' },
  { value: 'Semi Low Bed Trailer',      label: '🚛 Semi Low Bed Trailer',  sub: 'Heavy Load' },
  { value: 'LCV (Light Commercial)',    label: '🚚 LCV',                   sub: 'Light Commercial' },
];

const GOODS_TYPES = [
  { value: 'Household Goods',       icon: '🏠' },
  { value: 'Furniture & Wood',      icon: '🪑' },
  { value: 'Electronics',           icon: '📺' },
  { value: 'Vehicles/Automobiles',  icon: '🚗' },
  { value: 'Building Materials',    icon: '🧱' },
  { value: 'Agricultural Produce',  icon: '🌾' },
  { value: 'Industrial Goods',      icon: '⚙️' },
  { value: 'Fragile / Delicate',    icon: '📦' },
  { value: 'Other',                 icon: '📋' },
];

const EQUIPMENT_TYPES = [
  { value: 'JCB / Excavator',       label: '🚧 JCB / Excavator',        sub: 'Earthmoving' },
  { value: 'Crane (Grove)',          label: '🏗️ Grove Crane',            sub: 'Heavy Lift' },
  { value: 'Truck Mounted Crane',    label: '🚚 Truck Mounted Crane',    sub: 'Mobile Crane' },
  { value: 'Tower Crane',            label: '🏗️ Tower Crane',            sub: 'Construction' },
  { value: 'Telescopic Crane',       label: '🏗️ Telescopic Crane',       sub: 'Reach Crane' },
  { value: 'Rough Terrain Crane',    label: '🏗️ Rough Terrain Crane',    sub: 'Off-road' },
  { value: 'Hydra Crane',            label: '🏗️ Hydra Crane',            sub: 'Loading/Unloading' },
  { value: 'Overhead Crane',         label: '🏗️ Overhead Crane',         sub: 'Industrial' },
  { value: 'Bulldozer',              label: '🚜 Bulldozer',               sub: 'Earthmoving' },
  { value: 'Dumper',                 label: '🚛 Dumper',                  sub: 'Material Hauling' },
  { value: 'Loader',                 label: '🚜 Loader',                  sub: 'Loading' },
  { value: 'Backhoe Loader',         label: '🚜 Backhoe Loader',          sub: 'Multi-purpose' },
  { value: 'Generator',              label: '⚡ Generator',               sub: 'Power Backup' },
  { value: 'Concrete Mixer',         label: '🔄 Concrete Mixer',          sub: 'Construction' },
  { value: 'Other',                  label: '📋 Other Equipment',         sub: 'Custom' },
];

const EQUIP_DURATION_OPTIONS = [
  { value: '1 to 5 Days',      icon: '📅' },
  { value: '6 to 15 Days',     icon: '📆' },
  { value: '16 to 30 Days',    icon: '🗓️' },
  { value: 'More than 30 Days',icon: '📊' },
];

/* ─── Shared input styles ────────────────────────────────────────────────── */
const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow hover:shadow-sm';
const inpIcon = 'w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow hover:shadow-sm';
const iconPos = 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400';

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function VendorBookingFormClient({ vendorSlug, serviceType, serviceName, vehicles, vendor, link }: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<'pick' | 'form'>(serviceType === 'all' ? 'pick' : 'form');
  const [loadingService, setLoadingService] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    selectedService: serviceType === 'all' ? '' : serviceType,
    vehicleType: '', pickupDate: '', returnDate: '',
    pickupLocation: '', dropLocation: '', notes: '',
    tripType: '', pickupTime: '', passengerCount: '',
    helmetCount: '', occasion: '', licenseNumber: '',
    // Transporter-specific
    useType: '', goodsType: '', goodsWeight: '', weightUnit: 'KG',
    // Equipment-specific
    equipType: '', equipDuration: '', equipUnits: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [error, setError] = useState('');
  const [showAllTrucks, setShowAllTrucks] = useState(false);
  const [customTruckType, setCustomTruckType] = useState('');
  const [showAllEquip, setShowAllEquip] = useState(false);
  const [customEquipType, setCustomEquipType] = useState('');

  useEffect(() => {
    if (serviceType === 'all') setScreen('pick');
  }, [serviceType]);

  useEffect(() => {
    fetch('/api/public/vendor-booking-form', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendorSlug, serviceType }) }).catch(() => {});
  }, [vendorSlug, serviceType]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const activeService = serviceType === 'all' ? form.selectedService : serviceType;
  const svcMeta = SERVICE_OPTIONS.find(s => s.value === activeService);
  const activeVehicles = serviceType === 'all'
    ? (form.selectedService ? SERVICE_VEHICLES[form.selectedService] ?? [] : [])
    : vehicles.length > 0 ? vehicles : SERVICE_VEHICLES[serviceType] ?? [];
  const initials = vendor.businessName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const today = new Date().toISOString().split('T')[0];

  const pickService = (v: string) => {
    setForm(p => ({ ...p, selectedService: v, vehicleType: '', tripType: '', pickupTime: '', passengerCount: '', helmetCount: '', occasion: '', licenseNumber: '', equipType: '', equipDuration: '', equipUnits: '' }));
    setShowAllTrucks(false);
    setCustomTruckType('');
    setShowAllEquip(false);
    setCustomEquipType('');
    setScreen('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customerName.trim()) return setError('Please enter your name');
    if (form.customerPhone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit phone number');

    const extras: string[] = [];
    if (form.tripType)       extras.push(`Trip: ${form.tripType}`);
    if (form.pickupTime)     extras.push(`Time: ${form.pickupTime}`);
    if (form.passengerCount) extras.push(`Passengers: ${form.passengerCount}`);
    if (form.helmetCount)    extras.push(`Helmets: ${form.helmetCount}`);
    if (form.occasion)       extras.push(`Occasion: ${form.occasion}`);
    if (form.licenseNumber)  extras.push(`License: ${form.licenseNumber}`);
    if (form.useType)        extras.push(`Use Type: ${form.useType}`);
    if (form.goodsType)      extras.push(`Goods: ${form.goodsType}`);
    if (form.goodsWeight)    extras.push(`Weight: ${form.goodsWeight} ${form.weightUnit}`);
    if (form.equipDuration)  extras.push(`Duration: ${form.equipDuration}`);
    if (form.equipUnits)     extras.push(`Units: ${form.equipUnits}`);

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/vendor-booking-form', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorSlug, serviceType: activeService || serviceType, customerName: form.customerName, customerPhone: form.customerPhone, customerEmail: form.customerEmail, vehicleType: form.vehicleType, pickupDate: form.pickupDate, returnDate: form.returnDate, pickupLocation: form.pickupLocation, dropLocation: form.dropLocation, notes: [form.notes, ...extras].filter(Boolean).join('\n') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setBookingNumber(data.bookingNumber);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Keyframes injected once ───────────────────────────────────────────── */
  const styles = `
    @keyframes floatA { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-28px) scale(1.04)} }
    @keyframes floatB { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.06)} }
    @keyframes floatC { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-22px) scale(0.97)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popIn  { 0%{opacity:0;transform:scale(.85)} 70%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
    .fa{animation:floatA 7s ease-in-out infinite}
    .fb{animation:floatB 9s ease-in-out infinite;animation-delay:-3s}
    .fc{animation:floatC 11s ease-in-out infinite;animation-delay:-6s}
    .fade-up{animation:fadeUp .45s ease-out forwards}
    .pop-in{animation:popIn .4s cubic-bezier(.34,1.56,.64,1) forwards}
  `;

  /* ── SUCCESS ────────────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="w-full max-w-sm fade-up">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Request Sent!</h2>
              <p className="text-emerald-100 text-sm mt-1">We'll get back to you shortly</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Booking Reference</p>
                <p className="text-2xl font-bold text-gray-900 tracking-wider">{bookingNumber}</p>
              </div>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                <strong className="text-gray-900">{vendor.businessName}</strong> will call you on <strong className="text-gray-900">{form.customerPhone}</strong> to confirm.
              </p>
              {vendor.phone && (
                <a href={`tel:${vendor.phone}`} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold transition active:scale-95">
                  <Phone className="w-4 h-4" /> Call {vendor.businessName}
                </a>
              )}
              {vendor.phone && (
                <a href={`https://wa.me/${vendor.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-semibold transition active:scale-95">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp Us
                </a>
              )}
              <a href={`/track/${bookingNumber}`} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold transition active:scale-95 hover:bg-indigo-100">
                🔍 Track My Booking
              </a>
            </div>
          </div>
          <p className="text-center text-white/40 text-xs mt-4">Powered by <a href="https://transrentals.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">TransRentals</a></p>
        </div>
      </div>
    );
  }

  /* ── SERVICE PICKER ─────────────────────────────────────────────────────── */
  if (screen === 'pick') {
    return (
      <div className="min-h-dvh relative overflow-hidden bg-[#0F0F1A]">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        {/* Floating orbs */}
        <div className="fa pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="fb pointer-events-none absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="fc pointer-events-none absolute -bottom-16 left-1/3 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center px-5 pt-14 pb-10">
          {/* Vendor card */}
          <div className="fade-up w-full max-w-sm mb-8">
            <div className="flex flex-col items-center gap-3">
              {vendor.logo
                ? <Image src={vendor.logo} alt={vendor.businessName} width={64} height={64} className="rounded-2xl object-cover ring-2 ring-white/20 shadow-xl" />
                : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-xl ring-2 ring-white/10">{initials}</div>
              }
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">{vendor.businessName}</h1>
                {vendor.city && <p className="text-white/50 text-sm flex items-center justify-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{vendor.city}</p>}
              </div>
            </div>
          </div>

          <p className="text-white/60 text-sm font-medium mb-5 fade-up" style={{ animationDelay: '.1s' }}>What would you like to book?</p>

          {/* Service grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {SERVICE_OPTIONS.map((s, i) => {
              const isLoading = loadingService === s.value;
              const isDisabled = loadingService !== null && !isLoading;
              return (
              <button
                key={s.value}
                disabled={loadingService !== null}
                onClick={() => {
                  setLoadingService(s.value);
                  router.push(`/book/${vendorSlug}/${s.value}`);
                }}
                className={`pop-in group relative flex flex-col items-start gap-2 border rounded-2xl p-4 transition-all duration-200 active:scale-95 text-left ${
                  isLoading
                    ? 'bg-white/15 border-white/40 scale-[0.97]'
                    : isDisabled
                    ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/25'
                }`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-xl shadow-lg transition-transform duration-200 ${!isDisabled && 'group-hover:scale-110'}`}>
                  {isLoading
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : s.icon
                  }
                </div>
                <span className="text-white text-sm font-semibold leading-tight">{s.label}</span>
                {isLoading
                  ? <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className="text-[10px] text-white/60">Loading</span>
                    </div>
                  : <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                }
              </button>
              );
            })}
          </div>

          {link?.welcomeMsg && (
            <p className="mt-6 text-white/40 text-xs text-center max-w-xs">{link.welcomeMsg}</p>
          )}
          <p className="mt-6 text-white/25 text-xs">Powered by <a href="https://transrentals.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50">TransRentals</a></p>
        </div>
      </div>
    );
  }

  /* ── MAIN FORM ──────────────────────────────────────────────────────────── */
  const formTitle = link?.formTitle || (serviceType === 'all' ? `Book with ${vendor.businessName}` : `${serviceName} – ${vendor.businessName}`);

  return (
    <div className="min-h-dvh relative bg-[#0F0F1A] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Background orbs */}
      <div className="fa pointer-events-none fixed -top-24 -left-24 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="fb pointer-events-none fixed top-1/2 -right-20 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="fc pointer-events-none fixed -bottom-20 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Dot grid pattern */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10">
        {/* ── Desktop 2-col / Mobile stacked ─────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12 lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">

          {/* LEFT: Vendor info panel */}
          <div className="fade-up mb-6 lg:mb-0 lg:sticky lg:top-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              {/* Logo + name */}
              <div className="flex items-center gap-4 mb-5">
                {vendor.logo
                  ? <Image src={vendor.logo} alt={vendor.businessName} width={56} height={56} className="rounded-2xl object-cover ring-2 ring-white/20" />
                  : <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-white/10">{initials}</div>
                }
                <div>
                  <h1 className="text-white font-bold text-lg leading-tight">{vendor.businessName}</h1>
                  {vendor.city && <p className="text-white/50 text-sm flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{vendor.city}</p>}
                </div>
              </div>

              {/* Active service badge */}
              {svcMeta && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${svcMeta.bg} mb-5`}>
                  <span className="text-base">{svcMeta.icon}</span>
                  <span className="text-white text-sm font-semibold">{svcMeta.label}</span>
                </div>
              )}

              {/* Change service link (all mode only) */}
              {serviceType === 'all' && (
                <button onClick={() => setScreen('pick')} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 mb-5 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Change service
                </button>
              )}

              {/* Welcome message */}
              {link?.welcomeMsg && (
                <p className="text-white/50 text-sm bg-white/5 rounded-xl p-3 mb-5 italic">"{link.welcomeMsg}"</p>
              )}

              {/* Trust badges */}
              <div className="space-y-2.5">
                {[
                  { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: 'Instant reply on WhatsApp' },
                  { icon: <Shield className="w-4 h-4 text-emerald-400" />, text: 'Verified & trusted vendor' },
                  { icon: <Star className="w-4 h-4 text-blue-400" />, text: 'No booking fee required' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">{b.icon}</div>
                    <span className="text-white/50 text-xs">{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Call button (desktop) */}
              {vendor.phone && (
                <a href={`tel:${vendor.phone}`} className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-all">
                  <Phone className="w-4 h-4" /> {vendor.phone}
                </a>
              )}
            </div>
          </div>

          {/* RIGHT: Form card */}
          <div className="fade-up" style={{ animationDelay: '.1s' }}>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

              {/* Form header stripe */}
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-5">
                <h2 className="text-white font-bold text-lg">{formTitle}</h2>
                <p className="text-white/70 text-sm mt-0.5">Fill in the details below — we'll get back to you ASAP</p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* ── Section 1: Contact ── */}
                <div className="px-6 pt-6 pb-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Contact Details</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Name */}
                    <div className="relative">
                      <User className={iconPos} />
                      <input type="text" placeholder="Your full name *" value={form.customerName} onChange={e => set('customerName', e.target.value)} className={inpIcon} required />
                    </div>
                    {/* Phone + Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <Phone className={iconPos} />
                        <input type="tel" placeholder="Phone number *" value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)} className={inpIcon} required />
                      </div>
                      <div className="relative">
                        <Mail className={iconPos} />
                        <input type="email" placeholder="Email (optional)" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)} className={inpIcon} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-6 border-t border-dashed border-gray-200" />

                {/* ── Section 2: Trip Details ── */}
                <div className="px-6 pt-5 pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Car className="w-4 h-4 text-violet-500" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Trip Details</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Vehicle type — hidden for transporter and equipment (handled by card grid below) */}
                    {activeVehicles.length > 0 && activeService !== 'transporter' && activeService !== 'equipment' && (
                      <div className="relative">
                        <Car className={iconPos} />
                        <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className={inpIcon + ' appearance-none bg-white'}>
                          <option value="">Select vehicle (optional)</option>
                          {activeVehicles.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Car with Driver */}
                    {activeService === 'car-with-driver' && (
                      <div className="grid grid-cols-2 gap-3">
                        <select value={form.tripType} onChange={e => set('tripType', e.target.value)} className={inp + ' appearance-none bg-white'}>
                          <option value="">Trip type</option>
                          {CAR_TRIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <div className="relative">
                          <Clock className={iconPos} />
                          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                    )}

                    {/* Bus */}
                    {activeService === 'bus' && (
                      <div className="grid grid-cols-2 gap-3">
                        <select value={form.tripType} onChange={e => set('tripType', e.target.value)} className={inp + ' appearance-none bg-white'}>
                          <option value="">Trip type</option>
                          {BUS_TRIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <div className="relative">
                          <Users className={iconPos} />
                          <input type="number" placeholder="No. of passengers" min="1" value={form.passengerCount} onChange={e => set('passengerCount', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                    )}

                    {/* Bike */}
                    {activeService === 'bike' && (
                      <div className="grid grid-cols-2 gap-3">
                        <select value={form.helmetCount} onChange={e => set('helmetCount', e.target.value)} className={inp + ' appearance-none bg-white'}>
                          <option value="">Helmets needed</option>
                          <option value="0">No helmet</option>
                          <option value="1">1 helmet</option>
                          <option value="2">2 helmets</option>
                        </select>
                        <div className="relative">
                          <Clock className={iconPos} />
                          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                    )}

                    {/* Self-drive */}
                    {activeService === 'self-drive' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Clock className={iconPos} />
                          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
                        </div>
                        <input type="text" placeholder="License no. (optional)" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} className={inp} />
                      </div>
                    )}

                    {/* Luxury */}
                    {activeService === 'luxury' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Star className={iconPos} />
                          <select value={form.occasion} onChange={e => set('occasion', e.target.value)} className={inpIcon + ' appearance-none bg-white'}>
                            <option value="">Occasion (optional)</option>
                            {LUXURY_OCCASIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="relative">
                          <Clock className={iconPos} />
                          <input type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} className={inpIcon} />
                        </div>
                      </div>
                    )}

                    {/* Transporter / Truck */}
                    {(activeService === 'transporter') && (
                      <div className="space-y-3">
                        {/* Personal / Commercial */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Is this for personal or commercial use?</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'Personal',   icon: '🏠', label: 'Personal Use' },
                              { value: 'Commercial', icon: '🏭', label: 'Commercial Use' },
                            ].map(opt => (
                              <button
                                key={opt.value} type="button"
                                onClick={() => set('useType', opt.value)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                                  form.useType === opt.value
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <span className="text-base">{opt.icon}</span> {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Truck type — card grid with expand + custom */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">What type of truck do you need?</p>
                          <div className="grid grid-cols-2 gap-2">
                            {(showAllTrucks ? TRUCK_TYPES : TRUCK_TYPES.slice(0, 4)).map(t => (
                              <button
                                key={t.value} type="button"
                                onClick={() => { set('vehicleType', form.vehicleType === t.value ? '' : t.value); setCustomTruckType(''); }}
                                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border-2 text-left transition ${
                                  form.vehicleType === t.value
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <span className="text-sm font-semibold text-gray-800">{t.label}</span>
                                <span className="text-[11px] text-gray-400 mt-0.5">{t.sub}</span>
                              </button>
                            ))}

                            {/* More / Less toggle */}
                            {!showAllTrucks && (
                              <button
                                type="button"
                                onClick={() => setShowAllTrucks(true)}
                                className="flex flex-col items-start px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50 text-left transition"
                              >
                                <span className="text-sm font-semibold text-gray-500">🚛 More Options</span>
                                <span className="text-[11px] text-gray-400 mt-0.5">See all types</span>
                              </button>
                            )}
                          </div>

                          {showAllTrucks && (
                            <button
                              type="button"
                              onClick={() => setShowAllTrucks(false)}
                              className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
                            >
                              ▲ Show less
                            </button>
                          )}

                          {/* Custom truck type input */}
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Or type your own (e.g. Flatbed 30MT)…"
                              value={customTruckType}
                              onChange={e => {
                                setCustomTruckType(e.target.value);
                                set('vehicleType', e.target.value);
                              }}
                              onFocus={() => set('vehicleType', customTruckType)}
                              className={`${inp} text-sm ${customTruckType ? 'border-indigo-400 ring-1 ring-indigo-300' : ''}`}
                            />
                          </div>
                        </div>

                        {/* Goods type */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">What type of goods are you transporting?</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {GOODS_TYPES.map(g => (
                              <button
                                key={g.value} type="button"
                                onClick={() => set('goodsType', form.goodsType === g.value ? '' : g.value)}
                                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border-2 text-center transition ${
                                  form.goodsType === g.value
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <span className="text-lg">{g.icon}</span>
                                <span className="text-[10px] font-semibold text-gray-700 leading-tight">{g.value}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Weight */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Approximate weight of goods (optional)</p>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Package className={iconPos} />
                              <input
                                type="number" min="0" placeholder="Weight"
                                value={form.goodsWeight}
                                onChange={e => set('goodsWeight', e.target.value)}
                                className={inpIcon}
                              />
                            </div>
                            <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden shrink-0">
                              {['KG', 'TON'].map(unit => (
                                <button
                                  key={unit} type="button"
                                  onClick={() => set('weightUnit', unit)}
                                  className={`px-4 py-2 text-sm font-bold transition ${
                                    form.weightUnit === unit
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-white text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {unit}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Equipment */}
                    {activeService === 'equipment' && (
                      <div className="space-y-3">
                        {/* Equipment type card grid */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">What type of equipment do you need?</p>
                          <div className="grid grid-cols-2 gap-2">
                            {(showAllEquip ? EQUIPMENT_TYPES : EQUIPMENT_TYPES.slice(0, 4)).map(t => (
                              <button key={t.value} type="button"
                                onClick={() => { set('vehicleType', form.vehicleType === t.value ? '' : t.value); setCustomEquipType(''); }}
                                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border-2 text-left transition ${
                                  form.vehicleType === t.value ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}>
                                <span className="text-sm font-semibold text-gray-800">{t.label}</span>
                                <span className="text-[11px] text-gray-400 mt-0.5">{t.sub}</span>
                              </button>
                            ))}
                            {!showAllEquip && (
                              <button type="button" onClick={() => setShowAllEquip(true)}
                                className="flex flex-col items-start px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50 text-left transition">
                                <span className="text-sm font-semibold text-gray-500">📋 More Equipment</span>
                                <span className="text-[11px] text-gray-400 mt-0.5">See all types</span>
                              </button>
                            )}
                          </div>
                          {showAllEquip && (
                            <button type="button" onClick={() => setShowAllEquip(false)} className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-semibold">▲ Show less</button>
                          )}
                          <input
                            type="text" placeholder="Or type your own equipment…"
                            value={customEquipType}
                            onChange={e => { setCustomEquipType(e.target.value); set('vehicleType', e.target.value); }}
                            onFocus={() => set('vehicleType', customEquipType)}
                            className={`${inp} text-sm mt-2 ${customEquipType ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">How long do you need it?</p>
                          <div className="grid grid-cols-2 gap-2">
                            {EQUIP_DURATION_OPTIONS.map(d => (
                              <button key={d.value} type="button"
                                onClick={() => set('equipDuration', form.equipDuration === d.value ? '' : d.value)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                                  form.equipDuration === d.value ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}>
                                <span>{d.icon}</span> {d.value}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Units */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">How many units? <span className="font-normal text-gray-400">(optional)</span></p>
                          <div className="relative">
                            <input type="number" min="1" placeholder="e.g. 2"
                              value={form.equipUnits}
                              onChange={e => set('equipUnits', e.target.value)}
                              className={inp + ' text-sm'}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dates row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Calendar className={iconPos} />
                        <input type="date" value={form.pickupDate} min={today} onChange={e => set('pickupDate', e.target.value)} className={inpIcon} />
                      </div>
                      <div className="relative">
                        <Calendar className={iconPos} />
                        <input type="date" value={form.returnDate} min={form.pickupDate || today} onChange={e => set('returnDate', e.target.value)} className={inpIcon} />
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="relative">
                      <MapPin className={iconPos} />
                      <input type="text" placeholder="Pickup location" value={form.pickupLocation} onChange={e => set('pickupLocation', e.target.value)} className={inpIcon} />
                    </div>
                    {activeService !== 'bike' && activeService !== 'self-drive' && (
                      <div className="relative">
                        <MapPin className={iconPos} />
                        <input type="text" placeholder="Drop location (optional)" value={form.dropLocation} onChange={e => set('dropLocation', e.target.value)} className={inpIcon} />
                      </div>
                    )}

                    {/* Notes */}
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-indigo-400" />
                      <textarea placeholder="Special requirements, preferred time, budget…" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={inpIcon + ' resize-none'} />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mx-6 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
                    ⚠ {error}
                  </div>
                )}

                {/* Submit */}
                <div className="px-6 pb-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                  >
                    {submitting
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
                      : <><Send className="w-4 h-4" /> Send Booking Request</>
                    }
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Powered by <a href="https://transrentals.in" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">TransRentals</a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
