import { prisma } from './src/lib/db/prisma';

async function checkRankingsData() {
  try {
    const [keywords, queries, competitors] = await Promise.all([
      prisma.keyword_rankings.count(),
      prisma.search_queries.count(),
      prisma.competitor_tracking.count()
    ]);

    console.log('📊 Rankings Tables Data Count:');
    console.log('  keyword_rankings:', keywords);
    console.log('  search_queries:', queries);
    console.log('  competitor_tracking:', competitors);

    console.log('\n🎯 Data Status:');
    if (keywords === 0 && queries === 0 && competitors === 0) {
      console.log('  ⚠️ ALL TABLES EMPTY - Using MOCK DATA');
    } else {
      console.log('  ✅ Has REAL DATA in tables');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRankingsData();
