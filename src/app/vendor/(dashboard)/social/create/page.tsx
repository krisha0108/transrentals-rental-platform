'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useVendorVerification } from '@/contexts/VendorVerificationContext';
import { ArrowLeft, Zap, Send, ChevronDown, Search, X, Check } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  isSOS: boolean;
  description?: string;
}

const MAX_CHARS = 1000;

function CategoryDropdown({
  categories,
  loading,
  value,
  onChange,
}: {
  categories: Category[];
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = categories.find(c => c.id === value) ?? null;

  const filtered = search.trim()
    ? categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const select = (cat: Category) => {
    onChange(cat.id);
    setOpen(false);
    setSearch('');
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
          open
            ? 'border-green-500 ring-2 ring-green-100'
            : selected
            ? selected.isSOS
              ? 'border-red-400 bg-red-50'
              : 'border-green-400 bg-green-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        {loading ? (
          <span className="text-sm text-gray-400">Loading categories...</span>
        ) : selected ? (
          <>
            {selected.isSOS && <Zap className="h-4 w-4 text-red-500 flex-shrink-0" />}
            <span className={`flex-1 text-sm font-semibold ${selected.isSOS ? 'text-red-700' : 'text-green-700'}`}>
              {selected.name}
            </span>
            {selected.description && (
              <span className="text-xs text-gray-400 truncate max-w-[120px]">{selected.description}</span>
            )}
            <button
              type="button"
              onClick={clear}
              className="ml-1 p-0.5 rounded-full hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-gray-400">Select a category...</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
          </>
        )}
        {!loading && selected && (
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-100 transition-all">
              <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No categories found</div>
            ) : (
              filtered.map(cat => {
                const isSelected = cat.id === value;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => select(cat)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {cat.isSOS ? (
                      <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-3.5 w-3.5 text-red-500" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
                        {cat.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                          {cat.name}
                        </span>
                        {cat.isSOS && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                            SOS
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{cat.description}</p>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-green-600 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatePostPage() {
  const router = useRouter();
  const { isApproved, openVerificationModal } = useVendorVerification();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    fetch('/api/admin/social/categories')
      .then(r => r.json())
      .then(d => {
        setCategories((d.categories || []).filter((c: any) => c.isActive));
        setLoadingCats(false);
      });
  }, []);

  const selectedCat = categories.find(c => c.id === selectedCategory);
  const isSOS = selectedCat?.isSOS ?? false;
  const remaining = MAX_CHARS - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { setError('Please write something'); return; }
    if (!selectedCategory) { setError('Please select a category'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/vendor/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), categoryId: selectedCategory }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to post'); return; }
      router.push('/vendor/social');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-[#F9FAFB] to-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-20 sm:pb-6">
      <style jsx global>{`
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in-left { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes scale-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes float-slow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-rev { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes pulse-border { 0%,100% { border-color: rgba(239,68,68,0.3); } 50% { border-color: rgba(239,68,68,0.8); } }
        @keyframes glow-emerald { 0%,100% { box-shadow: 0 0 12px rgba(5,150,105,0.2); } 50% { box-shadow: 0 0 24px rgba(5,150,105,0.4); } }
        @keyframes wiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
        @keyframes typing-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes orbit { 0% { transform: rotate(0deg) translateX(60px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); } }
        @keyframes sparkle { 0%,100% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes slide-in-right { 0% { opacity: 0; transform: translateX(20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.05); } 70% { transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes draw-line { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-fade-up { animation: fade-up 0.4s ease-out both; }
        .animate-slide-in-left { animation: slide-in-left 0.5s ease-out both; }
        .animate-slide-in-right { animation: slide-in-right 0.5s ease-out both; }
        .animate-scale-in { animation: scale-in 0.4s ease-out both; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out both; }
        .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 5s ease-in-out infinite; }
        .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
        .animate-glow-emerald { animation: glow-emerald 2.5s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 0.5s ease-in-out; }
        .animate-typing-blink { animation: typing-blink 1s ease-in-out infinite; }
        .animate-orbit { animation: orbit 12s linear infinite; }
        .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 4s ease infinite; }
        .animate-draw-line { animation: draw-line 1s ease-out both; }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl animate-fade-up">
          {/* Multi-layer bg */}
          <div className="absolute inset-0 bg-emerald-700"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.6)_0%,_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.3)_0%,_transparent_50%)]"></div>

          {/* Animated rings */}
          <div className="absolute -right-6 -top-6 w-32 h-32 border border-white/10 rounded-full animate-float-slow"></div>
          <div className="absolute -right-2 -top-2 w-20 h-20 border border-white/10 rounded-full animate-float-rev"></div>
          <div className="absolute -left-4 -bottom-4 w-24 h-24 border border-white/10 rounded-full animate-float-rev"></div>

          {/* Orbiting particle */}
          <div className="absolute right-20 top-1/2 -translate-y-1/2">
            <div className="animate-orbit">
              <div className="w-2 h-2 bg-emerald-300/60 rounded-full blur-[1px]"></div>
            </div>
          </div>

          {/* Sparkle dots */}
          {[
            { top: '15%', left: '70%', delay: '0s', size: 'w-1 h-1' },
            { top: '60%', left: '80%', delay: '1.5s', size: 'w-1.5 h-1.5' },
            { top: '30%', left: '90%', delay: '3s', size: 'w-1 h-1' },
            { top: '75%', left: '65%', delay: '2s', size: 'w-1 h-1' },
          ].map((s, i) => (
            <div key={i} className={`absolute ${s.size} bg-white rounded-full`} style={{ top: s.top, left: s.left, animation: `sparkle 3s ease-in-out ${s.delay} infinite` }}></div>
          ))}

          {/* Light sweep line */}
          <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent animate-draw-line" style={{ animationDelay: '500ms' }}></div>

          {/* Content */}
          <div className="relative px-6 py-7">
            <div className="flex items-center gap-4">
              <Link href="/vendor/social" className="group p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white transition-all">
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <div className="flex-1 animate-slide-in-left" style={{ animationDelay: '150ms' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-300/80 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">Vendor Network</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  Create Post
                  <div className="relative">
                    <Send className="h-5 w-5 text-emerald-300 animate-float-slow" />
                    <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-md animate-float-rev"></div>
                  </div>
                </h1>
                <p className="text-emerald-100/50 text-xs mt-1.5 font-medium">Share with the vendor community</p>
              </div>

              {/* Right decorative icon */}
              <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm animate-scale-in" style={{ animationDelay: '300ms' }}>
                <Send className="h-6 w-6 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={isApproved ? handleSubmit : (e) => { e.preventDefault(); openVerificationModal(); }} className="space-y-4">

          {/* Category */}
          <div className="group/card relative z-10 bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-bounce-in hover:shadow-[0_4px_20px_rgba(5,150,105,0.1)] hover:border-emerald-300 transition-all duration-300" style={{ animationDelay: '80ms' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 rounded-t-2xl opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
            <label className="block text-[13px] font-bold text-gray-800 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center"><Search className="w-3 h-3 text-emerald-600" /></span>
              Category <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-gray-400 mb-3 pl-8">
              Choose the most relevant category for your post
            </p>
            <CategoryDropdown
              categories={categories}
              loading={loadingCats}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>

          {/* SOS warning */}
          {isSOS && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 animate-pulse-border rounded-2xl p-4 flex gap-3 animate-scale-in shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-red-500 animate-wiggle" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-red-700">SOS Post</p>
                <p className="text-[11px] text-red-600/80 mt-0.5 leading-relaxed">
                  This will appear as an urgent story at the top of the feed for 24 hours. Use only for genuine urgent requests.
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`group/text relative bg-white border rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-bounce-in hover:shadow-[0_4px_20px_rgba(5,150,105,0.1)] transition-all duration-300 ${isSOS ? 'border-red-200 hover:border-red-300' : 'border-gray-100 hover:border-emerald-300'}`} style={{ animationDelay: '160ms' }}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover/text:opacity-100 transition-opacity ${isSOS ? 'bg-gradient-to-r from-red-400 via-red-500 to-red-400' : 'bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400'}`}></div>
            <label className="block text-[13px] font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSOS ? 'bg-red-100' : 'bg-emerald-100'}`}><Send className={`w-3 h-3 ${isSOS ? 'text-red-600' : 'text-emerald-600'}`} /></span>
              What&apos;s on your mind? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => { if (e.target.value.length <= MAX_CHARS) setContent(e.target.value); }}
              placeholder={
                isSOS
                  ? 'Describe your urgent need — be specific about what help you require...'
                  : 'Share updates, tips, questions, or anything useful for fellow vendors...'
              }
              className="w-full text-[14px] text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
              rows={8}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400">Shift+Enter for new line</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${remaining < 50 ? 'bg-red-500' : remaining < 150 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(0, (content.length / MAX_CHARS) * 100)}%` }}
                  ></div>
                </div>
                <span className={`text-[11px] font-semibold ${remaining < 50 ? 'text-red-500' : remaining < 150 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {remaining}
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600 flex items-center gap-2 animate-fade-up">
              <X className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-4 animate-bounce-in" style={{ animationDelay: '280ms' }}>
            <Link
              href="/vendor/social"
              className="group flex-1 py-3 border border-gray-200 bg-white rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-center transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !content.trim() || !selectedCategory}
              className={`group relative flex-1 py-3 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-xl active:scale-[0.97] overflow-hidden ${
                isSOS
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200/50'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50 animate-glow-emerald'
              }`}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              <Send className="relative h-4 w-4 group-hover:rotate-12 transition-transform" />
              <span className="relative">{submitting ? 'Posting...' : isSOS ? 'Post SOS' : 'Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
