'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BikeIcon as Bike, ArrowLeft, Plus, X, CheckCircle, XCircle, FileSpreadsheet, Save, Lightbulb } from 'lucide-react';

const BIKE_CATEGORIES = [
  { id: 'commuter', name: 'Commuter' },
  { id: 'sports', name: 'Sports' },
  { id: 'touring', name: 'Touring' },
  { id: 'cruiser', name: 'Cruiser' },
  { id: 'scooter', name: 'Scooter' },
  { id: 'electric', name: 'Electric' },
];

const DEFAULT_INCLUSIONS = [
  'Bike with 2 helmets',
  'Valid insurance & registration',
  '24x7 roadside assistance',
  'Theft protection',
  'No hidden charges',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel charges',
  'Traffic challans/fines',
  'Damage due to negligence',
  'Helmet replacement if damaged',
];

const DEFAULT_TERMS = [
  'Valid driving license required',
  'Original ID proof required',
  'Security deposit refundable after inspection',
  'Late return charges: ₹100/hour',
  'Minimum rental: 24 hours',
];

const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Daily Commute Bike',
    category: 'commuter',
    description: 'Perfect for daily office commute and city travel',
    inclusions: [
      'Bike with 2 helmets',
      'Valid insurance & registration',
      'Free pickup & drop at your location',
      '24x7 roadside assistance',
      'No hidden charges',
    ],
    exclusions: [
      'Fuel charges',
      'Traffic challans/fines',
      'Helmet replacement if damaged',
      'Any modifications to bike',
    ],
    terms: [
      'Valid 2-wheeler license required',
      'Original Aadhaar card required',
      'Security deposit: ₹1,000 refundable',
      'Rental period: 24 hours from pickup',
      'Late return charges: ₹50/hour',
      'Monthly packages available at discounted rates',
    ],
    dailyRateHint: 300,
    weeklyRateHint: 1800,
    monthlyRateHint: 6000,
    securityDepositHint: 1000,
  },
  {
    name: 'Weekend Sports Bike',
    category: 'sports',
    description: 'High-performance bikes for weekend adventures',
    inclusions: [
      'Sports bike with 2 premium helmets',
      'Comprehensive insurance coverage',
      '24x7 roadside assistance',
      'Free bike wash on return',
      'Riding gloves included',
      'GPS tracker for safety',
    ],
    exclusions: [
      'Fuel charges',
      'Racing or stunt activities',
      'Traffic challans/fines',
      'Damage due to negligence',
      'Riding gear (except helmets)',
    ],
    terms: [
      'Valid 2-wheeler license (2+ years old) required',
      'Original Aadhaar & PAN card required',
      'Security deposit: ₹5,000 refundable',
      'Age: 23-50 years only',
      'No racing or stunt riding allowed',
      'Late return charges: ₹200/hour',
      'Weekend packages: Friday to Monday',
    ],
    dailyRateHint: 1500,
    weeklyRateHint: 9000,
    monthlyRateHint: 30000,
    securityDepositHint: 5000,
  },
  {
    name: 'Long Distance Touring',
    category: 'touring',
    description: 'Comfortable touring bikes for long journeys',
    inclusions: [
      'Touring bike with 2 helmets',
      'Comprehensive insurance & registration',
      'Breakdown support anywhere in India',
      'Saddle bags & luggage carrier',
      '24x7 roadside assistance',
      'Tool kit & puncture kit',
    ],
    exclusions: [
      'Fuel charges',
      'Accommodation charges',
      'Traffic challans/fines',
      'Border permit charges',
      'Bike cleaning if returned dirty',
    ],
    terms: [
      'Valid 2-wheeler license (3+ years old) required',
      'Original Aadhaar, PAN, passport required',
      'Security deposit: ₹3,000 refundable',
      'Inter-state travel allowed',
      'Maximum 2 riders allowed',
      'Late return charges: ₹150/hour',
      'Weekly packages available with discount',
    ],
    dailyRateHint: 800,
    weeklyRateHint: 5000,
    monthlyRateHint: 18000,
    securityDepositHint: 3000,
  },
  {
    name: 'Scooty/Scooter Rental',
    category: 'scooter',
    description: 'Easy-to-ride scooters for everyone',
    inclusions: [
      'Scooty with 2 helmets',
      'Valid insurance & registration',
      'Easy pickup & drop',
      '24x7 support',
      'Storage box included',
    ],
    exclusions: [
      'Fuel charges',
      'Traffic challans/fines',
      'Helmet replacement if lost',
      'Long distance travel',
    ],
    terms: [
      'Valid 2-wheeler license required',
      'Original ID proof required',
      'Security deposit: ₹500 refundable',
      'City limits only',
      'Late return charges: ₹30/hour',
      'Student discounts available',
    ],
    dailyRateHint: 250,
    weeklyRateHint: 1500,
    monthlyRateHint: 5000,
    securityDepositHint: 500,
  },
];

