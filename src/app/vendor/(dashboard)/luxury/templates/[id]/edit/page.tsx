// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Crown,
  ArrowLeft,
  Save,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Car,
  Sparkles,
  Heart,
  Briefcase,
  PartyPopper,
  Star,
  Zap,
  Check,
} from 'lucide-react';

const VEHICLE_CATEGORIES = [
  { id: 'luxury_sedan', name: 'Luxury Sedan', examples: 'Mercedes E-Class, BMW 5 Series, Audi A6' },
  { id: 'luxury_suv', name: 'Luxury SUV', examples: 'Mercedes GLS, BMW X5, Audi Q7' },
  { id: 'premium_sedan', name: 'Premium Sedan', examples: 'Mercedes S-Class, BMW 7 Series, Audi A8' },
  { id: 'premium_suv', name: 'Premium SUV', examples: 'Range Rover, Mercedes GLE, Porsche Cayenne' },
  { id: 'vintage', name: 'Vintage Car', examples: 'Rolls Royce, Classic Mercedes, Bentley' },
  { id: 'sports', name: 'Sports Car', examples: 'Porsche 911, Ferrari, Lamborghini' },
  { id: 'limousine', name: 'Limousine', examples: 'Stretch Limo, Lincoln Town Car' },
  { id: 'convertible', name: 'Convertible', examples: 'BMW Z4, Mercedes SLK, Audi TT' },
];

const TRIP_TYPES = [
  { id: 'local', name: 'Local' },
  { id: 'outstation', name: 'Outstation' },
  { id: 'airport', name: 'Airport Transfer' },
];

const OCCASIONS = [
  { id: 'wedding', name: 'Wedding' },
  { id: 'corporate', name: 'Corporate' },
  { id: 'personal', name: 'Personal' },
  { id: 'airport', name: 'Airport' },
  { id: 'anniversary', name: 'Anniversary' },
  { id: 'birthday', name: 'Birthday' },
];

const DEFAULT_TERMS = [
  'Advance payment is non-refundable',
  'Cancellation charges apply as per policy',
  'Driver allowance for outstation trips',
  'Vehicle will be provided as per availability',
];

