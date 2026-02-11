# Google Search Console Integration Setup Guide

## Overview

This guide will help you set up Google Search Console (GSC) integration to automatically sync search queries, keyword rankings, impressions, clicks, and performance data.

## Prerequisites

- Google Search Console account with verified website
- Google Cloud Project with Search Console API enabled
- Admin access to your application

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Note down your Project ID

## Step 2: Enable Search Console API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Search Console API"
3. Click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Add scope: `https://www.googleapis.com/auth/webmasters.readonly`
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "GSC Integration"
   - Authorized redirect URIs:
     - Production: `https://yourdomain.com/api/integrations/gsc/callback`
     - Development: `http://localhost:3000/api/integrations/gsc/callback`
5. Click **CREATE**
6. Copy your **Client ID** and **Client Secret**

## Step 4: Add Environment Variables

Add these to your `.env` file:

```bash
# Google Search Console Integration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/gsc/callback

# For production, update GOOGLE_REDIRECT_URI to:
# GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integrations/gsc/callback
```

## Step 5: Run Database Migration

```bash
# Generate Prisma client with new integration_settings table
npx prisma generate

# Run migration to create integration_settings table
npx prisma migrate dev --name add_integration_settings
```

## Step 6: Connect Google Search Console

1. Start your application:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/admin/analytics/integrations`

3. Click **"Connect Google Search Console"**

4. You'll be redirected to Google's authorization page

5. Select your Google account

6. Grant the requested permissions:
   - View Search Console data for your verified sites

7. After authorization, you'll be redirected back to the integrations page

8. You should see a success message and connection details

## Step 7: Sync Data

### Manual Sync via UI

1. On the integrations page, you'll see your available sites
2. Select a site URL (or enter manually)
3. Set the number of days to sync (default: 90)
4. Click **"Sync Data"**
5. Wait for the sync to complete (may take a few minutes for large datasets)

### Manual Sync via Script

```bash
# Sync last 90 days for your site
npx tsx scripts/sync-gsc-data.ts https://yourdomain.com 90

# For domain property
npx tsx scripts/sync-gsc-data.ts sc-domain:yourdomain.com 90
```

## Step 8: Set Up Automated Sync (Optional)

### Using Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add daily sync at 2 AM
0 2 * * * cd /path/to/your/app && npx tsx scripts/sync-gsc-data.ts https://yourdomain.com 7
```

### Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "GSC Daily Sync"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
   - Program: `node`
   - Arguments: `node_modules/.bin/tsx scripts/sync-gsc-data.ts https://yourdomain.com 7`
   - Start in: Your project directory

### Using Vercel Cron Jobs

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/integrations/gsc/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## API Endpoints

### 1. Start Authorization
```
GET /api/integrations/gsc/auth
Returns: { authUrl: string }
```

### 2. OAuth Callback (automatic)
```
GET /api/integrations/gsc/callback?code=xxx
Redirects to: /admin/analytics/integrations?success=gsc_connected
```

### 3. Get Connection Status
```
GET /api/integrations/gsc/status
Returns: {
  isConnected: boolean,
  connectedAt: string,
  lastSync: string,
  tokenExpiresAt: string,
  availableSites: Array<{ siteUrl: string, permissionLevel: string }>
}
```

### 4. Sync Data
```
POST /api/integrations/gsc/sync
Body: { siteUrl: string, days?: number }
Returns: {
  success: boolean,
  stats: { total: number, created: number, updated: number }
}
```

### 5. Disconnect
```
POST /api/integrations/gsc/disconnect
Returns: { success: boolean, message: string }
```

## Troubleshooting

### "Credentials not configured" error

**Problem:** Environment variables not loaded

**Solution:**
- Make sure `.env` file exists
- Restart your development server
- Verify variables are set: `echo $GOOGLE_CLIENT_ID`

### "Access denied" during authorization

**Problem:** OAuth consent screen not configured or user denied access

**Solution:**
- Configure OAuth consent screen in Google Cloud Console
- Add test users if using "External" user type
- Make sure user has Search Console access

### "Not authenticated" error during sync

**Problem:** OAuth tokens expired or invalid

**Solution:**
- Disconnect and reconnect GSC integration
- Check token expiry date on integrations page
- Verify refresh token is saved in database

### Sync returns 0 rows

**Problem:** No data in Search Console or wrong site URL

**Solution:**
- Verify site URL format (must start with https://, http://, or sc-domain:)
- Check if site has data in Google Search Console
- Try reducing the number of days (e.g., 7 days instead of 90)

### "Token has been expired or revoked"

**Problem:** OAuth token was manually revoked in Google account

**Solution:**
- Go to https://myaccount.google.com/permissions
- Remove old authorization
- Reconnect via integrations page

## Data Tables

### integration_settings
Stores OAuth tokens and connection status:
- `service`: 'google_search_console'
- `accessToken`: OAuth access token (encrypted)
- `refreshToken`: OAuth refresh token (encrypted)
- `expiresAt`: Token expiration date
- `isActive`: Connection status

### search_queries
Stores daily search performance data:
- `query`: Search keyword
- `pagePath`: Landing page URL
- `impressions`: Number of times appeared in search
- `clicks`: Number of clicks
- `avgPosition`: Average ranking position
- `date`: Date of data

### keyword_rankings
Stores tracked keyword rankings:
- `keyword`: Tracked keyword
- `position`: Current ranking position
- `previousPosition`: Previous ranking
- `searchVolume`: Estimated search volume
- `pagePath`: Ranking page URL
- `lastChecked`: Last update time

## Security Notes

1. **Never commit credentials** - Add `.env` to `.gitignore`
2. **Use environment variables** - Never hardcode credentials
3. **Rotate tokens regularly** - Disconnect and reconnect periodically
4. **Limit API scope** - Only request `webmasters.readonly` scope
5. **Monitor usage** - Check Google Cloud Console for API usage

## Next Steps

After successful integration:

1. ✅ View rankings at `/admin/analytics/rankings`
2. ✅ Monitor search queries performance
3. ✅ Track keyword position changes
4. ✅ Analyze click-through rates
5. ✅ Set up automated daily syncs
6. ✅ Configure alerts for ranking drops

## Support

For issues or questions:
- Check application logs: `tail -f logs/app.log`
- Check Google Cloud Console logs
- Review Search Console API quotas
- Verify site ownership in Search Console
