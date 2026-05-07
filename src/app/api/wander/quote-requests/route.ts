// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateCustomerId } from '@/lib/utils/id-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      listingId,
      customerId: bodyCustomerId,
      name,
      phone,
      email,
      travelDate,
      groupSize,
      pickupLocation,
      requirements,
      bookingFor,
      companyName,
    } = body;

    if (!listingId) return NextResponse.json({ error: 'Tour listing is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!travelDate) return NextResponse.json({ error: 'Travel date is required' }, { status: 400 });

    // ── 1. Try the vendor wander_listings table first (existing flow) ─────────
    const listing = await (prisma as any).wander_listings.findFirst({
      where: { id: listingId, status: 'ACTIVE' },
    });

    if (listing) {
      if (listing.tourEndDate) {
        const endDate = new Date(listing.tourEndDate);
        endDate.setHours(23, 59, 59);
        if (endDate < new Date()) {
          return NextResponse.json(
            { error: 'This tour has ended and is no longer accepting quote requests' },
            { status: 400 },
          );
        }
      }

      // Use supplied customerId if logged-in, else find/create
      let customer = null;
      if (bodyCustomerId) {
        customer = await prisma.customers.findUnique({ where: { id: bodyCustomerId } });
      }
      if (!customer) {
        customer = await prisma.customers.findFirst({
          where: {
            OR: [
              ...(email ? [{ email: email.toLowerCase() }] : []),
              { phone: phone.trim() },
            ],
          },
        });
      }
      if (!customer) {
        const newId = await generateCustomerId();
        customer = await prisma.customers.create({
          data: {
            id: newId,
            name: name.trim(),
            phone: phone.trim(),
            email: email ? email.toLowerCase() : `${phone.trim()}@wander.local`,
            isActive: true,
          },
        });
      }

      const count = await (prisma as any).wander_quote_requests.count();
      const requestId = `WND-REQ-${Date.now()}-${count + 1}`;

      const quoteRequest = await (prisma as any).wander_quote_requests.create({
        data: {
          requestId,
          wanderListingId: listingId,
          customerId: customer.id,
          travelDate: new Date(travelDate),
          groupSize: groupSize ? parseInt(groupSize) : 1,
          pickupLocation: pickupLocation?.trim() || null,
          requirements: requirements?.trim() || null,
          bookingFor: bookingFor === 'COMPANY' ? 'COMPANY' : 'PERSONAL',
          companyName: bookingFor === 'COMPANY' ? (companyName?.trim() || null) : null,
          status: 'PENDING',
        },
      });

      return NextResponse.json(
        { success: true, requestId: quoteRequest.requestId },
        { status: 201 },
      );
    }

    // ── 2. Fallback: try travel_agent_tours and create a travel_agent_lead ──
    const agentTour = await (prisma as any).travel_agent_tours.findFirst({
      where: { id: listingId, isPublic: true, isActive: true },
      include: {
        travel_agents: { select: { id: true, status: true } },
      },
    });

    if (!agentTour) {
      return NextResponse.json({ error: 'Tour not found or unavailable' }, { status: 404 });
    }

    if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(agentTour.travel_agents.status)) {
      return NextResponse.json(
        { error: 'This tour is currently unavailable. Please try another.' },
        { status: 403 },
      );
    }

    // Indian phone sanity check
    const phoneClean = String(phone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number' }, { status: 400 });
    }

    // Resolve a customer record so we can link the lead → customer (used by the
    // customer dashboard to surface this enquiry). Wrapped in a try/catch so any
    // failure here never prevents the lead from being created.
    let resolvedCustomerId: string | null = null;
    try {
      // 1) Trust the bodyCustomerId only if it actually exists in the DB
      if (bodyCustomerId) {
        const exists = await prisma.customers.findUnique({
          where: { id: bodyCustomerId },
          select: { id: true },
        });
        if (exists) resolvedCustomerId = exists.id;
      }
      // 2) Fall back to email / phone lookup
      if (!resolvedCustomerId) {
        const found = await prisma.customers.findFirst({
          where: {
            OR: [
              ...(email ? [{ email: email.toLowerCase() }] : []),
              { phone: phoneClean },
            ],
          },
          select: { id: true },
        });
        if (found) resolvedCustomerId = found.id;
      }
      // 3) Finally, create a guest customer
      if (!resolvedCustomerId) {
        try {
          const newId = await generateCustomerId();
          const created = await prisma.customers.create({
            data: {
              id: newId,
              name: name.trim(),
              phone: phoneClean,
              email: email ? email.toLowerCase() : `${phoneClean}@wander.local`,
              isActive: true,
            },
            select: { id: true },
          });
          resolvedCustomerId = created.id;
        } catch {
          // Most likely a unique constraint on phone/email — try one more lookup
          const retry = await prisma.customers.findFirst({
            where: {
              OR: [
                ...(email ? [{ email: email.toLowerCase() }] : []),
                { phone: phoneClean },
              ],
            },
            select: { id: true },
          });
          if (retry) resolvedCustomerId = retry.id;
        }
      }
    } catch {
      // Non-fatal — lead can still be created without a customerId
    }

    const groupSizeNum = groupSize ? parseInt(groupSize) : 1;
    const estimatedValue = agentTour.startingPrice
      ? agentTour.startingPrice * Math.max(1, groupSizeNum)
      : null;

    // Build a richer requirement note that includes the tour name and pickup
    const reqParts: string[] = [];
    reqParts.push(`Quote request for: ${agentTour.title}`);
    if (pickupLocation?.trim()) reqParts.push(`Pickup: ${pickupLocation.trim()}`);
    if (requirements?.trim()) reqParts.push(`Notes: ${requirements.trim()}`);
    if (bookingFor === 'COMPANY' && companyName?.trim()) {
      reqParts.push(`Company: ${companyName.trim()}`);
    }

    // Build the lead-create payload. We try with customerId first; if the
    // Prisma client hasn't been regenerated yet to pick up that new column,
    // it'll throw "Unknown argument `customerId`" — fall back to a payload
    // without it (the column is still set via raw SQL).
    const leadDataBase: any = {
      travelAgentId: agentTour.travelAgentId,
      customerName: name.trim(),
      customerPhone: phoneClean,
      customerEmail: email ? email.toLowerCase() : null,
      source: 'WEBSITE',
      tripType: 'TOUR_PACKAGE',
      destination: agentTour.destination,
      pickupLocation: pickupLocation?.trim() || null,
      travelDate: new Date(travelDate),
      passengers: groupSizeNum,
      requirement: reqParts.join('\n'),
      estimatedValue,
      status: 'NEW',
      priority: 'WARM',
      tourId: agentTour.id,
    };

    let lead: any;
    try {
      lead = await (prisma as any).travel_agent_leads.create({
        data: { ...leadDataBase, customerId: resolvedCustomerId },
      });
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('Unknown argument') || msg.includes('customerId')) {
        // Old Prisma client — create without the new column, then patch via raw SQL
        lead = await (prisma as any).travel_agent_leads.create({ data: leadDataBase });
        if (resolvedCustomerId) {
          try {
            await (prisma as any).$executeRaw`
              UPDATE travel_agent_leads
              SET customerId = ${resolvedCustomerId}
              WHERE id = ${lead.id}
            `;
          } catch {
            // Non-fatal — phone-based dashboard match still works
          }
        }
      } else {
        throw e;
      }
    }

    // Auto-add a timeline note so the agent sees what triggered the lead
    await prisma.travel_agent_lead_notes.create({
      data: {
        leadId: lead.id,
        note: `Customer requested a quote from /wander for "${agentTour.title}" — ${groupSizeNum} pax on ${new Date(travelDate).toLocaleDateString()}.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        requestId: lead.id,
        message: 'Your enquiry has been sent to the agency. They will contact you shortly.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[Public Wander Quote Request POST]', error);
    return NextResponse.json({ error: 'Failed to submit quote request' }, { status: 500 });
  }
}
