/**
 * Orchestrates SEO content generation for a (service, city) page.
 *
 * Pipeline:
 *   1. Validate service slug + load city context
 *   2. Build prompt with city facts injected
 *   3. Call DeepSeek with json_object response format
 *   4. Parse + validate JSON shape
 *   5. Return structured payload ready for upsert into service_city_content
 */

import { complete, parseJsonResponse, DeepseekError, type DeepseekUsage } from './deepseek-client';
import { buildCityContext, type CityContext } from './city-context';
import { SERVICE_LABELS, SYSTEM_PROMPT, buildUserPrompt } from './prompts/page-content';
import {
  SECTIONS_SYSTEM_PROMPT,
  buildSectionsUserPrompt,
  isFaqSectionId,
} from './prompts/page-sections';
import {
  SINGLE_SECTION_SYSTEM_PROMPT,
  buildSingleTargetPrompt,
  type RewriteTarget,
} from './prompts/single-section';
import { getDefaultSectionsForService } from './service-sections';
import type { SectionConfig } from '@/lib/city-sections';

export type GeneratedContent = {
  intro: string;
  whyChooseUs: Array<{ title: string; description: string }>;
  popularVehicles: Array<{ category: string; models: string; priceRange: string; bestFor: string }>;
  servicesOffered: Array<{ name: string; description: string }>;
  faqs: Array<{ q: string; a: string }>;
  tips: string[];
  metaTitle: string;
  metaDescription: string;
  h1Heading: string;
};

export type GenerateOptions = {
  serviceSlug: string;
  citySlug: string;
  customInstructions?: string;
  temperature?: number;
  cityNameFallback?: string;
};

export type GenerateResult = {
  content: GeneratedContent;
  usage: DeepseekUsage;
  model: string;
  promptUsed: string;
  cityContext: CityContext;
};

export class GenerateError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'GenerateError';
  }
}

function validateContent(raw: unknown): GeneratedContent {
  if (!raw || typeof raw !== 'object') {
    throw new GenerateError('AI returned non-object payload');
  }
  const r = raw as Record<string, unknown>;

  const requireString = (key: string): string => {
    const v = r[key];
    if (typeof v !== 'string' || v.trim() === '') {
      throw new GenerateError(`Missing or empty string field: ${key}`);
    }
    return v;
  };

  const requireArray = <T>(key: string, validate: (x: unknown) => T): T[] => {
    const v = r[key];
    if (!Array.isArray(v) || v.length === 0) {
      throw new GenerateError(`Missing or empty array field: ${key}`);
    }
    return v.map(validate);
  };

  const titleDesc = (x: unknown): { title: string; description: string } => {
    const o = x as any;
    if (!o?.title || !o?.description) throw new GenerateError('Item missing title/description');
    return { title: String(o.title), description: String(o.description) };
  };

  const vehicle = (x: unknown): GeneratedContent['popularVehicles'][number] => {
    const o = x as any;
    if (!o?.category || !o?.models) throw new GenerateError('Vehicle missing category/models');
    return {
      category: String(o.category),
      models: String(o.models),
      priceRange: String(o.priceRange ?? ''),
      bestFor: String(o.bestFor ?? ''),
    };
  };

  const service = (x: unknown): { name: string; description: string } => {
    const o = x as any;
    if (!o?.name || !o?.description) throw new GenerateError('Service missing name/description');
    return { name: String(o.name), description: String(o.description) };
  };

  const faq = (x: unknown): { q: string; a: string } => {
    const o = x as any;
    if (!o?.q || !o?.a) throw new GenerateError('FAQ missing q/a');
    return { q: String(o.q), a: String(o.a) };
  };

  return {
    intro: requireString('intro'),
    whyChooseUs: requireArray('whyChooseUs', titleDesc),
    popularVehicles: requireArray('popularVehicles', vehicle),
    servicesOffered: requireArray('servicesOffered', service),
    faqs: requireArray('faqs', faq),
    tips: requireArray('tips', (x) => String(x)),
    metaTitle: requireString('metaTitle'),
    metaDescription: requireString('metaDescription'),
    h1Heading: requireString('h1Heading'),
  };
}

