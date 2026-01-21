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
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  chauffeur_vehicle_categories: string;
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
  vehicle_models: {
    id: string;
    name: string;
    brand: { id: string; name: string } | null;
  } | null;
  chauffeur_vehicle_categories: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  service: { id: string; name: string; slug: string } | null;
}

interface Template {
  id: string;
  name: string;
  category: string;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  ratePerKm?: number;
}

export default function SendTransporterQuotePage() {
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
  const [advancePercent, setAdvancePercent] = useState('50');
  const [inclusions, setInclusions] = useState<string[]>(TRANSPORTER_CONFIG.defaultInclusions);
  const [exclusions, setExclusions] = useState<string[]>(TRANSPORTER_CONFIG.defaultExclusions);
  const [termsConditions, setTermsConditions] = useState<string[]>(TRANSPORTER_CONFIG.defaultTerms);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchRequestDetails();
  }, [params.id]);

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/truck-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest({
          id: data.request.id,
          requestNumber: data.request.requestNumber,
          serviceType: data.request.serviceType,
          chauffeur_vehicle_categories: data.request.vehicle_category || data.request.vehicleCategoryName,
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

        if (data.request.requiresLabour) {
          setLabourIncluded(true);
          setLabourCount(data.request.labourCount?.toString() || '2');
        }
      }

      // Fetch templates
      try {
        const templateRes = await fetch('/api/vendor/truck-templates');
        const templateData = await templateRes.json();
        if (templateData.success && templateData.templates) {
          setTemplates(templateData.templates);
        }
      } catch (templateError) {
        console.error('Failed to fetch templates:', templateError);
      }

      // Fetch vendor's fleet
      try {
        const fleetRes = await fetch('/api/vendor/fleet');
        const fleetData = await fleetRes.json();
        if (fleetData.success && fleetData.fleet) {
          const truckFleet = fleetData.fleet.filter((v: FleetVehicle) => {
            const svc = (v as any).services || v.service;
            const slug = svc?.slug?.toLowerCase() || '';
            const name = svc?.name?.toLowerCase() || '';
            return slug.includes('truck') || name.includes('truck') || slug.includes('transporter');
          });
          setFleetVehicles(truckFleet);
        }
      } catch (fleetError) {
        console.error('Failed to fetch fleet:', fleetError);
      }

      const defaultValidity = new Date(Date.now() + 3 * 86400000);
      setValidUntil(defaultValidity.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
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
    if (template.ratePerKm) {
      setPerKmRate(template.ratePerKm.toString());
    }
  };

  const clearTemplate = () => {
    setSelectedTemplateId(null);
    setInclusions([]);
    setExclusions([]);
    setTermsConditions([]);
    setPerKmRate('');
  };

  const handleFleetSelection = (fleetId: string) => {
    setSelectedFleetId(fleetId);
    if (fleetId === '') {
      setVehicleName('');
      setVehicleNumber('');
      return;
    }

    const selectedVehicle = fleetVehicles.find(v => v.id === fleetId);
    if (selectedVehicle) {
      let vName = '';
      if (selectedVehicle.vehicle_models) {
        vName = selectedVehicle.vehicle_models.brand?.name
          ? `${selectedVehicle.vehicle_models.brand.name} ${selectedVehicle.vehicle_models.name}`
          : selectedVehicle.vehicle_models.name;
      } else if (selectedVehicle.brand && selectedVehicle.vehicle_category) {
        vName = `${selectedVehicle.brand.name} ${selectedVehicle.vehicle_category.name}`;
      } else if (selectedVehicle.vehicle_category) {
        vName = selectedVehicle.vehicle_category.name;
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
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 50;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/vendor/truck-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request?.id || params.id,
          templateId: selectedTemplateId,
          fleetId: selectedFleetId || null,
          chauffeur_vehicle_categories: request?.vehicle_category,
          vehicleName: vehicleName || request?.vehicle_category,
          vehicleNumber: vehicleNumber || null,
          vehicleCapacity: vehicleCapacity || null,
          labourIncluded,
          labourCount: labourIncluded ? parseInt(labourCount) || 0 : 0,
          labourCharges: labourIncluded ? parseFloat(labourCharges) || 0 : 0,
          baseAmount: parseFloat(baseAmount) || 0,
          perKmRate: perKmRate ? parseFloat(perKmRate) : null,
          loadingCharges: parseFloat(loadingCharges) || 0,
          unloadingCharges: parseFloat(unloadingCharges) || 0,
          tollEstimate: parseFloat(tollCharges) || 0,
          packagingCharges: parseFloat(packagingCharges) || 0,
          insuranceCharges: parseFloat(insuranceCharges) || 0,
          advanceAmount: calculateAdvance(),
          advancePercent: parseInt(advancePercent) || 50,
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
        router.push('/vendor/transporter/quotes');
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
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/transporter/requests" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-indigo-500" />
            Send Quote
          </h1>
          <p className="text-gray-600">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h3 className="font-semibold text-indigo-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.vehicle_category}</p>
              <p className="text-sm text-gray-600">{request.serviceType}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.goodsType}</p>
              {request.goodsDescription && (
                <p className="text-sm text-gray-600">{request.goodsDescription}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.pickupCity} → {request.dropCity}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {new Date(request.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {request.pickupTime && <p className="text-sm text-gray-600">Pickup: {request.pickupTime}</p>}
            </div>
          </div>
          {request.estimatedWeight && (
            <div className="flex items-start gap-3">
              <Weight className="w-5 h-5 text-indigo-600 mt-0.5" />
              <p className="font-medium text-gray-900">Weight: {request.estimatedWeight} kg</p>
            </div>
          )}
          {request.requiresLabour && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-indigo-600 mt-0.5" />
              <p className="font-medium text-gray-900">Labour Required: {request.labourCount || 'Not specified'}</p>
            </div>
          )}
          {request.specialRequirements && (
            <div className="flex items-start gap-3 md:col-span-2">
              <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
              <p className="text-sm text-gray-600">{request.specialRequirements}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        {templates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                Select Template (Optional)
              </h2>
              {selectedTemplateId && (
                <button type="button" onClick={clearTemplate} className="text-sm text-red-600 hover:underline">
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
                    selectedTemplateId === template.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {selectedTemplateId === template.id && <CheckCircle className="w-5 h-5 text-indigo-500" />}
                  </div>
                  <p className="text-xs text-gray-500">{template.inclusions.length} inclusions</p>
                  {template.ratePerKm && (
                    <p className="text-sm text-indigo-600 mt-1">Rate: ₹{template.ratePerKm}/km</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-500" />
            Vehicle Details
          </h2>

          {fleetVehicles.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select from your fleet</label>
              <select
                value={selectedFleetId}
                onChange={(e) => handleFleetSelection(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Select a vehicle or enter manually below --</option>
                {fleetVehicles.map((vehicle) => {
                  let displayName = vehicle.vehicle_models?.name || vehicle.vehicle_category?.name || 'Vehicle';
                  const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';
                  return (
                    <option key={vehicle.id} value={vehicle.id}>{displayName}{regNum}</option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name/Model</label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => { setVehicleName(e.target.value); setSelectedFleetId(''); }}
                placeholder="e.g., Tata 407"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => { setVehicleNumber(e.target.value.toUpperCase()); setSelectedFleetId(''); }}
                placeholder="e.g., GJ 01 AB 1234"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Capacity</label>
              <input
                type="text"
                value={vehicleCapacity}
                onChange={(e) => setVehicleCapacity(e.target.value)}
                placeholder="e.g., 3 ton"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Labour Details */}
        {request.requiresLabour && (
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Labour Details
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labourIncluded}
                  onChange={(e) => setLabourIncluded(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Include Labour</span>
              </label>
            </div>
            {labourIncluded && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Labour</label>
                  <input
                    type="number"
                    value={labourCount}
                    onChange={(e) => setLabourCount(e.target.value)}
                    placeholder="2"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labour Charges</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={labourCharges}
                      onChange={(e) => setLabourCharges(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            <IndianRupee className="w-5 h-5 text-indigo-500" />
            Pricing
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per KM Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={perKmRate}
                  onChange={(e) => setPerKmRate(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loading Charges</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={loadingCharges}
                  onChange={(e) => setLoadingCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unloading Charges</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={unloadingCharges}
                  onChange={(e) => setUnloadingCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toll/Permit Charges</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={tollCharges}
                  onChange={(e) => setTollCharges(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Advance (%)</label>
              <div className="flex items-center gap-3">
                <select
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(e.target.value)}
                  className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="30">30%</option>
                  <option value="50">50%</option>
                  <option value="100">100%</option>
                </select>
                <span className="text-gray-600">= ₹{calculateAdvance().toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-indigo-800">Total Quote Amount</span>
              <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal().toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-indigo-700">Advance ({advancePercent}%)</span>
              <span className="font-semibold text-indigo-600">₹{calculateAdvance().toLocaleString()}</span>
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
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'inclusions' ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {inclusions.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                {item}
                {editMode === 'inclusions' && (
                  <button type="button" onClick={() => removeItem(inclusions, setInclusions, item)} className="hover:text-green-900">
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button type="button" onClick={() => addItem(inclusions, setInclusions)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
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
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'exclusions' ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {exclusions.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
                {item}
                {editMode === 'exclusions' && (
                  <button type="button" onClick={() => removeItem(exclusions, setExclusions, item)} className="hover:text-red-900">
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button type="button" onClick={() => addItem(exclusions, setExclusions)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Terms & Conditions ({termsConditions.length})</h2>
            <button
              type="button"
              onClick={() => setEditMode(editMode === 'terms' ? null : 'terms')}
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'terms' ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="space-y-2">
            {termsConditions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                <span className="flex-1 text-sm text-gray-700">{item}</span>
                {editMode === 'terms' && (
                  <button type="button" onClick={() => removeItem(termsConditions, setTermsConditions, item)} className="text-gray-400 hover:text-red-500">
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button type="button" onClick={() => addItem(termsConditions, setTermsConditions)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Customer</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Valid Until *</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/transporter/requests"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !baseAmount || calculateTotal() === 0}
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Quote ({calculateTotal().toLocaleString()})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
