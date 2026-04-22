export type SectionId = 'hero' | 'services' | 'routes' | 'locations' | 'seo_content' | 'faq';

export interface SectionConfig {
  id: string; // SectionId for built-ins, 'custom_<timestamp>' for custom sections
  label: string;
  visible: boolean;
  order: number;
  canHide: boolean;
  content?: string; // custom HTML content for this section (from Tiptap editor)
  isCustom?: boolean;
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero',        label: 'Hero Banner',        visible: true, order: 0, canHide: false },
  { id: 'services',    label: 'Services Grid',       visible: true, order: 1, canHide: true  },
  { id: 'routes',      label: 'Popular Routes',      visible: true, order: 2, canHide: true  },
  { id: 'locations',   label: 'Nearby Locations',    visible: true, order: 3, canHide: true  },
  { id: 'seo_content', label: 'SEO Content & Stats', visible: true, order: 4, canHide: true  },
  { id: 'faq',         label: 'FAQ',                 visible: true, order: 5, canHide: true  },
];

export const SECTION_CONTENT_HINTS: Record<SectionId, string> = {
  hero:        'Extra text shown below the hero description. Good for city-specific offers or announcements.',
  services:    'Show or hide individual services for this city. Hidden services won\'t appear in the services grid.',
  routes:      'Intro text shown above the popular routes list. Describe key destinations from this city.',
  locations:   'Intro text shown above the nearby locations grid. Describe coverage in the state.',
  seo_content: 'Replaces the auto-generated SEO intro paragraph. Write city-specific SEO content here.',
  faq:         'Add or edit FAQ items. Each item has a Question and an Answer. These replace the default FAQs on the page.',
};

/** Parse JSON from DB; fall back to defaults for any missing sections. */
export function parseSectionsConfig(raw: string | null | undefined): SectionConfig[] {
  if (!raw) return DEFAULT_SECTIONS;
  try {
    const parsed: SectionConfig[] = JSON.parse(raw);
    const ids = parsed.map((s) => s.id);
    const missing = DEFAULT_SECTIONS
      .filter((d) => !ids.includes(d.id))
      .map((s) => ({ ...s, order: parsed.length + s.order }));
    return [...parsed, ...missing].sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_SECTIONS;
  }
}
