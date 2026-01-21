'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Save,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'commuter', label: 'Commuter' },
  { value: 'sports', label: 'Sports' },
  { value: 'touring', label: 'Touring' },
  { value: 'cruiser', label: 'Cruiser' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'electric', label: 'Electric' },
];

const BIKE_TYPES = [
  { value: '100cc', label: '100cc' },
  { value: '125cc', label: '125cc' },
  { value: '150cc', label: '150cc' },
  { value: '200cc', label: '200cc+' },
  { value: 'electric', label: 'Electric' },
  { value: 'gearless', label: 'Gearless/Scooter' },
];

export default function EditBikeTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('commuter');
  const [description, setDescription] = useState('');
  const [bikeTypes, setBikeTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [dailyRateHint, setDailyRateHint] = useState('');
  const [weeklyRateHint, setWeeklyRateHint] = useState('');
  const [monthlyRateHint, setMonthlyRateHint] = useState('');
  const [securityDepositHint, setSecurityDepositHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Input states for adding new items
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/vendor/bike-templates/${templateId}`);
        const data = await response.json();

        if (data.success && data.template) {
          const t = data.template;
          setName(t.name || '');
          setCategory(t.category || 'commuter');
          setDescription(t.description || '');
          setBikeTypes(t.bikeTypes || []);
          setInclusions(t.inclusions || []);
          setExclusions(t.exclusions || []);
          setTermsConditions(t.termsConditions || []);
          setDailyRateHint(t.dailyRateHint?.toString() || '');
          setWeeklyRateHint(t.weeklyRateHint?.toString() || '');
          setMonthlyRateHint(t.monthlyRateHint?.toString() || '');
          setSecurityDepositHint(t.securityDepositHint?.toString() || '');
          setIsDefault(t.isDefault || false);
          setIsActive(t.isActive !== false);
        } else {
          setError('Template not found');
        }
      } catch (err) {
        setError('Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const addItem = (type: 'inclusion' | 'exclusion' | 'term') => {
    if (type === 'inclusion' && newInclusion.trim()) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion('');
    } else if (type === 'exclusion' && newExclusion.trim()) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
    } else if (type === 'term' && newTerm.trim()) {
      setTermsConditions([...termsConditions, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const removeItem = (type: 'inclusion' | 'exclusion' | 'term', index: number) => {
    if (type === 'inclusion') {
      setInclusions(inclusions.filter((_, i) => i !== index));
    } else if (type === 'exclusion') {
      setExclusions(exclusions.filter((_, i) => i !== index));
    } else {
      setTermsConditions(termsConditions.filter((_, i) => i !== index));
    }
  };

  const toggleBikeType = (value: string) => {
    setBikeTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (inclusions.length === 0) {
      setError('At least one inclusion is required');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/vendor/bike-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || null,
          bikeTypes: bikeTypes.length > 0 ? bikeTypes : null,
          inclusions,
          exclusions,
          termsConditions,
          dailyRateHint: dailyRateHint ? parseFloat(dailyRateHint) : null,
          weeklyRateHint: weeklyRateHint ? parseFloat(weeklyRateHint) : null,
          monthlyRateHint: monthlyRateHint ? parseFloat(monthlyRateHint) : null,
          securityDepositHint: securityDepositHint ? parseFloat(securityDepositHint) : null,
          isDefault,
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/vendor/bike/templates');
      } else {
        setError(data.error || 'Failed to update template');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/bike/templates"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
        </div>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/bike/templates"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
            <p className="text-gray-600">{name}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Daily Rental"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable Bike Types
            </label>
            <div className="flex flex-wrap gap-2">
              {BIKE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleBikeType(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    bikeTypes.includes(type.value)
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-500'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rate Hints */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Daily Rate
              </label>
              <input
                type="number"
                value={dailyRateHint}
                onChange={(e) => setDailyRateHint(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Weekly Rate
              </label>
              <input
                type="number"
                value={weeklyRateHint}
                onChange={(e) => setWeeklyRateHint(e.target.value)}
                placeholder="e.g., 3000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Monthly Rate
              </label>
              <input
                type="number"
                value={monthlyRateHint}
                onChange={(e) => setMonthlyRateHint(e.target.value)}
                placeholder="e.g., 10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Deposit
              </label>
              <input
                type="number"
                value={securityDepositHint}
                onChange={(e) => setSecurityDepositHint(e.target.value)}
                placeholder="e.g., 2000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                Set as default for this category
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Template is active
              </label>
            </div>
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Inclusions <span className="text-red-500">*</span>
            </h2>
            <span className="text-sm text-gray-500">{inclusions.length} items</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('inclusion'))}
              placeholder="Add what's included..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => addItem('inclusion')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {inclusions.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg"
              >
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem('inclusion', index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Exclusions
            </h2>
            <span className="text-sm text-gray-500">{exclusions.length} items</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('exclusion'))}
              placeholder="Add what's not included..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => addItem('exclusion')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {exclusions.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg"
              >
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem('exclusion', index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Terms & Conditions</h2>
            <span className="text-sm text-gray-500">{termsConditions.length} items</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('term'))}
              placeholder="Add a term or condition..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => addItem('term')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {termsConditions.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
              >
                <span className="text-sm text-gray-700">• {item}</span>
                <button
                  type="button"
                  onClick={() => removeItem('term', index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/vendor/bike/templates"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
