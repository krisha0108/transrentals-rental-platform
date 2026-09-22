'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts a number up once it scrolls into view.
 *
 * The hero stats were four static figures; watching them climb is what makes
 * them register as scale rather than decoration. Non-numeric values (like
 * "Weekly") pass straight through, so the same component can sit in every
 * tile without the caller branching.
 *
 * Driven by requestAnimationFrame against a wall-clock start, so the duration
 * holds regardless of frame rate, and skipped entirely for reduced motion.
 */
export function CountUp({
  value,
  duration = 1600,
  className = '',
}: {
  /** e.g. "5,000+", "₹40,000+", or a plain word like "Weekly". */
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);
  const target = match ? Number(match[2].replace(/,/g, '')) : null;

  const [display, setDisplay] = useState(() => (target === null ? value : `${match![1]}0${match![3]}`));

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;

    const finish = () => setDisplay(value);

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      finish();
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();

        const started = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - started) / duration, 1);
          // ease-out cubic: fast at first, settles onto the final number
          const eased = 1 - Math.pow(1 - t, 3);
          const n = Math.round(target * eased);
          setDisplay(`${match![1]}${n.toLocaleString('en-IN')}${match![3]}`);
          if (t < 1) raf = requestAnimationFrame(tick);
          else finish();
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
