'use client';

import { useEffect, useState } from 'react';
import { List, ChevronDown } from 'lucide-react';
import { HeadingMatch, extractHeadings } from '@/lib/markdown';

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<HeadingMatch[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(true);

  // Build the TOC from the post content
  useEffect(() => {
    setToc(extractHeadings(content));
  }, [content]);

  // Scroll-spy: highlight the heading currently at the top of the viewport.
  // Only considers headings that exist in the TOC — ignores other page headings
  // (e.g. "Continue Exploring", "Explore Our Services") which broke the old logic.
  useEffect(() => {
    if (toc.length === 0) return;

    const onScroll = () => {
      const offset = 140; // clears the fixed header
      let current = '';
      for (const item of toc) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 1) {
          current = item.id;
        } else {
          break;
        }
      }
      // Before the first heading is reached, keep the first item highlighted
      if (!current && toc[0]) current = toc[0].id;
      setActiveId(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [toc]);

  if (toc.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 140;
      const topPosition =
        element.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: topPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="block rounded-2xl bg-white border border-[#d1fae5]/60 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-[#f7f9fb]"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#545f73]">
          <List size={16} className="text-[#10b981]" />
          Table of Contents
        </span>
        <ChevronDown
          size={18}
          className={`text-[#545f73] transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {/* Collapsible list */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-1 px-4 pb-4 pt-1">
            {toc.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${Math.max(item.level - 2, 0) * 12}px` }}
              >
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={`text-left text-sm w-full border-l-2 pl-3 py-1.5 transition-all ${
                    activeId === item.id
                      ? 'text-[#047857] font-bold border-[#10b981]'
                      : 'text-[#545f73] border-transparent hover:text-[#047857] hover:border-[#d1fae5]'
                  }`}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
