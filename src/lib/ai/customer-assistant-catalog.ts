// Travel content the customer help assistant may recommend: published web
// stories and bookable Wander tours. Loaded from the database and cached
// briefly, so the assistant can link real stories/tours by id, and the chat
// route can reject any link that doesn't point at one of them.

import { prisma } from '@/lib/db/prisma';

export type CatalogStory = { slug: string; title: string; category: string | null };
export type CatalogTour = { id: string; slug: string | null; title: string; city: string | null; duration: string | null };
export type AssistantCatalog = { stories: CatalogStory[]; tours: CatalogTour[] };

const CACHE_MS = 10 * 60 * 1000;
const MAX_STORIES = 80;
const MAX_TOURS = 40;

let cached: { at: number; data: AssistantCatalog } | null = null;

export async function getAssistantCatalog(): Promise<AssistantCatalog> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [stories, listings, agentTours] = await Promise.all([
    prisma.web_stories
      .findMany({
        where: { isPublished: true, isArchived: false, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
        select: { slug: true, title: true, category: true },
        take: MAX_STORIES,
      })
      .catch(() => []),
    (prisma as any).wander_listings
      .findMany({
        where: { status: 'ACTIVE', OR: [{ tourEndDate: null }, { tourEndDate: { gte: today } }] },
        orderBy: { createdAt: 'desc' },
        select: { id: true, slug: true, title: true, duration: true, mainLocation: { select: { name: true } } },
        take: MAX_TOURS,
      })
      .catch(() => []),
    (prisma as any).travel_agent_tours
      .findMany({
        where: { isPublic: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, slug: true, title: true, destination: true, duration: true, durationDays: true, durationNights: true },
        take: MAX_TOURS,
      })
      .catch(() => []),
  ]);

  const tours: CatalogTour[] = [
    ...listings.map((l: any) => ({
      id: l.id, slug: l.slug || null, title: l.title, city: l.mainLocation?.name || null, duration: l.duration || null,
    })),
    ...agentTours.map((t: any) => ({
      id: t.id,
      slug: t.slug || null,
      title: t.title,
      city: t.destination || null,
      duration: t.duration || (t.durationDays ? `${t.durationDays}D${t.durationNights ? `/${t.durationNights}N` : ''}` : null),
    })),
  ].slice(0, MAX_TOURS);

  const data: AssistantCatalog = {
    stories: stories.map((s: any) => ({ slug: s.slug, title: s.title, category: s.category || null })),
    tours,
  };
  cached = { at: Date.now(), data };
  return data;
}
