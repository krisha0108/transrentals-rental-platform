'use client';

import { useState, useEffect, useRef } from 'react';
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
  needInstallation?: boolean;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

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
  const [installationCharges, setInstallationCharges] = useState('');
  const [gstAmount, setGstAmount] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30'); // Default 30% advance
  const [advanceMode, setAdvanceMode] = useState<'percent' | 'manual'>('percent');
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');

  // Rental period
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [rentalDays, setRentalDays] = useState(0);

  // Lists
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quickQuoteMode, setQuickQuoteMode] = useState(false);
  const [quickTotalPrice, setQuickTotalPrice] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [validUntilTime, setValidUntilTime] = useState('23:59');
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);

  // Input states
  const [newItem, setNewItem] = useState('');

  // Refs for validation scroll + focus
  const equipmentNameRef = useRef<HTMLInputElement>(null);
  const equipmentModelRef = useRef<HTMLInputElement>(null);
  const quickTotalPriceRef = useRef<HTMLInputElement>(null);
  const dailyRateRef = useRef<HTMLInputElement>(null);
  const deliveryChargesRef = useRef<HTMLInputElement>(null);
  const operatorChargesRef = useRef<HTMLInputElement>(null);
  const securityDepositRef = useRef<HTMLInputElement>(null);
  const customAdvanceAmountRef = useRef<HTMLInputElement>(null);
  const validUntilRef = useRef<HTMLInputElement>(null);

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
          needInstallation: data.request.needInstallation,
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
    if (quickQuoteMode) return parseFloat(quickTotalPrice) || 0;
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
    const installation = parseFloat(installationCharges) || 0;
    const gst = parseFloat(gstAmount) || 0;

    return baseAmount + delivery + operator + installation + gst;
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
    if (!equipmentName.trim()) newErrors.equipmentName = 'Equipment name is required';
    if (!equipmentModel.trim()) newErrors.equipmentModel = 'Equipment model/type is required';
    if (quickQuoteMode) {
      if (!quickTotalPrice || parseFloat(quickTotalPrice) <= 0) newErrors.quickTotalPrice = 'Total price must be greater than 0';
    } else {
      if (!dailyRate || parseFloat(dailyRate) <= 0) newErrors.dailyRate = 'Daily rate is required and must be greater than 0';
      // Only demand a charge the vendor can actually see. Operator charges are
      // rendered behind request.needOperator, so requiring them unconditionally
      // left the form unsubmittable on every request that did not want an
      // operator: no input to fill, yet validation kept failing on it. Keying
      // off the mounted input keeps that in step automatically if any of these
      // fields become conditional later. The payload already coerces a blank to
      // 0, so skipping the check does not change what gets stored.
      if (deliveryChargesRef.current && deliveryCharges === '') newErrors.deliveryCharges = 'Delivery charges required (enter 0 if not applicable)';
      if (operatorChargesRef.current && operatorCharges === '') newErrors.operatorCharges = 'Operator charges required (enter 0 if not applicable)';
      if (securityDepositRef.current && securityDeposit === '') newErrors.securityDeposit = 'Security deposit required (enter 0 if not applicable)';
    }
    if (!validUntil) newErrors.validUntil = 'Quote validity date is required';
    if (advanceMode === 'manual' && customAdvanceAmount) {
      const adv = parseFloat(customAdvanceAmount) || 0;
      const total = calculateTotal();
      if (total > 0 && adv > total) newErrors.customAdvanceAmount = 'Advance amount cannot exceed total price';
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setApiError('');
      return true;
    }

    // Fields in the order they appear on the form, so "first problem" is the
    // topmost one and the page scrolls upward rather than jumping about.
    const FIELD_ORDER: { key: string; label: string; ref: React.RefObject<HTMLInputElement> }[] = [
      { key: 'equipmentName', label: 'Equipment Name', ref: equipmentNameRef },
      { key: 'equipmentModel', label: 'Equipment Model / Type', ref: equipmentModelRef },
      { key: 'quickTotalPrice', label: 'Total Price', ref: quickTotalPriceRef },
      { key: 'dailyRate', label: 'Daily Rate', ref: dailyRateRef },
      { key: 'deliveryCharges', label: 'Delivery Charges', ref: deliveryChargesRef },
      { key: 'operatorCharges', label: 'Operator Charges', ref: operatorChargesRef },
      { key: 'securityDeposit', label: 'Security Deposit', ref: securityDepositRef },
      { key: 'customAdvanceAmount', label: 'Advance Amount', ref: customAdvanceAmountRef },
      { key: 'validUntil', label: 'Quote Validity', ref: validUntilRef },
    ];

    const problems = FIELD_ORDER.filter((f) => newErrors[f.key]);
    // Anything without a ref still has to be reported, or the vendor is left
    // pressing Send Quote with nothing happening at all.
    const unlisted = Object.keys(newErrors).filter((k) => !FIELD_ORDER.some((f) => f.key === k));

    const lines = [
      ...problems.map((f) => `• ${f.label} — ${newErrors[f.key]}`),
      ...unlisted.map((k) => `• ${newErrors[k]}`),
    ];

    const summary =
      lines.length === 1
        ? `${problems[0]?.label ?? 'One field'} needs attention.`
        : `${lines.length} fields need attention before the quote can be sent.`;

    setApiError(summary);

    // Blocking alert first — it is the only thing a vendor cannot scroll past —
    // then move the cursor into the offending field once it is dismissed.
    alert(`Cannot send quote yet\n\n${lines.join('\n')}`);

    const target = problems.find((f) => f.ref.current);
    if (target && target.ref.current) {
      window.setTimeout(() => {
        target.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.ref.current?.focus();
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;
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
          dailyRate: quickQuoteMode ? (parseFloat(quickTotalPrice) || 0) : (parseFloat(dailyRate) || 0),
          weeklyRate: quickQuoteMode ? 0 : (parseFloat(weeklyRate) || 0),
          monthlyRate: quickQuoteMode ? 0 : (parseFloat(monthlyRate) || 0),
          deliveryCharges: quickQuoteMode ? 0 : (parseFloat(deliveryCharges) || 0),
          operatorCharges: quickQuoteMode ? 0 : (parseFloat(operatorCharges) || 0),
          securityDeposit: quickQuoteMode ? 0 : (parseFloat(securityDeposit) || 0),
          installationCharges: quickQuoteMode ? 0 : (parseFloat(installationCharges) || 0),
          gstAmount: quickQuoteMode ? 0 : (parseFloat(gstAmount) || 0),
          rentalStartDate,
          rentalEndDate,
          rentalDays,
          totalAmount: calculateTotal(),
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
        setTimeout(() => router.push('/vendor/equipment/quotes'), 2000);
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

  const getCategoryName = (id: string) => {
    return config.categories.find((c) => c.id === id)?.shortName || id;
  };

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
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
            <Send className="w-6 h-6 text-emerald-500" />
            Send Equipment Quote
          </h1>
          <p className="text-gray-600">#{request.requestNumber}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <h3 className="font-semibold text-emerald-800 mb-3">Request Summary</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.equipmentType}</p>
              <p className="text-sm text-gray-600">{getCategoryName(request.equipmentCategory)}</p>
              {request.specificModel && (
                <p className="text-xs text-gray-500">Model: {request.specificModel}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
              <p className="text-sm text-gray-600">
                Duration: {request.rentalDuration} {request.durationUnit?.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">{request.city}</p>
              {request.deliveryAddress && (
                <p className="text-sm text-gray-600">{request.deliveryAddress}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
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
              <User className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm text-emerald-600 font-medium">Operator Required</p>
              </div>
            </div>
          )}
          {request.requirements && (
            <div className="md:col-span-2 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">{request.requirements}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="flex-1 text-sm text-red-700 font-medium">{apiError}</p>
          <button type="button" onClick={() => setApiError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
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
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {selectedTemplateId === template.id && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {template.inclusions.length} inclusions • {template.exclusions.length} exclusions
                </p>
                {(template.baseRateHint || template.dailyRateHint || template.weeklyRateHint || template.monthlyRateHint) && (
                  <p className="text-sm text-emerald-600 mt-1">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-500" />
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
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
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={equipmentNameRef}
                type="text"
                value={equipmentName}
                data-error={!!errors.equipmentName}
                onChange={(e) => {
                  setEquipmentName(e.target.value);
                  setSelectedFleetId('');
                  if (errors.equipmentName) setErrors(prev => ({ ...prev, equipmentName: '' }));
                }}
                placeholder="e.g., Mobile Crane 20 Ton"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.equipmentName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.equipmentName && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.equipmentName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                ref={equipmentModelRef}
                type="text"
                value={equipmentModel}
                data-error={!!errors.equipmentModel}
                onChange={(e) => {
                  setEquipmentModel(e.target.value.toUpperCase());
                  setSelectedFleetId('');
                  if (errors.equipmentModel) setErrors(prev => ({ ...prev, equipmentModel: '' }));
                }}
                placeholder="e.g., GJ87YH6534"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 uppercase ${errors.equipmentModel ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.equipmentModel && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.equipmentModel}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Category *
              </label>
              <select
                value={equipmentCategory}
                onChange={(e) => setEquipmentCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              Pricing
            </h2>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button type="button" onClick={() => setQuickQuoteMode(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${!quickQuoteMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
                Itemized
              </button>
              <button type="button" onClick={() => setQuickQuoteMode(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${quickQuoteMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
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
                  ref={quickTotalPriceRef}
                  type="number"
                  value={quickTotalPrice}
                  data-error={!!errors.quickTotalPrice}
                  onChange={(e) => {
                    setQuickTotalPrice(e.target.value);
                    if (errors.quickTotalPrice) setErrors(prev => ({ ...prev, quickTotalPrice: '' }));
                  }}
                  placeholder="Enter your all-inclusive total price"
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg font-semibold ${errors.quickTotalPrice ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
              </div>
              {errors.quickTotalPrice ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.quickTotalPrice}</p> : <p className="text-xs text-gray-500 mt-1">Enter one total price including all charges</p>}
            </div>
          ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Rate *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  ref={dailyRateRef}
                  type="number"
                  value={dailyRate}
                  data-error={!!errors.dailyRate}
                  onChange={(e) => {
                    setDailyRate(e.target.value);
                    if (errors.dailyRate) setErrors(prev => ({ ...prev, dailyRate: '' }));
                  }}
                  placeholder="5000"
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.dailyRate ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
              </div>
              {errors.dailyRate && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.dailyRate}</p>}
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
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Charges <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  ref={deliveryChargesRef}
                  type="number"
                  value={deliveryCharges}
                  data-error={!!errors.deliveryCharges}
                  onChange={(e) => { setDeliveryCharges(e.target.value); if (errors.deliveryCharges) setErrors(prev => ({ ...prev, deliveryCharges: '' })); }}
                  placeholder="Enter 0 if not applicable"
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.deliveryCharges ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
              </div>
              {errors.deliveryCharges && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.deliveryCharges}</p>}
            </div>
            {request.needOperator && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator Charges (per day) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    ref={operatorChargesRef}
                    type="number"
                    value={operatorCharges}
                    data-error={!!errors.operatorCharges}
                    onChange={(e) => { setOperatorCharges(e.target.value); if (errors.operatorCharges) setErrors(prev => ({ ...prev, operatorCharges: '' })); }}
                    placeholder="Enter 0 if not applicable"
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.operatorCharges ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                </div>
                {errors.operatorCharges && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.operatorCharges}</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  ref={securityDepositRef}
                  type="number"
                  value={securityDeposit}
                  data-error={!!errors.securityDeposit}
                  onChange={(e) => { setSecurityDeposit(e.target.value); if (errors.securityDeposit) setErrors(prev => ({ ...prev, securityDeposit: '' })); }}
                  placeholder="Enter 0 if not applicable"
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.securityDeposit ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
              </div>
              {errors.securityDeposit && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.securityDeposit}</p>}
            </div>

            {/* Shown only when the customer asked for installation, same rule
                as operator charges above. */}
            {request.needInstallation && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Installation Charges
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={installationCharges}
                    onChange={(e) => setInstallationCharges(e.target.value)}
                    placeholder="Enter 0 if not applicable"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={gstAmount}
                  onChange={(e) => setGstAmount(e.target.value)}
                  placeholder="Enter 0 if not applicable"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave blank or 0 if you are not charging GST</p>
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
                    ref={customAdvanceAmountRef}
                    type="number"
                    value={customAdvanceAmount}
                    onChange={(e) => { setCustomAdvanceAmount(e.target.value); if (errors.customAdvanceAmount) setErrors(prev => ({ ...prev, customAdvanceAmount: '' })); }}
                    placeholder="Enter advance amount"
                    min="0"
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.customAdvanceAmount ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.customAdvanceAmount && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.customAdvanceAmount}</p>}
                </div>
              )}
            </div>
          </div>

          {advanceExceedsTotal && (
            <p className="text-xs text-red-600 mt-1 font-medium">Advance amount cannot exceed total price</p>
          )}

          {/* Total */}
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-emerald-800">Total Quote Amount</span>
              <span className="text-2xl font-bold text-emerald-600">
                ₹{calculateTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700">Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Custom)'}</span>
              <span className="font-semibold text-emerald-600">
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
              <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-emerald-200">
                <span className="text-gray-600">Security Deposit (Refundable)</span>
                <span className="text-gray-700">
                  ₹{parseFloat(securityDeposit).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Terms & Conditions ({termsConditions.length})</h2>
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
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
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

        {/* Additional Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Additional Information</h2>

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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Valid Until *
              </label>
              <div className="flex gap-2">
                <input
                  ref={validUntilRef}
                  type="date"
                  value={validUntil}
                  data-error={!!errors.validUntil}
                  onChange={(e) => {
                    setValidUntil(e.target.value);
                    if (errors.validUntil) setErrors(prev => ({ ...prev, validUntil: '' }));
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${errors.validUntil ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                <input
                  type="time"
                  value={validUntilTime}
                  onChange={(e) => setValidUntilTime(e.target.value)}
                  className="w-[130px] px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {errors.validUntil && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.validUntil}</p>}
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
            disabled={isSubmitting || calculateTotal() === 0 || advanceExceedsTotal}
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
