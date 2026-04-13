'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BikeIcon as Bike,
  ArrowLeft,
  Plus,
  X,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Save,
  Lightbulb,
  IndianRupee,
  Shield,
  ScrollText,
  Sparkles,
  ChevronRight,
  Star,
  Zap,
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
    emoji: '🏍️',
    description: 'Perfect for daily office commute and city travel',
    inclusions: ['Bike with 2 helmets', 'Valid insurance & registration', 'Free pickup & drop at your location', '24x7 roadside assistance', 'No hidden charges'],
    exclusions: ['Fuel charges', 'Traffic challans/fines', 'Helmet replacement if damaged', 'Any modifications to bike'],
    terms: ['Valid 2-wheeler license required', 'Original Aadhaar card required', 'Security deposit: ₹1,000 refundable', 'Rental period: 24 hours from pickup', 'Late return charges: ₹50/hour', 'Monthly packages available at discounted rates'],
    dailyRateHint: 300, weeklyRateHint: 1800, monthlyRateHint: 6000, securityDepositHint: 1000,
  },
  {
    name: 'Weekend Sports Bike',
    category: 'sports',
    emoji: '🏎️',
    description: 'High-performance bikes for weekend adventures',
    inclusions: ['Sports bike with 2 premium helmets', 'Comprehensive insurance coverage', '24x7 roadside assistance', 'Free bike wash on return', 'Riding gloves included', 'GPS tracker for safety'],
    exclusions: ['Fuel charges', 'Racing or stunt activities', 'Traffic challans/fines', 'Damage due to negligence', 'Riding gear (except helmets)'],
    terms: ['Valid 2-wheeler license (2+ years old) required', 'Original Aadhaar & PAN card required', 'Security deposit: ₹5,000 refundable', 'Age: 23-50 years only', 'No racing or stunt riding allowed', 'Late return charges: ₹200/hour', 'Weekend packages: Friday to Monday'],
    dailyRateHint: 1500, weeklyRateHint: 9000, monthlyRateHint: 30000, securityDepositHint: 5000,
  },
  {
    name: 'Long Distance Touring',
    category: 'touring',
    emoji: '🗺️',
    description: 'Comfortable touring bikes for long journeys',
    inclusions: ['Touring bike with 2 helmets', 'Comprehensive insurance & registration', 'Breakdown support anywhere in India', 'Saddle bags & luggage carrier', '24x7 roadside assistance', 'Tool kit & puncture kit'],
    exclusions: ['Fuel charges', 'Accommodation charges', 'Traffic challans/fines', 'Border permit charges', 'Bike cleaning if returned dirty'],
    terms: ['Valid 2-wheeler license (3+ years old) required', 'Original Aadhaar, PAN, passport required', 'Security deposit: ₹3,000 refundable', 'Inter-state travel allowed', 'Maximum 2 riders allowed', 'Late return charges: ₹150/hour', 'Weekly packages available with discount'],
    dailyRateHint: 800, weeklyRateHint: 5000, monthlyRateHint: 18000, securityDepositHint: 3000,
  },
  {
    name: 'Scooty/Scooter Rental',
    category: 'scooter',
    emoji: '🛵',
    description: 'Easy-to-ride scooters for everyone',
    inclusions: ['Scooty with 2 helmets', 'Valid insurance & registration', 'Easy pickup & drop', '24x7 support', 'Storage box included'],
    exclusions: ['Fuel charges', 'Traffic challans/fines', 'Helmet replacement if lost', 'Long distance travel'],
    terms: ['Valid 2-wheeler license required', 'Original ID proof required', 'Security deposit: ₹500 refundable', 'City limits only', 'Late return charges: ₹30/hour', 'Student discounts available'],
    dailyRateHint: 250, weeklyRateHint: 1500, monthlyRateHint: 5000, securityDepositHint: 500,
  },
];

