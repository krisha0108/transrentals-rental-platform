import React from 'react';
import Link from 'next/link';

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
    <section className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="container-custom">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Explore More {parentName} Options
        </h2>
        <div className="flex flex-wrap gap-3">
          {/* Parent link */}
          <Link
            href={`/${parentSlug}/${locationSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            ← All {parentName}
          </Link>

          {/* Sibling links */}
          {filtered.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}/${locationSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
