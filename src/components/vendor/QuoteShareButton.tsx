'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, MessageCircle, X } from 'lucide-react';

interface Props {
  quoteUrl: string;
  quoteNumber: string;
  customerName: string;
  amount?: number;
  serviceName?: string;
  publicUrl?: string;
}

export default function QuoteShareButton({ quoteUrl, quoteNumber, customerName, amount, serviceName, publicUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Derive public share URL: use explicit publicUrl, or auto-extract quote ID from vendor URL pattern
  const vendorMatch = quoteUrl.match(/^\/vendor\/[^/]+\/quotes\/([^/]+)$/);
  const shareUrl = publicUrl ?? (vendorMatch ? `/q/${vendorMatch[1]}` : quoteUrl);
  const fullUrl = `${origin}${shareUrl}`;

  const waText = encodeURIComponent(
    `*Quote #${quoteNumber}*${serviceName ? ` — ${serviceName}` : ''}\n` +
    `Customer: ${customerName}\n` +
    (amount ? `Amount: ₹${amount.toLocaleString('en-IN')}\n` : '') +
    `\nView Quote 👉 ${fullUrl}`
  );

  function stop(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); }

  function handleCopy(e: React.MouseEvent) {
    stop(e);
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    });
  }

  function handleWhatsApp(e: React.MouseEvent) {
    stop(e);
    window.open(`https://wa.me/?text=${waText}`, '_blank');
    setOpen(false);
  }

  function handleNative(e: React.MouseEvent) {
    stop(e);
    navigator.share?.({ title: `Quote #${quoteNumber}`, url: fullUrl });
    setOpen(false);
  }

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div ref={ref} className="relative shrink-0" onClick={stop}>
      <button
        onClick={(e) => { stop(e); setOpen(v => !v); }}
        title="Share quote"
        className={`flex items-center justify-center w-[38px] h-[38px] rounded-xl border transition-all active:scale-95 ${
          open
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'
        }`}
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[999]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-bold text-gray-700">Share Quote</span>
            </div>
            <button
              onClick={(e) => { stop(e); setOpen(false); }}
              className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* Options */}
          <div className="p-2 space-y-0.5">
            {/* Copy Link */}
            <button onClick={handleCopy}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${copied ? 'bg-emerald-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                {copied
                  ? <Check className="w-4 h-4 text-emerald-600" />
                  : <Copy className="w-4 h-4 text-gray-600" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">{copied ? 'Link Copied!' : 'Copy Link'}</p>
                <p className="text-[10px] text-gray-400">Copy quote URL</p>
              </div>
            </button>

            {/* WhatsApp */}
            <button onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[#f0fdf4] transition-colors text-left group">
              <div className="w-8 h-8 rounded-xl bg-[#25D366] flex items-center justify-center">
                {/* WhatsApp SVG icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">WhatsApp</p>
                <p className="text-[10px] text-gray-400">Send via WhatsApp</p>
              </div>
            </button>

            {/* Native Share — shown only on mobile/supported browsers */}
            {hasNativeShare && (
              <button onClick={handleNative}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">More Options</p>
                  <p className="text-[10px] text-gray-400">Share via other apps</p>
                </div>
              </button>
            )}
          </div>

          {/* Quote pill footer */}
          <div className="px-3 pb-2.5 pt-1">
            <div className="bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100">
              <p className="text-[10px] text-gray-500 font-medium truncate">#{quoteNumber} · {customerName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
