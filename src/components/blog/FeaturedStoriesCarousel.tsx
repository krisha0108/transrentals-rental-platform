'use client';

import Link from 'next/link';
import type { BlogPost } from '@/types/blog';

/**
 * Editorial "Featured Stories" horizontal carousel — full-image cards with a
 * frosted-glass info panel overlay, plus prev/next controls. UI only.
 */
export function FeaturedStoriesCarousel({ posts }: { posts: BlogPost[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#047857]">Featured Stories</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#191c1e] mt-2">The highlights of this month&apos;s travels.</h2>
        </div>
      </div>

      <div
        className="flex gap-6 overflow-x-auto pb-6 snap-x justify-start lg:justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/blog/${p.slug}`}
            className="group relative shrink-0 w-[82vw] sm:w-[400px] h-[400px] rounded-xl overflow-hidden shadow-xl snap-start"
          >
            {p.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.featuredImage}
                alt={p.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${p.category?.color || '#047857'} 0%, ${p.category?.color || '#047857'}99 100%)` }}
              >
                <span className="text-[140px] opacity-20">{p.category?.icon || '📝'}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute bottom-6 left-4 right-4 p-4 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857] mb-1.5 block">
                {p.category?.name}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#191c1e] mb-1.5 line-clamp-2">{p.title}</h3>
              <p className="text-xs text-[#5a6172] line-clamp-2">{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
