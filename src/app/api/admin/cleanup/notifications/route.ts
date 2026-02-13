// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { cleanupOtpNotifications, cleanupOldReadNotifications, getCleanupStats } from '@/lib/cleanup/notification-cleanup';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get cleanup statistics
 * Usage: GET /api/admin/cleanup/notifications
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getCleanupStats();

    return NextResponse.json({
      success: true,
      stats,
      message: 'Cleanup statistics retrieved successfully',
    });
  } catch (error: any) {
    logger.error('Failed to get cleanup stats', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cleanup statistics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Run cleanup tasks
 * Usage: POST /api/admin/cleanup/notifications
 * Body: { action: 'otp' | 'read' | 'all', daysOld?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'otp', daysOld = 30 } = body;

    let result: any = {};

    switch (action) {
      case 'otp':
        // Clean up OTP notifications older than 1 day
        result = await cleanupOtpNotifications();
        break;

      case 'read':
        // Clean up read notifications older than specified days
        result = await cleanupOldReadNotifications(daysOld);
        break;

      case 'all':
        // Run both cleanup tasks
        const otpResult = await cleanupOtpNotifications();
        const readResult = await cleanupOldReadNotifications(daysOld);
        result = {
          success: otpResult.success && readResult.success,
          otp: otpResult,
          read: readResult,
          totalDeleted: (otpResult.deletedCount || 0) + (readResult.deletedCount || 0),
        };
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use "otp", "read", or "all"',
          },
          { status: 400 }
        );
    }

    logger.info('Notification cleanup completed', { action, result });

    return NextResponse.json({
      success: true,
      result,
      message: `Cleanup completed: ${result.deletedCount || result.totalDeleted || 0} notifications deleted`,
    });
  } catch (error: any) {
    logger.error('Failed to run cleanup', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run cleanup',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
