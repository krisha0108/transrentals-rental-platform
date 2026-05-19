// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { onInvoiceGenerated } from '@/lib/utils/b2b-notification-helper';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-B2B-${year}${month}-${random}`;
}

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (bookingId) whereClause.bookingId = bookingId;
    if (customerId) {
      whereClause.booking = { customerId };
    }
    if (status && status !== 'all') whereClause.status = status;

    const [invoices, total] = await Promise.all([
      prisma.b2b_invoices.findMany({
        where: whereClause,
        include: {
          booking: {
            select: { bookingNumber: true, companyName: true, serviceType: true, customerId: true }
          },
          generatedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.b2b_invoices.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      status: 'success', invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('B2B Invoice GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST - Manager generates invoice for a completed booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, dueDate, notes } = body;

    if (!bookingId || !dueDate) {
      return NextResponse.json({ error: 'bookingId and dueDate are required' }, { status: 400 });
    }

    const booking = await prisma.b2b_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { name: true, email: true, phone: true, companyName: true } },
        trips: { select: { status: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'B2B booking not found' }, { status: 404 });
    }
    if (!['COMPLETED', 'IN_PROGRESS', 'TRIPS_CREATED'].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot generate invoice for booking in ${booking.status} status` }, { status: 400 });
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.b2b_invoices.findFirst({
      where: { bookingId, status: { not: 'CANCELLED' } },
    });
    if (existingInvoice) {
      return NextResponse.json({ error: 'Invoice already exists for this booking', invoiceId: existingInvoice.id }, { status: 400 });
    }

    const tripsCompleted = booking.trips.filter(t => t.status === 'COMPLETED').length;
    const vendorCostTotal = booking.vendorCostTotal || 0;
    const companyMargin = booking.companyMargin || 0;
    const totalAmount = vendorCostTotal + companyMargin;

    const invoiceId = generateId();
    const invoiceNumber = generateInvoiceNumber();

    // CUSTOM_BULK bookings allow null companyName (individual event organisers).
    // For those, prefer the occasion name stored inside bulkBreakdown so the
    // invoice shows e.g. "Sharma Wedding" instead of the customer's personal name.
    let occasionName: string | null = null;
    if (booking.serviceType === 'CUSTOM_BULK' && (booking as any).bulkBreakdown) {
      try {
        const parsed = JSON.parse((booking as any).bulkBreakdown);
        occasionName = parsed?.occasion_name || null;
      } catch { /* ignore malformed JSON */ }
    }

    const resolvedCompanyName =
      booking.companyName ||
      booking.customer?.companyName ||
      occasionName ||
      booking.customerName ||
      booking.customer?.name ||
      'Unknown Company';

    const invoice = await prisma.b2b_invoices.create({
      data: {
        id: invoiceId,
        invoiceNumber,
        bookingId,
        companyName: resolvedCompanyName,
        customerEmail: booking.customerEmail || booking.customer?.email,
        customerPhone: booking.customerPhone || booking.customer?.phone,
        totalVehicles: booking.vehiclesRequired,
        tripsCompleted,
        vendorCostTotal,
        companyMargin,
        subtotal: totalAmount,
        gstPercent: 0,
        gstAmount: 0,
        totalAmount,
        dueDate: new Date(dueDate),
        status: 'GENERATED',
        generatedById: session.user.id,
        notes: notes || null,
      },
    });

    // Update booking status
    await prisma.b2b_bookings.update({
      where: { id: bookingId },
      data: { status: 'INVOICED' },
    });

    // Notify customer about invoice
    onInvoiceGenerated({
      invoiceNumber,
      bookingId,
      bookingNumber: booking.bookingNumber,
      totalAmount,
      customerId: booking.customerId,
      serviceType: booking.serviceType,
    }).catch(e => console.error('Invoice notification error:', e));

    return NextResponse.json({
      status: 'success',
      message: 'Invoice generated successfully',
      invoice: {
        id: invoiceId,
        invoiceNumber,
        totalAmount,
        dueDate,
        tripsCompleted,
      },
    });
  } catch (error: any) {
    console.error('B2B Invoice POST error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
