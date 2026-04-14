'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bus,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  X,
  FileSpreadsheet,
  IndianRupee,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { BUS_CATEGORIES, BUS_TRIP_TYPES, DEFAULT_INCLUSIONS, DEFAULT_EXCLUSIONS, DEFAULT_TERMS } from '@/lib/bus-categories';

interface QuoteRequest {
  id: string;
  inquiryNumber: string;
  tripType: string;
  chauffeur_vehicle_categories: string;
  passengerCount: number;
  pickupCity: string;
  dropCity?: string;
  pickupDate: string;
  returnDate?: string;
  pickupTime: string;
  pickupAddress?: string;
  customerName: string;
  customerPhone: string;
  specialRequirements?: string;
}

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  vehicle_models: {
    id: string;
    name: string;
    brands: {
      id: string;
      name: string;
    } | null;
  } | null;
  chauffeur_vehicle_categories: {
    id: string;
    name: string;
  } | null;
  brands: {
    id: string;
    name: string;
  } | null;
  services: {
    id: string;
    name: string;
    slug: string;
  } | null;
  isAvailableForDates?: boolean;
}

interface Template {
  id: string;
  name: string;
  category: string;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  baseRateHint?: number;
}

const SAMPLE_REQUEST: QuoteRequest = {
  id: '1',
  inquiryNumber: 'BUS-INQ-2024-0001',
  tripType: 'pilgrimage',
  chauffeur_vehicle_categories: 'tempo-traveller-17',
  passengerCount: 15,
  pickupCity: 'Delhi',
  dropCity: 'Haridwar',
  pickupDate: new Date(Date.now() + 5 * 86400000).toISOString(),
  returnDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  pickupTime: '05:00',
  pickupAddress: 'Karol Bagh Metro Station',
  customerName: 'Sharma Family',
  customerPhone: '9737965551',
  specialRequirements: 'Need pushback seats, early morning pickup',
};

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Standard Outstation Trip',
    category: 'outstation',
    inclusions: DEFAULT_INCLUSIONS.slice(0, 7),
    exclusions: DEFAULT_EXCLUSIONS.slice(0, 5),
    termsConditions: DEFAULT_TERMS.slice(0, 5),
    baseRateHint: 15000,
  },
  {
    id: '2',
    name: 'Pilgrimage Tour',
    category: 'pilgrimage',
    inclusions: [
      'AC Vehicle as per booking',
      'Experienced pilgrim route driver',
      'All fuel charges',
      'Driver allowance & food',
      'Toll & permits',
      'Parking at all temples',
    ],
    exclusions: [
      'Darshan tickets/VIP entry',
      'Pooja items',
      'Prasad expenses',
      'Guide/Pandit charges',
      'Accommodation',
    ],
    termsConditions: [
      '50% advance required',
      'Balance before departure',
      'Itinerary fixed at booking',
      '300 km per day included',
    ],
    baseRateHint: 12000,
  },
];

