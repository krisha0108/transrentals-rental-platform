// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
  ArrowLeft,
  Car,
  Send,
  Plus,
  X,
  CheckCircle,
  Sparkles,
  Check,
  Info,
  FileText,
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  tripType: string;
  occasion: string | null;
  chauffeur_vehicle_categories: string;
  vehicleCategoryName: string | null;
  specificModel: string | null;
  passengers: number;
  customerName: string;
  pickupCity: string;
  dropCity: string | null;
  pickupDate: string;
  pickupTime: string;
  returnDate: string | null;
  tripDays: number;
  tripHours: number | null;
  needDecoration: boolean;
  decorationType: string | null;
  needChauffeur: boolean;
  requirements: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
}

interface Fleet {
  id: string;
  registrationNumber: string;
  yearOfManufacture: number | null;
  color: string | null;
  services?: {
    slug?: string;
    name?: string;
  };
  vehicle_models?: {
    name: string;
    brands: { name: string };
    sideImage?: string;
  };
  chauffeur_vehicle_categories?: {
    name: string;
    image?: string;
  };
  isAvailableForDates?: boolean;
}

interface Template {
  id: string;
  name: string;
  category: string;
  baseAmount: number;
  chauffeurCharges: number;
  decorationCharges: number;
  extraKmRate: number | null;
  extraHourRate: number | null;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
}


const DEFAULT_INCLUSIONS = [
  'Professional Chauffeur',
  'Fuel Charges',
  'Vehicle Insurance',
  'Air Conditioning',
  'Bottled Water',
];

const DEFAULT_EXCLUSIONS = [
  'Toll Charges',
  'Parking Charges',
  'Night Halt Charges',
  'Extra Hours',
];

const DEFAULT_TERMS = [
  'Advance payment is non-refundable',
  'Cancellation charges apply as per policy',
  'Driver allowance for outstation trips',
  'Vehicle will be provided as per availability',
];

