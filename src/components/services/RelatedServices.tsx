import React from 'react';
import Link from 'next/link';
import { Bike, ArrowLeft, ArrowRight } from 'lucide-react';

interface ServiceLink {
  slug: string;
  name: string;
}

interface RelatedServicesProps {
  locationSlug: string;
  parentSlug: string;
  parentName: string;
  siblings: ServiceLink[];
  currentSlug: string;
}

export function RelatedServices({
  locationSlug,
  parentSlug,
  parentName,
  siblings,
  currentSlug,
}: RelatedServicesProps) {
  const filtered = siblings.filter((s) => s.slug !== currentSlug);

  return (
    <section className="relative overflow-hidden py-14 md:py-16 bg-gradient-to-b from-white via-emerald-50/25 to-white border-t border-gray-100">
      <div className="container-custom relative">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
          More Options
        </span>
        <h2 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-gray-900 mb-7">
          Explore More {parentName} Options
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Parent link */}
          <Link
            href={`/${parentSlug}/${locationSlug}`}
            className="group flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-5 py-4 transition-colors shadow-sm"
          >
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </span>
            <span className="font-semibold text-sm">All {parentName}</span>
          </Link>

          {/* Sibling links */}
          {filtered.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}/${locationSlug}`}
              className="group flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-4 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                <Bike className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" strokeWidth={2} />
              </span>
              <span className="flex-1 font-semibold text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">{s.name}</span>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
