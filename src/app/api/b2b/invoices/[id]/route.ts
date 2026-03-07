// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Get single invoice with booking details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.b2b_invoices.findUnique({
      where: { id: params.id },
      include: {
        booking: {
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true, companyName: true, gstin: true }
            },
            trips: {
              select: {
                id: true, tripCode: true, status: true, vehicleName: true, vehicleNumber: true, driverName: true, driverPhone: true,
                vehicle: {
                  select: {
                    vehicleName: true, registrationNumber: true,
                    vehicle_models: { select: { name: true } },
                    brands: { select: { name: true } },
                  }
                },
                driver: { select: { name: true, phone: true } },
                vendor: { select: { businessName: true } },
              }
            },
            vendorQuotes: {
              where: { status: 'CONFIRMED' },
              select: { id: true, vehicleCount: true, totalPrice: true, vendor: { select: { businessName: true } } }
            },
          }
        },
        generatedBy: { select: { name: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', invoice });
  } catch (error: any) {
    console.error('Invoice detail GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// PATCH - Update invoice (mark as paid, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, paymentId, transactionRef, paidAmount } = body;

    const invoice = await prisma.b2b_invoices.findUnique({ where: { id: params.id } });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (action === 'mark_paid') {
      await prisma.$transaction(async (tx) => {
        await tx.b2b_invoices.update({
          where: { id: params.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paidAmount: paidAmount || invoice.totalAmount,
            paymentMethod: 'RAZORPAY',
            transactionRef: transactionRef || paymentId || null,
          },
        });
        await tx.b2b_bookings.update({
          where: { id: invoice.bookingId },
          data: { status: 'PAID' },
        });
      });

      return NextResponse.json({ status: 'success', message: 'Invoice marked as paid' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Invoice PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
