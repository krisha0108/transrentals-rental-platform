'use client';

import { useEffect, useState } from 'react';

/** Shared scroll-progress hook (0–100). Pure UI, never touches post content. */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}

/** Thin fixed reading-progress bar pinned to the very top of the viewport. */
export function ReadingProgressBar() {
  const progress = useScrollProgress();
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
export function ReadingProgressMeter() {
  const progress = useScrollProgress();
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
