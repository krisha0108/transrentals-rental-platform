'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  ArrowLeft,
  Plus,
  X,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Save,
  Sparkles,
  IndianRupee,
  Shield,
  ScrollText,
  Star,
  Zap,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SELF_DRIVE_CATEGORIES = [
  { id: 'hatchback', name: 'Hatchback' },
  { id: 'sedan', name: 'Sedan' },
  { id: 'suv', name: 'SUV' },
  { id: 'muv', name: 'MUV' },
  { id: 'compact-suv', name: 'Compact SUV' },
  { id: 'luxury', name: 'Luxury' },
];

const DEFAULT_INCLUSIONS = [
  'Vehicle with full tank',
  'Valid insurance & registration',
  'Basic maintenance during rental',
  '24x7 roadside assistance',
  'No hidden charges',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel charges',
  'Traffic challans/fines',
  'Toll charges',
  'Damage due to negligence',
  'Any unauthorized usage',
];

const DEFAULT_TERMS = [
  'Valid driving license (2+ years old) required',
  'Original Aadhaar card required',
  'Security deposit refundable after inspection',
  'No inter-state travel without prior approval',
  'Late return charges: ₹200/hour after 2 hours grace',
];

const TEMPLATE_SUGGESTIONS = [
  {
    name: 'Weekend Hatchback Rental', category: 'hatchback', emoji: '🚗',
    description: 'Perfect for weekend getaways and short trips',
    inclusions: ['Vehicle with full tank', 'Valid insurance & registration', '24x7 roadside assistance', 'Basic maintenance during rental', 'First aid kit & emergency tools'],
    exclusions: ['Fuel charges', 'Traffic challans/fines', 'Toll charges', 'Parking charges', 'Damage due to negligence'],
    terms: ['Valid driving license (2+ years old) required', 'Original Aadhaar card & PAN card required', 'Security deposit refundable after inspection', 'Maximum 2 drivers allowed', 'Late return charges: ₹150/hour', 'Weekend packages: Friday evening to Monday morning'],
    dailyRateHint: 1200, kmLimitPerDayHint: 250, extraKmRateHint: 8, securityDepositHint: 3000,
  },
  {
    name: 'Long Distance SUV Trip', category: 'suv', emoji: '🚙',
    description: 'Ideal for long distance travel and family trips',
    inclusions: ['Vehicle with full tank', 'Comprehensive insurance coverage', '24x7 roadside assistance', 'Breakdown support anywhere in India', 'GPS navigation system', 'Unlimited KM package available'],
    exclusions: ['Fuel charges', 'Driver accommodation', 'Traffic challans/fines', 'Border permit charges', 'Vehicle cleaning charges if returned dirty'],
    terms: ['Valid driving license (3+ years old) required', 'Original Aadhaar, PAN, passport required', 'Security deposit: ₹10,000 refundable', 'Inter-state travel allowed with prior notice', 'Late return charges: ₹300/hour'],
    dailyRateHint: 3500, kmLimitPerDayHint: 300, extraKmRateHint: 12, securityDepositHint: 10000,
  },
  {
    name: 'City Daily Sedan Rental', category: 'sedan', emoji: '🏎️',
    description: 'Best for daily commute and city travel',
    inclusions: ['Vehicle with full tank', 'Valid insurance & registration', 'Basic maintenance during rental', '24x7 roadside assistance', 'Daily cleaning service'],
    exclusions: ['Fuel charges', 'Traffic challans/fines', 'Parking charges', 'Toll charges', 'Inter-city travel'],
    terms: ['Valid driving license (2+ years old) required', 'Original Aadhaar card required', 'Security deposit refundable after inspection', 'City limits only', 'Late return charges: ₹200/hour'],
    dailyRateHint: 1800, kmLimitPerDayHint: 200, extraKmRateHint: 9, securityDepositHint: 5000,
  },
  {
    name: 'Luxury Car Experience', category: 'luxury', emoji: '✨',
    description: 'Premium luxury cars for special occasions',
    inclusions: ['Luxury vehicle with full tank', 'Comprehensive insurance', 'Premium roadside assistance', 'Professional cleaning', 'Concierge support', 'Airport pickup/drop'],
    exclusions: ['Fuel charges', 'Chauffeur service', 'Traffic challans/fines', 'Valet parking', 'Any modifications'],
    terms: ['Valid driving license (5+ years old) required', 'Passport, Aadhaar, PAN mandatory', 'Security deposit: ₹20,000 refundable', 'Credit card pre-authorization required', 'Late return charges: ₹500/hour'],
    dailyRateHint: 8000, kmLimitPerDayHint: 150, extraKmRateHint: 25, securityDepositHint: 20000,
  },
];

// ── List item input ──
function ListInput({ value, onChange, onAdd, placeholder, color }: { value: string; onChange: (v: string) => void; onAdd: () => void; placeholder: string; color: 'emerald' | 'red' | 'gray' }) {
  const colorMap = { emerald: 'focus:ring-emerald-500/20 focus:border-emerald-300', red: 'focus:ring-red-500/20 focus:border-red-300', gray: 'focus:ring-gray-500/20 focus:border-gray-300' };
  const btnMap = { emerald: 'bg-emerald-500 hover:bg-emerald-600', red: 'bg-red-500 hover:bg-red-600', gray: 'bg-gray-700 hover:bg-gray-800' };
  return (
    <div className="flex gap-2">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} placeholder={placeholder}
        className={`flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:ring-2 ${colorMap[color]}`} />
      <button type="button" onClick={onAdd} className={`w-9 h-9 shrink-0 rounded-xl ${btnMap[color]} text-white flex items-center justify-center active:scale-95 transition-all`}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── List item chip ──
function ListChip({ item, onRemove, color }: { item: string; onRemove: () => void; color: 'emerald' | 'red' | 'gray' }) {
  const styles = { emerald: 'bg-emerald-50 border-emerald-100', red: 'bg-red-50 border-red-100', gray: 'bg-gray-50 border-gray-100' };
  const dotColor = { emerald: 'bg-emerald-400', red: 'bg-red-400', gray: 'bg-gray-400' };
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${styles[color]} group/chip transition-all hover:shadow-sm`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor[color]} shrink-0`} />
      <span className="flex-1 text-sm text-gray-700">{item}</span>
      <button type="button" onClick={onRemove} className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center opacity-0 group-hover/chip:opacity-100 hover:bg-white transition-all">
        <X className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}

