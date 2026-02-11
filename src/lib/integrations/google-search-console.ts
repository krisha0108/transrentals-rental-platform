import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// OAuth2 Configuration
export const getOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/gsc/callback'
  );

  return oauth2Client;
};

// Generate authorization URL
export const getAuthorizationUrl = () => {
  const oauth2Client = getOAuth2Client();

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
  const oauth2Client = getOAuth2Client();
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

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiresAt?.getTime(),
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

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const query = row.keys?.[0];
      const page = row.keys?.[1];
      const date = new Date(row.keys?.[2]);

      if (!query || !page) continue;

      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const ctr = row.ctr || 0;
      const position = row.position || 0;

      // Check if record exists
      const existing = await prisma.search_queries.findFirst({
        where: {
          query,
          pagePath: page,
          date,
        },
      });

      if (existing) {
        await prisma.search_queries.update({
          where: { id: existing.id },
          data: {
            impressions,
            clicks,
            avgPosition: position,
          },
        });
        updated++;
      } else {
        await prisma.search_queries.create({
          data: {
            id: generateId(),
            query,
            pagePath: page,
            date,
            impressions,
            clicks,
            avgPosition: position,
          },
        });
        created++;
      }

      // Update keyword rankings if exists
      const keyword = await prisma.keyword_rankings.findFirst({
        where: { keyword: query },
      });

      if (keyword) {
        await prisma.keyword_rankings.update({
          where: { id: keyword.id },
          data: {
            position: Math.round(position),
            previousPosition: keyword.position,
            searchVolume: impressions,
            lastChecked: new Date(),
          },
        });
      }
    }

    console.log(`✅ GSC Sync Complete: ${created} created, ${updated} updated`);

    return { created, updated, total: rows.length };
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
