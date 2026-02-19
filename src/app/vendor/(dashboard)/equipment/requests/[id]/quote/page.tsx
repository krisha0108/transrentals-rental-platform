'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  X,
  FileSpreadsheet,
  IndianRupee,
  Edit3,
  AlertCircle,
  User,
  Package,
} from 'lucide-react';
import { EQUIPMENT_CONFIG } from '@/lib/quote-services';

interface QuoteRequest {
  id: string;
  requestNumber: string;
  equipmentCategory: string;
  equipmentType: string;
  specificModel?: string;
  quantity: number;
  rentalDuration: number;
  durationUnit: string;
  city: string;
  deliveryAddress?: string;
  startDate: string;
  endDate?: string;
  needOperator?: boolean;
  requirements?: string;
  customerName?: string;
  customerPhone?: string;
}

interface FleetEquipment {
  id: string;
  registrationNumber: string | null;
  // Fleet API uses vehicle_model for equipment models too
  vehicle_models: {
    id: string;
    name: string;
    brands: {
      id: string;
      name: string;
    } | null;
  } | null;
  // equipmentModel alias (for backward compatibility)
  equipmentModel?: {
    id: string;
    name: string;
    brands: {
      id: string;
      name: string;
    } | null;
  } | null;
  // Fleet API uses vehicle_category
  chauffeur_vehicle_categories: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  // equipmentCategory alias (for backward compatibility)
  equipmentCategory?: {
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
  dailyRateHint?: number;
  weeklyRateHint?: number;
  monthlyRateHint?: number;
}

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Daily Rental',
    category: 'daily',
    inclusions: [
      'Equipment in working condition',
      'Trained operator',
      'Basic maintenance',
      'Safety gear',
    ],
    exclusions: [
      'Fuel/electricity consumption',
      'Transportation to site',
      'Damage repairs',
      'Overtime charges',
    ],
    termsConditions: [
      'Security deposit required',
      'Daily/weekly/monthly rates available',
      'Minimum booking period applies',
      'Equipment to be used as intended',
    ],
    baseRateHint: 5000,
    dailyRateHint: 5000,
  },
  {
    id: '2',
    name: 'Weekly Rental',
    category: 'weekly',
    inclusions: [
      'Equipment with operator',
      'Weekly maintenance',
      'Safety equipment',
      'Technical support',
    ],
    exclusions: [
      'Fuel costs',
      'Site transport',
      'Repairs due to misuse',
      'Extra hours',
    ],
    termsConditions: [
      '50% advance required',
      'Balance before delivery',
      'Weekly inspection',
      'Minimum 1 week booking',
    ],
    baseRateHint: 30000,
    weeklyRateHint: 30000,
  },
];