export default function SendQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Quote form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [driverAllowance, setDriverAllowance] = useState('');
  const [tollCharges, setTollCharges] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [additionalChargesLabel, setAdditionalChargesLabel] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30'); // Default 30% advance
  const [advanceMode, setAdvanceMode] = useState<'percent' | 'manual'>('percent');
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quickQuoteMode, setQuickQuoteMode] = useState(false);
  const [quickTotalPrice, setQuickTotalPrice] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [validUntilTime, setValidUntilTime] = useState('23:59');
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);

  // Refs for scroll-to-error
  const vehicleNameRef = useRef<HTMLInputElement>(null);
  const vehicleNumberRef = useRef<HTMLInputElement>(null);
  const baseRateRef = useRef<HTMLInputElement>(null);
  const driverAllowanceRef = useRef<HTMLInputElement>(null);
  const quickTotalPriceRef = useRef<HTMLInputElement>(null);
  const validUntilRef = useRef<HTMLInputElement>(null);

  // Input states
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchRequestDetails();
  }, [params.id]);

  const fetchRequestDetails = async () => {
    try {
      // Fetch the quote request details
      const response = await fetch(`/api/vendor/bus-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest({
          id: data.request.id,
          inquiryNumber: data.request.requestNumber,
          tripType: data.request.tripType,
          chauffeur_vehicle_categories: data.request.vehicle_category,
          passengerCount: data.request.passengers,
          pickupCity: data.request.pickupCity,
          dropCity: data.request.dropCity,
          pickupDate: data.request.pickupDate,
          returnDate: data.request.returnDate,
          pickupTime: data.request.pickupTime,
          pickupAddress: data.request.pickupAddress,
          customerName: data.request.customerName,
          customerPhone: data.request.customerPhone,
          specialRequirements: data.request.requirements,
        });
      } else {
        // Fallback to sample if API fails
        setRequest(SAMPLE_REQUEST);
      }

      // Fetch templates
      const templateRes = await fetch('/api/vendor/bus-templates');
      const templateData = await templateRes.json();
      if (templateData.success && templateData.templates) {
        setTemplates(templateData.templates);
      } else {
        setTemplates(SAMPLE_TEMPLATES);
      }

      // Fetch vendor's fleet for bus service (with availability check)
      try {
        let fleetUrl = '/api/vendor/fleet';
        if (data.request?.pickupDate) {
          const startDate = new Date(data.request.pickupDate).toISOString();
          const endDate = data.request.returnDate
            ? new Date(data.request.returnDate).toISOString()
            : startDate;
          fleetUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        }
        const fleetRes = await fetch(fleetUrl);
        const fleetData = await fleetRes.json();
        if (fleetData.success && fleetData.fleet) {
          // Filter for bus rental vehicles only
          const busFleet = fleetData.fleet.filter((v: FleetVehicle) => {
            if (!v.isActive) return false;
            const slug = v.services?.slug?.toLowerCase() || '';
            const name = v.services?.name?.toLowerCase() || '';
            return slug.includes('bus') || name.includes('bus');
          });
          // Sort: available vehicles first, unavailable at the end
          busFleet.sort((a: FleetVehicle, b: FleetVehicle) => {
            const aUnavail = a.isAvailableForDates === false ? 1 : 0;
            const bUnavail = b.isAvailableForDates === false ? 1 : 0;
            return aUnavail - bUnavail;
          });
          setFleetVehicles(busFleet);
        }
      } catch (fleetError) {
        console.error('Failed to fetch fleet:', fleetError);
      }

      // Set default validity (3 days from now)
      const defaultValidity = new Date(Date.now() + 3 * 86400000);
      setValidUntil(defaultValidity.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      setRequest(SAMPLE_REQUEST);
      setTemplates(SAMPLE_TEMPLATES);

      const defaultValidity = new Date(Date.now() + 3 * 86400000);
      setValidUntil(defaultValidity.toISOString().split('T')[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setInclusions([...template.inclusions]);
    setExclusions([...template.exclusions]);
    setTermsConditions([...template.termsConditions]);
    if (template.baseRateHint) {
      setBaseRate(template.baseRateHint.toString());
    }
  };

  const clearTemplate = () => {
    setSelectedTemplateId(null);
    setInclusions([]);
    setExclusions([]);
    setTermsConditions([]);
    setBaseRate('');
  };

  // Handle fleet vehicle selection
  const handleFleetSelection = (fleetId: string) => {
    setSelectedFleetId(fleetId);

    if (fleetId === '') {
      // Clear vehicle details if "Select from fleet" is chosen
      setVehicleName('');
      setVehicleNumber('');
      return;
    }

    const selectedVehicle = fleetVehicles.find(v => v.id === fleetId);
    if (selectedVehicle) {
      // Build vehicle name from model/brand/category
      let vName = '';
      if (selectedVehicle.vehicle_models) {
        vName = selectedVehicle.vehicle_models.brands?.name
          ? `${selectedVehicle.vehicle_models.brands.name} ${selectedVehicle.vehicle_models.name}`
          : selectedVehicle.vehicle_models.name;
      } else if (selectedVehicle.brands && selectedVehicle.chauffeur_vehicle_categories) {
        vName = `${selectedVehicle.brands.name} ${selectedVehicle.chauffeur_vehicle_categories.name}`;
      } else if (selectedVehicle.chauffeur_vehicle_categories) {
        vName = selectedVehicle.chauffeur_vehicle_categories.name;
      }

      setVehicleName(vName);
      setVehicleNumber(selectedVehicle.registrationNumber || '');
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

  const calculateTotal = () => {
    if (quickQuoteMode) return parseFloat(quickTotalPrice) || 0;
    const base = parseFloat(baseRate) || 0;
    const driver = parseFloat(driverAllowance) || 0;
    const toll = parseFloat(tollCharges) || 0;
    const additional = parseFloat(additionalCharges) || 0;
    return base + driver + toll + additional;
  };

  const calculateAdvance = () => {
    if (advanceMode === 'manual' && customAdvanceAmount) {
      return parseFloat(customAdvanceAmount) || 0;
    }
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const advanceExceedsTotal = calculateAdvance() > calculateTotal() && calculateTotal() > 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!vehicleName.trim()) newErrors.vehicleName = 'Vehicle name/model is required';
    if (!vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle number is required';
    if (quickQuoteMode) {
      if (!quickTotalPrice || parseFloat(quickTotalPrice) <= 0) newErrors.quickTotalPrice = 'Total price must be greater than 0';
    } else {
      if (!baseRate || parseFloat(baseRate) <= 0) newErrors.baseRate = 'Base rate is required and must be greater than 0';
      if (driverAllowance === '') newErrors.driverAllowance = 'Driver allowance is required (enter 0 if not applicable)';
    }
    if (!validUntil) newErrors.validUntil = 'Quote validity date is required';
    if (advanceMode === 'manual' && customAdvanceAmount) {
      const adv = parseFloat(customAdvanceAmount) || 0;
      const total = calculateTotal();
      if (total > 0 && adv > total) newErrors.customAdvanceAmount = 'Advance amount cannot exceed total price';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error using refs (reliable, no DOM querying race condition)
      const firstRef =
        newErrors.vehicleName ? vehicleNameRef :
        newErrors.vehicleNumber ? vehicleNumberRef :
        newErrors.quickTotalPrice ? quickTotalPriceRef :
        newErrors.baseRate ? baseRateRef :
        newErrors.driverAllowance ? driverAllowanceRef :
        newErrors.validUntil ? validUntilRef :
        null;
      if (firstRef?.current) {
        firstRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstRef.current.focus();
      }
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
      const response = await fetch('/api/vendor/bus-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request?.id || params.id,
          templateId: selectedTemplateId,
          fleetId: selectedFleetId || null, // Send fleet vehicle ID if selected
          chauffeur_vehicle_categories: request?.vehicle_category,
          vehicleName: vehicleName || request?.vehicle_category,
          vehicleNumber: vehicleNumber || null,
          seats: request?.passengerCount || 17,
          baseAmount: quickQuoteMode ? (parseFloat(quickTotalPrice) || 0) : (parseFloat(baseRate) || 0),
          driverAllowance: quickQuoteMode ? 0 : (parseFloat(driverAllowance) || 0),
          tollEstimate: quickQuoteMode ? 0 : (parseFloat(tollCharges) || 0),
          parkingEstimate: quickQuoteMode ? 0 : (parseFloat(additionalCharges) || 0),
          advanceAmount: calculateAdvance(),
          advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 30) : 0,
          customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
          inclusions,
          exclusions,
          termsConditions,
          vendorMessage: notes,
          validityDays: Math.ceil((new Date(`${validUntil}T${validUntilTime || '23:59'}:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          validUntil: new Date(`${validUntil}T${validUntilTime || '23:59'}:00`).toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setApiSuccess('Quote sent successfully! Redirecting...');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => router.push('/vendor/bus/quotes'), 2000);
      } else {
        if (data.error === 'Vehicle details and pricing are required') {
          const fieldErrors: Record<string, string> = {};
          if (!vehicleName.trim()) fieldErrors.vehicleName = 'Vehicle name/model is required';
          if (quickQuoteMode ? !quickTotalPrice : !baseRate) {
            if (quickQuoteMode) fieldErrors.quickTotalPrice = 'Total price is required';
            else fieldErrors.baseRate = 'Base rate is required';
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            setTimeout(() => {
              const firstError = document.querySelector('[data-error="true"]');
              if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
            return;
          }
        }
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

  const getCategoryName = (id: string) => BUS_CATEGORIES.find((c) => c.id === id)?.shortName || id;
  const getTripTypeName = (id: string) => BUS_TRIP_TYPES.find((t) => t.id === id)?.name || id;

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 hover:border-gray-300 transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5';

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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute left-1/3 -top-6 w-24 h-24 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center gap-3.5">
          <Link href="/vendor/bus/requests" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-95 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Send Quote</h1>
            <p className="text-emerald-100 text-xs md:text-sm mt-0.5">#{request.inquiryNumber}</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Bus className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Vehicle</span></div>
            <p className="text-sm font-bold text-white truncate">{getCategoryName(request.vehicle_category)}</p>
            <p className="text-[10px] text-white/60">{getTripTypeName(request.tripType)} • {request.passengerCount} pax</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><MapPin className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Route</span></div>
            <p className="text-sm font-bold text-white truncate">{request.pickupCity}{request.dropCity ? ` → ${request.dropCity}` : ''}</p>
            {request.pickupAddress && <p className="text-[10px] text-white/60 truncate">{request.pickupAddress}</p>}
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Calendar className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Dates</span></div>
            <p className="text-sm font-bold text-white">{new Date(request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{request.returnDate ? ` → ${new Date(request.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
            <p className="text-[10px] text-white/60">Pickup: {request.pickupTime}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-white/70 mb-1"><Users className="w-3 h-3" /><span className="text-[10px] font-bold uppercase tracking-wider">Passengers</span></div>
            <p className="text-2xl font-extrabold text-white">{request.passengerCount}</p>
          </div>
        </div>
      </div>

      {request.specialRequirements && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div><p className="text-xs font-bold text-amber-700">Special Requirements</p><p className="text-sm text-amber-800 mt-0.5">{request.specialRequirements}</p></div>
        </div>
      )}

      {/* Template Selection */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-emerald-400" /><FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Select Template</h2>
          {selectedTemplateId && <button type="button" onClick={clearTemplate} className="text-xs text-red-500 hover:underline">Clear</button>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`p-3 rounded-xl border-2 text-left transition-all ${selectedTemplateId === template.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-300'}`}>
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-xs font-bold text-gray-900 truncate">{template.name}</h3>
                {selectedTemplateId === template.id && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
              <p className="text-[10px] text-gray-400">{template.inclusions.length} incl • {template.exclusions.length} excl</p>
              {template.baseRateHint && <p className="text-[10px] text-emerald-600 font-bold mt-1">₹{template.baseRateHint.toLocaleString()}</p>}
            </button>
          ))}
          <Link href="/vendor/bus/templates/create" className="p-3 rounded-xl border-2 border-dashed border-gray-200 text-center hover:border-emerald-300 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-1">
            <Plus className="w-5 h-5 text-gray-400" /><span className="text-[10px] text-gray-400">New Template</span>
          </Link>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-5">
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
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-emerald-400" /><Bus className="w-4 h-4 text-emerald-500" /> Vehicle Details</h2>
              {fleetVehicles.length > 0 && (
                <div className="mb-3">
                  <label className={labelCls}>Select from your fleet</label>
                  <select value={selectedFleetId} onChange={(e) => handleFleetSelection(e.target.value)} className={inputCls}>
                    <option value="">-- Select vehicle or enter manually --</option>
                    {fleetVehicles.map((vehicle) => {
                      let displayName = '';
                      if (vehicle.vehicle_models) { displayName = vehicle.vehicle_models.brands?.name ? `${vehicle.vehicle_models.brands.name} ${vehicle.vehicle_models.name}` : vehicle.vehicle_models.name; }
                      else if (vehicle.brands && vehicle.chauffeur_vehicle_categories) { displayName = `${vehicle.brands.name} ${vehicle.chauffeur_vehicle_categories.name}`; }
                      else if (vehicle.chauffeur_vehicle_categories) { displayName = vehicle.chauffeur_vehicle_categories.name; }
                      const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';
                      const isUnavailable = vehicle.isAvailableForDates === false;
                      return <option key={vehicle.id} value={vehicle.id} disabled={isUnavailable}>{displayName}{regNum}{isUnavailable ? ' — Booked' : ''}</option>;
                    })}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Vehicle Name/Model</label>
                  <input ref={vehicleNameRef} type="text" value={vehicleName} data-error={!!errors.vehicleName} onChange={(e) => { setVehicleName(e.target.value); setSelectedFleetId(''); if (errors.vehicleName) setErrors(prev => ({ ...prev, vehicleName: '' })); }} placeholder="e.g., Force Traveller" className={`${inputCls} ${errors.vehicleName ? 'border-red-400 bg-red-50' : ''}`} />
                  {errors.vehicleName && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.vehicleName}</p>}
                </div>
                <div>
                  <label className={labelCls}>Vehicle Number</label>
                  <input ref={vehicleNumberRef} type="text" value={vehicleNumber} data-error={!!errors.vehicleNumber} onChange={(e) => { setVehicleNumber(e.target.value.toUpperCase()); setSelectedFleetId(''); if (errors.vehicleNumber) setErrors(prev => ({ ...prev, vehicleNumber: '' })); }} placeholder="DL 01 AB 1234" className={`${inputCls} ${errors.vehicleNumber ? 'border-red-400 bg-red-50' : ''}`} />
                  {errors.vehicleNumber && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.vehicleNumber}</p>}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-emerald-400" /><IndianRupee className="w-4 h-4 text-emerald-500" /> Pricing</h2>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button type="button" onClick={() => setQuickQuoteMode(false)} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition ${!quickQuoteMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Itemized</button>
                  <button type="button" onClick={() => setQuickQuoteMode(true)} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition ${quickQuoteMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Quick Quote</button>
                </div>
              </div>
              {quickQuoteMode ? (
                <div>
                  <label className={labelCls}>Total Quote Price *</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">₹</span>
                    <input ref={quickTotalPriceRef} type="number" value={quickTotalPrice} data-error={!!errors.quickTotalPrice} onChange={(e) => { setQuickTotalPrice(e.target.value); if (errors.quickTotalPrice) setErrors(prev => ({ ...prev, quickTotalPrice: '' })); }} placeholder="All-inclusive total" className={`${inputCls} pl-7 text-lg font-semibold ${errors.quickTotalPrice ? 'border-red-400 bg-red-50' : ''}`} />
                  </div>
                  {errors.quickTotalPrice && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.quickTotalPrice}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Base Rate *</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">₹</span><input ref={baseRateRef} type="number" value={baseRate} data-error={!!errors.baseRate} onChange={(e) => { setBaseRate(e.target.value); if (errors.baseRate) setErrors(prev => ({ ...prev, baseRate: '' })); }} placeholder="15000" className={`${inputCls} pl-7 ${errors.baseRate ? 'border-red-400 bg-red-50' : ''}`} /></div>{errors.baseRate && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.baseRate}</p>}</div>
                  <div><label className={labelCls}>Driver Allowance</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">₹</span><input ref={driverAllowanceRef} type="number" value={driverAllowance} data-error={!!errors.driverAllowance} onChange={(e) => { setDriverAllowance(e.target.value); if (errors.driverAllowance) setErrors(prev => ({ ...prev, driverAllowance: '' })); }} placeholder="0" className={`${inputCls} pl-7 ${errors.driverAllowance ? 'border-red-400 bg-red-50' : ''}`} /></div>{errors.driverAllowance && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.driverAllowance}</p>}</div>
                  <div><label className={labelCls}>Toll Charges</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">₹</span><input type="number" value={tollCharges} onChange={(e) => setTollCharges(e.target.value)} placeholder="0" className={`${inputCls} pl-7`} /></div></div>
                  <div><label className={labelCls}>Additional Charges</label><div className="flex gap-2"><input type="text" value={additionalChargesLabel} onChange={(e) => setAdditionalChargesLabel(e.target.value)} placeholder="Label" className={`w-1/2 ${inputCls}`} /><div className="relative w-1/2"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">₹</span><input type="number" value={additionalCharges} onChange={(e) => setAdditionalCharges(e.target.value)} placeholder="0" className={`${inputCls} pl-7`} /></div></div></div>
                </div>
              )}
            </div>

            {/* Advance & Validity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1.5 h-4 rounded-full bg-emerald-400" /> Advance & Validity</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Advance Payment</label>
                  <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
                    <button type="button" onClick={() => setAdvanceMode('percent')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${advanceMode === 'percent' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Percentage</button>
                    <button type="button" onClick={() => setAdvanceMode('manual')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition ${advanceMode === 'manual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Custom</button>
                  </div>
                  {advanceMode === 'percent' ? (
                    <div className="flex items-center gap-2">
                      <select value={advancePercent} onChange={(e) => setAdvancePercent(e.target.value)} className={`w-20 ${inputCls}`}>
                        {['20','25','30','40','50','100'].map(v => <option key={v} value={v}>{v}%</option>)}
                      </select>
                      <span className="text-xs text-gray-500">= ₹{calculateAdvance().toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">₹</span><input type="number" value={customAdvanceAmount} onChange={(e) => { setCustomAdvanceAmount(e.target.value); if (errors.customAdvanceAmount) setErrors(prev => ({ ...prev, customAdvanceAmount: '' })); }} placeholder="Amount" className={`${inputCls} pl-7 ${errors.customAdvanceAmount ? 'border-red-400 bg-red-50' : ''}`} /></div>
                  )}
                  {errors.customAdvanceAmount && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.customAdvanceAmount}</p>}
                  {!errors.customAdvanceAmount && advanceExceedsTotal && <p className="text-[10px] text-red-500 mt-1 font-medium">Exceeds total</p>}
                </div>
                <div>
                  <label className={labelCls}>Quote Valid Until *</label>
                  <input ref={validUntilRef} type="date" value={validUntil} data-error={!!errors.validUntil} onChange={(e) => { setValidUntil(e.target.value); if (errors.validUntil) setErrors(prev => ({ ...prev, validUntil: '' })); }} min={new Date().toISOString().split('T')[0]} className={`${inputCls} ${errors.validUntil ? 'border-red-400 bg-red-50' : ''}`} />
                  <input type="time" value={validUntilTime} onChange={(e) => setValidUntilTime(e.target.value)} className={`${inputCls} mt-2`} />
                  {errors.validUntil && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.validUntil}</p>}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Notes for Customer <span className="text-gray-400 font-normal">(optional)</span></h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special notes..." rows={3} className={`${inputCls} resize-none`} />
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
                  {!quickQuoteMode ? (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Base Rate</span><span className="font-medium">₹{(parseFloat(baseRate) || 0).toLocaleString()}</span></div>
                      {parseFloat(driverAllowance) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Driver Allowance</span><span className="font-medium">₹{parseFloat(driverAllowance).toLocaleString()}</span></div>}
                      {parseFloat(tollCharges) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Toll Charges</span><span className="font-medium">₹{parseFloat(tollCharges).toLocaleString()}</span></div>}
                      {parseFloat(additionalCharges) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">{additionalChargesLabel || 'Additional'}</span><span className="font-medium">₹{parseFloat(additionalCharges).toLocaleString()}</span></div>}
                    </>
                  ) : (
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Total Price</span><span className="font-medium">₹{(parseFloat(quickTotalPrice) || 0).toLocaleString()}</span></div>
                  )}
                  <div className="border-t border-emerald-100 pt-3">
                    <div className="flex justify-between"><span className="text-sm font-bold text-gray-900">Total</span><span className="text-xl font-extrabold text-emerald-600">₹{calculateTotal().toLocaleString()}</span></div>
                  </div>
                  <div className="border-t border-emerald-100 pt-3 space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-emerald-600 font-medium">Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : ''}</span><span className="font-bold text-emerald-600">₹{calculateAdvance().toLocaleString()}</span></div>
                    <div className="flex justify-between text-xs text-gray-400"><span>Balance</span><span>₹{(calculateTotal() - calculateAdvance()).toLocaleString()}</span></div>
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
                {inclusions.length === 0 && <span className="text-xs text-gray-400">No inclusions added</span>}
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
                {exclusions.length === 0 && <span className="text-xs text-gray-400">No exclusions added</span>}
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
                {termsConditions.length === 0 && <span className="text-xs text-gray-400">No terms added</span>}
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
        <Link href="/vendor/bus/requests" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">Cancel</Link>
        <button type="submit" disabled={isSubmitting || calculateTotal() === 0 || advanceExceedsTotal} onClick={handleSubmit} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {isSubmitting ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Sending...</> : <><Send className="w-4 h-4" /> Send Quote (₹{calculateTotal().toLocaleString()})</>}
        </button>
      </div>
    </div>
  );
}
