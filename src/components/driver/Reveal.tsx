'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fades and lifts its children in the first time they scroll into view.
 *
 * Entrance animations that fire on page load are wasted on everything below
 * the fold — by the time the visitor scrolls down, they have long finished.
 * This waits for the section to actually arrive, then plays once and
 * disconnects, so scrolling back up does not replay it.
 *
 * Anyone who asked their OS to reduce motion is shown the final state
 * immediately, and so is anyone whose browser lacks IntersectionObserver.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  /** Milliseconds to stagger this item behind its neighbours. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-7 opacity-0'
      } ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
