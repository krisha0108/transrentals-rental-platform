'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Category } from '@/types/blog';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SCROLL_OFFSET = 240;

interface PopularCategoriesScrollerProps {
  categories: Category[];
}

export function PopularCategoriesScroller({ categories }: PopularCategoriesScrollerProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(rail.scrollLeft > 8);
    setCanScrollRight(rail.scrollLeft + rail.clientWidth + 8 < rail.scrollWidth);
  }, []);

  useEffect(() => {
    updateScrollState();
    const rail = railRef.current;
    if (!rail) return undefined;

    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();

    rail.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      rail.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollState, categories.length]);

  const scrollByOffset = (offset: number) => {
    railRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const buttonBase =
    'absolute top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 transition hover:text-gray-900 disabled:text-gray-300 disabled:border-gray-200 disabled:bg-white/80';

  return (
    <div className="relative h-16">
      <div className="overflow-hidden">
        <div
          ref={railRef}
          className="flex gap-3 overflow-x-auto thin-scrollbar px-16 py-3 scroll-smooth"
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition duration-300 hover:border-emerald-300 hover:bg-white hover:text-gray-900 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <span className="text-base leading-none">{category.icon}</span>
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollByOffset(-SCROLL_OFFSET)}
        disabled={!canScrollLeft}
        className={`${buttonBase} left-0 -translate-x-1/2`}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollByOffset(SCROLL_OFFSET)}
        disabled={!canScrollRight}
        className={`${buttonBase} right-0 translate-x-1/2`}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
