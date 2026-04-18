// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/wander/groups/[groupCode]/trips/[tripId]/dates — get date options + votes
export async function GET(_req: NextRequest, { params }: { params: { groupCode: string; tripId: string } }) {
  try {
    const options = await (prisma as any).wander_trip_date_options.findMany({
      where: { tripId: params.tripId },
      orderBy: { date: 'asc' },
      include: {
        votes: {
          include: { member: { select: { id: true, name: true } } },
        },
        addedBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ options });
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}

// POST /api/wander/groups/[groupCode]/trips/[tripId]/dates
// action=add   body: { memberId, date }           → add a date option
// action=vote  body: { memberId, optionId }        → toggle vote on an option
export async function POST(request: NextRequest, { params }: { params: { groupCode: string; tripId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'add' | 'vote'
    const body = await request.json();
    const { memberId, date, optionId } = body;

    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      select: { id: true },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = await (prisma as any).wander_friend_group_members.findFirst({
      where: { id: memberId, groupId: group.id },
    });
    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

    // ── ADD DATE OPTION ──────────────────────────────────────────────────────
    if (action === 'add') {
      if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

      // Check duplicate
      const existing = await (prisma as any).wander_trip_date_options.findFirst({
        where: { tripId: params.tripId, date: new Date(date) },
      });
      if (existing) return NextResponse.json({ error: 'Date already suggested' }, { status: 400 });

      const option = await (prisma as any).wander_trip_date_options.create({
        data: { tripId: params.tripId, date: new Date(date), addedById: memberId },
        include: { votes: true },
      });
      return NextResponse.json({ success: true, option });
    }

    // ── TOGGLE VOTE ──────────────────────────────────────────────────────────
    if (action === 'vote') {
      if (!optionId) return NextResponse.json({ error: 'optionId required' }, { status: 400 });

      const existingVote = await (prisma as any).wander_trip_date_votes.findUnique({
        where: { optionId_memberId: { optionId, memberId } },
      });

      if (existingVote) {
        await (prisma as any).wander_trip_date_votes.delete({ where: { id: existingVote.id } });
        return NextResponse.json({ success: true, voted: false });
      } else {
        await (prisma as any).wander_trip_date_votes.create({
          data: { optionId, memberId },
        });
        return NextResponse.json({ success: true, voted: true });
      }
    }

    return NextResponse.json({ error: 'Use ?action=add or ?action=vote' }, { status: 400 });
  } catch (error) {
    console.error('[Wander Dates POST]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
