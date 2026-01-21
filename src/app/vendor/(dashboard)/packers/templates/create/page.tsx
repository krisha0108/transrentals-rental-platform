'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Home,
  Building2,
  Truck,
  Package,
  Star,
  Crown,
} from 'lucide-react';
import { PACKERS_MOVERS_CONFIG } from '@/lib/quote-services';

const CATEGORIES = [
  { value: 'home', label: 'Home Shifting' },
  { value: 'office', label: 'Office Shifting' },
  { value: 'local', label: 'Local Moving' },
  { value: 'intercity', label: 'Intercity Moving' },
];

const SHIFTING_TYPES = [
  { value: '1bhk', label: '1 BHK' },
  { value: '2bhk', label: '2 BHK' },
  { value: '3bhk', label: '3 BHK' },
  { value: '4bhk', label: '4+ BHK / Villa' },
  { value: 'office-small', label: 'Small Office' },
  { value: 'office-large', label: 'Large Office' },
];

// Quick Start Templates
const QUICK_START_TEMPLATES = [
  {
    id: 'basic-home',
    name: 'Basic Home Shifting',
    category: 'home',
    description: 'Budget-friendly home shifting with essential services',
    icon: Home,
    color: 'bg-blue-100 text-blue-600',
    baseRateHint: 5000,
    shiftingTypes: ['1bhk', '2bhk'],
    inclusions: [
      'Basic packing materials (cartons, tape)',
      'Loading at source',
      'Transportation in covered vehicle',
      'Unloading at destination',
      'Basic transit insurance',
    ],
    exclusions: [
      'Premium packing materials',
      'Unpacking and arranging',
      'Furniture disassembly/reassembly',
      'Storage charges',
      'Staircase charges (if no lift)',
    ],
    termsConditions: [
      '50% advance payment to confirm booking',
      'Balance payment before unloading',
      'Inventory list to be signed before loading',
      'Claims must be reported within 24 hours',
    ],
  },
  {
    id: 'standard-home',
    name: 'Standard Home Shifting',
    category: 'home',
    description: 'Complete home relocation with packing materials included',
    icon: Package,
    color: 'bg-green-100 text-green-600',
    baseRateHint: 8000,
    shiftingTypes: ['1bhk', '2bhk', '3bhk'],
    inclusions: PACKERS_MOVERS_CONFIG.defaultInclusions,
    exclusions: PACKERS_MOVERS_CONFIG.defaultExclusions,
    termsConditions: PACKERS_MOVERS_CONFIG.defaultTerms,
  },
  {
    id: 'premium-home',
    name: 'Premium Home Shifting',
    category: 'home',
    description: 'Premium service with extra care, insurance & dedicated supervisor',
    icon: Crown,
    color: 'bg-amber-100 text-amber-600',
    baseRateHint: 15000,
    shiftingTypes: ['2bhk', '3bhk', '4bhk'],
    inclusions: [
      ...PACKERS_MOVERS_CONFIG.defaultInclusions,
      'Full transit insurance coverage',
      'Furniture disassembly and reassembly',
      'Dedicated supervisor throughout',
      'Premium bubble wrap for fragile items',
      'Wardrobe boxes for clothes',
      'TV & AC handling included',
    ],
    exclusions: [
      'Vehicle transport (quoted separately)',
      'Pet transport',
      'Plants relocation',
    ],
    termsConditions: [
      '40% advance to confirm booking',
      'Balance before unloading',
      'Detailed inventory with photos',
      'Insurance claims within 48 hours',
      'Free re-arrangement within 24 hours',
    ],
  },
  {
    id: 'local-shifting',
    name: 'Local City Shifting',
    category: 'local',
    description: 'Quick and affordable within-city relocation',
    icon: Truck,
    color: 'bg-purple-100 text-purple-600',
    baseRateHint: 4000,
    shiftingTypes: ['1bhk', '2bhk'],
    inclusions: [
      'Quality packing materials',
      'Careful packing by trained staff',
      'Loading and unloading',
      'Transportation in covered vehicle',
      'Basic unpacking assistance',
    ],
    exclusions: [
      'Furniture dismantling/assembly',
      'AC/Geyser uninstallation',
      'Storage charges',
      'Lift unavailability charges',
    ],
    termsConditions: [
      '50% advance payment',
      'Same-day delivery for local moves',
      'Inventory list mandatory',
      'Cancellation charges apply',
    ],
  },
  {
    id: 'office-small',
    name: 'Small Office Relocation',
    category: 'office',
    description: 'Professional office shifting up to 10 workstations',
    icon: Building2,
    color: 'bg-cyan-100 text-cyan-600',
    baseRateHint: 12000,
    shiftingTypes: ['office-small'],
    inclusions: [
      'IT equipment packing with antistatic material',
      'Furniture disassembly and reassembly',
      'Document packaging with labels',
      'Computer and monitor handling',
      'Weekend/after-hours shifting option',
      'Dedicated project coordinator',
    ],
    exclusions: [
      'Data backup services',
      'IT setup and configuration',
      'Cleaning services at new location',
      'Server room setup',
    ],
    termsConditions: [
      '50% advance to confirm',
      'Inventory verification at both locations',
      'IT equipment at owner\'s risk unless insured',
      'Overtime charges for extended hours',
      'Weekend shifting at standard rates',
    ],
  },
  {
    id: 'office-large',
    name: 'Corporate Office Relocation',
    category: 'office',
    description: 'Enterprise-grade relocation for large offices',
    icon: Star,
    color: 'bg-indigo-100 text-indigo-600',
    baseRateHint: 35000,
    shiftingTypes: ['office-large'],
    inclusions: [
      'Complete IT infrastructure handling',
      'Server and network equipment moving',
      'All furniture disassembly/reassembly',
      'Document archiving and labeling',
      'Dedicated project manager',
      'Floor-wise systematic relocation',
      'Asset tagging and tracking',
      'Post-move support (48 hours)',
    ],
    exclusions: [
      'IT configuration at new location',
      'Interior setup and decoration',
      'Electrical and network cabling',
    ],
    termsConditions: [
      '30% advance, 40% during move, 30% after completion',
      'Detailed project plan provided',
      'Insurance coverage mandatory',
      'Site survey included',
      'Minimum 7 days notice required',
    ],
  },
];

