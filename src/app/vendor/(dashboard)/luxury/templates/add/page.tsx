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
    color: 'from-pink-500 to-rose-500',
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
    color: 'from-blue-500 to-indigo-500',
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
    color: 'from-purple-500 to-violet-500',
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
    color: 'from-amber-500 to-orange-500',
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/luxury/templates" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            Create Quote Template
          </h1>
          <p className="text-gray-500">Save template for quick quote creation</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-600 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Start Presets */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Quick Start Presets</h3>
          <span className="text-xs text-gray-500 ml-2">Click to auto-fill form</span>
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
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${preset.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{preset.name}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">₹{preset.baseAmount.toLocaleString()}</p>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Basic Info</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Wedding Premium Package"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {VEHICLE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} - {cat.examples}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Pricing</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.baseAmount}
                  onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                  placeholder="15000"
                  className="w-full pl-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chauffeur Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.chauffeurCharges}
                  onChange={(e) => setFormData({ ...formData, chauffeurCharges: e.target.value })}
                  placeholder="2000"
                  className="w-full pl-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decoration Charges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.decorationCharges}
                  onChange={(e) => setFormData({ ...formData, decorationCharges: e.target.value })}
                  placeholder="3000"
                  className="w-full pl-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Included Km
              </label>
              <input
                type="number"
                value={formData.includedKm}
                onChange={(e) => setFormData({ ...formData, includedKm: e.target.value })}
                placeholder="100"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Included Hours
              </label>
              <input
                type="number"
                value={formData.includedHours}
                onChange={(e) => setFormData({ ...formData, includedHours: e.target.value })}
                placeholder="8"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra Km Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.extraKmRate}
                  onChange={(e) => setFormData({ ...formData, extraKmRate: e.target.value })}
                  placeholder="50"
                  className="w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/km</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra Hour Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.extraHourRate}
                  onChange={(e) => setFormData({ ...formData, extraHourRate: e.target.value })}
                  placeholder="500"
                  className="w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Types & Occasions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Applicable Trip Types</h3>
              <div className="flex flex-wrap gap-2">
                {TRIP_TYPES.map((tt) => (
                  <button
                    key={tt.id}
                    type="button"
                    onClick={() => toggleTripType(tt.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      formData.tripTypes.includes(tt.id)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tt.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Applicable Occasions</h3>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => toggleOccasion(occ.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      formData.occasions.includes(occ.id)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {occ.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Inclusions
              </h3>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {formData.inclusions.map((item) => (
                  <div key={item} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-green-700">✓ {item}</span>
                    <button type="button" onClick={() => removeInclusion(item)} className="text-red-500 hover:text-red-700">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
                />
                <button
                  type="button"
                  onClick={addInclusion}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Exclusions
              </h3>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {formData.exclusions.map((item) => (
                  <div key={item} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-red-700">✗ {item}</span>
                    <button type="button" onClick={() => removeExclusion(item)} className="text-red-500 hover:text-red-700">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
                />
                <button
                  type="button"
                  onClick={addExclusion}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Terms & Conditions
          </h3>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {formData.termsConditions.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-blue-700">{idx + 1}. {item}</span>
                <button type="button" onClick={() => removeTerm(item)} className="text-red-500 hover:text-red-700">
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
              placeholder="Add term or condition..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTerm())}
            />
            <button
              type="button"
              onClick={addTerm}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-purple-600 rounded"
            />
            <label htmlFor="isActive" className="font-medium text-gray-700">
              Template is Active
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 sticky bottom-4 bg-white p-4 rounded-xl shadow-lg border">
          <Link
            href="/vendor/luxury/templates"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isSaving ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
