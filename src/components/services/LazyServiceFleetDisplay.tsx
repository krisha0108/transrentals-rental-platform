'use client';

// Defers the heavy ServiceFleetDisplay client component (it fetches the fleet
// client-side, so it was never in the SSR HTML — no SEO loss from lazy-loading).
// We code-split it via next/dynamic (ssr:false) AND only mount it once it nears
// the viewport, so its JS + API fetch stay out of the initial load. A skeleton
// reserves height to keep CLS at 0.

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const ServiceFleetDisplay = dynamic(
  () => import('./ServiceFleetDisplay').then((m) => m.ServiceFleetDisplay),
  { ssr: false, loading: () => <FleetSkeleton /> }
);

interface LazyServiceFleetDisplayProps {
  serviceSlug: string;
  title?: string;
  showCategories?: boolean;
  limit?: number;
  showViewAll?: boolean;
  priceUnit?: string;
  locationSlug?: string;
  /** Forwarded to ServiceFleetDisplay — see the note there. */
  hidePrices?: boolean;
}

function FleetSkeleton() {
  return (
    <section className="py-12 lg:py-16">
      <div className="container-custom">
        <div className="h-8 w-64 bg-gray-200 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LazyServiceFleetDisplay(props: LazyServiceFleetDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    // Fallback: if IntersectionObserver is unavailable, just render it.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' } // start loading just before it scrolls into view
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref}>
      {visible ? <ServiceFleetDisplay {...props} /> : <FleetSkeleton />}
    </div>
  );
}