export default function CreateBikeTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [dailyRateHint, setDailyRateHint] = useState('');
  const [weeklyRateHint, setWeeklyRateHint] = useState('');
  const [monthlyRateHint, setMonthlyRateHint] = useState('');
  const [securityDepositHint, setSecurityDepositHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/vendor/bike-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description: description || null,
          inclusions,
          exclusions,
          termsConditions,
          dailyRateHint: dailyRateHint ? parseFloat(dailyRateHint) : null,
          weeklyRateHint: weeklyRateHint ? parseFloat(weeklyRateHint) : null,
          monthlyRateHint: monthlyRateHint ? parseFloat(monthlyRateHint) : null,
          securityDepositHint: securityDepositHint ? parseFloat(securityDepositHint) : null,
          isDefault,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Template created successfully!');
        router.push('/vendor/bike/templates');
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

  const addItem = (list: string[], setList: (items: string[]) => void, item: string, setItem: (val: string) => void) => {
    if (item.trim() && !list.includes(item.trim())) {
      setList([...list, item.trim()]);
      setItem('');
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  const loadDefaults = () => {
    setInclusions(DEFAULT_INCLUSIONS);
    setExclusions(DEFAULT_EXCLUSIONS);
    setTermsConditions(DEFAULT_TERMS);
  };

  const loadSuggestion = (suggestion: typeof TEMPLATE_SUGGESTIONS[0]) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setDescription(suggestion.description);
    setInclusions(suggestion.inclusions);
    setExclusions(suggestion.exclusions);
    setTermsConditions(suggestion.terms);
    setDailyRateHint(suggestion.dailyRateHint.toString());
    setWeeklyRateHint(suggestion.weeklyRateHint.toString());
    setMonthlyRateHint(suggestion.monthlyRateHint.toString());
    setSecurityDepositHint(suggestion.securityDepositHint.toString());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendor/bike/templates" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-orange-500" />
            Create Bike Template
          </h1>
          <p className="text-gray-600">Create a reusable template for quick quotes</p>
        </div>
      </div>

      <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-orange-500" />
          <h3 className="font-medium text-orange-800">Quick Start - Choose a Template</h3>
        </div>
        <p className="text-sm text-orange-700 mb-3">Load a pre-built template and customize as needed</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {TEMPLATE_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSuggestion(suggestion)}
              className="p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 hover:shadow-sm transition text-left"
            >
              <div className="font-medium text-gray-900 text-sm mb-1">{suggestion.name}</div>
              <div className="text-xs text-gray-600">{suggestion.description}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-orange-200">
          <button
            type="button"
            onClick={loadDefaults}
            className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition"
          >
            Or Load Default Items Only
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Commuter Bike"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bike Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Select category</option>
                {BIKE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this template..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Rate Hints */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Rate Hints (Optional)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₹)</label>
              <input
                type="number"
                value={dailyRateHint}
                onChange={(e) => setDailyRateHint(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate (₹)</label>
              <input
                type="number"
                value={weeklyRateHint}
                onChange={(e) => setWeeklyRateHint(e.target.value)}
                placeholder="e.g., 3000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate (₹)</label>
              <input
                type="number"
                value={monthlyRateHint}
                onChange={(e) => setMonthlyRateHint(e.target.value)}
                placeholder="e.g., 10000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
              <input
                type="number"
                value={securityDepositHint}
                onChange={(e) => setSecurityDepositHint(e.target.value)}
                placeholder="e.g., 2000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
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
              <input
                type="text"
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(inclusions, setInclusions, newInclusion, setNewInclusion))}
                placeholder="Add inclusion..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => addItem(inclusions, setInclusions, newInclusion, setNewInclusion)}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {inclusions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="flex-1 text-sm">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(inclusions, setInclusions, item)}
                    className="p-1 hover:bg-green-100 rounded transition"
                  >
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
              <input
                type="text"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(exclusions, setExclusions, newExclusion, setNewExclusion))}
                placeholder="Add exclusion..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => addItem(exclusions, setExclusions, newExclusion, setNewExclusion)}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {exclusions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="flex-1 text-sm">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(exclusions, setExclusions, item)}
                    className="p-1 hover:bg-red-100 rounded transition"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-semibold text-lg mb-4">Terms & Conditions</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(termsConditions, setTermsConditions, newTerm, setNewTerm))}
                placeholder="Add term..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => addItem(termsConditions, setTermsConditions, newTerm, setNewTerm)}
                className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {termsConditions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-1 text-sm">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(termsConditions, setTermsConditions, item)}
                    className="p-1 hover:bg-gray-100 rounded transition"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Set as default template for this category</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Template
              </>
            )}
          </button>
          <Link
            href="/vendor/bike/templates"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
