import { syncGA4Data, isGA4Connected, listGA4Properties } from '../src/lib/integrations/google-analytics-4';
import { prisma } from '../src/lib/db/prisma';

/**
 * Manual Google Analytics 4 Data Sync Script
 *
 * Usage:
 *   npx tsx scripts/sync-ga4-data.ts <propertyId> [days]
 *
 * Examples:
 *   npx tsx scripts/sync-ga4-data.ts 123456789
 *   npx tsx scripts/sync-ga4-data.ts 123456789 30
 *   npx tsx scripts/sync-ga4-data.ts list   (List available properties)
 */

async function runSync() {
  try {
    const args = process.argv.slice(2);

    console.log('🔍 Google Analytics 4 Data Sync Tool');
    console.log('═══════════════════════════════════════\n');

    // Check if GA4 is connected
    const isConnected = await isGA4Connected();
    if (!isConnected) {
      console.error('❌ Google Analytics 4 is not connected');
      console.log('\nPlease connect GA4 first:');
      console.log('1. Visit: http://localhost:3000/admin/analytics/integrations');
      console.log('2. Click "Connect Google Analytics 4"');
      console.log('3. Authorize the application\n');
      process.exit(1);
    }

    console.log('✅ GA4 is connected\n');

    // List properties if requested
    if (args[0] === 'list') {
      console.log('📊 Fetching available GA4 properties...\n');

      const properties = await listGA4Properties();

      if (properties.length === 0) {
        console.log('⚠️  No properties found');
        console.log('Please ensure your Google account has access to GA4 properties\n');
        process.exit(0);
      }

      console.log(`Found ${properties.length} GA4 properties:\n`);
      properties.forEach((prop: any, index: number) => {
        const propertyId = prop.name?.split('/').pop() || 'unknown';
        console.log(`${index + 1}. ${prop.displayName || 'Unnamed Property'}`);
        console.log(`   Property ID: ${propertyId}`);
        console.log(`   Name: ${prop.name}`);
        console.log(`   Industry: ${prop.industryCategory || 'N/A'}`);
        console.log(`   Timezone: ${prop.timeZone || 'N/A'}\n`);
      });

      console.log('To sync data for a property, run:');
      console.log('npx tsx scripts/sync-ga4-data.ts <propertyId> [days]\n');
      process.exit(0);
    }

    // Validate arguments
    if (args.length < 1) {
      console.error('❌ Property ID is required');
      console.log('\nUsage: npx tsx scripts/sync-ga4-data.ts <propertyId> [days]');
      console.log('\nExamples:');
      console.log('  npx tsx scripts/sync-ga4-data.ts 123456789');
      console.log('  npx tsx scripts/sync-ga4-data.ts 123456789 30');
      console.log('  npx tsx scripts/sync-ga4-data.ts list   (List available properties)\n');
      process.exit(1);
    }

    const propertyId = args[0];
    const days = parseInt(args[1] || '7', 10);

    // Validate days
    if (days < 1 || days > 365) {
      console.error('❌ Days must be between 1 and 365');
      process.exit(1);
    }

    console.log(`📊 Property ID: ${propertyId}`);
    console.log(`📅 Date Range: Last ${days} days\n`);
    console.log('🔄 Starting data sync...\n');

    const startTime = Date.now();

    const result = await syncGA4Data(propertyId, days);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ GA4 Data Sync Complete!\n');
    console.log(`⏱️  Duration: ${duration}s\n`);

    console.log('📊 Data Summary:');
    console.log(`   Traffic Sources: ${result.trafficSources.rows?.length || 0} rows`);
    console.log(`   Page Performance: ${result.pagePerformance.rows?.length || 0} rows`);
    console.log(`   Demographics: ${result.demographics.rows?.length || 0} rows`);
    console.log(`   Events: ${result.events.rows?.length || 0} rows\n`);

    console.log('═══════════════════════════════════════\n');

    console.log('💡 Next steps:');
    console.log('1. View GA4 analytics at: http://localhost:3000/admin/analytics/ga4');
    console.log('2. Schedule this script to run daily for automatic syncing');
    console.log('3. Compare GA4 data with GSC data for comprehensive insights\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    if (error instanceof Error) {
      console.error('Error:', error.message);

      if (error.message.includes('Not authenticated')) {
        console.log('\nPlease reconnect Google Analytics 4:');
        console.log('Visit: http://localhost:3000/admin/analytics/integrations\n');
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSync();
