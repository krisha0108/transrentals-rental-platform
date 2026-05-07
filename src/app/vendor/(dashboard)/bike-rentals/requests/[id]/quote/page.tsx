'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatBookingDuration } from '@/lib/utils/duration';
import Link from 'next/link';
import {
  Bike,
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
  HardHat,
  FileSpreadsheet,
  Lightbulb,
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  vehicleModelName?: string;
  vehicleBrand?: string;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName?: string;
  customerName: string;
  customerPhone: string;
  locationId: string;
  locationName: string;
  pickupDate: string;
  pickupTime?: string;
  dropDate: string;
  dropTime?: string;
  totalDays: number;
  helmetsRequired?: number;
  numberOfVehicles?: number;
  pickupAddress?: string;
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
  services: { id: string; name: string; slug: string } | null;
  serviceId?: string;
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
  weeklyRateHint?: number;
  monthlyRateHint?: number;
  securityDepositHint?: number;
  isActive: boolean;
  isDefault: boolean;
}

const DEFAULT_INCLUSIONS = [
  'Bike with full tank',
  'Helmet(s) included',
  'Valid insurance',
  'Basic maintenance during rental',
  'Roadside assistance',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel charges',
  'Traffic challans/fines',
  'Damage due to misuse',
  'Personal accident coverage',
];

const DEFAULT_TERMS = [
  'Valid driving license required',
  'Security deposit refundable after inspection',
  'No off-road or racing use',
  'Late return charges apply',
];

