'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Eye, MousePointer, Gauge, Clock } from 'lucide-react';

interface WebVitalMetric {
  name: string;
  average: number;
  p75: number;
  total: number;
  distribution: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
}

interface WebVitalsData {
  summary: WebVitalMetric[];
  totalMeasurements: number;
  period: string;
}

const metricIcons: Record<string, any> = {
  LCP: Eye,
  FID: MousePointer,
  INP: MousePointer,
  CLS: Activity,
  FCP: Zap,
  TTFB: Clock,
};

const metricNames: Record<string, string> = {
  LCP: 'Largest Contentful Paint',
  FID: 'First Input Delay',
  INP: 'Interaction to Next Paint',
  CLS: 'Cumulative Layout Shift',
  FCP: 'First Contentful Paint',
  TTFB: 'Time to First Byte',
};

const metricUnits: Record<string, string> = {
  LCP: 'ms',
  FID: 'ms',
  INP: 'ms',
  CLS: '',
  FCP: 'ms',
  TTFB: 'ms',
};

function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'bg-green-100 text-green-800';
    case 'needs-improvement':
      return 'bg-yellow-100 text-yellow-800';
    case 'poor':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getOverallRating(metric: WebVitalMetric): 'good' | 'needs-improvement' | 'poor' {
  const goodPercent = (metric.distribution.good / metric.total) * 100;
  if (goodPercent >= 75) return 'good';
  if (goodPercent >= 50) return 'needs-improvement';
  return 'poor';
}

export default function WebVitalsWidget() {
  const [data, setData] = useState<WebVitalsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebVitals();
    // Refresh every 5 minutes
    const interval = setInterval(fetchWebVitals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWebVitals = async () => {
    try {
      const response = await fetch('/api/analytics/web-vitals?action=summary&days=7');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch Web Vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.totalMeasurements === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>No data available yet. Metrics will appear as users visit your site.</CardDescription>
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
              <Gauge className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
            <CardDescription>{data.period} • {data.totalMeasurements.toLocaleString()} measurements</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.summary.map((metric) => {
            const Icon = metricIcons[metric.name] || Activity;
            const rating = getOverallRating(metric);
            const unit = metricUnits[metric.name];

            return (
              <div
                key={metric.name}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-sm">{metric.name}</h4>
                  </div>
                  <Badge variant="secondary" className={getRatingColor(rating)}>
                    {rating === 'good' ? 'Good' : rating === 'needs-improvement' ? 'Fair' : 'Poor'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">75th Percentile</p>
                    <p className="text-2xl font-bold">
                      {metric.name === 'CLS' ? metric.p75.toFixed(3) : metric.p75}
                      <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
                    </p>
                  </div>

                  <div className="text-xs text-gray-500">
                    Avg: {metric.name === 'CLS' ? metric.average.toFixed(3) : metric.average}{unit}
                  </div>

                  {/* Distribution bars */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-600">Good</span>
                      <span>{Math.round((metric.distribution.good / metric.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${(metric.distribution.good / metric.total) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-yellow-600">Needs Work</span>
                      <span>{Math.round((metric.distribution.needsImprovement / metric.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-yellow-500 h-1.5 rounded-full"
                        style={{ width: `${(metric.distribution.needsImprovement / metric.total) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-red-600">Poor</span>
                      <span>{Math.round((metric.distribution.poor / metric.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-red-500 h-1.5 rounded-full"
                        style={{ width: `${(metric.distribution.poor / metric.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">{metricNames[metric.name]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
