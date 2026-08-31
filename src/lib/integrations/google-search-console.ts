import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

type StoredOAuthConfig = { clientId?: string; clientSecret?: string };

// Client ID/secret can be configured from the admin UI (stored in
// integration_settings.config as JSON) instead of the .env file — lets an
// admin without server/deploy access set these up directly. Falls back to
// GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET env vars when nothing's stored.
async function getStoredOAuthConfig(): Promise<StoredOAuthConfig> {
  const integration = await prisma.integration_settings.findUnique({
    where: { service: 'google_search_console' },
    select: { config: true },
  });
  if (!integration?.config) return {};
  try {
    return JSON.parse(integration.config) as StoredOAuthConfig;
  } catch {
    return {};
  }
}

// Save admin-entered OAuth credentials, without disturbing any tokens
// already stored on the same integration_settings row.
export const saveOAuthCredentials = async (clientId: string, clientSecret: string) => {
  await prisma.integration_settings.upsert({
    where: { service: 'google_search_console' },
    create: {
      id: generateId(),
      service: 'google_search_console',
      isActive: false,
      config: JSON.stringify({ clientId, clientSecret }),
    },
    update: {
      config: JSON.stringify({ clientId, clientSecret }),
      updatedAt: new Date(),
    },
  });
};

// Whether credentials are available at all, and whether they came from the
// DB (admin-entered) vs. the .env file — never returns the secret itself.
export const getOAuthCredentialsStatus = async () => {
  const stored = await getStoredOAuthConfig();
  const hasStoredCredentials = !!(stored.clientId && stored.clientSecret);
  const hasEnvCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return {
    isConfigured: hasStoredCredentials || hasEnvCredentials,
    source: hasStoredCredentials ? 'database' : hasEnvCredentials ? 'env' : null,
    clientId: stored.clientId || process.env.GOOGLE_CLIENT_ID || null,
  };
};

// OAuth2 Configuration
export const getOAuth2Client = async () => {
  const stored = await getStoredOAuthConfig();

  const oauth2Client = new google.auth.OAuth2(
    stored.clientId || process.env.GOOGLE_CLIENT_ID,
    stored.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/gsc/callback'
  );

  return oauth2Client;
};

// Generate authorization URL
export const getAuthorizationUrl = async () => {
  const oauth2Client = await getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return authorizationUrl;
};

// Exchange authorization code for tokens
export const getTokensFromCode = async (code: string) => {
  const oauth2Client = await getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

// Load tokens from database
export const loadStoredTokens = async () => {
  const integration = await prisma.integration_settings.findUnique({
    where: { service: 'google_search_console' },
  });

  if (!integration || !integration.accessToken) {
    return null;
  }

  const oauth2Client = await getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiresAt?.getTime(),
  });

  // The access token is short-lived (~1hr); the client auto-refreshes it
  // on demand using the refresh token, but without this listener the
  // refreshed token was never written back to the DB — every subsequent
  // request loaded the same stale (already-expired) access token from
  // storage and had to refresh again from scratch.
  oauth2Client.on('tokens', (tokens) => {
    saveTokens({
      access_token: tokens.access_token ?? integration.accessToken,
      refresh_token: tokens.refresh_token ?? integration.refreshToken,
      expiry_date: tokens.expiry_date ?? integration.expiresAt?.getTime(),
    }).catch((err) => console.error('Failed to persist refreshed GSC tokens', err));
  });

  return oauth2Client;
};

// Save tokens to database
export const saveTokens = async (tokens: any) => {
  await prisma.integration_settings.upsert({
    where: { service: 'google_search_console' },
    create: {
      id: generateId(),
      service: 'google_search_console',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive: true,
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive: true,
      updatedAt: new Date(),
    },
  });
};

// Get Search Console service
export const getSearchConsoleService = async () => {
  const oauth2Client = await loadStoredTokens();

  if (!oauth2Client) {
    throw new Error('Not authenticated with Google Search Console');
  }

  return google.searchconsole({ version: 'v1', auth: oauth2Client });
};

// Fetch search analytics data
export const fetchSearchAnalytics = async (
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[] = ['query', 'page']
) => {
  const searchConsole = await getSearchConsoleService();

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit: 25000,
      dataState: 'final',
    },
  });

  return response.data.rows || [];
};

