'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bus,
  ArrowLeft,
  Plus,
  X,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Save,
  Lightbulb,
} from 'lucide-react';
import {
  BUS_CATEGORIES,
  BUS_TRIP_TYPES,
  DEFAULT_INCLUSIONS,
  DEFAULT_EXCLUSIONS,
  DEFAULT_TERMS,
  TEMPLATE_SUGGESTIONS,
} from '@/lib/bus-categories';

export default function CreateBusTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [baseRateHint, setBaseRateHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Input states for adding new items
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/vendor/bus-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description: description || null,
          vehicleTypes: vehicleTypes.length > 0 ? vehicleTypes : null,
          inclusions,
          exclusions,
          termsConditions,
          baseRateHint: baseRateHint ? parseFloat(baseRateHint) : null,
          isDefault,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Template created successfully!');
        router.push('/vendor/bus/templates');
      } else {
        alert(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = (
    list: string[],
    setList: (items: string[]) => void,
    item: string,
    setItem: (val: string) => void
  ) => {
    if (item.trim() && !list.includes(item.trim())) {
      setList([...list, item.trim()]);
      setItem('');
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  const loadSuggestion = (suggestion: typeof TEMPLATE_SUGGESTIONS[0]) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setDescription('');
    setInclusions(suggestion.inclusions);
    setExclusions(suggestion.exclusions);
    setTermsConditions(suggestion.terms);
  };

  const loadDefaults = () => {
    setInclusions(DEFAULT_INCLUSIONS);
    setExclusions(DEFAULT_EXCLUSIONS);
    setTermsConditions(DEFAULT_TERMS);
  };

  const toggleVehicleType = (typeId: string) => {
    setVehicleTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/bus/templates"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-orange-500" />
            Create Quote Template
          </h1>
          <p className="text-gray-600">Create a reusable template for quick quotes</p>
        </div>
      </div>

      {/* Quick Start Suggestions */}
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-orange-500" />
          <h3 className="font-medium text-orange-800">Quick Start Templates</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => loadSuggestion(suggestion)}
              className="px-3 py-1.5 bg-white text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition border border-orange-200"
            >
              {suggestion.name}
            </button>
          ))}
          <button
            onClick={loadDefaults}
            className="px-3 py-1.5 bg-orange-600 text-white rounded-full text-sm font-medium hover:bg-orange-700 transition"
          >
            Load Default Items
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Outstation Trip"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Select category</option>
                {BUS_TRIP_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when to use this template..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Types */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Applicable Vehicle Types (Optional)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select which vehicle types this template applies to. Leave empty for all types.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BUS_CATEGORIES.map((veh) => (
              <button
                key={veh.id}
                type="button"
                onClick={() => toggleVehicleType(veh.id)}
                className={`p-3 rounded-lg border text-left transition text-sm ${
                  vehicleTypes.includes(veh.id)
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="font-medium">{veh.shortName}</div>
                <div className="text-xs text-gray-500">
                  {veh.seatingCapacity.min}-{veh.seatingCapacity.max} seats
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Inclusions
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {inclusions.map((item, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(inclusions, setInclusions, item)}
                  className="hover:text-green-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
            {inclusions.length === 0 && (
              <span className="text-sm text-gray-400">No inclusions added yet</span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), addItem(inclusions, setInclusions, newInclusion, setNewInclusion))
              }
              placeholder="Add an inclusion (e.g., All fuel charges)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => addItem(inclusions, setInclusions, newInclusion, setNewInclusion)}
              className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick add from defaults */}
          <div className="mt-3 flex flex-wrap gap-1">
            {DEFAULT_INCLUSIONS.filter((d) => !inclusions.includes(d)).slice(0, 5).map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInclusions([...inclusions, d])}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-green-100 hover:text-green-700 transition"
              >
                + {d}
              </button>
            ))}
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Exclusions
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {exclusions.map((item, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(exclusions, setExclusions, item)}
                  className="hover:text-red-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
            {exclusions.length === 0 && (
              <span className="text-sm text-gray-400">No exclusions added yet</span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), addItem(exclusions, setExclusions, newExclusion, setNewExclusion))
              }
              placeholder="Add an exclusion (e.g., Personal expenses)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => addItem(exclusions, setExclusions, newExclusion, setNewExclusion)}
              className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {DEFAULT_EXCLUSIONS.filter((d) => !exclusions.includes(d)).slice(0, 5).map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setExclusions([...exclusions, d])}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-700 transition"
              >
                + {d}
              </button>
            ))}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Terms & Conditions</h2>

          <div className="space-y-2 mb-4">
            {termsConditions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <span className="text-orange-500 font-bold">{idx + 1}.</span>
                <span className="flex-1 text-sm text-gray-700">{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(termsConditions, setTermsConditions, item)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {termsConditions.length === 0 && (
              <span className="text-sm text-gray-400">No terms added yet</span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), addItem(termsConditions, setTermsConditions, newTerm, setNewTerm))
              }
              placeholder="Add a term (e.g., 50% advance required)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => addItem(termsConditions, setTermsConditions, newTerm, setNewTerm)}
              className="px-4 py-2.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {DEFAULT_TERMS.filter((d) => !termsConditions.includes(d)).slice(0, 4).map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTermsConditions([...termsConditions, d])}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-orange-100 hover:text-orange-700 transition"
              >
                + {d}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Template Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Rate Hint (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={baseRateHint}
                  onChange={(e) => setBaseRateHint(e.target.value)}
                  placeholder="e.g., 15000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is just a reminder for yourself. It won&apos;t be shown to customers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">
                Set as default template for this category
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/vendor/bus/templates"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !name || !category || inclusions.length === 0}
            className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Template
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
