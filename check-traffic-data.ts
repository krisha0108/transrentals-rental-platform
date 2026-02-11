import { prisma } from './src/lib/db/prisma';

async function checkTrafficData() {
  try {
    const count = await prisma.page_views.count();
    const sample = await prisma.page_views.findMany({
      take: 5,
      select: {
        path: true,
        device: true,
        browser: true,
        sessionId: true,
        duration: true,
        referrer: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 Total page_views:', count);
    console.log('\n📝 Sample Records (Latest 5):');
    sample.forEach((pv, i) => {
      console.log(`\n  Record ${i+1}:`);
      console.log(`    Path: ${pv.path}`);
      console.log(`    Device: ${pv.device}`);
      console.log(`    Browser: ${pv.browser}`);
      console.log(`    Session: ${pv.sessionId?.substring(0, 20)}...`);
      console.log(`    Duration: ${pv.duration}s`);
      console.log(`    Referrer: ${pv.referrer || 'Direct'}`);
      console.log(`    Date: ${pv.createdAt.toISOString()}`);
    });

    // Check data quality
    console.log('\n\n🔍 Data Quality Check:');
    console.log(`  ✅ Total Records: ${count}`);
    console.log(`  ✅ Has Device Info: ${sample.filter(p => p.device).length}/${sample.length}`);
    console.log(`  ✅ Has Browser Info: ${sample.filter(p => p.browser).length}/${sample.length}`);
    console.log(`  ✅ Has Session ID: ${sample.filter(p => p.sessionId).length}/${sample.length}`);
    console.log(`  ✅ Has Duration: ${sample.filter(p => p.duration).length}/${sample.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrafficData();
