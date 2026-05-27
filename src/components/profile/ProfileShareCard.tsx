'use client';

import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Loader2, Eye, EyeOff, Link2 } from 'lucide-react';

interface Props {
  /** vendor → /partner/<slug>, driver → /captain/<slug> */
  kind: 'vendor' | 'driver';
  /** Show the public/hidden visibility toggle. Default true. */
  showVisibility?: boolean;
  /** Show the custom-link (slug) input. Default true. */
  showSlug?: boolean;
}

const CONFIG = {
  vendor: { base: '/partner', getUrl: '/api/vendor/profile', method: 'PUT' as const },
  driver: { base: '/captain', getUrl: '/api/driver/auth/me', method: 'PATCH' as const },
};

export default function ProfileShareCard({ kind, showVisibility = true, showSlug = true }: Props) {
  const cfg = CONFIG[kind];
  const editable = showSlug || showVisibility;
  const saveUrl = kind === 'vendor' ? '/api/vendor/profile' : '/api/driver/profile';

  const [id, setId] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [savedSlug, setSavedSlug] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(cfg.getUrl, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const rec = kind === 'driver' ? d.driver : d;
        if (!rec) return;
        setId(rec.id ?? null);
        setSlug(rec.slug ?? '');
        setSavedSlug(rec.slug ?? '');
        setIsPublic(rec.isProfilePublic ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cfg.getUrl, kind]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkPath = `${cfg.base}/${savedSlug || id || ''}`;
  const shareUrl = `${origin}${linkPath}`;

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(saveUrl, {
        method: cfg.method,
        headers: { 'Content-Type': 'application/json' },
        // Only send the fields whose controls are shown; otherwise leave as-is.
        body: JSON.stringify({
          ...(showSlug ? { slug } : {}),
          ...(showVisibility ? { isProfilePublic: isPublic } : {}),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not save');
      const newSlug = (kind === 'driver' ? d.driver?.slug : d.slug) ?? slug;
      setSavedSlug(newSlug || '');
      setSlug(newSlug || '');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const dirty = slug !== savedSlug;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading profile link…
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Share2 className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">Public profile</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">Share this link with customers — it shows your public profile page.</p>

      {/* Share link */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 truncate">
          <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{shareUrl || '—'}</span>
        </div>
        <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <a href={linkPath} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Custom slug */}
      {showSlug && (
        <>
          <label className="block text-xs font-medium text-gray-500 mb-1">Custom link (optional)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{cfg.base}/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="your-business-name"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </>
      )}

      {/* Visibility */}
      {showVisibility && (
        <button
          onClick={() => setIsPublic((v) => !v)}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium"
        >
          <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
          </span>
          <span className={isPublic ? 'text-emerald-700' : 'text-gray-500'}>
            {isPublic ? <span className="inline-flex items-center gap-1"><Eye className="w-4 h-4" /> Visible to public</span> : <span className="inline-flex items-center gap-1"><EyeOff className="w-4 h-4" /> Hidden</span>}
          </span>
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {editable && (
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saved ? 'Saved!' : 'Save'}
          </button>
          {dirty && !saving && <span className="text-xs text-amber-600">Unsaved changes</span>}
        </div>
      )}
    </div>
  );
}
