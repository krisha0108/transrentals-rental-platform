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

  // Quote form state
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

  useEffect(() => {
    fetchRequestDetails();
  }, [params.id]);

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/self-drive-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest(data.request);
        // Pre-fill from request preferences
        if (data.request.transmission) setTransmission(data.request.transmission);
        if (data.request.fuelType) setFuelType(data.request.fuelType);
      }

      // Fetch vendor's fleet for self-drive service (with availability check for booking dates)
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
          const selfDriveFleet = fleetData.fleet.filter((v: FleetVehicle) => {
            if (!v.isActive) return false;
            const svc = v.services;
            const slug = svc?.slug?.toLowerCase() || '';
            const name = svc?.name?.toLowerCase() || '';
            return slug.includes('self-drive') || name.includes('self');
          });
          // Sort: available vehicles first, unavailable at the end
          selfDriveFleet.sort((a: FleetVehicle, b: FleetVehicle) => {
            const aUnavail = a.isAvailableForDates === false ? 1 : 0;
            const bUnavail = b.isAvailableForDates === false ? 1 : 0;
            return aUnavail - bUnavail;
          });
          setFleetVehicles(selfDriveFleet);
        }
      } catch (fleetError) {
        console.error('Failed to fetch fleet:', fleetError);
      }

      // Fetch vendor's templates
      try {
        const templatesRes = await fetch('/api/vendor/self-drive-templates?activeOnly=true');
        const templatesData = await templatesRes.json();
        if (templatesData.success && templatesData.templates) {
          setTemplates(templatesData.templates);
        }
      } catch (templatesError) {
        console.error('Failed to fetch templates:', templatesError);
      }

      // Check for expired quote to pre-fill (resubmit flow)
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
      if (selectedTemplate.kmLimitPerDayHint) setKmLimitPerDay(selectedTemplate.kmLimitPerDayHint.toString());
      if (selectedTemplate.extraKmRateHint) setExtraKmRate(selectedTemplate.extraKmRateHint.toString());
      if (selectedTemplate.securityDepositHint) setSecurityDeposit(selectedTemplate.securityDepositHint.toString());
    }
  };

  const handleFleetSelection = (fleetId: string) => {
    setSelectedFleetId(fleetId);

    if (fleetId === '') {
      setVehicleName('');
      setVehicleBrand('');
      setVehicleCategory('');
      setRegistrationNumber('');
      setTransmission('');
      setFuelType('');
      setSeats('');
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
      setVehicleCategory(selectedVehicle.chauffeur_vehicle_categories?.slug || '');
      setRegistrationNumber(selectedVehicle.registrationNumber || '');
      if (selectedVehicle.transmission) setTransmission(selectedVehicle.transmission);
      if (selectedVehicle.fuelType) setFuelType(selectedVehicle.fuelType);
      if (selectedVehicle.seats) setSeats(selectedVehicle.seats.toString());
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
    const baseTotal = parseFloat(totalPrice) || 0;
    const days = request?.totalDays || 1;
    return baseTotal / days;
  };

  const calculateTotal = () => {
    const baseTotal = parseFloat(totalPrice) || 0;
    const delivery = parseFloat(deliveryCharges) || 0;
    const pickup = parseFloat(pickupCharges) || 0;
    return baseTotal + delivery + pickup;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const calculatedDailyRate = calculateDailyRate();
      const response = await fetch('/api/vendor/self-drive-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request?.id || params.id,
          vendorFleetId: selectedFleetId || null,
          vehicleName: vehicleName || request?.vehicle_modelsName || request?.vehicleCategoryName,
          vehicleBrand: vehicleBrand || null,
          chauffeur_vehicle_categories: vehicle_category || request?.vehicle_category || null,
          vehicleType: request?.vehicleType || null,
          transmission: transmission || null,
          fuelType: fuelType || null,
          seats: seats ? parseInt(seats) : null,
          registrationNumber: registrationNumber || null,
          dailyRate: calculatedDailyRate,
          totalPrice: parseFloat(totalPrice),
          securityDeposit: parseFloat(securityDeposit) || 0,
          kmLimitPerDay: kmLimitPerDay === 'unlimited' ? 0 : (parseInt(kmLimitPerDay) || 200),
          unlimitedKm: kmLimitPerDay === 'unlimited',
          extraKmRate: parseFloat(extraKmRate) || 10,
          deliveryCharges: parseFloat(deliveryCharges) || 0,
          pickupCharges: parseFloat(pickupCharges) || 0,
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
        alert('Quote sent successfully!');
        router.push('/vendor/self-drive/quotes');
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
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/self-drive/requests"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-500" />
            Send Quote
          </h1>
          <p className="text-gray-600">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <h3 className="font-semibold text-emerald-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Car className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {request.vehicle_modelsName || request.vehicleCategoryName || 'Any Car'}
              </p>
              <p className="text-sm text-gray-600">
                {request.vehicleBrand && `${request.vehicleBrand} • `}
                {formatBookingDuration(request)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.locationName || 'N/A'}</p>
              {request.isDeliveryRequested && (
                <p className="text-sm text-emerald-600">Delivery requested</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
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
          <div className="flex flex-wrap gap-2">
            {request.transmission && (
              <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                <Settings2 className="w-3 h-3" />
                {request.transmission}
              </span>
            )}
            {request.fuelType && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                <Fuel className="w-3 h-3" />
                {request.fuelType}
              </span>
            )}
            {request.minSeats && (
              <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                <Users className="w-3 h-3" />
                {request.minSeats}+ seats
              </span>
            )}
          </div>
        </div>
        {request.customerNotes && (
          <div className="mt-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p className="text-sm text-gray-600">{request.customerNotes}</p>
          </div>
        )}
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-500" />
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Select a car from fleet (or enter manually) --</option>
                {fleetVehicles.map((vehicle) => {
                  let displayName = '';
                  if (vehicle.vehicle_models) {
                    displayName = vehicle.vehicle_models.brands?.name
                      ? `${vehicle.vehicle_models.brands.name} ${vehicle.vehicle_models.name}`
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
                Car Name/Model *
              </label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => {
                  setVehicleName(e.target.value);
                  setSelectedFleetId('');
                }}
                placeholder="e.g., Swift Dzire, Honda City"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                placeholder="e.g., Maruti, Honda"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seats
              </label>
              <select
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select</option>
                <option value="4">4 Seater</option>
                <option value="5">5 Seater</option>
                <option value="6">6 Seater</option>
                <option value="7">7 Seater</option>
                <option value="8">8 Seater</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-500" />
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
                  placeholder={`${(request.totalDays || 1) * 2500}`}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your total quote price for the entire rental period
              </p>
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
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="5000"
                  disabled={noSecurityDeposit}
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${noSecurityDeposit ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-200'}`}
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noSecurityDeposit}
                  onChange={(e) => {
                    setNoSecurityDeposit(e.target.checked);
                    if (e.target.checked) setSecurityDeposit('0');
                  }}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-gray-600">No security deposit required</span>
              </label>
            </div>
          </div>

          {/* KM & Extra Rate Row */}
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
                  placeholder="200"
                  disabled={kmLimitPerDay === 'unlimited'}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setKmLimitPerDay(kmLimitPerDay === 'unlimited' ? '200' : 'unlimited')}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra KM Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={kmLimitPerDay === 'unlimited' ? '' : extraKmRate}
                  onChange={(e) => setExtraKmRate(e.target.value)}
                  placeholder="10"
                  disabled={kmLimitPerDay === 'unlimited'}
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${kmLimitPerDay === 'unlimited' ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-200'}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/km</span>
              </div>
            </div>
          </div>

          {request.isDeliveryRequested && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  Delivery Charges
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={deliveryCharges}
                      onChange={(e) => setDeliveryCharges(e.target.value)}
                      placeholder="500"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Charges
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={pickupCharges}
                      onChange={(e) => setPickupCharges(e.target.value)}
                      placeholder="500"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
            </div>
          )}

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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={customAdvanceAmount}
                    onChange={(e) => setCustomAdvanceAmount(e.target.value)}
                    placeholder="Enter advance amount"
                    min="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  {customAdvanceAmount && calculateTotal() > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ {Math.round((parseFloat(customAdvanceAmount) / calculateTotal()) * 100)}% of total ₹{calculateTotal().toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {advanceExceedsTotal && (
                <p className="text-xs text-red-600 mt-1 font-medium">Advance amount cannot exceed total price (₹{calculateTotal().toLocaleString()})</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Valid Till
              </label>
              {/* Mode toggle */}
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
                  <input
                    type="date"
                    value={customValidDate}
                    onChange={(e) => setCustomValidDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    required={validityMode === 'custom'}
                  />
                  <input
                    type="time"
                    value={customValidTime}
                    onChange={(e) => setCustomValidTime(e.target.value)}
                    className="w-[120px] px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {validityMode === 'days'
                  ? `Quote expires in ${validityDays} day${validityDays !== '1' ? 's' : ''} from submission`
                  : customValidDate
                    ? `Quote valid till ${new Date(`${customValidDate}T${customValidTime || '23:59'}`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                    : 'Select expiry date and time'}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 rounded-xl border border-emerald-200 overflow-hidden">
            <div className="bg-emerald-100 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-emerald-800">Quote Summary</h3>
            </div>
            <div className="bg-emerald-50 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rental Price ({request.totalDays} days)</span>
                <span className="text-sm font-medium text-gray-800">₹{(parseFloat(totalPrice) || 0).toLocaleString()}</span>
              </div>
              {(parseFloat(deliveryCharges) > 0 || parseFloat(pickupCharges) > 0) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivery + Pickup</span>
                  <span className="text-sm font-medium text-gray-800">₹{((parseFloat(deliveryCharges) || 0) + (parseFloat(pickupCharges) || 0)).toLocaleString()}</span>
                </div>
              )}
              {(parseFloat(securityDeposit) > 0) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Security Deposit (refundable)</span>
                  <span className="text-sm font-medium text-gray-800">₹{(parseFloat(securityDeposit) || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-emerald-200 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Total Amount to Pay</span>
                  <span className="text-lg font-bold text-emerald-600">₹{(calculateTotal() + (parseFloat(securityDeposit) || 0)).toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-emerald-200 pt-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 font-medium">Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Custom)'}</span>
                  <span className="text-sm font-bold text-green-700">₹{calculateAdvance().toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Remaining at pickup</span>
                  <span className="text-xs text-gray-500">₹{(calculateTotal() + (parseFloat(securityDeposit) || 0) - calculateAdvance()).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 pt-1.5 border-t border-emerald-100">
                KM Limit: {kmLimitPerDay === 'unlimited' ? 'Unlimited' : `${kmLimitPerDay} km/day`} • Extra KM: ₹{extraKmRate}/km
              </div>
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
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Exclusions ({exclusions.length})
            </h2>
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
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Terms & Conditions ({termsConditions.length})</h2>
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

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Notes for Customer (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special notes or messages for the customer..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/self-drive/requests"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !totalPrice || !vehicleName || advanceExceedsTotal}
            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Quote (₹{calculateTotal().toLocaleString()})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
