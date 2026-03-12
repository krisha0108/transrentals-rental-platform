// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - List B2B customers (pending approvals + all B2B customers)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'pending', 'approved', 'rejected', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const whereClause: any = { isB2B: true };

    if (filter === 'pending') whereClause.b2bStatus = 'PENDING';
    else if (filter === 'approved') whereClause.b2bStatus = 'APPROVED';
    else if (filter === 'rejected') whereClause.b2bStatus = 'REJECTED';

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where: whereClause,
        select: {
          id: true, name: true, email: true, phone: true,
          companyName: true, gstin: true, businessType: true,
          companyAddress: true, companyPhone: true, companyEmail: true,
          b2bStatus: true, b2bApprovedAt: true, b2bRejectionReason: true,
          isActive: true, isBanned: true, createdAt: true,
          _count: { select: { b2b_bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.customers.count({ where: whereClause }),
    ]);

    // Pending count for badge
    const pendingCount = await prisma.customers.count({
      where: { isB2B: true, b2bStatus: 'PENDING' },
    });

    return NextResponse.json({
      status: 'success', customers, pendingCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Admin B2B GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch B2B customers' }, { status: 500 });
  }
}

// POST - Approve or reject B2B customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, action, reason } = body;
    // action: 'approve' | 'reject'

    if (!customerId || !action) {
      return NextResponse.json({ error: 'customerId and action are required' }, { status: 400 });
    }

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: { id: true, isB2B: true, b2bStatus: true, name: true, fcmToken: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    if (!customer.isB2B) {
      return NextResponse.json({ error: 'Customer is not a B2B customer' }, { status: 400 });
    }

    if (action === 'approve') {
      await prisma.customers.update({
        where: { id: customerId },
        data: {
          b2bStatus: 'APPROVED',
          b2bApprovedAt: new Date(),
          b2bApprovedById: session.user.id,
          b2bRejectionReason: null,
        },
      });

      // TODO: Send FCM notification to customer

      return NextResponse.json({
        status: 'success',
        message: `B2B access approved for ${customer.name}`,
      });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      await prisma.customers.update({
        where: { id: customerId },
        data: {
          b2bStatus: 'REJECTED',
          b2bApprovedById: session.user.id,
          b2bRejectionReason: reason,
        },
      });

      // TODO: Send FCM notification to customer

      return NextResponse.json({
        status: 'success',
        message: `B2B access rejected for ${customer.name}`,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin B2B POST error:', error);
    return NextResponse.json({ error: 'Failed to process B2B action' }, { status: 500 });
  }
}
