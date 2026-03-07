import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTemplateMeta, STATIC_PAGES } from '@/lib/seo/service-meta-templates';

/** GET all location pages for a service with their meta (template + DB override) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'location'; // location | routes | airport | static

    // ── Static pages ─────────────────────────────────────────────────────────
    if (type === 'static') {
      const pageIds = STATIC_PAGES.map((p) => p.pageId);
      const overrides = await prisma.seo_meta.findMany({
        where: { pageId: { in: pageIds } },
        select: { pageId: true, metaTitle: true, metaDescription: true, metaKeywords: true },
      });
      const overrideMap = Object.fromEntries(overrides.map((o) => [o.pageId, o]));

      const pages = STATIC_PAGES.map((p) => ({
        pageId: p.pageId,
        url: p.url,
        label: p.label,
        override: overrideMap[p.pageId] || null,
      }));

      return NextResponse.json({ pages });
    }

    // ── Route pages (one-way & round-trip) ───────────────────────────────────
    if (type === 'routes' || type === 'airport') {
      const isAirport = type === 'airport';

      const routeService = isAirport ? 'airport-transfer' : 'one-way-cab';
      const roundTripService = 'round-trip';

      const whereClause = isAirport
        ? {
            isActive: true,
            OR: [
              { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: 'AIRPORT' } },
              { locations_chauffeur_route_packages_toLocationIdTolocations: { type: 'AIRPORT' } },
            ],
          }
        : {
            isActive: true,
            AND: [
              { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: { not: 'AIRPORT' } } },
              { locations_chauffeur_route_packages_toLocationIdTolocations: { type: { not: 'AIRPORT' } } },
            ],
          };

      const routes = await prisma.chauffeur_route_packages.findMany({
        where: whereClause,
        select: {
          fromLocationId: true,
          toLocationId: true,
          estimatedKm: true,
          estimatedDuration: true,
          basePrice: true,
          locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { slug: true, name: true, type: true } },
          locations_chauffeur_route_packages_toLocationIdTolocations: { select: { slug: true, name: true, type: true } },
        },
        distinct: ['fromLocationId', 'toLocationId'],
        take: 200,
      });

      // Build unique route pages
      const seen = new Set<string>();
      const routePages: { pageId: string; url: string; label: string; from: string; to: string; km: number; price: number }[] = [];

      for (const r of routes) {
        const from = r.locations_chauffeur_route_packages_fromLocationIdTolocations;
        const to = r.locations_chauffeur_route_packages_toLocationIdTolocations;
        if (!from || !to) continue;

        if (isAirport) {
          const airportLoc = from.type === 'AIRPORT' ? from : to;
          const cityLoc = from.type === 'AIRPORT' ? to : from;
          const direction = from.type === 'AIRPORT' ? 'from' : 'to';
          const routeSlug = direction === 'from'
            ? `${airportLoc.slug}-to-${cityLoc.slug}`
            : `${cityLoc.slug}-to-${airportLoc.slug}`;
          if (seen.has(routeSlug)) continue;
          seen.add(routeSlug);
          routePages.push({
            pageId: `airport-transfer:${routeSlug}`,
            url: `/airport-transfer/${routeSlug}`,
            label: `${from.name} → ${to.name}`,
            from: from.name,
            to: to.name,
            km: r.estimatedKm,
            price: r.basePrice,
          });
        } else {
          const routeSlug = `${from.slug}-to-${to.slug}`;
          if (!seen.has(`oneway:${routeSlug}`)) {
            seen.add(`oneway:${routeSlug}`);
            routePages.push({
              pageId: `one-way-cab:${routeSlug}`,
              url: `/one-way-cab/${routeSlug}`,
              label: `${from.name} → ${to.name} (One Way)`,
              from: from.name,
              to: to.name,
              km: r.estimatedKm,
              price: r.basePrice,
            });
          }
          const reverseSlug = `${to.slug}-to-${from.slug}`;
          if (!seen.has(`roundtrip:${routeSlug}`)) {
            seen.add(`roundtrip:${routeSlug}`);
            routePages.push({
              pageId: `round-trip:${routeSlug}`,
              url: `/round-trip/${routeSlug}`,
              label: `${from.name} ↔ ${to.name} (Round Trip)`,
              from: from.name,
              to: to.name,
              km: r.estimatedKm,
              price: r.basePrice,
            });
          }
        }
      }

      // Fetch DB overrides
      const pageIds = routePages.map((p) => p.pageId);
      const overrides = await prisma.seo_meta.findMany({
        where: { pageId: { in: pageIds } },
        select: { pageId: true, metaTitle: true, metaDescription: true, metaKeywords: true },
      });
      const overrideMap = Object.fromEntries(overrides.map((o) => [o.pageId, o]));

      const pages = routePages.map((p) => ({
        ...p,
        override: overrideMap[p.pageId] || null,
        templateTitle: isAirport
          ? `${p.from} to ${p.to} Cab | Airport Transfer @₹${Math.round(p.price)}`
          : `${p.from} to ${p.to} Cab | @₹${Math.round(p.price)} | TransRentals`,
        templateDescription: isAirport
          ? `Airport transfer from ${p.from} to ${p.to}. ${p.km} km. Starting @₹${Math.round(p.price)}. 45 min free wait. Book now!`
          : `Book ${p.pageId.startsWith('round-trip') ? 'round trip' : 'one way'} cab from ${p.from} to ${p.to}. ${p.km} km. Starting @₹${Math.round(p.price)}. Book now!`,
        templateKeywords: `${p.from} to ${p.to} cab, ${p.from} ${p.to} taxi, ${p.from} to ${p.to} one way cab`,
      }));

      return NextResponse.json({ pages, total: pages.length });
    }

    // ── Location pages (default) ──────────────────────────────────────────────
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const serviceLocations = await prisma.service_locations.findMany({
      where: { serviceId: service.id, isActive: true },
      include: { locations: { select: { slug: true, name: true, state: true } } },
      orderBy: { locations: { name: 'asc' } },
    });

    const pageIds = serviceLocations.map((sl) => `${slug}:${sl.locations.slug}`);
    const overrides = await prisma.seo_meta.findMany({
      where: { pageId: { in: pageIds } },
      select: { pageId: true, metaTitle: true, metaDescription: true, metaKeywords: true },
    });
    const overrideMap = Object.fromEntries(overrides.map((o) => [o.pageId, o]));

    const pages = serviceLocations.map((sl) => {
      const loc = sl.locations;
      const pageId = `${slug}:${loc.slug}`;
      const template = getTemplateMeta(slug, loc.name);
      return {
        pageId,
        url: `/${slug}/${loc.slug}`,
        locationSlug: loc.slug,
        locationName: loc.name,
        state: loc.state || '',
        templateTitle: template?.title || '',
        templateDescription: template?.description || '',
        templateKeywords: template?.keywords || '',
        override: overrideMap[pageId] || null,
      };
    });

    return NextResponse.json({ pages, total: pages.length, serviceName: service.name });
  } catch (error) {
    console.error('[location-pages GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