export default function SendBikeQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Quote form state
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleImages, setVehicleImages] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [noSecurityDeposit, setNoSecurityDeposit] = useState(false);
  const [helmetsIncluded, setHelmetsIncluded] = useState('1');
  const [kmLimitPerDay, setKmLimitPerDay] = useState('');
  const [extraKmCharge, setExtraKmCharge] = useState('');
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

  useEffect(() => {
    fetchRequestDetails();
  }, [params.id]);

  const fetchRequestDetails = async () => {
    try {
      // Fetch the quote request details
      const response = await fetch(`/api/vendor/bike-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest(data.request);
      }

      // Fetch vendor's fleet for bike service (with availability check for booking dates)
      try {
        let fleetUrl = '/api/vendor/fleet';
        if (data.request?.pickupDate) {
          const startDate = new Date(data.request.pickupDate).toISOString();
          const endDate = data.request.dropDate
            ? new Date(data.request.dropDate).toISOString()
            : startDate;
          fleetUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        }
        const fleetRes = await fetch(fleetUrl);
        const fleetData = await fleetRes.json();
        if (fleetData.success && fleetData.fleet) {
          // Filter for bike rental service
          const bikeFleet = fleetData.fleet.filter((v: FleetVehicle) => {
            if (!v.isActive) return false;
            const svc = v.services;
            const slug = svc?.slug?.toLowerCase() || '';
            const name = svc?.name?.toLowerCase() || '';
            return slug === 'bike-on-rent' || slug.includes('bike') || name.includes('bike');
          });
          // Sort: available vehicles first, unavailable at the end
          bikeFleet.sort((a: FleetVehicle, b: FleetVehicle) => {
            const aUnavail = a.isAvailableForDates === false ? 1 : 0;
            const bUnavail = b.isAvailableForDates === false ? 1 : 0;
            return aUnavail - bUnavail;
          });
          setFleetVehicles(bikeFleet);
        }
      } catch (fleetError) {
        console.error('Failed to fetch fleet:', fleetError);
      }

      // Fetch vendor's templates
      try {
        const templatesRes = await fetch('/api/vendor/bike-templates?activeOnly=true');
        const templatesData = await templatesRes.json();
        if (templatesData.success && templatesData.templates) {
          setTemplates(templatesData.templates);
        }
      } catch (templatesError) {
        console.error('Failed to fetch templates:', templatesError);
      }

      // Check for expired quote to pre-fill (resubmit flow)
      try {
        const expiredRes = await fetch(`/api/vendor/bike-quotes?requestId=${params.id}&expired=true`);
        const expiredData = await expiredRes.json();
        if (expiredData.success && expiredData.quote) {
          const eq = expiredData.quote;
          if (eq.vehicleName) setVehicleName(eq.vehicleName);
          if (eq.vehicleBrand) setVehicleBrand(eq.vehicleBrand);
          if (eq.registrationNumber) setRegistrationNumber(eq.registrationNumber);
          if (eq.totalPrice) setTotalPrice(String(eq.totalPrice));
          if (eq.securityDeposit) setSecurityDeposit(String(eq.securityDeposit));
          if (eq.helmetsIncluded) setHelmetsIncluded(String(eq.helmetsIncluded));
          if (eq.kmLimitPerDay) setKmLimitPerDay(String(eq.kmLimitPerDay));
          if (eq.extraKmCharge) setExtraKmCharge(String(eq.extraKmCharge));
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

    if (templateId === '') {
      return;
    }

    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      // Load template data
      setInclusions(selectedTemplate.inclusions);
      setExclusions(selectedTemplate.exclusions);
      setTermsConditions(selectedTemplate.termsConditions);

      // Load rate hints - calculate total from daily rate hint
      if (selectedTemplate.dailyRateHint) {
        const days = request?.totalDays || 1;
        const estimatedTotal = selectedTemplate.dailyRateHint * days;
        setTotalPrice(estimatedTotal.toString());
      }
      if (selectedTemplate.securityDepositHint) setSecurityDeposit(selectedTemplate.securityDepositHint.toString());
    }
  };

  const handleFleetSelection = (fleetId: string) => {
    setSelectedFleetId(fleetId);

    if (fleetId === '') {
      setVehicleName('');
      setVehicleBrand('');
      setRegistrationNumber('');
      setVehicleImages(null);
      return;
    }

    const selectedVehicle = fleetVehicles.find(v => v.id === fleetId);
    if (selectedVehicle) {
      let vName = '';
      let vBrand = '';
      if (selectedVehicle.vehicle_models) {
        vName = selectedVehicle.vehicle_models.name;
        vBrand = selectedVehicle.vehicle_models.brands?.name || '';
      } else if (selectedVehicle.chauffeur_vehicle_categories) {
        vName = selectedVehicle.chauffeur_vehicle_categories.name;
      }
      if (selectedVehicle.brands) {
        vBrand = selectedVehicle.brands.name;
      }

      setVehicleName(vName);
      setVehicleBrand(vBrand);
      setRegistrationNumber(selectedVehicle.registrationNumber || '');

      // Extract vehicle images
      const images = (selectedVehicle as any).images || null;
      setVehicleImages(images);
      console.log('🖼️ Selected vehicle images:', images);
    }
  };

  const addItem = (list: string[], setList: (items: string[]) => void) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setList([...list, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  const calculateDailyRate = () => {
    const total = parseFloat(totalPrice) || 0;
    const days = request?.totalDays || 1;
    return total / days;
  };

  const calculateAdvance = () => {
    if (advanceMode === 'manual' && customAdvanceAmount) {
      return parseFloat(customAdvanceAmount) || 0;
    }
    const total = parseFloat(totalPrice) || 0;
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const advanceExceedsTotal = calculateAdvance() > (parseFloat(totalPrice) || 0) && (parseFloat(totalPrice) || 0) > 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!vehicleName.trim()) newErrors.vehicleName = 'Bike name/model is required';
    if (!totalPrice || parseFloat(totalPrice) <= 0) newErrors.totalPrice = 'Total price must be greater than 0';
    if (!noSecurityDeposit && (!securityDeposit || parseFloat(securityDeposit) <= 0)) newErrors.securityDeposit = 'Security deposit is required (or check "No security deposit")';
    if (advanceMode === 'manual' && customAdvanceAmount) {
      const adv = parseFloat(customAdvanceAmount) || 0;
      const total = parseFloat(totalPrice) || 0;
      if (total > 0 && adv > total) newErrors.customAdvanceAmount = 'Advance amount cannot exceed total price';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
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
      const calculatedDailyRate = calculateDailyRate();
      const response = await fetch('/api/vendor/bike-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request?.id || params.id,
          vendorFleetId: selectedFleetId || null,
          vehicleName: vehicleName || request?.vehicle_modelsName || request?.vehicleCategoryName,
          vehicleBrand: vehicleBrand || null,
          chauffeur_vehicle_categories: request?.vehicle_category || null,
          registrationNumber: registrationNumber || null,
          vehicleImages: vehicleImages || null,
          dailyRate: calculatedDailyRate,
          totalPrice: parseFloat(totalPrice),
          securityDeposit: parseFloat(securityDeposit) || 0,
          helmetsIncluded: parseInt(helmetsIncluded) || 1,
          kmLimitPerDay: kmLimitPerDay === 'unlimited' ? 0 : (kmLimitPerDay ? parseInt(kmLimitPerDay) : null),
          unlimitedKm: kmLimitPerDay === 'unlimited',
          extraKmCharge: extraKmCharge ? parseFloat(extraKmCharge) : null,
          advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 30) : 0,
          customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
          inclusions,
          exclusions,
          termsConditions,
          vendorMessage: notes,
          validityDays: validityMode === 'days' ? (parseInt(validityDays) || 3) : undefined,
          customValidTill: validityMode === 'custom' && customValidDate
            ? new Date(`${customValidDate}T${customValidTime || '23:59'}:00`).toISOString()
            : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setApiSuccess('Quote sent successfully! Redirecting...');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => router.push('/vendor/bike-rentals/quotes'), 2000);
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

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
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
        <div className="absolute inset-0 opacity-10"><div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" /><div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" /><div className="absolute left-1/3 -top-6 w-24 h-24 rounded-full bg-white" /></div>
        <div className="relative flex items-center gap-3.5">
          <Link href="/vendor/bike-rentals/requests" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-95 transition-all shrink-0"><ArrowLeft className="w-5 h-5 text-white" /></Link>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shrink-0"><Send className="w-6 h-6 text-white" /></div>
          <div className="min-w-0"><h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Send Quote</h1><p className="text-emerald-100 text-xs md:text-sm mt-0.5">#{request.requestNumber}</p></div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Bike className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Bike</span></div>
            <p className="text-sm font-bold text-white truncate">{request.vehicleModelName || request.vehicleCategoryName || 'Any Bike'}</p>
            {request.vehicleBrand && <p className="text-[10px] text-white/60">{request.vehicleBrand}</p>}
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><MapPin className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Location</span></div>
            <p className="text-sm font-bold text-white truncate">{request.locationName}</p>
            {request.pickupAddress && <p className="text-[10px] text-emerald-100/90 truncate" title={request.pickupAddress}>{request.pickupAddress}</p>}
            {request.helmetsRequired && <p className="text-[10px] text-emerald-200">{request.helmetsRequired} helmet(s)</p>}
            {request.numberOfVehicles && request.numberOfVehicles > 1 && <p className="text-[10px] text-emerald-200">{request.numberOfVehicles} bikes needed</p>}
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Calendar className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Dates</span></div>
            <p className="text-sm font-bold text-white">{new Date(request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(request.dropDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            <p className="text-[10px] text-white/60">{formatBookingDuration(request)}{request.pickupTime ? ` • ${request.pickupTime}` : ''}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Clock className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Duration</span></div>
            <p className="text-2xl font-extrabold text-white">{request.totalDays}<span className="text-sm font-medium ml-1">days</span></p>
          </div>
        </div>
      </div>

      {request.customerNotes && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div><p className="text-xs font-bold text-amber-700">Customer Note</p><p className="text-sm text-amber-800 mt-0.5">{request.customerNotes}</p></div>
        </div>
      )}

      {/* Template Selector */}
      {templates.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Quick Fill with Template</h3>
          </div>
          <p className="text-sm text-emerald-700 mb-3">Load saved template to auto-fill inclusions, exclusions, terms & rates</p>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateSelection(e.target.value)}
            className="w-full px-4 py-2.5 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">-- Select a template (optional) --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.description && `- ${template.description}`}
              </option>
            ))}
          </select>
          {selectedTemplateId && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              Template loaded! You can still edit any field before sending.
            </div>
          )}
        </div>
      )}

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">
        {/* Vehicle Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
            <Bike className="w-4 h-4 text-emerald-500" /> Vehicle Details
          </h2>

          {fleetVehicles.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select from your fleet
              </label>
              <select
                value={selectedFleetId}
                onChange={(e) => handleFleetSelection(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Select a bike from fleet (or enter manually) --</option>
                {fleetVehicles.map((vehicle) => {
                  let displayName = '';
                  if (vehicle.vehicle_models) {
                    const brandName = vehicle.vehicle_models.brands?.name;
                    displayName = brandName
                      ? `${brandName} ${vehicle.vehicle_models.name}`
                      : vehicle.vehicle_models.name;
                  } else if (vehicle.chauffeur_vehicle_categories) {
                    displayName = vehicle.chauffeur_vehicle_categories.name;
                  }
                  const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';
                  const isUnavailable = vehicle.isAvailableForDates === false;

                  return (
                    <option key={vehicle.id} value={vehicle.id} disabled={isUnavailable}>
                      {displayName}{regNum}{isUnavailable ? ' — Booked for these dates' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bike Name/Model *
              </label>
              <input
                type="text"
                value={vehicleName}
                data-error={!!errors.vehicleName}
                onChange={(e) => {
                  setVehicleName(e.target.value);
                  setSelectedFleetId('');
                  if (errors.vehicleName) setErrors(prev => ({ ...prev, vehicleName: '' }));
                }}
                placeholder="e.g., Royal Enfield Classic 350"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.vehicleName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.vehicleName && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.vehicleName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={vehicleBrand}
                onChange={(e) => {
                  setVehicleBrand(e.target.value);
                  setSelectedFleetId('');
                }}
                placeholder="e.g., Royal Enfield"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => {
                  setRegistrationNumber(e.target.value.toUpperCase());
                  setSelectedFleetId('');
                }}
                placeholder="e.g., DL 01 AB 1234"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <HardHat className="w-4 h-4" />
                Helmets Included
              </label>
              <select
                value={helmetsIncluded}
                onChange={(e) => setHelmetsIncluded(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1">1 Helmet</option>
                <option value="2">2 Helmets</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
            <IndianRupee className="w-4 h-4 text-emerald-500" /> Pricing
          </h2>

          {/* Price & Deposit Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Price (for {request.totalDays} days) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={totalPrice}
                  data-error={!!errors.totalPrice}
                  onChange={(e) => {
                    setTotalPrice(e.target.value);
                    if (errors.totalPrice) setErrors(prev => ({ ...prev, totalPrice: '' }));
                  }}
                  placeholder={`${(request.totalDays || 1) * 800}`}
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.totalPrice ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
              </div>
              {errors.totalPrice ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.totalPrice}</p> : <p className="text-xs text-gray-500 mt-1">Enter your total quote price for the entire rental period</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={noSecurityDeposit ? '' : securityDeposit}
                  data-error={!!errors.securityDeposit}
                  onChange={(e) => {
                    setSecurityDeposit(e.target.value);
                    if (errors.securityDeposit) setErrors(prev => ({ ...prev, securityDeposit: '' }));
                  }}
                  placeholder="2000"
                  disabled={noSecurityDeposit}
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${noSecurityDeposit ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : errors.securityDeposit ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noSecurityDeposit}
                  onChange={(e) => {
                    setNoSecurityDeposit(e.target.checked);
                    if (e.target.checked) { setSecurityDeposit('0'); setErrors(prev => ({ ...prev, securityDeposit: '' })); }
                  }}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-gray-600">No security deposit required</span>
              </label>
              {errors.securityDeposit && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.securityDeposit}</p>}
            </div>
          </div>

          {/* KM & Extra Charge Row */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM Limit Per Day
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={kmLimitPerDay === 'unlimited' ? '' : kmLimitPerDay}
                  onChange={(e) => setKmLimitPerDay(e.target.value)}
                  placeholder="e.g., 150"
                  disabled={kmLimitPerDay === 'unlimited'}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setKmLimitPerDay(kmLimitPerDay === 'unlimited' ? '' : 'unlimited')}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                    kmLimitPerDay === 'unlimited'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Unlimited
                </button>
              </div>
            </div>
            {kmLimitPerDay !== 'unlimited' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra KM Charge (if limit set)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={extraKmCharge}
                  onChange={(e) => setExtraKmCharge(e.target.value)}
                  placeholder="5"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            )}
          </div>

          {/* Advance & Validity Row */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Payment
              </label>
              <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
                <button type="button" onClick={() => setAdvanceMode('percent')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${advanceMode === 'percent' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
                  By Percentage
                </button>
                <button type="button" onClick={() => setAdvanceMode('manual')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${advanceMode === 'manual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
                  Custom Amount
                </button>
              </div>
              {advanceMode === 'percent' ? (
                <div className="flex items-center gap-3">
                  <select
                    value={advancePercent}
                    onChange={(e) => setAdvancePercent(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="20">20%</option>
                    <option value="25">25%</option>
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                  </select>
                  <span className="text-gray-600">
                    = ₹{calculateAdvance().toLocaleString()} advance
                  </span>
                </div>
              ) : (
                <div className="relative" data-error={!!errors.customAdvanceAmount}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={customAdvanceAmount}
                    onChange={(e) => setCustomAdvanceAmount(e.target.value)}
                    placeholder="Enter advance amount"
                    min="0"
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.customAdvanceAmount ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                  />
                </div>
              )}
              {errors.customAdvanceAmount && <p className="text-xs text-red-600 mt-1 font-medium">{errors.customAdvanceAmount}</p>}
              {!errors.customAdvanceAmount && advanceExceedsTotal && (
                <p className="text-xs text-red-600 mt-1 font-medium">Advance amount cannot exceed total price (₹{(parseFloat(totalPrice) || 0).toLocaleString()})</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Valid Till
              </label>
              <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
                <button type="button"
                  onClick={() => setValidityMode('days')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${validityMode === 'days' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Quick (Days)
                </button>
                <button type="button"
                  onClick={() => setValidityMode('custom')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${validityMode === 'custom' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Custom Date & Time
                </button>
              </div>
              {validityMode === 'days' ? (
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input type="date" value={customValidDate} onChange={(e) => setCustomValidDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    required={validityMode === 'custom'} />
                  <input type="time" value={customValidTime} onChange={(e) => setCustomValidTime(e.target.value)}
                    className="w-[120px] px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {validityMode === 'days'
                  ? (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + parseInt(validityDays || '3'));
                      d.setHours(23, 59, 59, 999);
                      return `Expires: ${d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at 11:59 PM`;
                    })()
                  : customValidDate
                    ? `Quote valid till ${new Date(`${customValidDate}T${customValidTime || '23:59'}:00`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                    : 'Select expiry date and time'}
              </p>
            </div>
          </div>

        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Notes for Customer <span className="text-gray-400 font-normal">(optional)</span></h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special notes..." rows={3} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 hover:border-gray-300 transition-all resize-none" />
        </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">
        {/* Quote Summary (sticky) */}
        <div className="lg:sticky lg:top-[73px] z-10">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3"><h3 className="text-sm font-bold text-white flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Quote Summary</h3></div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Rental ({request.totalDays}d)</span><span className="font-medium">₹{(parseFloat(totalPrice) || 0).toLocaleString()}</span></div>
              {parseFloat(securityDeposit) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Security Deposit</span><span className="font-medium">₹{(parseFloat(securityDeposit) || 0).toLocaleString()}</span></div>}
              <div className="border-t border-emerald-100 pt-3"><div className="flex justify-between"><span className="text-sm font-bold text-gray-900">Total</span><span className="text-xl font-extrabold text-emerald-600">₹{((parseFloat(totalPrice) || 0) + (parseFloat(securityDeposit) || 0)).toLocaleString()}</span></div></div>
              <div className="border-t border-emerald-100 pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-emerald-600 font-medium">Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : ''}</span><span className="font-bold text-emerald-600">₹{calculateAdvance().toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-gray-400"><span>Remaining</span><span>₹{((parseFloat(totalPrice) || 0) - calculateAdvance() + (parseFloat(securityDeposit) || 0)).toLocaleString()}</span></div>
              </div>
              {kmLimitPerDay && <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">KM: {kmLimitPerDay === 'unlimited' ? 'Unlimited' : `${kmLimitPerDay}/day`}{kmLimitPerDay !== 'unlimited' && extraKmCharge && ` • Extra: ₹${extraKmCharge}/km`}</div>}
            </div>
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-emerald-400" /><CheckCircle className="w-4 h-4 text-emerald-500" /> Inclusions <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">{inclusions.length}</span></h2>
            <button
              type="button"
              onClick={() => setEditMode(editMode === 'inclusions' ? null : 'inclusions')}
              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'inclusions' ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {inclusions.map((item, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {item}
                {editMode === 'inclusions' && (
                  <button
                    type="button"
                    onClick={() => removeItem(inclusions, setInclusions, item)}
                    className="hover:text-green-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {editMode === 'inclusions' && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(inclusions, setInclusions))}
                placeholder="Add inclusion..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => addItem(inclusions, setInclusions)}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-red-400" /><XCircle className="w-4 h-4 text-red-500" /> Exclusions <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">{exclusions.length}</span></h2>
            <button
              type="button"
              onClick={() => setEditMode(editMode === 'exclusions' ? null : 'exclusions')}
              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'exclusions' ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {exclusions.map((item, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {item}
                {editMode === 'exclusions' && (
                  <button
                    type="button"
                    onClick={() => removeItem(exclusions, setExclusions, item)}
                    className="hover:text-red-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {editMode === 'exclusions' && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(exclusions, setExclusions))}
                placeholder="Add exclusion..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => addItem(exclusions, setExclusions)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-gray-400" /> Terms & Conditions <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{termsConditions.length}</span></h2>
            <button
              type="button"
              onClick={() => setEditMode(editMode === 'terms' ? null : 'terms')}
              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'terms' ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="space-y-2">
            {termsConditions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-emerald-500 font-bold">{idx + 1}.</span>
                <span className="flex-1 text-sm text-gray-700">{item}</span>
                {editMode === 'terms' && (
                  <button
                    type="button"
                    onClick={() => removeItem(termsConditions, setTermsConditions, item)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {editMode === 'terms' && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(termsConditions, setTermsConditions))}
                placeholder="Add term..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => addItem(termsConditions, setTermsConditions)}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        </div>{/* end right column */}
        </div>{/* end 2-col grid */}
      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 -mx-4 md:-mx-6 flex gap-3 z-20">
        <Link href="/vendor/bike-rentals/requests" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">Cancel</Link>
        <button type="submit" disabled={isSubmitting || !totalPrice || !vehicleName || advanceExceedsTotal} onClick={handleSubmit} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {isSubmitting ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Sending...</> : <><Send className="w-4 h-4" /> Send Quote (₹{(parseFloat(totalPrice) || 0).toLocaleString()})</>}
        </button>
      </div>
    </div>
  );
}