export default function CreatePackersTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuickStart, setShowQuickStart] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('home');
  const [description, setDescription] = useState('');
  const [shiftingTypes, setShiftingTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>(PACKERS_MOVERS_CONFIG.defaultInclusions);
  const [exclusions, setExclusions] = useState<string[]>(PACKERS_MOVERS_CONFIG.defaultExclusions);
  const [termsConditions, setTermsConditions] = useState<string[]>(PACKERS_MOVERS_CONFIG.defaultTerms);
  const [baseRateHint, setBaseRateHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Load Quick Start Template
  const loadQuickStartTemplate = (template: typeof QUICK_START_TEMPLATES[0]) => {
    setName(template.name);
    setCategory(template.category);
    setDescription(template.description);
    setShiftingTypes(template.shiftingTypes);
    setInclusions([...template.inclusions]);
    setExclusions([...template.exclusions]);
    setTermsConditions([...template.termsConditions]);
    setBaseRateHint(template.baseRateHint.toString());
    setShowQuickStart(false);
  };

  // Input states for adding new items
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

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

  const toggleShiftingType = (value: string) => {
    setShiftingTypes((prev) =>
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

    setIsLoading(true);

    try {
      const response = await fetch('/api/vendor/packers-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || null,
          shiftingTypes: shiftingTypes.length > 0 ? shiftingTypes : null,
          inclusions,
          exclusions,
          termsConditions,
          baseRateHint: baseRateHint ? parseFloat(baseRateHint) : null,
          isDefault,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/vendor/packers/templates');
      } else {
        setError(data.error || 'Failed to create template');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/packers/templates"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
            <p className="text-gray-600">Create a new quote template</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Quick Start Templates */}
      {showQuickStart && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quick Start Templates</h2>
                <p className="text-sm text-gray-600">Start with a pre-built template and customize it</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickStart(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_START_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => loadQuickStartTemplate(template)}
                  className="bg-white rounded-xl p-4 border-2 border-transparent hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {template.category}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          From ₹{template.baseRateHint.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Click on any template to load it, then customize as needed
          </p>
        </div>
      )}

      {!showQuickStart && (
        <button
          type="button"
          onClick={() => setShowQuickStart(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Zap className="w-4 h-4" />
          Show Quick Start Templates
        </button>
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
                placeholder="e.g., Standard Home Shifting"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable Shifting Types
            </label>
            <div className="flex flex-wrap gap-2">
              {SHIFTING_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleShiftingType(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    shiftingTypes.includes(type.value)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to apply to all shifting types
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Rate Hint (₹)
              </label>
              <input
                type="number"
                value={baseRateHint}
                onChange={(e) => setBaseRateHint(e.target.value)}
                placeholder="e.g., 8000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Suggested starting rate for this template
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                Set as default template for this category
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            href="/vendor/packers/templates"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Template
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
