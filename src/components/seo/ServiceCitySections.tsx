/**
 * Public renderer for block-based service-city content.
 *
 * Reads the sectionsConfig JSON stored in service_city_content and renders
 * each visible section in order. FAQ sections expand q/a; everything else
 * renders the stored HTML via dangerouslySetInnerHTML (TipTap output is
 * already sanitized by the editor's allowed extensions).
 *
 * Falls back to rendering nothing if sectionsConfig is missing — callers
 * should render their static fallback in that case.
 */

import { ChevronDown } from 'lucide-react';

type RawSection = {
  id: string;
  label: string;
  visible?: boolean;
  order?: number;
  content?: string;
  isCustom?: boolean;
};

type FaqItem = { q: string; a: string };

const FAQ_IDS = new Set(['faqs', 'faq']);

function parseSections(raw: string | null | undefined): RawSection[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is RawSection => !!s && typeof s.id === 'string' && typeof s.label === 'string')
      .filter((s) => s.visible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

function parseFaqs(content: string | undefined): FaqItem[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is FaqItem => x && typeof x.q === 'string' && typeof x.a === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

function hasMeaningfulContent(content: string | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  if (trimmed === '<p></p>') return false;
  return true;
}

export function ServiceCitySections({
  sectionsConfig,
  cityName,
}: {
  sectionsConfig: string | null | undefined;
  cityName?: string;
}) {
  const sections = parseSections(sectionsConfig);
  if (sections.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {sections.map((section) => {
            if (FAQ_IDS.has(section.id)) {
              const faqs = parseFaqs(section.content);
              if (faqs.length === 0) return null;
              return (
                <div key={section.id} className="mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                    {section.label}
                  </h2>
                  <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                      <details
                        key={idx}
                        className="bg-white rounded-lg border border-gray-200 group"
                      >
                        <summary className="flex items-center justify-between cursor-pointer list-none px-4 py-3 font-medium text-gray-900">
                          {faq.q}
                          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              );
            }

            if (!hasMeaningfulContent(section.content)) return null;

            return (
              <div key={section.id} className="mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {section.label}
                </h2>
                <div
                  className="prose prose-lg max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: section.content! }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function hasSectionsContent(sectionsConfig: string | null | undefined): boolean {
  const sections = parseSections(sectionsConfig);
  return sections.some((s) => {
    if (FAQ_IDS.has(s.id)) return parseFaqs(s.content).length > 0;
    return hasMeaningfulContent(s.content);
  });
}
