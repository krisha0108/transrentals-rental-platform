'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  IndianRupee,
  ScrollText,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BUS_CATEGORIES,
  BUS_TRIP_TYPES,
  DEFAULT_INCLUSIONS,
  DEFAULT_EXCLUSIONS,
  DEFAULT_TERMS,
  TEMPLATE_SUGGESTIONS,
} from '@/lib/bus-categories';

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

function ListInput({ value, onChange, onAdd, placeholder, color }: { value: string; onChange: (v: string) => void; onAdd: () => void; placeholder: string; color: 'emerald' | 'red' | 'gray' }) {
  const ring = { emerald: 'focus:ring-emerald-500/20 focus:border-emerald-300', red: 'focus:ring-red-500/20 focus:border-red-300', gray: 'focus:ring-gray-500/20 focus:border-gray-300' };
  const btn = { emerald: 'bg-emerald-500 hover:bg-emerald-600', red: 'bg-red-500 hover:bg-red-600', gray: 'bg-gray-700 hover:bg-gray-800' };
  return (
    <div className="flex gap-2">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} placeholder={placeholder} className={`flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none transition-all hover:border-gray-300 focus:ring-2 ${ring[color]}`} />
      <button type="button" onClick={onAdd} className={`w-9 h-9 shrink-0 rounded-xl ${btn[color]} text-white flex items-center justify-center active:scale-95 transition-all`}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function ListChip({ item, onRemove, color }: { item: string; onRemove: () => void; color: 'emerald' | 'red' | 'gray' }) {
  const styles = { emerald: 'bg-emerald-50 border-emerald-100', red: 'bg-red-50 border-red-100', gray: 'bg-gray-50 border-gray-100' };
  const dot = { emerald: 'bg-emerald-400', red: 'bg-red-400', gray: 'bg-gray-400' };
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${styles[color]} group/chip transition-all hover:shadow-sm`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dot[color]} shrink-0`} />
      <span className="flex-1 text-sm text-gray-700">{item}</span>
      <button type="button" onClick={onRemove} className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center opacity-0 group-hover/chip:opacity-100 hover:bg-white transition-all">
        <X className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}

export default function CreateBusTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [baseRateHint, setBaseRateHint] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vendor/bus-templates', {
        method: 'POST',
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
          isActive: true,
        }),
      });
      const data = await response.json();
      if (data.success) router.push('/vendor/bus/templates');
      else alert(data.error || 'Failed to create template');
    } catch {
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
  const toggleVehicleType = (id: string) => {
    setVehicleTypes((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };
  const loadDefaults = () => {
    setInclusions(DEFAULT_INCLUSIONS);
    setExclusions(DEFAULT_EXCLUSIONS);
    setTermsConditions(DEFAULT_TERMS);
  };
  const loadSuggestion = (s: typeof TEMPLATE_SUGGESTIONS[0]) => {
    setName(s.name);
    setCategory(s.category);
    setInclusions(s.inclusions);
    setExclusions(s.exclusions);
    setTermsConditions(s.terms);
  };

  return (
    <div className="pb-24">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 mb-5">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white" />
          <div className="absolute right-20 -bottom-8 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center gap-3">
          <Link href="/vendor/bus/templates" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all border border-white/20 active:scale-95 group">
            <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-white">Create Template</h1>
            <p className="text-emerald-100 text-xs">Build a reusable bus template for quick quotes</p>
          </div>
        </div>
      </div>

      {/* ── Quick Start ── */}
      <FadeIn delay={50}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Quick Start</h3>
            <span className="text-sm text-gray-400 ml-1">Pick a template to pre-fill</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {TEMPLATE_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSuggestion(s)}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left active:scale-[0.98]"
              >
                <Bus className="w-4 h-4 text-emerald-500 mb-1" />
                <p className="text-sm font-bold text-gray-900 mb-0.5 truncate">{s.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{BUS_TRIP_TYPES.find((t) => t.id === s.category)?.name || s.category}</p>
              </button>
            ))}
          </div>
          <button type="button" onClick={loadDefaults} className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
            <Zap className="w-3 h-3" /> Or load default items only
          </button>
        </div>
      </FadeIn>

      <form id="bus-create-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ══ LEFT COLUMN ══ */}
          <div className="space-y-4">
            {/* Basic Info */}
            <FadeIn delay={100}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Template Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Outstation Trip" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Trip Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {BUS_TRIP_TYPES.map((cat) => (
                        <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                          className={cn('px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border',
                            category === cat.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                          )}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1.5">Description <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-gray-300 transition-all resize-none" rows={2} />
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Vehicle Types */}
            <FadeIn delay={140}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Bus className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  Applicable Vehicle Types
                  <span className="text-[10px] font-normal text-gray-400 ml-1">(optional)</span>
                </h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {BUS_CATEGORIES.map((veh) => (
                    <button
                      key={veh.id}
                      type="button"
                      onClick={() => toggleVehicleType(veh.id)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border text-left',
                        vehicleTypes.includes(veh.id)
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-blue-500/20'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="font-bold">{veh.shortName}</div>
                      <div className={cn('text-[10px] mt-0.5', vehicleTypes.includes(veh.id) ? 'text-white/80' : 'text-gray-400')}>
                        {veh.seatingCapacity.min}-{veh.seatingCapacity.max} seats
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>

          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="space-y-4">
            <FadeIn delay={120}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
            </FadeIn>

            <FadeIn delay={160}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
            </FadeIn>

            <FadeIn delay={200}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
            </FadeIn>

            {/* Base Rate + Default toggle */}
            <FadeIn delay={220}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5 flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Base Rate Hint <span className="font-normal text-gray-400 normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                    <input type="number" value={baseRateHint} onChange={(e) => setBaseRateHint(e.target.value)} placeholder="15,000" className="w-full pl-7 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 hover:border-gray-300 transition-all tabular-nums" />
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={cn('relative w-10 h-6 rounded-full transition-colors duration-200', isDefault ? 'bg-emerald-600' : 'bg-gray-200')} onClick={() => setIsDefault(!isDefault)}>
                      <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200', isDefault ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" /> Set as default template
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Auto-applied when creating quotes</p>
                    </div>
                  </label>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 -mx-4 md:-mx-6 flex gap-3 z-20">
        <Link href="/vendor/bus/templates" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">
          Cancel
        </Link>
        <button form="bus-create-form" type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
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
