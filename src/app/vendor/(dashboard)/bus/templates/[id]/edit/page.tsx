'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  BUS_CATEGORIES,
  BUS_TRIP_TYPES,
} from '@/lib/bus-categories';

export default function EditBusTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
  const [isActive, setIsActive] = useState(true);

  // Input states for adding new items
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/vendor/bus-templates/${templateId}`);
        const data = await response.json();

        if (data.success && data.template) {
          const t = data.template;
          setName(t.name || '');
          setCategory(t.category || '');
          setDescription(t.description || '');
          setVehicleTypes(t.vehicleTypes || []);
          setInclusions(t.inclusions || []);
          setExclusions(t.exclusions || []);
          setTermsConditions(t.termsConditions || []);
          setBaseRateHint(t.baseRateHint?.toString() || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/vendor/bus-templates/${templateId}`, {
        method: 'PUT',
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
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/vendor/bus/templates');
      } else {
        setError(data.error || 'Failed to update template');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
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

  const toggleVehicleType = (typeId: string) => {
    setVehicleTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
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
          <Link href="/vendor/bus/templates" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
      <div className="flex items-center gap-4">
        <Link href="/vendor/bus/templates" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
          <h2 className="font-semibold text-lg mb-4">Applicable Vehicle Types</h2>
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
              <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                {item}
                <button type="button" onClick={() => removeItem(inclusions, setInclusions, item)} className="hover:text-green-900">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(inclusions, setInclusions, newInclusion, setNewInclusion))}
              placeholder="Add an inclusion"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <button type="button" onClick={() => addItem(inclusions, setInclusions, newInclusion, setNewInclusion)} className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
              <Plus className="w-5 h-5" />
            </button>
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
              <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
                {item}
                <button type="button" onClick={() => removeItem(exclusions, setExclusions, item)} className="hover:text-red-900">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(exclusions, setExclusions, newExclusion, setNewExclusion))}
              placeholder="Add an exclusion"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <button type="button" onClick={() => addItem(exclusions, setExclusions, newExclusion, setNewExclusion)} className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Terms & Conditions</h2>

          <div className="space-y-2 mb-4">
            {termsConditions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-orange-500 font-bold">{idx + 1}.</span>
                <span className="flex-1 text-sm text-gray-700">{item}</span>
                <button type="button" onClick={() => removeItem(termsConditions, setTermsConditions, item)} className="text-gray-400 hover:text-red-500">
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
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(termsConditions, setTermsConditions, newTerm, setNewTerm))}
              placeholder="Add a term"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <button type="button" onClick={() => addItem(termsConditions, setTermsConditions, newTerm, setNewTerm)} className="px-4 py-2.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Template Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate Hint (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                <input
                  type="number"
                  value={baseRateHint}
                  onChange={(e) => setBaseRateHint(e.target.value)}
                  placeholder="e.g., 15000"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="isDefault" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default template for this category</label>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Template is active</label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/vendor/bus/templates" className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving || !name || !category || inclusions.length === 0}
            className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
