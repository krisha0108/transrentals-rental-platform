// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Map travel_agent_lead.status → wander_quote_requests-style status the dashboard understands
function mapLeadStatus(s: string): string {
  switch (s) {
    case 'NEW':
    case 'CONTACTED':
    case 'INTERESTED':
      return 'PENDING';
    case 'QUOTED':
    case 'NEGOTIATING':
      return 'QUOTED';
    case 'BOOKED':
      return 'CONFIRMED';
    case 'LOST':
    case 'COLD':
      return 'EXPIRED';
    default:
      return 'PENDING';
  }
}

function safeJson(val: any, fallback: any) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');

    if (!customerId) return NextResponse.json({ error: 'customer_id required' }, { status: 400 });

    const where: any = { customerId };
    if (status && status !== 'all') where.status = status.toUpperCase();

    // ── 1. Existing wander_quote_requests (vendor-side tours) ─────────────────
    const wanderRequests = await (prisma as any).wander_quote_requests.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true, title: true, listingId: true, duration: true, images: true,
            category: { select: { name: true, icon: true } },
            mainLocation: { select: { name: true } },
          },
        },
        quotes: {
          select: { id: true, amount: true, status: true, vendorId: true, createdAt: true },
          orderBy: { amount: 'asc' },
        },
        booking: { select: { id: true, status: true, isB2BBooking: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const merged: any[] = wanderRequests.map((r: any) => ({ ...r, source: 'VENDOR' }));

    // ── 2. Travel-agent leads matched by this customer's phone ────────────────
    // travel_agent_leads doesn't store customerId, so we match by phone instead.
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { phone: true },
    });

    {
      // Build a flexible WHERE that matches leads by customerId OR by phone.
      // We use $queryRaw here so the query works even before the Prisma client
      // has been regenerated to include the new customerId column on
      // travel_agent_leads (regen requires the dev server to release the DLL
      // lock — until then the typed findMany() throws "Unknown argument").
      const phoneClean = customer?.phone
        ? String(customer.phone).replace(/\D/g, '').slice(-10)
        : null;

      let leads: any[] = [];
      if (phoneClean) {
        leads = await (prisma as any).$queryRaw`
          SELECT * FROM travel_agent_leads
          WHERE source = 'WEBSITE'
            AND (customerId = ${customerId} OR customerPhone = ${phoneClean})
          ORDER BY createdAt DESC
        `;
      } else {
        leads = await (prisma as any).$queryRaw`
          SELECT * FROM travel_agent_leads
          WHERE source = 'WEBSITE' AND customerId = ${customerId}
          ORDER BY createdAt DESC
        `;
      }

      // Resolve tour info per lead in batched queries (when tourId is set)
      const tourIds = Array.from(
        new Set(leads.map((l: any) => l.tourId).filter(Boolean)),
      );
      const tours = tourIds.length
        ? await prisma.travel_agent_tours.findMany({
            where: { id: { in: tourIds as string[] } },
            select: {
              id: true, title: true, slug: true, destination: true, category: true,
              coverImage: true, galleryImages: true,
              durationDays: true, durationNights: true,
            },
          })
        : [];
      const tourById = new Map(tours.map((t: any) => [t.id, t]));

      // Resolve agency info per lead so the card hints at vendor name + logo
      const agentIds = Array.from(
        new Set(leads.map((l: any) => l.travelAgentId).filter(Boolean)),
      );
      const agents = agentIds.length
        ? await prisma.travel_agents.findMany({
            where: { id: { in: agentIds as string[] } },
            select: { id: true, agencyName: true, logo: true, phone: true },
          })
        : [];
      const agentById = new Map(agents.map((a: any) => [a.id, a]));

      // Apply status filter (if any) on mapped status values
      const filteredLeads = status && status !== 'all'
        ? leads.filter((l: any) => mapLeadStatus(l.status) === status.toUpperCase())
        : leads;

      const normalizedLeads = filteredLeads.map((l: any) => {
        const tour: any = l.tourId ? tourById.get(l.tourId) : null;
        const gallery = tour ? safeJson(tour.galleryImages, []) : [];
        const images = tour
          ? [tour.coverImage, ...(Array.isArray(gallery) ? gallery : [])].filter(Boolean)
          : [];
        const agent: any = agentById.get(l.travelAgentId);

        const duration = tour
          ? `${tour.durationDays} Day${tour.durationDays !== 1 ? 's' : ''}${
              tour.durationNights > 0
                ? ` / ${tour.durationNights} Night${tour.durationNights !== 1 ? 's' : ''}`
                : ''
            }`
          : '';

        return {
          id: l.id,
          requestId: l.id,
          travelDate: l.travelDate,
          groupSize: l.passengers || 1,
          pickupLocation: l.pickupLocation,
          requirements: l.requirement,
          status: mapLeadStatus(l.status),
          createdAt: l.createdAt,
          bookingFor: 'PERSONAL',
          // If the agent has quoted, surface that as a single "quote" so the
          // dashboard shows "1 quote · ₹X"
          quotes: l.quotedAmount
            ? [
                {
                  id: `lead-quote-${l.id}`,
                  amount: l.quotedAmount,
                  status: 'PENDING',
                  vendorId: l.travelAgentId,
                  createdAt: l.updatedAt,
                },
              ]
            : [],
          listing: {
            id: tour?.id || null,
            title: tour?.title || 'Tour Enquiry',
            listingId: tour?.id || null,
            duration,
            // wander_listings.images is JSON-serialized — match that shape so the
            // dashboard's parseImages() helper works the same way
            images: images.length ? JSON.stringify(images) : null,
            category: tour?.category ? { name: tour.category, icon: '🗺️' } : null,
            mainLocation: tour?.destination
              ? { name: tour.destination }
              : l.destination
                ? { name: l.destination }
                : null,
          },
          vendor: agent
            ? {
                id: agent.id,
                name: agent.agencyName,
                logo: agent.logo,
                phone: agent.phone,
              }
            : null,
          source: 'TRAVEL_AGENT',
        };
      });

      merged.push(...normalizedLeads);
    }

    // Sort merged result by most recent
    merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ requests: merged });
  } catch (error) {
    console.error('[Customer Wander Quote Requests GET]', error);
    return NextResponse.json({ error: 'Failed to fetch tour quote requests' }, { status: 500 });
  }
}
