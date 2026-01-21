'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Car, ArrowLeft, Plus, X, CheckCircle, XCircle, FileSpreadsheet, Save, Loader2, AlertCircle } from 'lucide-react';

const SELF_DRIVE_CATEGORIES = [
  { id: 'hatchback', name: 'Hatchback' },
  { id: 'sedan', name: 'Sedan' },
  { id: 'suv', name: 'SUV' },
  { id: 'muv', name: 'MUV' },
  { id: 'compact-suv', name: 'Compact SUV' },
  { id: 'luxury', name: 'Luxury' },
];

export default function EditSelfDriveTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [dailyRateHint, setDailyRateHint] = useState('');
  const [kmLimitPerDayHint, setKmLimitPerDayHint] = useState('');
  const [extraKmRateHint, setExtraKmRateHint] = useState('');
  const [securityDepositHint, setSecurityDepositHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/vendor/self-drive-templates/${templateId}`);
        const data = await response.json();

        if (data.success && data.template) {
          const t = data.template;
          setName(t.name || '');
          setCategory(t.category || '');
          setDescription(t.description || '');
          setInclusions(t.inclusions || []);
          setExclusions(t.exclusions || []);
          setTermsConditions(t.termsConditions || []);
          setDailyRateHint(t.dailyRateHint?.toString() || '');
          setKmLimitPerDayHint(t.kmLimitPerDayHint?.toString() || '');
          setExtraKmRateHint(t.extraKmRateHint?.toString() || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/vendor/self-drive-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description: description || null,
          inclusions,
          exclusions,
          termsConditions,
          dailyRateHint: dailyRateHint ? parseFloat(dailyRateHint) : null,
          kmLimitPerDayHint: kmLimitPerDayHint ? parseInt(kmLimitPerDayHint) : null,
          extraKmRateHint: extraKmRateHint ? parseFloat(extraKmRateHint) : null,
          securityDepositHint: securityDepositHint ? parseFloat(securityDepositHint) : null,
          isDefault,
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/vendor/self-drive/templates');
      } else {
        setError(data.error || 'Failed to update template');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (list: string[], setList: (items: string[]) => void, item: string, setItem: (val: string) => void) => {
    if (item.trim() && !list.includes(item.trim())) {
      setList([...list, item.trim()]);
      setItem('');
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
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
          <Link href="/vendor/self-drive/templates" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
        <Link href="/vendor/self-drive/templates" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-orange-600" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Hatchback" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" required>
                <option value="">Select category</option>
                {SELF_DRIVE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this template..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" rows={2} />
            </div>
          </div>
        </div>

        {/* Rate Hints */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Rate Hints (Optional)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (Rs.)</label>
              <input type="number" value={dailyRateHint} onChange={(e) => setDailyRateHint(e.target.value)} placeholder="e.g., 1500" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM Limit per Day</label>
              <input type="number" value={kmLimitPerDayHint} onChange={(e) => setKmLimitPerDayHint(e.target.value)} placeholder="e.g., 200" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extra KM Rate (Rs./km)</label>
              <input type="number" value={extraKmRateHint} onChange={(e) => setExtraKmRateHint(e.target.value)} placeholder="e.g., 10" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (Rs.)</label>
              <input type="number" value={securityDepositHint} onChange={(e) => setSecurityDepositHint(e.target.value)} placeholder="e.g., 5000" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Inclusions *
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="text" value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(inclusions, setInclusions, newInclusion, setNewInclusion))} placeholder="Add inclusion..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
              <button type="button" onClick={() => addItem(inclusions, setInclusions, newInclusion, setNewInclusion)} className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {inclusions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="flex-1 text-sm">{item}</span>
                  <button type="button" onClick={() => removeItem(inclusions, setInclusions, item)} className="p-1 hover:bg-green-100 rounded transition">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Exclusions
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="text" value={newExclusion} onChange={(e) => setNewExclusion(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(exclusions, setExclusions, newExclusion, setNewExclusion))} placeholder="Add exclusion..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
              <button type="button" onClick={() => addItem(exclusions, setExclusions, newExclusion, setNewExclusion)} className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {exclusions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="flex-1 text-sm">{item}</span>
                  <button type="button" onClick={() => removeItem(exclusions, setExclusions, item)} className="p-1 hover:bg-red-100 rounded transition">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Terms & Conditions</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(termsConditions, setTermsConditions, newTerm, setNewTerm))} placeholder="Add term..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
              <button type="button" onClick={() => addItem(termsConditions, setTermsConditions, newTerm, setNewTerm)} className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {termsConditions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-1 text-sm">{item}</span>
                  <button type="button" onClick={() => removeItem(termsConditions, setTermsConditions, item)} className="p-1 hover:bg-gray-100 rounded transition">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Set as default template for this category</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
              <span className="text-sm font-medium text-gray-700">Template is active</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
          <Link href="/vendor/self-drive/templates" className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
