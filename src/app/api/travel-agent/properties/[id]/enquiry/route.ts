import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';
import { notifyManagers, getAllActiveManagers } from '@/lib/notifications/manager-notify';
import { sendPropertyEnquiryConfirmationEmail } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

// PUBLIC — a visitor on a property's listing page asks the agent about it.
// Lands in the same Leads queue as a tour quote request (travel_agent_leads),
// so the agent follows up from one place rather than only an email/WhatsApp
// that's easy to miss.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { limited, resetIn } = checkRateLimit(request, RATE_LIMITS.contact, 'property-enquiry');
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(resetIn) } },
    );
  }

  try {
    const { id } = await params;
    const property = await prisma.travel_agent_properties.findUnique({
      where: { id },
      include: { travel_agents: { select: { id: true, status: true, agencyName: true, phone: true } } },
    });

    if (!property || !property.isPublic || !property.isActive) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(property.travel_agents.status)) {
      return NextResponse.json({ error: 'This listing is currently unavailable.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, email, checkInDate, checkOutDate, guests, message, customerId } = body;

    if (!name?.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
    }

    // Stripping non-digits before validating (the old approach) let garbage
    // like "sdfsdfs08347122756" slip through as a "valid" number, because the
    // last 10 digits happened to match — reject letters outright instead of
    // silently cleaning them out.
    const phoneRaw = String(phone || '').trim();
    if (/[a-zA-Z]/.test(phoneRaw)) {
      return NextResponse.json({ error: 'Phone number should contain digits only' }, { status: 400 });
    }
    // Digits only beyond this point — allow a leading country code (+91 / 91)
    // but otherwise require exactly 10 digits, not just "the last 10".
    let phoneClean = phoneRaw.replace(/[^\d]/g, '');
    if (phoneClean.length === 12 && phoneClean.startsWith('91')) {
      phoneClean = phoneClean.slice(2);
    }
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number' }, { status: 400 });
    }

    if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Trust a logged-in customer's own id only if it's real — never let the
    // request body attach the lead to an arbitrary customer record.
    let resolvedCustomerId: string | null = null;
    if (customerId) {
      const exists = await prisma.customers.findUnique({ where: { id: String(customerId) }, select: { id: true } });
      if (exists) resolvedCustomerId = exists.id;
    }

    let guestsNum = guests ? Math.max(1, parseInt(guests)) : null;
    if (guestsNum && property.maxGuests && guestsNum > property.maxGuests) {
      return NextResponse.json(
        { error: `This property sleeps up to ${property.maxGuests} guests.` },
        { status: 400 },
      );
    }
    const reqParts: string[] = [`Enquiry for: ${property.name}`];
    if (checkInDate) reqParts.push(`Check-in: ${checkInDate}${checkOutDate ? ` → ${checkOutDate}` : ''}`);
    if (guestsNum) reqParts.push(`Guests: ${guestsNum}`);
    if (message?.trim()) reqParts.push(`Message: ${message.trim()}`);

    const lead = await prisma.travel_agent_leads.create({
      data: {
        travelAgentId: property.travelAgentId,
        customerName: name.trim(),
        customerPhone: phoneClean,
        customerEmail: email?.trim() || null,
        source: 'WEBSITE',
        tripType: 'ACCOMMODATION',
        destination: property.city,
        travelDate: checkInDate ? new Date(checkInDate) : null,
        returnDate: checkOutDate ? new Date(checkOutDate) : null,
        passengers: guestsNum,
        requirement: reqParts.join('\n'),
        estimatedValue: property.startingPrice,
        status: 'NEW',
        priority: 'WARM',
        propertyId: property.id,
        customerId: resolvedCustomerId,
      },
    });

    await prisma.travel_agent_lead_notes.create({
      data: {
        leadId: lead.id,
        note: `Customer enquired via the public listing page for "${property.name}".`,
      },
    });

    await notifyTravelAgent(property.travelAgentId, {
      type: 'LEAD',
      title: 'New property enquiry',
      body: `${lead.customerName} is interested in ${property.name}.`,
      link: `/travel-agent/leads/${lead.id}`,
      metadata: { leadId: lead.id, propertyId: property.id },
    });

    // Managers get visibility too, same as every other agent-facing event
    // (vendor agreements, driver signups) — not just the owning agent.
    try {
      const managerIds = await getAllActiveManagers();
      await notifyManagers(managerIds, {
        type: 'NEW_PROPERTY_ENQUIRY',
        title: 'New property enquiry',
        body: `${lead.customerName} enquired about "${property.name}" (${property.travel_agents.agencyName}).`,
        link: `/manager/travel-agents/${property.travelAgentId}`,
        metadata: { leadId: lead.id, propertyId: property.id, travelAgentId: property.travelAgentId },
        dedupeKey: lead.id,
      });
    } catch (e) {
      logger.error('Manager notify failed for property enquiry', e);
    }

    // Confirmation email to the customer — best-effort, never blocks the
    // response since the lead is already saved by this point.
    if (email?.trim()) {
      try {
        await sendPropertyEnquiryConfirmationEmail({
          to: email.trim(),
          customerName: lead.customerName,
          propertyName: property.name,
          agencyName: property.travel_agents.agencyName,
          agencyPhone: property.travel_agents.phone,
          checkInDate: checkInDate || null,
          checkOutDate: checkOutDate || null,
          guests: guestsNum,
        });
      } catch (e) {
        logger.error('Confirmation email failed for property enquiry', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thanks! The agency will get back to you shortly.',
    });
  } catch (error: any) {
    logger.error('Property enquiry POST error', error);
    return NextResponse.json(
      { error: 'Failed to submit enquiry', details: error?.message },
      { status: 500 },
    );
  }
}
