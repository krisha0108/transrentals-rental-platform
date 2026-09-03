'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Zap,
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Lightbulb,
  Sparkles,
  Landmark,
  Flower2,
  MapPin,
  Map as MapIcon,
  Tag,
  Compass,
  BookOpen,
} from 'lucide-react';

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

const SPACING = 235;
const CAROUSEL_HEIGHT = 440;

// One muted accent color per category — used only for the small icon glyph
// and dot, never as a loud fill, so the cards read as one consistent,
// professional set rather than a rainbow of category colors.
const CATEGORY_STYLES = [
  { match: 'tip', color: 'text-blue-600', dot: 'bg-blue-500', icon: Lightbulb },
  { match: 'festival', color: 'text-purple-600', dot: 'bg-purple-500', icon: Sparkles },
  { match: 'cultur', color: 'text-emerald-600', dot: 'bg-emerald-500', icon: Landmark },
  { match: 'spiritual', color: 'text-orange-600', dot: 'bg-orange-500', icon: Flower2 },
  { match: 'pilgrim', color: 'text-orange-600', dot: 'bg-orange-500', icon: Flower2 },
  { match: 'destination', color: 'text-teal-600', dot: 'bg-teal-500', icon: MapPin },
  { match: 'guide', color: 'text-cyan-600', dot: 'bg-cyan-500', icon: MapIcon },
  { match: 'deal', color: 'text-pink-600', dot: 'bg-pink-500', icon: Tag },
  { match: 'experience', color: 'text-indigo-600', dot: 'bg-indigo-500', icon: Compass },
  { match: 'travel', color: 'text-sky-600', dot: 'bg-sky-500', icon: Compass },
];

function getCategoryStyle(category: string | null) {
  const key = (category || '').toLowerCase();
  const found = CATEGORY_STYLES.find((c) => key.includes(c.match));
  return found || { color: 'text-slate-600', dot: 'bg-slate-400', icon: BookOpen };
}

