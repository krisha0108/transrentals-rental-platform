'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Car,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Phone,
  Package,
  Loader2,
  CheckCircle,
  Info,
  Send,
  Sparkles,
  Route,
  Wallet,
  ClipboardList,
  FileText,
  Network,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FleetVehicle {
  id: string;
  vehicleName?: string | null;
  registrationNumber?: string | null;
  vehicleCategory?: string;
  serviceType?: string;
  capacity?: string;
  bodyType?: string;
  seatingCapacity?: number | null;
  vehicleCondition?: string | null;
  vehicle_models?: {
    name?: string;
    brands?: { name?: string } | null;
    chauffeur_vehicle_categories?: { name?: string } | null;
  } | null;
  services?: { id?: string; name?: string; slug?: string } | null;
}

interface StaffDriver {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  licenseNumber?: string | null;
}

interface FormData {
  serviceType: string;
  vehicleId: string;
  vehicleCategory: string;
  vehicleName: string;
  vehicleNumber: string;
  capacity: string;
  bodyType: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  priceFullLoad: string;
  pricePartLoad: string;
  acceptsPartLoad: boolean;
  availableSpace: string;
  driverIncluded: boolean;
  driverName: string;
  driverPhone: string;
  fuelIncluded: boolean;
  labourAvailable: boolean;
  labourCount: string;
  goodsAccepted: string[];
  totalSeats: string;
  availableSeats: string;
  busType: string;
  isAC: boolean;
  notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_TYPES = [
  { key: 'truck', label: 'Truck', icon: Truck },
  { key: 'car', label: 'Car', icon: Car },
] as const;

const BODY_TYPES = ['Open', 'Closed', 'Container', 'Flatbed', 'Tanker'];

const GOODS_OPTIONS = [
  'General',
  'Food',
  'Chemicals',
  'Electronics',
  'Furniture',
  'Construction',
];

const CAR_CATEGORIES = [
  'Sedan',
  'SUV',
  'MUV',
  'Hatchback',
  'Luxury',
  'Tempo Traveller',
];

const INITIAL_FORM_DATA: FormData = {
  serviceType: '',
  vehicleId: '',
  vehicleCategory: '',
  vehicleName: '',
  vehicleNumber: '',
  capacity: '',
  bodyType: '',
  fromCity: '',
  toCity: '',
  departureDate: '',
  departureTime: '',
  arrivalDate: '',
  arrivalTime: '',
  priceFullLoad: '',
  pricePartLoad: '',
  acceptsPartLoad: false,
  availableSpace: '',
  driverIncluded: true,
  driverName: '',
  driverPhone: '',
  fuelIncluded: false,
  labourAvailable: false,
  labourCount: '',
  goodsAccepted: [],
  totalSeats: '',
  availableSeats: '',
  busType: '',
  isAC: false,
  notes: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PostVehiclePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [drivers, setDrivers] = useState<StaffDriver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [useFleetVehicle, setUseFleetVehicle] = useState(false);
  const [useFleetDriver, setUseFleetDriver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---- Fetch vendor fleet ----
  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await fetch('/api/vendor/fleet?serviceId=all');
        if (res.ok) {
          const data = await res.json();
          const vehicles = data.fleet || data.vehicles || data.data || [];
          const list = Array.isArray(vehicles) ? vehicles : [];
          setFleet(list);
          // Auto-enable fleet selector if vehicles exist
          if (list.length > 0) setUseFleetVehicle(true);
        }
      } catch {
        // silently fail — vendor can still type manually
      } finally {
        setFleetLoading(false);
      }
    };
    fetchFleet();
  }, []);

  // ---- Fetch vendor drivers ----
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch('/api/vendor/staff?role=DRIVER&status=ACTIVE');
        if (res.ok) {
          const data = await res.json();
          const staffList = data.staff || data.data || [];
          const list = Array.isArray(staffList) ? staffList : [];
          setDrivers(list);
          // Auto-enable driver selector if drivers exist
          if (list.length > 0) setUseFleetDriver(true);
        }
      } catch {
        // silently fail — vendor can still type manually
      } finally {
        setDriversLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  // ---- Helpers ----

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleGoods = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      goodsAccepted: prev.goodsAccepted.includes(item)
        ? prev.goodsAccepted.filter((g) => g !== item)
        : [...prev.goodsAccepted, item],
    }));
  };

  const getFleetDisplayName = (v: FleetVehicle): string => {
    const modelName = v.vehicle_models?.name || '';
    const brandName = v.vehicle_models?.brands?.name || '';
    const vName = v.vehicleName || '';
    const regNum = v.registrationNumber || '';
    const label = vName || (brandName ? `${brandName} ${modelName}` : modelName) || regNum;
    return regNum ? `${label} (${regNum})` : label;
  };

  const handleFleetSelect = (vehicleId: string) => {
    if (!vehicleId) {
      set('vehicleId', '');
      set('vehicleName', '');
      set('vehicleNumber', '');
      return;
    }
    set('vehicleId', vehicleId);
    const v = fleet.find((f) => f.id === vehicleId);
    if (v) {
      const modelName = v.vehicle_models?.name || '';
      const brandName = v.vehicle_models?.brands?.name || '';
      const displayName = v.vehicleName || (brandName ? `${brandName} ${modelName}` : modelName) || v.registrationNumber || '';
      set('vehicleName', displayName);
      set('vehicleNumber', v.registrationNumber || '');
      if (v.vehicleCategory) set('vehicleCategory', v.vehicleCategory);
      if (v.capacity) set('capacity', v.capacity);
      if (v.bodyType) set('bodyType', v.bodyType);
    }
  };

  // Filter fleet by selected service type (truck → truck service, car → car service)
  const filteredFleet = fleet.filter((v) => {
    if (!formData.serviceType) return true;
    const slug = (v.services?.slug || v.services?.name || '').toLowerCase();
    if (formData.serviceType === 'truck') return slug.includes('truck') || slug.includes('transport');
    if (formData.serviceType === 'car') return slug.includes('car') || slug.includes('chauffeur') || slug.includes('sedan') || slug.includes('suv');
    return true;
  });

  const handleDriverSelect = (driverId: string) => {
    if (!driverId) {
      set('driverName', '');
      set('driverPhone', '');
      return;
    }
    const driver = drivers.find((d) => d.id === driverId);
    if (driver) {
      set('driverName', driver.name || '');
      set('driverPhone', driver.phone || '');
    }
  };

  // ---- Validation ----

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.serviceType) errs.serviceType = 'Select a service type';
    if (!formData.vehicleName.trim()) errs.vehicleName = 'Vehicle name is required';
    if (!formData.fromCity.trim()) errs.fromCity = 'From city is required';
    if (!formData.toCity.trim()) errs.toCity = 'To city is required';
    if (!formData.departureDate) errs.departureDate = 'Departure date is required';
    if (!formData.priceFullLoad) errs.priceFullLoad = formData.serviceType === 'car' ? 'Trip price is required' : 'Full-load price is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---- Submit ----

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const body = {
        serviceType: formData.serviceType,
        vehicleId: formData.vehicleId || undefined,
        vehicleCategory: formData.vehicleCategory || undefined,
        vehicleName: formData.vehicleName,
        vehicleNumber: formData.vehicleNumber || undefined,
        capacity: formData.capacity || undefined,
        bodyType: formData.bodyType || undefined,
        fromCity: formData.fromCity,
        toCity: formData.toCity,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime || undefined,
        arrivalDate: formData.arrivalDate || undefined,
        arrivalTime: formData.arrivalTime || undefined,
        priceFullLoad: Number(formData.priceFullLoad),
        pricePartLoad: formData.pricePartLoad ? Number(formData.pricePartLoad) : undefined,
        acceptsPartLoad: formData.acceptsPartLoad,
        availableSpace: formData.availableSpace || undefined,
        driverIncluded: formData.driverIncluded,
        driverName: formData.driverName || undefined,
        driverPhone: formData.driverPhone || undefined,
        fuelIncluded: formData.fuelIncluded,
        labourAvailable: formData.labourAvailable,
        labourCount: formData.labourCount ? Number(formData.labourCount) : undefined,
        goodsAccepted: formData.goodsAccepted.length > 0 ? formData.goodsAccepted : undefined,
        totalSeats: formData.totalSeats ? Number(formData.totalSeats) : undefined,
        availableSeats: formData.availableSeats ? Number(formData.availableSeats) : undefined,
        busType: formData.busType || undefined,
        isAC: formData.isAC,
        notes: formData.notes || undefined,
      };

      const res = await fetch('/api/p2p/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to post vehicle');
      }

      router.push('/vendor/p2p/my-postings');
    } catch (err: any) {
      setErrors({ _form: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Earning preview helpers ----
  const fullLoadPrice = Number(formData.priceFullLoad) || 0;
  const partLoadPrice = Number(formData.pricePartLoad) || 0;
  const platformFee = Math.round(fullLoadPrice * 0.05);
  const yourEarning = fullLoadPrice - platformFee;

  // ---- Render helpers ----

  const inputCls = (name?: string) =>
    `w-full rounded-xl bg-gray-50 border ${
      name && errors[name] ? 'border-red-400' : 'border-gray-200'
    } px-3 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all`;

  const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(10px) translateX(-6px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 7s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }
        .shimmer-bg { background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%); background-size: 200% 100%; animation: shimmer 2.5s linear infinite; }
      `}</style>
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* ---------- Gradient Header ---------- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-up text-white">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-300/20 rounded-full blur-3xl animate-float-rev" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Link
            href="/vendor/p2p/vehicles"
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30">
            <Send className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Post Empty Vehicle
              <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
            </h1>
            <p className="text-emerald-100 mt-1 text-sm sm:text-base">
              Share your idle or returning vehicle with the P2P marketplace
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Global error ---------- */}
      {errors._form && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-up">
          <Info className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{errors._form}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ================================================================ */}
          {/* LEFT COLUMN — Form Fields                                        */}
          {/* ================================================================ */}
          <div className="flex-1 space-y-6">
            {/* ---------- Service Type Selector ---------- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '60ms' }}>
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Network className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Service Type</h2>
              </div>
              <div className="p-6">
                {errors.serviceType && (
                  <p className="text-xs text-red-500 mb-3">{errors.serviceType}</p>
                )}
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {SERVICE_TYPES.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set('serviceType', key)}
                      className={`flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                        formData.serviceType === key
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-transparent shadow-md scale-[1.02]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ---------- Vehicle Details ---------- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Truck className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Vehicle Details</h2>
              </div>
              <div className="p-6 space-y-5">

              {/* Fleet/Manual toggle — only show if filtered fleet has vehicles */}
              {filteredFleet.length > 0 && (
                <div className="flex gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => { setUseFleetVehicle(true); set('vehicleId', ''); set('vehicleName', ''); set('vehicleNumber', ''); }}
                    className={useFleetVehicle ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all' : 'bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold transition hover:bg-gray-200'}
                  >
                    Select from Fleet
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUseFleetVehicle(false); set('vehicleId', ''); set('vehicleName', ''); set('vehicleNumber', ''); }}
                    className={!useFleetVehicle ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all' : 'bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold transition hover:bg-gray-200'}
                  >
                    Enter Manually
                  </button>
                </div>
              )}

              {/* Fleet vehicle dropdown — filtered by service type */}
              {useFleetVehicle && filteredFleet.length > 0 ? (
                <div>
                  <label className={labelCls}>Select Vehicle from Your Fleet</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => handleFleetSelect(e.target.value)}
                    className={inputCls()}
                    disabled={fleetLoading}
                  >
                    <option value="">
                      {fleetLoading ? 'Loading fleet...' : '-- Select a vehicle --'}
                    </option>
                    {filteredFleet.map((v) => (
                      <option key={v.id} value={v.id}>
                        {getFleetDisplayName(v)}
                      </option>
                    ))}
                  </select>
                  {/* Show selected vehicle details as read-only preview */}
                  {formData.vehicleId && (formData.vehicleName || formData.vehicleNumber) && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-sm text-emerald-800">
                      <span className="font-medium">{formData.vehicleName}</span>
                      {formData.vehicleNumber && <span className="ml-2 text-emerald-600">({formData.vehicleNumber})</span>}
                    </div>
                  )}
                </div>
              ) : (
                /* Manual vehicle name & number inputs */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Vehicle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleName}
                      onChange={(e) => set('vehicleName', e.target.value)}
                      placeholder="e.g., Tata 407 14ft"
                      className={inputCls('vehicleName')}
                    />
                    {errors.vehicleName && (
                      <p className="text-xs text-red-500 mt-1">{errors.vehicleName}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())}
                      placeholder="e.g., MH12AB1234"
                      className={inputCls()}
                    />
                  </div>
                </div>
              )}

              {/* ---- Truck-specific ---- */}
              {formData.serviceType === 'truck' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Capacity (tons)</label>
                      <input
                        type="text"
                        value={formData.capacity}
                        onChange={(e) => set('capacity', e.target.value)}
                        placeholder="e.g., 7"
                        className={inputCls()}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Body Type</label>
                      <select
                        value={formData.bodyType}
                        onChange={(e) => set('bodyType', e.target.value)}
                        className={inputCls()}
                      >
                        <option value="">Select body type</option>
                        {BODY_TYPES.map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Part load */}
                  <div className="flex items-center gap-3">
                    <input
                      id="acceptsPartLoad"
                      type="checkbox"
                      checked={formData.acceptsPartLoad}
                      onChange={(e) => set('acceptsPartLoad', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="acceptsPartLoad" className="text-sm text-gray-700 cursor-pointer">
                      Accepts part-load shipments
                    </label>
                  </div>

                  {formData.acceptsPartLoad && (
                    <div>
                      <label className={labelCls}>Available Space (e.g., 60% or 4 tons)</label>
                      <input
                        type="text"
                        value={formData.availableSpace}
                        onChange={(e) => set('availableSpace', e.target.value)}
                        placeholder="e.g., 60% or 4 tons"
                        className={inputCls()}
                      />
                    </div>
                  )}

                  {/* Goods accepted */}
                  <div>
                    <label className={labelCls}>Goods Accepted</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {GOODS_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleGoods(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            formData.goodsAccepted.includes(item)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Package className="w-3 h-3 inline mr-1" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Labour */}
                  <div className="flex items-center gap-3">
                    <input
                      id="labourAvailable"
                      type="checkbox"
                      checked={formData.labourAvailable}
                      onChange={(e) => set('labourAvailable', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="labourAvailable" className="text-sm text-gray-700 cursor-pointer">
                      Labour available for loading/unloading
                    </label>
                  </div>

                  {formData.labourAvailable && (
                    <div className="w-1/2">
                      <label className={labelCls}>Number of Labourers</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.labourCount}
                        onChange={(e) => set('labourCount', e.target.value)}
                        placeholder="e.g., 2"
                        className={inputCls()}
                      />
                    </div>
                  )}
                </>
              )}

              {/* ---- Car-specific ---- */}
              {formData.serviceType === 'car' && (
                <div>
                  <label className={labelCls}>Vehicle Category</label>
                  <select
                    value={formData.vehicleCategory}
                    onChange={(e) => set('vehicleCategory', e.target.value)}
                    className={inputCls()}
                  >
                    <option value="">Select category</option>
                    {CAR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              </div>
            </div>

            {/* ---------- Route ---------- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '180ms' }}>
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Route className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Route &amp; Schedule</h2>
              </div>
              <div className="p-6 space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                    From City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fromCity}
                    onChange={(e) => set('fromCity', e.target.value)}
                    placeholder="e.g., Pune"
                    className={inputCls('fromCity')}
                  />
                  {errors.fromCity && (
                    <p className="text-xs text-red-500 mt-1">{errors.fromCity}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-green-500" />
                    To City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.toCity}
                    onChange={(e) => set('toCity', e.target.value)}
                    placeholder="e.g., Mumbai"
                    className={inputCls('toCity')}
                  />
                  {errors.toCity && (
                    <p className="text-xs text-red-500 mt-1">{errors.toCity}</p>
                  )}
                </div>
              </div>

              {/* Departure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Departure Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.departureDate}
                    onChange={(e) => set('departureDate', e.target.value)}
                    className={inputCls('departureDate')}
                  />
                  {errors.departureDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.departureDate}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => set('departureTime', e.target.value)}
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* Arrival (optional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Arrival Date (optional)
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.arrivalDate}
                    onChange={(e) => set('arrivalDate', e.target.value)}
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Arrival Time (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => set('arrivalTime', e.target.value)}
                    className={inputCls()}
                  />
                </div>
              </div>
              </div>
            </div>

            {/* ---------- Pricing ---------- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '240ms' }}>
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md">
                  <Wallet className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Pricing</h2>
              </div>
              <div className="p-6 space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    {formData.serviceType === 'car' ? 'Trip Price' : 'Full-Load Price'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      &#8377;
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.priceFullLoad}
                      onChange={(e) => set('priceFullLoad', e.target.value)}
                      placeholder={formData.serviceType === 'car' ? 'e.g., 3000' : 'e.g., 5000'}
                      className={`${inputCls('priceFullLoad')} pl-7`}
                    />
                  </div>
                  {errors.priceFullLoad && (
                    <p className="text-xs text-red-500 mt-1">{errors.priceFullLoad}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Platform fee: 5% of the trip value</p>
                </div>

                {formData.serviceType === 'truck' && formData.acceptsPartLoad && (
                  <div>
                    <label className={labelCls}>Part-Load Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        &#8377;
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={formData.pricePartLoad}
                        onChange={(e) => set('pricePartLoad', e.target.value)}
                        placeholder="e.g., 2500"
                        className={`${inputCls()} pl-7`}
                      />
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* ---------- Inclusions ---------- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Inclusions</h2>
              </div>
              <div className="p-6 space-y-5">

              {/* Driver */}
              <div className="flex items-center gap-3">
                <input
                  id="driverIncluded"
                  type="checkbox"
                  checked={formData.driverIncluded}
                  onChange={(e) => set('driverIncluded', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="driverIncluded" className="text-sm text-gray-700 cursor-pointer">
                  Driver included
                </label>
              </div>

              {formData.driverIncluded && (
                <div className="pl-7 space-y-4">
                  {/* Driver toggle — only show if drivers exist */}
                  {drivers.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setUseFleetDriver(true); set('driverName', ''); set('driverPhone', ''); }}
                        className={useFleetDriver ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all' : 'bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold transition hover:bg-gray-200'}
                      >
                        Select from Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUseFleetDriver(false); set('driverName', ''); set('driverPhone', ''); }}
                        className={!useFleetDriver ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all' : 'bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold transition hover:bg-gray-200'}
                      >
                        Enter Manually
                      </button>
                    </div>
                  )}

                  {/* Driver selector dropdown */}
                  {useFleetDriver && drivers.length > 0 ? (
                    <div>
                      <label className={labelCls}>Select Driver from Your Staff</label>
                      <select
                        value={drivers.find((d) => d.name === formData.driverName && d.phone === formData.driverPhone)?.id || ''}
                        onChange={(e) => handleDriverSelect(e.target.value)}
                        className={inputCls()}
                        disabled={driversLoading}
                      >
                        <option value="">
                          {driversLoading ? 'Loading drivers...' : '-- Select a driver --'}
                        </option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} - {d.phone}
                          </option>
                        ))}
                      </select>
                      {/* Show selected driver details as read-only preview */}
                      {formData.driverName && (
                        <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-sm text-emerald-800">
                          <User className="w-3.5 h-3.5 inline mr-1" />
                          <span className="font-medium">{formData.driverName}</span>
                          {formData.driverPhone && <span className="ml-2 text-emerald-600">({formData.driverPhone})</span>}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Manual driver inputs */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>
                          <User className="w-3.5 h-3.5 inline mr-1" />
                          Driver Name
                        </label>
                        <input
                          type="text"
                          value={formData.driverName}
                          onChange={(e) => set('driverName', e.target.value)}
                          placeholder="Driver's name"
                          className={inputCls()}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          <Phone className="w-3.5 h-3.5 inline mr-1" />
                          Driver Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.driverPhone}
                          onChange={(e) => set('driverPhone', e.target.value)}
                          placeholder="+91 9XXXXXXXXX"
                          className={inputCls()}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fuel */}
              <div className="flex items-center gap-3">
                <input
                  id="fuelIncluded"
                  type="checkbox"
                  checked={formData.fuelIncluded}
                  onChange={(e) => set('fuelIncluded', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="fuelIncluded" className="text-sm text-gray-700 cursor-pointer">
                  Fuel included
                </label>
              </div>
              </div>
            </div>

            {/* ---------- Notes ---------- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '360ms' }}>
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-slate-500 to-gray-700 text-white shadow-md">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Additional Notes</h2>
              </div>
              <div className="p-6">
                <textarea
                  value={formData.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Any special instructions, load restrictions, route details..."
                  className={inputCls()}
                />
              </div>
            </div>

            {/* ---------- Submit ---------- */}
            <div className="flex gap-4 animate-fade-up" style={{ animationDelay: '420ms' }}>
              <Link
                href="/vendor/p2p/vehicles"
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-center font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-xl hover:scale-[1.02] text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Truck className="w-5 h-5" />
                    Post Vehicle
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN — Sticky Earning Preview                            */}
          {/* ================================================================ */}
          <div className="lg:w-[360px] shrink-0">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Earning Preview Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x px-5 py-4">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-float-slow" />
                  <h3 className="relative text-white font-bold flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Earning Preview
                  </h3>
                </div>

                <div className="p-5 space-y-4">
                  {/* Route */}
                  {(formData.fromCity || formData.toCity) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-gray-700">
                        {formData.fromCity || '---'} &rarr; {formData.toCity || '---'}
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  {formData.departureDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-gray-700">
                        {new Date(formData.departureDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {formData.departureTime ? ` at ${formData.departureTime}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Vehicle */}
                  {formData.vehicleName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-gray-700">{formData.vehicleName}</span>
                    </div>
                  )}

                  <hr className="border-gray-100" />

                  {/* Price breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{formData.serviceType === 'car' ? 'Trip Price' : 'Full-Load Price'}</span>
                      <span className="font-medium text-gray-900">
                        {fullLoadPrice > 0 ? formatPrice(fullLoadPrice) : '--'}
                      </span>
                    </div>
                    {formData.serviceType === 'truck' && formData.acceptsPartLoad && partLoadPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Part-Load Price</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(partLoadPrice)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Platform Fee (5%)</span>
                      <span className="font-medium text-red-500">
                        {fullLoadPrice > 0 ? `- ${formatPrice(platformFee)}` : '--'}
                      </span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Your Earning</span>
                    <span className="text-xl font-bold text-green-600">
                      {yourEarning > 0 ? formatPrice(yourEarning) : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-emerald-50 rounded-2xl border border-emerald-100 p-5 animate-fade-up" style={{ animationDelay: '180ms' }}>
                <h4 className="text-base font-bold text-emerald-900 flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Tips for a Great Listing
                </h4>
                <ul className="space-y-2 text-sm text-emerald-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    Set a competitive price to attract quick bookings
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    Include driver details for better trust
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    Accepting part-loads increases your chances of earning
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    Add notes about route details or load restrictions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}
