// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const bookingType = searchParams.get('bookingType');

    if (!bookingId || !bookingType) {
      return NextResponse.json({ error: 'bookingId and bookingType are required' }, { status: 400 });
    }

    let raw: any = null;
    let quote: any = null;

    switch (bookingType.toUpperCase()) {
      case 'BIKE': {
        raw = await prisma.bike_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupDate: true, dropDate: true, totalDays: true, pickupTime: true,
            grandTotal: true, advanceAmount: true,
            customerNotes: true, vendorNotes: true, adminNotes: true,
            cancellationReason: true, acceptedQuoteId: true,
          },
        });
        if (raw?.acceptedQuoteId) {
          quote = await prisma.bike_quotes.findUnique({
            where: { id: raw.acceptedQuoteId },
            select: {
              vehicleName: true, dailyRate: true,
              grandTotal: true, totalAmount: true, advanceAmount: true,
              securityDeposit: true, gstAmount: true,
              inclusions: true, exclusions: true, termsConditions: true,
              validTill: true,
            },
          });
        }
        break;
      }

      case 'CAR': {
        raw = await prisma.car_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupDate: true, dropDate: true, totalDays: true, pickupTime: true,
            grandTotal: true, advanceAmount: true,
            customerNotes: true, vendorNotes: true, adminNotes: true,
            cancellationReason: true, acceptedQuoteId: true,
          },
        });
        if (raw?.acceptedQuoteId) {
          quote = await prisma.self_drive_quotes.findUnique({
            where: { id: raw.acceptedQuoteId },
            select: {
              vehicleName: true, dailyRate: true,
              grandTotal: true, baseAmount: true, advanceAmount: true,
              securityDeposit: true, gstAmount: true,
              deliveryCharges: true, pickupCharges: true,
              inclusions: true, exclusions: true, termsConditions: true,
              validTill: true,
            },
          });
        }
        break;
      }

      case 'LUXURY': {
        raw = await prisma.luxury_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupDate: true, pickupTime: true, returnDate: true, returnTime: true,
            totalDays: true, totalHours: true,
            grandTotal: true, advanceAmount: true,
            customerNotes: true, cancellationReason: true, acceptedQuoteId: true,
          },
        });
        if (raw?.acceptedQuoteId) {
          quote = await prisma.luxury_quotes.findUnique({
            where: { id: raw.acceptedQuoteId },
            select: {
              vehicleName: true,
              baseAmount: true, totalAmount: true, advanceAmount: true, gstAmount: true,
              inclusions: true, exclusions: true, termsConditions: true,
              validTill: true,
            },
          });
        }
        break;
      }

      case 'BUS': {
        raw = await prisma.bus_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupCity: true, dropCity: true,
            pickupDate: true, pickupTime: true, returnDate: true, returnTime: true,
            tripDays: true, totalAmount: true, advanceAmount: true,
            customerNotes: true, vendorNotes: true, adminNotes: true,
            cancellationReason: true, acceptedQuoteId: true,
          },
        });
        if (raw?.acceptedQuoteId) {
          quote = await prisma.bus_quotes.findUnique({
            where: { id: raw.acceptedQuoteId },
            select: {
              vehicleName: true, seats: true,
              baseAmount: true, totalAmount: true, gstAmount: true,
              extraKmRate: true, extraHourRate: true,
              inclusions: true, exclusions: true, termsConditions: true,
              validTill: true,
            },
          });
        }
        break;
      }

      case 'TRUCK': {
        raw = await prisma.truck_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupCity: true, dropCity: true, goodsType: true,
            pickupDate: true, pickupTime: true,
            totalAmount: true, advanceAmount: true,
            customerNotes: true, vendorNotes: true,
            cancellationReason: true, acceptedQuoteId: true,
          },
        });
        if (raw?.acceptedQuoteId) {
          quote = await prisma.truck_quotes.findUnique({
            where: { id: raw.acceptedQuoteId },
            select: {
              vehicleName: true,
              baseAmount: true, totalAmount: true, gstAmount: true, perKmRate: true,
              inclusions: true, exclusions: true, termsConditions: true,
              validTill: true,
            },
          });
        }
        break;
      }

      case 'EQUIPMENT': {
        raw = await prisma.equipment_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            equipmentName: true, equipmentType: true, deliveryCity: true,
            startDate: true, endDate: true, rentalDays: true,
            totalAmount: true, advanceAmount: true, securityDeposit: true,
            customerNotes: true, vendorNotes: true,
            cancellationReason: true, acceptedQuoteId: true,
          },
        });
        if (raw?.acceptedQuoteId) {
          quote = await prisma.equipment_quotes.findUnique({
            where: { id: raw.acceptedQuoteId },
            select: {
              baseAmount: true, totalAmount: true, gstAmount: true,
              dailyRate: true, weeklyRate: true, monthlyRate: true,
              securityDeposit: true, notes: true,
              inclusions: true, exclusions: true, termsConditions: true,
              validTill: true,
            },
          });
        }
        break;
      }

      case 'PACKERS': {
        raw = await prisma.packers_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupCity: true, dropCity: true, serviceType: true,
            scheduledDate: true, scheduledTime: true,
            totalAmount: true, advanceAmount: true,
            customerNotes: true, vendorNotes: true,
            cancellationReason: true, acceptedQuoteId: true,
          },
        });
        if (raw?.acceptedQuoteId) {
          quote = await prisma.packers_quotes.findUnique({
            where: { id: raw.acceptedQuoteId },
            select: {
              transportCharges: true, materialCharges: true,
              totalAmount: true, gstAmount: true, packingMaterials: true,
              inclusions: true, exclusions: true, termsConditions: true,
              validTill: true,
            },
          });
        }
        break;
      }

      case 'CHAUFFEUR': {
        // Car Rental (chauffeur-driven) — no quote system, uses city pricing
        raw = await prisma.chauffeur_bookings.findUnique({
          where: { id: bookingId },
          select: {
            id: true, bookingNumber: true, status: true,
            customerName: true, customerPhone: true, customerEmail: true,
            pickupCity: true, dropCity: true, tripType: true,
            pickupDate: true, pickupTime: true, returnDate: true, returnTime: true,
            totalDays: true, totalHours: true,
            grandTotal: true, paidAmount: true, baseFare: true, gstAmount: true,
            customerNotes: true, vendorNotes: true, adminNotes: true,
            cancellationReason: true,
          },
        });
        // No acceptedQuoteId — chauffeur uses city-based pricing, not vendor quotes
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
    }

    if (!raw) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Normalize to a common shape
    const serviceDate = raw.pickupDate || raw.startDate || raw.scheduledDate || null;
    const endDate = raw.dropDate || raw.returnDate || raw.endDate || null;
    const duration = raw.totalDays || raw.rentalDays || raw.tripDays || null;
    // Chauffeur uses paidAmount instead of advanceAmount
    const advanceReceived = raw.advanceAmount ?? raw.paidAmount ?? 0;

    return NextResponse.json({
      success: true,
      booking: {
        id: raw.id,
        bookingNumber: raw.bookingNumber,
        status: raw.status,
        customer: {
          name: raw.customerName,
          phone: raw.customerPhone,
          email: raw.customerEmail,
        },
        serviceDate,
        endDate,
        duration,
        location: raw.pickupCity || raw.deliveryCity || null,
        dropLocation: raw.dropCity || null,
        goodsType: raw.goodsType || raw.serviceType || raw.equipmentType || raw.tripType || null,
        itemName: raw.equipmentName || null,
        amounts: {
          total: raw.grandTotal || raw.totalAmount || 0,
          advance: advanceReceived,
          securityDeposit: raw.securityDeposit || 0,
        },
        notes: {
          customer: raw.customerNotes || null,
          vendor: raw.vendorNotes || null,
          admin: raw.adminNotes || null,
          cancellation: raw.cancellationReason || null,
        },
      },
      quote: quote ? {
        vehicleName: quote.vehicleName || null,
        seats: quote.seats || null,
        baseAmount: quote.baseAmount || 0,
        totalAmount: quote.totalAmount || quote.grandTotal || 0,
        advanceAmount: quote.advanceAmount || null,
        gstAmount: quote.gstAmount || 0,
        securityDeposit: quote.securityDeposit || 0,
        inclusions: quote.inclusions || null,
        exclusions: quote.exclusions || null,
        termsConditions: quote.termsConditions || null,
        packingMaterials: quote.packingMaterials || null,
        notes: quote.notes || null,
        validTill: quote.validTill || null,
      } : null,
    });
  } catch (error: any) {
    logger.error('Booking detail GET error', error);
    return NextResponse.json({ error: 'Failed to fetch booking detail', details: error?.message }, { status: 500 });
  }
}