// Rows are upserted in batches via a single multi-row `INSERT ... ON DUPLICATE
// KEY UPDATE` per batch, instead of a findFirst+create/update pair per row —
// a sync with GSC's full 25,000-row limit was previously issuing 50,000+
// sequential DB round-trips and taking long enough to time out the route's
// 5-minute maxDuration.
const SYNC_BATCH_SIZE = 500;

// Sync search queries to database
export const syncSearchQueries = async (siteUrl: string, days: number = 90) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log(`🔄 Syncing GSC data from ${startDateStr} to ${endDateStr}...`);

    const rows = await fetchSearchAnalytics(siteUrl, startDateStr, endDateStr, ['query', 'page', 'date']);

    type ParsedRow = { query: string; page: string; date: Date; impressions: number; clicks: number; ctr: number; position: number };
    const parsedRows: ParsedRow[] = [];
    for (const row of rows) {
      const query = row.keys?.[0];
      const page = row.keys?.[1];
      const rawDate = row.keys?.[2];
      if (!query || !page || !rawDate) continue;
      parsedRows.push({
        query,
        page,
        date: new Date(rawDate),
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      });
    }

    let upserted = 0;
    for (let i = 0; i < parsedRows.length; i += SYNC_BATCH_SIZE) {
      const batch = parsedRows.slice(i, i + SYNC_BATCH_SIZE);
      const valuesSql = Prisma.join(
        batch.map((r) => Prisma.sql`(${generateId()}, ${r.query}, ${r.page}, ${r.date}, ${r.impressions}, ${r.clicks}, ${r.ctr}, ${r.position}, NOW())`),
        ', ',
      );
      await prisma.$executeRaw`
        INSERT INTO search_queries (id, query, pagePath, date, impressions, clicks, ctr, avgPosition, createdAt)
        VALUES ${valuesSql}
        ON DUPLICATE KEY UPDATE
          impressions = VALUES(impressions),
          clicks = VALUES(clicks),
          ctr = VALUES(ctr),
          avgPosition = VALUES(avgPosition)
      `;
      upserted += batch.length;
    }

    // Only keywords already being tracked in keyword_rankings get updated —
    // fetch that (much smaller) set once instead of a findFirst per GSC row.
    const uniqueQueries = [...new Set(parsedRows.map((r) => r.query))];
    const trackedKeywords = uniqueQueries.length
      ? await prisma.keyword_rankings.findMany({ where: { keyword: { in: uniqueQueries } } })
      : [];

    if (trackedKeywords.length) {
      // For a query with rows across multiple dates in this sync window,
      // use the most recent date's position as the current one.
      const latestByQuery = new Map<string, ParsedRow>();
      for (const r of parsedRows) {
        const existing = latestByQuery.get(r.query);
        if (!existing || r.date > existing.date) latestByQuery.set(r.query, r);
      }

      await prisma.$transaction(
        trackedKeywords.map((kw) => {
          const latest = latestByQuery.get(kw.keyword)!;
          return prisma.keyword_rankings.update({
            where: { id: kw.id },
            data: {
              position: Math.round(latest.position),
              previousPosition: kw.position,
              searchVolume: latest.impressions,
              lastChecked: new Date(),
            },
          });
        }),
      );
    }

    console.log(`✅ GSC Sync Complete: ${upserted} rows upserted, ${trackedKeywords.length} tracked keywords updated`);

    return { upserted, trackedKeywordsUpdated: trackedKeywords.length, total: rows.length };
  } catch (error) {
    console.error('❌ GSC Sync Error:', error);
    throw error;
  }
};

// Get site info and index coverage
export const getSiteInfo = async (siteUrl: string) => {
  const searchConsole = await getSearchConsoleService();

  const sites = await searchConsole.sites.list();
  const siteInfo = sites.data.siteEntry?.find(s => s.siteUrl === siteUrl);

  return siteInfo;
};

// Check if GSC is connected
export const isGSCConnected = async (): Promise<boolean> => {
  try {
    const integration = await prisma.integration_settings.findUnique({
      where: { service: 'google_search_console' },
    });

    return integration?.isActive === true;
  } catch {
    return false;
  }
};

// Disconnect GSC
export const disconnectGSC = async () => {
  await prisma.integration_settings.updateMany({
    where: { service: 'google_search_console' },
    data: {
      isActive: false,
      accessToken: null,
      refreshToken: null,
    },
  });
};
