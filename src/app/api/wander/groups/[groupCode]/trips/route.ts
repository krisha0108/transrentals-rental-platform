// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// POST /api/wander/groups/[groupCode]/trips — Propose a new trip within the group
export async function POST(request: NextRequest, { params }: { params: { groupCode: string } }) {
  try {
    const body = await request.json();
    const { listingId, travelDate, note, proposedByMemberId } = body;

    if (!proposedByMemberId) return NextResponse.json({ error: 'Member ID required' }, { status: 400 });

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: { members: true },
    });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Verify proposer is a group member
    const proposer = group.members.find(m => m.id === proposedByMemberId);
    if (!proposer) return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });

    // Create the trip
    const trip = await (prisma as any).wander_group_trips.create({
      data: {
        groupId: group.id,
        listingId: listingId || null,
        proposedById: proposedByMemberId,
        travelDate: travelDate ? new Date(travelDate) : null,
        note: note?.trim() || null,
        status: 'PLANNING',
        // Add ALL current members as MAYBE (proposer as YES)
        tripMembers: {
          create: group.members.map(m => ({
            groupMemberId: m.id,
            isGoing: m.id === proposedByMemberId ? 'YES' : 'MAYBE',
          })),
        },
      },
      include: {
        tripMembers: true,
        listing: { select: { id: true, title: true, duration: true } },
      },
    });

    return NextResponse.json({ success: true, trip }, { status: 201 });
  } catch (error) {
    console.error('[Wander Group Trips POST]', error);
    return NextResponse.json({ error: 'Failed to propose trip' }, { status: 500 });
  }
}