export default function CreateSelfDriveTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vendor/self-drive-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, category, description: description || null, inclusions, exclusions, termsConditions,
          dailyRateHint: dailyRateHint ? parseFloat(dailyRateHint) : null,
          kmLimitPerDayHint: kmLimitPerDayHint ? parseInt(kmLimitPerDayHint) : null,
          extraKmRateHint: extraKmRateHint ? parseFloat(extraKmRateHint) : null,
          securityDepositHint: securityDepositHint ? parseFloat(securityDepositHint) : null,
          isDefault, isActive: true,
        }),
      });
      const data = await response.json();
      if (data.success) { alert('Template created successfully!'); router.push('/vendor/self-drive/templates'); }
      else { alert(data.error || 'Failed to create template'); }
    } catch (error) { console.error('Failed:', error); alert('Failed to create template'); }
    finally { setIsSubmitting(false); }
  };

  const addItem = (list: string[], setList: (items: string[]) => void, item: string, setItem: (val: string) => void) => {
    if (item.trim() && !list.includes(item.trim())) { setList([...list, item.trim()]); setItem(''); }
  };
  const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => { setList(list.filter((i) => i !== item)); };
  const loadDefaults = () => { setInclusions(DEFAULT_INCLUSIONS); setExclusions(DEFAULT_EXCLUSIONS); setTermsConditions(DEFAULT_TERMS); };
  const loadSuggestion = (s: typeof TEMPLATE_SUGGESTIONS[0]) => {
    setName(s.name); setCategory(s.category); setDescription(s.description); setInclusions(s.inclusions); setExclusions(s.exclusions); setTermsConditions(s.terms);
    setDailyRateHint(s.dailyRateHint.toString()); setKmLimitPerDayHint(s.kmLimitPerDayHint.toString()); setExtraKmRateHint(s.extraKmRateHint.toString()); setSecurityDepositHint(s.securityDepositHint.toString());
  };

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 p-5 mb-5 animate-slide-down">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-8 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center gap-3">
          <Link href="/vendor/self-drive/templates" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all border border-white/20 active:scale-95 group">
            <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-white">Create Template</h1>
            <p className="text-emerald-100 text-xs">Self-drive car reusable template</p>
          </div>
        </div>
      </div>

      {/* ── Quick Start ── */}
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
            <button key={idx} type="button" onClick={() => loadSuggestion(s)}
              className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left active:scale-[0.98]">
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

      <form id="sd-create-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

          {/* ══════════ LEFT COLUMN ══════════ */}
          <div className="space-y-4">
            {/* Basic Info */}
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
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Hatchback" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">Category *</label>
                  <div className="flex flex-wrap gap-2">
                    {SELF_DRIVE_CATEGORIES.map((cat) => (
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
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all resize-none" rows={2} />
                </div>
              </div>
            </div>

            {/* Rate Hints */}
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
                  { label: 'Daily Rate', value: dailyRateHint, set: setDailyRateHint, placeholder: '1500' },
                  { label: 'KM Limit/Day', value: kmLimitPerDayHint, set: setKmLimitPerDayHint, placeholder: '200', noRupee: true },
                  { label: 'Extra KM Rate', value: extraKmRateHint, set: setExtraKmRateHint, placeholder: '10' },
                  { label: 'Security Deposit', value: securityDepositHint, set: setSecurityDepositHint, placeholder: '5000' },
                ].map((r: any) => (
                  <div key={r.label}>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">{r.label}</label>
                    <div className="relative">
                      {!r.noRupee && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>}
                      <input type="number" value={r.value} onChange={(e: any) => r.set(e.target.value)} placeholder={r.placeholder}
                        className={`w-full ${r.noRupee ? 'px-3.5' : 'pl-7 pr-3.5'} py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 hover:border-gray-300 transition-all tabular-nums`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Default Toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <label className="flex items-center gap-3 cursor-pointer">
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
            {/* Inclusions */}
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
                  {inclusions.map((item, idx) => <ListChip key={idx} item={item} onRemove={() => removeItem(inclusions, setInclusions, item)} color="emerald" />)}
                </div>
              )}
            </div>

            {/* Exclusions */}
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
                  {exclusions.map((item, idx) => <ListChip key={idx} item={item} onRemove={() => removeItem(exclusions, setExclusions, item)} color="red" />)}
                </div>
              )}
            </div>

            {/* Terms */}
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
                  {termsConditions.map((item, idx) => <ListChip key={idx} item={item} onRemove={() => removeItem(termsConditions, setTermsConditions, item)} color="gray" />)}
                </div>
              )}
            </div>
          </div>
        </div>

      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 -mx-4 md:-mx-6 flex gap-3 z-20">
        <Link href="/vendor/self-drive/templates" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">
          Cancel
        </Link>
        <button form="sd-create-form" type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
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
