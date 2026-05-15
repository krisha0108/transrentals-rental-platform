/**
 * Read service_city_content from DB for a given (service, city) slug pair.
 * Parses stored JSON fields. Returns null if no row, undefined fields if not generated yet.
 *
 * Used by service-city public pages (e.g. /car-rental/delhi) to render
 * admin/AI-managed unique content instead of hardcoded boilerplate.
 */

import { prisma } from '@/lib/db/prisma';

export type WhyChooseItem = { title: string; description: string };
export type VehicleItem = { category: string; models: string; priceRange: string; bestFor: string };
export type ServiceItem = { name: string; description: string };
export type FAQItem = { q: string; a: string };

export type ServiceCityContent = {
  id: string;
  status: string;
  source: string;
  intro: string | null;
  whyChooseUs: WhyChooseItem[];
  popularVehicles: VehicleItem[];
  servicesOffered: ServiceItem[];
  faqs: FAQItem[];
  tips: string[];
  sectionsConfig: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  h1Heading: string | null;
  pageHeading: string | null;
  pageDescription: string | null;
  updatedAt: Date;
  publishedAt: Date | null;
};

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

const PUBLIC_STATUSES = new Set(['published', 'ai_generated', 'manual_edited']);

export async function getServiceCityContent(
  serviceSlug: string,
  citySlug: string,
): Promise<ServiceCityContent | null> {
  try {
    const row = await prisma.service_city_content.findUnique({
      where: { serviceSlug_citySlug: { serviceSlug, citySlug } },
    });
    if (!row) return null;
    if (!PUBLIC_STATUSES.has(row.status)) return null;

    return {
      id: row.id,
      status: row.status,
      source: row.source,
      intro: row.intro,
      whyChooseUs: safeParse<WhyChooseItem[]>(row.whyChooseUs, []),
      popularVehicles: safeParse<VehicleItem[]>(row.popularVehicles, []),
      servicesOffered: safeParse<ServiceItem[]>(row.servicesOffered, []),
      faqs: safeParse<FAQItem[]>(row.faqs, []),
      tips: safeParse<string[]>(row.tips, []),
      sectionsConfig: row.sectionsConfig ?? null,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      metaKeywords: row.metaKeywords,
      h1Heading: row.h1Heading,
      pageHeading: (row as any).pageHeading ?? null,
      pageDescription: (row as any).pageDescription ?? null,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
    };
  } catch (err) {
    console.error('Failed to load service_city_content', { serviceSlug, citySlug, err });
    return null;
  }
}
