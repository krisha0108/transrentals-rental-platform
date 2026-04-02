'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Zap, ArrowRight } from 'lucide-react';

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
    <Link href={`/stories/${story.slug}`} className="flex-shrink-0 group" style={{ width: 200 }}>
      <div
        className="relative rounded-3xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-black/40 transition-all duration-300 group-hover:scale-[1.03] group-hover:-translate-y-1"
        style={{ aspectRatio: '9/16' }}
      >
        {cover ? (
          <img src={cover} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#09B368] via-[#065f35] to-[#022c1a] flex items-center justify-center">
            <Play className="w-10 h-10 text-white/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {story.category ? (
            <span className="px-2.5 py-1 bg-[#09B368] text-white text-[10px] font-bold rounded-full uppercase tracking-wide shadow-lg">
              {story.category}
            </span>
          ) : <span />}
          {story.slideCount != null && (
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-semibold rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
              {story.slideCount}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          {story.publisherName && (
            <p className="text-white/50 text-[11px] truncate mb-1.5">{story.publisherName}</p>
          )}
          <h3 className="text-white text-sm font-bold leading-snug line-clamp-2">{story.title}</h3>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-16 h-16 bg-[#09B368] rounded-full flex items-center justify-center shadow-2xl shadow-[#09B368]/50 border-2 border-white/20 scale-90 group-hover:scale-100 transition-transform duration-300">
            <div className="w-0 h-0 border-t-[9px] border-t-transparent border-l-[16px] border-l-white border-b-[9px] border-b-transparent ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 rounded-3xl overflow-hidden bg-white/5 animate-pulse" style={{ width: 200, aspectRatio: '9/16' }} />
  );
}

export function StoriesStrip() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/web-stories')
      .then(r => r.json())
      .then(d => setStories(d.stories?.slice(0, 12) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && stories.length === 0) return null;

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #011a10 0%, #043d24 40%, #022c1a 100%)' }}>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#09B368]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#09B368]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09B368]/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#09B368]/20 border border-[#09B368]/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-[#09B368]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[#09B368] text-xs font-bold uppercase tracking-widest">Web Stories</span>
                <span className="w-1.5 h-1.5 bg-[#09B368] rounded-full animate-pulse" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Visual Stories</h2>
            </div>
          </div>

          <Link
            href="/stories"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#09B368] hover:bg-[#078F53] text-white text-sm font-semibold rounded-full transition-all shadow-lg shadow-[#09B368]/20 group"
          >
            View all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : stories.map(s => <StoryCard key={s.id} story={s} />)
          }

          {!loading && stories.length > 0 && (
            <Link
              href="/stories"
              className="flex-shrink-0 rounded-3xl border-2 border-dashed border-[#09B368]/30 hover:border-[#09B368]/60 flex flex-col items-center justify-center gap-3 transition-all group hover:bg-[#09B368]/5"
              style={{ width: 200, aspectRatio: '9/16' }}
            >
              <div className="w-12 h-12 bg-[#09B368]/15 rounded-full flex items-center justify-center group-hover:bg-[#09B368]/25 transition-colors">
                <ArrowRight className="w-5 h-5 text-[#09B368]" />
              </div>
              <span className="text-[#09B368] text-sm font-semibold text-center px-4">View all stories</span>
            </Link>
          )}
        </div>

        <div className="sm:hidden mt-5 text-center">
          <Link href="/stories" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#09B368] text-white text-sm font-semibold rounded-full shadow-lg shadow-[#09B368]/20">
            View all stories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09B368]/20 to-transparent" />
    </section>
  );
}
