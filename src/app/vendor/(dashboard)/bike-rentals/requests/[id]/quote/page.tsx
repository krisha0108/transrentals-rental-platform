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
    brand: { id: string; name: string } | null;
    brands?: { id: string; name: string } | null;
  } | null;
  chauffeur_vehicle_categories: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string } | null;
  brands?: { id: string; name: string } | null;
  service?: { id: string; name: string; slug: string } | null;
  services?: { id: string; name: string; slug: string } | null;
  serviceId?: string;
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

  // Quote form state
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleImages, setVehicleImages] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [helmetsIncluded, setHelmetsIncluded] = useState('1');
  const [kmLimitPerDay, setKmLimitPerDay] = useState('');
  const [extraKmCharge, setExtraKmCharge] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30');
  const [inclusions, setInclusions] = useState<string[]>(DEFAULT_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(DEFAULT_EXCLUSIONS);
  const [termsConditions, setTermsConditions] = useState<string[]>(DEFAULT_TERMS);
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('3');
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

      // Fetch vendor's fleet for bike service
      try {
        const fleetRes = await fetch('/api/vendor/fleet');
        const fleetData = await fleetRes.json();
        if (fleetData.success && fleetData.fleet) {
          // Filter for bike rental service - check both 'service' and 'services' (API returns 'services')
          const bikeFleet = fleetData.fleet.filter((v: FleetVehicle) => {
            const svc = v.services || v.service;
            const slug = svc?.slug?.toLowerCase() || '';
            const name = svc?.name?.toLowerCase() || '';
            return slug === 'bike-on-rent' || slug.includes('bike') || name.includes('bike');
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
        // Check both 'brand' and 'brands' (API returns 'brands')
        vBrand = selectedVehicle.vehicle_models.brands?.name || selectedVehicle.vehicle_models.brand?.name || '';
      } else if ((selectedVehicle as any).vehicle_category) {
        vName = (selectedVehicle as any).vehicle_category.name;
      }
      // Check both 'brand' and 'brands' at vehicle level
      if (selectedVehicle.brands) {
        vBrand = selectedVehicle.brands.name;
      } else if (selectedVehicle.brand) {
        vBrand = selectedVehicle.brand.name;
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
    const total = parseFloat(totalPrice) || 0;
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          kmLimitPerDay: kmLimitPerDay ? parseInt(kmLimitPerDay) : null,
          extraKmCharge: extraKmCharge ? parseFloat(extraKmCharge) : null,
          advancePercent: parseInt(advancePercent) || 30,
          inclusions,
          exclusions,
          termsConditions,
          vendorMessage: notes,
          validityDays: parseInt(validityDays) || 3,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Quote sent successfully!');
        router.push('/vendor/bike-rentals/quotes');
      } else {
        alert(data.error || 'Failed to send quote. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit quote:', error);
      alert('Failed to send quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/bike-rentals/requests"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-orange-500" />
            Send Quote
          </h1>
          <p className="text-gray-600">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
        <h3 className="font-semibold text-orange-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Bike className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {request.vehicle_modelsName || request.vehicleCategoryName || 'Any Bike'}
              </p>
              <p className="text-sm text-gray-600">
                {request.vehicleBrand && `${request.vehicleBrand} • `}
                {formatBookingDuration(request)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.locationName}</p>
              {request.helmetsRequired && (
                <p className="text-sm text-gray-600">{request.helmetsRequired} helmet(s) required</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {new Date(request.pickupDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                <span className="text-gray-600"> → </span>
                {new Date(request.dropDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
              {request.pickupTime && (
                <p className="text-sm text-gray-600">Pickup: {request.pickupTime}</p>
              )}
            </div>
          </div>
          {request.customerNotes && (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">{request.customerNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Selector */}
      {templates.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Quick Fill with Template</h3>
          </div>
          <p className="text-sm text-orange-700 mb-3">Load saved template to auto-fill inclusions, exclusions, terms & rates</p>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateSelection(e.target.value)}
            className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-500" />
            Vehicle Details
          </h2>

          {fleetVehicles.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select from your fleet
              </label>
              <select
                value={selectedFleetId}
                onChange={(e) => handleFleetSelection(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="">-- Select a bike from fleet (or enter manually) --</option>
                {fleetVehicles.map((vehicle) => {
                  let displayName = '';
                  if (vehicle.vehicle_models) {
                    // Check both 'brand' and 'brands' (API returns 'brands')
                    const brandName = vehicle.vehicle_models.brands?.name || vehicle.vehicle_models.brand?.name;
                    displayName = brandName
                      ? `${brandName} ${vehicle.vehicle_models.name}`
                      : vehicle.vehicle_models.name;
                  } else if ((vehicle as any).vehicle_category) {
                    displayName = (vehicle as any).vehicle_category.name;
                  }
                  const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';

                  return (
                    <option key={vehicle.id} value={vehicle.id}>
                      {displayName}{regNum}
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
                onChange={(e) => {
                  setVehicleName(e.target.value);
                  setSelectedFleetId('');
                }}
                placeholder="e.g., Royal Enfield Classic 350"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="1">1 Helmet</option>
                <option value="2">2 Helmets</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-orange-500" />
            Pricing
          </h2>

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
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder={`${(request.totalDays || 1) * 800}`}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your total quote price for the entire rental period
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="2000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM Limit Per Day (Optional)
              </label>
              <input
                type="number"
                value={kmLimitPerDay}
                onChange={(e) => setKmLimitPerDay(e.target.value)}
                placeholder="e.g., 150 (leave empty for unlimited)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
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
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Payment Required (20-50%)
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(e.target.value)}
                  className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Valid For (1-7 days)
              </label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="1">1 day</option>
                <option value="2">2 days</option>
                <option value="3">3 days</option>
                <option value="5">5 days</option>
                <option value="7">7 days</option>
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Price ({request.totalDays} days)</span>
              <span className="text-2xl font-bold text-orange-600">
                ₹{(parseFloat(totalPrice) || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 mt-2">
              <span className="font-semibold text-orange-800">Advance ({advancePercent}%)</span>
              <span className="font-semibold text-orange-600">
                ₹{calculateAdvance().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
              <span>Security Deposit (refundable)</span>
              <span>₹{(parseFloat(securityDeposit) || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Inclusions ({inclusions.length})
            </h2>
            <button
              type="button"
              onClick={() => setEditMode(editMode === 'inclusions' ? null : 'inclusions')}
              className="text-sm text-orange-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
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
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Exclusions ({exclusions.length})
            </h2>
            <button
              type="button"
              onClick={() => setEditMode(editMode === 'exclusions' ? null : 'exclusions')}
              className="text-sm text-orange-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
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
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Terms & Conditions ({termsConditions.length})</h2>
            <button
              type="button"
              onClick={() => setEditMode(editMode === 'terms' ? null : 'terms')}
              className="text-sm text-orange-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'terms' ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="space-y-2">
            {termsConditions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-orange-500 font-bold">{idx + 1}.</span>
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => addItem(termsConditions, setTermsConditions)}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Notes for Customer (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special notes or messages for the customer..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/bike-rentals/requests"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !totalPrice || !securityDeposit || !vehicleName}
            className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Quote (₹{(parseFloat(totalPrice) || 0).toLocaleString()})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
