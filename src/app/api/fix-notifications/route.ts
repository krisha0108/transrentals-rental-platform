import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fix-notifications
 * Checks and fixes notifications with bad quote/booking IDs
 */
export async function GET(request: NextRequest) {
  try {
    // Find notifications with potentially bad IDs
    const allNotifications = await prisma.notifications.findMany({
      where: {
        OR: [
          { quoteId: { not: null } },
          { bookingId: { not: null } }
        ]
      },
      select: {
        id: true,
        title: true,
        quoteId: true,
        bookingId: true,
        createdAt: true,
        customerId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    const issues: any[] = [];
    const fixes: any[] = [];

    for (const notif of allNotifications) {
      let needsFix = false;
      const fixData: any = {};

      // Check quote ID
      if (notif.quoteId) {
        const hasTrailingDash = notif.quoteId.endsWith('-');
        const tooShort = notif.quoteId.length < 10;
        const isNullString = notif.quoteId === 'null';

        if (hasTrailingDash || tooShort || isNullString) {
          needsFix = true;
          issues.push({
            notificationId: notif.id,
            issue: 'Bad quote ID',
            original: notif.quoteId,
            reason: hasTrailingDash ? 'trailing dash' : tooShort ? 'too short' : 'null string'
          });

          if (hasTrailingDash) {
            // Remove trailing dashes
            fixData.quoteId = notif.quoteId.replace(/-+$/, '');
          } else {
            // Set to null if invalid
            fixData.quoteId = null;
          }
        }
      }

      // Check booking ID
      if (notif.bookingId) {
        const isNullString = notif.bookingId === 'null';
        const tooShort = notif.bookingId.length < 10;

        if (isNullString || tooShort) {
          needsFix = true;
          issues.push({
            notificationId: notif.id,
            issue: 'Bad booking ID',
            original: notif.bookingId,
            reason: isNullString ? 'null string' : 'too short'
          });
          fixData.bookingId = null;
        }
      }

      // Apply fixes
      if (needsFix) {
        await prisma.notifications.update({
          where: { id: notif.id },
          data: fixData
        });

        fixes.push({
          notificationId: notif.id,
          title: notif.title,
          original: {
            quoteId: notif.quoteId,
            bookingId: notif.bookingId
          },
          fixed: fixData
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Found ${issues.length} issues, fixed ${fixes.length} notifications`,
      totalChecked: allNotifications.length,
      issues,
      fixes
    });
  } catch (error) {
    console.error('Error fixing notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix notifications' },
      { status: 500 }
    );
  }
}
