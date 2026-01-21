'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  Plus,
  X,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Save,
  Lightbulb,
} from 'lucide-react';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

// Template suggestions for quick start
const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Standard FTL Transport',
    category: 'full-load',
    inclusions: TRANSPORTER_CONFIG.defaultInclusions,
    exclusions: TRANSPORTER_CONFIG.defaultExclusions,
    terms: TRANSPORTER_CONFIG.defaultTerms,
  },
  {
    name: 'Part Load Service',
    category: 'part-load',
    inclusions: [
      'Shared truck space',
      'Loading and unloading',
      'Basic transit insurance',
      'Tracking updates',
    ],
    exclusions: [
      'Express delivery',
      'Dedicated vehicle',
      'Packaging',
    ],
    terms: [
      'Payment before dispatch',
      'Weight to be declared accurately',
      'Transit time varies by route',
    ],
  },
  {
    name: 'Container Transport',
    category: 'container',
    inclusions: [
      'Container pickup from port/CFS',
      'Transportation to destination',
      'All route permits',
      'GPS tracking',
    ],
    exclusions: [
      'Customs clearance',
      'Detention charges',
      'Ground rent',
    ],
    terms: [
      'Container weight to be declared',
      'Empty container return by customer',
      'Payment as per agreed terms',
    ],
  },
];

const TRUCK_TYPES = [
  { id: 'tata-ace', name: 'Tata Ace', capacity: '750 kg' },
  { id: 'pickup-8ft', name: '8ft Pickup', capacity: '1.5 ton' },
  { id: 'eicher-14ft', name: 'Eicher 14ft', capacity: '3-4 ton' },
  { id: 'tata-407', name: 'Tata 407', capacity: '2.5 ton' },
  { id: 'container-20ft', name: '20ft Container', capacity: '15-20 ton' },
  { id: 'trailer', name: 'Trailer', capacity: '25-40 ton' },
];

export default function CreateTransporterTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [truckTypes, setTruckTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [ratePerKm, setRatePerKm] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Input states for adding new items
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/vendor/truck-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description: description || null,
          truckTypes: truckTypes.length > 0 ? truckTypes : null,
          inclusions,
          exclusions,
          termsConditions,
          ratePerKm: ratePerKm ? parseFloat(ratePerKm) : null,
          isDefault,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Template created successfully!');
        router.push('/vendor/transporter/templates');
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
    setInclusions(TRANSPORTER_CONFIG.defaultInclusions);
    setExclusions(TRANSPORTER_CONFIG.defaultExclusions);
    setTermsConditions(TRANSPORTER_CONFIG.defaultTerms);
  };

  const toggleTruckType = (typeId: string) => {
    setTruckTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/transporter/templates"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
            Create Quote Template
          </h1>
          <p className="text-gray-600">Create a reusable template for transport quotes</p>
        </div>
      </div>

      {/* Quick Start Suggestions */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-indigo-500" />
          <h3 className="font-medium text-indigo-800">Quick Start Templates</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => loadSuggestion(suggestion)}
              className="px-3 py-1.5 bg-white text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition border border-indigo-200"
            >
              {suggestion.name}
            </button>
          ))}
          <button
            onClick={loadDefaults}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition"
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
                placeholder="e.g., Standard FTL Transport"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select category</option>
                {TRANSPORTER_CONFIG.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Truck Types */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Applicable Truck Types (Optional)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select which truck types this template applies to. Leave empty for all types.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TRUCK_TYPES.map((truck) => (
              <button
                key={truck.id}
                type="button"
                onClick={() => toggleTruckType(truck.id)}
                className={`p-3 rounded-lg border text-left transition text-sm ${
                  truckTypes.includes(truck.id)
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="font-medium">{truck.name}</div>
                <div className="text-xs text-gray-500">{truck.capacity}</div>
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
              placeholder="Add an inclusion (e.g., GPS tracking)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            {TRANSPORTER_CONFIG.defaultInclusions.filter((d) => !inclusions.includes(d)).slice(0, 5).map((d, i) => (
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
              placeholder="Add an exclusion (e.g., Warehousing charges)"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            {TRANSPORTER_CONFIG.defaultExclusions.filter((d) => !exclusions.includes(d)).slice(0, 5).map((d, i) => (
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
                <span className="text-indigo-500 font-bold">{idx + 1}.</span>
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
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => addItem(termsConditions, setTermsConditions, newTerm, setNewTerm)}
              className="px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {TRANSPORTER_CONFIG.defaultTerms.filter((d) => !termsConditions.includes(d)).slice(0, 4).map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTermsConditions([...termsConditions, d])}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-indigo-100 hover:text-indigo-700 transition"
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
                Rate Per Km Hint (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={ratePerKm}
                  onChange={(e) => setRatePerKm(e.target.value)}
                  placeholder="e.g., 45"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
            href="/vendor/transporter/templates"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !name || !category || inclusions.length === 0}
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
