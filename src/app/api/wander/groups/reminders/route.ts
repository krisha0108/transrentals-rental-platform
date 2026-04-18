// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/wander/groups/reminders — Called by cron job or manually
// Sends push notifications to members who haven't responded to PLANNING trips older than 48 hours
export async function GET(_req: NextRequest) {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    const pendingTrips = await (prisma as any).wander_group_trips.findMany({
      where: {
        status: 'PLANNING',
        createdAt: { lte: cutoff },
      },
      include: {
        group: { select: { name: true, groupCode: true } },
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
        listing: { select: { title: true } },
      },
    });

    let notified = 0;
    const { sendPushNotification } = await import('@/lib/services/push-notification-service');

    for (const trip of pendingTrips) {
      for (const tm of trip.tripMembers) {
        const token = tm.groupMember?.customer?.fcmToken;
        if (!token) continue;
        try {
          await sendPushNotification(
            token,
            {
              title: `${trip.group.name} — Reminder ⏰`,
              body: `Have you decided? Let the group know if you're going on "${trip.listing?.title || 'the trip'}"`,
            },
            { type: 'GROUP_REMINDER', groupCode: trip.group.groupCode }
          );
          notified++;
        } catch {}
      }
    }

    return NextResponse.json({ success: true, tripsChecked: pendingTrips.length, notified });
  } catch (error) {
    console.error('[Wander Reminders]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
