import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { sanitizeInput } from '@/lib/utils/sanitize';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Generate a globally-unique slug for an agency name. Falls back to random suffix
// on collision so we don't leak existing slugs.
async function generateUniqueAgentSlug(agencyName: string): Promise<string> {
  const base = slugify(agencyName) || 'agency';
  let attempt = base;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.travel_agents.findUnique({
      where: { slug: attempt },
      select: { id: true },
    });
    if (!exists) return attempt;
    attempt = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return `agency-${crypto.randomBytes(6).toString('hex')}`;
}

const inFlight = new Map<string, Promise<any>>();

async function fetchAgentFromDB(travelAgentId: string) {
  const agent = await prisma.travel_agents.findUnique({
    where: { id: travelAgentId },
    select: {
      id: true,
      email: true,
      phone: true,
      agencyName: true,
      agencyType: true,
      ownerName: true,
      gstNumber: true,
      panNumber: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      logo: true,
      description: true,
      website: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
      accountHolderName: true,
      status: true,
      slug: true,
      rating: true,
      totalRatings: true,
      createdAt: true,
      rejectionReason: true,
      _count: {
        select: {
          travel_agent_documents: true,
          travel_agent_bank_accounts: true,
          travel_agent_leads: true,
          travel_agent_tours: true,
          travel_agent_properties: true,
          travel_agent_bookings: true,
        },
      },
    },
  });

  if (!agent) return null;

  // Lazy-generate slug for shareable public profile if missing
  let slug = agent.slug;
  if (!slug) {
    try {
      slug = await generateUniqueAgentSlug(agent.agencyName);
      await prisma.travel_agents.update({
        where: { id: agent.id },
        data: { slug },
      });
    } catch (e) {
      // Non-fatal — page can fall back to using `id` for the share link
      logger.warn('Failed to back-fill travel agent slug', { agentId: agent.id, error: e });
    }
  }

  return {
    ...agent,
    slug,
    documentsCount: agent._count.travel_agent_documents,
    bankAccountsCount: agent._count.travel_agent_bank_accounts,
    leadsCount: agent._count.travel_agent_leads,
    toursCount: agent._count.travel_agent_tours,
    propertiesCount: agent._count.travel_agent_properties,
    bookingsCount: agent._count.travel_agent_bookings,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;

    let pending = inFlight.get(travelAgentId);
    if (!pending) {
      pending = fetchAgentFromDB(travelAgentId);
      inFlight.set(travelAgentId, pending);
      pending.finally(() => inFlight.delete(travelAgentId));
    }

    const data = await pending;
    if (!data) {
      return NextResponse.json({ error: 'Travel agent not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    logger.error('Get travel agent profile error', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error?.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;

    const body = await request.json();
    let {
      agencyName,
      agencyType,
      ownerName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
      description,
      website,
    } = body;

    agencyName = sanitizeInput(agencyName);
    agencyType = sanitizeInput(agencyType);
    ownerName = sanitizeInput(ownerName);
    gstNumber = sanitizeInput(gstNumber);
    panNumber = sanitizeInput(panNumber);
    address = sanitizeInput(address);
    city = sanitizeInput(city);
    state = sanitizeInput(state);
    pincode = sanitizeInput(pincode);
    description = sanitizeInput(description);
    website = sanitizeInput(website);

    if (agencyName !== undefined && !agencyName.trim()) {
      return NextResponse.json({ error: 'Agency name is required' }, { status: 400 });
    }
    if (ownerName !== undefined && !ownerName.trim()) {
      return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (agencyName !== undefined) updateData.agencyName = agencyName.trim();
    if (agencyType !== undefined) updateData.agencyType = agencyType || null;
    if (ownerName !== undefined) updateData.ownerName = ownerName.trim();
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber?.toUpperCase() || null;
    if (panNumber !== undefined) updateData.panNumber = panNumber?.toUpperCase() || null;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (pincode !== undefined) updateData.pincode = pincode || null;
    if (description !== undefined) updateData.description = description || null;
    if (website !== undefined) updateData.website = website || null;

    const updated = await prisma.travel_agents.update({
      where: { id: travelAgentId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        agencyName: true,
        agencyType: true,
        ownerName: true,
        gstNumber: true,
        panNumber: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        description: true,
        website: true,
        status: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    logger.error('Update travel agent profile error', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error?.message },
      { status: 500 },
    );
  }
}
