import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// OAuth2 Configuration for GA4
export const getGA4OAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/ga4/callback'
  );

  return oauth2Client;
};

// Generate authorization URL for GA4
export const getGA4AuthorizationUrl = () => {
  const oauth2Client = getGA4OAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return authorizationUrl;
};

// Exchange authorization code for tokens
export const getGA4TokensFromCode = async (code: string) => {
  const oauth2Client = getGA4OAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

// Load tokens from database
export const loadGA4StoredTokens = async () => {
  const integration = await prisma.integration_settings.findUnique({
    where: { service: 'google_analytics_4' },
  });

  if (!integration || !integration.accessToken) {
    return null;
  }

  const oauth2Client = getGA4OAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiresAt?.getTime(),
  });

  return oauth2Client;
};

// Save tokens to database
export const saveGA4Tokens = async (tokens: any) => {
  await prisma.integration_settings.upsert({
    where: { service: 'google_analytics_4' },
    create: {
      id: generateId(),
      service: 'google_analytics_4',
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

// Get GA4 Data API service
export const getGA4DataAPI = async () => {
  const oauth2Client = await loadGA4StoredTokens();

  if (!oauth2Client) {
    throw new Error('Not authenticated with Google Analytics 4');
  }

  return google.analyticsdata({ version: 'v1beta', auth: oauth2Client });
};

// Get GA4 Admin API service
export const getGA4AdminAPI = async () => {
  const oauth2Client = await loadGA4StoredTokens();

  if (!oauth2Client) {
    throw new Error('Not authenticated with Google Analytics 4');
  }

  return google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });
};

// List GA4 properties
export const listGA4Properties = async () => {
  const adminAPI = await getGA4AdminAPI();

  try {
    const response = await adminAPI.properties.list();
    return response.data.properties || [];
  } catch (error) {
    console.error('Failed to list GA4 properties:', error);
    throw error;
  }
};

// Fetch GA4 metrics
export interface GA4MetricsParams {
  propertyId: string;
  startDate: string;
  endDate: string;
  metrics: string[];
  dimensions?: string[];
}

export const fetchGA4Metrics = async (params: GA4MetricsParams) => {
  const dataAPI = await getGA4DataAPI();

  try {
    const response = await dataAPI.properties.runReport({
      property: `properties/${params.propertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate: params.startDate,
            endDate: params.endDate,
          },
        ],
        metrics: params.metrics.map(name => ({ name })),
        dimensions: params.dimensions?.map(name => ({ name })) || [],
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch GA4 metrics:', error);
    throw error;
  }
};

// Fetch real-time data
export const fetchGA4RealtimeData = async (propertyId: string) => {
  const dataAPI = await getGA4DataAPI();

  try {
    const response = await dataAPI.properties.runRealtimeReport({
      property: `properties/${propertyId}`,
      requestBody: {
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'eventCount' },
        ],
        dimensions: [
          { name: 'country' },
          { name: 'deviceCategory' },
        ],
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch GA4 realtime data:', error);
    throw error;
  }
};

// Fetch traffic sources
export const fetchGA4TrafficSources = async (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  return fetchGA4Metrics({
    propertyId,
    startDate,
    endDate,
    metrics: ['sessions', 'totalUsers', 'newUsers', 'screenPageViews'],
    dimensions: ['sessionSource', 'sessionMedium', 'sessionCampaignName'],
  });
};

// Fetch page performance
export const fetchGA4PagePerformance = async (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  return fetchGA4Metrics({
    propertyId,
    startDate,
    endDate,
    metrics: ['screenPageViews', 'averageSessionDuration', 'bounceRate'],
    dimensions: ['pagePath', 'pageTitle'],
  });
};

// Fetch user demographics
export const fetchGA4Demographics = async (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  return fetchGA4Metrics({
    propertyId,
    startDate,
    endDate,
    metrics: ['activeUsers', 'sessions'],
    dimensions: ['country', 'city', 'deviceCategory', 'browser'],
  });
};

// Fetch events
export const fetchGA4Events = async (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  return fetchGA4Metrics({
    propertyId,
    startDate,
    endDate,
    metrics: ['eventCount'],
    dimensions: ['eventName'],
  });
};

// Fetch conversions
export const fetchGA4Conversions = async (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  return fetchGA4Metrics({
    propertyId,
    startDate,
    endDate,
    metrics: ['conversions', 'totalRevenue'],
    dimensions: ['eventName', 'sessionSource'],
  });
};

// Check if GA4 is connected
export const isGA4Connected = async (): Promise<boolean> => {
  try {
    const integration = await prisma.integration_settings.findUnique({
      where: { service: 'google_analytics_4' },
    });

    return integration?.isActive === true;
  } catch {
    return false;
  }
};

// Disconnect GA4
export const disconnectGA4 = async () => {
  await prisma.integration_settings.updateMany({
    where: { service: 'google_analytics_4' },
    data: {
      isActive: false,
      accessToken: null,
      refreshToken: null,
    },
  });
};

// Sync GA4 data to database (simplified version)
export const syncGA4Data = async (propertyId: string, days: number = 7) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log(`🔄 Syncing GA4 data from ${startDateStr} to ${endDateStr}...`);

    // Fetch various metrics
    const [trafficSources, pagePerformance, demographics, events] = await Promise.all([
      fetchGA4TrafficSources(propertyId, startDateStr, endDateStr),
      fetchGA4PagePerformance(propertyId, startDateStr, endDateStr),
      fetchGA4Demographics(propertyId, startDateStr, endDateStr),
      fetchGA4Events(propertyId, startDateStr, endDateStr),
    ]);

    console.log(`✅ GA4 Sync Complete`);

    return {
      trafficSources,
      pagePerformance,
      demographics,
      events,
    };
  } catch (error) {
    console.error('❌ GA4 Sync Error:', error);
    throw error;
  }
};
