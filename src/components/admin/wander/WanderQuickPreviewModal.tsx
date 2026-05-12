'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  X, Compass, ChevronRight, MapPin, Clock, Calendar,
  ChevronLeft as Prev, ChevronRight as Next,
} from 'lucide-react';
import { sanitizeRichText } from '@/lib/utils/sanitize';

interface PreviewProps {
  title?: string;
  description?: string;
  locationName?: string;
  duration?: string;
  basePrice?: string | number | null;
  coverImage?: string;
  images?: string[];
  onClose: () => void;
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);

  if (!images.length) {
    return (
      <div className="relative w-full h-64 md:h-[400px] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center rounded-2xl border border-emerald-100">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-3 shadow-sm border border-emerald-100">
          <span className="text-4xl">🗺️</span>
        </div>
        <p className="text-sm font-semibold text-gray-500">No photos added yet</p>
        <p className="text-xs text-gray-400 mt-1">Add a cover image or tour photos</p>
      </div>
    );
  }

  const current = images[idx];

  return (
    <div className="relative w-full h-64 md:h-[400px] rounded-2xl overflow-hidden bg-gray-100">
      <Image src={current} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
            aria-label="Previous image"
          >
            <Prev className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
            aria-label="Next image"
          >
            <Next className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full">
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function WanderQuickPreviewModal({
  title, description, locationName, duration, basePrice, coverImage, images = [], onClose,
}: PreviewProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const allImages = (coverImage ? [coverImage, ...images.filter((u) => u !== coverImage)] : images).filter(Boolean);
  const priceNum = basePrice ? Number(basePrice) : 0;
  const priceDisplay = priceNum > 0 ? `₹${priceNum.toLocaleString('en-IN')}` : null;
  const slugPreview = title ? title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 40) : 'your-tour';
  const hasDescription = description && description.replace(/<[^>]*>/g, '').trim();

  return (
    <div className="fixed inset-0 z-[998] flex flex-col bg-white">
      {/* Browser-like top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono truncate">
          transrentals.in/wander/{slugPreview}
        </div>
        <span className="flex-shrink-0 text-[10px] font-black bg-amber-400 text-amber-900 px-2 py-0.5 rounded tracking-widest uppercase">Preview</span>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-lg transition"
        >
          <X className="w-3.5 h-3.5" /> Close Preview
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
            <Compass className="w-3.5 h-3.5" /><span>Tours</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium truncate">{title || 'Your Tour'}</span>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <Gallery images={allImages} title={title || 'Tour Preview'} />

          <div>
            <h1 className="text-2xl md:text-[2rem] font-black text-gray-900 mb-3 leading-tight tracking-tight">
              {title || <span className="text-gray-300 italic font-light">Tour title here…</span>}
            </h1>
            <div className="flex flex-wrap gap-2">
              {locationName && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {locationName}
                </span>
              )}
              {duration && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> {duration}
                </span>
              )}
            </div>
          </div>

          {priceDisplay && (
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold mb-1">Starting from</p>
              <p className="text-3xl font-black text-gray-900">
                {priceDisplay} <span className="text-sm font-medium text-gray-500">per person</span>
              </p>
            </div>
          )}

          {!priceDisplay && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Pricing</p>
              <p className="text-2xl font-black text-gray-900">On Request</p>
              <p className="text-xs text-gray-500 mt-1">Travelers will request a quote.</p>
            </div>
          )}

          {hasDescription && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this Tour</h2>
              <div
                className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-emerald-700 prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(description) }}
              />
            </div>
          )}

          {!title && !hasDescription && allImages.length === 0 && !duration && !locationName && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Fill the form to see your tour preview here.</p>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              This is a live preview — what travelers will see once your tour is published.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
