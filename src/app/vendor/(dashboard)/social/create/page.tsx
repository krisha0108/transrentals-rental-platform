'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Dark Green Banner Header */}
        <div className="relative bg-[#071a0d] rounded-2xl overflow-hidden px-6 pt-6 pb-5 mb-6">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-green-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <Link href="/vendor/social" className="p-2 -ml-1 rounded-xl hover:bg-white/10 text-white/70 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-0.5 block">Vendor Network</span>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">Create Post</h1>
              <p className="text-green-200/50 text-xs mt-1">Share with the vendor community</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Category dropdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Choose the most relevant category for your post
            </p>
            <CategoryDropdown
              categories={categories}
              loading={loadingCats}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>

          {/* SOS warning banner */}
          {isSOS && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-700">SOS Post</p>
                <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                  This will appear as an urgent story at the top of the feed for 24 hours. Use only for genuine urgent requests.
                </p>
              </div>
            </div>
          )}

          {/* Content textarea */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
              rows={8}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-300">Shift+Enter for new line</span>
              <span className={`text-xs font-medium ${remaining < 50 ? 'text-red-500' : remaining < 150 ? 'text-amber-500' : 'text-gray-400'}`}>
                {remaining} left
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <X className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            <Link
              href="/vendor/social"
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 text-center transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !content.trim() || !selectedCategory}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm ${
                isSOS ? 'bg-red-500 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'
              }`}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Posting...' : isSOS ? 'Post SOS' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
