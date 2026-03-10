import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTemplateMeta, STATIC_PAGES, STATIC_PAGE_META } from '@/lib/seo/service-meta-templates';

/** Default page heading & description templates per service (visible on customer page) */
const PAGE_CONTENT_TEMPLATES: Record<string, { heading: (city: string) => string; description: (city: string) => string }> = {
  'self-drive-car-rentals': {
    heading: (city) => `Self Drive Cars in ${city}`,
    description: () => 'Drive yourself without a driver. Hatchbacks, Sedans, SUVs starting ₹899/day.',
  },
  'car-rental': {
    heading: (city) => `Car Rental in ${city}`,
    description: (city) => `Book chauffeur driven cars in ${city}. Sedan, SUV, Luxury cars available with professional drivers.`,
  },
  'bike-on-rent': {
    heading: (city) => `Bike on Rent in ${city}`,
    description: (city) => `Rent bikes and scooters in ${city}. Royal Enfield, KTM, Honda Activa and more starting ₹299/day.`,
  },
  'bus-rental': {
    heading: (city) => `Bus Rental in ${city}`,
    description: (city) => `Rent buses in ${city}. Mini bus, tempo traveller, luxury coaches for group travel, weddings & events.`,
  },
  'packers-and-movers': {
    heading: (city) => `Packers and Movers in ${city}`,
    description: (city) => `Professional packing, loading, transport & unpacking services in ${city}. Local & intercity relocation.`,
  },
  'transporter': {
    heading: (city) => `Truck Rental in ${city}`,
    description: (city) => `Hire trucks for goods transport in ${city}. 7-ton to 32-ton trucks with GPS tracking.`,
  },
  'equipment-rental': {
    heading: (city) => `Equipment Rental in ${city}`,
    description: (city) => `Rent construction & event equipment in ${city}. Excavators, cranes, generators and more.`,
  },
  'luxury-car-rental': {
    heading: (city) => `Luxury Car Rental in ${city}`,
    description: (city) => `Rent BMW, Mercedes, Audi & more luxury cars in ${city}. With or without driver.`,
  },
  'trailer-on-rent': {
    heading: (city) => `Trailer on Rent in ${city}`,
    description: (city) => `Flatbed, lowbed & container trailers for heavy equipment transport in ${city}.`,
  },
};

