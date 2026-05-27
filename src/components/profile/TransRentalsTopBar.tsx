'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Slim TransRentals-branded bar for standalone public profile pages
 * (/partner, /captain). These pages render without the global site header,
 * so this bar is what tells a customer "this is an official TransRentals page"
 * — the core trust signal.
 */
export default function TransRentalsTopBar({ label = 'Verified Partner' }: { label?: string }) {
  return (
    <div className="sticky top-0 z-[1100] bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2" aria-label="TransRentals home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-trans.png" alt="TransRentals" className="h-7 w-auto" />
        </a>
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          {label} on TransRentals
        </span>
      </div>
    </div>
  );
}
