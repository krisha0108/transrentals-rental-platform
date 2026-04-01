'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Story {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  coverImageSquare: string | null;
  publisherName: string | null;
  _count?: { slides: number };
}

export function StoriesStrip() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/web-stories')
      .then(r => r.json())
      .then(d => { setStories(d.stories?.slice(0, 12) || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && stories.length === 0) return null;

  return (
    <section className="py-6 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Stories</h2>
          <Link href="/stories" className="text-sm text-[#09B368] hover:text-[#078F53] font-medium transition">
            See all
          </Link>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-14 h-2.5 rounded bg-gray-200 animate-pulse" />
                </div>
              ))
            : stories.map(story => {
                const cover = story.coverImageSquare || story.coverImage;
                return (
                  <Link
                    key={story.id}
                    href={`/stories/${story.slug}`}
                    className="flex-shrink-0 flex flex-col items-center gap-2 group"
                  >
                    <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#09B368] via-emerald-400 to-teal-300">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-white">
                        {cover ? (
                          <img
                            src={cover}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#09B368] to-teal-400 flex items-center justify-center text-white text-xl font-bold">
                            {story.title[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-600 text-center max-w-[64px] truncate leading-tight">
                      {story.title}
                    </span>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