/** GET all location pages for a service with their meta (template + DB override) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'location';

    // ── Static pages ─────────────────────────────────────────────────────────
    if (type === 'static') {
      const pageIds = STATIC_PAGES.map((p) => p.pageId);
      const overrides = await prisma.seo_meta.findMany({
        where: { servicePageId: { in: pageIds } },
        select: { servicePageId: true, metaTitle: true, metaDescription: true, metaKeywords: true, pageHeading: true, pageDescription: true },
      });
      const overrideMap = Object.fromEntries(overrides.map((o) => [o.servicePageId!, o]));
      const pages = STATIC_PAGES.map((p) => {
        const tpl = STATIC_PAGE_META[p.pageId];
        return {
          pageId: p.pageId,
          url: p.url,
          label: p.label,
          templateTitle: tpl?.templateTitle || '',
          templateDescription: tpl?.templateDescription || '',
          templateKeywords: tpl?.templateKeywords || '',
          override: overrideMap[p.pageId] || null,
        };
      });
      return NextResponse.json({ pages });
    }

    // ── Route / Airport pages ─────────────────────────────────────────────────
    if (type === 'routes' || type === 'airport') {
      const isAirport = type === 'airport';

      const routes = await prisma.chauffeur_route_packages.findMany({
        where: {
          isActive: true,
          ...(isAirport
            ? {
                OR: [
                  { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: 'AIRPORT' } },
                  { locations_chauffeur_route_packages_toLocationIdTolocations: { type: 'AIRPORT' } },
                ],
              }
            : {
                AND: [
                  { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: { not: 'AIRPORT' } } },
                  { locations_chauffeur_route_packages_toLocationIdTolocations: { type: { not: 'AIRPORT' } } },
                ],
              }),
        },
        include: {
          locations_chauffeur_route_packages_fromLocationIdTolocations: true,
          locations_chauffeur_route_packages_toLocationIdTolocations: true,
        },
        distinct: ['fromLocationId', 'toLocationId'],
        take: 300,
      });

      const seen = new Set<string>();
      const routePages: {
        pageId: string; url: string; label: string;
        from: string; to: string; km: number; price: number;
        templateTitle: string; templateDescription: string; templateKeywords: string;
      }[] = [];

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
            from: from.name, to: to.name,
            km: r.estimatedKm, price: r.basePrice,
            templateTitle: `${from.name} to ${to.name} Cab | Airport Transfer @₹${Math.round(r.basePrice)}`,
            templateDescription: `Airport transfer from ${from.name} to ${to.name}. ${r.estimatedKm} km. Starting @₹${Math.round(r.basePrice)}. 45 min free wait. Book now!`,
            templateKeywords: `${from.name} to ${to.name} cab, airport transfer ${cityLoc.name}, airport taxi ${cityLoc.name}`,
          });
        } else {
          const routeSlug = `${from.slug}-to-${to.slug}`;
          if (!seen.has(`ow:${routeSlug}`)) {
            seen.add(`ow:${routeSlug}`);
            routePages.push({
              pageId: `one-way-cab:${routeSlug}`,
              url: `/one-way-cab/${routeSlug}`,
              label: `${from.name} → ${to.name} (One Way)`,
              from: from.name, to: to.name,
              km: r.estimatedKm, price: r.basePrice,
              templateTitle: `${from.name} to ${to.name} Cab | One Way @₹${Math.round(r.basePrice)} | No Return`,
              templateDescription: `Book one way cab from ${from.name} to ${to.name}. ${r.estimatedKm} km. Starting @₹${Math.round(r.basePrice)}. No return charges. Book now!`,
              templateKeywords: `${from.name} to ${to.name} cab, ${from.name} ${to.name} one way, one way taxi`,
            });
          }
          if (!seen.has(`rt:${routeSlug}`)) {
            seen.add(`rt:${routeSlug}`);
            routePages.push({
              pageId: `round-trip:${routeSlug}`,
              url: `/round-trip/${routeSlug}`,
              label: `${from.name} ↔ ${to.name} (Round Trip)`,
              from: from.name, to: to.name,
              km: r.estimatedKm, price: r.basePrice,
              templateTitle: `${from.name} to ${to.name} Round Trip Cab | @₹${Math.round(r.basePrice * 1.8)}`,
              templateDescription: `Book round trip cab from ${from.name} to ${to.name}. ${r.estimatedKm} km one way. Starting @₹${Math.round(r.basePrice * 1.8)}. Book now!`,
              templateKeywords: `${from.name} to ${to.name} round trip, ${from.name} ${to.name} cab, round trip taxi`,
            });
          }
        }
      }

      const pageIds = routePages.map((p) => p.pageId);
      const overrides = await prisma.seo_meta.findMany({
        where: { servicePageId: { in: pageIds } },
        select: { servicePageId: true, metaTitle: true, metaDescription: true, metaKeywords: true, pageHeading: true, pageDescription: true },
      });
      const overrideMap = Object.fromEntries(overrides.map((o) => [o.servicePageId!, o]));

      const pages = routePages.map((p) => ({ ...p, override: overrideMap[p.pageId] || null }));
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
      include: {
        locations: { select: { slug: true, name: true } },
      },
      take: 1000,
    });

    const pageIds = serviceLocations.map((sl) => `${slug}:${sl.locations.slug}`);
    const overrides = await prisma.seo_meta.findMany({
      where: { servicePageId: { in: pageIds } },
      select: { servicePageId: true, metaTitle: true, metaDescription: true, metaKeywords: true, pageHeading: true, pageDescription: true },
    });
    const overrideMap = Object.fromEntries(overrides.map((o) => [o.servicePageId!, o]));

    const pages = serviceLocations
      .sort((a, b) => a.locations.name.localeCompare(b.locations.name))
      .map((sl) => {
        const loc = sl.locations;
        const pageId = `${slug}:${loc.slug}`;
        const template = getTemplateMeta(slug, loc.name);
        const contentTpl = PAGE_CONTENT_TEMPLATES[slug];
        return {
          pageId,
          url: `/${slug}/${loc.slug}`,
          locationSlug: loc.slug,
          locationName: loc.name,
          templateTitle: template?.title || `${loc.name} | TransRentals`,
          templateDescription: template?.description || '',
          templateKeywords: template?.keywords || '',
          templateHeading: contentTpl?.heading(loc.name) || `${service.name} in ${loc.name}`,
          templatePageDescription: contentTpl?.description(loc.name) || '',
          override: overrideMap[pageId] || null,
        };
      });

    return NextResponse.json({ pages, total: pages.length, serviceName: service.name });
  } catch (error) {
    console.error('[location-pages GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
