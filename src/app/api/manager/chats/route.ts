import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get chat conversations for manager's assigned locations (read-only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: { include: { locations: true } },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    if (assignedLocationIds.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
        stats: { total: 0, active: 0, closed: 0 },
      });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Get vendors in manager's assigned locations
    const vendorIds = await prisma.vendor_approved_locations.findMany({
      where: { locationId: { in: assignedLocationIds } },
      select: { vendorId: true },
      distinct: ['vendorId'],
    });

    const assignedVendorIds = vendorIds.map((v) => v.vendorId);

    if (assignedVendorIds.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
        stats: { total: 0, active: 0, closed: 0 },
      });
    }

    // Build where clause for conversations
    const whereClause: any = {
      vendorId: { in: assignedVendorIds },
    };

    if (status === 'active') {
      whereClause.status = 'ACTIVE';
    } else if (status === 'closed') {
      whereClause.status = 'CLOSED';
    }

    // Get conversations with last message
    const conversations = await prisma.chat_conversations.findMany({
      where: whereClause,
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
        vendors: {
          select: { id: true, businessName: true, ownerName: true, phone: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Filter by search if provided
    let filteredConversations = conversations;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConversations = conversations.filter(
        (c) =>
          c.customers?.name?.toLowerCase().includes(searchLower) ||
          c.customers?.email?.toLowerCase().includes(searchLower) ||
          c.customers?.phone?.includes(search) ||
          c.vendors?.businessName?.toLowerCase().includes(searchLower) ||
          c.vendors?.ownerName?.toLowerCase().includes(searchLower)
      );
    }

    // Get stats
    const stats = {
      total: filteredConversations.length,
      active: filteredConversations.filter((c) => c.status === 'ACTIVE').length,
      closed: filteredConversations.filter((c) => c.status === 'CLOSED').length,
    };

    return NextResponse.json({
      success: true,
      stats,
      conversations: filteredConversations.map((c) => ({
        id: c.id,
        bookingType: c.bookingType,
        bookingId: c.bookingId,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        customer: c.customers,
        vendors: {
          id: c.vendors?.id,
          businessName: c.vendors?.businessName,
          ownerName: c.vendors?.ownerName,
          phone: c.vendors?.phone,
        },
        lastMessage: c.lastMessageText ? {
          content: c.lastMessageText,
          senderType: c.lastSenderType,
          messageType: 'TEXT',
          createdAt: c.lastMessageAt,
        } : null,
        messageCount: c._count.messages,
      })),
    });
  } catch (error: any) {
    logger.error('Manager chats list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats', details: error?.message },
      { status: 500 }
    );
  }
}
