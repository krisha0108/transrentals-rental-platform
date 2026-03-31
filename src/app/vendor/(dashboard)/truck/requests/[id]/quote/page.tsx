'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  MapPin,
  Calendar,
  Package,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  X,
  IndianRupee,
  Edit3,
  AlertCircle,
  Users,
  FileSpreadsheet,
  Weight,
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  vehicleCategory: string;
  vehicleCategoryName?: string;
  goodsType: string;
  goodsDescription?: string;
  estimatedWeight?: number;
  pickupCity: string;
  dropCity: string;
  pickupDate: string;
  pickupTime?: string;
  pickupAddress?: string;
  dropAddress?: string;
  requiresLabour: boolean;
  labourCount?: number;
  customerName: string;
  customerPhone: string;
  specialRequirements?: string;
}

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  vehicleCapacity?: string | null;
  seatingCapacity?: number | null;
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
    seatingCapacity?: number | null;
    luggageCapacity?: number | null;
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

const SERVICE_TYPES: Record<string, string> = {
  'local-shifting': 'Local Shifting',
  'intercity': 'Intercity Transport',
  'commercial': 'Commercial Goods',
};

const GOODS_TYPES: Record<string, string> = {
  'household': 'Household Items',
  'commercial': 'Commercial Goods',
  'industrial': 'Industrial Equipment',
  'fragile': 'Fragile Items',
  'machinery': 'Heavy Machinery',
  'electronics': 'Electronics',
  'furniture': 'Furniture',
  'other': 'Other',
};

const DEFAULT_INCLUSIONS = [
  'Vehicle as per booking',
  'Driver charges',
  'Basic fuel charges',
  'Standard insurance coverage',
];

const DEFAULT_EXCLUSIONS = [
  'Toll charges (if applicable)',
  'Permit charges (if any)',
  'Parking fees',
  'Detention charges beyond 2 hours',
];

const DEFAULT_TERMS = [
  'Payment terms: 50% advance, balance on completion',
  'Cancellation policy applies as per terms',
  'Loading and unloading to be done by customer unless labour hired',
  'Vehicle provided based on availability',
];

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Local Shifting',
    category: 'local-shifting',
    inclusions: [
      'Vehicle as per booking',
      'Driver charges',
      'Basic fuel charges',
      'Standard insurance coverage',
    ],
    exclusions: [
      'Toll charges',
      'Parking fees',
      'Loading/Unloading labour',
      'Detention charges beyond 2 hours',
    ],
    termsConditions: [
      'Full payment before trip starts',
      'Cancellation charges as per policy',
      'Loading/unloading by customer',
      'Vehicle subject to availability',
    ],
    baseRateHint: 3000,
  },
  {
    id: '2',
    name: 'Intercity Transport',
    category: 'intercity',
    inclusions: [
      'Vehicle with driver',
      'Fuel charges for distance',
      'Driver allowance',
      'Standard insurance',
      'Toll charges',
    ],
    exclusions: [
      'Loading/Unloading charges',
      'Packaging materials',
      'Extra stops beyond route',
      'Overnight charges',
    ],
    termsConditions: [
      '50% advance required',
      'Balance on delivery',
      'Route fixed at booking',
      'Detention: ₹200/hour',
    ],
    baseRateHint: 8000,
  },
];

