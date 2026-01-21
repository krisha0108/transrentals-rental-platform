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
  Wrench,
  HardHat,
  Truck,
  Cog,
  Star,
  Crown,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'daily', label: 'Daily Rental' },
  { value: 'weekly', label: 'Weekly Rental' },
  { value: 'monthly', label: 'Monthly Rental' },
  { value: 'project', label: 'Project Based' },
];

const EQUIPMENT_TYPES = [
  { value: 'crane', label: 'Cranes' },
  { value: 'excavator', label: 'Excavators' },
  { value: 'loader', label: 'Loaders' },
  { value: 'bulldozer', label: 'Bulldozers' },
  { value: 'generator', label: 'Generators' },
  { value: 'compressor', label: 'Compressors' },
  { value: 'forklift', label: 'Forklifts' },
  { value: 'concrete', label: 'Concrete Equipment' },
];

// Quick Start Templates for Equipment
const QUICK_START_TEMPLATES = [
  {
    id: 'basic-daily',
    name: 'Basic Daily Rental',
    category: 'daily',
    description: 'Standard daily equipment rental with basic inclusions',
    icon: Wrench,
    color: 'bg-amber-100 text-amber-600',
    dailyRateHint: 5000,
    weeklyRateHint: 30000,
    monthlyRateHint: 100000,
    equipmentTypes: ['excavator', 'loader'],
    inclusions: [
      'Equipment in working condition',
      'Basic maintenance during rental',
      'Safety gear and equipment manual',
      'Operator training (1 hour)',
      'Basic transit insurance',
    ],
    exclusions: [
      'Fuel/electricity consumption',
      'Transportation to/from site',
      'Operator wages',
      'Damage beyond normal wear',
      'Overnight storage charges',
    ],
    termsConditions: [
      '50% advance payment to confirm booking',
      'Balance payment before equipment handover',
      'Security deposit required (refundable)',
      'Equipment inspection before and after use',
      '24-hour minimum rental period',
    ],
  },
  {
    id: 'standard-weekly',
    name: 'Standard Weekly Rental',
    category: 'weekly',
    description: 'Weekly rental with operator and maintenance included',
    icon: HardHat,
    color: 'bg-green-100 text-green-600',
    dailyRateHint: 4500,
    weeklyRateHint: 28000,
    monthlyRateHint: 95000,
    equipmentTypes: ['crane', 'excavator', 'loader', 'bulldozer'],
    inclusions: [
      'Equipment in working condition',
      'Trained operator (8 hours/day)',
      'Regular maintenance and servicing',
      'Fuel for operator commute',
      'Safety equipment and PPE',
      'Transit insurance coverage',
      'Equipment manuals and documentation',
    ],
    exclusions: [
      'Fuel for equipment operation',
      'Transportation to site (first delivery)',
      'Overtime operator charges',
      'Major repairs due to misuse',
      'Site preparation costs',
    ],
    termsConditions: [
      '40% advance to confirm booking',
      'Weekly payment in advance',
      'Security deposit as per equipment value',
      'Equipment inspection at handover',
      'Minimum 7 days rental period',
      'Cancellation charges apply after confirmation',
    ],
  },
  {
    id: 'premium-project',
    name: 'Premium Project Rental',
    category: 'project',
    description: 'Full-service project rental with dedicated support',
    icon: Crown,
    color: 'bg-purple-100 text-purple-600',
    dailyRateHint: 8000,
    weeklyRateHint: 50000,
    monthlyRateHint: 180000,
    equipmentTypes: ['crane', 'excavator', 'loader', 'bulldozer', 'concrete'],
    inclusions: [
      'Equipment in excellent condition',
      'Certified operator (10 hours/day)',
      'Comprehensive maintenance',
      'Fuel allowance (50L/day)',
      'Full transit and operation insurance',
      'Dedicated project coordinator',
      'Priority breakdown support (4 hours)',
      'Equipment replacement guarantee',
      'Safety audit and compliance',
    ],
    exclusions: [
      'Fuel beyond allowance',
      'Site accommodation for operator',
      'Government permits and fees',
      'Third-party damage claims',
    ],
    termsConditions: [
      '30% advance at booking',
      'Monthly billing with net-15 terms',
      'Insurance coverage mandatory',
      'Site survey included',
      'Minimum 30 days project duration',
      'Dedicated account manager assigned',
    ],
  },
  {
    id: 'crane-rental',
    name: 'Crane Rental Package',
    category: 'daily',
    description: 'Specialized crane rental with rigging support',
    icon: Truck,
    color: 'bg-blue-100 text-blue-600',
    dailyRateHint: 15000,
    weeklyRateHint: 90000,
    monthlyRateHint: 300000,
    equipmentTypes: ['crane'],
    inclusions: [
      'Crane with certified operator',
      'Rigging equipment and slings',
      'Safety signaling personnel',
      'Load charts and documentation',
      'Transit and lifting insurance',
      'Basic rigging accessories',
      'Operator PPE and safety gear',
    ],
    exclusions: [
      'Specialized rigging gear',
      'Crane mat/outrigger pads',
      'Permit fees and road closures',
      'Night shift operations',
      'Overtime beyond 8 hours',
    ],
    termsConditions: [
      'Advance payment 100% for daily rental',
      'Ground condition must be suitable',
      'Load weights must be pre-declared',
      'Customer responsible for access clearance',
      'Weather delays at customer risk',
      'Minimum 4 hours billing',
    ],
  },
  {
    id: 'excavation-package',
    name: 'Excavation Package',
    category: 'weekly',
    description: 'Complete excavation solution with support equipment',
    icon: Cog,
    color: 'bg-orange-100 text-orange-600',
    dailyRateHint: 12000,
    weeklyRateHint: 70000,
    monthlyRateHint: 250000,
    equipmentTypes: ['excavator', 'loader', 'bulldozer'],
    inclusions: [
      'Excavator with operator',
      'Multiple bucket attachments',
      'Hydraulic breaker (if needed)',
      'Regular maintenance',
      'Fuel allowance (40L/day)',
      'Transit insurance',
      'GPS tracking for fleet management',
    ],
    exclusions: [
      'Dump trucks for material removal',
      'Survey and marking services',
      'Environmental permits',
      'Excess fuel charges',
      'Rock breaking attachments',
    ],
    termsConditions: [
      '50% advance payment',
      'Weekly billing cycle',
      'Site inspection before mobilization',
      'Underground utility clearance by customer',
      'Minimum 5 days rental',
      'Equipment security at customer site',
    ],
  },
  {
    id: 'generator-rental',
    name: 'Generator Rental',
    category: 'monthly',
    description: 'Power generator rental with installation',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-600',
    dailyRateHint: 3000,
    weeklyRateHint: 18000,
    monthlyRateHint: 60000,
    equipmentTypes: ['generator'],
    inclusions: [
      'Generator set with canopy',
      'Installation and commissioning',
      'Fuel tank (full at delivery)',
      'Weekly maintenance visits',
      'Remote monitoring system',
      '24/7 breakdown support',
      'AMC coverage during rental',
    ],
    exclusions: [
      'Fuel consumption',
      'Electrical distribution panel',
      'Cables beyond 25 meters',
      'Enclosure modifications',
      'Load bank testing',
    ],
    termsConditions: [
      '1 month advance payment',
      'Refundable security deposit',
      'Customer to provide safe installation area',
      'Fuel to be arranged by customer',
      'Minimum 1 month rental',
      'De-installation charges apply',
    ],
  },
];

