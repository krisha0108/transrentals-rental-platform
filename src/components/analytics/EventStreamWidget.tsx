'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Search, MousePointer, ShoppingCart, DollarSign, Phone, Mail, MessageSquare } from 'lucide-react';

interface RecentEvent {
  id: string;
  type: string;
  page: string;
  title: string | null;
  location: string;
  device: string | null;
  source: string | null;
  bookingType: string | null;
  bookingValue: number | null;
  timestamp: string;
}

interface EventStreamData {
  total: number;
  events: RecentEvent[];
  breakdown: Record<string, number>;
}

const eventIcons: Record<string, any> = {
  SEARCH: Search,
  FILTER_APPLIED: Activity,
  QUOTE_REQUEST: MessageSquare,
  BOOKING_INITIATED: ShoppingCart,
  BOOKING_COMPLETED: ShoppingCart,
  PAYMENT_COMPLETED: DollarSign,
  CTA_CLICKED: MousePointer,
  PHONE_CLICKED: Phone,
  EMAIL_CLICKED: Mail,
};

const eventColors: Record<string, string> = {
  SEARCH: 'bg-blue-100 text-blue-800',
  FILTER_APPLIED: 'bg-purple-100 text-purple-800',
  QUOTE_REQUEST: 'bg-yellow-100 text-yellow-800',
  BOOKING_INITIATED: 'bg-orange-100 text-orange-800',
  BOOKING_COMPLETED: 'bg-green-100 text-green-800',
  PAYMENT_COMPLETED: 'bg-green-100 text-green-800',
  CTA_CLICKED: 'bg-indigo-100 text-indigo-800',
  PHONE_CLICKED: 'bg-pink-100 text-pink-800',
  EMAIL_CLICKED: 'bg-cyan-100 text-cyan-800',
};

export default function EventStreamWidget() {
  const [data, setData] = useState<EventStreamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventStream();
    // Refresh every 10 seconds
    const interval = setInterval(fetchEventStream, 10 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEventStream = async () => {
    try {
      const response = await fetch('/api/analytics/realtime?type=events');
      if (response.ok) {
        const result = await response.json();
        setData(result.data.recentEvents);
      }
    } catch (error) {
      console.error('Failed to fetch event stream:', error);
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
            <Activity className="h-5 w-5" />
            Live Event Stream
          </CardTitle>
          <CardDescription>Loading recent events...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Event Stream
            </CardTitle>
            <CardDescription>Real-time user activity (last hour)</CardDescription>
          </div>
          {data && (
            <Badge variant="secondary">{data.total} events</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Event Type Breakdown */}
        {data && data.breakdown && Object.keys(data.breakdown).length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.breakdown).map(([type, count]) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className={eventColors[type] || 'bg-gray-100 text-gray-800'}
                >
                  {type.replace(/_/g, ' ')}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Event Stream */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data && data.events && data.events.length > 0 ? (
            data.events.map((event, index) => {
              const Icon = eventIcons[event.type] || Activity;
              const color = eventColors[event.type] || 'text-gray-600';

              return (
                <div
                  key={event.id || index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors animate-fadeIn"
                >
                  <div className={`flex-shrink-0 ${color}`}>
                    <Icon className="h-4 w-4 mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${eventColors[event.type] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {event.type.replace(/_/g, ' ')}
                      </Badge>
                      {event.bookingValue && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          ₹{event.bookingValue.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {event.title || event.page}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{event.location}</span>
                      {event.device && <span>{event.device}</span>}
                      {event.source && <span>from {event.source}</span>}
                      <span className="text-gray-400">{getTimeAgo(event.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No recent events</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