// Shortest signed offset between two indices on a circular track — lets the
// carousel wrap around infinitely instead of dead-ending at the first/last
// card, while every story keeps its own identity (key) as it moves.
function wrappedOffset(index: number, centerIndex: number, length: number) {
  if (length === 0) return index - centerIndex;
  let diff = (index - centerIndex) % length;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

function StoryCard({
  story,
  offset,
  onSelect,
  dragDeltaX = 0,
}: {
  story: Story;
  offset: number;
  onSelect: () => void;
  dragDeltaX?: number;
}) {
  const isCenter = offset === 0;
  const cover = story.coverImageSquare || story.coverImage;
  const { color, dot, icon: CategoryIcon } = getCategoryStyle(story.category);
  const Icon = isCenter ? Bookmark : CategoryIcon;

  const width = isCenter ? 260 : 220;
  const imageHeight = isCenter ? 300 : 250;
  const dist = Math.abs(offset);

  const content = (
    <div
      className={`relative rounded-2xl overflow-hidden bg-white transition-shadow duration-300 ${
        isCenter ? 'shadow-2xl shadow-black/20' : 'shadow-md hover:shadow-lg'
      }`}
      style={{ width }}
    >
      <div className="relative" style={{ height: imageHeight }}>
        {cover ? (
          <Image src={cover} alt={story.title} fill sizes="260px" loading="lazy" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-emerald-700 to-emerald-900" />
        )}

        {story.category && (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {story.category}
          </span>
        )}
        <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-semibold text-slate-700">
          <Clock className="w-3 h-3" />
          {(story.slideCount || 4) + 1} min
        </span>
      </div>

      <div className="relative -mt-6 rounded-t-2xl bg-white pt-8 px-4 pb-4">
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white ring-1 ring-slate-100 flex items-center justify-center shadow-md">
          <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
        </span>
        <h3 className={`font-bold text-slate-900 leading-snug line-clamp-3 ${isCenter ? 'text-base' : 'text-sm'}`}>
          {story.title}
        </h3>
        <span className="mt-2 inline-flex items-center gap-1 text-emerald-600 text-sm font-semibold">
          Read Story
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );

  return (
    <motion.div
      className="absolute top-0 left-1/2"
      style={{ marginLeft: -width / 2 }}
      animate={{
        x: offset * SPACING + dragDeltaX * 0.5,
        scale: isCenter ? 1 : 0.94,
        opacity: 1,
        zIndex: 20 - dist,
      }}
      transition={dragDeltaX !== 0 ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
    >
      {isCenter ? (
        <Link href={`/stories/${story.slug}`}>{content}</Link>
      ) : (
        <button type="button" onClick={onSelect} className="block cursor-pointer">
          {content}
        </button>
      )}
    </motion.div>
  );
}

export function StoriesStrip() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [centerIndex, setCenterIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch('/api/web-stories', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        const list = d.stories?.slice(0, 20) || [];
        setStories(list);
        setCenterIndex(0);
      })
      .catch(() => {})
      .finally(() => { clearTimeout(timer); setLoading(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  const categories = useMemo(() => {
    const seen = new Map<string, number>();
    for (const s of stories) {
      if (!s.category) continue;
      seen.set(s.category, (seen.get(s.category) || 0) + 1);
    }
    return Array.from(seen.keys()).slice(0, 6);
  }, [stories]);

  const visibleStories = useMemo(
    () => (activeCategory ? stories.filter((s) => s.category === activeCategory) : stories),
    [stories, activeCategory]
  );

  const goPrev = () => setCenterIndex((prev) => {
    const len = visibleStories.length || 1;
    return (prev - 1 + len) % len;
  });
  const goNext = () => setCenterIndex((prev) => {
    const len = visibleStories.length || 1;
    return (prev + 1) % len;
  });

  // Drag-to-change: mouse or touch, in either direction. `draggedRef` marks
  // a gesture that actually moved (past a tiny jitter threshold) so the
  // click-capture handler below can swallow the click that follows a drag
  // release — otherwise dragging over the center card would also navigate
  // to it via its <Link>.
  const dragStartXRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const DRAG_THRESHOLD = 50;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = e.clientX;
    draggedRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) return;
    const delta = e.clientX - dragStartXRef.current;
    // A real click/tap almost never lands at exactly 0px of movement —
    // mouse and (especially) touch input naturally jitter a few pixels
    // between pointerdown and pointerup. At 6px that jitter alone was
    // enough to get misclassified as a drag, which then preventDefault/
    // stopPropagation'd the click and silently ate the "Read Story" tap
    // on the center card's <Link>. 15px still catches real drags quickly.
    if (Math.abs(delta) > 15) draggedRef.current = true;
    setDragDeltaX(Math.max(-160, Math.min(160, delta)));
  };
  const endDrag = (commit: boolean) => {
    if (commit && draggedRef.current) {
      if (dragDeltaX <= -DRAG_THRESHOLD) goNext();
      else if (dragDeltaX >= DRAG_THRESHOLD) goPrev();
    }
    dragStartXRef.current = null;
    setDragging(false);
    setDragDeltaX(0);
  };
  const handlePointerUp = () => endDrag(true);
  const handlePointerCancel = () => endDrag(false);
  const handleTrackClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  };

  if (!loading && stories.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0">
        <Image
          src="/images/sections/visual-stories-bg-light.png"
          alt=""
          fill
          loading="lazy"
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-emerald-50/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Web Stories</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight">
                <span className="text-slate-900">Visual </span>
                <span className="text-emerald-600">Stories</span>
              </h2>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">
                Real journeys. Inspiring places. Stories that stay with you.
              </p>
            </div>
          </div>

          <Link
            href="/stories"
            className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow group"
          >
            Explore all stories
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous story"
            className="hidden sm:flex absolute left-0 top-[125px] -translate-x-4 z-30 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next story"
            className="hidden sm:flex absolute right-0 top-[125px] translate-x-4 z-30 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>

          <div
            className={`relative mx-auto overflow-hidden select-none touch-pan-y ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ height: CAROUSEL_HEIGHT, maxWidth: 1180 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={dragStartXRef.current !== null ? handlePointerCancel : undefined}
            onClickCapture={handleTrackClickCapture}
            onDragStart={(e) => e.preventDefault()}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-1/2 rounded-2xl bg-slate-200/60 animate-pulse"
                    style={{
                      width: i === 2 ? 260 : 220,
                      height: i === 2 ? 380 : 330,
                      marginLeft: (i === 2 ? -130 : -110) + (i - 2) * SPACING,
                    }}
                  />
                ))
              : visibleStories.map((story, i) => {
                  const offset = wrappedOffset(i, centerIndex, visibleStories.length);
                  return (
                    <StoryCard key={story.id} story={story} offset={offset} onSelect={() => setCenterIndex(i)} dragDeltaX={dragDeltaX} />
                  );
                })}
          </div>

          {/* Dot pagination */}
          {!loading && visibleStories.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {visibleStories.map((story, i) => (
                <button
                  key={story.id}
                  type="button"
                  aria-label={`Go to story ${i + 1}`}
                  onClick={() => setCenterIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === centerIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Category filter chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === null ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const { icon: CatIcon } = getCategoryStyle(category);
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(active ? null : category);
                    setCenterIndex(0);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    active ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  <CatIcon className="w-4 h-4" />
                  {category}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