const DEFAULT_INCLUSIONS = [
  'Equipment in working condition',
  'Basic maintenance included',
  'Safety gear provided',
  'Operator manual and training',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel/electricity consumption',
  'Transportation to site',
  'Damage repairs beyond normal wear',
  'Operator charges (if not included)',
];

const DEFAULT_TERMS = [
  'Security deposit required',
  'Advance payment required',
  'Equipment to be used as intended',
  'Inspection at handover mandatory',
];

export default function CreateEquipmentTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuickStart, setShowQuickStart] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('daily');
  const [description, setDescription] = useState('');
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>(DEFAULT_INCLUSIONS);
  const [exclusions, setExclusions] = useState<string[]>(DEFAULT_EXCLUSIONS);
  const [termsConditions, setTermsConditions] = useState<string[]>(DEFAULT_TERMS);
  const [dailyRateHint, setDailyRateHint] = useState('');
  const [weeklyRateHint, setWeeklyRateHint] = useState('');
  const [monthlyRateHint, setMonthlyRateHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Load Quick Start Template
  const loadQuickStartTemplate = (template: typeof QUICK_START_TEMPLATES[0]) => {
    setName(template.name);
    setCategory(template.category);
    setDescription(template.description);
    setEquipmentTypes(template.equipmentTypes);
    setInclusions([...template.inclusions]);
    setExclusions([...template.exclusions]);
    setTermsConditions([...template.termsConditions]);
    setDailyRateHint(template.dailyRateHint.toString());
    setWeeklyRateHint(template.weeklyRateHint.toString());
    setMonthlyRateHint(template.monthlyRateHint.toString());
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

  const toggleEquipmentType = (value: string) => {
    setEquipmentTypes((prev) =>
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
      const response = await fetch('/api/vendor/equipment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || null,
          equipmentTypes: equipmentTypes.length > 0 ? equipmentTypes : null,
          inclusions,
          exclusions,
          termsConditions,
          dailyRateHint: dailyRateHint ? parseFloat(dailyRateHint) : null,
          weeklyRateHint: weeklyRateHint ? parseFloat(weeklyRateHint) : null,
          monthlyRateHint: monthlyRateHint ? parseFloat(monthlyRateHint) : null,
          isDefault,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/vendor/equipment/templates');
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
          href="/vendor/equipment/templates"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
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
                  className="bg-white rounded-xl p-4 border-2 border-transparent hover:border-amber-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition">
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
                          From ₹{template.dailyRateHint.toLocaleString()}/day
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
          className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
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
                placeholder="e.g., Standard Daily Rental"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable Equipment Types
            </label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleEquipmentType(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    equipmentTypes.includes(type.value)
                      ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to apply to all equipment types
            </p>
          </div>

          {/* Rate Hints */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Daily Rate (₹)
              </label>
              <input
                type="number"
                value={dailyRateHint}
                onChange={(e) => setDailyRateHint(e.target.value)}
                placeholder="e.g., 5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Weekly Rate (₹)
              </label>
              <input
                type="number"
                value={weeklyRateHint}
                onChange={(e) => setWeeklyRateHint(e.target.value)}
                placeholder="e.g., 30000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Monthly Rate (₹)
              </label>
              <input
                type="number"
                value={monthlyRateHint}
                onChange={(e) => setMonthlyRateHint(e.target.value)}
                placeholder="e.g., 100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
              Set as default template for this category
            </label>
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
            href="/vendor/equipment/templates"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
