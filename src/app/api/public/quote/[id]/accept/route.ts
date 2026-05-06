// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

function generateBookingNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST — Accept a quote and create a booking (public, no vendor auth required)
// Body: { serviceType: string, quoteId: string, requestId: string }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quoteId = params.id;
    const { serviceType } = await req.json();

    if (!serviceType || !quoteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let booking: any;
    let bookingType: string;

    switch (serviceType) {
      case 'bike': {
        const quote = await prisma.bike_quotes.findUnique({
          where: { id: quoteId },
          include: { bike_quote_requests_bike_quotes_requestIdTobike_quote_requests: true },
        });
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (quote.validTill && new Date(quote.validTill) < new Date()) return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        if (['WITHDRAWN', 'REJECTED'].includes(quote.status)) return NextResponse.json({ error: 'Quote is no longer available for acceptance' }, { status: 400 });
        const r = quote.bike_quote_requests_bike_quotes_requestIdTobike_quote_requests;
        const existing = await prisma.bike_bookings.findFirst({ where: { acceptedQuoteId: quoteId } });
        if (existing) {
          booking = { id: existing.id, bookingNumber: existing.bookingNumber, vendorId: existing.assignedVendorId || existing.acceptedVendorId, advanceAmount: existing.advanceAmount, status: existing.status };
          bookingType = 'bike';
          break;
        }
        const advanceAmount = quote.advanceAmount || Math.round((quote.grandTotal || 0) * (quote.advancePercent || 30) / 100);
        const bookingNumber = generateBookingNumber('BK');
        const result = await prisma.$transaction(async (tx) => {
          await tx.bike_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
          await tx.bike_quotes.updateMany({ where: { requestId: quote.requestId, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED'] } }, data: { status: 'REJECTED' } });
          await tx.bike_quote_requests.update({ where: { id: quote.requestId }, data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId } });
          return tx.bike_bookings.create({ data: {
            bookingNumber, quoteRequestId: quote.requestId, acceptedQuoteId: quoteId,
            customerId: r.customerId, customerName: r.customerName, customerEmail: r.customerEmail, customerPhone: r.customerPhone,
            locationId: r.locationId, locationName: r.locationName,
            assignedVendorId: quote.vendorId, acceptedVendorId: quote.vendorId, acceptedAt: new Date(),
            pickupDate: r.pickupDate, pickupTime: r.pickupTime, dropDate: r.dropDate, dropTime: r.dropTime, totalDays: r.totalDays,
            dailyRate: quote.dailyRate, totalAmount: quote.totalAmount, gstAmount: quote.gstAmount || 0,
            securityDeposit: quote.securityDeposit, grandTotal: quote.grandTotal,
            advanceAmount, advancePercentage: quote.advancePercent || 30,
            helmetsRequired: quote.helmetsIncluded || 1, customerNotes: r.customerNotes, vendorNotes: quote.vendorMessage,
            requestedVehicleName: r.vehicleModelName || r.vehicleCategoryName || quote.vehicleName || '',
            tripStartOtp: generateOTP(), tripEndOtp: generateOTP(), status: 'PENDING_PAYMENT',
          }});
        });
        booking = { id: result.id, bookingNumber: result.bookingNumber, vendorId: quote.vendorId, advanceAmount: result.advanceAmount, status: result.status };
        bookingType = 'bike';
        break;
      }

      case 'bus': {
        const quote = await prisma.bus_quotes.findUnique({ where: { id: quoteId }, include: { bus_quote_requests_bus_quotes_requestIdTobus_quote_requests: true } });
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (quote.validTill && new Date(quote.validTill) < new Date()) return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        if (['WITHDRAWN', 'REJECTED'].includes(quote.status)) return NextResponse.json({ error: 'Quote is no longer available for acceptance' }, { status: 400 });
        const r = quote.bus_quote_requests_bus_quotes_requestIdTobus_quote_requests;
        const existing = await prisma.bus_bookings.findFirst({ where: { acceptedQuoteId: quoteId } });
        if (existing) { booking = { id: existing.id, bookingNumber: existing.bookingNumber, vendorId: existing.vendorId, advanceAmount: existing.advanceAmount, status: existing.status }; bookingType = 'bus'; break; }
        const advanceAmount = quote.advanceAmount || Math.round((quote.totalAmount || 0) * 0.3);
        const additionalCharges = (quote.driverAllowance || 0) + (quote.tollEstimate || 0) + (quote.parkingEstimate || 0) + (quote.nightHaltCharges || 0) + (quote.permitCharges || 0);
        const bookingNumber = generateBookingNumber('BB');
        const result = await prisma.$transaction(async (tx) => {
          await tx.bus_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED', respondedAt: new Date() } });
          await tx.bus_quotes.updateMany({ where: { requestId: quote.requestId, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED'] } }, data: { status: 'REJECTED' } });
          await tx.bus_quote_requests.update({ where: { id: quote.requestId }, data: { status: 'QUOTE_ACCEPTED' } });
          return tx.bus_bookings.create({ data: {
            bookingNumber, quoteRequestId: quote.requestId, acceptedQuoteId: quoteId,
            customerId: r.customerId, customerName: r.customerName, customerEmail: r.customerEmail, customerPhone: r.customerPhone,
            vendorId: quote.vendorId, tripType: r.tripType, vehicleCategory: quote.vehicleCategory || r.vehicleCategory,
            vehicleName: quote.vehicleName, passengers: r.passengers,
            pickupCity: r.pickupCity, pickupAddress: r.pickupAddress, dropCity: r.dropCity, dropAddress: r.dropAddress,
            pickupDate: r.pickupDate, pickupTime: r.pickupTime, returnDate: r.returnDate, tripDays: r.tripDays || 1,
            vehicleNumber: quote.vehicleNumber, driverName: quote.driverName, driverPhone: quote.driverPhone,
            baseAmount: quote.baseAmount, additionalCharges, gstAmount: quote.gstAmount || 0, totalAmount: quote.totalAmount,
            advanceAmount, balanceAmount: (quote.totalAmount || 0) - advanceAmount,
            status: 'PENDING_PAYMENT', tripStartOtp: generateOTP(), tripEndOtp: generateOTP(),
          }});
        });
        booking = { id: result.id, bookingNumber: result.bookingNumber, vendorId: quote.vendorId, advanceAmount: result.advanceAmount, status: result.status };
        bookingType = 'bus';
        break;
      }

      case 'equipment': {
        const quote = await prisma.equipment_quotes.findUnique({ where: { id: quoteId }, include: { equipment_quote_requests: true } });
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (quote.validTill && new Date(quote.validTill) < new Date()) return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        if (['WITHDRAWN', 'REJECTED'].includes(quote.status)) return NextResponse.json({ error: 'Quote is no longer available for acceptance' }, { status: 400 });
        const r = quote.equipment_quote_requests;
        const existing = await prisma.equipment_bookings.findFirst({ where: { acceptedQuoteId: quoteId } });
        if (existing) { booking = { id: existing.id, bookingNumber: existing.bookingNumber, vendorId: existing.vendorId, advanceAmount: existing.advanceAmount, status: existing.status }; bookingType = 'equipment'; break; }
        const rentalDays = r.rentalDays || 1;
        const endDate = r.endDate || new Date(r.startDate.getTime() + rentalDays * 86400000);
        const advanceAmount = Math.round((quote.totalAmount || 0) * 0.3) + (quote.securityDeposit || 0);
        const bookingNumber = generateBookingNumber('EB');
        const result = await prisma.$transaction(async (tx) => {
          await tx.equipment_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
          await tx.equipment_quotes.updateMany({ where: { requestId: quote.requestId, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED'] } }, data: { status: 'REJECTED' } });
          await tx.equipment_quote_requests.update({ where: { id: quote.requestId }, data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId } });
          return tx.equipment_bookings.create({ data: {
            bookingNumber, quoteRequestId: quote.requestId, acceptedQuoteId: quoteId,
            customerId: r.customerId, customerName: r.customerName, customerEmail: r.customerEmail, customerPhone: r.customerPhone,
            vendorId: quote.vendorId, equipmentCategory: r.equipmentCategory, equipmentType: r.equipmentType,
            equipmentName: quote.equipmentName || r.equipmentType, equipmentModel: quote.equipmentModel, quantity: r.quantity,
            deliveryCity: r.deliveryCity, deliveryAddress: r.deliveryAddress,
            startDate: r.startDate, endDate, rentalDays,
            baseAmount: quote.baseAmount || quote.totalAmount,
            deliveryCharges: quote.deliveryCharges || 0, operatorCharges: quote.operatorCharges || 0,
            pickupCharges: quote.pickupCharges || 0, securityDeposit: quote.securityDeposit || 0,
            gstAmount: quote.gstAmount || 0, totalAmount: quote.totalAmount,
            advanceAmount, balanceAmount: (quote.totalAmount || 0) - Math.round((quote.totalAmount || 0) * 0.3),
            status: 'PENDING_PAYMENT', deliveryOtp: generateOTP(), returnOtp: generateOTP(),
          }});
        });
        booking = { id: result.id, bookingNumber: result.bookingNumber, vendorId: quote.vendorId, advanceAmount: result.advanceAmount, status: result.status };
        bookingType = 'equipment';
        break;
      }

      case 'packers': {
        const quote = await prisma.packers_quotes.findUnique({ where: { id: quoteId }, include: { packers_quote_requests: true } });
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (quote.validTill && new Date(quote.validTill) < new Date()) return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        if (['WITHDRAWN', 'REJECTED'].includes(quote.status)) return NextResponse.json({ error: 'Quote is no longer available for acceptance' }, { status: 400 });
        const r = quote.packers_quote_requests;
        const existing = await prisma.packers_bookings.findFirst({ where: { acceptedQuoteId: quoteId } });
        if (existing) { booking = { id: existing.id, bookingNumber: existing.bookingNumber, vendorId: existing.vendorId, advanceAmount: existing.advanceAmount, status: existing.status }; bookingType = 'packers'; break; }
        const advanceAmount = Math.round((quote.totalAmount || 0) * 0.3);
        const bookingNumber = generateBookingNumber('PB');
        const result = await prisma.$transaction(async (tx) => {
          await tx.packers_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
          await tx.packers_quotes.updateMany({ where: { requestId: quote.requestId, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED'] } }, data: { status: 'REJECTED' } });
          await tx.packers_quote_requests.update({ where: { id: quote.requestId }, data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId } });
          return tx.packers_bookings.create({ data: {
            bookingNumber, quoteRequestId: quote.requestId, acceptedQuoteId: quoteId,
            customerId: r.customerId, customerName: r.customerName, customerEmail: r.customerEmail, customerPhone: r.customerPhone,
            vendorId: quote.vendorId, serviceType: r.serviceType, shiftingType: r.shiftingType,
            pickupCity: r.pickupCity, pickupAddress: r.pickupAddress, pickupFloor: r.pickupFloor,
            dropCity: r.dropCity, dropAddress: r.dropAddress, dropFloor: r.dropFloor,
            scheduledDate: r.preferredDate,
            packingCharges: quote.packingCharges || 0, loadingCharges: quote.loadingCharges || 0,
            transportCharges: quote.transportCharges, unloadingCharges: quote.unloadingCharges || 0,
            unpackingCharges: quote.unpackingCharges || 0, storageCharges: quote.storageCharges || 0,
            insuranceCharges: quote.insuranceCharges || 0, materialCharges: quote.materialCharges || 0,
            gstAmount: quote.gstAmount || 0, totalAmount: quote.totalAmount,
            advanceAmount, balanceAmount: (quote.totalAmount || 0) - advanceAmount,
            status: 'PENDING_PAYMENT', packingOtp: generateOTP(), loadingOtp: generateOTP(), deliveryOtp: generateOTP(),
          }});
        });
        booking = { id: result.id, bookingNumber: result.bookingNumber, vendorId: quote.vendorId, advanceAmount: result.advanceAmount, status: result.status };
        bookingType = 'packers';
        break;
      }

      case 'self-drive': {
        const quote = await prisma.self_drive_quotes.findUnique({
          where: { id: quoteId },
          include: { self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: true },
        });
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (quote.validTill && new Date(quote.validTill) < new Date()) return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        if (['WITHDRAWN', 'REJECTED'].includes(quote.status)) return NextResponse.json({ error: 'Quote is no longer available for acceptance' }, { status: 400 });
        const r = quote.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests;
        const existing = await prisma.car_bookings.findFirst({ where: { acceptedQuoteId: quoteId } });
        if (existing) { booking = { id: existing.id, bookingNumber: existing.bookingNumber, vendorId: existing.assignedVendorId || existing.acceptedVendorId, advanceAmount: existing.advanceAmount, status: existing.status }; bookingType = 'self-drive'; break; }
        const advanceAmount = quote.advanceAmount || Math.round((quote.grandTotal || 0) * (quote.advancePercent || 30) / 100);
        const bookingNumber = generateBookingNumber('SD');
        const result = await prisma.$transaction(async (tx) => {
          await tx.self_drive_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
          await tx.self_drive_quotes.updateMany({ where: { requestId: quote.requestId, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED'] } }, data: { status: 'REJECTED' } });
          await tx.self_drive_quote_requests.update({ where: { id: quote.requestId }, data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId } });
          return tx.car_bookings.create({ data: {
            bookingNumber, acceptedQuoteId: quoteId, quoteRequestId: quote.requestId,
            customerId: r.customerId, customerName: r.customerName, customerEmail: r.customerEmail, customerPhone: r.customerPhone,
            locationId: r.locationId, locationName: r.locationName,
            assignedVendorId: quote.vendorId, acceptedVendorId: quote.vendorId, acceptedAt: new Date(),
            pickupAddress: r.pickupAddress, dropAddress: r.dropAddress, isDeliveryRequested: r.isDeliveryRequested || false,
            pickupDate: r.pickupDate, pickupTime: r.pickupTime, dropDate: r.dropDate, dropTime: r.dropTime, totalDays: r.totalDays,
            dailyRate: quote.dailyRate, baseAmount: quote.baseAmount, gstAmount: quote.gstAmount || 0,
            platformFee: quote.platformFee || 0, securityDeposit: quote.securityDeposit, grandTotal: quote.grandTotal,
            advanceAmount, advancePercentage: quote.advancePercent || 30,
            kmLimitPerDay: quote.kmLimitPerDay || 200, extraKmRate: quote.extraKmRate || 10,
            tripStartOtp: generateOTP(), customerNotes: r.customerNotes, vendorNotes: quote.vendorMessage,
            status: 'PENDING_PAYMENT',
          }});
        });
        booking = { id: result.id, bookingNumber: result.bookingNumber, vendorId: quote.vendorId, advanceAmount: result.advanceAmount, status: result.status };
        bookingType = 'self-drive';
        break;
      }

      case 'truck': {
        const quote = await prisma.truck_quotes.findUnique({ where: { id: quoteId }, include: { truck_quote_requests: true } });
        if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (quote.validTill && new Date(quote.validTill) < new Date()) return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        if (['WITHDRAWN', 'REJECTED'].includes(quote.status)) return NextResponse.json({ error: 'Quote is no longer available for acceptance' }, { status: 400 });
        const r = quote.truck_quote_requests;
        const existing = await prisma.truck_bookings.findFirst({ where: { acceptedQuoteId: quoteId } });
        if (existing) { booking = { id: existing.id, bookingNumber: existing.bookingNumber, vendorId: existing.vendorId, advanceAmount: existing.advanceAmount, status: existing.status }; bookingType = 'truck'; break; }
        const advanceAmount = Math.round((quote.totalAmount || 0) * 0.5);
        const bookingNumber = generateBookingNumber('TB');
        const result = await prisma.$transaction(async (tx) => {
          await tx.truck_quotes.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
          await tx.truck_quotes.updateMany({ where: { requestId: quote.requestId, id: { not: quoteId }, status: { in: ['SENT', 'VIEWED'] } }, data: { status: 'REJECTED' } });
          await tx.truck_quote_requests.update({ where: { id: quote.requestId }, data: { status: 'QUOTE_ACCEPTED', acceptedQuoteId: quoteId } });
          return tx.truck_bookings.create({ data: {
            bookingNumber, quoteRequestId: quote.requestId, acceptedQuoteId: quoteId,
            customerId: r.customerId, customerName: r.customerName, customerEmail: r.customerEmail, customerPhone: r.customerPhone,
            vendorId: quote.vendorId, serviceType: r.serviceType, vehicleCategory: quote.vehicleCategory || 'truck',
            vehicleName: quote.vehicleName, goodsType: r.goodsType, goodsDescription: r.goodsDescription,
            pickupCity: r.pickupCity, pickupAddress: r.pickupAddress, pickupFloor: r.pickupFloor,
            dropCity: r.dropCity, dropAddress: r.dropAddress, dropFloor: r.dropFloor,
            estimatedDistance: r.estimatedDistance, pickupDate: r.pickupDate, pickupTime: r.pickupTime,
            vehicleNumber: quote.vehicleNumber, driverName: quote.driverName, driverPhone: quote.driverPhone,
            labourCount: quote.labourIncluded ? quote.labourCount : null,
            baseAmount: quote.baseAmount, labourCharges: quote.labourCharges || 0,
            loadingCharges: quote.loadingCharges || 0, unloadingCharges: quote.unloadingCharges || 0,
            packagingCharges: quote.packagingCharges || 0, insuranceCharges: quote.insuranceCharges || 0,
            tollCharges: quote.tollEstimate || 0, gstAmount: quote.gstAmount || 0, totalAmount: quote.totalAmount,
            advanceAmount, balanceAmount: (quote.totalAmount || 0) - advanceAmount,
            status: 'PENDING_PAYMENT', loadingOtp: generateOTP(), deliveryOtp: generateOTP(),
          }});
        });
        booking = { id: result.id, bookingNumber: result.bookingNumber, vendorId: quote.vendorId, advanceAmount: result.advanceAmount, status: result.status };
        bookingType = 'truck';
        break;
      }

      case 'wander_quote': {
        const wq = await (prisma as any).wander_quotes.findUnique({
          where: { id: quoteId },
          include: {
            quoteRequest: { include: { listing: { select: { title: true, requireAdvancePayment: true, advancePaymentType: true, advancePaymentValue: true } }, customer: { select: { id: true, name: true, email: true, companyName: true } } } },
          },
        });
        if (!wq) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        if (wq.validUntil && new Date(wq.validUntil) < new Date()) return NextResponse.json({ error: 'This quote has expired' }, { status: 400 });
        const req = wq.quoteRequest;
        const existing = await (prisma as any).wander_bookings.findFirst({ where: { quoteId } });
        if (existing) { booking = { id: existing.id, bookingNumber: existing.bookingId, vendorId: existing.vendorId, advanceAmount: existing.advanceAmount, status: existing.status }; bookingType = 'wander_quote'; break; }
        const listing = req?.listing;
        const isB2B = req?.bookingFor === 'COMPANY';
        let advanceAmount = null;
        if (!isB2B && listing?.requireAdvancePayment && listing?.advancePaymentValue) {
          advanceAmount = listing.advancePaymentType === 'PERCENTAGE'
            ? Math.round((Number(wq.amount) * listing.advancePaymentValue) / 100)
            : Number(listing.advancePaymentValue);
        }
        // Mark all quotes on this request
        const allQuotes = await (prisma as any).wander_quotes.findMany({ where: { quoteRequestId: req.id } });
        await Promise.all(allQuotes.map((q: any) => (prisma as any).wander_quotes.update({ where: { id: q.id }, data: { status: q.id === quoteId ? 'ACCEPTED' : 'REJECTED' } })));
        await (prisma as any).wander_quote_requests.update({ where: { id: req.id }, data: { status: 'ACCEPTED' } });
        const bookingNumber = 'WND-' + Date.now().toString(36).toUpperCase();
        const result = await (prisma as any).wander_bookings.create({ data: {
          bookingId: bookingNumber, quoteRequestId: req.id, quoteId, customerId: req.customerId, vendorId: wq.vendorId,
          travelDate: req.travelDate, groupSize: req.groupSize, amount: wq.amount, advanceAmount,
          isB2BBooking: isB2B, companyName: isB2B ? (req.companyName || req.customer?.companyName || null) : null,
          status: advanceAmount ? 'PAYMENT_PENDING' : 'CONFIRMED',
        }});
        booking = { id: result.id, bookingNumber: result.bookingId, vendorId: wq.vendorId, advanceAmount: result.advanceAmount, status: result.status };
        bookingType = 'wander_quote';
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
    }

    // Non-blocking vendor notification
    if (booking.vendorId) {
      sendVendorDirectNotification({
        vendorId: booking.vendorId,
        title: '🎉 Quote Accepted!',
        body: `Customer accepted your quote. Booking #${booking.bookingNumber} created. Advance payment pending.`,
        type: 'quote_accepted',
        serviceType,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
      }).catch(() => {});
    }

    const needsPayment = booking.advanceAmount && booking.advanceAmount > 0 &&
      ['PENDING_PAYMENT', 'PAYMENT_PENDING'].includes(booking.status);

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      bookingType,
      advanceAmount: booking.advanceAmount || 0,
      needsPayment: !!needsPayment,
      status: booking.status,
    });
  } catch (error: any) {
    console.error('[Public Quote Accept]', error);
    return NextResponse.json({ error: error?.message || 'Failed to accept quote' }, { status: 500 });
  }
}
