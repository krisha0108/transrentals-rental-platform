// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const body = await request.json();
    const { bookingType, bookingId, source = 'web' } = body;

    if (!bookingType || !bookingId) {
      return NextResponse.json({ error: 'bookingType and bookingId are required' }, { status: 400 });
    }

    await prisma.vendor_call_logs.create({
      data: {
        id: crypto.randomUUID(),
        vendorId: auth.vendorId,
        bookingType,
        bookingId,
        source,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log vendor call:', error);
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingType = searchParams.get('bookingType');
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    }

    const where: any = { bookingId };
    if (bookingType) where.bookingType = bookingType;

    const logs = await prisma.vendor_call_logs.findMany({
      where,
      include: {
        vendors: {
          select: { id: true, businessName: true, ownerName: true, phone: true },
        },
      },
      orderBy: { clickedAt: 'desc' },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch call logs:', error);
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 });
  }
}
