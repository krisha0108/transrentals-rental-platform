// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/wander/groups/[groupCode] — Public: get group details + trips + members
export async function GET(_req: NextRequest, { params }: { params: { groupCode: string } }) {
  try {
    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: {
        members: {
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true, name: true, phone: true, role: true, joinedAt: true,
            customerId: true, lastReadAt: true,
            customer: { select: { id: true, fcmToken: true } },
          },
        },
        trips: {
          orderBy: { createdAt: 'desc' },
          include: {
            listing: {
              select: {
                id: true, title: true, slug: true, duration: true,
                images: true, basePrice: true, priceType: true, priceTiers: true,
                mainLocation: { select: { name: true } },
              },
            },
            tripMembers: {
              include: {
                groupMember: { select: { id: true, name: true, phone: true, role: true } },
              },
            },
            dateOptions: {
              orderBy: { date: 'asc' },
              include: {
                votes: {
                  include: { member: { select: { id: true, name: true } } },
                },
                addedBy: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // For SUBMITTED trips, attach quote request details + vendor quotes
    const tripsWithQuote = await Promise.all(
      group.trips.map(async (trip: any) => {
        if (trip.status === 'SUBMITTED' && trip.quoteRequestId) {
          const [qr, quotes] = await Promise.all([
            (prisma as any).wander_quote_requests.findUnique({
              where: { id: trip.quoteRequestId },
              select: { requestId: true, status: true, groupSize: true, travelDate: true },
            }),
            (prisma as any).wander_quotes.findMany({
              where: { quoteRequestId: trip.quoteRequestId },
              include: { vendor: { select: { businessName: true, logo: true } } },
              orderBy: { createdAt: 'asc' },
            }),
          ]);
          return { ...trip, quoteRequest: qr || null, quotes };
        }
        return { ...trip, quoteRequest: null, quotes: [] };
      })
    );

    return NextResponse.json({ group: { ...group, trips: tripsWithQuote } });
  } catch (error) {
    console.error('[Wander Group GET]', error);
    return NextResponse.json({ error: 'Failed to load group' }, { status: 500 });
  }
}

// PATCH /api/wander/groups/[groupCode] — Update group name/emoji (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { groupCode: string } }) {
  try {
    const body = await request.json();
    const { memberId, name, emoji, maxMembers } = body;

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = await (prisma as any).wander_friend_group_members.findFirst({
      where: { id: memberId, groupId: group.id, role: 'ADMIN' },
    });
    if (!member) return NextResponse.json({ error: 'Only admin can update group' }, { status: 403 });

    const updated = await (prisma as any).wander_friend_groups.update({
      where: { id: group.id },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(emoji ? { emoji } : {}),
        ...(maxMembers !== undefined ? { maxMembers: maxMembers ? parseInt(maxMembers) : null } : {}),
      },
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error) {
    console.error('[Wander Group PATCH]', error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
