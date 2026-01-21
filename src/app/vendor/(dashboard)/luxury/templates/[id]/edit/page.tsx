// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading template...</p>
        </div>
      </div>
    );
  }

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
            Edit Template
          </h1>
          <p className="text-gray-500">Update your quote template</p>
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
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Update Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
