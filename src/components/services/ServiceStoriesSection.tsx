'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Play, Zap } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  coverImageSquare: string | null;
  publisherName: string | null;
  category: string | null;
  slideCount?: number;
}

function StoryCard({ story }: { story: Story }) {
  const cover = story.coverImageSquare || story.coverImage;
  return (
    <Link href={`/stories/${story.slug}`} className="flex-shrink-0 group" style={{ width: 148 }}>
      <div
        className="relative rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl group-hover:shadow-[#09B368]/20 transition-all duration-300 group-hover:scale-[1.04]"
        style={{ aspectRatio: '9/16' }}
      >
        {cover ? (
          <img src={cover} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#09B368] to-[#065f35] flex items-center justify-center">
            <Play className="w-8 h-8 text-white/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {story.category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 bg-[#09B368]/80 backdrop-blur-sm text-white text-[9px] font-bold rounded-full uppercase tracking-wide">
              {story.category}
            </span>
          </div>
        )}

        {story.slideCount != null && (
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 bg-black/50 backdrop-blur-sm text-white/80 text-[9px] font-medium rounded-full">
              {story.slideCount}▶
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          {story.publisherName && (
            <p className="text-white/50 text-[10px] truncate mb-1">{story.publisherName}</p>
          )}
          <h3 className="text-white text-[11px] font-bold leading-tight line-clamp-2">{story.title}</h3>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-11 h-11 bg-[#09B368]/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-[#09B368]/40 border border-white/20">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 rounded-2xl overflow-hidden bg-white/5 animate-pulse" style={{ width: 148, aspectRatio: '9/16' }} />
  );
}

export function ServiceStoriesSection() {
  const pathname = usePathname();
  const parts = (pathname || '').split('/').filter(Boolean);
  const serviceSlug = parts[0] || '';
  const locationSlug = parts[1] && parts[1] !== 'book' ? parts[1] : '';

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (serviceSlug) params.set('service', serviceSlug);
    if (locationSlug) params.set('location', locationSlug);

    fetch(`/api/web-stories?${params}`)
      .then(r => r.json())
      .then(d => setStories(d.stories?.slice(0, 12) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [serviceSlug, locationSlug]);

  if (!loading && stories.length === 0) return null;

  return (
    <section className="relative py-10 overflow-hidden bg-gradient-to-br from-[#022c1a] via-[#043d24] to-[#022c1a]">
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/3 w-64 h-64 bg-[#09B368]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#09B368]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#09B368]/15 border border-[#09B368]/30 rounded-full mb-3">
              <Zap className="w-3 h-3 text-[#09B368]" />
              <span className="text-[11px] font-semibold text-[#09B368] uppercase tracking-widest">Web Stories</span>
              <div className="w-1.5 h-1.5 bg-[#09B368] rounded-full animate-pulse" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Visual Stories</h2>
            <p className="text-white/40 text-sm mt-1">Tap through immersive travel stories</p>
          </div>
          <Link
            href="/stories"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#09B368]/15 hover:bg-[#09B368]/25 border border-[#09B368]/30 text-[#09B368] text-sm font-semibold rounded-full transition-all group"
          >
            View all
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : stories.map(s => <StoryCard key={s.id} story={s} />)
          }
        </div>

        <div className="sm:hidden mt-5 text-center">
          <Link href="/stories" className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#09B368]/15 border border-[#09B368]/30 text-[#09B368] text-sm font-semibold rounded-full">
            View all stories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
