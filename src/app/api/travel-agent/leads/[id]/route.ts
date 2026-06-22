import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_STATUS = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'QUOTED',
  'NEGOTIATING',
  'BOOKED',
  'LOST',
  'COLD',
];
const VALID_PRIORITY = ['HOT', 'WARM', 'COLD'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.travel_agent_leads.findUnique({
      where: { id },
      include: {
        travel_agent_lead_notes: {
          orderBy: { createdAt: 'desc' },
        },
        capture_link: {
          select: { id: true, slug: true, title: true },
        },
      },
    });

    if (!lead || lead.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Resolve source tour if tourId is set
    const sourceTour = lead.tourId
      ? await prisma.travel_agent_tours.findUnique({
          where: { id: lead.tourId },
          select: { id: true, title: true, slug: true, coverImage: true },
        }).catch(() => null)
      : null;

    const { travel_agent_lead_notes, capture_link, ...rest } = lead;
    return NextResponse.json({
      ...rest,
      notes: travel_agent_lead_notes,
      captureLink: capture_link,
      sourceTour,
    });
  } catch (error: any) {
    logger.error('Get travel agent lead error', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead', details: error?.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.travel_agent_leads.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
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
      estimatedValue,
      quotedAmount,
      quoteAdvanceAmount,
      quoteAdvancePercent,
      quoteValidUntil,
      quoteTerms,
      quoteSentAt,
      paymentAction, // 'VERIFY' | 'REJECT'
      paymentRejectReason,
      status,
      priority,
      assignedToName,
      nextFollowUp,
      lastContactAt,
      lostReason,
      addNote,
      tourId,
    } = body;

    const updateData: any = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail || null;
    if (tripType !== undefined) updateData.tripType = tripType || null;
    if (pickupLocation !== undefined) updateData.pickupLocation = pickupLocation || null;
    if (dropLocation !== undefined) updateData.dropLocation = dropLocation || null;
    if (destination !== undefined) updateData.destination = destination || null;
    if (travelDate !== undefined) updateData.travelDate = travelDate ? new Date(travelDate) : null;
    if (returnDate !== undefined) updateData.returnDate = returnDate ? new Date(returnDate) : null;
    if (passengers !== undefined) updateData.passengers = passengers ? Number(passengers) : 1;
    if (requirement !== undefined) updateData.requirement = requirement || null;
    if (estimatedValue !== undefined)
      updateData.estimatedValue = estimatedValue ? Number(estimatedValue) : null;
    if (quotedAmount !== undefined)
      updateData.quotedAmount = quotedAmount ? Number(quotedAmount) : null;
    if (quoteAdvanceAmount !== undefined)
      updateData.quoteAdvanceAmount =
        quoteAdvanceAmount === null || quoteAdvanceAmount === ''
          ? null
          : Number(quoteAdvanceAmount);
    if (quoteAdvancePercent !== undefined)
      updateData.quoteAdvancePercent =
        quoteAdvancePercent === null || quoteAdvancePercent === ''
          ? null
          : Math.max(0, Math.min(100, Math.round(Number(quoteAdvancePercent))));
    if (quoteValidUntil !== undefined)
      updateData.quoteValidUntil = quoteValidUntil ? new Date(quoteValidUntil) : null;
    if (quoteTerms !== undefined) updateData.quoteTerms = quoteTerms || null;
    if (quoteSentAt !== undefined)
      updateData.quoteSentAt = quoteSentAt ? new Date(quoteSentAt) : new Date();
    if (status !== undefined && VALID_STATUS.includes(status)) updateData.status = status;
    if (priority !== undefined && VALID_PRIORITY.includes(priority))
      updateData.priority = priority;
    if (assignedToName !== undefined) updateData.assignedToName = assignedToName || null;
    if (nextFollowUp !== undefined)
      updateData.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : null;
    if (lastContactAt !== undefined)
      updateData.lastContactAt = lastContactAt ? new Date(lastContactAt) : new Date();
    if (lostReason !== undefined) updateData.lostReason = lostReason || null;
    if (tourId !== undefined) updateData.tourId = tourId || null;

    // Payment verification action — sets verifiedAt + paymentStatus + (optionally) status=BOOKED
    if (paymentAction === 'VERIFY') {
      updateData.paymentStatus = 'VERIFIED';
      updateData.paymentVerifiedAt = new Date();
      updateData.paymentRejectReason = null;
      if (!updateData.status) updateData.status = 'BOOKED';
    } else if (paymentAction === 'REJECT') {
      updateData.paymentStatus = 'REJECTED';
      updateData.paymentRejectReason = paymentRejectReason || 'Payment could not be verified.';
    }

    // Atomically update the lead and (optionally) append a status-change note
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.travel_agent_leads.update({ where: { id }, data: updateData });

      const notes: { note: string }[] = [];
      if (status && status !== existing.status && VALID_STATUS.includes(status)) {
        notes.push({
          note: `Status changed: ${existing.status} → ${status}${
            lostReason ? ` (Reason: ${lostReason})` : ''
          }`,
        });
      }
      if (typeof addNote === 'string' && addNote.trim()) {
        notes.push({ note: addNote.trim() });
      }
      if (paymentAction === 'VERIFY') {
        notes.push({ note: '✅ Payment verified by agent.' });
      } else if (paymentAction === 'REJECT') {
        notes.push({
          note: `❌ Payment rejected${paymentRejectReason ? `: ${paymentRejectReason}` : ''}.`,
        });
      }
      for (const n of notes) {
        await tx.travel_agent_lead_notes.create({
          data: { leadId: id, note: n.note },
        });
      }

      return u;
    });

    return NextResponse.json({ lead: updated });
  } catch (error: any) {
    logger.error('Update travel agent lead error', error);
    return NextResponse.json(
      { error: 'Failed to update lead', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.travel_agent_leads.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await prisma.travel_agent_leads.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete travel agent lead error', error);
    return NextResponse.json(
      { error: 'Failed to delete lead', details: error?.message },
      { status: 500 },
    );
  }
}
