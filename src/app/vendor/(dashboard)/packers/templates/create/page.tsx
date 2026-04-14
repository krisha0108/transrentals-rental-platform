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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PACKERS_MOVERS_CONFIG } from '@/lib/quote-services';

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
  { id: 'home',      name: 'Home Shifting' },
  { id: 'office',    name: 'Office Shifting' },
  { id: 'local',     name: 'Local Moving' },
  { id: 'intercity', name: 'Intercity Moving' },
];

const SHIFTING_TYPES = [
  { value: '1bhk',         label: '1 BHK' },
  { value: '2bhk',         label: '2 BHK' },
  { value: '3bhk',         label: '3 BHK' },
  { value: '4bhk',         label: '4+ BHK / Villa' },
  { value: 'office-small', label: 'Small Office' },
  { value: 'office-large', label: 'Large Office' },
];

// Quick Start Templates
const QUICK_START_TEMPLATES = [
  {
    name: 'Basic Home Shifting',
    category: 'home',
    emoji: '🏠',
    description: 'Budget-friendly home shifting essentials',
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
    terms: [
      '50% advance payment to confirm booking',
      'Balance payment before unloading',
      'Inventory list to be signed before loading',
      'Claims must be reported within 24 hours',
    ],
  },
  {
    name: 'Standard Home Shifting',
    category: 'home',
    emoji: '📦',
    description: 'Complete relocation with packing materials',
    baseRateHint: 8000,
    shiftingTypes: ['1bhk', '2bhk', '3bhk'],
    inclusions: PACKERS_MOVERS_CONFIG.defaultInclusions,
    exclusions: PACKERS_MOVERS_CONFIG.defaultExclusions,
    terms: PACKERS_MOVERS_CONFIG.defaultTerms,
  },
  {
    name: 'Premium Home Shifting',
    category: 'home',
    emoji: '👑',
    description: 'Premium care with insurance & supervisor',
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
    terms: [
      '40% advance to confirm booking',
      'Balance before unloading',
      'Detailed inventory with photos',
      'Insurance claims within 48 hours',
      'Free re-arrangement within 24 hours',
    ],
  },
  {
    name: 'Local City Shifting',
    category: 'local',
    emoji: '🚚',
    description: 'Quick within-city relocation',
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
    terms: [
      '50% advance payment',
      'Same-day delivery for local moves',
      'Inventory list mandatory',
      'Cancellation charges apply',
    ],
  },
  {
    name: 'Small Office Relocation',
    category: 'office',
    emoji: '🏢',
    description: 'Office shifting up to 10 workstations',
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
    terms: [
      '50% advance to confirm',
      'Inventory verification at both locations',
      "IT equipment at owner's risk unless insured",
      'Overtime charges for extended hours',
      'Weekend shifting at standard rates',
    ],
  },
  {
    name: 'Corporate Relocation',
    category: 'office',
    emoji: '⭐',
    description: 'Enterprise-grade large office moves',
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
    terms: [
      '30% advance, 40% during move, 30% after',
      'Detailed project plan provided',
      'Insurance coverage mandatory',
      'Site survey included',
      'Minimum 7 days notice required',
    ],
  },
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

export default function CreatePackersTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('home');
  const [description, setDescription] = useState('');
  const [shiftingTypes, setShiftingTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [baseRateHint, setBaseRateHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const addItem = (list: string[], setList: (items: string[]) => void, item: string, setItem: (val: string) => void) => {
    if (item.trim() && !list.includes(item.trim())) {
      setList([...list, item.trim()]);
      setItem('');
    }
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter((i) => i !== item));
  };

  const toggleShiftingType = (value: string) => {
    setShiftingTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  };

  const loadDefaults = () => {
    setInclusions(PACKERS_MOVERS_CONFIG.defaultInclusions);
    setExclusions(PACKERS_MOVERS_CONFIG.defaultExclusions);
    setTermsConditions(PACKERS_MOVERS_CONFIG.defaultTerms);
  };

  const loadSuggestion = (s: typeof QUICK_START_TEMPLATES[0]) => {
    setName(s.name);
    setCategory(s.category);
    setDescription(s.description);
    setShiftingTypes([...s.shiftingTypes]);
    setInclusions([...s.inclusions]);
    setExclusions([...s.exclusions]);
    setTermsConditions([...s.terms]);
    setBaseRateHint(s.baseRateHint.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Template name is required'); return; }
    if (inclusions.length === 0) { setError('At least one inclusion is required'); return; }

    setIsSubmitting(true);
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
          isActive: true,
        }),
      });

      const data = await response.json();
      if (data.success) router.push('/vendor/packers/templates');
      else setError(data.error || 'Failed to create template');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <Link href="/vendor/packers/templates" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all border border-white/20 active:scale-95 group">
              <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-white">Create Template</h1>
              <p className="text-emerald-100 text-xs">Build a reusable template for quick quotes</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Quick Start Suggestions ── */}
      <FadeIn delay={50}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Quick Start</h3>
            <span className="text-sm text-gray-400 ml-1">Pick a template to pre-fill</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {QUICK_START_TEMPLATES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSuggestion(s)}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group active:scale-[0.98]"
              >
                <span className="text-lg mb-1 block">{s.emoji}</span>
                <p className="text-sm font-bold text-gray-900 mb-0.5 truncate">{s.name}</p>
                <p className="text-xs text-gray-400 line-clamp-1">{s.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">From ₹{s.baseRateHint.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
          <button type="button" onClick={loadDefaults} className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
            <Zap className="w-3 h-3" /> Or load default items only
          </button>
        </div>
      </FadeIn>

      <form id="packers-create-form" onSubmit={handleSubmit}>
        <FadeIn delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ══════════ LEFT COLUMN ══════════ */}
            <div className="space-y-4">
              {/* ── Basic Info ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Template Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Home Shifting" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={cn(
                            'px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border',
                            category === cat.id
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Description <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this template..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all resize-none" rows={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Applicable Shifting Types</label>
                    <div className="flex flex-wrap gap-2">
                      {SHIFTING_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => toggleShiftingType(type.value)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border',
                            shiftingTypes.includes(type.value)
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Rate Hint ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Base Rate Hint
                  <span className="text-[10px] font-normal text-gray-400 ml-1">(optional)</span>
                </h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                  <input type="number" value={baseRateHint} onChange={(e) => setBaseRateHint(e.target.value)} placeholder="8,000" className="w-full pl-7 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 hover:border-gray-300 transition-all tabular-nums" />
                </div>
              </div>

              {/* ── Default Toggle ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn('relative w-10 h-6 rounded-full transition-colors duration-200', isDefault ? 'bg-emerald-600' : 'bg-gray-200')} onClick={() => setIsDefault(!isDefault)}>
                    <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200', isDefault ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" /> Set as default template
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">Auto-applied when creating quotes</p>
                  </div>
                </label>
              </div>
            </div>

            {/* ══════════ RIGHT COLUMN ══════════ */}
            <div className="space-y-4">
              {/* ── Inclusions ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Inclusions
                  {inclusions.length > 0 && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">{inclusions.length}</span>}
                </h2>
                <ListInput value={newInclusion} onChange={setNewInclusion} onAdd={() => addItem(inclusions, setInclusions, newInclusion, setNewInclusion)} placeholder="Add what's included..." color="emerald" />
                {inclusions.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {inclusions.map((item, idx) => (
                      <ListChip key={idx} item={item} onRemove={() => removeItem(inclusions, setInclusions, item)} color="emerald" />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Exclusions ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  Exclusions
                  {exclusions.length > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">{exclusions.length}</span>}
                </h2>
                <ListInput value={newExclusion} onChange={setNewExclusion} onAdd={() => addItem(exclusions, setExclusions, newExclusion, setNewExclusion)} placeholder="Add what's not included..." color="red" />
                {exclusions.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {exclusions.map((item, idx) => (
                      <ListChip key={idx} item={item} onRemove={() => removeItem(exclusions, setExclusions, item)} color="red" />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Terms & Conditions ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ScrollText className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  Terms & Conditions
                  {termsConditions.length > 0 && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">{termsConditions.length}</span>}
                </h2>
                <ListInput value={newTerm} onChange={setNewTerm} onAdd={() => addItem(termsConditions, setTermsConditions, newTerm, setNewTerm)} placeholder="Add a term or condition..." color="gray" />
                {termsConditions.length > 0 && (
                  <div className="space-y-1.5 mt-3">
                    {termsConditions.map((item, idx) => (
                      <ListChip key={idx} item={item} onRemove={() => removeItem(termsConditions, setTermsConditions, item)} color="gray" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 flex gap-3 z-20">
        <Link href="/vendor/packers/templates" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">
          Cancel
        </Link>
        <button form="packers-create-form" type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {isSubmitting ? (
            <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</>
          ) : (
            <><Save className="w-4 h-4" /> Create Template</>
          )}
        </button>
      </div>
    </div>
  );
}
