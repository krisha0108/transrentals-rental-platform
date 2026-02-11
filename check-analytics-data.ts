import { prisma } from './src/lib/db/prisma';

async function checkData() {
  try {
    const [webVitals, pageViews, seoAudits, searchQueries, pageAnalytics] = await Promise.all([
      prisma.web_vitals.count(),
      prisma.page_views.count(),
      prisma.seo_audits.count(),
      prisma.search_queries.count(),
      prisma.page_analytics.count(),
    ]);

    console.log('📊 Analytics Data Count:');
    console.log('  web_vitals:', webVitals);
    console.log('  page_views:', pageViews);
    console.log('  seo_audits:', seoAudits);
    console.log('  search_queries:', searchQueries);
    console.log('  page_analytics:', pageAnalytics);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
