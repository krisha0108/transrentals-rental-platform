// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { sendFCMNotification } from '@/lib/utils/fcm-helper';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
      return NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = await prisma.b2b_invoices.findUnique({
      where: { id: params.id },
      include: {
        booking: {
          select: {
            customerId: true,
            bookingNumber: true,
            serviceType: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ status: 'error', error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ status: 'error', error: 'Invoice is already paid' }, { status: 400 });
    }

    const customerId = invoice.booking?.customerId;
    if (!customerId) {
      return NextResponse.json({ status: 'error', error: 'Customer not found' }, { status: 404 });
    }

    const dueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'soon';

    const amount = invoice.totalAmount
      ? `₹${Number(invoice.totalAmount).toLocaleString('en-IN')}`
      : '';

    const title = invoice.status === 'OVERDUE'
      ? `⚠️ Overdue Invoice: ${invoice.invoiceNumber}`
      : `📋 Payment Reminder: ${invoice.invoiceNumber}`;

    const body = invoice.status === 'OVERDUE'
      ? `Your invoice ${invoice.invoiceNumber} of ${amount} was due on ${dueDate}. Please pay at the earliest to avoid service disruption.`
      : `Your invoice ${invoice.invoiceNumber} of ${amount} is due on ${dueDate}. Please pay on time.`;

    // Save DB notification
    await prisma.notifications.create({
      data: {
        customerId,
        title,
        body,
        type: 'b2b_invoice_reminder',
        serviceType: invoice.booking?.serviceType || 'car',
        bookingId: invoice.bookingId || null,
      },
    });

    // Send FCM push notification
    await sendFCMNotification({
      customerId,
      title,
      body,
      data: {
        screen: 'B2BInvoice',
        invoiceId: invoice.id,
        bookingId: invoice.bookingId || '',
        type: 'b2b_invoice_reminder',
      },
    });

    return NextResponse.json({ status: 'success', message: 'Reminder sent successfully' });
  } catch (e) {
    console.error('[Invoice Remind]', e);
    return NextResponse.json({ status: 'error', error: 'Failed to send reminder' }, { status: 500 });
  }
}