// ── List item input component ──
function ListInput({
  value, onChange, onAdd, placeholder, color,
}: { value: string; onChange: (v: string) => void; onAdd: () => void; placeholder: string; color: 'emerald' | 'red' | 'gray' }) {
  const colorMap = {
    emerald: 'focus:ring-emerald-500/20 focus:border-emerald-300',
    red: 'focus:ring-red-500/20 focus:border-red-300',
    gray: 'focus:ring-gray-500/20 focus:border-gray-300',
  };
  const btnMap = {
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    red: 'bg-red-500 hover:bg-red-600',
    gray: 'bg-gray-700 hover:bg-gray-800',
  };
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
        placeholder={placeholder}
        className={`flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:ring-2 ${colorMap[color]}`}
      />
      <button
        type="button"
        onClick={onAdd}
        className={`w-9 h-9 shrink-0 rounded-xl ${btnMap[color]} text-white flex items-center justify-center active:scale-95 transition-all`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── List item chip ──
function ListChip({
  item, onRemove, color,
}: { item: string; onRemove: () => void; color: 'emerald' | 'red' | 'gray'; index?: number }) {
  const styles = {
    emerald: 'bg-emerald-50 border-emerald-100',
    red: 'bg-red-50 border-red-100',
    gray: 'bg-gray-50 border-gray-100',
  };
  const dotColor = {
    emerald: 'bg-emerald-400',
    red: 'bg-red-400',
    gray: 'bg-gray-400',
  };
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${styles[color]} group/chip transition-all hover:shadow-sm`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor[color]} shrink-0`} />
      <span className="flex-1 text-sm text-gray-700">{item}</span>
      <button
        type="button"
        onClick={onRemove}
        className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center opacity-0 group-hover/chip:opacity-100 hover:bg-white transition-all"
      >
        <X className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}

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
    <div className="pb-24">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-500 p-5 mb-5 animate-slide-down">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-8 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center gap-3">
          <Link href="/vendor/bike/templates" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all border border-white/20 active:scale-95 group">
            <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-white">Create Template</h1>
            <p className="text-emerald-100 text-xs">Build a reusable template for quick quotes</p>
          </div>
        </div>
      </div>

      {/* ── Quick Start Suggestions ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Quick Start</h3>
          <span className="text-sm text-gray-400 ml-1">Pick a template to pre-fill</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEMPLATE_SUGGESTIONS.map((s, idx) => (
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
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">₹{s.dailyRateHint}/day</span>
              </div>
            </button>
          ))}
        </div>
        <button type="button" onClick={loadDefaults} className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
          <Zap className="w-3 h-3" /> Or load default items only
        </button>
      </div>

      <form id="bike-create-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

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
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Commuter Bike" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">Category *</label>
                  <div className="flex flex-wrap gap-2">
                    {BIKE_CATEGORIES.map((cat) => (
                      <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                        className={cn('px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border',
                          category === cat.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                        )}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">Description <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this template..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all resize-none" rows={2} />
                </div>
              </div>
            </div>

            {/* ── Rate Hints ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                Rate Hints
                <span className="text-[10px] font-normal text-gray-400 ml-1">(optional)</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Daily Rate', value: dailyRateHint, set: setDailyRateHint, placeholder: '500' },
                  { label: 'Weekly Rate', value: weeklyRateHint, set: setWeeklyRateHint, placeholder: '3,000' },
                  { label: 'Monthly Rate', value: monthlyRateHint, set: setMonthlyRateHint, placeholder: '10,000' },
                  { label: 'Security Deposit', value: securityDepositHint, set: setSecurityDepositHint, placeholder: '2,000' },
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

            {/* ── Default Toggle ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn('relative w-10 h-6 rounded-full transition-colors duration-200', isDefault ? 'bg-emerald-500' : 'bg-gray-200')} onClick={() => setIsDefault(!isDefault)}>
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

      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 flex gap-3 z-20">
        <Link href="/vendor/bike/templates" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">
          Cancel
        </Link>
        <button form="bike-create-form" type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-500 hover:from-emerald-600 hover:to-emerald-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
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