// Quick Start Presets (Synchronized with Add Page)
const QUICK_START_PRESETS = [
  {
    id: 'wedding',
    name: 'Wedding Premium',
    icon: Heart,
    color: 'from-emerald-500 to-emerald-500',
    category: 'luxury_sedan',
    baseAmount: 25000,
    chauffeurCharges: 2500,
    decorationCharges: 5000,
    extraKmRate: 50,
    extraHourRate: 1500,
    inclusions: ['Professional Chauffeur', 'Fuel Charges', 'Premium Decoration', 'Red Carpet Entry', 'Bottled Water & Refreshments', 'Vehicle Insurance'],
    exclusions: ['Toll Charges', 'Parking Charges', 'Night Halt (₹2500)', 'Interstate Permit'],
    termsConditions: ['Advance payment is non-refundable', 'Cancellation charges apply as per policy', 'Driver allowance for outstation trips', 'Vehicle will be provided as per availability', 'Decoration setup requires 1 hour prior access'],
    tripTypes: ['local', 'outstation'],
    occasions: ['wedding', 'anniversary'],
  },
  {
    id: 'corporate',
    name: 'Corporate Executive',
    icon: Briefcase,
    color: 'from-emerald-500 to-emerald-500',
    category: 'premium_sedan',
    baseAmount: 15000,
    chauffeurCharges: 2000,
    decorationCharges: 0,
    extraKmRate: 40,
    extraHourRate: 1200,
    inclusions: ['Professional Chauffeur', 'Fuel Charges', 'WiFi Available', 'Newspaper & Magazine', 'Bottled Water', 'Vehicle Insurance'],
    exclusions: ['Toll Charges', 'Parking Charges', 'Night Halt (₹2000)', 'Waiting Charges after 30 min'],
    termsConditions: ['Advance payment is non-refundable', 'Cancellation charges apply as per policy', 'Waiting charges after 30 minutes', 'Route changes subject to approval'],
    tripTypes: ['local', 'airport'],
    occasions: ['corporate', 'airport'],
  },
  {
    id: 'birthday',
    name: 'Birthday Special',
    icon: PartyPopper,
    color: 'from-emerald-500 to-emerald-500',
    category: 'luxury_suv',
    baseAmount: 18000,
    chauffeurCharges: 2000,
    decorationCharges: 3000,
    extraKmRate: 45,
    extraHourRate: 1300,
    inclusions: ['Professional Chauffeur', 'Fuel Charges', 'Balloon Decoration', 'Birthday Banner', 'Bottled Water', 'Vehicle Insurance'],
    exclusions: ['Toll Charges', 'Parking Charges', 'Night Halt', 'Cake (can arrange on request)'],
    termsConditions: ['Advance payment is non-refundable', 'Cancellation charges apply as per policy', 'Decoration setup requires 1 hour prior access', 'Vehicle will be provided as per availability'],
    tripTypes: ['local'],
    occasions: ['birthday', 'personal'],
  },
  {
    id: 'airport',
    name: 'Airport Transfer',
    icon: Star,
    color: 'from-emerald-500 to-emerald-500',
    category: 'luxury_sedan',
    baseAmount: 8000,
    chauffeurCharges: 1500,
    decorationCharges: 0,
    extraKmRate: 35,
    extraHourRate: 1000,
    inclusions: ['Professional Chauffeur', 'Fuel Charges', 'Flight Tracking', 'Meet & Greet', 'Bottled Water', 'Vehicle Insurance'],
    exclusions: ['Toll Charges', 'Airport Parking', 'Waiting after 45 min (₹500/hr)'],
    termsConditions: ['Advance payment is non-refundable', 'Cancellation charges apply as per policy', 'Free waiting up to 45 minutes at airport', 'Flight tracking included'],
    tripTypes: ['airport'],
    occasions: ['airport', 'corporate'],
  },
  {
    id: 'basic',
    name: 'Basic Luxury',
    icon: Zap,
    color: 'from-gray-600 to-gray-800',
    category: 'luxury_sedan',
    baseAmount: 10000,
    chauffeurCharges: 1500,
    decorationCharges: 0,
    extraKmRate: 30,
    extraHourRate: 800,
    inclusions: ['Professional Chauffeur', 'Fuel Charges', 'AC', 'Bottled Water', 'Vehicle Insurance'],
    exclusions: ['Toll Charges', 'Parking Charges', 'Night Halt', 'Decoration'],
    termsConditions: ['Advance payment is non-refundable', 'Cancellation charges apply as per policy', 'Driver allowance for outstation trips', 'Vehicle will be provided as per availability'],
    tripTypes: ['local', 'outstation', 'airport'],
    occasions: ['personal'],
  },
];

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'luxury_sedan',
    baseAmount: '',
    chauffeurCharges: '',
    decorationCharges: '',
    perKmRate: '',
    perHourRate: '',
    includedKm: '',
    includedHours: '',
    extraKmRate: '',
    extraHourRate: '',
    inclusions: [] as string[],
    exclusions: [] as string[],
    termsConditions: [] as string[],
    tripTypes: [] as string[],
    occasions: [] as string[],
    isActive: true,
  });

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/vendor/luxury-templates/${params.id}`);
      const data = await response.json();

      if (data.success && data.template) {
        const t = data.template;
        setFormData({
          name: t.name || '',
          category: t.category || 'luxury_sedan',
          baseAmount: String(t.baseAmount || ''),
          chauffeurCharges: String(t.chauffeurCharges || ''),
          decorationCharges: String(t.decorationCharges || ''),
          perKmRate: String(t.perKmRate || ''),
          perHourRate: String(t.perHourRate || ''),
          includedKm: String(t.includedKm || ''),
          includedHours: String(t.includedHours || ''),
          extraKmRate: String(t.extraKmRate || ''),
          extraHourRate: String(t.extraHourRate || ''),
          inclusions: t.inclusions || [],
          exclusions: t.exclusions || [],
          termsConditions: t.termsConditions || DEFAULT_TERMS,
          tripTypes: t.tripTypes || [],
          occasions: t.occasions || [],
          isActive: t.isActive ?? true,
        });
      } else {
        setError('Template not found');
      }
    } catch (err) {
      setError('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.baseAmount) {
      setError('Template Name and Base Amount are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        baseAmount: Number(formData.baseAmount),
        chauffeurCharges: Number(formData.chauffeurCharges) || 0,
        decorationCharges: Number(formData.decorationCharges) || 0,
        perKmRate: formData.perKmRate ? Number(formData.perKmRate) : null,
        perHourRate: formData.perHourRate ? Number(formData.perHourRate) : null,
        includedKm: formData.includedKm ? Number(formData.includedKm) : null,
        includedHours: formData.includedHours ? Number(formData.includedHours) : null,
        extraKmRate: formData.extraKmRate ? Number(formData.extraKmRate) : null,
        extraHourRate: formData.extraHourRate ? Number(formData.extraHourRate) : null,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        termsConditions: formData.termsConditions,
        tripTypes: formData.tripTypes,
        occasions: formData.occasions,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/vendor/luxury-templates/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/vendor/luxury/templates');
      } else {
        setError(data.error || 'Failed to update template');
      }
    } catch (err) {
      setError('Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = QUICK_START_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setFormData({
        ...formData,
        name: preset.name + ' Template',
        category: preset.category,
        baseAmount: String(preset.baseAmount),
        chauffeurCharges: String(preset.chauffeurCharges),
        decorationCharges: String(preset.decorationCharges),
        extraKmRate: String(preset.extraKmRate),
        extraHourRate: String(preset.extraHourRate),
        inclusions: [...preset.inclusions],
        exclusions: [...preset.exclusions],
        termsConditions: [...preset.termsConditions],
        tripTypes: [...preset.tripTypes],
        occasions: [...preset.occasions],
      });
    }
  };

  const toggleTripType = (tripType: string) => {
    setFormData((prev) => ({
      ...prev,
      tripTypes: prev.tripTypes.includes(tripType)
        ? prev.tripTypes.filter((t) => t !== tripType)
        : [...prev.tripTypes, tripType],
    }));
  };

  const toggleOccasion = (occasion: string) => {
    setFormData((prev) => ({
      ...prev,
      occasions: prev.occasions.includes(occasion)
        ? prev.occasions.filter((o) => o !== occasion)
        : [...prev.occasions, occasion],
    }));
  };

  const addInclusion = () => {
    if (newInclusion.trim() && !formData.inclusions.includes(newInclusion.trim())) {
      setFormData((prev) => ({
        ...prev,
        inclusions: [...prev.inclusions, newInclusion.trim()],
      }));
      setNewInclusion('');
    }
  };

  const removeInclusion = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      inclusions: prev.inclusions.filter((i) => i !== item),
    }));
  };

  const addExclusion = () => {
    if (newExclusion.trim() && !formData.exclusions.includes(newExclusion.trim())) {
      setFormData((prev) => ({
        ...prev,
        exclusions: [...prev.exclusions, newExclusion.trim()],
      }));
      setNewExclusion('');
    }
  };

  const removeExclusion = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      exclusions: prev.exclusions.filter((e) => e !== item),
    }));
  };

  const addTerm = () => {
    if (newTerm.trim() && !formData.termsConditions.includes(newTerm.trim())) {
      setFormData((prev) => ({
        ...prev,
        termsConditions: [...prev.termsConditions, newTerm.trim()],
      }));
      setNewTerm('');
    }
  };

  const removeTerm = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      termsConditions: prev.termsConditions.filter((t) => t !== item),
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-5 -mx-4 sm:-mx-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between px-4 sm:px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg text-emerald-100" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-emerald-50 rounded" />
              <div className="h-3 w-52 bg-emerald-50/50 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 bg-emerald-50 rounded" />
            <div className="h-10 w-36 bg-emerald-100 rounded-xl" />
          </div>
        </div>

        {/* Presets Skeleton */}
        <div className="px-4 sm:px-6 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-emerald-50">
            <div className="h-4 w-32 bg-emerald-50 rounded mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 rounded-xl border border-emerald-50 h-24" />
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid lg:grid-cols-2 border-t border-emerald-50 bg-white">
          <div className="p-8 border-r border-emerald-50 space-y-8">
            <div className="h-24 w-full bg-emerald-50/20 rounded-2xl" />
            <div className="h-48 w-full bg-emerald-50/20 rounded-2xl" />
            <div className="h-40 w-full bg-emerald-50/20 rounded-2xl" />
          </div>
          <div className="p-8 space-y-8">
            <div className="h-40 w-full bg-emerald-50/20 rounded-2xl" />
            <div className="h-40 w-full bg-emerald-50/20 rounded-2xl" />
            <div className="h-40 w-full bg-emerald-50/20 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 -mx-4 sm:-mx-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/vendor/luxury/templates" className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight leading-none">
              <Crown className="w-5 h-5 text-emerald-600" />
              Edit Template
            </h1>
            <p className="text-sm text-gray-500 mt-1">Synchronizing Asset Protocols</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-gray-200 focus:ring-emerald-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-600 cursor-pointer">Active</label>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200/50 text-sm transition-all active:scale-95"
          >
            {isSaving ? (
              <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm font-medium text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Quick Start Presets */}
      <div className="px-4 sm:px-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 leading-none">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Template Quick-Start</h3>
            <span className="text-xs text-gray-400 ml-2">Flash Overwrite</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_START_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left group overflow-hidden",
                    isSelected 
                      ? "border-emerald-500 bg-emerald-50 shadow-md" 
                      : "border-gray-50 hover:border-gray-200 hover:shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg bg-gradient-to-r flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-lg shadow-emerald-200/50",
                    preset.color
                  )}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{preset.name}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1 uppercase">₹{(preset.baseAmount / 1000).toFixed(0)}K BASE</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <Check className="w-3 h-3 flex-shrink-0" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Form Grid (Direct Divider Style) */}
      <div className="grid lg:grid-cols-2 gap-0 border-t border-gray-100 bg-white">

        {/* ═══ LEFT COLUMN (Financial & Core) ═══ */}
        <div className="space-y-0 border-r border-gray-100">

          {/* Basic Info Row */}
          <div className="p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Template Core Info
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 leading-none ml-1">Asset Name Protocol *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wedding Premium Package"
                  className="w-full px-4 py-3.5 bg-gray-50/30 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 leading-none ml-1">Vehicle Sector / Category *</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none cursor-pointer appearance-none shadow-sm pr-10"
                  >
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name} - {cat.examples}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Car className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Financial Matrix
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Base Amount *', key: 'baseAmount', placeholder: '15000' },
                { label: 'Staff / Chauffeur', key: 'chauffeurCharges', placeholder: '2000' },
                { label: 'Decor / Aesthetic', key: 'decorationCharges', placeholder: '3000' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 leading-none ml-1">{field.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full pl-7 pr-3 py-3.5 bg-gray-50/30 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Included Km', key: 'includedKm', placeholder: '100', suffix: '' },
                { label: 'Included Hours', key: 'includedHours', placeholder: '8', suffix: '' },
                { label: 'Extra Km Rate', key: 'extraKmRate', placeholder: '50', suffix: '/km' },
                { label: 'Extra Hour Rate', key: 'extraHourRate', placeholder: '500', suffix: '/hr' },
              ].map(field => (
                <div key={field.key} className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1 leading-none ml-1">{field.label}</label>
                  <div className="relative">
                    {field.suffix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>}
                    <input
                      type="number"
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className={cn(
                        "w-full py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none shadow-sm",
                        field.suffix ? "pl-7 pr-12" : "px-4"
                      )}
                    />
                    {field.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-medium tracking-tight">{field.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocols Row */}
          <div className="p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Strategic Protocols
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3 ml-1">Operational Clusters (Trip Types)</p>
                <div className="flex flex-wrap gap-2">
                  {TRIP_TYPES.map((tt) => (
                    <button
                      key={tt.id}
                      type="button"
                      onClick={() => toggleTripType(tt.id)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                        formData.tripTypes.includes(tt.id)
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200/50"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      )}
                    >
                      {tt.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3 ml-1">Asset Multi-Allocation (Occasions)</p>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => toggleOccasion(occ.id)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                        formData.occasions.includes(occ.id)
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200/50"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      )}
                    >
                      {occ.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN (Logistics & Legal) ═══ */}
        <div className="space-y-0">

          {/* Inclusions Row */}
          <div className="p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Service Inclusions
            </h3>
            <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.inclusions.map((item) => (
                <div key={item} className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-xl border border-green-100 group/item hover:border-green-200 hover:shadow-md hover:bg-white transition-all">
                  <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {item}
                  </span>
                  <button type="button" onClick={() => removeInclusion(item)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-all p-1">
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
                placeholder="Add inclusion..."
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all outline-none"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
              />
              <button type="button" onClick={addInclusion} className="w-12 h-12 bg-green-50 text-green-700 rounded-xl hover:bg-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Exclusions Row */}
          <div className="p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Service Exclusions
            </h3>
            <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.exclusions.map((item) => (
                <div key={item} className="flex items-center justify-between bg-red-50 px-4 py-3 rounded-xl border border-red-100 group/item hover:bg-white hover:shadow-md transition-all">
                  <span className="text-sm font-medium text-red-700 flex items-center gap-2 italic">
                    <XCircle className="w-3.5 h-3.5 text-red-400" /> {item}
                  </span>
                  <button type="button" onClick={() => removeExclusion(item)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-all p-1">
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
                placeholder="Add exclusion..."
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all outline-none"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
              />
              <button type="button" onClick={addExclusion} className="w-12 h-12 bg-red-50 text-red-700 rounded-xl hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Legal Row */}
          <div className="p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Legal Template Directives
            </h3>
            <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.termsConditions.map((item, idx) => (
                <div key={idx} className="flex gap-3 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 group/item hover:border-emerald-200 hover:shadow-md hover:bg-white transition-all">
                  <span className="text-sm font-bold text-emerald-700 flex-shrink-0">{idx + 1}.</span>
                  <span className="text-sm text-emerald-900 leading-relaxed transition-colors tracking-tight">{item}</span>
                  <button type="button" onClick={() => removeTerm(item)} className="ml-auto text-red-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-all p-1 flex-shrink-0">
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
                placeholder="Add directive..."
                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all outline-none"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTerm())}
              />
              <button type="button" onClick={addTerm} className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-lg active:scale-90">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Bottom Anchor */}
      <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
        <Link 
          href="/vendor/luxury/templates" 
          className="px-8 py-3 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-10 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white text-sm font-bold rounded-2xl hover:shadow-xl hover:shadow-emerald-200/50 disabled:opacity-50 flex items-center gap-3 transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <><span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> SAVING...</>
          ) : (
            <><Save className="w-5 h-5" /> Save Template</>
          )}
        </button>
      </div>
    </div>
  );
}
