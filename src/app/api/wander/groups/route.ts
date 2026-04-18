// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Generate a unique 6-char group code
async function generateGroupCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    code = `GANG-${code}`;
    const found = await (prisma as any).wander_friend_groups.findUnique({ where: { groupCode: code } });
    exists = !!found;
  }
  return code;
}

// POST /api/wander/groups — Create a new friends group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, createdById, creatorName, creatorPhone, listingId, travelDate, tripNote } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    if (!creatorName?.trim()) return NextResponse.json({ error: 'Your name is required' }, { status: 400 });
    if (!creatorPhone?.trim()) return NextResponse.json({ error: 'Your phone is required' }, { status: 400 });

    // Resolve or create customer
    let customerId = createdById || null;
    if (!customerId) {
      const existing = await prisma.customers.findFirst({ where: { phone: creatorPhone.trim() } });
      customerId = existing?.id || null;
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Please login to create a group' }, { status: 401 });
    }

    const groupCode = await generateGroupCode();

    // Create group + add creator as ADMIN member in one transaction
    const group = await (prisma as any).wander_friend_groups.create({
      data: {
        groupCode,
        name: name.trim(),
        createdById: customerId,
        members: {
          create: {
            customerId,
            name: creatorName.trim(),
            phone: creatorPhone.trim(),
            role: 'ADMIN',
          },
        },
        // Optionally create first trip proposal if listing provided
        ...(listingId ? {
          trips: {
            create: {
              listingId,
              proposedById: 'PENDING', // will update after member created
              travelDate: travelDate ? new Date(travelDate) : null,
              note: tripNote?.trim() || null,
              status: 'PLANNING',
            },
          },
        } : {}),
      },
      include: {
        members: true,
        trips: true,
      },
    });

    // Fix proposedById to the creator's member id
    if (listingId && group.trips?.length > 0) {
      const creatorMember = group.members.find(m => m.role === 'ADMIN');
      if (creatorMember) {
        await (prisma as any).wander_group_trips.update({
          where: { id: group.trips[0].id },
          data: { proposedById: creatorMember.id },
        });
        // Add creator as trip member (YES — they're proposing it)
        await (prisma as any).wander_group_trip_members.create({
          data: {
            groupTripId: group.trips[0].id,
            groupMemberId: creatorMember.id,
            isGoing: 'YES',
          },
        });
      }
    }

    const adminMember = group.members.find((m: any) => m.role === 'ADMIN');
    return NextResponse.json({
      success: true,
      groupCode: group.groupCode,
      groupId: group.id,
      memberId: adminMember?.id || null,
      tripId: group.trips?.[0]?.id || null,
    }, { status: 201 });
  } catch (error) {
    console.error('[Wander Groups POST]', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
