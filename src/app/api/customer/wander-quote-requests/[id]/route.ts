// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function safeJson(val: any, fallback: any) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ── 1. Try wander_quote_requests first (existing flow) ────────────────────
    const request = await (prisma as any).wander_quote_requests.findFirst({
      where: { id: params.id },
      include: {
        listing: {
          select: {
            id: true, slug: true, title: true, listingId: true, duration: true,
            images: true, shortDescription: true,
            // Tour-detail tabs on the customer quote page render these.
            // wander_listings has `cancellationNotes` (no `termsConditions`).
            description: true, itinerary: true, cancellationNotes: true,
            highlights: true, inclusions: true, exclusions: true,
            priceType: true, basePrice: true, priceTiers: true,
            requireAdvancePayment: true, advancePaymentType: true, advancePaymentValue: true,
            category: { select: { name: true, icon: true } },
            mainLocation: { select: { name: true } },
            vendor: { select: { id: true, businessName: true, phone: true } },
          },
        },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        quotes: {
          include: {
            vendor: { select: { id: true, businessName: true, phone: true } },
          },
          orderBy: { amount: 'asc' },
        },
        booking: true,
      },
    });

    if (request) {
      // Normalize the vendor listing into the shape the customer page expects.
      // wander_listings stores highlights / inclusions / exclusions as JSON
      // strings, and itinerary as a JSON array of structured stops — the page
      // renders tourHighlights / tourInclusions / tourExclusions arrays plus
      // an HTML itinerary blob.
      const L = request.listing;
      if (L) {
        const tourHighlights: string[] = safeJson(L.highlights, []) || [];
        const tourInclusions: string[] = safeJson(L.inclusions, []) || [];
        const tourExclusions: string[] = safeJson(L.exclusions, []) || [];

        // Convert structured itinerary stops to HTML the customer view can render.
        let itineraryHtml: string | null = null;
        const stops = safeJson(L.itinerary, null);
        if (Array.isArray(stops) && stops.length > 0) {
          const parts: string[] = [];
          stops.forEach((s: any, i: number) => {
            const emoji = s?.emoji || '📍';
            const time = (s?.time || '').toString().trim();
            const title = (s?.title || `Stop ${i + 1}`).toString().trim();
            const desc = (s?.description || '').toString().trim();
            const acts = Array.isArray(s?.activities) ? s.activities.filter(Boolean) : [];
            const header = `<p><strong>${emoji} ${title}${time ? ` <em>· ${time}</em>` : ''}</strong></p>`;
            const descBlock = desc ? `<p>${desc}</p>` : '';
            const actsBlock = acts.length
              ? `<ul>${acts.map((a: string) => `<li>${a}</li>`).join('')}</ul>`
              : '';
            parts.push(`${header}${descBlock}${actsBlock}`);
          });
          itineraryHtml = parts.join('');
        } else if (typeof L.itinerary === 'string' && L.itinerary.trim()) {
          // Plain text or HTML stored directly — pass through.
          itineraryHtml = L.itinerary;
        }

        request.listing = {
          ...L,
          itinerary: itineraryHtml,
          termsConditions: L.cancellationNotes || null,
          tourHighlights,
          tourInclusions,
          tourExclusions,
        };
      }
      return NextResponse.json({ ...request, source: 'VENDOR' });
    }

    // ── 2. Fallback: travel_agent_lead by id ──────────────────────────────────
    const lead = await (prisma as any).travel_agent_leads.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const TOUR_SELECT = {
      id: true, slug: true, title: true, destination: true, description: true,
      durationDays: true, durationNights: true,
      startingPrice: true, category: true,
      coverImage: true, galleryImages: true,
      inclusions: true, exclusions: true,
      itinerary: true, termsConditions: true,
    } as const;

    let tour: any = lead.tourId
      ? await prisma.travel_agent_tours.findUnique({
          where: { id: lead.tourId },
          select: TOUR_SELECT,
        })
      : null;

    // Fallback: many older leads have tourId=NULL but their `requirement` text starts
    // with "Quote request for: <tour title>". Try to recover the tour from that hint.
    if (!tour && lead.requirement) {
      const m = String(lead.requirement).match(/Quote request for:\s*([^\n]+)/i);
      const hintedTitle = m?.[1]?.trim();
      if (hintedTitle) {
        tour = await prisma.travel_agent_tours.findFirst({
          where: {
            travelAgentId: lead.travelAgentId,
            title: { equals: hintedTitle },
          },
          select: TOUR_SELECT,
        });
        // Persist the recovered link so future loads are fast (best-effort)
        if (tour?.id) {
          (prisma as any).travel_agent_leads
            .update({ where: { id: lead.id }, data: { tourId: tour.id } })
            .catch(() => {});
        }
      }
    }

    // Inclusions are stored as JSON `{ highlights, items }`; flatten them for the customer view.
    let tourInclusions: string[] = [];
    let tourHighlights: string[] = [];
    if (tour?.inclusions) {
      try {
        const parsed = JSON.parse(tour.inclusions);
        if (Array.isArray(parsed)) {
          tourInclusions = parsed.filter(Boolean);
        } else if (parsed && typeof parsed === 'object') {
          tourHighlights = Array.isArray(parsed.highlights) ? parsed.highlights.filter(Boolean) : [];
          tourInclusions = Array.isArray(parsed.items) ? parsed.items.filter(Boolean) : [];
        }
      } catch {
        tourInclusions = String(tour.inclusions)
          .split(/\r?\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    let tourExclusions: string[] = [];
    if (tour?.exclusions) {
      try {
        const parsed = JSON.parse(tour.exclusions);
        if (Array.isArray(parsed)) tourExclusions = parsed.filter(Boolean);
      } catch {
        tourExclusions = String(tour.exclusions)
          .split(/\r?\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const agent = await prisma.travel_agents.findUnique({
      where: { id: lead.travelAgentId },
      select: { id: true, agencyName: true, phone: true, logo: true, description: true },
    });

    // Primary payment method (UPI + bank) — for the customer to pay the advance
    const bank = await (prisma as any).travel_agent_bank_accounts.findFirst({
      where: { travelAgentId: lead.travelAgentId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: {
        bankName: true,
        accountHolderName: true,
        accountNumber: true,
        ifscCode: true,
        accountType: true,
        branchName: true,
        upiId: true,
      },
    });

    const gallery = tour ? safeJson(tour.galleryImages, []) : [];
    const images = tour
      ? [tour.coverImage, ...(Array.isArray(gallery) ? gallery : [])].filter(Boolean)
      : [];
    const duration = tour
      ? `${tour.durationDays} Day${tour.durationDays !== 1 ? 's' : ''}${
          tour.durationNights > 0
            ? ` / ${tour.durationNights} Night${tour.durationNights !== 1 ? 's' : ''}`
            : ''
        }`
      : '';

    // Map the agent's advance-payment config (set when the quote was sent)
    // onto the listing fields the customer page already reads.
    const hasPercentAdvance =
      lead.quoteAdvancePercent != null && Number(lead.quoteAdvancePercent) > 0;
    const hasFixedAdvance =
      lead.quoteAdvanceAmount != null && Number(lead.quoteAdvanceAmount) > 0;
    const advanceFields = hasPercentAdvance
      ? {
          requireAdvancePayment: true,
          advancePaymentType: 'PERCENTAGE' as const,
          advancePaymentValue: Number(lead.quoteAdvancePercent),
        }
      : hasFixedAdvance
        ? {
            requireAdvancePayment: true,
            advancePaymentType: 'FIXED' as const,
            advancePaymentValue: Number(lead.quoteAdvanceAmount),
          }
        : {
            requireAdvancePayment: false,
            advancePaymentType: null,
            advancePaymentValue: null,
          };

    // Customer-facing top-level status: once they've accepted, show ACCEPTED
    const customerStatus = lead.customerAcceptedAt
      ? lead.status === 'BOOKED'
        ? 'CONFIRMED'
        : 'ACCEPTED'
      : mapLeadStatus(lead.status);

    return NextResponse.json({
      id: lead.id,
      requestId: lead.id,
      travelDate: lead.travelDate,
      groupSize: lead.passengers || 1,
      pickupLocation: lead.pickupLocation,
      requirements: lead.requirement,
      status: customerStatus,
      bookingFor: 'PERSONAL',
      createdAt: lead.createdAt,
      customer: lead.customerEmail || lead.customerPhone
        ? {
            id: null,
            name: lead.customerName,
            phone: lead.customerPhone,
            email: lead.customerEmail,
          }
        : null,
      listing: {
        id: tour?.id || null,
        slug: tour?.slug || null,
        title: tour?.title || 'Tour Enquiry',
        listingId: tour?.id || null,
        duration,
        images: images.length ? JSON.stringify(images) : null,
        shortDescription: tour?.description || null,
        description: tour?.description || null,
        itinerary: tour?.itinerary || null,
        termsConditions: tour?.termsConditions || null,
        tourInclusions,
        tourHighlights,
        tourExclusions,
        priceType: tour?.startingPrice ? 'PER_PERSON' : 'ON_REQUEST',
        basePrice: tour?.startingPrice || null,
        priceTiers: null,
        ...advanceFields,
        category: tour?.category ? { name: tour.category, icon: '🗺️' } : null,
        mainLocation: tour?.destination
          ? { name: tour.destination }
          : lead.destination
            ? { name: lead.destination }
            : null,
        vendor: agent
          ? { id: agent.id, businessName: agent.agencyName, phone: agent.phone }
          : null,
      },
      quotes: lead.quotedAmount
        ? [
            {
              id: `lead-quote-${lead.id}`,
              amount: lead.quotedAmount,
              status: lead.customerAcceptedAt ? 'ACCEPTED' : 'PENDING',
              vendorId: lead.travelAgentId,
              validUntil: lead.quoteValidUntil || null,
              notes: lead.quoteTerms || null,
              // Surface the tour's inclusions/exclusions on the synthetic quote
              // so the existing per-quote Includes/Excludes block renders for the customer.
              customInclusions:
                tourHighlights.length || tourInclusions.length
                  ? JSON.stringify([
                      ...tourHighlights.map((h) => `✨ ${h}`),
                      ...tourInclusions,
                    ])
                  : null,
              customExclusions: tourExclusions.length ? JSON.stringify(tourExclusions) : null,
              createdAt: lead.quoteSentAt || lead.updatedAt,
              vendor: agent
                ? { id: agent.id, businessName: agent.agencyName, phone: agent.phone }
                : null,
            },
          ]
        : [],
      booking: null,
      source: 'TRAVEL_AGENT',
      // Extra flag the front-end can use to show / hide vendor-specific actions
      isTravelAgentLead: true,
      travelAgentId: lead.travelAgentId,
      customerAcceptedAt: lead.customerAcceptedAt || null,
      payment: {
        status: lead.paymentStatus || (lead.customerAcceptedAt ? 'PENDING' : null),
        txnId: lead.paymentTxnId || null,
        note: lead.paymentNote || null,
        images: (() => {
          try {
            const arr = lead.paymentProofImages ? JSON.parse(lead.paymentProofImages) : [];
            return Array.isArray(arr) ? arr : [];
          } catch {
            return [];
          }
        })(),
        submittedAt: lead.paymentSubmittedAt || null,
        verifiedAt: lead.paymentVerifiedAt || null,
        rejectReason: lead.paymentRejectReason || null,
      },
      agentPaymentMethod: bank
        ? {
            upiId: bank.upiId || null,
            payeeName: bank.accountHolderName || agent?.agencyName || null,
            bank: bank.bankName
              ? {
                  bankName: bank.bankName,
                  accountHolderName: bank.accountHolderName,
                  accountNumber: bank.accountNumber,
                  ifscCode: bank.ifscCode,
                  accountType: bank.accountType,
                  branchName: bank.branchName,
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error('[Customer Wander Quote Request GET]', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}
