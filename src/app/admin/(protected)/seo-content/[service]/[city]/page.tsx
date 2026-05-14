'use client';

/**
 * Block-based editor for a (service, city) SEO content page.
 * Mirrors the city-pages pattern: list of sections with reorder/hide/edit/
 * add-custom + per-section rich-text or FAQ editor. SEO meta is edited
 * separately in a side panel.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, Sparkles, Loader2, X,
  CheckCircle2, AlertTriangle, Bot, ExternalLink,
} from 'lucide-react';
import type { SectionConfig } from '@/lib/city-sections';
import { SectionListEditor } from '@/components/admin/seo/SectionListEditor';

type RowPayload = {
  id: string | null;
  serviceSlug: string;
  serviceLabel: string;
  citySlug: string;
  cityName: string;
  cityState: string | null;
  cityTier: number | null;
  cityTerrain: string | null;
  exists: boolean;
  content: {
    intro: string | null;
    whyChooseUs: any[];
    popularVehicles: any[];
    servicesOffered: any[];
    faqs: any[];
    tips: any[];
    routes: any[];
    sectionsConfig: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    h1Heading: string | null;
  };
  workflow: {
    status: string;
    source: string;
    autoUpdate: boolean;
    publishedAt: string | null;
  };
  ai: {
    model: string | null;
    prompt: string | null;
    tokensUsed: number | null;
    lastUpdate: string | null;
  };
  audit: {
    lastEditedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
};

type SectionMeta = {
  defaults: SectionConfig[];
  hints: Record<string, string>;
  defaultContent: Record<string, string>;
};

export default function SeoContentEditPage({
  params,
}: {
  params: { service: string; city: string };
}) {
  const [data, setData] = useState<RowPayload | null>(null);
  const [sectionMeta, setSectionMeta] = useState<SectionMeta | null>(null);
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiCustomInstructions, setAiCustomInstructions] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rowRes, metaRes] = await Promise.all([
        fetch(`/api/admin/seo-content/by-slug/${params.service}/${params.city}`),
        fetch(`/api/admin/seo-content/section-meta?service=${params.service}&city=${params.city}`),
      ]);

      if (!rowRes.ok) {
        const j = await rowRes.json().catch(() => ({}));
        throw new Error(j.error || `Row HTTP ${rowRes.status}`);
      }
      if (!metaRes.ok) {
        const j = await metaRes.json().catch(() => ({}));
        throw new Error(j.error || `Meta HTTP ${metaRes.status}`);
      }

      const row: RowPayload = await rowRes.json();
      const meta: SectionMeta = await metaRes.json();

      setData(row);
      setSectionMeta(meta);
      setMetaTitle(row.content.metaTitle ?? '');
      setMetaDescription(row.content.metaDescription ?? '');
      setMetaKeywords(row.content.metaKeywords ?? '');

      // Load sections: stored config OR defaults
      let stored: SectionConfig[] = [];
      if (row.content.sectionsConfig) {
        try {
          const parsed = JSON.parse(row.content.sectionsConfig);
          if (Array.isArray(parsed)) stored = parsed;
        } catch {}
      }
      setSections(stored.length > 0 ? stored : meta.defaults);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params.service, params.city]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function save(setStatus?: string) {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        content: {
          sectionsConfig: JSON.stringify(sections),
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          metaKeywords: metaKeywords || null,
        },
        workflow: setStatus ? { status: setStatus } : {},
      };
      const res = await fetch(`/api/admin/seo-content/by-slug/${params.service}/${params.city}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setData(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function generateWithAI(saveAfter: boolean) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo-content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceSlug: params.service,
          citySlug: params.city,
          customInstructions: aiCustomInstructions || undefined,
          save: saveAfter,
          format: 'sections',
          // Pass current sections so user-edited labels, custom sections,
          // and visibility/order are preserved through AI regeneration.
          sections,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (saveAfter) {
        await fetchAll();
      } else if (json.sectionsConfig) {
        try {
          const parsed = JSON.parse(json.sectionsConfig);
          if (Array.isArray(parsed)) setSections(parsed);
        } catch {}
      }
      setAiModalOpen(false);
      setAiCustomInstructions('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!data || !sectionMeta) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'Failed to load.'}
        </div>
        <Link href="/admin/seo-content" className="mt-4 inline-flex items-center gap-1 text-purple-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Link>
      </div>
    );
  }

  const publicUrl = `/${params.service}/${params.city}`;
  const metaTitleLen = metaTitle.length;
  const metaDescLen = metaDescription.length;

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/seo-content/inventory" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-xs text-gray-500">
              {data.serviceLabel} · {data.cityName}, {data.cityState ?? '—'} ·
              {data.cityTier && <> Tier {data.cityTier} ·</>}{' '}
              <span className="font-medium text-purple-700">{data.cityTerrain}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 font-mono">
              /{params.service}/{params.city}
            </h1>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1 ml-2"
          >
            View live <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiModalOpen(true)}
            disabled={generating}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Generate with AI
          </button>
          <button
            onClick={() => save()}
            disabled={saving}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          <button
            onClick={() => save('published')}
            disabled={saving}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {savedAt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Saved successfully.
        </div>
      )}

      {/* Status bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 flex items-center gap-4 flex-wrap text-sm">
        <span>Status: <span className="font-semibold text-gray-900">{data.workflow.status}</span></span>
        <span>Source: <span className="font-semibold text-gray-900">{data.workflow.source}</span></span>
        {data.ai.model && (
          <span className="text-gray-500">
            <Bot className="w-3.5 h-3.5 inline mr-1" />
            {data.ai.model} ({data.ai.tokensUsed?.toLocaleString() ?? 0} tokens)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Page Sections</h3>
            <SectionListEditor
              sections={sections}
              onChange={setSections}
              sectionHints={sectionMeta.hints}
              getDefaultContent={(id) => sectionMeta.defaultContent[id] ?? ''}
            />
          </div>
        </div>

        {/* SEO meta sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">SEO Meta</h3>
            <div className="mb-3">
              <div className="flex items-baseline justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                <span className={`text-xs ${metaTitleLen >= 50 && metaTitleLen <= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                  {metaTitleLen} / 50-60
                </span>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="mb-3">
              <div className="flex items-baseline justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                <span className={`text-xs ${metaDescLen >= 140 && metaDescLen <= 158 ? 'text-green-600' : 'text-amber-600'}`}>
                  {metaDescLen} / 140-158
                </span>
              </div>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <textarea
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                rows={2}
                placeholder="comma-separated"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {data.audit.lastEditedBy && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Audit</h3>
              <div className="text-xs space-y-1 text-gray-600">
                <div>Last edited by: <span className="text-gray-900">{data.audit.lastEditedBy}</span></div>
                {data.audit.updatedAt && <div>Updated: {new Date(data.audit.updatedAt).toLocaleString('en-IN')}</div>}
                {data.workflow.publishedAt && <div>Published: {new Date(data.workflow.publishedAt).toLocaleString('en-IN')}</div>}
                {data.ai.lastUpdate && <div>AI last ran: {new Date(data.ai.lastUpdate).toLocaleString('en-IN')}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !generating && setAiModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Generate with AI
              </h3>
              <button onClick={() => setAiModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                AI will generate content for each visible section of <strong>{data.serviceLabel}</strong> in <strong>{data.cityName}</strong>.
                {data.exists && (
                  <span className="block mt-1 text-amber-700">
                    ⚠ This will overwrite current section content if you click "Generate &amp; Save". Preview first.
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom instructions (optional)</label>
                <textarea
                  value={aiCustomInstructions}
                  onChange={(e) => setAiCustomInstructions(e.target.value)}
                  rows={4}
                  placeholder='e.g. "Emphasize wedding bookings", "Highlight monsoon precautions"'
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setAiModalOpen(false)} disabled={generating} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={() => generateWithAI(false)} disabled={generating} className="px-4 py-2 border border-purple-300 text-purple-700 rounded-md text-sm hover:bg-purple-50 disabled:opacity-50 inline-flex items-center gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Preview (don't save)
                </button>
                <button onClick={() => generateWithAI(true)} disabled={generating} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50 inline-flex items-center gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate &amp; Save
                </button>
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t">
                Takes ~30 seconds. Cost ~₹0.25 per generation. DeepSeek model.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
