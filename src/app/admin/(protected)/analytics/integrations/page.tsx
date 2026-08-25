'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface GSCStatus {
  isConnected: boolean;
  connectedAt?: string;
  lastSync?: string;
  tokenExpiresAt?: string;
  availableSites?: Array<{
    siteUrl: string;
    permissionLevel: string;
  }>;
}

interface GA4Status {
  connected: boolean;
  properties?: Array<{
    name: string;
    displayName: string;
    propertyId: string;
    industryCategory?: string;
    timeZone?: string;
  }>;
}

interface SyncStats {
  total: number;
  upserted: number;
  trackedKeywordsUpdated: number;
}

export default function IntegrationsPage() {
  const [gscStatus, setGscStatus] = useState<GSCStatus | null>(null);
  const [ga4Status, setGa4Status] = useState<GA4Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [ga4Syncing, setGa4Syncing] = useState(false);
  const [ga4Disconnecting, setGa4Disconnecting] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [syncDays, setSyncDays] = useState('90');
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [ga4SyncDays, setGa4SyncDays] = useState('7');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);

  // Check URL parameters for success/error messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gscSuccess = params.get('success');
    const ga4Success = params.get('ga4_success');
    const gscError = params.get('error');
    const ga4Error = params.get('ga4_error');

    if (gscSuccess === 'gsc_connected') {
      setMessage({ type: 'success', text: 'Google Search Console connected successfully!' });
      window.history.replaceState({}, '', '/admin/analytics/integrations');
      fetchGSCStatus();
    } else if (ga4Success === 'true') {
      setMessage({ type: 'success', text: 'Google Analytics 4 connected successfully!' });
      window.history.replaceState({}, '', '/admin/analytics/integrations');
      fetchGA4Status();
    } else if (gscError) {
      const errorMessages: Record<string, string> = {
        unauthorized: 'You are not authorized to connect integrations',
        access_denied: 'Access was denied. Please try again.',
        missing_code: 'Authorization code was missing',
        callback_failed: 'Failed to complete authorization',
      };
      setMessage({ type: 'error', text: errorMessages[gscError] || 'An error occurred' });
    } else if (ga4Error) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Access was denied. Please try again.',
        no_code: 'Authorization code was missing',
        callback_failed: 'Failed to complete authorization',
      };
      setMessage({ type: 'error', text: 'GA4: ' + (errorMessages[ga4Error] || 'An error occurred') });
    }
  }, []);

  const fetchGSCStatus = async () => {
    try {
      const response = await fetch('/api/integrations/gsc/status');
      if (response.ok) {
        const data = await response.json();
        setGscStatus(data);

        // Set first available site as default
        if (data.availableSites?.length > 0) {
          setSiteUrl(data.availableSites[0].siteUrl);
        }
      }
    } catch (error) {
      console.error('Failed to fetch GSC status:', error);
    }
  };

  const fetchGA4Status = async () => {
    try {
      const response = await fetch('/api/integrations/ga4/status');
      if (response.ok) {
        const data = await response.json();
        setGa4Status(data);

        // Set first available property as default
        if (data.properties?.length > 0) {
          setGa4PropertyId(data.properties[0].propertyId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch GA4 status:', error);
    }
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      setLoading(true);
      await Promise.all([fetchGSCStatus(), fetchGA4Status()]);
      setLoading(false);
    };
    fetchStatuses();
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/gsc/auth');
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to start authorization' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to Google Search Console' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Search Console?')) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await fetch('/api/integrations/gsc/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Google Search Console disconnected successfully' });
        setGscStatus(null);
        setSyncStats(null);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to disconnect' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect Google Search Console' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    if (!siteUrl) {
      setMessage({ type: 'error', text: 'Please enter a site URL' });
      return;
    }

    try {
      setSyncing(true);
      setMessage(null);
      setSyncStats(null);

      const response = await fetch('/api/integrations/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          days: parseInt(syncDays) || 90,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setSyncStats(data.stats);
        fetchGSCStatus(); // Refresh status
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to sync data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync Google Search Console data' });
    } finally {
      setSyncing(false);
    }
  };

  const handleGA4Connect = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/ga4/auth');
      if (response.ok) {
        const { success, authorizationUrl } = await response.json();
        if (success && authorizationUrl) {
          window.location.href = authorizationUrl;
        }
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to start authorization' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to Google Analytics 4' });
    } finally {
      setLoading(false);
    }
  };

  const handleGA4Disconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Analytics 4?')) {
      return;
    }

    try {
      setGa4Disconnecting(true);
      const response = await fetch('/api/integrations/ga4/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Google Analytics 4 disconnected successfully' });
        setGa4Status(null);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to disconnect' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect Google Analytics 4' });
    } finally {
      setGa4Disconnecting(false);
    }
  };

  const handleGA4Sync = async () => {
    if (!ga4PropertyId) {
      setMessage({ type: 'error', text: 'Please enter a property ID' });
      return;
    }

    try {
      setGa4Syncing(true);
      setMessage(null);

      const response = await fetch('/api/integrations/ga4/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: ga4PropertyId,
          days: parseInt(ga4SyncDays) || 7,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'GA4 data synced successfully' });
        fetchGA4Status(); // Refresh status
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to sync GA4 data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync Google Analytics 4 data' });
    } finally {
      setGa4Syncing(false);
    }
  };

  if (loading && !gscStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-500 mt-2">
          Connect external services to enhance your analytics
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Google Search Console */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Google Search Console</CardTitle>
                <CardDescription>
                  Sync search queries, rankings, and performance data
                </CardDescription>
              </div>
            </div>
            {gscStatus?.isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {gscStatus?.isConnected ? (
            <>
              {/* Connection Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Connected</p>
                  <p className="font-medium">
                    {gscStatus.connectedAt
                      ? new Date(gscStatus.connectedAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Sync</p>
                  <p className="font-medium">
                    {gscStatus.lastSync
                      ? new Date(gscStatus.lastSync).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Token Expires</p>
                  <p className="font-medium">
                    {gscStatus.tokenExpiresAt
                      ? new Date(gscStatus.tokenExpiresAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Sites</p>
                  <p className="font-medium">
                    {gscStatus.availableSites?.length || 0} sites
                  </p>
                </div>
              </div>

              {/* Available Sites */}
              {gscStatus.availableSites && gscStatus.availableSites.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Sites</Label>
                  <div className="space-y-2">
                    {gscStatus.availableSites.map((site) => (
                      <div
                        key={site.siteUrl}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{site.siteUrl}</p>
                          <p className="text-sm text-gray-500">{site.permissionLevel}</p>
                        </div>
                        <a
                          href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(site.siteUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync Data */}
              <div className="space-y-3">
                <Label htmlFor="siteUrl">Site URL to Sync</Label>
                <Input
                  id="siteUrl"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://example.com or sc-domain:example.com"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="syncDays">Days to Sync</Label>
                    <Input
                      id="syncDays"
                      type="number"
                      value={syncDays}
                      onChange={(e) => setSyncDays(e.target.value)}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSync} disabled={syncing}>
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Data
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                </div>
              </div>

              {/* Sync Stats */}
              {syncStats && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Sync Complete!</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-green-600">Total Rows</p>
                      <p className="text-2xl font-bold text-green-900">{syncStats.total}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Rows Synced</p>
                      <p className="text-2xl font-bold text-green-900">{syncStats.upserted}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Tracked Keywords Updated</p>
                      <p className="text-2xl font-bold text-green-900">{syncStats.trackedKeywordsUpdated}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Connect your Google Search Console account to automatically sync:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Search queries and keywords</li>
                <li>Click-through rates and impressions</li>
                <li>Keyword rankings and positions</li>
                <li>Page performance data</li>
              </ul>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you have added GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file
                </AlertDescription>
              </Alert>

              <Button onClick={handleConnect} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Google Search Console
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Google Analytics 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Google Analytics 4</CardTitle>
                <CardDescription>
                  Sync user behavior, traffic sources, and conversion data
                </CardDescription>
              </div>
            </div>
            {ga4Status?.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ga4Status?.connected ? (
            <>
              {/* Available Properties */}
              {ga4Status.properties && ga4Status.properties.length > 0 && (
                <div className="space-y-2">
                  <Label>Your GA4 Properties</Label>
                  <div className="space-y-2">
                    {ga4Status.properties.map((property) => (
                      <div
                        key={property.propertyId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{property.displayName}</p>
                          <p className="text-sm text-gray-500">ID: {property.propertyId}</p>
                          {property.industryCategory && (
                            <p className="text-xs text-gray-400">{property.industryCategory}</p>
                          )}
                        </div>
                        <a
                          href={`https://analytics.google.com/analytics/web/#/p${property.propertyId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync Data */}
              <div className="space-y-3">
                <Label htmlFor="ga4PropertyId">Property ID to Sync</Label>
                <Input
                  id="ga4PropertyId"
                  value={ga4PropertyId}
                  onChange={(e) => setGa4PropertyId(e.target.value)}
                  placeholder="123456789"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ga4SyncDays">Days to Sync</Label>
                    <Input
                      id="ga4SyncDays"
                      type="number"
                      value={ga4SyncDays}
                      onChange={(e) => setGa4SyncDays(e.target.value)}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleGA4Sync} disabled={ga4Syncing}>
                    {ga4Syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Data
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleGA4Disconnect}
                    disabled={ga4Disconnecting}
                  >
                    {ga4Disconnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Connect your Google Analytics 4 account to automatically sync:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Real-time active users and page views</li>
                <li>Traffic sources and campaigns</li>
                <li>User demographics and behavior</li>
                <li>Page performance and engagement</li>
                <li>Events and conversions</li>
              </ul>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you have added GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file
                </AlertDescription>
              </Alert>

              <Button onClick={handleGA4Connect} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Google Analytics 4
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
