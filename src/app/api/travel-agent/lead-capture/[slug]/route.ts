import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

// PUBLIC endpoint — no auth.
// Returns capture-form metadata if the link is active.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const link = await prisma.travel_agent_lead_capture_links.findUnique({
      where: { slug },
      include: {
        travel_agents: {
          select: { id: true, agencyName: true, logo: true, status: true },
        },
      },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Capture form not found or inactive' }, { status: 404 });
    }

    // Block lead capture if the agent is not in good standing.
    // Soft-access (PENDING / DOCUMENTS_PENDING / UNDER_REVIEW / APPROVED) is fine; blocked/rejected is not.
    const blockedStatuses = ['BLOCKED', 'SUSPENDED', 'REJECTED'];
    if (blockedStatuses.includes(link.travel_agents.status)) {
      return NextResponse.json({ error: 'This form is currently unavailable' }, { status: 403 });
    }

    return NextResponse.json({
      slug: link.slug,
      title: link.title,
      description: link.description,
      defaultTripType: link.defaultTripType,
      agencyName: link.travel_agents.agencyName,
      agencyLogo: link.travel_agents.logo,
    });
  } catch (error: any) {
    logger.error('Public capture form GET error', error);
    return NextResponse.json(
      { error: 'Failed to load form', details: error?.message },
      { status: 500 },
    );
  }
}

// PUBLIC endpoint — anyone can submit a lead via the capture form.
// Rate-limited per IP to prevent spam.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { limited, resetIn } = checkRateLimit(
    request,
    RATE_LIMITS.contact,
    'travel-agent-lead-capture',
  );
  if (limited) {
    logger.logSecurityEvent('Lead capture rate limit exceeded', 'medium', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(resetIn) } },
    );
  }

  try {
    const { slug } = await params;
    const link = await prisma.travel_agent_lead_capture_links.findUnique({
      where: { slug },
      include: { travel_agents: { select: { id: true, status: true } } },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Capture form not found or inactive' }, { status: 404 });
    }

    const blockedStatuses = ['BLOCKED', 'SUSPENDED', 'REJECTED'];
    if (blockedStatuses.includes(link.travel_agents.status)) {
      return NextResponse.json({ error: 'This form is currently unavailable' }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      tripType,
      pickupLocation,
      dropLocation,
      destination,
      travelDate,
      returnDate,
      passengers,
      requirement,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 },
      );
    }

    // Basic phone sanity check (Indian 10-digit)
    const phoneClean = String(customerPhone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const [createdLead] = await prisma.$transaction([
      prisma.travel_agent_leads.create({
        data: {
          travelAgentId: link.travelAgentId,
          captureLinkId: link.id,
          customerName: String(customerName).trim(),
          customerPhone: phoneClean,
          customerEmail: customerEmail || null,
          source: 'CAPTURE_LINK',
          tripType: tripType || link.defaultTripType || null,
          pickupLocation: pickupLocation || null,
          dropLocation: dropLocation || null,
          destination: destination || null,
          travelDate: travelDate ? new Date(travelDate) : null,
          returnDate: returnDate ? new Date(returnDate) : null,
          passengers: passengers ? Number(passengers) : 1,
          requirement: requirement || null,
          status: 'NEW',
          priority: 'WARM',
        },
      }),
      prisma.travel_agent_lead_capture_links.update({
        where: { id: link.id },
        data: { totalSubmissions: { increment: 1 } },
      }),
    ]);

    await notifyTravelAgent(link.travelAgentId, {
      type: 'LEAD',
      title: 'New lead captured',
      body: `${String(customerName).trim()} is interested${destination ? ` in ${destination}` : ''}.`,
      link: `/travel-agent/leads/${createdLead.id}`,
      metadata: { leadId: createdLead.id, source: 'CAPTURE_LINK' },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Thanks! Your enquiry has been received. The agent will reach out to you shortly.',
      },
      { status: 201 },
    );
  } catch (error: any) {
    logger.error('Public capture form POST error', error);
    return NextResponse.json(
      { error: 'Failed to submit lead', details: error?.message },
      { status: 500 },
    );
  }
}
