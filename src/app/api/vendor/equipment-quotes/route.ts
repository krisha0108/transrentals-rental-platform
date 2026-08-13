// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateQuoteNumber(): string {
  const prefix = 'EQ';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// GET - Get Equipment Quotes submitted by vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;


    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = { vendorId: vendorId };
    if (status && status !== 'all') {
      const statuses = status.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      whereClause.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    // DATE FILTERING — equipment_quotes has no sentAt column; createdAt is the
    // close proxy here since rows are inserted at send-time (status: 'SENT' on
    // create). Normalize startDate to local midnight so an IST server doesn't
    // drop the first 5.5h of the day.
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        whereClause.createdAt.gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    // SEARCH FILTER
    const search = searchParams.get('search')?.trim();
    if (search) {
      whereClause.OR = [
        { quoteNumber: { contains: search } },
        { equipmentModel: { contains: search } },
        {
          equipment_quote_requests: {
            OR: [
              { requestNumber: { contains: search } },
              { customerName: { contains: search } },
              { deliveryCity: { contains: search } },
              { equipmentCategory: { contains: search } },
              { equipmentName: { contains: search } },
            ],
          },
        },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.equipment_quotes.findMany({
        where: whereClause,
        include: {
          equipment_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              customerName: true,
              customerEmail: true,
              customerPhone: true,
              companyName: true,
              equipmentCategory: true,
              equipmentType: true,
              equipmentName: true,
              quantity: true,
              rentalDuration: true,
              rentalDays: true,
              startDate: true,
              endDate: true,
              deliveryCity: true,
              deliveryAddress: true,
              siteType: true,
              needOperator: true,
              needDelivery: true,
              needInstallation: true,
              requirements: true,
              budgetMin: true,
              budgetMax: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.equipment_quotes.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        requestId: q.requestId,
        vendorId: q.vendorId,
        templateId: q.templateId,
        equipmentName: q.equipmentName,
        equipmentModel: q.equipmentModel,
        equipmentYear: q.equipmentYear,
        equipmentCondition: q.equipmentCondition,
        equipmentImages: q.equipmentImages,
        dailyRate: q.dailyRate,
        weeklyRate: q.weeklyRate,
        monthlyRate: q.monthlyRate,
        operatorCharges: q.operatorCharges,
        fuelCharges: q.fuelCharges,
        deliveryCharges: q.deliveryCharges,
        pickupCharges: q.pickupCharges,
        securityDeposit: q.securityDeposit,
        gstAmount: q.gstAmount,
        totalAmount: q.totalAmount,
        inclusions: q.inclusions,
        exclusions: q.exclusions,
        termsConditions: q.termsConditions,
        notes: q.notes,
        status: q.status,
        validTill: q.validTill,
        validityDays: q.validityDays,
        request: q.equipment_quote_requests,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor equipment quotes', error);
    return NextResponse.json({ error: 'Failed to fetch quotes', details: error?.message }, { status: 500 });
  }
}

// POST - Submit a new Equipment Quote
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;


    // Get vendor

    const vendor = await prisma.vendors.findFirst({

      where: { id: vendorId },
      select: { id: true, businessName: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      requestId,
      templateId,
      vendorFleetId,
      equipmentName,
      equipmentCategory,
      equipmentModel,
      equipmentYear,
      equipmentCondition,
      equipmentImages,
      dailyRate,
      weeklyRate,
      monthlyRate,
      operatorCharges,
      fuelCharges,
      deliveryCharges,
      pickupCharges,
      installationCharges,
      securityDeposit,
      gstAmount,
      totalAmount: providedTotal,
      rentalStartDate,
      rentalEndDate,
      rentalDays: providedRentalDays,
      availableFrom,
      inclusions,
      exclusions,
      termsConditions,
      validityDays,
      notes,
      vendorMessage,
      customValidTill,
      advanceAmount = 0,
      advancePercent = 30,
      customAdvanceAmount,
    } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Verify request exists and is open for quotes
    const quoteRequest = await prisma.equipment_quote_requests.findUnique({
      where: { id: requestId },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
      return NextResponse.json({ error: 'This request is no longer accepting quotes' }, { status: 400 });
    }

    if (new Date() > new Date(quoteRequest.quotesOpenTill)) {
      return NextResponse.json({ error: 'Quote submission window has closed' }, { status: 400 });
    }

    // Check if vendor already submitted a quote
    const existingQuote = await prisma.equipment_quotes.findFirst({
      where: { requestId, vendorId: vendorId, status: { notIn: ['WITHDRAWN', 'EXPIRED'] } },
    });

    if (existingQuote) {
      return NextResponse.json({ error: 'You have already submitted a quote for this request' }, { status: 400 });
    }

    // Calculate total based on duration
    // rentalDuration is the type (daily/weekly/monthly), rentalDays is the actual number
    let rentalAmount = 0;
    const durationType = quoteRequest.rentalDuration || 'daily';
    const rentalDays = quoteRequest.rentalDays || 1;
    const quantity = quoteRequest.quantity || 1;

    if (durationType === 'monthly' && monthlyRate) {
      // For monthly, calculate based on months (approximate)
      const months = Math.ceil(rentalDays / 30);
      rentalAmount = monthlyRate * months * quantity;
    } else if (durationType === 'weekly' && weeklyRate) {
      // For weekly, calculate based on weeks
      const weeks = Math.ceil(rentalDays / 7);
      rentalAmount = weeklyRate * weeks * quantity;
    } else if (dailyRate) {
      // Default to daily rate
      rentalAmount = dailyRate * rentalDays * quantity;
    }

    // Use provided total or calculate
    const calculatedTotal =
      rentalAmount +
      (operatorCharges || 0) +
      (fuelCharges || 0) +
      (deliveryCharges || 0) +
      (pickupCharges || 0) +
      (installationCharges || 0) +
      (gstAmount || 0);

    const totalAmount = providedTotal || calculatedTotal;

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be greater than zero' }, { status: 400 });
    }

    // Get equipment name from request if not provided
    const finalEquipmentName = equipmentName || quoteRequest.equipmentType || 'Equipment';

    const quoteNumber = generateQuoteNumber();
    const useCustomValidity = customValidTill && !isNaN(new Date(customValidTill).getTime());
    const finalValidityDays = useCustomValidity ? null : (validityDays || 7);
    let validTill: Date;
    if (useCustomValidity) {
      validTill = new Date(customValidTill);
    } else {
      validTill = new Date();
      validTill.setDate(validTill.getDate() + finalValidityDays!);
      validTill.setHours(23, 59, 59, 999);
    }
    const storedValidityDays = useCustomValidity
      ? Math.max(1, Math.ceil((validTill.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : finalValidityDays!;

    // Update template usage count if template was used
    if (templateId) {
      await prisma.vendor_equipment_templates.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      }).catch(() => {}); // Ignore if template not found
    }

    // Fetch fleet vehicle images if vendorFleetId is provided
    let finalEquipmentImages = equipmentImages; // Use provided images if any
    if (vendorFleetId && !equipmentImages) {
      try {
        const fleetVehicle = await prisma.vendor_fleets.findUnique({
          where: { id: vendorFleetId },
          include: {
            vehicle_models: {
              select: {
                sideImage: true, // Featured image from admin
              },
            },
          },
        });

        if (fleetVehicle) {
          const images: string[] = [];

          // Add featured image from vehicle model (admin's image)
          if (fleetVehicle.vehicle_models?.sideImage) {
            images.push(fleetVehicle.vehicle_models.sideImage);
          }

          // Add vendor's fleet images (up to 5 more)
          if (fleetVehicle.images) {
            try {
              const vendorImages = JSON.parse(fleetVehicle.images);
              if (Array.isArray(vendorImages)) {
                // Add up to 5 vendor images
                images.push(...vendorImages.slice(0, 5));
              }
            } catch (e) {
              logger.warn('Failed to parse vendor fleet images', e);
            }
          }

          // Only set if we have at least one image
          if (images.length > 0) {
            finalEquipmentImages = images;
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch fleet vehicle images', error);
        // Continue without images - don't fail the quote submission
      }
    }

    // Check if a withdrawn quote exists (re-quote after withdrawal)
    const withdrawnQuote = await prisma.equipment_quotes.findFirst({
      where: { requestId, vendorId: vendorId, status: { in: ['WITHDRAWN', 'EXPIRED'] } },
      select: { id: true },
    });

    const quoteFields = {
      quoteNumber,
      equipmentName: finalEquipmentName,
      equipmentModel: equipmentModel || null,
      equipmentYear: equipmentYear || null,
      equipmentCondition: equipmentCondition || null,
      equipmentImages: finalEquipmentImages ? JSON.stringify(finalEquipmentImages) : null,
      dailyRate: dailyRate || 0,
      weeklyRate: weeklyRate || null,
      monthlyRate: monthlyRate || null,
      operatorCharges: operatorCharges || 0,
      fuelCharges: fuelCharges || 0,
      deliveryCharges: deliveryCharges || 0,
      pickupCharges: pickupCharges || 0,
      installationCharges: installationCharges || 0,
      securityDeposit: securityDeposit || 0,
      gstAmount: gstAmount || 0,
      // Rental before add-ons. It was never written, so the stored breakdown
      // could not be reconciled against totalAmount.
      baseAmount: rentalAmount,
      totalAmount,
      advanceAmount: customAdvanceAmount > 0
        ? Math.round(customAdvanceAmount)
        : advanceAmount > 0
        ? Math.round(advanceAmount)
        : Math.round(totalAmount * advancePercent / 100),
      advancePercent: customAdvanceAmount > 0 ? 0 : advancePercent,
      inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : (inclusions || null),
      exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : (exclusions || null),
      termsConditions: Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : (termsConditions || null),
      notes: notes || vendorMessage || null,
      status: 'SENT',
      validTill,
    };

    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = withdrawnQuote
        ? await tx.equipment_quotes.update({
            where: { id: withdrawnQuote.id },
            data: {
              ...quoteFields,
              vendor_equipment_templates: templateId ? { connect: { id: templateId } } : { disconnect: true },
            },
          })
        : await tx.equipment_quotes.create({
            data: { id: generateId(), requestId, vendorId: vendorId, templateId: templateId || null, ...quoteFields },
          });

      // Update request status and quote count
      await tx.equipment_quote_requests.update({
        where: { id: requestId },
        data: {
          status: 'QUOTES_RECEIVED',
          ...(withdrawnQuote ? {} : { totalQuotesReceived: { increment: 1 } }),
        },
      });

      return newQuote;
    });

    // Create notification for customer (outside transaction) - Store requestId so customer can fetch request details
    try {
      await prisma.notifications.create({
        data: {
          customerId: quoteRequest.customerId,
          title: '🏗️ New Equipment Quote Received!',
          body: `${vendor.businessName} has sent you a quote for ${equipmentName}. Total: ₹${totalAmount}. Valid till ${validTill.toLocaleDateString()}.`,
          type: 'quote',
          serviceType: 'equipment',
          quoteId: requestId, // Use requestId for navigation
          isRead: false,
        },
      });
      logger.info('Notification created for equipment quote', { requestId, quoteId: quote.id, customerId: quoteRequest.customerId });

      // Send FCM push notification to customer
      if (quoteRequest.customerId) {
        sendNotificationToCustomer(
          quoteRequest.customerId,
          {
            title: '🏗️ New Equipment Quote Received!',
            body: `${vendor.businessName} has sent you a quote for ${equipmentName}. Total: ₹${totalAmount}.`,
          },
          {
            type: 'quote',
            serviceType: 'equipment',
            requestId: requestId,
            quoteId: quote.id,
            action: 'quote_received',
          }
        ).catch((err: any) => console.error('[EquipQuote] Customer push failed:', err));
      }
    } catch (notifError) {
      logger.error('Failed to create notification for equipment quote', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        totalAmount: quote.totalAmount,
        status: quote.status,
        validTill: quote.validTill,
      },
    });
  } catch (error: any) {
    logger.error('Failed to submit equipment quote', error);
    return NextResponse.json({ error: 'Failed to submit quote', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update an Equipment Quote (before accepted)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const body = await request.json();
    const { quoteId, ...updateData } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
    }

    const quote = await prisma.equipment_quotes.findUnique({
      where: { id: quoteId },
      include: { request: true },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (quote.vendorId !== vendorId) {
      return NextResponse.json({ error: 'Unauthorized to update this quote' }, { status: 403 });
    }

    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
      return NextResponse.json({ error: 'Cannot update quote in current status' }, { status: 400 });
    }

    // Recalculate total if rates are updated
    const dailyRate = updateData.dailyRate ?? quote.dailyRate;
    const weeklyRate = updateData.weeklyRate ?? quote.weeklyRate;
    const monthlyRate = updateData.monthlyRate ?? quote.monthlyRate;
    const operatorCharges = updateData.operatorCharges ?? quote.operatorCharges;
    const fuelCharges = updateData.fuelCharges ?? quote.fuelCharges;
    const deliveryCharges = updateData.deliveryCharges ?? quote.deliveryCharges;
    const pickupCharges = updateData.pickupCharges ?? quote.pickupCharges;
    const gstAmount = updateData.gstAmount ?? quote.gstAmount;

    const durationType = quote.request.rentalDuration || 'daily';
    const rentalDays = quote.request.rentalDays || 1;
    const quantity = quote.request.quantity || 1;

    let rentalAmount = 0;
    if (durationType === 'monthly' && monthlyRate) {
      const months = Math.ceil(rentalDays / 30);
      rentalAmount = monthlyRate * months * quantity;
    } else if (durationType === 'weekly' && weeklyRate) {
      const weeks = Math.ceil(rentalDays / 7);
      rentalAmount = weeklyRate * weeks * quantity;
    } else if (dailyRate) {
      rentalAmount = dailyRate * rentalDays * quantity;
    }

    const totalAmount = rentalAmount + operatorCharges + fuelCharges + deliveryCharges + pickupCharges + gstAmount;

    const updatedQuote = await prisma.equipment_quotes.update({
      where: { id: quoteId },
      data: {
        ...updateData,
        totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully',
      quote: {
        id: updatedQuote.id,
        quoteNumber: updatedQuote.quoteNumber,
        totalAmount: updatedQuote.totalAmount,
        status: updatedQuote.status,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update equipment quote', error);
    return NextResponse.json({ error: 'Failed to update quote', details: error?.message }, { status: 500 });
  }
}
