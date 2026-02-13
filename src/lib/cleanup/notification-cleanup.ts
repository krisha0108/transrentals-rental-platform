/**
 * Notification Cleanup Utility
 * Automatically deletes old OTP notifications to prevent database bloat
 */

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

/**
 * Delete OTP notifications older than 1 day
 * OTP notifications are temporary and should be cleaned up regularly
 */
export async function cleanupOtpNotifications() {
  try {
    // Calculate cutoff date (1 day ago)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    logger.info('Starting OTP notification cleanup', { cutoffDate: oneDayAgo });

    // Delete notifications that:
    // 1. Have "OTP" in the title (case-insensitive)
    // 2. Are older than 1 day
    const result = await prisma.notifications.deleteMany({
      where: {
        AND: [
          {
            title: {
              contains: 'OTP',
              mode: 'insensitive',
            },
          },
          {
            createdAt: {
              lt: oneDayAgo,
            },
          },
        ],
      },
    });

    logger.info('OTP notification cleanup completed', {
      deletedCount: result.count,
      cutoffDate: oneDayAgo,
    });

    return {
      success: true,
      deletedCount: result.count,
      cutoffDate: oneDayAgo,
    };
  } catch (error: any) {
    logger.error('Failed to cleanup OTP notifications', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete all read notifications older than specified days
 * Optional: Use this to clean up old read notifications
 */
export async function cleanupOldReadNotifications(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    logger.info('Starting old read notification cleanup', { cutoffDate, daysOld });

    const result = await prisma.notifications.deleteMany({
      where: {
        AND: [
          {
            isRead: true,
          },
          {
            createdAt: {
              lt: cutoffDate,
            },
          },
        ],
      },
    });

    logger.info('Old read notification cleanup completed', {
      deletedCount: result.count,
      cutoffDate,
      daysOld,
    });

    return {
      success: true,
      deletedCount: result.count,
      cutoffDate,
      daysOld,
    };
  } catch (error: any) {
    logger.error('Failed to cleanup old read notifications', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get notification cleanup stats
 */
export async function getCleanupStats() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const [totalNotifications, otpNotifications, oldOtpNotifications, readNotifications] = await Promise.all([
      prisma.notifications.count(),
      prisma.notifications.count({
        where: {
          title: {
            contains: 'OTP',
            mode: 'insensitive',
          },
        },
      }),
      prisma.notifications.count({
        where: {
          AND: [
            {
              title: {
                contains: 'OTP',
                mode: 'insensitive',
              },
            },
            {
              createdAt: {
                lt: oneDayAgo,
              },
            },
          ],
        },
      }),
      prisma.notifications.count({
        where: {
          isRead: true,
        },
      }),
    ]);

    return {
      totalNotifications,
      otpNotifications,
      oldOtpNotifications,
      readNotifications,
      estimatedCleanupSize: oldOtpNotifications,
    };
  } catch (error: any) {
    logger.error('Failed to get cleanup stats', error);
    throw error;
  }
}
