// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// POST /api/wander/groups/[groupCode]/nudge — Admin nudges MAYBE members on all PLANNING trips
export async function POST(
  request: NextRequest,
  { params }: { params: { groupCode: string } }
) {
  try {
    const body = await request.json();
    const { adminMemberId } = body;

    if (!adminMemberId) {
      return NextResponse.json({ error: 'adminMemberId is required' }, { status: 400 });
    }

    // Find group with members (including fcmToken)
    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: {
        members: {
          include: {
            customer: { select: { id: true, fcmToken: true } },
          },
        },
      },
    });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify admin
    const adminMember = (group.members || []).find(
      (m: any) => m.id === adminMemberId && m.role === 'ADMIN'
    );
    if (!adminMember) {
      return NextResponse.json({ error: 'Only an admin can nudge members' }, { status: 403 });
    }

    // Find all PLANNING trips for this group
    const planningTrips = await (prisma as any).wander_group_trips.findMany({
      where: { groupId: group.id, status: 'PLANNING' },
      include: {
        tripMembers: {
          where: { isGoing: 'MAYBE' },
          include: {
            groupMember: {
              include: {
                customer: { select: { id: true, fcmToken: true } },
              },
            },
          },
        },
      },
    });

    if (planningTrips.length === 0) {
      return NextResponse.json({ success: true, nudgedCount: 0 });
    }

    // Collect unique members to nudge (across all planning trips)
    const nudgedMemberMap: Map<string, { fcmToken: string | null; customerId: string | null }> =
      new Map();

    for (const trip of planningTrips) {
      for (const tripMember of trip.tripMembers || []) {
        const gm = tripMember.groupMember;
        if (!gm || gm.id === adminMemberId) continue;
        if (!nudgedMemberMap.has(gm.id)) {
          nudgedMemberMap.set(gm.id, {
            fcmToken: gm.customer?.fcmToken || null,
            customerId: gm.customerId || null,
          });
        }
      }
    }

    if (nudgedMemberMap.size === 0) {
      return NextResponse.json({ success: true, nudgedCount: 0 });
    }

    // Gather FCM tokens and send push notifications
    const tokens: string[] = [];
    for (const info of nudgedMemberMap.values()) {
      if (info.fcmToken) tokens.push(info.fcmToken);
    }

    const notifTitle = `Don't forget to decide! 👀`;
    const notifBody = `You still have trips to confirm in the "${group.name}" group. Let your crew know if you're in!`;
    const notifData = { groupCode: params.groupCode, type: 'GROUP_NUDGE' };

    if (tokens.length > 0) {
      try {
        const { sendMulticastNotification } = await import(
          '@/lib/services/push-notification-service'
        );
        await sendMulticastNotification(tokens, { title: notifTitle, body: notifBody }, notifData);
      } catch (pushErr) {
        console.error('[Nudge push notification error]', pushErr);
      }
    }

    // Save notifications to DB for each nudged customer
    const notificationRows: any[] = [];
    for (const info of nudgedMemberMap.values()) {
      if (info.customerId) {
        notificationRows.push({
          customerId: info.customerId,
          type: 'GROUP_NUDGE',
          title: notifTitle,
          body: notifBody,
          bookingId: params.groupCode,
        });
      }
    }

    if (notificationRows.length > 0) {
      await prisma.notifications.createMany({
        data: notificationRows,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, nudgedCount: nudgedMemberMap.size });
  } catch (error) {
    console.error('[Wander Nudge POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
