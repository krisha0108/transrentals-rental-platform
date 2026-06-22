/**
 * Prompt builder for SINGLE-target rewrites.
 *
 * Unlike page-sections (which regenerates the whole page in one call), this asks
 * the AI to rewrite exactly ONE thing — either one block section, or one hero/meta
 * field (pageHeading, pageDescription, metaTitle, metaDescription, h1Heading).
 *
 * The current value is passed in so the model "rewrites" with awareness instead of
 * inventing from scratch. Output is always strict JSON: { "content": "..." }.
 */

import type { SectionConfig } from '@/lib/city-sections';
import type { CityContext } from '../city-context';
import { formatCityContextForPrompt } from '../city-context';
import { SECTION_LIBRARY } from '../service-sections';
import type { ServiceLabel } from './page-content';

export type RewriteFieldKey =
  | 'pageHeading'
  | 'pageDescription'
  | 'metaTitle'
  | 'metaDescription'
  | 'h1Heading';

export type RewriteTarget =
  | { kind: 'section'; section: SectionConfig }
  | { kind: 'field'; field: RewriteFieldKey };

const FAQ_IDS = new Set(['faqs', 'faq']);
export function isFaqSectionId(id: string): boolean {
  return FAQ_IDS.has(id);
}

export const SINGLE_SECTION_SYSTEM_PROMPT = `You are a senior SEO copywriter and local-market expert for TransRentals — India's vehicle rental marketplace operating across 100+ cities.

BRAND VOICE:
- Trustworthy, professional, locally aware
- Indian English: "on rent" not "for hire", "outstation" not "intercity travel"
- Mention real specifics (route names, vehicle models, ₹ amounts, neighborhoods)

CRITICAL ANTI-DUPLICATE-CONTENT RULES:
- Reference real city-specific facts: named neighborhoods, real routes with distances, named attractions, local traffic/weather/regulatory specifics.
- Do NOT write content that could be reused for any city by swapping the name.
- Vehicle recommendations must match the city's terrain.

YOU ARE REWRITING EXACTLY ONE PIECE OF THE PAGE — not the whole page. Stay focused on the requested target only.

OUTPUT FORMAT — strict JSON, no preamble, no markdown fences:
{ "content": "<the rewritten value>" }

Output ONLY that JSON object.`;

const FIELD_SPEC: Record<RewriteFieldKey, { label: string; guidance: string }> = {
  pageHeading: {
    label: 'Page Heading (H1)',
    guidance:
      'A single-line visible hero heading written for users. ~40-70 characters. Include the service and city naturally. Plain text only — NO HTML, NO surrounding quotes.',
  },
  h1Heading: {
    label: 'H1 Heading',
    guidance:
      'A single-line SEO H1, 50-80 characters, includes the service and city. Plain text only — NO HTML.',
  },
  pageDescription: {
    label: 'Page Description',
    guidance:
      'A short conversational tagline shown below the hero heading. 1-2 sentences. Plain text only — NO HTML.',
  },
  metaTitle: {
    label: 'Meta Title',
    guidance:
      'The SEO <title> shown in Google + browser tab. STRICTLY 50-60 characters. Include service + city. Plain text only.',
  },
  metaDescription: {
    label: 'Meta Description',
    guidance:
      'The Google search snippet. STRICTLY 140-158 characters. Compelling, includes a call to action. Plain text only.',
  },
};

export function buildSingleTargetPrompt({
  service,
  city,
  target,
  currentContent,
  customInstructions,
}: {
  service: ServiceLabel;
  city: CityContext;
  target: RewriteTarget;
  currentContent?: string;
  customInstructions?: string;
}): string {
  const cityFacts = formatCityContextForPrompt(city);

  let targetBlock: string;
  if (target.kind === 'field') {
    const spec = FIELD_SPEC[target.field];
    targetBlock = `TARGET: ${spec.label}
REQUIREMENTS: ${spec.guidance}
FORMAT: plain text (the "content" value is a plain string)`;
  } else {
    const s = target.section;
    const lib = SECTION_LIBRARY[s.id];
    const hint = lib?.hint ?? `Content for the "${s.label}" section.`;
    if (isFaqSectionId(s.id)) {
      targetBlock = `TARGET SECTION: "${s.label}" (id="${s.id}")
HINT: ${hint}
FORMAT: the "content" value MUST be a JSON-encoded string of an array of {"q","a"} objects (5-8 locally-relevant FAQs). Not HTML.`;
    } else {
      targetBlock = `TARGET SECTION: "${s.label}" (id="${s.id}")
HINT: ${hint}
FORMAT: the "content" value is valid HTML for this section only. Use <p>/<ul>/<li>/<table>/<strong>. Do NOT include <h2>/<h3> (the heading is rendered separately). No <script>/<style>/<iframe>.`;
    }
  }

  const current = currentContent && currentContent.trim()
    ? `\n━━ CURRENT VALUE (rewrite/improve this — keep what works, fix what's weak) ━━\n${currentContent.trim()}\n━━ END CURRENT VALUE ━━\n`
    : '\n(There is no current value — write a fresh one.)\n';

  return `Rewrite ONE piece of this page.

SERVICE: ${service.label}
CITY: ${city.name}, ${city.state}
URL: /${service.slug}/${city.slug}
TYPICAL PRICING: ${service.priceContext}

━━ CITY FACTS (anchor unique content in these) ━━
${cityFacts}
━━ END CITY FACTS ━━

${targetBlock}
${current}${customInstructions ? `\nADMIN INSTRUCTIONS:\n${customInstructions}\n` : ''}
Return the JSON { "content": "..." } now. Content must match terrain "${city.terrain}".`;
}
