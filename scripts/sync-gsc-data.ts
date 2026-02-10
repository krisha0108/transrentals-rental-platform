import { syncSearchQueries, isGSCConnected } from '../src/lib/integrations/google-search-console';

/**
 * Manual script to sync Google Search Console data
 * Usage: npx tsx scripts/sync-gsc-data.ts [siteUrl] [days]
 *
 * Examples:
 *   npx tsx scripts/sync-gsc-data.ts https://example.com 90
 *   npx tsx scripts/sync-gsc-data.ts sc-domain:example.com 30
 */
async function syncGSCData() {
  try {
    console.log('🔍 Checking Google Search Console connection...\n');

    const isConnected = await isGSCConnected();

    if (!isConnected) {
      console.error('❌ Google Search Console is not connected!');
      console.log('\n📝 To connect GSC:');
      console.log('   1. Add credentials to .env:');
      console.log('      GOOGLE_CLIENT_ID=your_client_id');
      console.log('      GOOGLE_CLIENT_SECRET=your_client_secret');
      console.log('      GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gsc/callback');
      console.log('   2. Visit: http://localhost:3000/admin/analytics/integrations');
      console.log('   3. Click "Connect Google Search Console"');
      console.log('   4. Authorize access\n');
      process.exit(1);
    }

    console.log('✅ GSC is connected!\n');

    // Get site URL from command line args or use default
    const args = process.argv.slice(2);
    const siteUrl = args[0];
    const days = args[1] ? parseInt(args[1]) : 90;

    if (!siteUrl) {
      console.error('❌ Site URL is required!');
      console.log('\nUsage: npx tsx scripts/sync-gsc-data.ts [siteUrl] [days]');
      console.log('\nExamples:');
      console.log('  npx tsx scripts/sync-gsc-data.ts https://example.com 90');
      console.log('  npx tsx scripts/sync-gsc-data.ts sc-domain:example.com 30\n');
      process.exit(1);
    }

    console.log(`🚀 Starting sync for: ${siteUrl}`);
    console.log(`📅 Fetching last ${days} days of data\n`);
    console.log('═══════════════════════════════════════\n');

    const result = await syncSearchQueries(siteUrl, days);

    console.log('\n═══════════════════════════════════════');
    console.log('✨ Sync Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total Rows Fetched: ${result.total}`);
    console.log(`   New Records Created: ${result.created}`);
    console.log(`   Existing Records Updated: ${result.updated}`);
    console.log('═══════════════════════════════════════\n');

    console.log('💡 Next Steps:');
    console.log('   - View rankings at: http://localhost:3000/admin/analytics/rankings');
    console.log('   - Set up cron job for daily automated sync');
    console.log('   - Monitor keyword positions and trends\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

syncGSCData();
