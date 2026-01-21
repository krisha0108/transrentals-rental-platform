'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import { HeadingMatch, extractHeadings } from '@/lib/markdown';

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<HeadingMatch[]>([]);
  const [activeId, setActiveId] = useState<string>('');

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
    <nav className="hidden lg:block sticky top-36">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-white p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <List size={20} className="text-emerald-600" />
            Table of Contents
          </h3>
        </div>
        <div className="p-4">
          <ul className="space-y-1">
            {toc.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${Math.max(item.level - 2, 0) * 12}px` }}
              >
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={`text-left text-sm transition-colors w-full py-1 ${
                    activeId === item.id
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-600 hover:text-blue-600'
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
