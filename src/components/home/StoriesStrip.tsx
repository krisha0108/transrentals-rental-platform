'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, Sparkles } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  coverImageSquare: string | null;
  publisherName: string | null;
  publisherLogo: string | null;
  category: string | null;
  slideCount?: number;
}

function StoryCard({ story }: { story: Story }) {
  const cover = story.coverImageSquare || story.coverImage;
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="flex-shrink-0 group"
      style={{ width: 148 }}
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-purple-900/40 transition-all duration-300 group-hover:scale-[1.04]"
        style={{ aspectRatio: '9/16' }}
      >
        {cover ? (
          <img
            src={cover}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
            <Play className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Category */}
        {story.category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-bold rounded-full uppercase tracking-wide border border-white/10">
              {story.category}
            </span>
          </div>
        )}

        {/* Slide count */}
        {story.slideCount != null && (
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 bg-black/50 backdrop-blur-md text-white/80 text-[9px] font-medium rounded-full">
              {story.slideCount}▶
            </span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {story.publisherName && (
            <p className="text-white/50 text-[10px] truncate mb-1">{story.publisherName}</p>
          )}
          <h3 className="text-white text-[11px] font-bold leading-tight line-clamp-2">{story.title}</h3>
        </div>

        {/* Hover play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/10">
          <div className="w-11 h-11 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 shadow-lg">
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
    <section className="relative py-10 overflow-hidden bg-gradient-to-br from-[#0d0d1f] via-[#16103a] to-[#0d0d1f]">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/8 backdrop-blur-sm border border-white/10 rounded-full mb-3">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-widest">Web Stories</span>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              Visual Stories
            </h2>
            <p className="text-white/40 text-sm mt-1">Tap through immersive travel stories</p>
          </div>
          <Link
            href="/stories"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/10 text-white text-sm font-medium rounded-full transition-all backdrop-blur-sm group"
          >
            View all
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Horizontal scroll */}
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : stories.map(story => <StoryCard key={story.id} story={story} />)
          }
        </div>

        {/* Mobile see all */}
        <div className="sm:hidden mt-5 text-center">
          <Link href="/stories" className="inline-flex items-center gap-1.5 px-5 py-2 bg-white/8 border border-white/10 text-white text-sm font-medium rounded-full">
            View all stories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
