'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  X,
  IndianRupee,
  Edit3,
  AlertCircle,
  Home,
  Building2,
  Shield,
  Box,
  TrendingUp,
  FileSpreadsheet,
  Star,
  Truck,
} from 'lucide-react';

interface PackersQuoteRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  shiftingType: string;
  propertySize?: string;
  inventoryList?: any;
  hasHeavyItems: boolean;
  heavyItemsDesc?: string;
  hasFragileItems: boolean;
  fragileItemsDesc?: string;
  hasVehicle: boolean;
  vehicleDetails?: string;
  pickupCity: string;
  pickupAddress: string;
  pickupFloor?: number;
  hasPickupLift: boolean;
  pickupParkingDist?: string;
  dropCity: string;
  dropAddress: string;
  dropFloor?: number;
  hasDropLift: boolean;
  dropParkingDist?: string;
  preferredDate: string;
  isFlexibleDate: boolean;
  flexibleDateRange?: string;
  needPacking: boolean;
  needUnpacking: boolean;
  needStorage: boolean;
  storageDays?: number;
  needInsurance: boolean;
  insuranceValue?: number;
  requirements?: string;
  budgetMin?: number;
  budgetMax?: number;
  customerName: string;
  customerPhone: string;
}

interface PackersTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  baseRateHint?: number;
  isDefault: boolean;
  isActive?: boolean;
}

interface FleetVehicle {
  id: string;
  registrationNumber?: string;
  chauffeur_vehicle_categories?: {
    id: string;
    name: string;
    luggageCapacity?: string;
  };
  isAvailable: boolean;
  isAvailableForDates?: boolean;
}

const SERVICE_TYPES: Record<string, string> = {
  HOUSEHOLD: 'Household Shifting',
  OFFICE: 'Office Relocation',
  VEHICLE: 'Vehicle Transportation',
  STORAGE: 'Storage & Warehousing',
};

const SHIFTING_TYPES: Record<string, string> = {
  LOCAL: 'Local (Within City)',
  INTERCITY: 'Intercity',
  INTRACITY: 'Intracity',
};

const DEFAULT_INCLUSIONS = [
  'Professional packing team',
  'Quality packing materials',
  'Loading and unloading',
  'Transportation',
  'Basic insurance coverage',
  'Unpacking service',
];

const DEFAULT_EXCLUSIONS = [
  'Perishable items',
  'Valuable jewelry and cash',
  'Pets and plants',
  'Hazardous materials',
  'Extra floor charges (above 3rd floor)',
];

const DEFAULT_TERMS = [
  'Payment terms: 50% advance, 50% on delivery',
  'Rescheduling allowed with 24 hours notice',
  'Customer must be present during packing/unpacking',
  'Insurance claims must be filed within 7 days',
  'Transit time subject to weather and traffic conditions',
];