export default function SendQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedFleet, setSelectedFleet] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number | ''>('');
  const [baseAmount, setBaseAmount] = useState<number | ''>('');
  const [chauffeurCharges, setChauffeurCharges] = useState<number | ''>(0);
  const [decorationCharges, setDecorationCharges] = useState<number | ''>(0);
  const [extraKmRate, setExtraKmRate] = useState<number | ''>(0);
  const [extraHourRate, setExtraHourRate] = useState<number | ''>(0);
  const [gstPercent, setGstPercent] = useState(5);
  const [advancePercent, setAdvancePercent] = useState(30);
  const [inclusions, setInclusions] = useState<string[]>(DEFAULT_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(DEFAULT_EXCLUSIONS);
  const [termsConditions, setTermsConditions] = useState<string[]>(DEFAULT_TERMS);
  const [vendorMessage, setVendorMessage] = useState('');
  const [validityDays, setValidityDays] = useState(3);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch quote request details
      const requestRes = await fetch(`/api/luxury-quote-requests/${params.id}`);
      const requestData = await requestRes.json();

      if (requestData.success) {
        setRequest(requestData.quoteRequest);
      } else {
        setError('Quote request not found');
        return;
      }

      // Fetch vendor's fleet (luxury vehicles) with availability check
      let fleetUrl = '/api/vendor/fleet';
      if (requestData.quoteRequest?.pickupDate) {
        const startDate = new Date(requestData.quoteRequest.pickupDate).toISOString();
        const endDate = requestData.quoteRequest.returnDate
          ? new Date(requestData.quoteRequest.returnDate).toISOString()
          : startDate;
        fleetUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const fleetRes = await fetch(fleetUrl);
      const fleetData = await fleetRes.json();
      if (fleetData.success) {
        // Filter for luxury service
        const luxuryFleets = (fleetData.fleet || []).filter((f: Fleet) =>
          f.isActive && (f.services?.slug?.includes('luxury') || f.services?.name?.toLowerCase().includes('luxury'))
        );
        // Sort: available vehicles first, unavailable at the end
        luxuryFleets.sort((a: Fleet, b: Fleet) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setFleets(luxuryFleets);
      }

      // Fetch vendor's templates
      const templateRes = await fetch('/api/vendor/luxury-templates');
      const templateData = await templateRes.json();
      if (templateData.success) {
        setTemplates(templateData.templates || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFleetSelect = (fleetId: string) => {
    const fleet = fleets.find(f => f.id === fleetId);
    if (fleet) {
      setSelectedFleet(fleetId);
      const brandName = fleet.vehicle_models?.brands?.name || '';
      const modelName = fleet.vehicle_models?.name || fleet.chauffeur_vehicle_categories?.name || '';
      setVehicleName(`${brandName} ${modelName}`.trim());
      setVehicleNumber(fleet.registrationNumber || '');
      setVehicleYear(fleet.yearOfManufacture || '');
    } else {
      setSelectedFleet('');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setBaseAmount(template.baseAmount);
      setChauffeurCharges(template.chauffeurCharges || 0);
      setDecorationCharges(template.decorationCharges || 0);
      setExtraKmRate(template.extraKmRate || 0);
      setExtraHourRate(template.extraHourRate || 0);
      if (template.inclusions?.length) setInclusions(template.inclusions);
      if (template.exclusions?.length) setExclusions(template.exclusions);
      if (template.termsConditions?.length) setTermsConditions(template.termsConditions);
    }
  };

  const calculateTotal = () => {
    const base = Number(baseAmount) || 0;
    const chauffeur = Number(chauffeurCharges) || 0;
    const decoration = Number(decorationCharges) || 0;
    const subtotal = base + chauffeur + decoration;
    const gst = Math.round(subtotal * gstPercent / 100);
    const total = subtotal + gst;
    const advance = Math.round(total * advancePercent / 100);
    return { subtotal, gst, total, advance };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleName || !baseAmount) {
      setError('Please select a vehicle and enter base amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { subtotal, gst, total, advance } = calculateTotal();

    try {
      const response = await fetch('/api/vendor/luxury-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: params.id,
          chauffeur_vehicle_categories: request?.vehicle_category,
          vehicleName,
          vehicleNumber,
          vehicleYear: vehicleYear || null,
          fleetId: selectedFleet || null,
          baseAmount: Number(baseAmount),
          chauffeurCharges: Number(chauffeurCharges) || 0,
          decorationCharges: Number(decorationCharges) || 0,
          extraKmRate: Number(extraKmRate) || 0,
          extraHourRate: Number(extraHourRate) || 0,
          gstAmount: gst,
          totalAmount: total,
          advanceAmount: advance,
          advancePercent,
          inclusions,
          exclusions,
          termsConditions,
          vendorMessage,
          validityDays,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/vendor/luxury/bookings');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit quote');
      }
    } catch (err) {
      setError('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInclusion = () => {
    if (newInclusion.trim() && !inclusions.includes(newInclusion.trim())) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion('');
    }
  };

  const addExclusion = () => {
    if (newExclusion.trim() && !exclusions.includes(newExclusion.trim())) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const addTerm = () => {
    if (newTerm.trim() && !termsConditions.includes(newTerm.trim())) {
      setTermsConditions([...termsConditions, newTerm.trim()]);
      setNewTerm('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quote Submitted!</h2>
          <p className="text-gray-500">Redirecting to bookings...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Request not found'}</p>
        <Link href="/vendor/luxury/bookings" className="text-purple-600 hover:underline mt-4 inline-block">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const { subtotal, gst, total, advance } = calculateTotal();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/luxury/bookings" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            Send Quote
          </h1>
          <p className="text-gray-500">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-purple-900">Customer Request</h2>
          <span className="ml-auto text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            {request.occasion || request.tripType}
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-purple-600 text-xs uppercase tracking-wide">Vehicle</p>
            <p className="font-semibold text-gray-900">{request.vehicleCategoryName || request.vehicle_category}</p>
            {request.specificModel && <p className="text-gray-500 text-xs">{request.specificModel}</p>}
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-purple-600 text-xs uppercase tracking-wide">Route</p>
            <p className="font-semibold text-gray-900">{request.pickupCity}{request.dropCity && ` → ${request.dropCity}`}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-purple-600 text-xs uppercase tracking-wide">Date & Time</p>
            <p className="font-semibold text-gray-900">
              {new Date(request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-gray-500 text-xs">at {request.pickupTime}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-purple-600 text-xs uppercase tracking-wide">Duration</p>
            <p className="font-semibold text-gray-900">
              {request.tripHours ? `${request.tripHours} hours` : `${request.tripDays} day(s)`}
            </p>
          </div>
        </div>
        {(request.budgetMax || request.requirements || request.needDecoration) && (
          <div className="mt-4 pt-4 border-t border-purple-200 grid md:grid-cols-3 gap-4 text-sm">
            {request.budgetMax && (
              <div>
                <span className="text-purple-700 font-medium">Budget: </span>
                <span className="font-bold">₹{request.budgetMin?.toLocaleString() || 0} - ₹{request.budgetMax.toLocaleString()}</span>
              </div>
            )}
            {request.needDecoration && (
              <div>
                <span className="text-purple-700 font-medium">Decoration: </span>
                <span className="font-bold">{request.decorationType || 'Required'}</span>
              </div>
            )}
            {request.requirements && (
              <div className="md:col-span-3">
                <span className="text-purple-700 font-medium">Requirements: </span>
                <span>{request.requirements}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Saved Templates */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Your Templates</h3>
              <span className="text-xs text-gray-500 ml-2">Click to auto-fill pricing</span>
            </div>
            <Link
              href="/vendor/luxury/templates/add"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Create Template
            </Link>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No templates created yet</p>
              <Link href="/vendor/luxury/templates/add" className="text-purple-600 hover:underline text-sm">
                + Create Your First Template
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {templates.map((template) => {
                const isSelected = selectedTemplate === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">{template.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                    <p className="text-sm font-bold text-purple-700 mt-2">₹{template.baseAmount.toLocaleString()}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Vehicle Selection from Fleet */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Select Vehicle from Fleet</h3>
          </div>

          {fleets.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No luxury vehicles in your fleet</p>
              <Link href="/vendor/fleet/add" className="text-purple-600 hover:underline text-sm">
                + Add Luxury Vehicle
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fleets.map((fleet) => {
                const isSelected = selectedFleet === fleet.id;
                const brandName = fleet.vehicle_models?.brands?.name || '';
                const modelName = fleet.vehicle_models?.name || fleet.chauffeur_vehicle_categories?.name || '';
                const image = fleet.vehicle_models?.sideImage || fleet.chauffeur_vehicle_categories?.image;
                const isUnavailable = fleet.isAvailableForDates === false;

                return (
                  <button
                    key={fleet.id}
                    type="button"
                    onClick={() => !isUnavailable && handleFleetSelect(fleet.id)}
                    disabled={isUnavailable}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isUnavailable
                        ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-full h-20 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {image ? (
                        <img src={image} alt={modelName} className="w-full h-full object-contain" />
                      ) : (
                        <Crown className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">{brandName} {modelName}</p>
                    <p className="text-xs text-gray-500">{fleet.registrationNumber}</p>
                    {fleet.yearOfManufacture && (
                      <p className="text-xs text-gray-400">{fleet.yearOfManufacture} • {fleet.color}</p>
                    )}
                    {isUnavailable && (
                      <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        Booked
                      </div>
                    )}
                    {isSelected && !isUnavailable && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Manual Entry */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Or enter vehicle details manually:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="e.g., Mercedes S-Class"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g., GJ01AB1234"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="e.g., 2023"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Set Your Pricing</h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Enter base amount"
                  className="w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chauffeur Charges</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={chauffeurCharges}
                  onChange={(e) => setChauffeurCharges(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            {request.needDecoration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decoration Charges</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={decorationCharges}
                    onChange={(e) => setDecorationCharges(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="0"
                    className="w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extra Km Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={extraKmRate}
                  onChange={(e) => setExtraKmRate(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-8 pr-12 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/km</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extra Hour Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={extraHourRate}
                  onChange={(e) => setExtraHourRate(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="0"
                  className="w-full pl-8 pr-12 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hr</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value={0}>No GST</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Advance %</label>
              <select
                value={advancePercent}
                onChange={(e) => setAdvancePercent(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value={20}>20%</option>
                <option value={25}>25%</option>
                <option value={30}>30%</option>
                <option value={40}>40%</option>
                <option value={50}>50%</option>
                <option value={100}>100% (Full Payment)</option>
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="text-lg font-bold text-gray-900">₹{subtotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">GST ({gstPercent}%)</p>
                <p className="text-lg font-bold text-gray-900">₹{gst.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-2">
                <p className="text-sm text-purple-700">Total Amount</p>
                <p className="text-xl font-bold text-purple-700">₹{total.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-2">
                <p className="text-sm text-green-700">Advance ({advancePercent}%)</p>
                <p className="text-xl font-bold text-green-700">₹{advance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Inclusions
              </h3>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {inclusions.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-green-700">✓ {item}</span>
                    <button type="button" onClick={() => setInclusions(inclusions.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  placeholder="Add inclusion"
                  className="flex-1 p-2 border rounded-lg text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
                />
                <button type="button" onClick={addInclusion} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <X className="w-4 h-4 text-red-600" />
                Exclusions
              </h3>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {exclusions.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-red-700">✗ {item}</span>
                    <button type="button" onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  placeholder="Add exclusion"
                  className="flex-1 p-2 border rounded-lg text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
                />
                <button type="button" onClick={addExclusion} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Terms & Conditions
          </h3>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {termsConditions.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-blue-700">{i + 1}. {item}</span>
                <button type="button" onClick={() => setTermsConditions(termsConditions.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Add term or condition"
              className="flex-1 p-2 border rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTerm())}
            />
            <button type="button" onClick={addTerm} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message & Validity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message to Customer (Optional)</label>
              <textarea
                value={vendorMessage}
                onChange={(e) => setVendorMessage(e.target.value)}
                placeholder="Any special notes for the customer..."
                rows={3}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Valid For</label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>1 Day</option>
                <option value={2}>2 Days</option>
                <option value={3}>3 Days</option>
                <option value={5}>5 Days</option>
                <option value={7}>7 Days</option>
              </select>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    After validity expires, your quote will be marked as expired and customer won't be able to accept it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 sticky bottom-4 bg-white p-4 rounded-xl shadow-lg border">
          <Link
            href="/vendor/luxury/bookings"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !vehicleName || !baseAmount}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Quote (₹{total.toLocaleString()})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
