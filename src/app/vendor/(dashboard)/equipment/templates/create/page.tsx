'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  X,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Save,
  IndianRupee,
  ScrollText,
  Sparkles,
  Star,
  Zap,
  AlertCircle,
  Wrench,
  HardHat,
  Truck,
  Cog,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Fade-in ──
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(14px)', transition: `opacity .5s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .5s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

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
    color: 'bg-emerald-50 text-emerald-600',
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
    color: 'bg-emerald-50 text-emerald-600',
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
    color: 'bg-cyan-50 text-cyan-600',
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
    color: 'bg-blue-50 text-blue-600',
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
    color: 'bg-emerald-50 text-emerald-600',
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
    color: 'bg-emerald-50 text-emerald-700',
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

// ── List input ──
function ListInput({ value, onChange, onAdd, placeholder, color }: { value: string; onChange: (v: string) => void; onAdd: () => void; placeholder: string; color: 'emerald' | 'red' | 'gray' }) {
  const ring = { emerald: 'focus:ring-emerald-500/20 focus:border-emerald-300', red: 'focus:ring-red-500/20 focus:border-red-300', gray: 'focus:ring-gray-500/20 focus:border-gray-300' };
  const btn = { emerald: 'bg-emerald-500 hover:bg-emerald-600', red: 'bg-red-500 hover:bg-red-600', gray: 'bg-gray-700 hover:bg-gray-800' };
  return (
    <div className="flex gap-2">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} placeholder={placeholder} className={`flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:ring-2 ${ring[color]}`} />
      <button type="button" onClick={onAdd} className={`w-9 h-9 shrink-0 rounded-xl ${btn[color]} text-white flex items-center justify-center active:scale-95 transition-all`}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── List chip ──
function ListChip({ item, onRemove, color }: { item: string; onRemove: () => void; color: 'emerald' | 'red' | 'gray' }) {
  const bg = { emerald: 'bg-emerald-50 border-emerald-100', red: 'bg-red-50 border-red-100', gray: 'bg-gray-50 border-gray-100' };
  const dot = { emerald: 'bg-emerald-400', red: 'bg-red-400', gray: 'bg-gray-400' };
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${bg[color]} group/chip transition-all hover:shadow-sm`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dot[color]} shrink-0`} />
      <span className="flex-1 text-sm text-gray-700">{item}</span>
      <button type="button" onClick={onRemove} className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center opacity-0 group-hover/chip:opacity-100 hover:bg-white transition-all">
        <X className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}

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

  // Input states for adding new items
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

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

  const loadDefaults = () => {
    setInclusions(DEFAULT_INCLUSIONS);
    setExclusions(DEFAULT_EXCLUSIONS);
    setTermsConditions(DEFAULT_TERMS);
  };

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
    <div className="pb-24">
      {/* ── Header ── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 mb-5">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
            <div className="absolute right-20 -bottom-8 w-20 h-20 rounded-full bg-white" />
          </div>
          <div className="relative flex items-center gap-3">
            <Link href="/vendor/equipment/templates" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all border border-white/20 active:scale-95 group">
              <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-white">Create Template</h1>
              <p className="text-emerald-100 text-xs">Build a reusable template for quick equipment quotes</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Quick Start Suggestions ── */}
      {showQuickStart && (
        <FadeIn delay={50}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Quick Start</h3>
                <span className="text-sm text-gray-400 ml-1">Pick a template to pre-fill</span>
              </div>
              <button type="button" onClick={() => setShowQuickStart(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_START_TEMPLATES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => loadQuickStartTemplate(s)}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group active:scale-[0.98]"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-0.5 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{s.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">₹{s.dailyRateHint.toLocaleString()}/day</span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{s.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={loadDefaults} className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
              <Zap className="w-3 h-3" /> Or load default items only
            </button>
          </div>
        </FadeIn>
      )}

      {!showQuickStart && (
        <button
          type="button"
          onClick={() => setShowQuickStart(true)}
          className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-5"
        >
          <Sparkles className="w-4 h-4" />
          Show Quick Start Templates
        </button>
      )}

      <form id="equipment-create-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ══════════ LEFT COLUMN ══════════ */}
          <div className="space-y-4">
            {/* ── Basic Info ── */}
            <FadeIn delay={100}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Template Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Daily Rental" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                          className={cn('px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border',
                            category === cat.value ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                          )}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Description <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this template..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all resize-none" rows={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Applicable Equipment Types <span className="font-normal text-gray-400 normal-case">(leave empty for all)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {EQUIPMENT_TYPES.map((type) => (
                        <button key={type.value} type="button" onClick={() => toggleEquipmentType(type.value)}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border',
                            equipmentTypes.includes(type.value) ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/20' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          )}>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* ── Rate Hints ── */}
            <FadeIn delay={150}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Rate Hints
                  <span className="text-[10px] font-normal text-gray-400 ml-1">(optional)</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Daily Rate', value: dailyRateHint, set: setDailyRateHint, placeholder: '5,000' },
                    { label: 'Weekly Rate', value: weeklyRateHint, set: setWeeklyRateHint, placeholder: '30,000' },
                    { label: 'Monthly Rate', value: monthlyRateHint, set: setMonthlyRateHint, placeholder: '100,000' },
                  ].map((r) => (
                    <div key={r.label}>
                      <label className="block text-sm font-bold text-gray-500 mb-1.5">{r.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                        <input type="number" value={r.value} onChange={(e) => r.set(e.target.value)} placeholder={r.placeholder} className="w-full pl-7 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 hover:border-gray-300 transition-all tabular-nums" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* ── Default Toggle ── */}
            <FadeIn delay={200}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn('relative w-10 h-6 rounded-full transition-colors duration-200', isDefault ? 'bg-emerald-500' : 'bg-gray-200')} onClick={() => setIsDefault(!isDefault)}>
                    <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200', isDefault ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-emerald-400" /> Set as default template
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">Auto-applied when creating quotes for this category</p>
                  </div>
                </label>
              </div>
            </FadeIn>
          </div>

          {/* ══════════ RIGHT COLUMN ══════════ */}
          <div className="space-y-4">
            {/* ── Inclusions ── */}
            <FadeIn delay={120}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Inclusions <span className="text-red-400 text-xs">*</span>
                  {inclusions.length > 0 && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">{inclusions.length}</span>}
                </h2>
                <ListInput value={newInclusion} onChange={setNewInclusion} onAdd={() => addItem('inclusion')} placeholder="Add what's included..." color="emerald" />
                {inclusions.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {inclusions.map((item, idx) => (
                      <ListChip key={idx} item={item} onRemove={() => removeItem('inclusion', idx)} color="emerald" />
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>

            {/* ── Exclusions ── */}
            <FadeIn delay={170}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  Exclusions
                  {exclusions.length > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">{exclusions.length}</span>}
                </h2>
                <ListInput value={newExclusion} onChange={setNewExclusion} onAdd={() => addItem('exclusion')} placeholder="Add what's not included..." color="red" />
                {exclusions.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {exclusions.map((item, idx) => (
                      <ListChip key={idx} item={item} onRemove={() => removeItem('exclusion', idx)} color="red" />
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>

            {/* ── Terms & Conditions ── */}
            <FadeIn delay={220}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ScrollText className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  Terms & Conditions
                  {termsConditions.length > 0 && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">{termsConditions.length}</span>}
                </h2>
                <ListInput value={newTerm} onChange={setNewTerm} onAdd={() => addItem('term')} placeholder="Add a term or condition..." color="gray" />
                {termsConditions.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {termsConditions.map((item, idx) => (
                      <ListChip key={idx} item={item} onRemove={() => removeItem('term', idx)} color="gray" />
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 flex gap-3 z-20">
        <Link href="/vendor/equipment/templates" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">
          Cancel
        </Link>
        <button form="equipment-create-form" type="submit" disabled={isLoading} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {isLoading ? (
            <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</>
          ) : (
            <><Save className="w-4 h-4" /> Create Template</>
          )}
        </button>
      </div>
    </div>
  );
}
