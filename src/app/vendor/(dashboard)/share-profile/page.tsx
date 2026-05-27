'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2, ExternalLink, Eye, Monitor, Smartphone, Copy, Check,
  Share2, Mail, Facebook, Link2,
} from 'lucide-react';

// WhatsApp brand glyph (lucide has no WhatsApp icon).
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.516 5.26l-.999 3.648 3.972-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

export default function VendorShareProfilePage() {
  const [link, setLink] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
    fetch('/api/vendor/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.id) setLink(`/partner/${d.slug || d.id}`);
        if (d?.businessName) setBusinessName(d.businessName);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = link ? `${origin}${link}` : '';
  const shareText = `Check out ${businessName || 'our rentals'} on TransRentals`;

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const nativeShare = async () => {
    try { await navigator.share({ title: businessName || 'TransRentals', text: shareText, url: shareUrl }); } catch { /* cancelled */ }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Share Profile</h1>
        <p className="text-gray-600 mt-1">
          Your public page shows your business details and all your listed vehicles. Share it with customers anywhere.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: link + share buttons */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          {/* Public link */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your public link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 truncate">
                <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{loading ? 'Loading…' : shareUrl || '—'}</span>
              </div>
              <button
                onClick={copy}
                disabled={!shareUrl}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl text-sm font-medium text-gray-700"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Primary WhatsApp share */}
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3.5 text-white font-semibold transition ${shareUrl ? 'bg-[#25D366] hover:bg-[#1ebe5b]' : 'bg-gray-300 pointer-events-none'}`}
          >
            <WhatsAppIcon className="w-5 h-5" /> Share on WhatsApp
          </a>

          {/* Secondary share targets */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Or share via</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {canNativeShare && (
                <button
                  onClick={nativeShare}
                  disabled={!shareUrl}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Share</span>
                </button>
              )}
              <a
                href={shareUrl ? fbHref : undefined}
                target="_blank"
                rel="noreferrer"
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#1877F2] ${!shareUrl ? 'pointer-events-none opacity-50' : ''}`}
              >
                <Facebook className="w-5 h-5" />
                <span className="text-xs font-medium text-gray-700">Facebook</span>
              </a>
              <a
                href={shareUrl ? mailHref : undefined}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 ${!shareUrl ? 'pointer-events-none opacity-50' : ''}`}
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs font-medium">Email</span>
              </a>
              <button
                onClick={copy}
                disabled={!shareUrl}
                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700"
              >
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                <span className="text-xs font-medium">{copied ? 'Copied' : 'Copy link'}</span>
              </button>
            </div>
          </div>

          {/* Open full page */}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" /> Open public page
            </a>
          )}
        </div>

        {/* Right: live preview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <Eye className="w-4 h-4 text-gray-400" /> Live preview
            </span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-md ${device === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-md ${device === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                title="Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-[520px] flex items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : link ? (
            <div className="bg-gray-100 rounded-xl p-3 flex justify-center">
              <iframe
                src={link}
                title="Public profile preview"
                className={`bg-white rounded-lg border border-gray-200 transition-all ${device === 'mobile' ? 'w-[360px]' : 'w-full'} h-[520px]`}
              />
            </div>
          ) : (
            <div className="h-[520px] flex items-center justify-center text-gray-400 text-sm">Could not load preview.</div>
          )}
        </div>
      </div>
    </div>
  );
}