export default function SendPackersQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<PackersQuoteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Templates
  const [templates, setTemplates] = useState<PackersTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Fleet vehicles
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [selectedFleetVehicleId, setSelectedFleetVehicleId] = useState<string>('');

  // Quote form state
  const [teamSize, setTeamSize] = useState('3');
  const [estimatedDays, setEstimatedDays] = useState('1');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleCount, setVehicleCount] = useState('1');
  const [packingCharges, setPackingCharges] = useState('');
  const [loadingCharges, setLoadingCharges] = useState('');
  const [transportCharges, setTransportCharges] = useState('');
  const [unloadingCharges, setUnloadingCharges] = useState('');
  const [unpackingCharges, setUnpackingCharges] = useState('');
  const [materialCharges, setMaterialCharges] = useState('');
  const [storageCharges, setStorageCharges] = useState('');
  const [insuranceCharges, setInsuranceCharges] = useState('');
  const [gstAmount, setGstAmount] = useState('');
  const [advancePercent, setAdvancePercent] = useState('50');
  const [advanceMode, setAdvanceMode] = useState<'percent' | 'manual'>('percent');
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState<string[]>([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState<string[]>([...DEFAULT_TERMS]);
  const [notes, setNotes] = useState('');
  const [quickQuoteMode, setQuickQuoteMode] = useState(false);
  const [quickTotalPrice, setQuickTotalPrice] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [validUntilTime, setValidUntilTime] = useState('23:59');
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);
  const [packingMaterials, setPackingMaterials] = useState('');

  // Input states
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchRequestDetails();
    fetchTemplates();
  }, [params.id]);

  const fetchFleetVehicles = async (preferredDate?: string) => {
    try {
      let fleetUrl = '/api/vendor/fleet';
      if (preferredDate) {
        const dateStr = new Date(preferredDate).toISOString();
        fleetUrl += `?startDate=${encodeURIComponent(dateStr)}&endDate=${encodeURIComponent(dateStr)}`;
      }
      const response = await fetch(fleetUrl);
      const data = await response.json();

      if (data.success && data.fleet) {
        // Filter fleet for packers-movers service
        const packersFleet = data.fleet.filter((f: any) => {
          if (!f.isActive) return false;
          const serviceName = f.services?.name?.toLowerCase() || '';
          const serviceSlug = f.services?.slug?.toLowerCase() || '';
          return (
            serviceName.includes('packer') ||
            serviceName.includes('mover') ||
            serviceSlug.includes('packer') ||
            serviceSlug.includes('mover')
          );
        });

        // Sort: available vehicles first, unavailable at the end
        const mapped: FleetVehicle[] = packersFleet.map((f: any) => ({
          id: f.id,
          registrationNumber: f.registrationNumber,
          chauffeur_vehicle_categories: f.chauffeur_vehicle_categories,
          isAvailable: f.isAvailable,
          isAvailableForDates: f.isAvailableForDates,
        }));
        mapped.sort((a: FleetVehicle, b: FleetVehicle) => {
          const aUnavail = a.isAvailableForDates === false || !a.isAvailable ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false || !b.isAvailable ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setFleetVehicles(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch fleet vehicles:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/vendor/packers-templates');
      const data = await response.json();

      if (data.success && data.templates) {
        const activeTemplates = data.templates.filter((t: PackersTemplate) => t.isActive !== false);
        setTemplates(activeTemplates);

        // Auto-select default template if exists
        const defaultTemplate = activeTemplates.find((t: PackersTemplate) => t.isDefault);
        if (defaultTemplate) {
          applyTemplate(defaultTemplate);
          setSelectedTemplateId(defaultTemplate.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const applyTemplate = (template: PackersTemplate) => {
    if (template.inclusions && Array.isArray(template.inclusions)) {
      setInclusions([...template.inclusions]);
    }
    if (template.exclusions && Array.isArray(template.exclusions)) {
      setExclusions([...template.exclusions]);
    }
    if (template.termsConditions && Array.isArray(template.termsConditions)) {
      setTermsConditions([...template.termsConditions]);
    }
    if (template.baseRateHint) {
      setTransportCharges(template.baseRateHint.toString());
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        applyTemplate(template);
      }
    } else {
      // Reset to defaults
      setInclusions([...DEFAULT_INCLUSIONS]);
      setExclusions([...DEFAULT_EXCLUSIONS]);
      setTermsConditions([...DEFAULT_TERMS]);
    }
  };

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/packers-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest(data.request);
        fetchFleetVehicles(data.request.preferredDate);

        // Auto-calculate GST (5% of subtotal by default)
        const autoGST = () => {
          const subtotal = calculateSubtotal();
          const gst = Math.round(subtotal * 0.05);
          setGstAmount(gst.toString());
        };

        // Set default validity (7 days from now)
        const defaultValidity = new Date(Date.now() + 7 * 86400000);
        setValidUntil(defaultValidity.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      alert('Failed to load request details');
    } finally {
      setIsLoading(false);
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

  const calculateSubtotal = () => {
    const packing = parseFloat(packingCharges) || 0;
    const loading = parseFloat(loadingCharges) || 0;
    const transport = parseFloat(transportCharges) || 0;
    const unloading = parseFloat(unloadingCharges) || 0;
    const unpacking = parseFloat(unpackingCharges) || 0;
    const material = parseFloat(materialCharges) || 0;
    const storage = parseFloat(storageCharges) || 0;
    const insurance = parseFloat(insuranceCharges) || 0;
    return packing + loading + transport + unloading + unpacking + material + storage + insurance;
  };

  const calculateTotal = () => {
    if (quickQuoteMode) return parseFloat(quickTotalPrice) || 0;
    const subtotal = calculateSubtotal();
    const gst = parseFloat(gstAmount) || 0;
    return subtotal + gst;
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
    setSubmitStatus('submitting');

    try {
      const response = await fetch('/api/vendor/packers-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request?.id || params.id,
          packingCharges: quickQuoteMode ? 0 : (parseFloat(packingCharges) || 0),
          loadingCharges: quickQuoteMode ? 0 : (parseFloat(loadingCharges) || 0),
          transportCharges: quickQuoteMode ? (parseFloat(quickTotalPrice) || 0) : (parseFloat(transportCharges) || 0),
          unloadingCharges: quickQuoteMode ? 0 : (parseFloat(unloadingCharges) || 0),
          unpackingCharges: quickQuoteMode ? 0 : (parseFloat(unpackingCharges) || 0),
          materialCharges: quickQuoteMode ? 0 : (parseFloat(materialCharges) || 0),
          storageCharges: quickQuoteMode ? 0 : (parseFloat(storageCharges) || 0),
          insuranceCharges: quickQuoteMode ? 0 : (parseFloat(insuranceCharges) || 0),
          gstAmount: quickQuoteMode ? 0 : (parseFloat(gstAmount) || 0),
          teamSize: parseInt(teamSize) || 3,
          estimatedDays: parseInt(estimatedDays) || 1,
          vehicleType: vehicleType || '',
          vehicleCount: parseInt(vehicleCount) || 1,
          fleetVehicleId: selectedFleetVehicleId || null,
          packingMaterials: packingMaterials || null,
          advanceAmount: calculateAdvance(),
          advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 50) : 0,
          customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
          inclusions,
          exclusions,
          termsConditions,
          notes,
          validityDays: Math.ceil((new Date(`${validUntil}T${validUntilTime || '23:59'}:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          validUntil: new Date(`${validUntil}T${validUntilTime || '23:59'}:00`).toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        // Wait a moment to show success state before redirecting
        setTimeout(() => {
          router.push('/vendor/packers/quotes');
        }, 1500);
      } else {
        setSubmitStatus('error');
        alert(data.error || 'Failed to send quote. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to submit quote:', error);
      setSubmitStatus('error');
      alert('Failed to send quote. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getServiceTypeName = (type: string) => SERVICE_TYPES[type] || type;
  const getShiftingTypeName = (type: string) => SHIFTING_TYPES[type] || type;

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Full-screen Loader Overlay */}
      {(submitStatus === 'submitting' || submitStatus === 'success') && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            {submitStatus === 'submitting' ? (
              <>
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <h3 className="text-xl font-semibold text-gray-900">Sending Quote...</h3>
                <p className="text-gray-500 text-center">Please wait while we submit your quote</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Quote Sent Successfully!</h3>
                <p className="text-gray-500 text-center">Redirecting to your quotes...</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-cyan-500 h-1.5 rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/packers/requests"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-cyan-500" />
            Send Quote - Packers & Movers
          </h1>
          <p className="text-gray-600">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
        <h3 className="font-semibold text-cyan-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-cyan-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{getServiceTypeName(request.serviceType)}</p>
              <p className="text-sm text-gray-600">
                {getShiftingTypeName(request.shiftingType)}
                {request.propertySize && ` • ${request.propertySize}`}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-cyan-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {request.pickupCity} → {request.dropCity}
              </p>
              <p className="text-sm text-gray-600">{request.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-cyan-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {new Date(request.preferredDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {request.isFlexibleDate && (
                <p className="text-sm text-gray-600">Flexible: {request.flexibleDateRange}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-cyan-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.customerName}</p>
              <p className="text-sm text-gray-600">{request.customerPhone}</p>
            </div>
          </div>
        </div>

        {/* Special Requirements */}
        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
          {request.needPacking && (
            <div className="flex items-center gap-2 text-cyan-700">
              <CheckCircle className="w-4 h-4" />
              <span>Packing Required</span>
            </div>
          )}
          {request.needUnpacking && (
            <div className="flex items-center gap-2 text-cyan-700">
              <CheckCircle className="w-4 h-4" />
              <span>Unpacking Required</span>
            </div>
          )}
          {request.needStorage && (
            <div className="flex items-center gap-2 text-cyan-700">
              <CheckCircle className="w-4 h-4" />
              <span>Storage: {request.storageDays} days</span>
            </div>
          )}
          {request.needInsurance && (
            <div className="flex items-center gap-2 text-cyan-700">
              <Shield className="w-4 h-4" />
              <span>Insurance: ₹{request.insuranceValue?.toLocaleString()}</span>
            </div>
          )}
          {request.hasHeavyItems && (
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span>Heavy Items: {request.heavyItemsDesc}</span>
            </div>
          )}
          {request.hasFragileItems && (
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span>Fragile Items: {request.fragileItemsDesc}</span>
            </div>
          )}
        </div>

        {request.requirements && (
          <div className="mt-4 p-3 bg-white rounded-lg">
            <p className="text-sm text-gray-500">Special Requirements</p>
            <p className="text-gray-700">{request.requirements}</p>
          </div>
        )}
      </div>

      {/* Template Selector */}
      {templates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
              Use Template
            </h2>
            <Link
              href="/vendor/packers/templates"
              className="text-sm text-cyan-600 hover:underline"
            >
              Manage Templates
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleTemplateChange('')}
              className={`p-4 rounded-lg border-2 text-left transition ${
                !selectedTemplateId
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">No Template</p>
              <p className="text-sm text-gray-500">Use default values</p>
            </button>

            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateChange(template.id)}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  selectedTemplateId === template.id
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="font-medium text-gray-900">{template.name}</p>
                  {template.isDefault && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                {template.baseRateHint && (
                  <p className="text-xs text-cyan-600 mt-1">
                    Base: ₹{template.baseRateHint.toLocaleString()}
                  </p>
                )}
              </button>
            ))}
          </div>

          {selectedTemplateId && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Template applied - Inclusions, Exclusions & Terms have been loaded
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-500" />
            Service Details
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Size (Packers) *
              </label>
              <input
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="3"
                min="1"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Days *
              </label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vehicle from Fleet
              </label>
              {fleetVehicles.length > 0 ? (
                <select
                  value={selectedFleetVehicleId}
                  onChange={(e) => {
                    setSelectedFleetVehicleId(e.target.value);
                    // Auto-fill vehicle type from selected fleet vehicle
                    const selected = fleetVehicles.find((f) => f.id === e.target.value);
                    if (selected?.chauffeur_vehicle_categories?.name) {
                      setVehicleType(selected.chauffeur_vehicle_categories.name);
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Select Vehicle --</option>
                  {fleetVehicles.map((vehicle) => {
                    const isUnavailable = vehicle.isAvailableForDates === false || !vehicle.isAvailable;
                    return (
                      <option key={vehicle.id} value={vehicle.id} disabled={isUnavailable}>
                        {vehicle.chauffeur_vehicle_categories?.name || 'Vehicle'}{' '}
                        {vehicle.registrationNumber ? `(${vehicle.registrationNumber})` : ''}{' '}
                        {vehicle.isAvailableForDates === false ? '— Booked for this date' : !vehicle.isAvailable ? '- Not Available' : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  No vehicles added in fleet.{' '}
                  <Link href="/vendor/fleet/add" className="text-cyan-600 hover:underline">
                    Add Vehicle
                  </Link>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type {!selectedFleetVehicleId && '*'}
              </label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g., Tata Ace, Chhota Hathi, 14ft Truck"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                disabled={!!selectedFleetVehicleId}
              />
              {selectedFleetVehicleId && (
                <p className="text-xs text-gray-500 mt-1">Auto-filled from selected fleet vehicle</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Vehicles
              </label>
              <input
                type="number"
                value={vehicleCount}
                onChange={(e) => setVehicleCount(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Packing Materials Description (Optional)
            </label>
            <textarea
              value={packingMaterials}
              onChange={(e) => setPackingMaterials(e.target.value)}
              placeholder="e.g., Bubble wrap, carton boxes, foam sheets, packing tape, etc."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-cyan-600" />
              Pricing Breakdown
            </h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button type="button" onClick={() => setQuickQuoteMode(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${!quickQuoteMode ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500'}`}>
                Itemized
              </button>
              <button type="button" onClick={() => setQuickQuoteMode(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${quickQuoteMode ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500'}`}>
                Quick Quote
              </button>
            </div>
          </div>

          {quickQuoteMode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Quote Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={quickTotalPrice}
                  onChange={(e) => setQuickTotalPrice(e.target.value)}
                  placeholder="Enter your all-inclusive total price"
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 text-lg font-semibold"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter one total price including all charges</p>
            </div>
          ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Packing Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={packingCharges}
                  onChange={(e) => setPackingCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Packing Materials Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={materialCharges}
                  onChange={(e) => setMaterialCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transportation Charges *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={transportCharges}
                  onChange={(e) => setTransportCharges(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  required
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
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unpacking Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={unpackingCharges}
                  onChange={(e) => setUnpackingCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            {request.needStorage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Charges ({request.storageDays} days)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={storageCharges}
                    onChange={(e) => setStorageCharges(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}
            {request.needInsurance && (
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
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={gstAmount}
                  onChange={(e) => setGstAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const subtotal = calculateSubtotal();
                  const gst = Math.round(subtotal * 0.05);
                  setGstAmount(gst.toString());
                }}
                className="text-xs text-cyan-600 hover:underline mt-1"
              >
                Calculate 5% GST
              </button>
            </div>
          </div>
          )}

          {/* Advance & Validity — shown in both modes */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Payment
              </label>
              <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5">
                <button type="button" onClick={() => setAdvanceMode('percent')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${advanceMode === 'percent' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500'}`}>
                  By Percentage
                </button>
                <button type="button" onClick={() => setAdvanceMode('manual')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${advanceMode === 'manual' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-500'}`}>
                  Custom Amount
                </button>
              </div>
              {advanceMode === 'percent' ? (
                <div className="flex items-center gap-3">
                  <select
                    value={advancePercent}
                    onChange={(e) => setAdvancePercent(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
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
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={customAdvanceAmount}
                    onChange={(e) => setCustomAdvanceAmount(e.target.value)}
                    placeholder="Enter advance amount"
                    min="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              )}
            </div>
          </div>

          {advanceExceedsTotal && (
            <p className="text-xs text-red-600 mt-1 font-medium">Advance amount cannot exceed total price</p>
          )}

          {/* Total */}
          <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-cyan-800">Total Quote Amount</span>
              <span className="text-2xl font-bold text-cyan-600">
                ₹{calculateTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-700">Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Custom)'}</span>
              <span className="font-semibold text-cyan-600">
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
              className="text-sm text-cyan-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
              className="text-sm text-cyan-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
              className="text-sm text-cyan-600 hover:underline flex items-center gap-1"
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
                <span className="text-cyan-500 font-bold">{idx + 1}.</span>
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => addItem(termsConditions, setTermsConditions)}
                className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  required
                />
                <input
                  type="time"
                  value={validUntilTime}
                  onChange={(e) => setValidUntilTime(e.target.value)}
                  className="w-[130px] px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/packers/requests"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || calculateTotal() === 0 || advanceExceedsTotal}
            className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
