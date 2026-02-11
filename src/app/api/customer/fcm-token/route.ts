export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST /api/customer/fcm-token - Save FCM token for push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, fcm_token } = body;

    if (!customer_id || !fcm_token) {
      return NextResponse.json(
        { success: false, message: 'Customer ID and FCM token are required' },
        { status: 400 }
      );
    }

    // Update customer's FCM token
    await prisma.customers.update({
      where: { id: customer_id },
      data: { fcmToken: fcm_token },
    });

    console.log(`✅ FCM token saved for customer: ${customer_id}`);

    return NextResponse.json({
      success: true,
      message: 'FCM token saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save FCM token' },
      { status: 500 }
    );
  }
}
