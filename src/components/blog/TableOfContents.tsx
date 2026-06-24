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

  useEffect(() => {
    setToc(extractHeadings(content));

    // Scroll spy for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    // Observe all headings
    const headingElements = document.querySelectorAll('h2, h3');
    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [content]);

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
