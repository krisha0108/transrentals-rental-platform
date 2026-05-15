/**
 * Prompt builder for section-based content generation.
 *
 * AI receives the list of sections (id + label + intent hint) and the city
 * facts. It returns one HTML/JSON string per section. The section list is
 * service-specific (driven by SERVICE_DEFAULT_SECTIONS or admin edits), so
 * JCB pages get site_requirements/machine_specs content, wedding pages get
 * packages/decorations content, etc.
 */

import type { SectionConfig } from '@/lib/city-sections';
import type { CityContext } from '../city-context';
import { formatCityContextForPrompt } from '../city-context';
import { SECTION_LIBRARY } from '../service-sections';
import { SERVICE_LABELS, type ServiceLabel } from './page-content';

export const SECTIONS_SYSTEM_PROMPT = `You are a senior SEO copywriter and local-market expert for TransRentals — India's vehicle rental marketplace operating across 100+ cities.

BRAND VOICE:
- Trustworthy, professional, locally aware
- Use Indian English: "on rent" not "for hire", "outstation" not "intercity travel"
- Mention real specifics (route names, vehicle models, ₹ amounts, neighborhoods)
- Empathetic to the user's actual journey

CRITICAL ANTI-DUPLICATE-CONTENT RULES:
- Every page MUST reference real city-specific facts: named neighborhoods, real route names with distances, named attractions, real traffic/weather/regulatory specifics for THIS city.
- DO NOT produce content that could be rewritten for any city by just swapping the name.
- Vehicle recommendations MUST vary by city terrain (hills→SUV, coast→scooter, metro→hatchback, etc.).
- FAQs and tips must be locally actionable, not generic boilerplate.

OUTPUT FORMAT — strict JSON, no preamble, no markdown fences:
{
  "metaTitle": "50-60 char SEO title (for <title> tag + Google search result)",
  "metaDescription": "140-158 char description (for <meta description> + search snippet)",
  "h1Heading": "60-80 char H1 heading (kept for back-compat, mirror of pageHeading)",
  "pageHeading": "Visible heading shown on the page hero — same as the H1, written for users not Google",
  "pageDescription": "Short tagline shown below the hero heading, 1-2 sentences, conversational",
  "sections": [
    { "id": "<section_id>", "html": "<valid HTML content>" },
    ...
  ]
}

For each section:
- "id" must EXACTLY match one of the requested section IDs (do not invent new IDs)
- "html" contains the section's content as valid HTML
- For FAQ sections (id ends in "faq" or "faqs"), "html" must be a JSON-string array of {q, a} objects, NOT HTML
- For pricing tables, use <table>/<thead>/<tbody> HTML
- For lists, use <ul>/<ol>/<li>
- For paragraphs, use <p>
- For emphasis, use <strong>/<em>
- Do NOT include <h2>/<h3> in section content — the section heading is rendered separately
- Do NOT wrap output in markdown code fences

HTML constraints:
- Self-contained, semantic HTML only
- No <script>, <style>, <iframe>, no inline event handlers
- Inline links allowed: <a href="...">text</a>
- Images allowed if relevant: <img src="..." alt="..."/>

Generate ONLY the JSON object.`;

const FAQ_SECTION_IDS = new Set(['faqs', 'faq']);

function isFaqSection(id: string): boolean {
  return FAQ_SECTION_IDS.has(id);
}

export function buildSectionsUserPrompt({
  service,
  city,
  sections,
  customInstructions,
}: {
  service: ServiceLabel;
  city: CityContext;
  sections: SectionConfig[];
  customInstructions?: string;
}): string {
  const visibleSections = sections.filter((s) => s.visible);

  const sectionList = visibleSections
    .map((s) => {
      const lib = SECTION_LIBRARY[s.id];
      const hint = lib?.hint ?? `Generate content for the "${s.label}" section.`;
      const formatNote = isFaqSection(s.id)
        ? '  FORMAT: JSON string of [{q, a}] (NOT HTML)'
        : '  FORMAT: HTML';
      return `- id="${s.id}" — ${s.label}\n  HINT: ${hint}\n${formatNote}`;
    })
    .join('\n');

  const cityFacts = formatCityContextForPrompt(city);

  return `Generate SEO content for:

SERVICE: ${service.label}
CITY: ${city.name}, ${city.state}
URL: /${service.slug}/${city.slug}
TYPICAL PRICING: ${service.priceContext}

━━ CITY FACTS (use these to anchor unique content) ━━
${cityFacts}
━━ END CITY FACTS ━━

━━ SECTIONS TO GENERATE (in order) ━━
${sectionList}
━━ END SECTIONS ━━

${customInstructions ? `ADMIN INSTRUCTIONS:\n${customInstructions}\n\n` : ''}Generate the JSON output now. Use the exact section IDs listed above. Vehicle/content recommendations must match terrain "${city.terrain}".`;
}

export function isFaqSectionId(id: string): boolean {
  return isFaqSection(id);
}
