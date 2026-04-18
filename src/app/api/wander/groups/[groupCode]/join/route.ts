// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// POST /api/wander/groups/[groupCode]/join
export async function POST(request: NextRequest, { params }: { params: { groupCode: string } }) {
  try {
    const body = await request.json();
    const { name, phone, email, password, customerId } = body;

    if (!name?.trim())  return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    // email+password required only if NOT already logged in (no customerId)
    const needsAccount = !customerId && !email?.trim();
    if (needsAccount) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const group = await (prisma as any).wander_friend_groups.findUnique({
      where: { groupCode: params.groupCode },
      include: { members: true, trips: { where: { status: 'PLANNING' } } },
    });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Enforce max members limit
    if (group.maxMembers && group.members.length >= group.maxMembers) {
      return NextResponse.json({ error: `This group is full (max ${group.maxMembers} members)` }, { status: 400 });
    }

    // Already a member by phone
    const existing = group.members.find(m => m.phone === phone.trim());
    if (existing) {
      return NextResponse.json({ success: true, memberId: existing.id, alreadyMember: true });
    }

    // ── Create or resolve customer account ─────────────────────────────────
    let resolvedCustomerId = customerId || null;
    let customerData: any = null;

    if (resolvedCustomerId) {
      // Already logged in — just verify the customer exists
      const existingCust = await prisma.customers.findUnique({ where: { id: resolvedCustomerId } });
      if (!existingCust) resolvedCustomerId = null; // safety fallback
    }

    if (!resolvedCustomerId && email?.trim() && password?.trim()) {
      // New user — create account
      const emailExists = await prisma.customers.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (emailExists) {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const customId = `CUST-${Date.now()}`;
      const newCustomer = await prisma.customers.create({
        data: {
          id: customId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          isActive: true,
        },
      });
      resolvedCustomerId = newCustomer.id;
      customerData = {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
      };
    } else if (!resolvedCustomerId) {
      // Try to find by phone
      const found = await prisma.customers.findFirst({ where: { phone: phone.trim() } });
      resolvedCustomerId = found?.id || null;
    }

    // ── Create group member ─────────────────────────────────────────────────
    const member = await (prisma as any).wander_friend_group_members.create({
      data: {
        groupId: group.id,
        customerId: resolvedCustomerId,
        name: name.trim(),
        phone: phone.trim(),
        role: 'MEMBER',
      },
    });

    // Auto-add MAYBE to all PLANNING trips
    if (group.trips.length > 0) {
      await (prisma as any).wander_group_trip_members.createMany({
        data: group.trips.map(trip => ({
          groupTripId: trip.id,
          groupMemberId: member.id,
          isGoing: 'MAYBE',
        })),
        skipDuplicates: true,
      });
    }

    // Notify admin that someone joined — push + save to DB
    try {
      const admin = group.members.find((m: any) => m.role === 'ADMIN');
      if (admin?.customerId) {
        const notifTitle = `${group.name} — New Member 🎉`;
        const notifBody = `${name.trim()} just joined the group!`;
        const adminCustomer = await prisma.customers.findUnique({
          where: { id: admin.customerId },
          select: { fcmToken: true },
        });
        if (adminCustomer?.fcmToken) {
          const { sendPushNotification } = await import('@/lib/services/push-notification-service');
          await sendPushNotification(adminCustomer.fcmToken, { title: notifTitle, body: notifBody }, { type: 'GROUP_JOIN', groupCode: params.groupCode });
        }
        await prisma.notifications.create({
          data: { customerId: admin.customerId, title: notifTitle, body: notifBody, type: 'GROUP_JOIN', bookingId: params.groupCode },
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      memberId: member.id,
      groupName: group.name,
      activeTrips: group.trips.length,
      customer: customerData, // non-null only if account was created
    }, { status: 201 });
  } catch (error) {
    console.error('[Wander Group Join POST]', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
