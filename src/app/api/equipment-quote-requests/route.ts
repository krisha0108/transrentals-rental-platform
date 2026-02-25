// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, detectDuplicate, getClientIdentifier, hashBookingData } from '@/lib/utils/smart-rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import logger from '@/lib/security/logger';
import { sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

function generateRequestNumber(): string {
  const prefix = 'EQR';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// POST - Customer creates an Equipment Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ===== RATE LIMITING =====
    const clientId = getClientIdentifier(request);
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;

    const rateLimitCheck = await smartRateLimit(clientId, isAuthenticated, body);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.error,
          requiresCaptcha: rateLimitCheck.requiresCaptcha,
          type: 'rate_limit',
        },
        { status: 429 }
      );
    }

    // Check for duplicate bookings (bot detection)
    const bookingHash = hashBookingData(body);
    const duplicateCheck = await detectDuplicate(bookingHash);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: duplicateCheck.error,
          type: 'duplicate_booking',
        },
        { status: 400 }
      );
    }

    let {
      customerName, customerEmail, customerPhone, customerId,
      companyName,
      equipmentCategory, equipmentType, equipmentName,
      quantity, rentalDuration, rentalDays,
      deliveryCity, deliveryAddress, siteType,
      startDate, endDate,
      needOperator, needDelivery, needInstallation,
      requirements, budgetMin, budgetMax,
    } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    customerName = sanitizeInput(customerName);
    companyName = sanitizeInput(companyName);
    equipmentCategory = sanitizeInput(equipmentCategory);
    equipmentType = sanitizeInput(equipmentType);
    equipmentName = sanitizeInput(equipmentName);
    deliveryCity = sanitizeInput(deliveryCity);
    deliveryAddress = sanitizeInput(deliveryAddress);
    siteType = sanitizeInput(siteType);
    requirements = sanitizeInput(requirements);
    customerPhone = sanitizePhone(customerPhone);

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Customer details are required' }, { status: 400 });
    }

    // ===== EMAIL & PHONE VALIDATION =====
    if (customerEmail && !isValidEmail(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json({ error: 'Invalid phone number. Must be 10 digits starting with 6-9' }, { status: 400 });
    }
    if (!equipmentCategory || !equipmentType || !deliveryCity || !deliveryAddress || !startDate || !endDate || !rentalDays) {
      return NextResponse.json({ error: 'Equipment and location details are required' }, { status: 400 });
    }

    // ===== DATE VALIDATION =====
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid start date format. Please provide a valid date.' }, { status: 400 });
    }

    if (isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid end date format. Please provide a valid date.' }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 });
    }

    // MySQL is case-insensitive by default with utf8mb4_general_ci collation
    const location = await prisma.locations.findFirst({
      where: {
        OR: [{ name: { contains: deliveryCity } }, { slug: deliveryCity.toLowerCase().replace(/\s+/g, '-') }],
        isActive: true,
      },
    });

    const requestNumber = generateRequestNumber();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    const quoteRequest = await prisma.equipment_quote_requests.create({
      data: {
        requestNumber,
        customerId: customerId || null,
        customerName, customerEmail, customerPhone,
        companyName: companyName || null,
        equipmentCategory,
        equipmentType,
        equipmentName: equipmentName || null,
        quantity: quantity || 1,
        rentalDuration: rentalDuration || 'daily',
        rentalDays: rentalDays,
        deliveryCity, deliveryAddress,
        siteType: siteType || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        needOperator: needOperator || false,
        needDelivery: needDelivery !== false,
        needInstallation: needInstallation || false,
        requirements: requirements || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        locationId: location?.id || null,
        status: 'PENDING',
        expiresAt,
        quotesOpenTill,
      },
    });

    // Non-blocking vendor notification
    sendQuoteRequestNotificationToVendors({
      requestId: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      locationId: location?.id || deliveryCity,
      locationName: location?.name || deliveryCity,
      customerName,
      serviceType: 'equipment',
      serviceDisplayName: 'Equipment Rental',
    }).catch((err: any) => console.error('[Notification] Failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Equipment quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        equipmentCategory: quoteRequest.equipmentCategory,
        equipmentType: quoteRequest.equipmentType,
        deliveryCity: quoteRequest.deliveryCity,
        startDate: quoteRequest.startDate,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create equipment quote request', error);
    return NextResponse.json({ error: 'Failed to create quote request', details: error?.message }, { status: 500 });
  }
}

// GET - List Equipment Quote Requests for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json({ error: 'Customer ID, phone, or email required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    else if (phone) whereClause.customerPhone = phone;
    else if (email) whereClause.customerEmail = email;
    if (status && status !== 'all') whereClause.status = status;

    const requests = await prisma.equipment_quote_requests.findMany({
      where: whereClause,
      include: {
        equipment_quotes: {
          where: { status: { in: ['SENT', 'VIEWED'] } },
          select: { id: true, quoteNumber: true, vendorId: true, totalAmount: true, status: true, validTill: true },
          orderBy: { totalAmount: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        equipmentCategory: r.equipmentCategory,
        equipmentType: r.equipmentType,
        quantity: r.quantity,
        deliveryCity: r.deliveryCity,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.equipment_quotes,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch equipment quote requests', error);
    return NextResponse.json({ error: 'Failed to fetch requests', details: error?.message }, { status: 500 });
  }
}
