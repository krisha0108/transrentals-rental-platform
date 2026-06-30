import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function fetchQuoteData() {
  const tables = [
    { key: 'bike', table: 'bike_quote_requests' },
    { key: 'self_drive', table: 'self_drive_quote_requests' },
    { key: 'bus', table: 'bus_quote_requests' },
    { key: 'luxury', table: 'luxury_quote_requests' },
    { key: 'truck', table: 'truck_quote_requests' },
  ];

  const results: Record<string, { total: number; last7d: number; last30d: number; byMonth: { month: string; count: number }[] }> = {};

  for (const { key, table } of tables) {
    try {
      const [total, last7d, last30d, byMonth] = await Promise.all([
        prisma.$queryRawUnsafe<[{ cnt: bigint }]>(`SELECT COUNT(*) as cnt FROM ${table}`),
        prisma.$queryRawUnsafe<[{ cnt: bigint }]>(`SELECT COUNT(*) as cnt FROM ${table} WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
        prisma.$queryRawUnsafe<[{ cnt: bigint }]>(`SELECT COUNT(*) as cnt FROM ${table} WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`),
        prisma.$queryRawUnsafe<{ month: string; cnt: bigint }[]>(
          `SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as cnt FROM ${table} GROUP BY month ORDER BY month DESC LIMIT 6`
        ),
      ]);
      results[key] = {
        total: Number(total[0].cnt),
        last7d: Number(last7d[0].cnt),
        last30d: Number(last30d[0].cnt),
        byMonth: byMonth.map((r) => ({ month: r.month, count: Number(r.cnt) })),
      };
    } catch {
      results[key] = { total: 0, last7d: 0, last30d: 0, byMonth: [] };
    }
  }
  return results;
}

async function fetchPageViews() {
  const rows = await prisma.$queryRaw<{ service: string; visits: bigint; sessions: bigint }[]>`
    SELECT
      CASE
        WHEN path LIKE '/bike%' THEN 'Bike Rental'
        WHEN path LIKE '/self-drive%' THEN 'Self Drive'
        WHEN path LIKE '/car-rental%' THEN 'Car Rental'
        WHEN path LIKE '/bus-rental%' THEN 'Bus Rental'
        WHEN path LIKE '/mini-truck%' THEN 'Mini Truck'
        WHEN path LIKE '/luxury%' THEN 'Luxury Car'
        ELSE 'Other'
      END as service,
      COUNT(*) as visits,
      COUNT(DISTINCT sessionId) as sessions
    FROM page_views
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY service
    ORDER BY visits DESC
  `;
  return rows.map((r) => ({ service: r.service, visits: Number(r.visits), sessions: Number(r.sessions) }));
}

async function fetchContactInquiries() {
  const rows = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*) as cnt FROM contact_inquiries
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `;
  return [{ service: 'General', count: Number(rows[0]?.cnt ?? 0) }];
}

function buildDeepSeekPrompt(data: {
  quotes: Record<string, { total: number; last7d: number; last30d: number; byMonth: { month: string; count: number }[] }>;
  pageViews: { service: string; visits: number; sessions: number }[];
  inquiries: { service: string; count: number }[];
  googleMetrics: { impressions: number; clicks: number; ctr: number };
}) {
  const { quotes, pageViews, googleMetrics } = data;

  const quoteLines = Object.entries(quotes)
    .map(([svc, d]) => `  - ${svc}: total=${d.total}, last7d=${d.last7d}, last30d=${d.last30d}`)
    .join('\n');

  const pvLines = pageViews
    .map((r) => `  - ${r.service}: ${r.visits} visits, ${r.sessions} sessions (30d)`)
    .join('\n');

  return `You are a senior growth analyst for TransRentals, an Indian vehicle rental marketplace.

BUSINESS CONTEXT:
- Services offered: Bike Rental, Self-Drive Car, Car Rental (with driver), Bus Rental, Luxury Car, Mini Truck
- Google Search Console (last 28 days): ${googleMetrics.impressions.toLocaleString()} impressions, ${googleMetrics.clicks.toLocaleString()} clicks, ${googleMetrics.ctr}% CTR
- Problem: High impressions/clicks but very few inquiries on Car Rental, Bus, Luxury, Truck

QUOTE REQUEST DATA (all time totals vs recent):
${quoteLines}

PAGE VIEWS BY SERVICE (last 30 days):
${pvLines}

UX FACT:
- Bike & Self-Drive show real inventory with prices → users can book directly
- Car Rental, Bus, Luxury, Truck use quote request forms / chatbot → users must wait for callback
- Bus & Truck use a chatbot (DynamicChatBookingHero) instead of a simple form
- Luxury & Car Rental have quote forms but NO price anchors shown upfront

TASK:
1. Identify the top 3 conversion drop-off reasons with supporting data
2. For each service (Car Rental, Bus, Luxury, Truck), give ONE specific fix that can be implemented in < 3 days
3. Estimate what % improvement each fix could yield in monthly inquiries
4. List 2 quick wins for the next 7 days

Be specific, data-driven, and concise. Format as JSON with this structure:
{
  "summary": "2-3 sentence executive summary",
  "topDropoffReasons": [
    { "rank": 1, "reason": "...", "evidence": "...", "impact": "high|medium|low" }
  ],
  "serviceRecommendations": [
    { "service": "...", "fix": "...", "effort": "X days", "expectedLift": "X%" }
  ],
  "quickWins": [
    { "action": "...", "owner": "dev|content|ops", "timeline": "..." }
  ],
  "priorityScore": { "carRental": 1-10, "bus": 1-10, "luxury": 1-10, "truck": 1-10 }
}`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const impressions = Number(url.searchParams.get('impressions') || 53000);
    const clicks = Number(url.searchParams.get('clicks') || 3000);
    const ctr = Number(((clicks / impressions) * 100).toFixed(1));

    const [quotes, pageViews, inquiries] = await Promise.all([
      fetchQuoteData(),
      fetchPageViews(),
      fetchContactInquiries(),
    ]);

    const prompt = buildDeepSeekPrompt({
      quotes,
      pageViews,
      inquiries,
      googleMetrics: { impressions, clicks, ctr },
    });

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
    }

    const deepseekRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!deepseekRes.ok) {
      const err = await deepseekRes.text();
      return NextResponse.json({ error: 'DeepSeek API error', details: err }, { status: 500 });
    }

    const aiData = await deepseekRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '{}';
    let analysis: Record<string, unknown> = {};
    try { analysis = JSON.parse(rawContent); } catch { analysis = { summary: rawContent }; }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      googleMetrics: { impressions, clicks, ctr },
      rawData: { quotes, pageViews, inquiries },
      analysis,
    });
  } catch (err) {
    console.error('[ai-analysis]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
