'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft, Save, Eye, ChevronDown, ChevronUp,
  Upload, X, Image as ImageIcon, Tag, Globe,
  CheckCircle2, AlertCircle, Clock, Loader2, Search, Plus, FolderPlus,
  Sparkles, Wand2,
} from 'lucide-react';

const BlogEditor = dynamic(() => import('./BlogEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-xl min-h-[500px] flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading editor...</span>
      </div>
    </div>
  ),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  categoryId: string;
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    canonicalUrl: string;
    noindex: boolean;
    nofollow: boolean;
  };
}

interface BlogPostEditorProps {
  // API base for save: e.g. /api/admin/services/bike-on-rent/blog or /api/admin/blog
  apiBase: string;
  // Back link
  backHref: string;
  backLabel: string;
  // Preview base: /blog
  previewBase?: string;
  // Initial data (for edit mode)
  initialData?: Partial<PostData> & { id?: string };
  postId?: string;
  // Service slug — if set, AI modal auto-fills service context
  serviceSlug?: string;
}

function slugToServiceName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function CharCount({ value, max, warn }: { value: string; max: number; warn: number }) {
  const len = value.length;
  const color = len > max ? 'text-red-500' : len >= warn ? 'text-yellow-500' : 'text-gray-400';
  return (
    <span className={`text-xs ${color}`}>
      {len}/{max}
    </span>
  );
}

