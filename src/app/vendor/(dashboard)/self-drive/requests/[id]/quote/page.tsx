'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatBookingDuration } from '@/lib/utils/duration';
import Link from 'next/link';
import {
  Car,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  X,
  IndianRupee,
  Edit3,
  AlertCircle,
  Settings2,
  Fuel,
  Users,
  Navigation,
  FileSpreadsheet,
  Lightbulb,
  Loader2,
  Shield,
  Gauge,
  Timer,
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  vehicleModelName?: string;
  vehicleBrand?: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName?: string;
  vehicleType?: string;
  transmission?: string;
  fuelType?: string;
  minSeats?: number;
  customerName: string;
  customerPhone: string;
  locationId: string;
  locationName: string;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate: string;
  dropTime?: string;
  totalDays: number;
  isDeliveryRequested: boolean;
  customerNotes?: string;
  budgetMin?: number;
  budgetMax?: number;
}

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  vehicle_models: {
    id: string;
    name: string;
    brands: { id: string; name: string } | null;
  } | null;
  chauffeur_vehicle_categories: { id: string; name: string; slug: string } | null;
  brands: { id: string; name: string } | null;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  services: { id: string; name: string; slug: string } | null;
  isAvailableForDates?: boolean;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  dailyRateHint?: number;
  kmLimitPerDayHint?: number;
  extraKmRateHint?: number;
  securityDepositHint?: number;
  isActive: boolean;
  isDefault: boolean;
}

const DEFAULT_INCLUSIONS = [
  'Vehicle with full tank',
  'Valid insurance & registration',
  'Basic maintenance during rental',
  '24x7 roadside assistance',
  'No hidden charges',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel charges',
  'Traffic challans/fines',
  'Toll charges',
  'Damage due to negligence',
  'Any unauthorized usage',
];

const DEFAULT_TERMS = [
  'Valid driving license (2+ years old) required',
  'Original Aadhaar card required',
  'Security deposit refundable after inspection',
  'No inter-state travel without prior approval',
  'Late return charges: ₹200/hour after 2 hours grace',
];