export async function generatePageContent(opts: GenerateOptions): Promise<GenerateResult> {
  const service = SERVICE_LABELS[opts.serviceSlug];
  if (!service) {
    throw new GenerateError(
      `Unknown serviceSlug "${opts.serviceSlug}". Known: ${Object.keys(SERVICE_LABELS).join(', ')}`,
    );
  }

  const cityContext = buildCityContext(
    opts.citySlug,
    opts.cityNameFallback ? { name: opts.cityNameFallback } : undefined,
  );
  if (!cityContext) {
    throw new GenerateError(`Unknown citySlug "${opts.citySlug}" — not in indian-cities.ts`);
  }

  const userPrompt = buildUserPrompt({
    service,
    city: cityContext,
    customInstructions: opts.customInstructions,
  });

  let response;
  try {
    response = await complete({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: opts.temperature ?? 0.7,
      maxTokens: 4096,
      responseFormat: 'json_object',
    });
  } catch (err) {
    if (err instanceof DeepseekError) {
      throw new GenerateError(`DeepSeek API failed: ${err.message}`, err);
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(response.content);
  } catch (err) {
    throw new GenerateError(`Failed to parse AI JSON output: ${(err as Error).message}`, err);
  }

  const content = validateContent(parsed);

  return {
    content,
    usage: response.usage,
    model: response.model,
    promptUsed: userPrompt,
    cityContext,
  };
}

export function contentToDbFields(content: GeneratedContent) {
  return {
    intro: content.intro,
    whyChooseUs: JSON.stringify(content.whyChooseUs),
    popularVehicles: JSON.stringify(content.popularVehicles),
    servicesOffered: JSON.stringify(content.servicesOffered),
    faqs: JSON.stringify(content.faqs),
    tips: JSON.stringify(content.tips),
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription,
    h1Heading: content.h1Heading,
  };
}

// ─── Section-based generation (block model) ────────────────────────────────────

export type GeneratedSection = {
  id: string;
  html: string;
};

export type GeneratedSectionPayload = {
  metaTitle: string;
  metaDescription: string;
  h1Heading: string;
  pageHeading?: string;
  pageDescription?: string;
  sections: GeneratedSection[];
};

export type GenerateSectionsOptions = {
  serviceSlug: string;
  citySlug: string;
  /** If omitted, defaults from SERVICE_DEFAULT_SECTIONS for this service. */
  sections?: SectionConfig[];
  customInstructions?: string;
  temperature?: number;
  cityNameFallback?: string;
};

export type GenerateSectionsResult = {
  payload: GeneratedSectionPayload;
  /** Final SectionConfig[] ready to upsert as sectionsConfig (content filled in). */
  sectionsConfig: SectionConfig[];
  usage: DeepseekUsage;
  model: string;
  promptUsed: string;
  cityContext: CityContext;
};

function validateSectionsPayload(raw: unknown): GeneratedSectionPayload {
  if (!raw || typeof raw !== 'object') {
    throw new GenerateError('AI returned non-object payload');
  }
  const r = raw as Record<string, unknown>;
  const reqStr = (k: string) => {
    const v = r[k];
    if (typeof v !== 'string' || v.trim() === '') {
      throw new GenerateError(`Missing or empty field: ${k}`);
    }
    return v;
  };
  if (!Array.isArray(r.sections) || r.sections.length === 0) {
    throw new GenerateError('Missing or empty sections array');
  }
  const sections: GeneratedSection[] = r.sections.map((s: any, idx: number) => {
    if (!s?.id || typeof s.id !== 'string') {
      throw new GenerateError(`Section ${idx}: missing id`);
    }
    if (typeof s.html !== 'string') {
      throw new GenerateError(`Section ${idx} (${s.id}): missing html`);
    }
    return { id: s.id, html: s.html };
  });

  const optStr = (k: string): string | undefined => {
    const v = r[k];
    return typeof v === 'string' && v.trim() !== '' ? v : undefined;
  };

  return {
    metaTitle: reqStr('metaTitle'),
    metaDescription: reqStr('metaDescription'),
    h1Heading: reqStr('h1Heading'),
    pageHeading: optStr('pageHeading'),
    pageDescription: optStr('pageDescription'),
    sections,
  };
}

/**
 * Generate AI content per section.
 *
 * Returns both the raw payload from AI and a ready-to-save SectionConfig[]
 * (input sections with `content` filled in from AI output).
 */
export async function generateSectionsContent(
  opts: GenerateSectionsOptions,
): Promise<GenerateSectionsResult> {
  const service = SERVICE_LABELS[opts.serviceSlug];
  if (!service) {
    throw new GenerateError(
      `Unknown serviceSlug "${opts.serviceSlug}". Known: ${Object.keys(SERVICE_LABELS).join(', ')}`,
    );
  }

  const cityContext = buildCityContext(
    opts.citySlug,
    opts.cityNameFallback ? { name: opts.cityNameFallback } : undefined,
  );
  if (!cityContext) {
    throw new GenerateError(`Unknown citySlug "${opts.citySlug}" — not in indian-cities.ts`);
  }

  const sections = opts.sections && opts.sections.length > 0
    ? opts.sections
    : getDefaultSectionsForService(opts.serviceSlug);

  const userPrompt = buildSectionsUserPrompt({
    service,
    city: cityContext,
    sections,
    customInstructions: opts.customInstructions,
  });

  let response;
  try {
    response = await complete({
      messages: [
        { role: 'system', content: SECTIONS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: opts.temperature ?? 0.7,
      maxTokens: 6000,
      responseFormat: 'json_object',
    });
  } catch (err) {
    if (err instanceof DeepseekError) {
      throw new GenerateError(`DeepSeek API failed: ${err.message}`, err);
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(response.content);
  } catch (err) {
    throw new GenerateError(`Failed to parse AI JSON: ${(err as Error).message}`, err);
  }

  const payload = validateSectionsPayload(parsed);

  // Merge AI content into the section list (preserves order/visibility/canHide)
  const contentById = new Map(payload.sections.map((s) => [s.id, s.html]));
  const sectionsConfig: SectionConfig[] = sections.map((s) => {
    const aiContent = contentById.get(s.id);
    if (aiContent === undefined) return { ...s };
    // FAQ sections are stored as JSON string of {q,a}; non-FAQ as HTML
    return { ...s, content: aiContent };
  });

  return {
    payload,
    sectionsConfig,
    usage: response.usage,
    model: response.model,
    promptUsed: userPrompt,
    cityContext,
  };
}

// ─── Single-target rewrite (one section OR one hero/meta field) ────────────────

export type GenerateSingleOptions = {
  serviceSlug: string;
  citySlug: string;
  target: RewriteTarget;
  /** Current value, so the AI rewrites with awareness instead of from scratch. */
  currentContent?: string;
  customInstructions?: string;
  temperature?: number;
  cityNameFallback?: string;
};

export type GenerateSingleResult = {
  content: string;
  usage: DeepseekUsage;
  model: string;
  cityContext: CityContext;
};

/**
 * Rewrite exactly ONE piece of a (service, city) page — a single block section
 * or a single hero/meta field. Returns the new value only; the caller decides
 * whether to merge + persist it.
 */
export async function generateSingleTarget(
  opts: GenerateSingleOptions,
): Promise<GenerateSingleResult> {
  const service = SERVICE_LABELS[opts.serviceSlug];
  if (!service) {
    throw new GenerateError(
      `Unknown serviceSlug "${opts.serviceSlug}". Known: ${Object.keys(SERVICE_LABELS).join(', ')}`,
    );
  }

  const cityContext = buildCityContext(
    opts.citySlug,
    opts.cityNameFallback ? { name: opts.cityNameFallback } : undefined,
  );
  if (!cityContext) {
    throw new GenerateError(`Unknown citySlug "${opts.citySlug}" — not in indian-cities.ts`);
  }

  const userPrompt = buildSingleTargetPrompt({
    service,
    city: cityContext,
    target: opts.target,
    currentContent: opts.currentContent,
    customInstructions: opts.customInstructions,
  });

  let response;
  try {
    response = await complete({
      messages: [
        { role: 'system', content: SINGLE_SECTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: opts.temperature ?? 0.7,
      maxTokens: 2000,
      responseFormat: 'json_object',
    });
  } catch (err) {
    if (err instanceof DeepseekError) {
      throw new GenerateError(`DeepSeek API failed: ${err.message}`, err);
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = parseJsonResponse(response.content);
  } catch (err) {
    throw new GenerateError(`Failed to parse AI JSON: ${(err as Error).message}`, err);
  }

  const content = (parsed as any)?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new GenerateError('AI returned empty or non-string "content"');
  }

  return {
    content: content.trim(),
    usage: response.usage,
    model: response.model,
    cityContext,
  };
}
