'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Link2, Copy, CheckCheck, QrCode, Settings2,
  ExternalLink, X, Save, MessageCircle, Eye,
  BookOpen, Download, Zap, Share2, Globe,
  ToggleLeft, ToggleRight, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

/* ── Fade-in ── */
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

/* ── Animated counter ── */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) { setCount(target); return; }
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick); else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

/* ── Service meta ── */
const SVC_META: Record<string, { icon: string; color: string; bg: string; text: string; border: string; activeDot: string }> = {
  'car-with-driver': { icon: '🚗', color: '#059669', bg: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-l-emerald-500',  activeDot: 'bg-emerald-400' },
  'self-drive':      { icon: '🚙', color: '#059669', bg: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-l-emerald-500',  activeDot: 'bg-emerald-400' },
  bike:              { icon: '🏍️', color: '#F97316', bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-l-orange-500',  activeDot: 'bg-orange-400' },
  bus:               { icon: '🚌', color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-l-emerald-500', activeDot: 'bg-emerald-400' },
  luxury:            { icon: '✨', color: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-l-amber-500',   activeDot: 'bg-amber-400' },
  transporter:       { icon: '🚛', color: '#64748B', bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-l-slate-500',   activeDot: 'bg-slate-400' },
  'packers-movers':  { icon: '📦', color: '#059669', bg: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-l-emerald-500',  activeDot: 'bg-emerald-400' },
  equipment:         { icon: '🔧', color: '#EF4444', bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-l-red-500',     activeDot: 'bg-red-400' },
  all:               { icon: '🌐', color: '#059669', bg: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-l-emerald-500',  activeDot: 'bg-emerald-400' },
};
const DEFAULT_META = { icon: '🔗', color: '#6B7280', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-l-gray-400', activeDot: 'bg-gray-400' };

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
        await navigator.share({ files: [file], title: `Book ${qrModal.label}`, text: `Scan this QR to book ${qrModal.label}` });
        setShareStatus('done');
      } else if (typeof navigator.share === 'function') {
        await navigator.share({ title: `Book ${qrModal.label}`, url: qrModal.url });
        setShareStatus('done');
      } else {
        downloadQr();
        setShareStatus('done');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') { setShareStatus('idle'); } else { setShareStatus('error'); }
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
    const msg = encodeURIComponent(`Book ${qrModal.label} with us!\nScan the QR code or click here: ${qrModal.url}`);
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

  const totalViews    = links.reduce((s, l) => s + l.clickCount,  0);
  const totalBookings = links.reduce((s, l) => s + l.bookingCount, 0);
  const activeCount   = links.filter(l => l.isActive).length;

  const animViews    = useCountUp(loading ? 0 : totalViews, 1400);
  const animBookings = useCountUp(loading ? 0 : totalBookings, 1200);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-5 pb-8 bg-[#F9FAFB] min-h-screen">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 rounded-2xl p-6 pb-5 animate-pulse">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-white/15 ring-1 ring-white/20" />
            <div className="space-y-2">
              <div className="h-5 w-36 bg-white/20 rounded-md" />
              <div className="h-3.5 w-48 bg-white/10 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-white/15 rounded" />
                <div className="h-6 w-6 bg-white/20 rounded" />
                <div className="h-3.5 w-14 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 p-4 animate-pulse">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-12 bg-gray-100 rounded-full" />
                </div>
              </div>
              <div className="h-3 w-full bg-gray-50 rounded mb-3" />
              <div className="flex gap-3 mb-3">
                <div className="h-3 w-14 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
              <div className="flex gap-1.5 pt-3 border-t border-gray-50">
                {[1, 2, 3, 4, 5].map(j => <div key={j} className="h-8 w-10 bg-gray-100 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 bg-[#F9FAFB] min-h-screen">

      {/* ══════════ Header ══════════ */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 p-6 pb-5">
          {/* Animated mesh bg */}
          <div className="absolute inset-0">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl animate-[headerFloat_6s_ease-in-out_infinite]" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-emerald-300/15 blur-3xl animate-[headerFloat_6s_ease-in-out_infinite_reverse]" />
            <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-emerald-300/10 blur-2xl animate-[headerFloat_8s_ease-in-out_infinite_1s]" />
          </div>
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10">
            {/* Title row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl shadow-black/10 ring-1 ring-white/20 group/icon relative overflow-hidden cursor-default">
                  <div className="absolute inset-0 -translate-x-full group-hover/icon:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <Link2 className="w-5.5 h-5.5 text-white relative z-10 animate-[iconFloat_3s_ease-in-out_infinite]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white leading-tight tracking-tight">Booking Links</h1>
                  <p className="text-emerald-200/80 text-sm mt-0.5">Share & track your booking links</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 shadow-lg shadow-black/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-sm font-bold text-white">{activeCount} active</span>
              </div>
            </div>

            {/* Stats — inline pills */}
            <div className="flex items-center gap-6">
              {[
                { label: 'Links',    value: activeCount,  icon: <Zap className="w-3.5 h-3.5" /> },
                { label: 'Views',    value: animViews,    icon: <Eye className="w-3.5 h-3.5" /> },
                { label: 'Bookings', value: animBookings, icon: <BookOpen className="w-3.5 h-3.5" /> },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2 cursor-default group">
                  <div className="text-white/40 group-hover:text-white/70 transition-colors duration-200">{stat.icon}</div>
                  <span className="text-2xl font-extrabold text-white tabular-nums">{stat.value}</span>
                  <span className="text-sm text-white/40 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ══════════ Link Cards ══════════ */}
      <div>
        {links.length === 0 ? (
          <FadeIn delay={100}>
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 py-16 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-emerald-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No booking links yet</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Your links will appear once your services are configured and approved.</p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {links.map((link, index) => {
              const meta     = SVC_META[link.serviceType] ?? DEFAULT_META;
              const isCopied = copiedId === link.id;

              return (
                <FadeIn key={link.id} delay={100 + index * 40}>
                  <div
                    className={cn(
                      'bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border transition-all duration-300 overflow-hidden group h-full flex flex-col',
                      link.isActive
                        ? 'border-gray-100 hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-1 hover:border-emerald-200'
                        : 'border-gray-100 opacity-50 hover:opacity-80'
                    )}
                    style={{ borderTop: `3px solid ${meta.color}` }}
                  >
                    <div className="p-4 flex-1 flex flex-col">
                      {/* ── Header: icon + name + toggle ── */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={cn('w-9 h-9 shrink-0 text-lg rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200', meta.bg)}>
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 truncate">{link.serviceLabel}</h3>
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-0.5',
                            link.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          )}>
                            {link.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleActive(link)}
                          title={link.isActive ? 'Pause' : 'Activate'}
                          className="shrink-0 hover:scale-110 active:scale-95 transition-all"
                        >
                          {link.isActive
                            ? <ToggleRight className="w-7 h-7 text-emerald-500" />
                            : <ToggleLeft  className="w-7 h-7 text-gray-300" />}
                        </button>
                      </div>

                      {/* ── URL ── */}
                      <p className="text-xs font-mono text-gray-300 truncate mb-3">{link.url}</p>

                      {/* ── Stats ── */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Eye className="w-3 h-3 text-gray-300" />
                          <span className="font-bold text-gray-700 tabular-nums">{link.clickCount}</span>
                          <span className="text-gray-400">views</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <BookOpen className="w-3 h-3 text-gray-300" />
                          <span className="font-bold text-gray-700 tabular-nums">{link.bookingCount}</span>
                          <span className="text-gray-400">bookings</span>
                        </div>
                      </div>

                      {/* ── Actions ── */}
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-gray-50">
                        <button
                          onClick={() => copyLink(link)}
                          className={cn(
                            'flex items-center gap-1 text-xs font-bold px-2.5 py-2 rounded-lg transition-all duration-200 active:scale-[0.97]',
                            isCopied
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm'
                          )}
                        >
                          {isCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={() => shareWhatsApp(link)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg border border-[#25D366]/20 hover:bg-[#25D366]/10 text-[#128C7E] transition-all active:scale-[0.97]">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </button>
                        <button onClick={() => openQr(link)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all active:scale-[0.97]">
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openCustomize(link)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all active:scale-[0.97]">
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-all active:scale-[0.97]">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ QR Modal ══════════ */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setQrModal(null); setShareStatus('idle'); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">QR Code</h3>
                <p className="text-gray-400 text-xs mt-0.5">{qrModal.label}</p>
              </div>
              <button onClick={() => { setQrModal(null); setShareStatus('idle'); }} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="rounded-xl w-48 h-48 shadow-md" />
                ) : (
                  <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
                  </div>
                )}
              </div>

              <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
                <p className="text-xs text-gray-400 font-mono truncate flex-1">{qrModal.url}</p>
                <button onClick={copyQrLink} className={cn('shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all', qrLinkCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100')}>
                  {qrLinkCopied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                  {qrLinkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <button onClick={shareQr} disabled={!qrDataUrl || shareStatus === 'sharing'} className={cn('w-full font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm active:scale-[0.98]', shareStatus === 'done' ? 'bg-emerald-500 text-white' : shareStatus === 'error' ? 'bg-red-500 text-white' : 'bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white')}>
                  {shareStatus === 'sharing' ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sharing…</> : shareStatus === 'done' ? <><Check className="w-4 h-4" /> Shared!</> : shareStatus === 'error' ? <><Download className="w-4 h-4" /> Download instead</> : <><Share2 className="w-4 h-4" /> Share QR Image</>}
                </button>

                {shareStatus === 'error' && <p className="text-center text-xs text-red-400">Sharing not supported — use WhatsApp or Download</p>}

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={shareQrWhatsApp} disabled={!qrDataUrl} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 disabled:opacity-40 text-[#128C7E] font-semibold text-xs transition active:scale-[0.97]">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                  <button onClick={downloadQr} disabled={!qrDataUrl} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-semibold text-xs transition active:scale-[0.97]">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Customize Modal ══════════ */}
      {customizeId && (() => {
        const link = links.find(l => l.id === customizeId);
        const meta = link ? (SVC_META[link.serviceType] ?? DEFAULT_META) : DEFAULT_META;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCustomizeId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Customize Form</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{link?.serviceLabel}</p>
                </div>
                <button onClick={() => setCustomizeId(null)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Form Title</label>
                  <input type="text" value={customizeData.formTitle} onChange={e => setCustomizeData({ ...customizeData, formTitle: e.target.value })} placeholder="e.g. Book a Bike with Rahul Travels" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all" />
                  <p className="text-xs text-gray-400 mt-1">Heading on your booking form</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Welcome Message</label>
                  <textarea value={customizeData.welcomeMsg} onChange={e => setCustomizeData({ ...customizeData, welcomeMsg: e.target.value })} placeholder="e.g. Best rates in Pune..." rows={3} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all resize-none" />
                  <p className="text-xs text-gray-400 mt-1">Note below your business name</p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setCustomizeId(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm active:scale-[0.98]">Cancel</button>
                  <button onClick={saveCustomize} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Keyframes */}
      <style jsx>{`
        @keyframes headerFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(15px, -10px) scale(1.1); opacity: 0.8; }
          66% { transform: translate(-10px, 8px) scale(0.95); opacity: 0.5; }
        }
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
