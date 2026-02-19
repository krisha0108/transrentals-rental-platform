'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Link2, Copy, CheckCheck, QrCode, Settings2,
  ExternalLink, X, Save, MessageCircle, Eye,
  BookOpen, Download, Zap, Share2, Globe,
  ToggleLeft, ToggleRight, Check,
} from 'lucide-react';

interface BookingLink {
  id: string;
  serviceType: string;
  serviceLabel: string;
  url: string;
  isActive: boolean;
  formTitle: string | null;
  welcomeMsg: string | null;
  clickCount: number;
  bookingCount: number;
}

/* ── Service meta ──────────────────────────────────────────────────────── */
const SVC_META: Record<string, { icon: string; from: string; to: string; ring: string; badge: string; text: string }> = {
  'car-with-driver': { icon: '🚗', from: 'from-blue-500',    to: 'to-cyan-500',     ring: 'ring-blue-200',   badge: 'bg-blue-50 text-blue-700',   text: 'text-blue-600' },
  'self-drive':      { icon: '🚙', from: 'from-violet-500',  to: 'to-purple-600',   ring: 'ring-violet-200', badge: 'bg-violet-50 text-violet-700',text: 'text-violet-600' },
  bike:              { icon: '🏍️', from: 'from-orange-400',  to: 'to-amber-500',    ring: 'ring-orange-200', badge: 'bg-orange-50 text-orange-700',text: 'text-orange-600' },
  bus:               { icon: '🚌', from: 'from-emerald-500', to: 'to-green-600',    ring: 'ring-emerald-200',badge: 'bg-emerald-50 text-emerald-700',text: 'text-emerald-600' },
  luxury:            { icon: '✨', from: 'from-yellow-400',  to: 'to-orange-500',   ring: 'ring-yellow-200', badge: 'bg-yellow-50 text-yellow-700',text: 'text-yellow-600' },
  transporter:       { icon: '🚛', from: 'from-slate-500',   to: 'to-gray-600',     ring: 'ring-slate-200',  badge: 'bg-slate-50 text-slate-700',  text: 'text-slate-600' },
  'packers-movers':  { icon: '📦', from: 'from-sky-500',     to: 'to-cyan-600',     ring: 'ring-sky-200',    badge: 'bg-sky-50 text-sky-700',      text: 'text-sky-600' },
  equipment:         { icon: '🔧', from: 'from-red-500',     to: 'to-rose-600',     ring: 'ring-red-200',    badge: 'bg-red-50 text-red-700',      text: 'text-red-600' },
  all:               { icon: '🌐', from: 'from-indigo-500',  to: 'to-violet-600',   ring: 'ring-indigo-200', badge: 'bg-indigo-50 text-indigo-700',text: 'text-indigo-600' },
};
const DEFAULT_META = { icon: '🔗', from: 'from-gray-400', to: 'to-gray-500', ring: 'ring-gray-200', badge: 'bg-gray-50 text-gray-600', text: 'text-gray-600' };

