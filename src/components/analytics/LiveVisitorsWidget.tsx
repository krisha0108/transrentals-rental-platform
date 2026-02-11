'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Smartphone, Clock } from 'lucide-react';

interface Visitor {
  sessionId: string;
  currentPage: string;
  pageTitle: string;
  device: string;
  location: string;
  lastActive: string;
}

interface LocationGroup {
  location: string;
  count: number;
  country: string | null;
  city: string | null;
}

interface LiveVisitorsData {
  total: number;
  byLocation: LocationGroup[];
  recentVisitors: Visitor[];
}

export default function LiveVisitorsWidget() {
  const [data, setData] = useState<LiveVisitorsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveVisitors();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveVisitors, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveVisitors = async () => {
    try {
      const response = await fetch('/api/analytics/realtime?type=visitors');
      if (response.ok) {
        const result = await response.json();
        setData(result.data.activeVisitors);
      }
    } catch (error) {
      console.error('Failed to fetch live visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Visitors
          </CardTitle>
          <CardDescription>Loading active visitors...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const visitorCount = data?.total || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Live Visitors
            </CardTitle>
            <CardDescription>Active in the last 30 minutes</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-3xl font-bold">{visitorCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Distribution */}
        {data && data.byLocation && data.byLocation.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Visitors by Location
            </h4>
            <div className="space-y-2">
              {data.byLocation.slice(0, 5).map((loc, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{loc.location}</span>
                  <Badge variant="secondary">{loc.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Visitors */}
        {data && data.recentVisitors && data.recentVisitors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </h4>
            <div className="space-y-3">
              {data.recentVisitors.slice(0, 5).map((visitor, index) => (
                <div
                  key={visitor.sessionId || index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Smartphone className="h-4 w-4 text-gray-400 mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {visitor.pageTitle || visitor.currentPage}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {visitor.currentPage}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {visitor.location}
                      </span>
                      <span className="text-xs text-gray-400">
                        {visitor.device}
                      </span>
                      <span className="text-xs text-gray-400">
                        {getTimeAgo(visitor.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visitorCount === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No active visitors right now</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
