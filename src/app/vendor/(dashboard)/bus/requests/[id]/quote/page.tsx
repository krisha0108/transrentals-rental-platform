'use client';

import { useState, useEffect } from 'react';
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
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);

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
    const base = parseFloat(baseRate) || 0;
    const driver = parseFloat(driverAllowance) || 0;
    const toll = parseFloat(tollCharges) || 0;
    const additional = parseFloat(additionalCharges) || 0;
    return base + driver + toll + additional;
  };

  const calculateAdvance = () => {
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          baseAmount: parseFloat(baseRate) || 0,
          driverAllowance: parseFloat(driverAllowance) || 0,
          tollEstimate: parseFloat(tollCharges) || 0,
          parkingEstimate: parseFloat(additionalCharges) || 0,
          advanceAmount: calculateAdvance(),
          advancePercent: parseInt(advancePercent) || 30,
          inclusions,
          exclusions,
          termsConditions,
          vendorMessage: notes,
          validityDays: Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Quote sent successfully!');
        router.push('/vendor/bus/quotes');
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

  const getCategoryName = (id: string) => BUS_CATEGORIES.find((c) => c.id === id)?.shortName || id;
  const getTripTypeName = (id: string) => BUS_TRIP_TYPES.find((t) => t.id === id)?.name || id;

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
          href="/vendor/bus/requests"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-orange-500" />
            Send Quote
          </h1>
          <p className="text-gray-600">#{request.inquiryNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
        <h3 className="font-semibold text-orange-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Bus className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{getCategoryName(request.vehicle_category)}</p>
              <p className="text-sm text-gray-600">{getTripTypeName(request.tripType)} • {request.passengerCount} passengers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {request.pickupCity} {request.dropCity && `→ ${request.dropCity}`}
              </p>
              {request.pickupAddress && (
                <p className="text-sm text-gray-600">{request.pickupAddress}</p>
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
                {request.returnDate && (
                  <span className="text-gray-600">
                    {' → '}
                    {new Date(request.returnDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600">Pickup: {request.pickupTime}</p>
            </div>
          </div>
          {request.specialRequirements && (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">{request.specialRequirements}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-orange-500" />
              Select Template
            </h2>
            {selectedTemplateId && (
              <button
                type="button"
                onClick={clearTemplate}
                className="text-sm text-red-600 hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template)}
                className={`p-4 rounded-lg border-2 text-left transition ${selectedTemplateId === template.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {selectedTemplateId === template.id && (
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {template.inclusions.length} inclusions • {template.exclusions.length} exclusions
                </p>
                {template.baseRateHint && (
                  <p className="text-sm text-orange-600 mt-1">
                    Suggested: ₹{template.baseRateHint.toLocaleString()}
                  </p>
                )}
              </button>
            ))}

            <Link
              href="/vendor/bus/templates/create"
              className="p-4 rounded-lg border-2 border-dashed border-gray-300 text-center hover:border-orange-400 hover:bg-orange-50 transition flex flex-col items-center justify-center gap-2"
            >
              <Plus className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500">Create New Template</span>
            </Link>
          </div>

          {!selectedTemplateId && templates.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No templates yet. Create one for faster quoting!
            </p>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Bus className="w-5 h-5 text-orange-500" />
            Vehicle Details (Optional)
          </h2>

          {/* Fleet Vehicle Dropdown */}
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
                <option value="">-- Select a vehicle from fleet (or enter manually below) --</option>
                {fleetVehicles.map((vehicle) => {
                  // Build display name
                  let displayName = '';
                  if (vehicle.vehicle_models) {
                    displayName = vehicle.vehicle_models.brands?.name
                      ? `${vehicle.vehicle_models.brands.name} ${vehicle.vehicle_models.name}`
                      : vehicle.vehicle_models.name;
                  } else if (vehicle.brands && vehicle.chauffeur_vehicle_categories) {
                    displayName = `${vehicle.brands.name} ${vehicle.chauffeur_vehicle_categories.name}`;
                  } else if (vehicle.chauffeur_vehicle_categories) {
                    displayName = vehicle.chauffeur_vehicle_categories.name;
                  }

                  // Add registration number if available
                  const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';

                  const isUnavailable = vehicle.isAvailableForDates === false;

                  return (
                    <option key={vehicle.id} value={vehicle.id} disabled={isUnavailable}>
                      {displayName}{regNum}{isUnavailable ? ' — Booked for these dates' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a vehicle from your fleet to auto-fill details, or enter manually below
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Name/Model
              </label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => {
                  setVehicleName(e.target.value);
                  setSelectedFleetId(''); // Clear fleet selection when manually typing
                }}
                placeholder="e.g., Force Traveller 17 Seater"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value.toUpperCase());
                  setSelectedFleetId(''); // Clear fleet selection when manually typing
                }}
                placeholder="e.g., DL 01 AB 1234"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
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
                Base Rate *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  placeholder="15000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Allowance (if separate)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={driverAllowance}
                  onChange={(e) => setDriverAllowance(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Toll Charges (if separate)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={tollCharges}
                  onChange={(e) => setTollCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Charges
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={additionalChargesLabel}
                  onChange={(e) => setAdditionalChargesLabel(e.target.value)}
                  placeholder="Label"
                  className="w-1/2 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <div className="relative w-1/2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Payment Required (%)
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
                  <option value="100">100%</option>
                </select>
                <span className="text-gray-600">
                  = ₹{calculateAdvance().toLocaleString()} advance
                </span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-orange-800">Total Quote Amount</span>
              <span className="text-2xl font-bold text-orange-600">
                ₹{calculateTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-700">Advance Payment ({advancePercent}%)</span>
              <span className="font-semibold text-orange-600">
                ₹{calculateAdvance().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Balance (on trip completion)</span>
              <span className="text-gray-700">
                ₹{(calculateTotal() - calculateAdvance()).toLocaleString()}
              </span>
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
            {inclusions.length === 0 && (
              <span className="text-sm text-gray-400">No inclusions added</span>
            )}
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
            {exclusions.length === 0 && (
              <span className="text-sm text-gray-400">No exclusions added</span>
            )}
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
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
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
            {termsConditions.length === 0 && (
              <span className="text-sm text-gray-400">No terms added</span>
            )}
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

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Additional Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes for Customer (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes or messages for the customer..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Valid Until *
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/bus/requests"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !baseRate || calculateTotal() === 0}
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
                Send Quote (₹{calculateTotal().toLocaleString()})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
