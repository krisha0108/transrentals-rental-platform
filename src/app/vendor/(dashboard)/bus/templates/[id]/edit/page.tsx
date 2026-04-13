'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Save,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ScrollText,
  Bus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BUS_CATEGORIES, BUS_TRIP_TYPES } from '@/lib/bus-categories';

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
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())} placeholder={placeholder} className={`flex-1 px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none transition-all focus:ring-2 ${ring[color]}`} />
      <button type="button" onClick={onAdd} className={`w-9 h-9 shrink-0 rounded-xl ${btn[color]} text-white flex items-center justify-center active:scale-95 transition-all`}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

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

function Toggle({ checked, onChange, label, subtitle }: { checked: boolean; onChange: (v: boolean) => void; label: string; subtitle?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={cn('relative w-10 h-6 rounded-full transition-colors duration-200', checked ? 'bg-emerald-600' : 'bg-gray-200')} onClick={() => onChange(!checked)}>
        <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </label>
  );
}

export default function EditBusTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
      } catch {
        setError('Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };
    if (templateId) fetchTemplate();
  }, [templateId]);

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
    if (type === 'inclusion') setInclusions(inclusions.filter((_, i) => i !== index));
    else if (type === 'exclusion') setExclusions(exclusions.filter((_, i) => i !== index));
    else setTermsConditions(termsConditions.filter((_, i) => i !== index));
  };

  const toggleVehicleType = (value: string) => {
    setVehicleTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Template name is required'); return; }
    if (!category) { setError('Category is required'); return; }
    if (inclusions.length === 0) { setError('At least one inclusion is required'); return; }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/vendor/bus-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || null,
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
      if (data.success) router.push('/vendor/bus/templates');
      else setError(data.error || 'Failed to update template');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Skeleton ──
  if (isLoading) {
    const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';
    return (
      <div className="pb-24">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 md:p-6 mb-5">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
          </div>
          <div className="relative flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl bg-white/20 ${shimmer}`} />
            <div className={`w-12 h-12 bg-white/20 rounded-2xl ${shimmer}`} />
            <div className="space-y-2">
              <div className={`h-6 w-40 bg-white/25 rounded-lg ${shimmer}`} />
              <div className={`h-3 w-52 bg-white/15 rounded ${shimmer}`} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`bg-gray-50/70 rounded-xl p-5 space-y-3 ${shimmer}`}>
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-white rounded-xl" />
              <div className="h-10 w-full bg-white rounded-xl" />
              {i % 2 === 0 && <div className="h-10 w-full bg-white rounded-xl" />}
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 -mx-4 md:-mx-6 flex gap-3 z-20">
          <div className={`h-11 w-24 bg-gray-100 rounded-xl ${shimmer}`} />
          <div className={`h-11 flex-1 bg-emerald-100 rounded-xl ${shimmer}`} />
        </div>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/vendor/bus/templates" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Edit Template</h1>
        </div>
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* ── Hero Header ── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 md:p-6 mb-5">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-white" />
            <div className="absolute left-1/3 -top-6 w-24 h-24 rounded-full bg-white" />
          </div>
          <div className="relative flex items-center gap-3.5">
            <Link href="/vendor/bus/templates" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-95 transition-all shrink-0">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">Edit Template</h1>
              <p className="text-emerald-100 text-xs md:text-sm mt-0.5 truncate">{name}</p>
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

      <form id="bus-template-form" onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Basic Info ── */}
        <FadeIn delay={60}>
          <div className="bg-gray-50/70 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Template Name <span className="text-red-400">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Outstation Trip" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Trip Category <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {BUS_TRIP_TYPES.map((cat) => (
                    <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border', category === cat.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all resize-none" />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Vehicle Types ── */}
        <FadeIn delay={100}>
          <div className="bg-gray-50/70 rounded-xl p-5 h-full">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-blue-400" />
              <Bus className="w-4 h-4 text-emerald-500" />
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

        {/* ── Inclusions ── */}
        <FadeIn delay={140}>
          <div className="bg-gray-50/70 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Inclusions <span className="text-red-400 text-xs">*</span>
              {inclusions.length > 0 && <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">{inclusions.length}</span>}
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
        <FadeIn delay={180}>
          <div className="bg-gray-50/70 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-red-400" />
              <XCircle className="w-4 h-4 text-red-500" />
              Exclusions
              {exclusions.length > 0 && <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">{exclusions.length}</span>}
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
          <div className="bg-gray-50/70 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-gray-400" />
              <ScrollText className="w-4 h-4 text-gray-500" />
              Terms & Conditions
              {termsConditions.length > 0 && <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{termsConditions.length}</span>}
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

        {/* ── Settings ── */}
        <FadeIn delay={240}>
          <div className="bg-gray-50/70 rounded-xl p-5 h-full space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
              Settings
            </h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Base Rate Hint <span className="text-[10px] text-gray-400 font-normal">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                <input type="number" value={baseRateHint} onChange={(e) => setBaseRateHint(e.target.value)} placeholder="15,000" className="w-full pl-7 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all tabular-nums" />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <Toggle checked={isDefault} onChange={setIsDefault} label="Default template" subtitle="Auto-applied when creating quotes for this category" />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <Toggle checked={isActive} onChange={setIsActive} label="Template is active" subtitle="Inactive templates won't appear in quote creation" />
            </div>
          </div>
        </FadeIn>

      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 -mx-4 md:-mx-6 flex gap-3 z-20">
        <Link href="/vendor/bus/templates" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">
          Cancel
        </Link>
        <button form="bus-template-form" type="submit" disabled={isSaving} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes iconPulse {
          0%, 70%, 100% { transform: scale(1); opacity: 0; }
          20% { transform: scale(1.3); opacity: 0.25; }
          40% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
