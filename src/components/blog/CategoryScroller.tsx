'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/types/blog';

const SCROLL_STEP = 320;

interface CategoryScrollerProps {
  categories: Category[];
}

export function CategoryScroller({ categories }: CategoryScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateControls = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateControls)
        : null;

    resizeObserver?.observe(el);
    el.addEventListener('scroll', updateControls);
    updateControls();
    window.addEventListener('resize', updateControls);

    return () => {
      resizeObserver?.disconnect();
      el.removeEventListener('scroll', updateControls);
      window.removeEventListener('resize', updateControls);
    };
  }, [categories]);

  const handleScroll = (offset: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-3 min-w-min py-2 pl-12 pr-12 overflow-x-auto scroll-smooth category-scrollbar"
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="flex items-center whitespace-nowrap rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
              aria-label={`View ${category.name} stories`}
            >
              {category.icon && <span className="text-lg leading-none">{category.icon}</span>}
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => handleScroll(-SCROLL_STEP)}
        disabled={!canScrollLeft}
        className="group absolute -left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 shadow-sm transition-opacity disabled:opacity-50 disabled:pointer-events-none disabled:border-gray-200"
      >
        <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-emerald-600" />
      </button>

      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => handleScroll(SCROLL_STEP)}
        disabled={!canScrollRight}
        className="group absolute -right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 shadow-sm transition-opacity disabled:opacity-50 disabled:pointer-events-none disabled:border-gray-200"
      >
        <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-emerald-600" />
      </button>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-white/0" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-white/0" />
    </div>
  );
}
