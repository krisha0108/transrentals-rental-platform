/**
 * Seed Analytics Data
 * Populates analytics tables with realistic test data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const devices = ['desktop', 'mobile', 'tablet'];
const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'];
const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
const paths = [
  '/',
  '/bike-on-rent',
  '/car-rental',
  '/bus-rental',
  '/packers-and-movers',
  '/jcb-on-rent',
  '/tempo-traveller',
  '/luxury-car-rental',
  '/self-drive-car-rentals',
  '/about',
  '/contact',
  '/blog',
  '/services',
];
const referrers = [
  null, // Direct traffic
  'https://www.google.com',
  'https://www.facebook.com',
  'https://www.instagram.com',
  'https://www.linkedin.com',
  null,
  null,
];

const formTypes = ['BOOKING', 'CONTACT', 'CUSTOM_BOOKING', 'CALLBACK', 'OTHER'];
const formStatuses = ['SUBMITTED', 'SUBMITTED', 'SUBMITTED', 'PENDING', 'FAILED'];
const serviceTypes = ['bike-on-rent', 'car-rental', 'bus-rental', 'packers-and-movers'];

const chatTypes = ['MESSAGE_SENT', 'BOOKING_STARTED', 'BOOKING_COMPLETED', 'KB_QUERY'];
const chatOutcomes = ['IN_PROGRESS', 'BOOKING_SUBMITTED', 'CONTACT_INFO_SHARED', 'ABANDONED', 'RESOLVED'];

const clickTypes = ['CTA_CLICK', 'PHONE_CLICK', 'EMAIL_CLICK', 'SOCIAL_CLICK', 'LINK_CLICK', 'BUTTON_CLICK'];

async function seedPageViews(count: number) {
  console.log(`\n📊 Seeding ${count} page views...`);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  const pageViews = [];

  for (let i = 0; i < count; i++) {
    const sessionId = `session_${Math.random().toString(36).substring(7)}`;
    const ipAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    pageViews.push({
      path: randomItem(paths),
      referrer: randomItem(referrers),
      device: randomItem(devices),
      browser: randomItem(browsers),
      os: 'Windows',
      country: randomItem(countries),
      city: randomItem(cities),
      sessionId,
      ipAddress,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      duration: Math.floor(Math.random() * 300) + 10, // 10-310 seconds
      createdAt: randomDate(startDate, endDate),
    });
  }

  await prisma.page_views.createMany({ data: pageViews });
  console.log(`✅ Created ${count} page views`);
}

async function seedFormSubmissions(count: number) {
  console.log(`\n📝 Seeding ${count} form submissions...`);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const forms = [];

  for (let i = 0; i < count; i++) {
    const formType = randomItem(formTypes);
    const status = randomItem(formStatuses);

    forms.push({
      id: `form_${Math.random().toString(36).substring(7)}`,
      formType,
      formName: `${formType} Form`,
      pagePath: randomItem(paths),
      status,
      serviceType: randomItem(serviceTypes),
      timeToFill: Math.floor(Math.random() * 120) + 10, // 10-130 seconds
      device: randomItem(devices),
      browser: randomItem(browsers),
      sessionId: `session_${Math.random().toString(36).substring(7)}`,
      createdAt: randomDate(startDate, endDate),
    });
  }

  await prisma.form_submissions.createMany({ data: forms });
  console.log(`✅ Created ${count} form submissions`);
}

async function seedChatInteractions(count: number) {
  console.log(`\n💬 Seeding ${count} chat interactions...`);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const chats = [];

  for (let i = 0; i < count; i++) {
    const interactionType = randomItem(chatTypes);

    chats.push({
      id: `chat_${Math.random().toString(36).substring(7)}`,
      sessionId: `session_${Math.random().toString(36).substring(7)}`,
      interactionType,
      pagePath: randomItem(paths),
      serviceType: randomItem(serviceTypes),
      outcome: randomItem(chatOutcomes),
      device: randomItem(devices),
      browser: randomItem(browsers),
      responseTime: Math.floor(Math.random() * 3000) + 100, // 100-3100ms
      createdAt: randomDate(startDate, endDate),
    });
  }

  await prisma.chat_interactions.createMany({ data: chats });
  console.log(`✅ Created ${count} chat interactions`);
}

async function seedClickEvents(count: number) {
  console.log(`\n🖱️  Seeding ${count} click events...`);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const clicks = [];

  for (let i = 0; i < count; i++) {
    const eventType = randomItem(clickTypes);

    clicks.push({
      id: `click_${Math.random().toString(36).substring(7)}`,
      eventType,
      elementId: `btn_${Math.random().toString(36).substring(7)}`,
      elementText: 'Click Me',
      elementClass: 'btn btn-primary',
      pagePath: randomItem(paths),
      targetUrl: eventType === 'LINK_CLICK' ? 'https://example.com' : null,
      isExternal: eventType === 'LINK_CLICK',
      scrollDepth: Math.floor(Math.random() * 100),
      sessionId: `session_${Math.random().toString(36).substring(7)}`,
      device: randomItem(devices),
      browser: randomItem(browsers),
      createdAt: randomDate(startDate, endDate),
    });
  }

  await prisma.click_events.createMany({ data: clicks });
  console.log(`✅ Created ${count} click events`);
}

async function seedWebVitals(count: number) {
  console.log(`\n⚡ Seeding ${count} web vitals...`);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const vitals = [];

  for (let i = 0; i < count; i++) {
    const lcp = Math.random() * 5000; // 0-5000ms
    const fid = Math.random() * 500; // 0-500ms
    const cls = Math.random() * 0.5; // 0-0.5

    const getLcpRating = (val: number) => val <= 2500 ? 'GOOD' : val <= 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    const getFidRating = (val: number) => val <= 100 ? 'GOOD' : val <= 300 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    const getClsRating = (val: number) => val <= 0.1 ? 'GOOD' : val <= 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR';

    vitals.push({
      id: `vital_${Math.random().toString(36).substring(7)}`,
      pagePath: randomItem(paths),
      lcp,
      fid,
      cls,
      fcp: Math.random() * 3000,
      ttfb: Math.random() * 2000,
      inp: Math.random() * 500,
      lcpRating: getLcpRating(lcp),
      fidRating: getFidRating(fid),
      clsRating: getClsRating(cls),
      connectionType: randomItem(['4g', '3g', 'wifi', '5g']),
      device: randomItem(devices),
      browser: randomItem(browsers),
      sessionId: `session_${Math.random().toString(36).substring(7)}`,
      createdAt: randomDate(startDate, endDate),
    });
  }

  await prisma.web_vitals.createMany({ data: vitals });
  console.log(`✅ Created ${count} web vitals`);
}

async function seedActiveSessions(count: number) {
  console.log(`\n👥 Seeding ${count} active sessions...`);

  const now = new Date();
  const sessions = [];

  for (let i = 0; i < count; i++) {
    const startTime = new Date(now.getTime() - Math.random() * 10 * 60 * 1000); // Last 10 minutes
    const lastActivity = new Date(startTime.getTime() + Math.random() * 5 * 60 * 1000); // Within 5 mins

    sessions.push({
      id: `active_${Math.random().toString(36).substring(7)}`,
      sessionId: `session_${Math.random().toString(36).substring(7)}`,
      currentPage: randomItem(paths),
      device: randomItem(devices),
      browser: randomItem(browsers),
      country: randomItem(countries),
      city: randomItem(cities),
      pageCount: Math.floor(Math.random() * 10) + 1,
      hasInteracted: Math.random() > 0.3,
      hasChatted: Math.random() > 0.7,
      hasSubmittedForm: Math.random() > 0.8,
      startTime,
      lastActivity,
    });
  }

  await prisma.active_sessions.createMany({ data: sessions });
  console.log(`✅ Created ${count} active sessions`);
}

async function updatePagePerformance() {
  console.log(`\n📈 Updating page performance aggregates...`);

  // Get all page paths
  const pages = await prisma.page_views.groupBy({
    by: ['path'],
    _count: { id: true },
  });

  for (const page of pages) {
    const vitals = await prisma.web_vitals.findMany({
      where: { pagePath: page.path },
    });

    if (vitals.length === 0) continue;

    const avgLcp = vitals.reduce((sum, v) => sum + (v.lcp || 0), 0) / vitals.length;
    const avgFid = vitals.reduce((sum, v) => sum + (v.fid || 0), 0) / vitals.length;
    const avgCls = vitals.reduce((sum, v) => sum + (v.cls || 0), 0) / vitals.length;

    const lcpGood = vitals.filter(v => v.lcpRating === 'GOOD').length;
    const fidGood = vitals.filter(v => v.fidRating === 'GOOD').length;
    const clsGood = vitals.filter(v => v.clsRating === 'GOOD').length;

    const totalRatings = vitals.length * 3;
    const goodPercentage = (lcpGood + fidGood + clsGood) / totalRatings;

    let overallStatus = 'NEEDS_IMPROVEMENT';
    if (goodPercentage > 0.75) overallStatus = 'HEALTHY';
    else if (goodPercentage < 0.25) overallStatus = 'POOR';

    const issuesArray = [];
    if (avgLcp > 2500) issuesArray.push('High LCP');
    if (avgFid > 100) issuesArray.push('High FID');
    if (avgCls > 0.1) issuesArray.push('High CLS');

    const issues = issuesArray.length > 0 ? issuesArray.join(', ') : null;

    const lcpPoor = vitals.filter(v => v.lcpRating === 'POOR').length;
    const fidPoor = vitals.filter(v => v.fidRating === 'POOR').length;
    const clsPoor = vitals.filter(v => v.clsRating === 'POOR').length;
    const lcpNeedsWork = vitals.filter(v => v.lcpRating === 'NEEDS_IMPROVEMENT').length;
    const fidNeedsWork = vitals.filter(v => v.fidRating === 'NEEDS_IMPROVEMENT').length;
    const clsNeedsWork = vitals.filter(v => v.clsRating === 'NEEDS_IMPROVEMENT').length;

    await prisma.page_performance.upsert({
      where: { pagePath: page.path },
      create: {
        id: `perf_${Math.random().toString(36).substring(7)}`,
        pagePath: page.path,
        totalViews: page._count.id,
        avgLcp,
        avgFid,
        avgCls,
        lcpGood,
        lcpNeedsWork,
        lcpPoor,
        fidGood,
        fidNeedsWork,
        fidPoor,
        clsGood,
        clsNeedsWork,
        clsPoor,
        overallStatus,
        issues,
      },
      update: {
        totalViews: page._count.id,
        avgLcp,
        avgFid,
        avgCls,
        lcpGood,
        lcpNeedsWork,
        lcpPoor,
        fidGood,
        fidNeedsWork,
        fidPoor,
        clsGood,
        clsNeedsWork,
        clsPoor,
        overallStatus,
        issues,
      },
    });
  }

  console.log(`✅ Updated performance data for ${pages.length} pages`);
}

async function main() {
  console.log('🚀 Starting analytics data seeding...\n');
  console.log('This will populate your analytics tables with test data for the last 30 days.\n');

  try {
    // Seed all tables
    await seedPageViews(500); // 500 page views
    await seedFormSubmissions(75); // 75 form submissions
    await seedChatInteractions(50); // 50 chat interactions
    await seedClickEvents(200); // 200 click events
    await seedWebVitals(300); // 300 web vitals measurements
    await seedActiveSessions(8); // 8 active sessions (real-time)
    await updatePagePerformance();

    console.log('\n✅ Analytics data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 500 page views (last 30 days)');
    console.log('   - 75 form submissions');
    console.log('   - 50 chat interactions');
    console.log('   - 200 click events');
    console.log('   - 300 web vitals measurements');
    console.log('   - 8 active sessions');
    console.log('\n🔗 View your dashboard at: http://localhost:3000/admin/dashboard');
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
