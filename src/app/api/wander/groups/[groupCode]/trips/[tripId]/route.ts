// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// POST /api/wander/groups/[groupCode]/trips/[tripId]/respond — Member respond (YES/NO/MAYBE + requirements)
// POST /api/wander/groups/[groupCode]/trips/[tripId]/submit  — Leader submit quote request
// handled via ?action= query param

async function notifyGroupMembers(
  group: any,
  excludeMemberId: string,
  title: string,
  body: string,
  data: Record<string, string>
) {
  try {
    const tokens = (group.members || [])
      .filter((m: any) => m.id !== excludeMemberId && m.customer?.fcmToken)
      .map((m: any) => m.customer.fcmToken);
    if (tokens.length === 0) return;
    const { sendMulticastNotification } = await import('@/lib/services/push-notification-service');
    await sendMulticastNotification(tokens, { title, body }, data);
  } catch {}
}

export async function POST(
  request: NextRequest,
  { params }: { params: { groupCode: string; tripId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'respond' | 'submit'

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: {
        members: {
          include: { customer: { select: { id: true, fcmToken: true } } },
        },
      },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const trip = await (prisma as any).wander_group_trips.findFirst({
      where: { id: params.tripId, groupId: group.id },
      include: {
        tripMembers: {
          include: { groupMember: true },
        },
        listing: true,
      },
    });
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    // ── ACTION: respond ──────────────────────────────────────────────────────
    if (action === 'respond') {
      const body = await request.json();
      const { memberId, isGoing, requirements } = body;

      if (!memberId) return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
      if (!['YES', 'NO', 'MAYBE'].includes(isGoing)) {
        return NextResponse.json({ error: 'isGoing must be YES, NO, or MAYBE' }, { status: 400 });
      }

      const tripMember = trip.tripMembers.find(tm => tm.groupMemberId === memberId);
      if (!tripMember) return NextResponse.json({ error: 'You are not part of this trip' }, { status: 403 });

      await (prisma as any).wander_group_trip_members.update({
        where: { id: tripMember.id },
        data: {
          isGoing,
          requirements: requirements?.trim() || null,
          respondedAt: new Date(),
        },
      });

      // Notify admin about response
      const responder = group.members.find((m: any) => m.id === memberId);
      const admin = group.members.find((m: any) => m.role === 'ADMIN');
      if (admin && admin.id !== memberId) {
        const emoji = isGoing === 'YES' ? '✅' : isGoing === 'NO' ? '❌' : '🤔';
        await notifyGroupMembers(
          { members: group.members.filter((m: any) => m.role === 'ADMIN') },
          memberId,
          `${group.name} — Response`,
          `${emoji} ${responder?.name || 'Someone'} is ${isGoing === 'YES' ? 'going' : isGoing === 'NO' ? 'not going' : 'maybe going'}`,
          { type: 'GROUP_RESPOND', groupCode: params.groupCode }
        );
      }

      return NextResponse.json({ success: true, isGoing });
    }

    // ── ACTION: submit ───────────────────────────────────────────────────────
    if (action === 'submit') {
      const body = await request.json();
      const { memberId, travelDate, groupSize: bodyGroupSize, pickupLocation, extraRequirements } = body;

      if (trip.status === 'SUBMITTED') {
        return NextResponse.json({ error: 'Trip already submitted' }, { status: 400 });
      }

      // Only ADMIN or proposer can submit
      const member = await (prisma as any).wander_friend_group_members.findFirst({
        where: { id: memberId, groupId: group.id },
      });
      if (!member || (member.role !== 'ADMIN' && member.id !== trip.proposedById)) {
        return NextResponse.json({ error: 'Only group admin can submit' }, { status: 403 });
      }

      if (!trip.listingId) return NextResponse.json({ error: 'No tour selected for this trip' }, { status: 400 });

      // Count YES members
      const goingMembers = trip.tripMembers.filter(tm => tm.isGoing === 'YES');
      const groupSize = bodyGroupSize || goingMembers.length || 1;

      // Build combined requirements
      const combinedRequirements = goingMembers
        .filter(tm => tm.requirements)
        .map(tm => `${tm.groupMember.name}: ${tm.requirements}`)
        .join('\n');

      // Resolve/create customer for the leader
      let customer = null;
      if (member.customerId) {
        customer = await prisma.customers.findUnique({ where: { id: member.customerId } });
      }
      if (!customer) {
        customer = await prisma.customers.findFirst({ where: { phone: member.phone } });
      }
      if (!customer) {
        customer = await prisma.customers.create({
          data: {
            id: `CUST-${Date.now()}`,
            name: member.name,
            phone: member.phone,
            email: `${member.phone}@wander.local`,
            isActive: true,
          },
        });
      }

      // Generate requestId
      const count = await (prisma as any).wander_quote_requests.count();
      const requestId = `WND-REQ-${Date.now()}-${count + 1}`;

      // Create quote request
      const quoteRequest = await (prisma as any).wander_quote_requests.create({
        data: {
          requestId,
          wanderListingId: trip.listingId,
          customerId: customer.id,
          travelDate: travelDate ? new Date(travelDate) : (trip.travelDate || null),
          groupSize,
          pickupLocation: pickupLocation || null,
          requirements: [
            `GROUP BOOKING — ${group.name} (${groupSize} members going)`,
            `Group Code: ${group.groupCode}`,
            combinedRequirements ? `\nMember Requirements:\n${combinedRequirements}` : '',
            extraRequirements ? `\nAdditional Requirements:\n${extraRequirements}` : '',
          ].filter(Boolean).join('\n'),
          bookingFor: 'PERSONAL',
          status: 'PENDING',
        },
      });

      // Update trip status
      await (prisma as any).wander_group_trips.update({
        where: { id: trip.id },
        data: { status: 'SUBMITTED', quoteRequestId: quoteRequest.id },
      });

      // Notify all group members — push + save to DB
      const tourName = trip.listing?.title || 'your trip';
      const notifTitle = `${group.name} — Quote Submitted! 🎉`;
      const notifBody = `${member.name} submitted the group quote for ${tourName}. Vendors will respond soon.`;
      await notifyGroupMembers(group, memberId, notifTitle, notifBody, { type: 'GROUP_SUBMITTED', groupCode: params.groupCode });
      try {
        const otherMembers = group.members.filter((m: any) => m.id !== memberId && m.customer?.id);
        await prisma.notifications.createMany({
          data: otherMembers.map((m: any) => ({
            customerId: m.customer.id,
            title: notifTitle,
            body: notifBody,
            type: 'GROUP_SUBMITTED',
            bookingId: params.groupCode,
          })),
          skipDuplicates: true,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        requestId: quoteRequest.requestId,
        groupSize,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use ?action=respond or ?action=submit' }, { status: 400 });
  } catch (error) {
    console.error('[Wander Group Trip Action POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}

// DELETE /api/wander/groups/[groupCode]/trips/[tripId] — Admin removes a trip completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupCode: string; tripId: string } }
) {
  try {
    const body = await request.json();
    const { memberId } = body;
    if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 });

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: { members: true },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = group.members.find((m: any) => m.id === memberId);
    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

    const trip = await (prisma as any).wander_group_trips.findFirst({
      where: { id: params.tripId, groupId: group.id },
    });
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    // Only admin or proposer can delete; cannot delete SUBMITTED trips
    const isAdmin = member.role === 'ADMIN';
    const isProposer = trip.proposedById === memberId;
    if (!isAdmin && !isProposer) {
      return NextResponse.json({ error: 'Only the admin or trip proposer can remove this trip' }, { status: 403 });
    }
    if (trip.status === 'SUBMITTED') {
      return NextResponse.json({ error: 'Cannot delete a submitted trip' }, { status: 400 });
    }

    // Delete related records then trip (cascade handles most)
    await (prisma as any).wander_trip_date_votes.deleteMany({
      where: { option: { tripId: params.tripId } },
    });
    await (prisma as any).wander_trip_date_options.deleteMany({ where: { tripId: params.tripId } });
    await (prisma as any).wander_group_trip_members.deleteMany({ where: { groupTripId: params.tripId } });
    await (prisma as any).wander_group_trips.delete({ where: { id: params.tripId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Wander Group Trip DELETE]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
