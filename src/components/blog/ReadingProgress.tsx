'use client';

import { useEffect, useState } from 'react';

/**
 * Scroll-progress hook (0–100).
 * - With `targetId`: measures progress through that element (e.g. the article),
 *   so it hits 100% exactly when the element's bottom reaches the viewport bottom
 *   (i.e. the last paragraph is read) — ignoring related posts / footer below.
 * - Without `targetId`: falls back to whole-page scroll progress.
 */
function useScrollProgress(targetId?: string) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const compute = () => {
      const vh = window.innerHeight;
      const el = targetId ? document.getElementById(targetId) : null;

      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollable = el.offsetHeight - vh;
        let pct: number;
        if (scrollable <= 0) {
          // Article fits within one screen → done once its bottom is visible
          pct = rect.bottom <= vh ? 100 : 0;
        } else {
          // How far the article top has scrolled above the viewport top
          pct = (-rect.top / scrollable) * 100;
        }
        setProgress(Math.min(100, Math.max(0, pct)));
        return;
      }

      // Fallback: whole-page progress
      const total = document.documentElement.scrollHeight - vh;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, [targetId]);

  return progress;
}

/** Thin fixed reading-progress bar pinned to the very top of the viewport. */
export function ReadingProgressBar({ targetId }: { targetId?: string }) {
  const progress = useScrollProgress(targetId);
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[70] bg-[#e0e3e5] pointer-events-none">
      <div
        className="h-full bg-[#10b981] transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/** Sidebar card showing the live reading-progress percentage. */
export function ReadingProgressMeter({ targetId }: { targetId?: string }) {
  const progress = useScrollProgress(targetId);
  return (
    <div className="p-6 rounded-2xl bg-white border border-[#d1fae5]/60 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#545f73] mb-3">
        Reading Progress
      </p>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-[#047857] leading-none">
          {Math.round(progress)}
        </span>
        <span className="text-xl font-semibold text-[#10b981] pb-0.5">%</span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-[#e0e3e5] overflow-hidden">
        <div
          className="h-full bg-[#10b981] transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
