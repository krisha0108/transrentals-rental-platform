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
    <section className="py-12 bg-emerald-50/40 border-t border-gray-100">
      <div className="container-custom">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Explore More {parentName} Options
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Parent link */}
          <Link
            href={`/${parentSlug}/${locationSlug}`}
            className="group inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All {parentName}
          </Link>

          {/* Sibling links */}
          {filtered.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}/${locationSlug}`}
              className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              <Bike className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              {s.name}
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
