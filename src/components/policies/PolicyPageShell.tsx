'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PolicySection {
  title: string;
  content: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface PolicyPageShellProps {
  title: string;
  tagline: string;
  intro: string;
  sections: PolicySection[];
  aside?: ReactNode;
  lastUpdated?: string;
  sectionsContainerClassName?: string;
}

export function PolicyPageShell({
  title,
  tagline,
  intro,
  sections,
  aside,
  lastUpdated,
  sectionsContainerClassName,
}: PolicyPageShellProps) {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(
    () => {
      const initialState: Record<number, boolean> = {};
      sections.forEach((section, index) => {
        initialState[index] = section.collapsible
          ? Boolean(section.defaultOpen)
          : true;
      });
      return initialState;
    }
  );

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        <header className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em]">
            {tagline}
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
            {intro}
          </p>
          {lastUpdated && (
            <p className="mt-4 text-xs uppercase text-slate-400 tracking-[0.2em]">
              Last updated {lastUpdated}
            </p>
          )}
        </header>

        <section className="grid gap-8 lg:grid-cols-[3fr,1fr]">
          <div className={sectionsContainerClassName ?? 'space-y-10'}>
            {sections.map((section, index) => {
              const isCollapsible = section.collapsible ?? false;
              const isOpen = openSections[index] ?? !isCollapsible;
              const showContent = !isCollapsible || isOpen;

              return (
                <article
                  key={`${section.title}-${index}`}
                  className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4"
                >
                  {isCollapsible ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(index)}
                      className="flex w-full items-center justify-between text-left"
                      aria-expanded={Boolean(isOpen)}
                    >
                      <h2 className="text-xl font-semibold text-slate-900">
                        {section.title}
                      </h2>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-slate-500 transition-transform duration-200',
                          isOpen ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                  ) : (
                    <h2 className="text-xl font-semibold text-slate-900">
                      {section.title}
                    </h2>
                  )}

                  {showContent && (
                    <div className="text-sm text-slate-600 space-y-3">
                      {section.content}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {aside && (
            <aside className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Quick facts
                </h3>
                <div className="text-sm text-slate-600 space-y-2">{aside}</div>
              </div>
            </aside>
          )}
        </section>
      </div>
    </div>
  );
}