export default function BlogPostEditor({
  apiBase,
  backHref,
  backLabel,
  previewBase = '/blog',
  initialData,
  postId,
  serviceSlug,
}: BlogPostEditorProps) {
  const router = useRouter();
  const isEdit = !!postId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSaving, setNewCatSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generate state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiForm, setAiForm] = useState({
    topic: '',
    service: '',
    keywords: '',
    suggestions: '',
    tone: 'informative',
    city: '',
  });
  const [aiPreview, setAiPreview] = useState<{
    title: string; excerpt: string; content: string; tags: string[];
    seo: { metaTitle: string; metaDescription: string; metaKeywords: string };
  } | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<{ title: string; why: string }[]>([]);
  const [aiApplied, setAiApplied] = useState(false);

  const emptyPost: PostData = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'DRAFT',
    categoryId: '',
    tags: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      canonicalUrl: '',
      noindex: false,
      nofollow: false,
    },
  };

  const [form, setForm] = useState<PostData>(() => {
    if (!initialData) return emptyPost;
    const seo = initialData.seo || {};
    return {
      title: initialData.title || '',
      slug: initialData.slug || '',
      content: initialData.content || '',
      excerpt: initialData.excerpt || '',
      featuredImage: initialData.featuredImage || '',
      status: (initialData.status as any) || 'DRAFT',
      categoryId: initialData.categoryId || '',
      tags: initialData.tags || [],
      seo: {
        metaTitle: (seo as any).metaTitle || '',
        metaDescription: (seo as any).metaDescription || '',
        metaKeywords: (seo as any).metaKeywords || '',
        ogTitle: (seo as any).ogTitle || '',
        ogDescription: (seo as any).ogDescription || '',
        ogImage: (seo as any).ogImage || '',
        canonicalUrl: (seo as any).canonicalUrl || '',
        noindex: (seo as any).noindex || false,
        nofollow: (seo as any).nofollow || false,
      },
    };
  });

  // Auto-fill service context from page slug
  useEffect(() => {
    if (serviceSlug) {
      setAiForm((f) => ({ ...f, service: slugToServiceName(serviceSlug) }));
    }
  }, [serviceSlug]);

  const loadCategories = useCallback(() => {
    fetch('/api/admin/blog/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // Fetch categories on mount
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const createCategory = useCallback(async () => {
    const name = newCatName.trim();
    if (!name) return;
    setNewCatSaving(true);
    try {
      const res = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        await loadCategories();
        setForm((f) => ({ ...f, categoryId: data.category.id }));
        setNewCatName('');
        setNewCatOpen(false);
      }
    } finally {
      setNewCatSaving(false);
    }
  }, [newCatName, loadCategories]);

  // Auto-slug from title
  useEffect(() => {
    if (!slugEdited && form.title && !isEdit) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, slugEdited, isEdit]);

  // Auto-fill SEO from title/excerpt
  useEffect(() => {
    setForm((f) => ({
      ...f,
      seo: {
        ...f.seo,
        metaTitle: f.seo.metaTitle || f.title,
        metaDescription: f.seo.metaDescription || f.excerpt,
        ogTitle: f.seo.ogTitle || f.title,
        ogDescription: f.seo.ogDescription || f.excerpt,
        ogImage: f.seo.ogImage || f.featuredImage,
      },
    }));
  }, [form.title, form.excerpt, form.featuredImage]);

  const handleSave = useCallback(
    async (status?: 'DRAFT' | 'PUBLISHED') => {
      setError('');
      if (!form.title.trim()) { setError('Title is required'); return; }
      if (!form.slug.trim()) { setError('Slug is required'); return; }

      setSaving(true);
      try {
        const payload = { ...form, status: status || form.status };
        const url = isEdit ? `${apiBase}/${postId}` : apiBase;
        const method = isEdit ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to save');
          setSaveStatus('error');
          return;
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);

        if (!isEdit && data.post?.id) {
          // Redirect to edit page after create
          router.replace(`${backHref}/${data.post.id}/edit`);
        }
      } catch {
        setError('Network error. Please try again.');
        setSaveStatus('error');
      } finally {
        setSaving(false);
      }
    },
    [form, isEdit, apiBase, postId, backHref, router]
  );

  const handleAiGenerate = useCallback(async () => {
    setAiError('');
    setAiPreview(null);
    if (!aiForm.topic.trim() && !aiForm.keywords.trim() && !aiForm.service.trim() && !aiForm.city.trim()) {
      setAiError('Fill at least one field above — service, keywords, or city — so AI knows what to write about.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/blog/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'Generation failed'); return; }
      setAiPreview(data.post);
    } catch {
      setAiError('Network error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [aiForm]);

  const handleSuggestTopics = useCallback(async () => {
    setAiError('');
    setSuggestLoading(true);
    setSuggestedTopics([]);
    try {
      const res = await fetch('/api/admin/blog/ai-suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: aiForm.service, keywords: aiForm.keywords, city: aiForm.city }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'Failed to suggest topics'); return; }
      setSuggestedTopics(data.topics || []);
    } catch {
      setAiError('Network error. Please try again.');
    } finally {
      setSuggestLoading(false);
    }
  }, [aiForm.service, aiForm.keywords, aiForm.city]);

  const applyAiContent = useCallback(() => {
    if (!aiPreview) return;
    setForm((f) => ({
      ...f,
      title: aiPreview.title,
      excerpt: aiPreview.excerpt,
      content: aiPreview.content,
      tags: aiPreview.tags,
      seo: {
        ...f.seo,
        metaTitle: aiPreview.seo.metaTitle,
        metaDescription: aiPreview.seo.metaDescription,
        metaKeywords: aiPreview.seo.metaKeywords,
        ogTitle: aiPreview.seo.metaTitle,
        ogDescription: aiPreview.seo.metaDescription,
      },
    }));
    setShowAiModal(false);
    setAiPreview(null);
    setAiApplied(true);
    // keep aiForm intact so user can regenerate with same inputs
  }, [aiPreview]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const uploadFeaturedImage = async (file: File) => {
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'blog');
      const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        const url = data.media?.[0]?.url || data.media?.url;
        if (url) {
          setForm((f) => ({
            ...f,
            featuredImage: url,
            seo: { ...f.seo, ogImage: f.seo.ogImage || url },
          }));
        }
      }
    } finally {
      setImgUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-700">
              {isEdit ? 'Edit Post' : 'New Post'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Save status */}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" /> Error
              </span>
            )}

            {/* Generate with AI / Regenerate */}
            <button
              type="button"
              onClick={() => { setShowAiModal(true); setAiPreview(null); setAiError(''); setSuggestedTopics([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors font-medium ${
                aiApplied
                  ? 'text-green-700 border-green-300 bg-green-50 hover:bg-green-100'
                  : 'text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100'
              }`}
            >
              {aiApplied ? <Wand2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {aiApplied ? 'Regenerate' : 'Generate with AI'}
            </button>

            {/* Preview */}
            {isEdit && form.slug && (
              <a
                href={`${previewBase}/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </a>
            )}

            {/* Save Draft */}
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Save Draft
            </button>

            {/* Publish */}
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {form.status === 'PUBLISHED' ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-screen-2xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left — Main Editor */}
          <div className="space-y-4">
            {/* Title */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <textarea
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Post title..."
                rows={2}
                className="w-full px-6 py-5 text-2xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none resize-none leading-tight"
              />
              {/* Slug */}
              <div className="flex items-center gap-2 px-6 pb-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 shrink-0">/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                  }}
                  placeholder="post-slug"
                  className="flex-1 text-xs text-gray-600 font-mono border-none outline-none bg-transparent"
                />
                {form.slug && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, slug: slugify(f.title) }))}
                    className="text-xs text-blue-500 hover:text-blue-700 shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Excerpt / Summary
                </label>
              </div>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Write a brief summary of the post (shown in listing, used for SEO description)..."
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-700 border-none outline-none resize-none"
              />
            </div>

            {/* Rich Text Editor */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Content
                </label>
              </div>
              <BlogEditor
                content={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="Start writing your blog post..."
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Publish Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSave('DRAFT')}
                    disabled={saving}
                    className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave('PUBLISHED')}
                    disabled={saving}
                    className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : form.status === 'PUBLISHED' ? 'Update' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Featured Image
              </h3>

              {form.featuredImage ? (
                <div className="relative group">
                  <img
                    src={form.featuredImage}
                    alt="Featured"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-gray-800 text-xs rounded-lg font-medium hover:bg-gray-100"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, featuredImage: '' }))}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
                >
                  {imgUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-sm text-gray-500">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                      <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                        Click to upload image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 10MB</p>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFeaturedImage(file);
                  e.target.value = '';
                }}
              />

              {/* Or paste URL */}
              <div className="mt-2">
                <input
                  type="url"
                  value={form.featuredImage}
                  onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))}
                  placeholder="Or paste image URL..."
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-600"
                />
              </div>
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category
                </h3>
                <button
                  type="button"
                  onClick={() => { setNewCatOpen((o) => !o); setNewCatName(''); }}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  New
                </button>
              </div>

              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Inline quick-create */}
              {newCatOpen && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-2">Create new category</p>
                  <input
                    autoFocus
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createCategory()}
                    placeholder="Category name..."
                    className="w-full px-2.5 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={createCategory}
                      disabled={!newCatName.trim() || newCatSaving}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {newCatSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatOpen(false)}
                      className="px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag, press Enter"
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* SEO Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setSeoOpen(!seoOpen)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    SEO Settings
                  </span>
                </div>
                {seoOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {seoOpen && (
                <div className="border-t border-gray-100 px-4 pb-4 space-y-3">
                  {/* SEO Preview */}
                  {(form.seo.metaTitle || form.title) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1.5">Google Preview</p>
                      <div className="text-[13px] text-blue-700 font-medium leading-snug truncate">
                        {form.seo.metaTitle || form.title}
                      </div>
                      <div className="text-[11px] text-green-700 truncate mt-0.5">
                        https://transrentals.com/blog/{form.slug}
                      </div>
                      <div className="text-[12px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                        {form.seo.metaDescription || form.excerpt || 'No description set.'}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Meta Title</label>
                        <CharCount value={form.seo.metaTitle} max={60} warn={50} />
                      </div>
                      <input
                        type="text"
                        value={form.seo.metaTitle}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, seo: { ...f.seo, metaTitle: e.target.value } }))
                        }
                        placeholder={form.title}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Meta Description</label>
                        <CharCount value={form.seo.metaDescription} max={160} warn={140} />
                      </div>
                      <textarea
                        value={form.seo.metaDescription}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, seo: { ...f.seo, metaDescription: e.target.value } }))
                        }
                        placeholder={form.excerpt || 'Description shown in search results...'}
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Keywords <span className="text-gray-400">(comma separated)</span>
                      </label>
                      <input
                        type="text"
                        value={form.seo.metaKeywords}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, seo: { ...f.seo, metaKeywords: e.target.value } }))
                        }
                        placeholder="bike rental, leh ladakh, trip guide"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">OG Image URL</label>
                      <input
                        type="url"
                        value={form.seo.ogImage}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, seo: { ...f.seo, ogImage: e.target.value } }))
                        }
                        placeholder={form.featuredImage || 'Social share image URL...'}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Canonical URL</label>
                      <input
                        type="url"
                        value={form.seo.canonicalUrl}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, seo: { ...f.seo, canonicalUrl: e.target.value } }))
                        }
                        placeholder={`https://transrentals.com/blog/${form.slug}`}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.seo.noindex}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, seo: { ...f.seo, noindex: e.target.checked } }))
                          }
                          className="rounded"
                        />
                        No-Index
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.seo.nofollow}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, seo: { ...f.seo, nofollow: e.target.checked } }))
                          }
                          className="rounded"
                        />
                        No-Follow
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {aiApplied ? 'Regenerate Blog' : 'Generate Blog with AI'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {aiApplied ? 'Your previous inputs are saved — tweak or generate again' : 'DeepSeek will write a full SEO-optimized post'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowAiModal(false); setAiPreview(null); setAiError(''); setSuggestedTopics([]); }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Topic */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">
                    Topic / Title Idea <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestTopics}
                    disabled={suggestLoading}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
                  >
                    {suggestLoading
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Suggesting...</>
                      : <><Sparkles className="w-3 h-3" /> Suggest Topics</>
                    }
                  </button>
                </div>
                <input
                  type="text"
                  value={aiForm.topic}
                  onChange={(e) => setAiForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. Best time to rent a bike in Leh Ladakh — or leave blank and use Suggest Topics"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {/* Suggested topic chips */}
                {suggestedTopics.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-gray-400">Click a topic to use it:</p>
                    {suggestedTopics.map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setAiForm((f) => ({ ...f, topic: t.title })); setSuggestedTopics([]); }}
                        className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors group"
                      >
                        <p className="text-xs font-medium text-gray-800 group-hover:text-purple-800 leading-snug">{t.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t.why}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Service/Niche */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">
                    Service / Niche <span className="text-gray-400 font-normal">(optional context)</span>
                  </label>
                  {serviceSlug && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      ✓ Auto-detected
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={aiForm.service}
                  onChange={(e) => setAiForm((f) => ({ ...f, service: e.target.value }))}
                  placeholder="e.g. bike rental, tempo traveller, car rental in Pune"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Your Target Keywords <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={aiForm.keywords}
                  onChange={(e) => setAiForm((f) => ({ ...f, keywords: e.target.value }))}
                  placeholder="e.g. bike rental leh ladakh, ladakh bike trip cost, royal enfield hire manali"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Target City */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Target City <span className="text-gray-400 font-normal">(for internal links — e.g. Pune, Mumbai, Delhi)</span>
                </label>
                <input
                  type="text"
                  value={aiForm.city}
                  onChange={(e) => setAiForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Pune, Manali, Bengaluru"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Writing Tone</label>
                <div className="flex gap-2">
                  {(['informative', 'conversational', 'professional'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiForm((f) => ({ ...f, tone: t }))}
                      className={`flex-1 py-1.5 text-xs rounded-lg border font-medium capitalize transition-colors ${
                        aiForm.tone === t
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-gray-300 text-gray-600 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  Additional Instructions <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={aiForm.suggestions}
                  onChange={(e) => setAiForm((f) => ({ ...f, suggestions: e.target.value }))}
                  placeholder="e.g. Focus on budget travelers, mention Manali to Leh route, include a cost comparison table"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Error */}
              {aiError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {aiError}
                </div>
              )}

              {/* Preview strip (after generation) */}
              {aiPreview && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Generated successfully
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{aiPreview.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{aiPreview.excerpt}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {aiPreview.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {!aiPreview ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setShowAiModal(false); setAiError(''); }}
                      className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={aiLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60 font-medium transition-colors"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setAiPreview(null); setAiError(''); setAiApplied(false); }}
                      className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={applyAiContent}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 font-medium transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Apply to Editor
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
