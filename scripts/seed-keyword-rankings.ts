import { prisma } from '../src/lib/db/prisma';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Extract keywords from page paths
function extractKeywordFromPath(path: string): string | null {
  // Remove leading slash and file extensions
  let keyword = path.replace(/^\//, '').replace(/\.(html|php)$/, '');

  // Skip if it's just home or too short
  if (!keyword || keyword === '' || keyword.length < 3) return null;

  // Replace hyphens/underscores with spaces
  keyword = keyword.replace(/[-_]/g, ' ');

  // Clean up and normalize
  keyword = keyword
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Skip common pages
  const skipPages = ['admin', 'api', 'auth', 'login', 'signup', 'dashboard'];
  if (skipPages.some(skip => keyword.includes(skip))) return null;

  return keyword;
}

// Generate realistic search volume based on page views
function estimateSearchVolume(views: number): number {
  // Rough estimate: views * 10-50 (assuming 2-10% CTR)
  return Math.round(views * (20 + Math.random() * 30));
}

// Generate realistic position based on page popularity
function estimatePosition(views: number, totalViews: number): number {
  const percentile = views / totalViews;

  if (percentile > 0.1) return Math.floor(1 + Math.random() * 5); // Top pages: 1-5
  if (percentile > 0.05) return Math.floor(6 + Math.random() * 5); // Good pages: 6-10
  if (percentile > 0.02) return Math.floor(11 + Math.random() * 10); // Decent: 11-20
  if (percentile > 0.01) return Math.floor(21 + Math.random() * 30); // Average: 21-50
  return Math.floor(51 + Math.random() * 50); // Low traffic: 51-100
}

async function seedKeywordRankings() {
  try {
    console.log('🌱 Seeding keyword rankings from page_views data...\n');

    // Get page views grouped by path
    const pageViews = await prisma.page_views.groupBy({
      by: ['path'],
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 50, // Top 50 pages
    });

    console.log(`📊 Found ${pageViews.length} unique pages with traffic\n`);

    const totalViews = pageViews.reduce((sum, pv) => sum + pv._count.path, 0);
    let created = 0;
    let skipped = 0;

    for (const pv of pageViews) {
      const keyword = extractKeywordFromPath(pv.path);

      if (!keyword) {
        skipped++;
        continue;
      }

      // Check if keyword already exists
      const existing = await prisma.keyword_rankings.findFirst({
        where: { keyword },
      });

      if (existing) {
        console.log(`⏭️  Skipped: "${keyword}" (already exists)`);
        skipped++;
        continue;
      }

      const views = pv._count.path;
      const position = estimatePosition(views, totalViews);
      const previousPosition = position + Math.floor(Math.random() * 5 - 2); // Slight variation
      const bestPosition = Math.max(1, position - Math.floor(Math.random() * 3)); // Best position slightly better
      const searchVolume = estimateSearchVolume(views);
      const difficulty = Math.floor(40 + Math.random() * 40); // 40-80 difficulty

      await prisma.keyword_rankings.create({
        data: {
          id: generateId(),
          keyword,
          position,
          previousPosition,
          bestPosition,
          searchVolume,
          difficulty,
          pagePath: pv.path,
          hasFeaturedSnippet: Math.random() > 0.9, // 10% have featured snippets
          isTracking: true,
          rankHistory: null, // Historical data will come from search_queries table
          lastChecked: new Date(),
        },
      });

      console.log(`✅ Created: "${keyword}" - Position ${position} (${views} views)`);
      created++;
    }

    // Create sample search_queries data
    console.log('\n🔍 Creating search queries data...\n');

    const keywords = await prisma.keyword_rankings.findMany({
      take: 30,
    });

    let queriesCreated = 0;

    for (const kw of keywords) {
      // Create last 30 days of search query data
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const impressions = Math.floor((kw.searchVolume || 100) / 30 * (0.8 + Math.random() * 0.4)); // Daily impressions
        const ctr = kw.position! <= 3 ? 0.25 : kw.position! <= 10 ? 0.1 : kw.position! <= 20 ? 0.05 : 0.02;
        const clicks = Math.floor(impressions * ctr * (0.8 + Math.random() * 0.4));
        const avgPosition = kw.position! + Math.random() * 2 - 1; // Slight daily variation

        await prisma.search_queries.create({
          data: {
            id: generateId(),
            query: kw.keyword,
            date,
            impressions,
            clicks,
            avgPosition: Math.max(1, Math.min(100, avgPosition)),
            pagePath: kw.pagePath,
          },
        });

        queriesCreated++;
      }
    }

    console.log(`✅ Created ${queriesCreated} search query records\n`);

    // Create sample competitor data
    console.log('🏆 Creating competitor tracking data...\n');

    const competitorDomains = [
      'competitor1.com',
      'competitor2.com',
      'competitor3.com',
    ];

    let competitorsCreated = 0;

    for (const domain of competitorDomains) {
      // Track top 20 keywords against competitors
      const topKeywords = await prisma.keyword_rankings.findMany({
        orderBy: { position: 'asc' },
        take: 20,
      });

      for (const kw of topKeywords) {
        const competitorPosition = (kw.position || 50) + Math.floor(Math.random() * 20 - 10); // Competitor position variation

        await prisma.competitor_tracking.create({
          data: {
            id: generateId(),
            competitorDomain: domain,
            keyword: kw.keyword,
            position: Math.max(1, Math.min(100, competitorPosition)),
            isActive: true,
          },
        });

        competitorsCreated++;
      }
    }

    console.log(`✅ Created ${competitorsCreated} competitor tracking records\n`);

    console.log('═══════════════════════════════════════');
    console.log('✨ Seeding Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Keywords Created: ${created}`);
    console.log(`   Keywords Skipped: ${skipped}`);
    console.log(`   Search Queries: ${queriesCreated}`);
    console.log(`   Competitors: ${competitorsCreated}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedKeywordRankings();