export default function SendSelfDriveQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vehicleName, setVehicleName] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicle_category, setVehicleCategory] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [seats, setSeats] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [noSecurityDeposit, setNoSecurityDeposit] = useState(false);
  const [kmLimitPerDay, setKmLimitPerDay] = useState('200');
  const [extraKmRate, setExtraKmRate] = useState('10');
  const [deliveryCharges, setDeliveryCharges] = useState('');
  const [pickupCharges, setPickupCharges] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30');
  const [advanceMode, setAdvanceMode] = useState<'percent' | 'manual'>('percent');
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [inclusions, setInclusions] = useState<string[]>(DEFAULT_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(DEFAULT_EXCLUSIONS);
  const [termsConditions, setTermsConditions] = useState<string[]>(DEFAULT_TERMS);
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('3');
  const [validityMode, setValidityMode] = useState<'days' | 'custom'>('days');
  const [customValidDate, setCustomValidDate] = useState('');
  const [customValidTime, setCustomValidTime] = useState('23:59');
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);
  const [newItem, setNewItem] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  useEffect(() => {
    fetchRequestDetails();
  }, [params.id]);

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/self-drive-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest(data.request);
        if (data.request.transmission) setTransmission(data.request.transmission);
        if (data.request.fuelType) setFuelType(data.request.fuelType);
      }

      try {
        let fleetUrl = '/api/vendor/fleet';
        if (data.request?.pickupDate) {
          const startDate = new Date(data.request.pickupDate).toISOString();
          const endDate = data.request.dropDate ? new Date(data.request.dropDate).toISOString() : startDate;
          fleetUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        }
        const fleetRes = await fetch(fleetUrl);
        const fleetData = await fleetRes.json();
        if (fleetData.success && fleetData.fleet) {
          const selfDriveFleet = fleetData.fleet.filter((v: FleetVehicle) => {
            if (!v.isActive) return false;
            const slug = v.services?.slug?.toLowerCase() || '';
            const name = v.services?.name?.toLowerCase() || '';
            return slug.includes('self-drive') || name.includes('self');
          });
          selfDriveFleet.sort((a: FleetVehicle, b: FleetVehicle) => {
            const aU = a.isAvailableForDates === false ? 1 : 0;
            const bU = b.isAvailableForDates === false ? 1 : 0;
            return aU - bU;
          });
          setFleetVehicles(selfDriveFleet);
        }
      } catch {}

      try {
        const templatesRes = await fetch('/api/vendor/self-drive-templates?activeOnly=true');
        const templatesData = await templatesRes.json();
        if (templatesData.success && templatesData.templates) setTemplates(templatesData.templates);
      } catch {}

      try {
        const expiredRes = await fetch(`/api/vendor/self-drive-quotes?requestId=${params.id}&expired=true`);
        const expiredData = await expiredRes.json();
        if (expiredData.success && expiredData.quote) {
          const eq = expiredData.quote;
          if (eq.vehicleName) setVehicleName(eq.vehicleName);
          if (eq.vehicleBrand) setVehicleBrand(eq.vehicleBrand);
          if (eq.transmission) setTransmission(eq.transmission);
          if (eq.fuelType) setFuelType(eq.fuelType);
          if (eq.seatingCapacity) setSeats(String(eq.seatingCapacity));
          if (eq.registrationNumber) setRegistrationNumber(eq.registrationNumber);
          if (eq.totalAmount) setTotalPrice(String(eq.totalAmount));
          if (eq.securityDeposit) setSecurityDeposit(String(eq.securityDeposit));
          if (eq.unlimitedKm || eq.kmLimitPerDay === 0) setKmLimitPerDay('unlimited');
          else if (eq.kmLimitPerDay) setKmLimitPerDay(String(eq.kmLimitPerDay));
          if (eq.extraKmRate) setExtraKmRate(String(eq.extraKmRate));
          if (eq.deliveryCharge) setDeliveryCharges(String(eq.deliveryCharge));
          if (eq.advancePercent) setAdvancePercent(String(eq.advancePercent));
          if (eq.inclusions) setInclusions(Array.isArray(eq.inclusions) ? eq.inclusions : []);
          if (eq.exclusions) setExclusions(Array.isArray(eq.exclusions) ? eq.exclusions : []);
          if (eq.termsConditions) setTermsConditions(Array.isArray(eq.termsConditions) ? eq.termsConditions : []);
          if (eq.vendorMessage) setNotes(eq.vendorMessage);
          if (eq.fleetVehicleId) setSelectedFleetId(eq.fleetVehicleId);
        }
      } catch {}
    } catch (error) {
      console.error('Failed to fetch request details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setInclusions(t.inclusions);
      setExclusions(t.exclusions);
      setTermsConditions(t.termsConditions);
      if (t.dailyRateHint) setTotalPrice((t.dailyRateHint * (request?.totalDays || 1)).toString());
      if (t.kmLimitPerDayHint) setKmLimitPerDay(t.kmLimitPerDayHint.toString());
      if (t.extraKmRateHint) setExtraKmRate(t.extraKmRateHint.toString());
      if (t.securityDepositHint) setSecurityDeposit(t.securityDepositHint.toString());
    }
  };

  const handleFleetSelection = (fleetId: string) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) { setVehicleName(''); setVehicleBrand(''); setVehicleCategory(''); setRegistrationNumber(''); setTransmission(''); setFuelType(''); setSeats(''); return; }
    const v = fleetVehicles.find(v => v.id === fleetId);
    if (v) {
      let vName = '', vBrand = '';
      if (v.vehicle_models) { vName = v.vehicle_models.name; vBrand = v.vehicle_models.brands?.name || ''; }
      else if (v.chauffeur_vehicle_categories) { vName = v.chauffeur_vehicle_categories.name; }
      if (v.brands) vBrand = v.brands.name;
      setVehicleName(vName); setVehicleBrand(vBrand);
      setVehicleCategory(v.chauffeur_vehicle_categories?.slug || '');
      setRegistrationNumber(v.registrationNumber || '');
      if (v.transmission) setTransmission(v.transmission);
      if (v.fuelType) setFuelType(v.fuelType);
      if (v.seats) setSeats(v.seats.toString());
    }
  };

  const addItem = (list: string[], setList: (items: string[]) => void) => {
    if (newItem.trim() && !list.includes(newItem.trim())) { setList([...list, newItem.trim()]); setNewItem(''); }
  };
  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => { setList(list.filter((i) => i !== item)); };

  const calculateTotal = () => (parseFloat(totalPrice) || 0) + (parseFloat(deliveryCharges) || 0) + (parseFloat(pickupCharges) || 0);
  const calculateDailyRate = () => (parseFloat(totalPrice) || 0) / (request?.totalDays || 1);
  const calculateAdvance = () => {
    if (advanceMode === 'manual' && customAdvanceAmount) return parseFloat(customAdvanceAmount) || 0;
    return Math.round((calculateTotal() * (parseInt(advancePercent) || 30)) / 100);
  };
  const advanceExceedsTotal = calculateAdvance() > calculateTotal() && calculateTotal() > 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!vehicleName.trim()) newErrors.vehicleName = 'Car name/model is required';

    if (!totalPrice || parseFloat(totalPrice) <= 0) newErrors.totalPrice = 'Total price must be greater than ₹0';

    if (!noSecurityDeposit && (!securityDeposit || parseFloat(securityDeposit) <= 0))
      newErrors.securityDeposit = 'Enter deposit amount > ₹0, or check "No security deposit required"';

    if (kmLimitPerDay !== 'unlimited' && (!kmLimitPerDay || parseInt(kmLimitPerDay) <= 0))
      newErrors.kmLimitPerDay = 'KM limit must be greater than 0';

    if (kmLimitPerDay !== 'unlimited' && (!extraKmRate || parseFloat(extraKmRate) <= 0))
      newErrors.extraKmRate = 'Extra KM rate must be greater than ₹0';

    if (advanceMode === 'manual' && (!customAdvanceAmount || parseFloat(customAdvanceAmount) <= 0))
      newErrors.customAdvanceAmount = 'Enter a valid advance amount';

    if (advanceExceedsTotal)
      newErrors.customAdvanceAmount = `Advance (₹${calculateAdvance().toLocaleString()}) cannot exceed total (₹${calculateTotal().toLocaleString()})`;

    if (validityMode === 'custom' && !customValidDate)
      newErrors.customValidDate = 'Please select a validity date';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error field
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vendor/self-drive-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request?.id || params.id,
          vendorFleetId: selectedFleetId || null,
          vehicleName: vehicleName || request?.vehicleModelName || request?.vehicleCategoryName,
          vehicleBrand: vehicleBrand || null,
          chauffeur_vehicle_categories: vehicle_category || request?.vehicle_category || null,
          vehicleType: request?.vehicleType || null,
          transmission: transmission || null, fuelType: fuelType || null,
          seats: seats ? parseInt(seats) : null,
          registrationNumber: registrationNumber || null,
          dailyRate: calculateDailyRate(), totalPrice: parseFloat(totalPrice),
          securityDeposit: parseFloat(securityDeposit) || 0,
          kmLimitPerDay: kmLimitPerDay === 'unlimited' ? 0 : (parseInt(kmLimitPerDay) || 200),
          unlimitedKm: kmLimitPerDay === 'unlimited',
          extraKmRate: parseFloat(extraKmRate) || 10,
          deliveryCharges: parseFloat(deliveryCharges) || 0,
          pickupCharges: parseFloat(pickupCharges) || 0,
          advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 30) : 0,
          customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
          inclusions, exclusions, termsConditions, vendorMessage: notes,
          validityDays: validityMode === 'days' ? (parseInt(validityDays) || 3) : undefined,
          customValidTill: validityMode === 'custom' && customValidDate ? new Date(`${customValidDate}T${customValidTime || '23:59'}:00`).toISOString() : undefined,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setApiSuccess('Quote sent successfully! Redirecting...');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => router.push('/vendor/self-drive/quotes'), 2000);
      } else {
        setApiError(data.error || 'Failed to send quote. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Failed to submit quote:', error);
      setApiError('Something went wrong. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 hover:border-gray-300 transition-all';
  const selectCls = inputCls;
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5';

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Success Modal Overlay */}
      {apiSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <svg className="absolute w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="226" strokeDashoffset="226" style={{ animation: 'dash 1.8s ease-out forwards' }} />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Quote Sent!</h2>
            <p className="text-sm text-gray-500 text-center">Your quote has been submitted successfully. Redirecting to your quotes...</p>
            <div className="flex gap-1 mt-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
        </div>
      )}
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 md:p-6 mb-5">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute left-1/3 -top-6 w-24 h-24 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center gap-3.5">
          <Link href="/vendor/self-drive/requests" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-95 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Send Quote</h1>
            <p className="text-emerald-100 text-xs md:text-sm mt-0.5">#{request.requestNumber}</p>
          </div>
        </div>

        {/* Request Summary inside hero */}
        <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Car className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Vehicle</span></div>
            <p className="text-sm font-bold text-white truncate">{request.vehicleModelName || request.vehicleCategoryName || 'Any Car'}</p>
            {request.vehicleBrand && <p className="text-[10px] text-white/60">{request.vehicleBrand}</p>}
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><MapPin className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Location</span></div>
            <p className="text-sm font-bold text-white truncate">{request.locationName}</p>
            {request.isDeliveryRequested && <p className="text-[10px] text-emerald-200">Delivery requested</p>}
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Calendar className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Dates</span></div>
            <p className="text-sm font-bold text-white">{new Date(request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(request.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            <p className="text-[10px] text-white/60">{formatBookingDuration(request)}{request.pickupTime ? ` • ${request.pickupTime}` : ''}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Settings2 className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Preferences</span></div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {request.transmission && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">{request.transmission}</span>}
              {request.fuelType && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">{request.fuelType}</span>}
              {request.minSeats && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">{request.minSeats}+ seats</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Notes */}
      {request.customerNotes && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-700">Customer Note</p>
            <p className="text-sm text-amber-800 mt-0.5">{request.customerNotes}</p>
          </div>
        </div>
      )}

      {/* Template Selector */}
      {templates.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"><Lightbulb className="w-3.5 h-3.5 text-emerald-600" /></div>
            <h3 className="text-sm font-bold text-gray-900">Quick Fill with Template</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Load saved template to auto-fill inclusions, exclusions, terms & rates</p>
          <select value={selectedTemplateId} onChange={(e) => handleTemplateSelection(e.target.value)} className={selectCls}>
            <option value="">-- Select a template (optional) --</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.description ? ` - ${t.description}` : ''}</option>)}
          </select>
          {selectedTemplateId && (
            <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Template loaded! Edit any field before sending.</p>
          )}
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="flex-1 text-sm text-red-700 font-medium">{apiError}</p>
          <button type="button" onClick={() => setApiError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ══════════ 2-COLUMN GRID ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">
            {/* Vehicle Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
                <Car className="w-4 h-4 text-emerald-500" /> Vehicle Details
              </h2>

              {fleetVehicles.length > 0 && (
                <div className="mb-4">
                  <label className={labelCls}>Select from your fleet</label>
                  <select value={selectedFleetId} onChange={(e) => handleFleetSelection(e.target.value)} className={selectCls}>
                    <option value="">-- Select a car from fleet (or enter manually) --</option>
                    {fleetVehicles.map((v) => {
                      let dn = v.vehicle_models ? (v.vehicle_models.brands?.name ? `${v.vehicle_models.brands.name} ${v.vehicle_models.name}` : v.vehicle_models.name) : (v.chauffeur_vehicle_categories?.name || '');
                      const reg = v.registrationNumber ? ` (${v.registrationNumber})` : '';
                      const un = v.isAvailableForDates === false;
                      return <option key={v.id} value={v.id} disabled={un}>{dn}{reg}{un ? ' — Booked' : ''}</option>;
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Car Name/Model *</label>
                  <input ref={vehicleNameRef} type="text" value={vehicleName} data-error={!!errors.vehicleName} onChange={(e) => { setVehicleName(e.target.value); setSelectedFleetId(''); if (errors.vehicleName) setErrors(prev => ({ ...prev, vehicleName: '' })); }} placeholder="e.g., Swift Dzire" className={`${inputCls} ${errors.vehicleName ? 'border-red-400 bg-red-50' : ''}`} />
                  {errors.vehicleName && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.vehicleName}</p>}
                </div>
                <div><label className={labelCls}>Brand</label><input type="text" value={vehicleBrand} onChange={(e) => { setVehicleBrand(e.target.value); setSelectedFleetId(''); }} placeholder="e.g., Maruti" className={inputCls} /></div>
                <div><label className={labelCls}>Registration Number</label><input type="text" value={registrationNumber} onChange={(e) => { setRegistrationNumber(e.target.value.toUpperCase()); setSelectedFleetId(''); }} placeholder="DL 01 AB 1234" className={inputCls} /></div>
                <div><label className={labelCls}>Transmission</label><select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={selectCls}><option value="">Select</option><option value="Manual">Manual</option><option value="Automatic">Automatic</option></select></div>
                <div><label className={labelCls}>Fuel Type</label><select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={selectCls}><option value="">Select</option><option value="Petrol">Petrol</option><option value="Diesel">Diesel</option><option value="CNG">CNG</option><option value="Electric">Electric</option><option value="Hybrid">Hybrid</option></select></div>
                <div><label className={labelCls}>Seats</label><select value={seats} onChange={(e) => setSeats(e.target.value)} className={selectCls}><option value="">Select</option><option value="4">4 Seater</option><option value="5">5 Seater</option><option value="6">6 Seater</option><option value="7">7 Seater</option><option value="8">8 Seater</option></select></div>
              </div>
              </div>
              {errors.kmLimitPerDay && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.kmLimitPerDay}</p>}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
                <IndianRupee className="w-4 h-4 text-emerald-500" /> Pricing
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Total Price ({request.totalDays} days) *</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                    <input ref={totalPriceRef} type="number" value={totalPrice} data-error={!!errors.totalPrice} onChange={(e) => { setTotalPrice(e.target.value); if (errors.totalPrice) setErrors(prev => ({ ...prev, totalPrice: '' })); }} placeholder={`${(request.totalDays || 1) * 2500}`} className={`${inputCls} pl-7 ${errors.totalPrice ? 'border-red-400 bg-red-50' : ''}`} />
                  </div>
                  {errors.totalPrice ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.totalPrice}</p> : <p className="text-[10px] text-gray-400 mt-1">Total quote price for entire rental period</p>}
                </div>
                <div>
                  <label className={labelCls}>Security Deposit</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                    <input type="number" value={noSecurityDeposit ? '' : securityDeposit} onChange={(e) => { setSecurityDeposit(e.target.value); if (errors.securityDeposit) setErrors(prev => ({ ...prev, securityDeposit: '' })); }} placeholder="5000" disabled={noSecurityDeposit} className={`${inputCls} pl-7 ${noSecurityDeposit ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : errors.securityDeposit ? 'border-red-400 bg-red-50' : ''}`} />
                  </div>
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer"><input type="checkbox" checked={noSecurityDeposit} onChange={(e) => { setNoSecurityDeposit(e.target.checked); if (e.target.checked) { setSecurityDeposit('0'); setErrors(prev => ({ ...prev, securityDeposit: '' })); } }} className="w-3.5 h-3.5 rounded accent-emerald-500" /><span className="text-[11px] text-gray-500">No deposit required</span></label>
                  {errors.securityDeposit && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.securityDeposit}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelCls}>KM Limit Per Day</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={kmLimitPerDay === 'unlimited' ? '' : kmLimitPerDay} onChange={(e) => setKmLimitPerDay(e.target.value)} placeholder="200" disabled={kmLimitPerDay === 'unlimited'} className={`${inputCls} ${kmLimitPerDay === 'unlimited' ? 'bg-gray-50 text-gray-400' : ''}`} />
                    <button type="button" onClick={() => setKmLimitPerDay(kmLimitPerDay === 'unlimited' ? '200' : 'unlimited')} className={`px-3 py-2.5 text-[10px] font-bold rounded-xl border transition whitespace-nowrap ${kmLimitPerDay === 'unlimited' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>Unlimited</button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Extra KM Rate</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                    <input type="number" value={kmLimitPerDay === 'unlimited' ? '' : extraKmRate} onChange={(e) => setExtraKmRate(e.target.value)} placeholder="10" disabled={kmLimitPerDay === 'unlimited'} className={`${inputCls} pl-7 ${kmLimitPerDay === 'unlimited' ? 'bg-gray-50 text-gray-400' : ''}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">/km</span>
                  </div>
                </div>
              </div>

              {request.isDeliveryRequested && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><label className={labelCls}><Navigation className="w-3 h-3 inline mr-1" />Delivery Charges</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span><input type="number" value={deliveryCharges} onChange={(e) => setDeliveryCharges(e.target.value)} placeholder="500" className={`${inputCls} pl-7`} /></div></div>
                  <div><label className={labelCls}>Pickup Charges</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span><input type="number" value={pickupCharges} onChange={(e) => setPickupCharges(e.target.value)} placeholder="500" className={`${inputCls} pl-7`} /></div></div>
                </div>
              )}
            </div>

            {/* Advance & Validity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
                <Shield className="w-4 h-4 text-emerald-500" /> Advance & Validity
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Advance Payment</label>
                  <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
                    <button type="button" onClick={() => setAdvanceMode('percent')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${advanceMode === 'percent' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>By Percentage</button>
                    <button type="button" onClick={() => setAdvanceMode('manual')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${advanceMode === 'manual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Custom Amount</button>
                  </div>
                  {advanceMode === 'percent' ? (
                    <div className="flex items-center gap-2">
                      <select value={advancePercent} onChange={(e) => setAdvancePercent(e.target.value)} className={`w-20 ${selectCls}`}>
                        {['20','25','30','40','50'].map(v => <option key={v} value={v}>{v}%</option>)}
                      </select>
                      <span className="text-xs text-gray-500">= ₹{calculateAdvance().toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                      <input type="number" value={customAdvanceAmount} onChange={(e) => { setCustomAdvanceAmount(e.target.value); if (errors.customAdvanceAmount) setErrors(prev => ({ ...prev, customAdvanceAmount: '' })); }} placeholder="Enter amount" className={`${inputCls} pl-7 ${errors.customAdvanceAmount ? 'border-red-400 bg-red-50' : ''}`} />
                    </div>
                  )}
                  {errors.customAdvanceAmount && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.customAdvanceAmount}</p>}
                  {advanceExceedsTotal && <p className="text-[10px] text-red-500 mt-1 font-medium">Advance exceeds total (₹{calculateTotal().toLocaleString()})</p>}
                </div>
                <div>
                  <label className={labelCls}>Quote Valid Till</label>
                  <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
                    <button type="button" onClick={() => setValidityMode('days')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${validityMode === 'days' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Quick (Days)</button>
                    <button type="button" onClick={() => setValidityMode('custom')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${validityMode === 'custom' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Custom Date</button>
                  </div>
                  {validityMode === 'days' ? (
                    <select value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className={selectCls}>
                      {['1','2','3','5','7'].map(v => <option key={v} value={v}>{v} day{v !== '1' ? 's' : ''}</option>)}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input ref={customValidDateRef} type="date" value={customValidDate} data-error={!!errors.customValidDate} onChange={(e) => { setCustomValidDate(e.target.value); if (errors.customValidDate) setErrors(prev => ({ ...prev, customValidDate: '' })); }} min={new Date().toISOString().split('T')[0]} className={`flex-1 ${inputCls} ${errors.customValidDate ? 'border-red-400 bg-red-50' : ''}`} />
                      <input type="time" value={customValidTime} onChange={(e) => setCustomValidTime(e.target.value)} className={`w-[100px] ${inputCls}`} />
                    </div>
                  )}
                  {errors.customValidDate
                    ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.customValidDate}</p>
                    : <p className="text-[10px] text-gray-400 mt-1">{validityMode === 'days' ? `Expires in ${validityDays} day(s)` : customValidDate ? `Until ${new Date(`${customValidDate}T${customValidTime}`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Select date'}</p>
                  }
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Notes for Customer <span className="text-gray-400 font-normal">(optional)</span></h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special notes or messages..." rows={3} className={`${inputCls} resize-none`} />
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">
            {/* Quote Summary (sticky) */}
            <div className="lg:sticky lg:top-[73px] z-10">
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Quote Summary</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Rental ({request.totalDays}d)</span><span className="font-medium">₹{(parseFloat(totalPrice) || 0).toLocaleString()}</span></div>
                  {totalPrice && <p className="text-[10px] text-gray-400 -mt-2">≈ ₹{Math.round(calculateDailyRate()).toLocaleString()}/day</p>}
                  {(parseFloat(deliveryCharges) > 0 || parseFloat(pickupCharges) > 0) && (
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery + Pickup</span><span className="font-medium">₹{((parseFloat(deliveryCharges) || 0) + (parseFloat(pickupCharges) || 0)).toLocaleString()}</span></div>
                  )}
                  {parseFloat(securityDeposit) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Security Deposit</span><span className="font-medium">₹{(parseFloat(securityDeposit) || 0).toLocaleString()}</span></div>}
                  <div className="border-t border-emerald-100 pt-3">
                    <div className="flex justify-between"><span className="text-sm font-bold text-gray-900">Total</span><span className="text-xl font-extrabold text-emerald-600">₹{(calculateTotal() + (parseFloat(securityDeposit) || 0)).toLocaleString()}</span></div>
                  </div>
                  <div className="border-t border-emerald-100 pt-3 space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-emerald-600 font-medium">Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : ''}</span><span className="font-bold text-emerald-600">₹{calculateAdvance().toLocaleString()}</span></div>
                    <div className="flex justify-between text-xs text-gray-400"><span>Remaining at pickup</span><span>₹{(calculateTotal() + (parseFloat(securityDeposit) || 0) - calculateAdvance()).toLocaleString()}</span></div>
                  </div>
                  <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-100 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{kmLimitPerDay === 'unlimited' ? 'Unlimited KM' : `${kmLimitPerDay} km/day`}</span>
                    <span>Extra: ₹{extraKmRate}/km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inclusions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-emerald-400" /><CheckCircle className="w-4 h-4 text-emerald-500" /> Inclusions <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">{inclusions.length}</span></h2>
                <button type="button" onClick={() => setEditMode(editMode === 'inclusions' ? null : 'inclusions')} className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" />{editMode === 'inclusions' ? 'Done' : 'Edit'}</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {inclusions.map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />{item}
                    {editMode === 'inclusions' && <button type="button" onClick={() => removeItem(inclusions, setInclusions, item)} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>}
                  </span>
                ))}
              </div>
              {editMode === 'inclusions' && (
                <div className="mt-3 flex gap-2"><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(inclusions, setInclusions))} placeholder="Add inclusion..." className={`flex-1 ${inputCls}`} /><button type="button" onClick={() => addItem(inclusions, setInclusions)} className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button></div>
              )}
            </div>

            {/* Exclusions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-red-400" /><XCircle className="w-4 h-4 text-red-500" /> Exclusions <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">{exclusions.length}</span></h2>
                <button type="button" onClick={() => setEditMode(editMode === 'exclusions' ? null : 'exclusions')} className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" />{editMode === 'exclusions' ? 'Done' : 'Edit'}</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {exclusions.map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-medium">
                    <div className="w-1 h-1 rounded-full bg-red-400" />{item}
                    {editMode === 'exclusions' && <button type="button" onClick={() => removeItem(exclusions, setExclusions, item)} className="hover:text-red-900 ml-0.5"><X className="w-3 h-3" /></button>}
                  </span>
                ))}
              </div>
              {editMode === 'exclusions' && (
                <div className="mt-3 flex gap-2"><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(exclusions, setExclusions))} placeholder="Add exclusion..." className={`flex-1 ${inputCls}`} /><button type="button" onClick={() => addItem(exclusions, setExclusions)} className="w-9 h-9 shrink-0 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button></div>
              )}
            </div>

            {/* Terms */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-gray-400" /> Terms & Conditions <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{termsConditions.length}</span></h2>
                <button type="button" onClick={() => setEditMode(editMode === 'terms' ? null : 'terms')} className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" />{editMode === 'terms' ? 'Done' : 'Edit'}</button>
              </div>
              <div className="space-y-1.5">
                {termsConditions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="text-[11px] text-gray-300 font-mono mt-0.5 shrink-0">{idx + 1}.</span>
                    <span className="flex-1 text-sm text-gray-700">{item}</span>
                    {editMode === 'terms' && <button type="button" onClick={() => removeItem(termsConditions, setTermsConditions, item)} className="text-gray-400 hover:text-red-500 mt-0.5"><X className="w-3 h-3" /></button>}
                  </div>
                ))}
              </div>
              {editMode === 'terms' && (
                <div className="mt-3 flex gap-2"><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(termsConditions, setTermsConditions))} placeholder="Add term..." className={`flex-1 ${inputCls}`} /><button type="button" onClick={() => addItem(termsConditions, setTermsConditions)} className="w-9 h-9 shrink-0 rounded-xl bg-gray-700 hover:bg-gray-800 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button></div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 -mx-4 md:-mx-6 flex gap-3 z-20">
        <Link href="/vendor/self-drive/requests" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">Cancel</Link>
        <button type="submit" form="quote-form" disabled={isSubmitting || !totalPrice || !vehicleName || advanceExceedsTotal} onClick={handleSubmit} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Quote (₹{calculateTotal().toLocaleString()})</>}
        </button>
      </div>
    </div>
  );
}