export default function SendTruckQuotePage() {
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
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [labourIncluded, setLabourIncluded] = useState(false);
  const [labourCount, setLabourCount] = useState('');
  const [labourCharges, setLabourCharges] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [loadingCharges, setLoadingCharges] = useState('');
  const [unloadingCharges, setUnloadingCharges] = useState('');
  const [tollCharges, setTollCharges] = useState('');
  const [packagingCharges, setPackagingCharges] = useState('');
  const [insuranceCharges, setInsuranceCharges] = useState('');
  const [advancePercent, setAdvancePercent] = useState('50'); // Default 50% advance
  const [advanceMode, setAdvanceMode] = useState<'percent' | 'manual'>('percent');
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [inclusions, setInclusions] = useState<string[]>(DEFAULT_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(DEFAULT_EXCLUSIONS);
  const [termsConditions, setTermsConditions] = useState<string[]>(DEFAULT_TERMS);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [validUntilTime, setValidUntilTime] = useState('23:59');
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);

  // Input states
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchRequestDetails();
  }, [params.id]);

  const fetchRequestDetails = async () => {
    try {
      // Fetch the quote request details
      const response = await fetch(`/api/vendor/truck-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest({
          id: data.request.id,
          requestNumber: data.request.requestNumber,
          serviceType: data.request.serviceType,
          vehicleCategory: data.request.vehicleCategory,
          vehicleCategoryName: data.request.vehicleCategoryName,
          goodsType: data.request.goodsType,
          goodsDescription: data.request.goodsDescription,
          estimatedWeight: data.request.estimatedWeight,
          pickupCity: data.request.pickupCity,
          dropCity: data.request.dropCity,
          pickupDate: data.request.pickupDate,
          pickupTime: data.request.pickupTime,
          pickupAddress: data.request.pickupAddress,
          dropAddress: data.request.dropAddress,
          requiresLabour: data.request.requiresLabour,
          labourCount: data.request.labourCount,
          customerName: data.request.customerName,
          customerPhone: data.request.customerPhone,
          specialRequirements: data.request.requirements,
        });

        // Pre-fill labour if requested
        if (data.request.requiresLabour) {
          setLabourIncluded(true);
          setLabourCount(data.request.labourCount?.toString() || '2');
        }
      }

      // Fetch templates (fallback to sample if API fails)
      try {
        const templateRes = await fetch('/api/vendor/truck-templates');
        const templateData = await templateRes.json();
        if (templateData.success && templateData.templates) {
          setTemplates(templateData.templates);
        } else {
          setTemplates(SAMPLE_TEMPLATES);
        }
      } catch (templateError) {
        console.error('Failed to fetch templates:', templateError);
        setTemplates(SAMPLE_TEMPLATES);
      }

      // Fetch vendor's fleet for truck service (with availability check)
      try {
        let fleetUrl = '/api/vendor/fleet';
        if (data.request?.pickupDate) {
          const pickupDate = new Date(data.request.pickupDate).toISOString();
          fleetUrl += `?startDate=${encodeURIComponent(pickupDate)}&endDate=${encodeURIComponent(pickupDate)}`;
        }
        const fleetRes = await fetch(fleetUrl);
        const fleetData = await fleetRes.json();
        console.log('Fleet API response:', fleetData);
        if (fleetData.success && fleetData.fleet) {
          // Filter for truck rental vehicles only
          const truckFleet = fleetData.fleet.filter((v: FleetVehicle) => {
            if (!v.isActive) return false;
            const svc = v.services;
            const slug = svc?.slug?.toLowerCase() || '';
            const name = svc?.name?.toLowerCase() || '';
            return slug.includes('truck') || name.includes('truck') || slug.includes('transporter');
          });
          console.log('Filtered truck fleet:', truckFleet);
          // Sort: available vehicles first, unavailable at the end
          truckFleet.sort((a: FleetVehicle, b: FleetVehicle) => {
            const aUnavail = a.isAvailableForDates === false ? 1 : 0;
            const bUnavail = b.isAvailableForDates === false ? 1 : 0;
            return aUnavail - bUnavail;
          });
          setFleetVehicles(truckFleet);
        }
      } catch (fleetError) {
        console.error('Failed to fetch fleet:', fleetError);
      }

      // Set default validity (3 days from now)
      const defaultValidity = new Date(Date.now() + 3 * 86400000);
      setValidUntil(defaultValidity.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
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
      setBaseAmount(template.baseRateHint.toString());
    }
  };

  const clearTemplate = () => {
    setSelectedTemplateId(null);
    setInclusions([]);
    setExclusions([]);
    setTermsConditions([]);
    setBaseAmount('');
  };

  // Handle fleet vehicle selection
  const handleFleetSelection = (fleetId: string) => {
    setSelectedFleetId(fleetId);

    if (fleetId === '') {
      // Clear vehicle details if "Select from fleet" is chosen
      setVehicleName('');
      setVehicleNumber('');
      setVehicleCapacity('');
      return;
    }

    const selectedVehicle = fleetVehicles.find(v => v.id === fleetId);
    console.log('Selected vehicle from fleet:', selectedVehicle);

    if (selectedVehicle) {
      // Build vehicle name from model/brand/category
      let vName = '';

      // Try vehicle_models with brands (note: brands not brand)
      if (selectedVehicle.vehicle_models) {
        vName = selectedVehicle.vehicle_models.brands?.name
          ? `${selectedVehicle.vehicle_models.brands.name} ${selectedVehicle.vehicle_models.name}`
          : selectedVehicle.vehicle_models.name;
      }
      // Try top-level brands with chauffeur_vehicle_categories
      else if (selectedVehicle.brands && selectedVehicle.chauffeur_vehicle_categories) {
        vName = `${selectedVehicle.brands.name} ${selectedVehicle.chauffeur_vehicle_categories.name}`;
      }
      // Try just chauffeur_vehicle_categories
      else if (selectedVehicle.chauffeur_vehicle_categories) {
        vName = selectedVehicle.chauffeur_vehicle_categories.name;
      }

      // If still no name, use registration number or fallback
      if (!vName) {
        vName = selectedVehicle.registrationNumber || 'Fleet Vehicle';
      }

      console.log('Setting vehicleName to:', vName);
      setVehicleName(vName);
      setVehicleNumber(selectedVehicle.registrationNumber || '');

      // Set vehicle capacity
      const capacity = selectedVehicle.seatingCapacity
        || selectedVehicle.chauffeur_vehicle_categories?.seatingCapacity
        || selectedVehicle.vehicleCapacity;
      if (capacity) {
        setVehicleCapacity(String(capacity) + (typeof capacity === 'number' ? ' Ton' : ''));
      }
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
    const base = parseFloat(baseAmount) || 0;
    const loading = parseFloat(loadingCharges) || 0;
    const unloading = parseFloat(unloadingCharges) || 0;
    const toll = parseFloat(tollCharges) || 0;
    const packaging = parseFloat(packagingCharges) || 0;
    const insurance = parseFloat(insuranceCharges) || 0;
    const labour = labourIncluded ? (parseFloat(labourCharges) || 0) : 0;

    return base + loading + unloading + toll + packaging + insurance + labour;
  };

  const calculateAdvance = () => {
    if (advanceMode === 'manual' && customAdvanceAmount) {
      return parseFloat(customAdvanceAmount) || 0;
    }
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 50;
    return Math.round((total * percent) / 100);
  };

  const advanceExceedsTotal = calculateAdvance() > calculateTotal() && calculateTotal() > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Debug state values
    console.log('=== SUBMIT DEBUG ===');
    console.log('vehicleName state:', vehicleName);
    console.log('request:', request);
    console.log('params:', params);

    // Ensure vehicleName is never empty/undefined - triple check with explicit string
    let finalVehicleName = 'Truck'; // Start with default
    if (vehicleName && vehicleName.trim()) {
      finalVehicleName = vehicleName.trim();
    } else if (request?.vehicleCategoryName) {
      finalVehicleName = request.vehicleCategoryName;
    } else if (request?.vehicleCategory) {
      finalVehicleName = request.vehicleCategory;
    }
    console.log('finalVehicleName:', finalVehicleName);

    const finalRequestId = request?.id || String(params.id);
    const finalBaseAmount = parseFloat(baseAmount) || 0;

    console.log('finalRequestId:', finalRequestId);
    console.log('finalBaseAmount:', finalBaseAmount);

    // Validate required fields before submitting
    if (!finalRequestId || !finalVehicleName || finalBaseAmount <= 0) {
      alert(`Please fill in all required fields. Missing: ${!finalRequestId ? 'requestId ' : ''}${!finalVehicleName ? 'vehicleName ' : ''}${finalBaseAmount <= 0 ? 'baseAmount' : ''}`);
      setIsSubmitting(false);
      return;
    }

    // Debug: log what we're about to send
    const submitData = {
      requestId: String(finalRequestId),
      templateId: selectedTemplateId,
      fleetId: selectedFleetId || null,
      vehicle_category: request?.vehicleCategory || 'TRUCK',
      vehicleName: String(finalVehicleName), // Explicit string conversion
      vehicleNumber: vehicleNumber || null,
      vehicleCapacity: vehicleCapacity || null,
      labourIncluded,
      labourCount: labourIncluded ? parseInt(labourCount) || 0 : 0,
      labourCharges: labourIncluded ? parseFloat(labourCharges) || 0 : 0,
      baseAmount: finalBaseAmount,
      perKmRate: perKmRate ? parseFloat(perKmRate) : null,
      loadingCharges: parseFloat(loadingCharges) || 0,
      unloadingCharges: parseFloat(unloadingCharges) || 0,
      tollEstimate: parseFloat(tollCharges) || 0,
      packagingCharges: parseFloat(packagingCharges) || 0,
      insuranceCharges: parseFloat(insuranceCharges) || 0,
      advanceAmount: calculateAdvance(),
      advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 50) : 0,
      customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
      inclusions,
      exclusions,
      termsConditions,
      vendorMessage: notes,
      validityDays: Math.ceil((new Date(`${validUntil}T${validUntilTime || '23:59'}:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      validUntil: new Date(`${validUntil}T${validUntilTime || '23:59'}:00`).toISOString(),
    };
    console.log('Submitting truck quote with data:', submitData);
    console.log('Request object:', request);
    console.log('Params:', params);

    try {
      const response = await fetch('/api/vendor/truck-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Quote sent successfully!');
        router.push('/vendor/truck/quotes');
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
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/truck/requests"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-500" />
            Send Quote
          </h1>
          <p className="text-gray-600">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.vehicleCategoryName || request.vehicleCategory}</p>
              <p className="text-sm text-gray-600">
                {SERVICE_TYPES[request.serviceType] || request.serviceType}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {GOODS_TYPES[request.goodsType] || request.goodsType}
              </p>
              {request.goodsDescription && (
                <p className="text-sm text-gray-600">{request.goodsDescription}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {request.pickupCity} → {request.dropCity}
              </p>
              {request.pickupAddress && (
                <p className="text-sm text-gray-600">{request.pickupAddress}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {new Date(request.pickupDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {request.pickupTime && (
                <p className="text-sm text-gray-600">Pickup: {request.pickupTime}</p>
              )}
            </div>
          </div>
          {request.estimatedWeight && (
            <div className="flex items-start gap-3">
              <Weight className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  Estimated Weight: {request.estimatedWeight} kg
                </p>
              </div>
            </div>
          )}
          {request.requiresLabour && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  Labour Required: {request.labourCount || 'Not specified'}
                </p>
              </div>
            </div>
          )}
          {request.specialRequirements && (
            <div className="flex items-start gap-3 md:col-span-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
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
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              Select Template (Optional)
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
                className={`p-4 rounded-lg border-2 text-left transition ${
                  selectedTemplateId === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {selectedTemplateId === template.id && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {template.inclusions.length} inclusions • {template.exclusions.length} exclusions
                </p>
                {template.baseRateHint && (
                  <p className="text-sm text-blue-600 mt-1">
                    Suggested: ₹{template.baseRateHint.toLocaleString()}
                  </p>
                )}
              </button>
            ))}
          </div>

          {templates.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No templates yet. Fill in the details manually below.
            </p>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Vehicle Details
          </h2>

          {/* Fleet Vehicle Dropdown */}
          {fleetVehicles.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select from your fleet (Optional)
              </label>
              <select
                value={selectedFleetId}
                onChange={(e) => handleFleetSelection(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Select a vehicle from fleet (or enter manually below) --</option>
                {fleetVehicles.map((vehicle) => {
                  // Build display name (note: brands not brand)
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

                  // Fallback to registration number if no name
                  if (!displayName) {
                    displayName = vehicle.registrationNumber || 'Fleet Vehicle';
                  }

                  // Add registration number if available and not already used
                  const regNum = vehicle.registrationNumber && displayName !== vehicle.registrationNumber
                    ? ` (${vehicle.registrationNumber})`
                    : '';

                  const isUnavailable = vehicle.isAvailableForDates === false;

                  return (
                    <option key={vehicle.id} value={vehicle.id} disabled={isUnavailable}>
                      {displayName}{regNum}{isUnavailable ? ' — Booked for this date' : ''}
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
                placeholder="e.g., Tata 407, Mahindra Bolero Pickup"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Capacity
              </label>
              <input
                type="text"
                value={vehicleCapacity}
                onChange={(e) => setVehicleCapacity(e.target.value)}
                placeholder="e.g., 1 ton, 3 ton, 7 ton"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Labour Details */}
        {request.requiresLabour && (
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Labour Details
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labourIncluded}
                  onChange={(e) => setLabourIncluded(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Include Labour</span>
              </label>
            </div>

            {labourIncluded && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Labour
                  </label>
                  <input
                    type="number"
                    value={labourCount}
                    onChange={(e) => setLabourCount(e.target.value)}
                    placeholder="e.g., 2"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Labour Charges
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={labourCharges}
                      onChange={(e) => setLabourCharges(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-blue-500" />
            Pricing
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Fare *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per KM Rate (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={perKmRate}
                  onChange={(e) => setPerKmRate(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loading Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={loadingCharges}
                  onChange={(e) => setLoadingCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unloading Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={unloadingCharges}
                  onChange={(e) => setUnloadingCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Toll/Permit Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={tollCharges}
                  onChange={(e) => setTollCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Packaging Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={packagingCharges}
                  onChange={(e) => setPackagingCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={insuranceCharges}
                  onChange={(e) => setInsuranceCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Payment
              </label>
              <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
                <button type="button" onClick={() => setAdvanceMode('percent')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${advanceMode === 'percent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                  By Percentage
                </button>
                <button type="button" onClick={() => setAdvanceMode('manual')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${advanceMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                  Custom Amount
                </button>
              </div>
              {advanceMode === 'percent' ? (
                <div className="flex items-center gap-3">
                  <select
                    value={advancePercent}
                    onChange={(e) => setAdvancePercent(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                    <option value="100">100%</option>
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
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {advanceExceedsTotal && (
            <p className="text-xs text-red-600 mt-1 font-medium">Advance amount cannot exceed total price</p>
          )}

          {/* Total */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-800">Total Quote Amount</span>
              <span className="text-2xl font-bold text-blue-600">
                ₹{calculateTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Custom)'}</span>
              <span className="font-semibold text-blue-600">
                ₹{calculateAdvance().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Balance (on completion)</span>
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
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
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
                <span className="text-blue-500 font-bold">{idx + 1}.</span>
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => addItem(termsConditions, setTermsConditions)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Valid Until *
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="time"
                  value={validUntilTime}
                  onChange={(e) => setValidUntilTime(e.target.value)}
                  className="w-[130px] px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/truck/requests"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !baseAmount || calculateTotal() === 0 || advanceExceedsTotal}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