export default function BookingLinksPage() {
  const [links, setLinks]             = useState<BookingLink[]>([]);
  const [slug, setSlug]               = useState('');
  const [loading, setLoading]         = useState(true);
  const [copiedId, setCopiedId]       = useState<string | null>(null);
  const [qrModal, setQrModal]         = useState<{ url: string; label: string } | null>(null);
  const [qrDataUrl, setQrDataUrl]     = useState<string | null>(null);
  const [customizeId, setCustomizeId] = useState<string | null>(null);
  const [customizeData, setCustomizeData] = useState({ formTitle: '', welcomeMsg: '' });
  const [saving, setSaving]             = useState(false);
  const [qrLinkCopied, setQrLinkCopied] = useState(false);
  const [shareStatus, setShareStatus]   = useState<'idle'|'sharing'|'done'|'error'>('idle');

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/vendor/booking-links', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) { setLinks(data.links); setSlug(data.slug); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const copyLink = (link: BookingLink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareWhatsApp = (link: BookingLink) => {
    const msg = encodeURIComponent(`Book ${link.serviceLabel} with us: ${link.url}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const openQr = async (link: BookingLink) => {
    setQrModal({ url: link.url, label: link.serviceLabel });
    setQrDataUrl(null);
    const res  = await fetch(`/api/vendor/booking-links/qr?url=${encodeURIComponent(link.url)}`, { credentials: 'include' });
    const data = await res.json();
    if (data.qr) setQrDataUrl(data.qr);
  };

  const downloadQr = () => {
    if (!qrDataUrl || !qrModal) return;
    const a  = document.createElement('a');
    a.href   = qrDataUrl;
    a.download = `booking-qr-${qrModal.label.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  };

  /** Convert a base64 data-URL to a Blob without using fetch() */
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, b64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };

  const shareQr = async () => {
    if (!qrDataUrl || !qrModal) return;
    setShareStatus('sharing');
    try {
      const blob = dataUrlToBlob(qrDataUrl);
      const fileName = `booking-qr-${qrModal.label.toLowerCase().replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        // Mobile: native share sheet with the actual image file
        await navigator.share({
          files: [file],
          title: `Book ${qrModal.label}`,
          text:  `Scan this QR to book ${qrModal.label}`,
        });
        setShareStatus('done');
      } else if (typeof navigator.share === 'function') {
        // Desktop Chrome / partial support: share just the URL
        await navigator.share({ title: `Book ${qrModal.label}`, url: qrModal.url });
        setShareStatus('done');
      } else {
        // No Web Share API — download as fallback
        downloadQr();
        setShareStatus('done');
      }
    } catch (err: any) {
      // AbortError = user cancelled — treat as idle, not error
      if (err?.name === 'AbortError') {
        setShareStatus('idle');
      } else {
        setShareStatus('error');
      }
    } finally {
      setTimeout(() => setShareStatus(s => s !== 'error' ? 'idle' : s), 2500);
    }
  };

  const copyQrLink = async () => {
    if (!qrModal) return;
    await navigator.clipboard.writeText(qrModal.url);
    setQrLinkCopied(true);
    setTimeout(() => setQrLinkCopied(false), 2000);
  };

  const shareQrWhatsApp = () => {
    if (!qrModal) return;
    const msg = encodeURIComponent(
      `Book ${qrModal.label} with us!\nScan the QR code or click here: ${qrModal.url}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const toggleActive = async (link: BookingLink) => {
    const res = await fetch(`/api/vendor/booking-links/${link.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    if (res.ok) setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
  };

  const openCustomize = (link: BookingLink) => {
    setCustomizeId(link.id);
    setCustomizeData({ formTitle: link.formTitle || '', welcomeMsg: link.welcomeMsg || '' });
  };

  const saveCustomize = async () => {
    if (!customizeId) return;
    setSaving(true);
    await fetch(`/api/vendor/booking-links/${customizeId}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customizeData),
    });
    setLinks(prev => prev.map(l => l.id === customizeId ? { ...l, ...customizeData } : l));
    setSaving(false);
    setCustomizeId(null);
  };

  /* ── totals ── */
  const totalViews    = links.reduce((s, l) => s + l.clickCount,  0);
  const totalBookings = links.reduce((s, l) => s + l.bookingCount, 0);
  const activeCount   = links.filter(l => l.isActive).length;

  /* ── loading skeleton ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="-m-6">
        {/* Header skeleton */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 pt-16 lg:pt-10 pb-20" />
        <div className="relative z-10 px-4 sm:px-6 -mt-12 pb-10 max-w-4xl mx-auto space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6">

      {/* ── Full-bleed header ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden px-6 pt-16 lg:pt-10 pb-24">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Booking Links</h1>
              <p className="text-indigo-200 text-sm">Share links to get direct booking requests</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-6 flex-wrap">
            {[
              { label: 'Active Links',    value: activeCount,   icon: <Zap className="w-4 h-4" />,      color: 'bg-white/15' },
              { label: 'Total Views',     value: totalViews,    icon: <Eye className="w-4 h-4" />,      color: 'bg-white/15' },
              { label: 'Total Bookings',  value: totalBookings, icon: <BookOpen className="w-4 h-4" />, color: 'bg-white/15' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.color} backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-2.5`}>
                <div className="text-white/70">{stat.icon}</div>
                <div>
                  <p className="text-xl font-bold text-white leading-none">{stat.value}</p>
                  <p className="text-indigo-200 text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cards ──────────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 sm:px-6 -mt-14 pb-12 max-w-4xl mx-auto space-y-4">
        {links.map(link => {
          const meta       = SVC_META[link.serviceType] ?? DEFAULT_META;
          const isCopied   = copiedId === link.id;

          return (
            <div
              key={link.id}
              className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
                link.isActive ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Coloured top strip */}
              <div className={`h-1 w-full bg-gradient-to-r ${meta.from} ${meta.to}`} />

              <div className="p-5">
                {/* ── Top row ── */}
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center text-2xl shadow-sm ring-4 ${meta.ring} shrink-0`}>
                    {meta.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{link.serviceLabel}</h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        link.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {link.isActive ? '● Active' : '○ Paused'}
                      </span>
                    </div>

                    {/* URL */}
                    <p className={`text-xs mt-1 truncate font-mono ${meta.text}`}>{link.url}</p>

                    {/* Custom title if set */}
                    {link.formTitle && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate italic">"{link.formTitle}"</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="w-3 h-3" /> <span className="font-semibold text-gray-600">{link.clickCount}</span> views
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <BookOpen className="w-3 h-3" /> <span className="font-semibold text-gray-600">{link.bookingCount}</span> bookings
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(link)}
                    title={link.isActive ? 'Pause link' : 'Activate link'}
                    className="shrink-0 mt-0.5"
                  >
                    {link.isActive
                      ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                      : <ToggleLeft  className="w-8 h-8 text-gray-300" />
                    }
                  </button>
                </div>

                {/* ── Action buttons ── */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed border-gray-100">
                  {/* Copy */}
                  <button
                    onClick={() => copyLink(link)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                      isCopied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Copied!' : 'Copy Link'}
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={() => shareWhatsApp(link)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>

                  {/* QR */}
                  <button
                    onClick={() => openQr(link)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Code
                  </button>

                  {/* Customize */}
                  <button
                    onClick={() => openCustomize(link)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Customize
                  </button>

                  {/* Preview */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {links.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">No booking links yet</h3>
            <p className="text-gray-400 text-sm mt-1">Your booking links will appear here once configured.</p>
          </div>
        )}
      </div>

      {/* ── QR Modal ──────────────────────────────────────────────────────── */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-700 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">QR Code</h3>
                <p className="text-purple-200 text-sm">{qrModal.label}</p>
              </div>
              <button onClick={() => { setQrModal(null); setShareStatus('idle'); }} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6">
              {/* QR image */}
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="rounded-2xl w-52 h-52 shadow-lg" />
                ) : (
                  <div className="w-52 h-52 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent" />
                  </div>
                )}
              </div>

              {/* URL pill */}
              <div className="mt-4 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
                <p className="text-[11px] text-gray-500 font-mono truncate flex-1">{qrModal.url}</p>
                <button
                  onClick={copyQrLink}
                  className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition ${
                    qrLinkCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {qrLinkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {qrLinkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Share actions */}
              <div className="mt-4 space-y-2">
                {/* Native share — primary CTA */}
                <button
                  onClick={shareQr}
                  disabled={!qrDataUrl || shareStatus === 'sharing'}
                  className={`w-full font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 ${
                    shareStatus === 'done'
                      ? 'bg-emerald-500 text-white'
                      : shareStatus === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 disabled:opacity-40 text-white'
                  }`}
                >
                  {shareStatus === 'sharing' ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sharing…</>
                  ) : shareStatus === 'done' ? (
                    <><Check className="w-4 h-4" /> Shared!</>
                  ) : shareStatus === 'error' ? (
                    <><Download className="w-4 h-4" /> Tap to Download instead</>
                  ) : (
                    <><Share2 className="w-4 h-4" /> Share QR Image</>
                  )}
                </button>

                {/* Error hint */}
                {shareStatus === 'error' && (
                  <p className="text-center text-xs text-red-400 -mt-1">
                    Sharing not supported on this browser — use WhatsApp or Download below
                  </p>
                )}

                {/* WhatsApp + Download row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={shareQrWhatsApp}
                    disabled={!qrDataUrl}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 disabled:opacity-40 text-[#128C7E] font-semibold text-sm transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>

                  <button
                    onClick={downloadQr}
                    disabled={!qrDataUrl}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-semibold text-sm transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Customize Modal ────────────────────────────────────────────────── */}
      {customizeId && (() => {
        const link = links.find(l => l.id === customizeId);
        const meta = link ? (SVC_META[link.serviceType] ?? DEFAULT_META) : DEFAULT_META;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className={`bg-gradient-to-r ${meta.from} ${meta.to} px-6 py-5 flex items-center justify-between`}>
                <div>
                  <h3 className="font-bold text-white text-lg">Customize Form</h3>
                  <p className="text-white/70 text-sm">{link?.serviceLabel}</p>
                </div>
                <button onClick={() => setCustomizeId(null)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Form Title</label>
                  <input
                    type="text"
                    value={customizeData.formTitle}
                    onChange={e => setCustomizeData({ ...customizeData, formTitle: e.target.value })}
                    placeholder="e.g. Book a Bike with Rahul Travels"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown as the heading on your booking form</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Welcome Message</label>
                  <textarea
                    value={customizeData.welcomeMsg}
                    onChange={e => setCustomizeData({ ...customizeData, welcomeMsg: e.target.value })}
                    placeholder="e.g. Best rates in Pune. We offer Royal Enfield, Activa & more."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown as a note below your business name</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setCustomizeId(null)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCustomize}
                    disabled={saving}
                    className={`flex-1 bg-gradient-to-r ${meta.from} ${meta.to} hover:opacity-90 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
