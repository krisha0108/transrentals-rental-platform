// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

// POST — Submit a rating for a P2P transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      transactionId,
      overallRating,
      vehicleRating,
      driverRating,
      communicationRating,
      paymentRating,
      review,
    } = body;

    // Validate required fields
    if (!transactionId || overallRating === undefined || overallRating === null) {
      return NextResponse.json(
        { error: 'transactionId and overallRating are required' },
        { status: 400 }
      );
    }

    // Validate overallRating range (1-5)
    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: 'overallRating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify transaction exists
    const transaction = await prisma.p2p_transactions.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify vendor is vendorA or vendorB in this transaction
    const isVendorA = transaction.vendorAId === auth.vendorId;
    const isVendorB = transaction.vendorBId === auth.vendorId;

    if (!isVendorA && !isVendorB) {
      return NextResponse.json(
        { error: 'You are not part of this transaction' },
        { status: 403 }
      );
    }

    // Verify transaction tripStatus is COMPLETED
    if (transaction.tripStatus !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Transaction must be completed before rating' },
        { status: 400 }
      );
    }

    // Verify vendor hasn't already rated this transaction (unique constraint: transactionId + raterVendorId)
    const existingRating = await prisma.p2p_ratings.findUnique({
      where: {
        transactionId_raterVendorId: {
          transactionId: transactionId,
          raterVendorId: auth.vendorId,
        },
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this transaction' },
        { status: 409 }
      );
    }

    // Determine the rated vendor (the OTHER vendor)
    const ratedVendorId = isVendorA ? transaction.vendorBId : transaction.vendorAId;

    // Generate ID efficiently (single-row MAX query instead of full table scan)
    const maxIdResult: any[] = await prisma.$queryRaw`SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as maxNum FROM p2p_ratings WHERE id LIKE 'PRT_%'`;
    const newId = `PRT_${(Number(maxIdResult?.[0]?.maxNum) || 0) + 1}`;

    // Create the rating
    const rating = await prisma.p2p_ratings.create({
      data: {
        id: newId,
        transactionId,
        raterVendorId: auth.vendorId,
        ratedVendorId,
        overallRating: parseFloat(String(overallRating)),
        vehicleRating: vehicleRating ? parseFloat(String(vehicleRating)) : null,
        driverRating: driverRating ? parseFloat(String(driverRating)) : null,
        communicationRating: communicationRating ? parseFloat(String(communicationRating)) : null,
        paymentRating: paymentRating ? parseFloat(String(paymentRating)) : null,
        review: review || null,
      },
      include: {
        transaction: {
          select: {
            transactionNumber: true,
            fromCity: true,
            toCity: true,
          },
        },
        ratedVendor: {
          select: {
            businessName: true,
            logo: true,
          },
        },
        raterVendor: {
          select: {
            businessName: true,
            logo: true,
          },
        },
      },
    });

    // Calculate the rated vendor's P2P average rating
    const allRatings = await prisma.p2p_ratings.findMany({
      where: { ratedVendorId: ratedVendorId },
      select: { overallRating: true },
    });
    const avgRating =
      allRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRatings.length;

    logger.info('P2P rating submitted', {
      ratingId: newId,
      transactionId,
      raterVendorId: auth.vendorId,
      ratedVendorId,
      overallRating,
    });

    // Notify rated vendor about the new rating
    sendVendorDirectNotification({
      vendorId: ratedVendorId,
      title: '⭐ New Rating Received',
      body: `${rating.raterVendor?.businessName || 'A vendor'} rated you ${overallRating}★ on transaction #${rating.transaction?.transactionNumber || transactionId}`,
      type: 'p2p_rating_received',
      serviceType: 'p2p',
      bookingId: transactionId,
      bookingNumber: rating.transaction?.transactionNumber || '',
    }).catch((err: any) => console.error('[P2P] Notify rating failed:', err));

    return NextResponse.json({
      success: true,
      rating,
      ratedVendorAvgP2PRating: parseFloat(avgRating.toFixed(2)),
      totalP2PRatings: allRatings.length,
    });
  } catch (error: any) {
    logger.error('P2P rating POST error', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

// GET — Get ratings for a vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || auth.vendorId;

    // Fetch ratings where the vendor is the rated vendor
    const ratings = await prisma.p2p_ratings.findMany({
      where: { ratedVendorId: vendorId },
      include: {
        raterVendor: {
          select: {
            id: true,
            businessName: true,
            logo: true,
          },
        },
        transaction: {
          select: {
            transactionNumber: true,
            fromCity: true,
            toCity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average ratings
    const totalRatings = ratings.length;
    let avgOverall = 0;
    let avgVehicle = 0;
    let avgDriver = 0;
    let avgCommunication = 0;
    let avgPayment = 0;
    let vehicleCount = 0;
    let driverCount = 0;
    let communicationCount = 0;
    let paymentCount = 0;

    for (const r of ratings) {
      avgOverall += r.overallRating;
      if (r.vehicleRating !== null) {
        avgVehicle += r.vehicleRating;
        vehicleCount++;
      }
      if (r.driverRating !== null) {
        avgDriver += r.driverRating;
        driverCount++;
      }
      if (r.communicationRating !== null) {
        avgCommunication += r.communicationRating;
        communicationCount++;
      }
      if (r.paymentRating !== null) {
        avgPayment += r.paymentRating;
        paymentCount++;
      }
    }

    const averages = {
      overall: totalRatings > 0 ? parseFloat((avgOverall / totalRatings).toFixed(2)) : 0,
      vehicle: vehicleCount > 0 ? parseFloat((avgVehicle / vehicleCount).toFixed(2)) : null,
      driver: driverCount > 0 ? parseFloat((avgDriver / driverCount).toFixed(2)) : null,
      communication: communicationCount > 0 ? parseFloat((avgCommunication / communicationCount).toFixed(2)) : null,
      payment: paymentCount > 0 ? parseFloat((avgPayment / paymentCount).toFixed(2)) : null,
    };

    logger.info('P2P ratings fetched', { vendorId, totalRatings });

    return NextResponse.json({
      success: true,
      vendorId,
      totalRatings,
      averages,
      ratings,
    });
  } catch (error: any) {
    logger.error('P2P ratings GET error', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}
