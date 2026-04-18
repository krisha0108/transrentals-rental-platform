// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Helper: load group with members (including fcmToken) by groupCode
async function loadGroup(groupCode: string) {
  return (prisma as any).wander_friend_groups.findUnique({
    where: { groupCode },
    include: {
      members: {
        include: {
          customer: { select: { id: true, fcmToken: true } },
        },
      },
    },
  });
}

// Helper: send push + save db notifications to all group members (optionally excluding one)
async function notifyAllMembers(
  group: any,
  excludeMemberId: string | null,
  title: string,
  body: string,
  data: Record<string, string>
) {
  try {
    const eligible = (group.members || []).filter(
      (m: any) => m.id !== excludeMemberId && m.customer?.fcmToken
    );
    const tokens = eligible.map((m: any) => m.customer.fcmToken);

    if (tokens.length > 0) {
      const { sendMulticastNotification } = await import('@/lib/services/push-notification-service');
      await sendMulticastNotification(tokens, { title, body }, data);
    }

    // Persist notifications to DB for all members (excluding sender)
    const customerIds = (group.members || [])
      .filter((m: any) => m.id !== excludeMemberId && m.customerId)
      .map((m: any) => ({ customerId: m.customerId }));

    if (customerIds.length > 0) {
      await prisma.notifications.createMany({
        data: customerIds.map((c: any) => ({
          customerId: c.customerId,
          type: 'GROUP_UPDATE',
          title,
          body,
          bookingId: group.groupCode,
          data: JSON.stringify(data),
          isRead: false,
        })),
        skipDuplicates: true,
      });
    }
  } catch (err) {
    console.error('[notifyAllMembers]', err);
  }
}

// POST /api/wander/groups/[groupCode]/trips/[tripId]/manage?action=cancel
// POST /api/wander/groups/[groupCode]/trips/[tripId]/manage?action=pin-date
// PATCH /api/wander/groups/[groupCode]/trips/[tripId]/manage?action=change-tour
export async function POST(
  request: NextRequest,
  { params }: { params: { groupCode: string; tripId: string } }
) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    const group = await loadGroup(params.groupCode);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const trip = await (prisma as any).wander_group_trips.findFirst({
      where: { id: params.tripId, groupId: group.id },
    });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // ── action=cancel ──────────────────────────────────────────────────────────
    if (action === 'cancel') {
      const { memberId } = body;
      if (!memberId) {
        return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
      }

      const requestingMember = (group.members || []).find((m: any) => m.id === memberId);
      if (!requestingMember) {
        return NextResponse.json({ error: 'Member not found in group' }, { status: 403 });
      }

      const isAdmin = requestingMember.role === 'ADMIN';
      const isProposer = trip.proposedById === memberId;

      if (!isAdmin && !isProposer) {
        return NextResponse.json(
          { error: 'Only the group admin or trip proposer can cancel this trip' },
          { status: 403 }
        );
      }

      await (prisma as any).wander_group_trips.update({
        where: { id: trip.id },
        data: { status: 'CANCELLED' },
      });

      await notifyAllMembers(
        group,
        memberId,
        'Trip Cancelled',
        `A trip in your Wander group "${group.name}" has been cancelled.`,
        { groupCode: params.groupCode, tripId: params.tripId, action: 'cancel' }
      );

      return NextResponse.json({ success: true });
    }

    // ── action=pin-date ────────────────────────────────────────────────────────
    if (action === 'pin-date') {
      const { memberId, optionId } = body;
      if (!memberId || !optionId) {
        return NextResponse.json({ error: 'memberId and optionId are required' }, { status: 400 });
      }

      const requestingMember = (group.members || []).find((m: any) => m.id === memberId);
      if (!requestingMember || requestingMember.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only the group admin can pin a date' }, { status: 403 });
      }

      // Find the date option
      const dateOption = await (prisma as any).wander_trip_date_options.findFirst({
        where: { id: optionId, tripId: trip.id },
      });
      if (!dateOption) {
        return NextResponse.json({ error: 'Date option not found' }, { status: 404 });
      }

      const updatedTrip = await (prisma as any).wander_group_trips.update({
        where: { id: trip.id },
        data: { travelDate: dateOption.date },
      });

      await notifyAllMembers(
        group,
        memberId,
        'Travel Date Pinned!',
        `The travel date for your Wander group "${group.name}" has been set.`,
        { groupCode: params.groupCode, tripId: params.tripId, action: 'pin-date' }
      );

      return NextResponse.json({ success: true, travelDate: updatedTrip.travelDate });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[Wander Trip Manage POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}

// PATCH /api/wander/groups/[groupCode]/trips/[tripId]/manage?action=change-tour
export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupCode: string; tripId: string } }
) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    if (action !== 'change-tour') {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { memberId, listingId, listingTitle } = body;
    if (!memberId || !listingId) {
      return NextResponse.json({ error: 'memberId and listingId are required' }, { status: 400 });
    }

    const group = await loadGroup(params.groupCode);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const trip = await (prisma as any).wander_group_trips.findFirst({
      where: { id: params.tripId, groupId: group.id },
    });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const requestingMember = (group.members || []).find((m: any) => m.id === memberId);
    if (!requestingMember) {
      return NextResponse.json({ error: 'Member not found in group' }, { status: 403 });
    }

    const isAdmin = requestingMember.role === 'ADMIN';
    const isProposer = trip.proposedById === memberId;

    if (!isAdmin && !isProposer) {
      return NextResponse.json(
        { error: 'Only the group admin or trip proposer can change the tour' },
        { status: 403 }
      );
    }

    if (trip.status !== 'PLANNING') {
      return NextResponse.json(
        { error: 'Tour can only be changed while the trip is in PLANNING status' },
        { status: 400 }
      );
    }

    await (prisma as any).wander_group_trips.update({
      where: { id: trip.id },
      data: { listingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Wander Trip Manage PATCH]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
