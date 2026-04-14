// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
  ArrowLeft,
  Save,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Car,
  Sparkles,
  Heart,
  Briefcase,
  PartyPopper,
  Star,
  Zap,
  Check,
  FileText,
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
  'Extra Hours/Km',
];

const DEFAULT_TERMS = [
  'Advance payment is non-refundable',
  'Cancellation charges apply as per policy',
  'Driver allowance for outstation trips',
  'Vehicle will be provided as per availability',
];

// Quick Start Presets
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

export default function AddTemplatePage() {
  const router = useRouter();
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
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    termsConditions: [...DEFAULT_TERMS],
    tripTypes: ['local', 'outstation', 'airport'],
    occasions: ['wedding', 'corporate', 'personal'],
    isActive: true,
  });

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

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

      const response = await fetch('/api/vendor/luxury-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/vendor/luxury/templates');
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (err) {
      setError('Failed to save template');
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-5 -mx-4 sm:-mx-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/vendor/luxury/templates" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-emerald-600" />
              Create Quote Template
            </h1>
            <p className="text-sm text-gray-500">Save template for quick quote creation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-600">Active</label>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200/50 text-sm"
          >
            {isSaving ? (
              <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Create Template</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Quick Start Presets */}
      <div className="px-4 sm:px-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Quick Start Presets</h3>
            <span className="text-xs text-gray-400 ml-1">Click to auto-fill</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {QUICK_START_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${preset.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{preset.name}</p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">₹{preset.baseAmount.toLocaleString()}</p>
                  {isSelected && <Check className="w-4 h-4 text-green-600 absolute top-2 right-2" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Form Grid */}
      <div className="grid lg:grid-cols-2 gap-0 lg:gap-0">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="space-y-0 border-r border-gray-100">

          {/* Basic Info */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wedding Premium Package"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {VEHICLE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name} - {cat.examples}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Pricing</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Base Amount *', key: 'baseAmount', placeholder: '15000' },
                { label: 'Chauffeur', key: 'chauffeurCharges', placeholder: '2000' },
                { label: 'Decoration', key: 'decorationCharges', placeholder: '3000' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full pl-7 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Included Km', key: 'includedKm', placeholder: '100', suffix: '' },
                { label: 'Included Hours', key: 'includedHours', placeholder: '8', suffix: '' },
                { label: 'Extra Km Rate', key: 'extraKmRate', placeholder: '50', suffix: '/km' },
                { label: 'Extra Hour Rate', key: 'extraHourRate', placeholder: '500', suffix: '/hr' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                  <div className="relative">
                    {field.suffix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>}
                    <input
                      type="number"
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className={`w-full ${field.suffix ? 'pl-7 pr-10' : 'px-3'} py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                    />
                    {field.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{field.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trip Types & Occasions */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Trip Types</h3>
            <div className="flex flex-wrap gap-2 mb-5">
              {TRIP_TYPES.map((tt) => (
                <button
                  key={tt.id}
                  type="button"
                  onClick={() => toggleTripType(tt.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    formData.tripTypes.includes(tt.id)
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tt.name}
                </button>
              ))}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Occasions</h3>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => toggleOccasion(occ.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                    formData.occasions.includes(occ.id)
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {occ.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="space-y-0">

          {/* Inclusions */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Inclusions
            </h3>
            <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
              {formData.inclusions.map((item) => (
                <div key={item} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg group">
                  <span className="text-sm text-green-700 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />{item}
                  </span>
                  <button type="button" onClick={() => removeInclusion(item)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                    <X className="w-3.5 h-3.5" />
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
              />
              <button type="button" onClick={addInclusion} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exclusions */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Exclusions
            </h3>
            <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
              {formData.exclusions.map((item) => (
                <div key={item} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg group">
                  <span className="text-sm text-red-700 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-400" />{item}
                  </span>
                  <button type="button" onClick={() => removeExclusion(item)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                    <X className="w-3.5 h-3.5" />
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
              />
              <button type="button" onClick={addExclusion} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Terms & Conditions
            </h3>
            <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
              {formData.termsConditions.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-lg group">
                  <span className="text-sm text-emerald-700">{idx + 1}. {item}</span>
                  <button type="button" onClick={() => removeTerm(item)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Add term or condition..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTerm())}
              />
              <button type="button" onClick={addTerm} className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/vendor/luxury/templates" className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200/50 text-sm"
        >
          {isSaving ? (
            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Create Template</>
          )}
        </button>
      </div>
    </div>
  );
}