export default function SendEquipmentQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [fleetEquipment, setFleetEquipment] = useState<FleetEquipment[]>([]);
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = EQUIPMENT_CONFIG;

  // Quote form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('');

  // Pricing fields
  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [deliveryCharges, setDeliveryCharges] = useState('');
  const [operatorCharges, setOperatorCharges] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30'); // Default 30% advance

  // Rental period
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [rentalDays, setRentalDays] = useState(0);

  // Lists
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

  useEffect(() => {
    if (rentalStartDate && rentalEndDate) {
      const start = new Date(rentalStartDate);
      const end = new Date(rentalEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRentalDays(diffDays || 1);
    }
  }, [rentalStartDate, rentalEndDate]);

  const fetchRequestDetails = async () => {
    try {
      // Fetch the quote request details
      const response = await fetch(`/api/vendor/equipment-quote-requests/${params.id}`);
      const data = await response.json();

      if (data.success && data.request) {
        setRequest({
          id: data.request.id,
          requestNumber: data.request.requestNumber,
          equipmentCategory: data.request.equipmentCategory,
          equipmentType: data.request.equipmentType,
          specificModel: data.request.specificModel,
          quantity: data.request.quantity,
          rentalDuration: data.request.rentalDuration,
          durationUnit: data.request.durationUnit,
          city: data.request.city,
          deliveryAddress: data.request.deliveryAddress,
          startDate: data.request.startDate,
          endDate: data.request.endDate,
          needOperator: data.request.needOperator,
          requirements: data.request.requirements,
          customerName: data.request.customerName,
          customerPhone: data.request.customerPhone,
        });

        // Pre-fill dates from request
        if (data.request.startDate) {
          setRentalStartDate(new Date(data.request.startDate).toISOString().split('T')[0]);
        }
        if (data.request.endDate) {
          setRentalEndDate(new Date(data.request.endDate).toISOString().split('T')[0]);
        }

        // Pre-fill equipment details
        setEquipmentName(data.request.equipmentType);
        setEquipmentCategory(data.request.equipmentCategory);
        if (data.request.specificModel) {
          setEquipmentModel(data.request.specificModel);
        }
      }

      // Fetch templates
      try {
        const templateRes = await fetch('/api/vendor/equipment-templates');
        const templateData = await templateRes.json();
        if (templateData.success && templateData.templates) {
          setTemplates(templateData.templates);
        } else {
          setTemplates(SAMPLE_TEMPLATES);
        }
      } catch (err) {
        setTemplates(SAMPLE_TEMPLATES);
      }

      // Fetch vendor's fleet for equipment (with availability check)
      try {
        let fleetUrl = '/api/vendor/fleet';
        if (data.request?.startDate) {
          const startDate = new Date(data.request.startDate).toISOString();
          const endDate = data.request.endDate
            ? new Date(data.request.endDate).toISOString()
            : startDate;
          fleetUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        }
        const fleetRes = await fetch(fleetUrl);
        const fleetData = await fleetRes.json();
        if (fleetData.success && fleetData.fleet) {
          // Filter for equipment rental vehicles only
          const equipFleet = fleetData.fleet.filter((v: FleetEquipment) => {
            if (!v.isActive) return false;
            const svc = v.services;
            const slug = svc?.slug?.toLowerCase() || '';
            const name = svc?.name?.toLowerCase() || '';
            return slug.includes('equipment') || name.includes('equipment');
          });
          // Sort: available equipment first, unavailable at the end
          equipFleet.sort((a: FleetEquipment, b: FleetEquipment) => {
            const aUnavail = a.isAvailableForDates === false ? 1 : 0;
            const bUnavail = b.isAvailableForDates === false ? 1 : 0;
            return aUnavail - bUnavail;
          });
          setFleetEquipment(equipFleet);
        }
      } catch (fleetError) {
        console.error('Failed to fetch fleet:', fleetError);
      }

      // Set default validity (3 days from now)
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
    if (template.baseRateHint || template.dailyRateHint) {
      setDailyRate((template.baseRateHint || template.dailyRateHint || 0).toString());
    }
    if (template.weeklyRateHint) {
      setWeeklyRate(template.weeklyRateHint.toString());
    }
    if (template.monthlyRateHint) {
      setMonthlyRate(template.monthlyRateHint.toString());
    }
  };

  const clearTemplate = () => {
    setSelectedTemplateId(null);
    setInclusions([]);
    setExclusions([]);
    setTermsConditions([]);
    setDailyRate('');
    setWeeklyRate('');
    setMonthlyRate('');
    setDeliveryCharges('');
    setOperatorCharges('');
    setSecurityDeposit('');
  };

  // Handle fleet equipment selection
  const handleFleetSelection = (fleetId: string) => {
    setSelectedFleetId(fleetId);

    if (fleetId === '') {
      setEquipmentName('');
      setEquipmentModel('');
      return;
    }

    const selectedEquip = fleetEquipment.find(v => v.id === fleetId);
    if (selectedEquip) {
      // Set equipment name from model or category
      // Fleet API uses vehicle_model and vehicle_category for equipment too
      // Also check for equipmentModel/equipmentCategory for backward compatibility
      let eName = '';
      let eModel = '';

      const modelData = selectedEquip.vehicle_models || selectedEquip.equipmentModel;
      const categoryData = selectedEquip.chauffeur_vehicle_categories || selectedEquip.equipmentCategory;

      if (modelData) {
        // Get name from model with brand
        eName = modelData.brands?.name
          ? `${modelData.brands.name} ${modelData.name}`
          : modelData.name;
        // Model is the equipment model name
        eModel = modelData.name || '';
      } else if (selectedEquip.brands && categoryData) {
        eName = `${selectedEquip.brands.name} ${categoryData.name}`;
        eModel = selectedEquip.brands.name || '';
      } else if (categoryData) {
        eName = categoryData.name;
      }

      // Use registration number as model
      if (selectedEquip.registrationNumber) {
        eModel = selectedEquip.registrationNumber;
      }

      setEquipmentName(eName);
      setEquipmentModel(eModel);

      // Set category from fleet if available
      if (categoryData?.name) {
        setEquipmentCategory(categoryData.name);
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
    let baseAmount = 0;

    // Calculate base amount based on rental duration
    if (request?.durationUnit === 'DAY' || request?.durationUnit === 'DAYS') {
      baseAmount = (parseFloat(dailyRate) || 0) * (rentalDays || 1);
    } else if (request?.durationUnit === 'WEEK' || request?.durationUnit === 'WEEKS') {
      baseAmount = parseFloat(weeklyRate) || 0;
    } else if (request?.durationUnit === 'MONTH' || request?.durationUnit === 'MONTHS') {
      baseAmount = parseFloat(monthlyRate) || 0;
    } else {
      // Default to daily rate
      baseAmount = (parseFloat(dailyRate) || 0) * (rentalDays || 1);
    }

    const delivery = parseFloat(deliveryCharges) || 0;
    const operator = parseFloat(operatorCharges) || 0;

    return baseAmount + delivery + operator;
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
      const response = await fetch('/api/vendor/equipment-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request?.id || params.id,
          templateId: selectedTemplateId,
          fleetId: selectedFleetId || null,
          equipmentCategory: equipmentCategory || request?.equipmentCategory,
          equipmentName: equipmentName || request?.equipmentType,
          equipmentModel: equipmentModel || null,
          quantity: request?.quantity || 1,
          dailyRate: parseFloat(dailyRate) || 0,
          weeklyRate: parseFloat(weeklyRate) || 0,
          monthlyRate: parseFloat(monthlyRate) || 0,
          deliveryCharges: parseFloat(deliveryCharges) || 0,
          operatorCharges: parseFloat(operatorCharges) || 0,
          securityDeposit: parseFloat(securityDeposit) || 0,
          rentalStartDate,
          rentalEndDate,
          rentalDays,
          totalAmount: calculateTotal(),
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
        router.push('/vendor/equipment/quotes');
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

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id;
  };

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/equipment/requests"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-amber-500" />
            Send Equipment Quote
          </h1>
          <p className="text-gray-600">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <h3 className="font-semibold text-amber-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.equipmentType}</p>
              <p className="text-sm text-gray-600">{getCategoryName(request.equipmentCategory)}</p>
              {request.specificModel && (
                <p className="text-xs text-gray-500">Model: {request.specificModel}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
              <p className="text-sm text-gray-600">
                Duration: {request.rentalDuration} {request.durationUnit?.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.city}</p>
              {request.deliveryAddress && (
                <p className="text-sm text-gray-600">{request.deliveryAddress}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">
                {new Date(request.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {request.endDate && (
                  <span className="text-gray-600">
                    {' → '}
                    {new Date(request.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
          {request.needOperator && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Operator Required</p>
              </div>
            </div>
          )}
          {request.requirements && (
            <div className="md:col-span-2 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">{request.requirements}</p>
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
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
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
                className={`p-4 rounded-lg border-2 text-left transition ${
                  selectedTemplateId === template.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {selectedTemplateId === template.id && (
                    <CheckCircle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {template.inclusions.length} inclusions • {template.exclusions.length} exclusions
                </p>
                {(template.baseRateHint || template.dailyRateHint || template.weeklyRateHint || template.monthlyRateHint) && (
                  <p className="text-sm text-amber-600 mt-1">
                    {(template.baseRateHint || template.dailyRateHint) && `Daily: ₹${(template.baseRateHint || template.dailyRateHint)!.toLocaleString()}`}
                    {template.weeklyRateHint && ` Weekly: ₹${template.weeklyRateHint.toLocaleString()}`}
                    {template.monthlyRateHint && ` Monthly: ₹${template.monthlyRateHint.toLocaleString()}`}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Equipment Details
          </h2>

          {/* Fleet Equipment Dropdown */}
          {fleetEquipment.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select from your fleet
              </label>
              <select
                value={selectedFleetId}
                onChange={(e) => handleFleetSelection(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">-- Select equipment from fleet (or enter manually below) --</option>
                {fleetEquipment.map((equipment) => {
                  // Fleet API uses vehicle_model and vehicle_category for equipment too
                  // Also check for equipmentModel/equipmentCategory for backward compatibility
                  const modelData = equipment.vehicle_models || equipment.equipmentModel;
                  const categoryData = equipment.chauffeur_vehicle_categories || equipment.equipmentCategory;
                  let displayName = '';
                  if (modelData) {
                    displayName = modelData.brands?.name
                      ? `${modelData.brands.name} ${modelData.name}`
                      : modelData.name;
                  } else if (equipment.brands && categoryData) {
                    displayName = `${equipment.brands.name} ${categoryData.name}`;
                  } else if (categoryData) {
                    displayName = categoryData.name;
                  }

                  const regNum = equipment.registrationNumber ? ` (${equipment.registrationNumber})` : '';

                  const isUnavailable = equipment.isAvailableForDates === false;

                  return (
                    <option key={equipment.id} value={equipment.id} disabled={isUnavailable}>
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
                Equipment Name *
              </label>
              <input
                type="text"
                value={equipmentName}
                onChange={(e) => {
                  setEquipmentName(e.target.value);
                  setSelectedFleetId('');
                }}
                placeholder="e.g., Mobile Crane 20 Ton"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Registration Number
              </label>
              <input
                type="text"
                value={equipmentModel}
                onChange={(e) => {
                  setEquipmentModel(e.target.value.toUpperCase());
                  setSelectedFleetId('');
                }}
                placeholder="e.g., GJ87YH6534"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Category *
              </label>
              <select
                value={equipmentCategory}
                onChange={(e) => setEquipmentCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                required
              >
                <option value="">Select category</option>
                {config.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rental Period */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Rental Period
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={rentalStartDate}
                onChange={(e) => setRentalStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={rentalEndDate}
                onChange={(e) => setRentalEndDate(e.target.value)}
                min={rentalStartDate}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Days
              </label>
              <input
                type="number"
                value={rentalDays}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-amber-500" />
            Pricing
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Rate *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={weeklyRate}
                  onChange={(e) => setWeeklyRate(e.target.value)}
                  placeholder="30000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(e.target.value)}
                  placeholder="100000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={deliveryCharges}
                  onChange={(e) => setDeliveryCharges(e.target.value)}
                  placeholder="2000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            {request.needOperator && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator Charges (per day)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={operatorCharges}
                    onChange={(e) => setOperatorCharges(e.target.value)}
                    placeholder="1000"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
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
                  className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
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
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-amber-800">Total Quote Amount</span>
              <span className="text-2xl font-bold text-amber-600">
                ₹{calculateTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-700">Advance Payment ({advancePercent}%)</span>
              <span className="font-semibold text-amber-600">
                ₹{calculateAdvance().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Balance (on completion)</span>
              <span className="text-gray-700">
                ₹{(calculateTotal() - calculateAdvance()).toLocaleString()}
              </span>
            </div>
            {securityDeposit && (
              <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-amber-200">
                <span className="text-gray-600">Security Deposit (Refundable)</span>
                <span className="text-gray-700">
                  ₹{parseFloat(securityDeposit).toLocaleString()}
                </span>
              </div>
            )}
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
              className="text-sm text-amber-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
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
              className="text-sm text-amber-600 hover:underline flex items-center gap-1"
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
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
              className="text-sm text-amber-600 hover:underline flex items-center gap-1"
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
                <span className="text-amber-500 font-bold">{idx + 1}.</span>
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
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => addItem(termsConditions, setTermsConditions)}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/equipment/requests"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !dailyRate || calculateTotal() === 0}
            className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
