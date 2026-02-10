'use client';

import { useState, useEffect } from 'react';
import WebVitalsWidget from '@/components/analytics/WebVitalsWidget';
import LiveVisitorsWidget from '@/components/analytics/LiveVisitorsWidget';
import EventStreamWidget from '@/components/analytics/EventStreamWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Eye, Zap } from 'lucide-react';

interface CurrentStats {
  pageViewsLast5Min: number;
  eventsLast5Min: number;
  timestamp: string;
}

export default function RealtimeAnalyticsPage() {
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchCurrentStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCurrentStats, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentStats = async () => {
    try {
      const response = await fetch('/api/analytics/realtime?type=current');
      if (response.ok) {
        const result = await response.json();
        setCurrentStats(result.data.current);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch current stats:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Real-Time Analytics
          </h1>
          <p className="text-gray-500 mt-2">
            Live performance metrics and visitor activity
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Updated: {formatTime(lastUpdate)}
          </p>
        </div>
      </div>

      {/* Current Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Page Views
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentStats?.pageViewsLast5Min || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentStats?.eventsLast5Min || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Engagement Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentStats && currentStats.pageViewsLast5Min > 0
                ? Math.round((currentStats.eventsLast5Min / currentStats.pageViewsLast5Min) * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Events per page view</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              All Systems Operational
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Real-time tracking active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <LiveVisitorsWidget />
          <WebVitalsWidget />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <EventStreamWidget />
        </div>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Real-Time Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>Live Visitors:</strong> Shows users active on your site in the last 30 minutes,
            including their location, device, and current page.
          </p>
          <p>
            <strong>Core Web Vitals:</strong> Performance metrics measured directly from user browsers.
            Includes LCP (loading), FID/INP (interactivity), and CLS (visual stability).
          </p>
          <p>
            <strong>Event Stream:</strong> Real-time feed of user actions including searches, bookings,
            CTA clicks, and conversions from the last hour.
          </p>
          <p className="text-xs text-gray-500">
            Data updates automatically every 10-30 seconds. No Google Analytics required -
            all metrics are collected directly from your application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
