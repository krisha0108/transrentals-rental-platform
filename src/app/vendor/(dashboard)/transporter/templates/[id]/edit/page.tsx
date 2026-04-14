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
  IndianRupee,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRANSPORTER_CONFIG } from '@/lib/quote-services';

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

// ── List input ──
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

// ── Toggle switch ──
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

const TRUCK_TYPES = [
  { id: 'tata-ace',       name: 'Tata Ace',       capacity: '750 kg' },
  { id: 'pickup-8ft',     name: '8ft Pickup',     capacity: '1.5 ton' },
  { id: 'eicher-14ft',    name: 'Eicher 14ft',    capacity: '3-4 ton' },
  { id: 'tata-407',       name: 'Tata 407',       capacity: '2.5 ton' },
  { id: 'container-20ft', name: '20ft Container', capacity: '15-20 ton' },
  { id: 'trailer',        name: 'Trailer',        capacity: '25-40 ton' },
];

export default function EditTransporterTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [truckTypes, setTruckTypes] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [ratePerKm, setRatePerKm] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/vendor/truck-templates/${templateId}`);
        const data = await response.json();
        if (data.success && data.template) {
          const t = data.template;
          setName(t.name || '');
          setCategory(t.category || '');
          setDescription(t.description || '');
          setTruckTypes(t.truckTypes || []);
          setInclusions(t.inclusions || []);
          setExclusions(t.exclusions || []);
          setTermsConditions(t.termsConditions || []);
          setRatePerKm(t.ratePerKm?.toString() || '');
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

  const toggleTruckType = (typeId: string) => {
    setTruckTypes((prev) => (prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/vendor/truck-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description: description || null,
          truckTypes: truckTypes.length > 0 ? truckTypes : null,
          inclusions,
          exclusions,
          termsConditions,
          ratePerKm: ratePerKm ? parseFloat(ratePerKm) : null,
          isDefault,
          isActive,
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push('/vendor/transporter/templates');
      } else {
        setError(data.error || 'Failed to update template');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/vendor/transporter/templates" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all">
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
            <Link href="/vendor/transporter/templates" className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-95 transition-all shrink-0">
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

      <form id="truck-template-form" onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard FTL Transport" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Transport Category <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {TRANSPORTER_CONFIG.categories.map((cat: any) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border',
                        category === cat.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {cat.shortName || cat.name || cat.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of when to use this template..." rows={2} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all resize-none" />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Truck Types & Rate ── */}
        <FadeIn delay={100}>
          <div className="bg-gray-50/70 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-violet-400" />
              Applicable Truck Types
              {truckTypes.length > 0 && <span className="text-[10px] font-semibold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-md">{truckTypes.length}</span>}
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {TRUCK_TYPES.map((truck) => {
                const active = truckTypes.includes(truck.id);
                return (
                  <button
                    key={truck.id}
                    type="button"
                    onClick={() => toggleTruckType(truck.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all duration-200',
                      active
                        ? 'border-emerald-600 bg-emerald-50 shadow-sm shadow-emerald-500/10'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    )}
                  >
                    <div className={cn('text-xs font-bold', active ? 'text-emerald-700' : 'text-gray-700')}>{truck.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{truck.capacity}</div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rate Per Km Hint <span className="text-[10px] text-gray-400">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">₹</span>
                <input type="number" value={ratePerKm} onChange={(e) => setRatePerKm(e.target.value)} placeholder="e.g., 45" className="w-full pl-7 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all tabular-nums" />
              </div>
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
          <div className="bg-gray-50/70 rounded-xl px-5 py-4 space-y-4 h-full">
            <Toggle checked={isDefault} onChange={setIsDefault} label="Default template" subtitle="Auto-applied when creating quotes for this category" />
            <div className="border-t border-gray-50 pt-4">
              <Toggle checked={isActive} onChange={setIsActive} label="Template is active" subtitle="Inactive templates won't appear in quote creation" />
            </div>
          </div>
        </FadeIn>

      </form>

      {/* ── Sticky Bottom CTA ── */}
      <div className="sticky bottom-0 left-0 right-0 mt-5 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-5 py-3 flex gap-3 z-20">
        <Link href="/vendor/transporter/templates" className="px-5 h-11 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 flex items-center active:scale-[0.98] transition-all">
          Cancel
        </Link>
        <button
          form="truck-template-form"
          type="submit"
          disabled={isSaving || !name || !category || inclusions.length === 0}
          className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}
