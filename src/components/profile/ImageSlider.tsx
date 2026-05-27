'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Car } from 'lucide-react';

interface Props {
  images: string[];
  alt: string;
  /** Height utility classes for the frame. */
  heightClass?: string;
  /** Lightbox/open handler when an image is clicked (optional). */
  onImageClick?: (index: number) => void;
}

// Lightweight per-card image slider: prev/next, dots, counter, touch-swipe.
// No external deps — fine for many instances inside a grid.
export default function ImageSlider({ images, alt, heightClass = 'h-44', onImageClick }: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = images.length;
  const safeIndex = count ? ((index % count) + count) % count : 0;

  const go = (dir: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIndex((i) => (count ? (i + dir + count) % count : 0));
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  if (count === 0) {
    return (
      <div className={`${heightClass} bg-gray-100 flex items-center justify-center`}>
        <Car className="w-10 h-10 text-gray-300" />
      </div>
    );
  }

  return (
    <div
      className={`relative ${heightClass} bg-gray-100 overflow-hidden group/slider select-none`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Track */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`${alt} ${i + 1}`}
            onClick={() => onImageClick?.(i)}
            className={`w-full h-full object-cover shrink-0 ${onImageClick ? 'cursor-pointer' : ''}`}
            draggable={false}
          />
        ))}
      </div>

      {count > 1 && (
        <>
          {/* Arrows — appear on hover (always tappable on touch) */}
          <button
            type="button"
            onClick={(e) => go(-1, e)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-700 opacity-0 group-hover/slider:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => go(1, e)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-700 opacity-0 group-hover/slider:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Counter */}
          <span className="absolute top-2 right-2 bg-black/55 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            {safeIndex + 1}/{count}
          </span>

          {/* Dots */}
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndex(i); }}
                className={`h-1.5 rounded-full transition-all ${i === safeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
