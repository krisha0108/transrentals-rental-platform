'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PaginationMeta } from '@/types/blog';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  meta: PaginationMeta;
  basePath: string;
}

function PaginationInner({ meta, basePath }: PaginationProps) {
  const searchParams = useSearchParams();
  const { currentPage, totalPages, hasPrevPage, hasNextPage } = meta;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${basePath}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    const halfShow = Math.floor(showPages / 2);

    let startPage = Math.max(1, currentPage - halfShow);
    let endPage = Math.min(totalPages, currentPage + halfShow);

    if (currentPage <= halfShow) {
      endPage = Math.min(totalPages, showPages);
    }

    if (currentPage > totalPages - halfShow) {
      startPage = Math.max(1, totalPages - showPages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-12"
      aria-label="Pagination"
    >
      <Link
        href={createPageUrl(currentPage - 1)}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-colors ${
          !hasPrevPage
            ? 'border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        aria-disabled={!hasPrevPage}
      >
        <ChevronLeft size={18} />
        <span className="hidden sm:inline">Previous</span>
      </Link>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500"
              >
                ...
              </span>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <Link
              key={pageNumber}
              href={createPageUrl(pageNumber)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNumber}
            </Link>
          );
        })}
      </div>

      <Link
        href={createPageUrl(currentPage + 1)}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg border transition-colors ${
          !hasNextPage
            ? 'border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        aria-disabled={!hasNextPage}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={18} />
      </Link>
    </nav>
  );
}

// Wrap in Suspense for Next.js 14 static generation
export function Pagination({ meta, basePath }: PaginationProps) {
  return (
    <Suspense fallback={<div className="flex justify-center mt-12"><div className="animate-pulse h-10 w-64 bg-gray-200 rounded-lg"></div></div>}>
      <PaginationInner meta={meta} basePath={basePath} />
    </Suspense>
  );
}
