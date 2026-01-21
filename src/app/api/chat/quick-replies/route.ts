// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Default system quick replies
const SYSTEM_QUICK_REPLIES = [
  { title: 'Greet', message: 'Hello! Thank you for reaching out. How can I help you today?', category: 'greeting' },
  { title: 'Availability', message: 'Yes, the vehicle is available for your requested dates. Would you like to proceed with the booking?', category: 'availability' },
  { title: 'Price Info', message: 'The pricing for your trip would be based on the distance and duration. Let me share the details:', category: 'pricing' },
  { title: 'Confirm Booking', message: 'Great! Your booking is confirmed. I will share the driver details shortly.', category: 'booking' },
  { title: 'Need Details', message: 'To provide you an accurate quote, I need a few more details:\n- Pickup location\n- Drop location\n- Date and time', category: 'info' },
  { title: 'Thanks', message: 'Thank you for choosing us! We look forward to serving you.', category: 'closing' },
  { title: 'Call Request', message: 'Sure, I can arrange a call. What would be a convenient time for you?', category: 'support' },
  { title: 'Payment Info', message: 'You can make payment via:\n- UPI\n- Bank Transfer\n- Cash\n\nLet me know your preferred method.', category: 'payment' },
];

// GET - Get quick replies for vendor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let vendorId: string | null = null;

    if (session?.user?.email) {
      const vendor = await prisma.vendors.findFirst({
        where: { email: session.user.email },
        select: { id: true },
      });
      vendorId = vendor?.id || null;
    }

    // Build where clause
    const whereClause: any = {
      isActive: true,
      OR: [
        { vendorId: null }, // System templates
        ...(vendorId ? [{ vendorId }] : []),
      ],
    };

    if (category && category !== 'all') {
      whereClause.chauffeur_vehicle_categories = category;
    }

    // Get quick replies from database
    let quickReplies = await prisma.chat_quick_replies.findMany({
      where: whereClause,
      orderBy: [{ displayOrder: 'asc' }, { usageCount: 'desc' }],
    });

    // If no system replies exist, return defaults
    if (quickReplies.length === 0) {
      quickReplies = SYSTEM_QUICK_REPLIES.map((qr, index) => ({
        id: `system-${index}`,
        vendorId: null,
        title: qr.title,
        message: qr.message,
        category: qr.chauffeur_vehicle_categories,
        usageCount: 0,
        isActive: true,
        displayOrder: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    // Get categories
    const categories = [...new Set(quickReplies.map(qr => qr.chauffeur_vehicle_categories).filter(Boolean))];

    return NextResponse.json({
      success: true,
      quickReplies,
      categories: ['all', ...categories],
    });
  } catch (error: any) {
    logger.error('Failed to fetch quick replies', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick replies', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new quick reply (vendor only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendors.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, message, category } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const quickReply = await prisma.chat_quick_replies.create({
      data: {
        vendorId: vendor.id,
        title,
        message,
        category: category || 'custom',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      quickReply,
    });
  } catch (error: any) {
    logger.error('Failed to create quick reply', error);
    return NextResponse.json(
      { error: 'Failed to create quick reply', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quick reply
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendors.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Quick reply ID is required' }, { status: 400 });
    }

    // Verify ownership
    const quickReply = await prisma.chat_quick_replies.findFirst({
      where: { id, vendorId: vendor.id },
    });

    if (!quickReply) {
      return NextResponse.json({ error: 'Quick reply not found' }, { status: 404 });
    }

    await prisma.chat_quick_replies.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Quick reply deleted' });
  } catch (error: any) {
    logger.error('Failed to delete quick reply', error);
    return NextResponse.json(
      { error: 'Failed to delete quick reply', details: error?.message },
      { status: 500 }
    );
  }
}
