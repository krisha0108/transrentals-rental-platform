'use client';

// Agent-side post composer. Posts to /api/social/posts (shared cross-type
// endpoint) so the new post lands in the unified feed visible to both
// agents and vendors.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap, Send, ChevronDown, Search, X, Check, Compass, ImagePlus, Loader2 } from 'lucide-react';

interface Category { id: string; name: string; slug: string; isSOS: boolean; description?: string; }

const MAX_CHARS = 1000;

function CategoryDropdown({
  categories, loading, value, onChange,
}: {
  categories: Category[]; loading: boolean; value: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = categories.find(c => c.id === value) ?? null;
  const filtered = search.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
          open ? 'border-indigo-500 ring-2 ring-indigo-100'
          : selected ? selected.isSOS ? 'border-red-400 bg-red-50' : 'border-indigo-400 bg-indigo-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}>
        {loading ? <span className="text-sm text-gray-400">Loading categories...</span>
        : selected ? (
          <>
            {selected.isSOS && <Zap className="h-4 w-4 text-red-500 flex-shrink-0" />}
            <span className={`flex-1 text-sm font-semibold ${selected.isSOS ? 'text-red-700' : 'text-indigo-700'}`}>{selected.name}</span>
            <button type="button" onClick={e => { e.stopPropagation(); onChange(''); }}
              className="ml-1 p-0.5 rounded-full hover:bg-white/60 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Search className="h-4 w-4 text-gray-400" />
            <span className="flex-1 text-sm text-gray-400">Select a category...</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
              {search && <button type="button" onClick={() => setSearch('')} className="text-gray-400">
                <X className="h-3.5 w-3.5" />
              </button>}
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No categories found</div>
            ) : filtered.map(cat => {
              const isSelected = cat.id === value;
              return (
                <button key={cat.id} type="button"
                  onClick={() => { onChange(cat.id); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                  {cat.isSOS ? (
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-3.5 w-3.5 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {cat.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>{cat.name}</span>
                      {cat.isSOS && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">SOS</span>}
                    </div>
                    {cat.description && <p className="text-xs text-gray-400 truncate mt-0.5">{cat.description}</p>}
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentCreatePostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 4;
  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) { setError(`Up to ${MAX_IMAGES} images.`); return; }
    setUploading(true); setError('');
    try {
      const picked = Array.from(files).slice(0, room);
      const urls: string[] = [];
      for (const file of picked) {
        if (file.size > 5 * 1024 * 1024) { setError('Each image must be under 5 MB.'); continue; }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'social');
        const res = await fetch('/api/travel-agent/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) urls.push(data.url);
      }
      if (urls.length) setImages((prev) => [...prev, ...urls]);
    } catch {
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  useEffect(() => {
    fetch('/api/admin/social/categories').then(r => r.json()).then(d => {
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
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), categoryId: selectedCategory, images }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to post'); return; }
      router.push('/travel-agent/social');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl shadow-lg p-5 mb-5 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-3">
          <Link href="/travel-agent/social"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Travel Network</span>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              Create Post <Send className="h-5 w-5 text-indigo-200" />
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <label className="block text-[13px] font-bold text-gray-800 mb-2">Category <span className="text-red-500">*</span></label>
          <CategoryDropdown
            categories={categories}
            loading={loadingCats}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        {isSOS && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-700">SOS Post</p>
              <p className="text-xs text-red-600/80 mt-0.5">
                Appears as an urgent story for 24h. Use only for genuine urgent requests.
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`bg-white border rounded-2xl p-5 shadow-sm ${isSOS ? 'border-red-200' : 'border-gray-100'}`}>
          <label className="block text-[13px] font-bold text-gray-800 mb-2">What&apos;s on your mind? <span className="text-red-500">*</span></label>
          <textarea
            value={content}
            onChange={e => { if (e.target.value.length <= MAX_CHARS) setContent(e.target.value); }}
            placeholder={isSOS
              ? 'Describe your urgent need — be specific about what help you require...'
              : 'Share updates, travel tips, partnership ideas, anything useful for the community...'}
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
            rows={8}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-[10px] text-gray-400">Shift+Enter for new line</span>
            <span className={`text-[11px] font-semibold ${remaining < 50 ? 'text-red-500' : remaining < 150 ? 'text-amber-500' : 'text-gray-400'}`}>
              {remaining} chars left
            </span>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <label className="block text-[13px] font-bold text-gray-800 mb-2">
            Photos <span className="font-normal text-gray-400">(optional · up to {MAX_IMAGES})</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[11px] font-semibold">{uploading ? 'Uploading' : 'Add'}</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => uploadImages(e.target.files)} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <X className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/travel-agent/social"
            className="flex-1 py-3 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 text-center transition-all">
            Cancel
          </Link>
          <button type="submit" disabled={submitting || !content.trim() || !selectedCategory}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md ${
              isSOS ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}>
            <Send className="h-4 w-4" />
            {submitting ? 'Posting...' : isSOS ? 'Post SOS' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
