import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { publishScheduledStories } from '@/lib/web-stories/publish-scheduled';

export const dynamic = 'force-dynamic';

// GET - Public list of published, non-archived, non-expired stories
// Optional query params: service (slug), location (slug), city (name or slug),
// featured (bool — only admin-picked stories, for the homepage carousel
// rather than the full /stories listing), limit (cap the result count,
// applied after targeting filtering so it stays accurate for the homepage's
// untargeted request)
//
// `location` also matches stories with no location targeting ("show
// everywhere"). `city` is stricter, for "stories about this place" sections:
// the story must target that city, or name it in its title or category.
export async function GET(request: NextRequest) {
  try {
    await publishScheduledStories();
    const now = new Date();
    const { searchParams } = new URL(request.url);
    const serviceFilter = searchParams.get('service') || null;
    const locationFilter = searchParams.get('location') || null;
    const featuredOnly = searchParams.get('featured') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : null;
    const cityFilter = (searchParams.get('city') || '').trim().toLowerCase() || null;
    const citySlug = cityFilter ? cityFilter.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null;

    const stories = await prisma.web_stories.findMany({
      where: {
        isPublished: true,
        isArchived: false,
        ...(featuredOnly ? { isFeatured: true } : {}),
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        coverImageSquare: true,
        publisherName: true,
        publisherLogo: true,
        category: true,
        isFeatured: true,
        publishedAt: true,
        slides: { select: { id: true } },
        reactions: { select: { reactionType: true } },
      },
    });

    // Read targeting fields via raw SQL
    const storyIds = stories.map((s: any) => s.id);
    let targetingMap: Record<string, { targetServices: string | null; targetLocations: string | null }> = {};

    if (storyIds.length > 0) {
      const placeholders = storyIds.map(() => '?').join(',');
      const targeting = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, targetServices, targetLocations FROM web_stories WHERE id IN (${placeholders})`,
        ...storyIds
      );
      for (const row of targeting) {
        targetingMap[row.id] = { targetServices: row.targetServices, targetLocations: row.targetLocations };
      }
    }

    // Filter by service / location targeting
    const matchesTargeting = (storyId: string) => {
      const t = targetingMap[storyId];
      if (!t) return true; // no targeting = show everywhere

      let services: string[] = [];
      let locations: string[] = [];
      try { if (t.targetServices) services = JSON.parse(t.targetServices); } catch {}
      try { if (t.targetLocations) locations = JSON.parse(t.targetLocations); } catch {}

      // Empty arrays = show everywhere
      const serviceOk = services.length === 0 || !serviceFilter || services.includes(serviceFilter);
      const locationOk = locations.length === 0 || !locationFilter || locations.includes(locationFilter);

      return serviceOk && locationOk;
    };

    const matchesCity = (story: any) => {
      if (!cityFilter) return true;
      let locations: string[] = [];
      try {
        const raw = targetingMap[story.id]?.targetLocations;
        if (raw) locations = JSON.parse(raw);
      } catch {}
      if (locations.some((slug) => String(slug).toLowerCase() === citySlug)) return true;
      const text = `${story.title || ''} ${story.category || ''}`.toLowerCase();
      const slug = String(story.slug || '').toLowerCase();
      return text.includes(cityFilter) || (!!citySlug && `-${slug}-`.includes(`-${citySlug}-`));
    };

    const locationsOf = (storyId: string): string[] => {
      try {
        const raw = targetingMap[storyId]?.targetLocations;
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const formatted = stories
      .filter((s: any) => matchesTargeting(s.id) && matchesCity(s))
      .map((s: any) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        coverImage: s.coverImage,
        coverImageSquare: s.coverImageSquare,
        publisherName: s.publisherName,
        publisherLogo: s.publisherLogo,
        category: s.category,
        isFeatured: !!s.isFeatured,
        locations: locationsOf(s.id),
        publishedAt: s.publishedAt?.toISOString() || null,
        slideCount: s.slides.length,
        totalReactions: s.reactions.length,
      }));

    const result = limit ? formatted.slice(0, limit) : formatted;

    return NextResponse.json({ stories: result });
  } catch (error) {
    logger.error('Failed to fetch public web stories', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}
