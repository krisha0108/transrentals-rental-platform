// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST - Create Razorpay order for invoice payment
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.b2b_invoices.findUnique({
      where: { id: params.id },
      include: { booking: { select: { companyName: true, bookingNumber: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(invoice.totalAmount * 100), // paise
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        bookingNumber: invoice.booking.bookingNumber,
        companyName: invoice.booking.companyName,
      },
    });

    return NextResponse.json({
      status: 'success',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        companyName: invoice.companyName,
        customerEmail: invoice.customerEmail,
        customerPhone: invoice.customerPhone,
      },
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
