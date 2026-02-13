/**
 * Notification Cleanup Script
 * Run this script daily via cron to clean up old OTP notifications
 *
 * Usage:
 * npx tsx scripts/cleanup-notifications.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOtpNotifications() {
  try {
    console.log('🧹 Starting OTP notification cleanup...');

    // Calculate cutoff date (1 day ago)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    console.log(`📅 Cutoff date: ${oneDayAgo.toISOString()}`);

    // Delete OTP notifications older than 1 day
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

    console.log(`✅ Cleanup completed!`);
    console.log(`📊 Deleted ${result.count} old OTP notifications`);

    return result.count;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    const deletedCount = await cleanupOtpNotifications();

    console.log('\n✨ Cleanup summary:');
    console.log(`   - OTP notifications deleted: ${deletedCount}`);
    console.log(`   - Status: Success`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
