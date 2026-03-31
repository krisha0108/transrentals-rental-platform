export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendQuoteRequestNotificationToVendors, sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  'self-drive': 'Self Drive Car Rental',
  'bike': 'Bike Rental',
  'luxury': 'Luxury Car Rental',
  'bus': 'Bus Rental',
  'truck': 'Truck Rental',
  'equipment': 'Equipment Rental',
  'packers': 'Packers & Movers',
};

/**
 * GET /api/customer/re-request-quotes?serviceType=self-drive&requestId=xxx
 * Returns re-request count for a quote request
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceType = searchParams.get('serviceType');
  const requestId = searchParams.get('requestId');

  if (!serviceType || !requestId) {
    return NextResponse.json({ reRequestCount: 0, remainingAttempts: 3 });
  }

  const reRequestKey = `re_request_count_${serviceType}_${requestId}`;
  const setting = await prisma.settings.findUnique({ where: { key: reRequestKey } });
  const count = setting ? parseInt(setting.value as string) || 0 : 0;

  return NextResponse.json({
    reRequestCount: count,
    remainingAttempts: Math.max(0, 3 - count),
  });
}

/**
 * POST /api/customer/re-request-quotes
 * Re-opens a quote request so vendors can send fresh quotes.
 * Only allowed if all existing quotes have expired AND booking date is still in the future.
 * Notifies all vendors in the location + specifically the vendors who previously quoted.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceType, requestId, customerId } = body;

    if (!serviceType || !requestId || !customerId) {
      return NextResponse.json(
        { success: false, message: 'serviceType, requestId, and customerId are required' },
        { status: 400 }
      );
    }

    // Service type to prisma model mapping
    const serviceConfig: Record<string, {
      requestModel: string;
      quoteModel: string;
      dateField: string;
    }> = {
      'self-drive': {
        requestModel: 'self_drive_quote_requests',
        quoteModel: 'self_drive_quotes',
        dateField: 'pickupDate',
      },
      'bike': {
        requestModel: 'bike_quote_requests',
        quoteModel: 'bike_quotes',
        dateField: 'pickupDate',
      },
      'luxury': {
        requestModel: 'luxury_quote_requests',
        quoteModel: 'luxury_quotes',
        dateField: 'pickupDate',
      },
      'bus': {
        requestModel: 'bus_quote_requests',
        quoteModel: 'bus_quotes',
        dateField: 'journeyDate',
      },
      'truck': {
        requestModel: 'truck_quote_requests',
        quoteModel: 'truck_quotes',
        dateField: 'pickupDate',
      },
      'equipment': {
        requestModel: 'equipment_quote_requests',
        quoteModel: 'equipment_quotes',
        dateField: 'startDate',
      },
      'packers': {
        requestModel: 'packers_quote_requests',
        quoteModel: 'packers_quotes',
        dateField: 'preferredDate',
      },
    };

    const config = serviceConfig[serviceType];
    if (!config) {
      return NextResponse.json(
        { success: false, message: `Invalid service type: ${serviceType}` },
        { status: 400 }
      );
    }

    // Fetch the quote request
    const quoteRequest = await (prisma as any)[config.requestModel].findUnique({
      where: { id: requestId },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { success: false, message: 'Quote request not found' },
        { status: 404 }
      );
    }

    // Check if booking date is still in the future
    const bookingDate = quoteRequest[config.dateField];
    if (bookingDate && new Date(bookingDate) <= new Date()) {
      return NextResponse.json(
        { success: false, message: 'Cannot re-request quotes — booking date has already passed' },
        { status: 400 }
      );
    }

    // Check the request isn't already booked
    if (quoteRequest.status === 'BOOKED' || quoteRequest.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'This request already has a confirmed booking' },
        { status: 400 }
      );
    }

    // Check re-request count (max 3 times)
    const reRequestKey = `re_request_count_${serviceType}_${requestId}`;
    const reRequestSetting = await prisma.settings.findUnique({ where: { key: reRequestKey } });
    const currentCount = reRequestSetting ? parseInt(reRequestSetting.value as string) || 0 : 0;

    if (currentCount >= 3) {
      return NextResponse.json(
        { success: false, message: 'Maximum re-request limit reached (3 times). Please create a new quote request.' },
        { status: 400 }
      );
    }

    // Get vendors who previously quoted (before marking as expired)
    const previousQuotes = await (prisma as any)[config.quoteModel].findMany({
      where: { requestId },
      select: { vendorId: true },
      distinct: ['vendorId'],
    });
    const previousVendorIds: string[] = previousQuotes.map((q: any) => q.vendorId).filter(Boolean);

    // Increment re-request count
    await prisma.settings.upsert({
      where: { key: reRequestKey },
      create: { key: reRequestKey, value: String(currentCount + 1) },
      update: { value: String(currentCount + 1) },
    });

    // Re-open the quote request: update status and extend quotesOpenTill
    const newQuotesOpenTill = new Date();
    newQuotesOpenTill.setHours(newQuotesOpenTill.getHours() + 48);

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await (prisma as any)[config.requestModel].update({
      where: { id: requestId },
      data: {
        status: 'PENDING',
        quotesOpenTill: newQuotesOpenTill,
        expiresAt: newExpiresAt,
      },
    });

    // Mark all expired quotes as EXPIRED so vendors know to re-quote
    await (prisma as any)[config.quoteModel].updateMany({
      where: {
        requestId,
        validTill: { lt: new Date() },
        status: { in: ['SENT', 'VIEWED'] },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // Send notification to customer
    try {
      await prisma.notifications.create({
        data: {
          customerId,
          title: 'Quote Request Re-opened',
          body: `Your ${SERVICE_DISPLAY_NAMES[serviceType] || serviceType} quote request has been re-opened. Vendors will be able to send new quotes for the next 48 hours.`,
          type: 'quote',
          serviceType,
          quoteId: requestId,
        },
      });
    } catch {
      // notification is non-critical
    }

    // Notify ALL vendors in the location (same as new request)
    const customerName = quoteRequest.customerName || 'A customer';
    const locationId = quoteRequest.locationId || '';
    const locationName = quoteRequest.locationName || quoteRequest.pickupCity || '';
    const requestNumber = quoteRequest.requestNumber || '';

    try {
      await sendQuoteRequestNotificationToVendors({
        requestId,
        requestNumber,
        locationId,
        locationName,
        customerName,
        serviceType,
        serviceDisplayName: SERVICE_DISPLAY_NAMES[serviceType] || serviceType,
      });
    } catch (err) {
      console.error('[ReRequest] Failed to notify location vendors:', err);
    }

    // Additionally, send a DIRECT notification to vendors who previously quoted
    // (in case they're not in the location list, or to give them a heads up)
    try {
      await Promise.allSettled(
        previousVendorIds.map((vendorId) =>
          sendVendorDirectNotification({
            vendorId,
            title: `Fresh Quotes Requested — ${SERVICE_DISPLAY_NAMES[serviceType] || serviceType}`,
            body: `${customerName} has re-opened their ${SERVICE_DISPLAY_NAMES[serviceType] || serviceType} request in ${locationName}. Your previous quote expired — send a new one!`,
            type: 'quote_request',
            serviceType,
            data: {
              screen: 'QuoteRequestDetail',
              requestId,
              requestNumber,
              serviceType,
            },
          })
        )
      );
    } catch (err) {
      console.error('[ReRequest] Failed to notify previous vendors:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Your request has been re-opened successfully! Vendors have been notified and can send fresh quotes for the next 48 hours.',
      reRequestCount: currentCount + 1,
      remainingAttempts: 2 - currentCount, // 3 max - (currentCount + 1) = 2 - currentCount
    });
  } catch (error) {
    console.error('Error re-requesting quotes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to re-request quotes' },
      { status: 500 }
    );
  }
}
