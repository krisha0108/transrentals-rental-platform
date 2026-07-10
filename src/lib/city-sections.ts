export type SectionId = 'hero' | 'services' | 'routes' | 'things_to_do' | 'locations' | 'seo_content' | 'faq';

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
  { id: 'things_to_do', label: 'Things to Do',       visible: true, order: 3, canHide: true  },
  { id: 'locations',   label: 'Nearby Locations',    visible: true, order: 4, canHide: true  },
  { id: 'seo_content', label: 'SEO Content & Stats', visible: true, order: 5, canHide: true  },
  { id: 'faq',         label: 'FAQ',                 visible: true, order: 6, canHide: true  },
];

export const SECTION_CONTENT_HINTS: Record<SectionId, string> = {
  hero:         'Extra text shown below the hero description. Good for city-specific offers or announcements.',
  services:     'Show or hide individual services for this city. Hidden services won\'t appear in the services grid.',
  routes:       'Intro text shown above the popular routes list. Describe key destinations from this city.',
  things_to_do: 'Intro text shown above the attractions list. Leave blank to use the default curated list for this city.',
  locations:    'Intro text shown above the nearby locations grid. Describe coverage in the state.',
  seo_content:  'Replaces the auto-generated SEO intro paragraph. Write city-specific SEO content here.',
  faq:          'Add or edit FAQ items. Each item has a Question and an Answer. These replace the default FAQs on the page.',
};

/**
 * Parse JSON from DB; fall back to defaults for any missing sections.
 *
 * Sections introduced after a city's config was first saved (e.g. a new
 * built-in section added later) are spliced in at their natural slot —
 * right before the first already-saved section whose default order is
 * greater — rather than dumped at the end, so newly-added sections show up
 * where they're meant to even on pages with older saved configs.
 */
export function parseSectionsConfig(raw: string | null | undefined): SectionConfig[] {
  if (!raw) return DEFAULT_SECTIONS;
  try {
    const parsed: SectionConfig[] = JSON.parse(raw);
    const ids = parsed.map((s) => s.id);
    const missing = DEFAULT_SECTIONS.filter((d) => !ids.includes(d.id));
    if (!missing.length) return [...parsed].sort((a, b) => a.order - b.order);

    const merged = [...parsed];
    for (const section of missing) {
      const insertAt = merged.findIndex((s) => {
        const def = DEFAULT_SECTIONS.find((d) => d.id === s.id);
        return !!def && def.order > section.order;
      });
      if (insertAt === -1) merged.push(section);
      else merged.splice(insertAt, 0, section);
    }
    return merged.map((s, i) => ({ ...s, order: i }));
  } catch {
    return DEFAULT_SECTIONS;
  }
}
