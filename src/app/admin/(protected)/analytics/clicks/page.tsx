'use client';

import React, { useState, useEffect } from 'react';
import {
  MousePointer,
  Link2,
  Phone,
  Share2,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  Eye,
  Target,
  Smartphone,
  Monitor,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ClickData {
  overview: {
    totalClicks: number;
    uniqueClicks: number;
    ctaClicks: number;
    phoneClicks: number;
    emailClicks: number;
    socialClicks: number;
    externalLinks: number;
    avgClicksPerSession: number;
  };
  trends: Array<{
    date: string;
    clicks: number;
    ctaClicks: number;
    linkClicks: number;
  }>;
  clicksByType: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  topElements: Array<{
    element: string;
    elementType: string;
    page: string;
    clicks: number;
    uniqueClicks: number;
    ctr: number;
  }>;
  ctaPerformance: Array<{
    cta: string;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }>;
  clickHeatmap: Array<{
    page: string;
    sections: Array<{
      section: string;
      clicks: number;
    }>;
  }>;
  deviceClicks: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  hourlyClicks: Array<{
    hour: string;
    clicks: number;
  }>;
}

export default function ClicksAnalyticsPage() {
  const [data, setData] = useState<ClickData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchClickData();
  }, [dateRange]);

  const fetchClickData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/clicks?range=${dateRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      // Failed to fetch - using mock data
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): ClickData => ({
    overview: {
      totalClicks: 45678,
      uniqueClicks: 32456,
      ctaClicks: 8765,
      phoneClicks: 2345,
      emailClicks: 876,
      socialClicks: 1234,
      externalLinks: 987,
      avgClicksPerSession: 4.2,
    },
    trends: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      clicks: Math.floor(Math.random() * 6000) + 4000,
      ctaClicks: Math.floor(Math.random() * 1200) + 800,
      linkClicks: Math.floor(Math.random() * 2000) + 1500,
    })),
    clicksByType: [
      { type: 'CTA Buttons', count: 8765, percentage: 35.2, color: '#3B82F6' },
      { type: 'Navigation Links', count: 6543, percentage: 26.3, color: '#10B981' },
      { type: 'Phone Links', count: 2345, percentage: 9.4, color: '#F59E0B' },
      { type: 'Card/Product Clicks', count: 3456, percentage: 13.9, color: '#8B5CF6' },
      { type: 'Social Media', count: 1234, percentage: 5.0, color: '#EC4899' },
      { type: 'Email Links', count: 876, percentage: 3.5, color: '#14B8A6' },
      { type: 'External Links', count: 987, percentage: 4.0, color: '#F97316' },
      { type: 'Other', count: 672, percentage: 2.7, color: '#6B7280' },
    ],
    topElements: [
      { element: 'Book Now - Hero', elementType: 'CTA', page: '/', clicks: 2345, uniqueClicks: 1876, ctr: 12.5 },
      { element: 'Call Now Button', elementType: 'Phone', page: '/contact', clicks: 1876, uniqueClicks: 1543, ctr: 8.7 },
      { element: 'Activa Card', elementType: 'Card', page: '/', clicks: 1654, uniqueClicks: 1234, ctr: 15.2 },
      { element: 'Get Quote CTA', elementType: 'CTA', page: '/activa-on-rent', clicks: 1432, uniqueClicks: 1098, ctr: 9.8 },
      { element: 'WhatsApp Chat', elementType: 'Social', page: 'Global', clicks: 1234, uniqueClicks: 987, ctr: 6.5 },
      { element: 'View Prices Link', elementType: 'Link', page: '/', clicks: 1123, uniqueClicks: 876, ctr: 7.2 },
      { element: 'Self Drive Cars Card', elementType: 'Card', page: '/', clicks: 987, uniqueClicks: 765, ctr: 11.3 },
      { element: 'Contact Form Submit', elementType: 'CTA', page: '/contact', clicks: 876, uniqueClicks: 654, ctr: 18.5 },
    ],
    ctaPerformance: [
      { cta: 'Book Now', clicks: 3456, conversions: 234, conversionRate: 6.8 },
      { cta: 'Get Quote', clicks: 2345, conversions: 187, conversionRate: 8.0 },
      { cta: 'Call Now', clicks: 1876, conversions: 156, conversionRate: 8.3 },
      { cta: 'View Prices', clicks: 1543, conversions: 98, conversionRate: 6.4 },
      { cta: 'Contact Us', clicks: 987, conversions: 76, conversionRate: 7.7 },
    ],
    clickHeatmap: [
      {
        page: 'Homepage',
        sections: [
          { section: 'Hero', clicks: 4567 },
          { section: 'Vehicle Cards', clicks: 3456 },
          { section: 'Services', clicks: 2345 },
          { section: 'Testimonials', clicks: 876 },
          { section: 'Footer', clicks: 543 },
        ],
      },
      {
        page: 'Activa on Rent',
        sections: [
          { section: 'Hero', clicks: 2345 },
          { section: 'Pricing', clicks: 3456 },
          { section: 'Features', clicks: 1234 },
          { section: 'Booking Form', clicks: 1876 },
          { section: 'FAQ', clicks: 654 },
        ],
      },
    ],
    deviceClicks: {
      desktop: 18765,
      mobile: 24567,
      tablet: 2346,
    },
    hourlyClicks: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      clicks: Math.floor(Math.random() * 2000) + 500,
    })),
  });

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cta':
        return <Target className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'link':
        return <Link2 className="w-4 h-4" />;
      case 'card':
        return <Eye className="w-4 h-4" />;
      case 'social':
        return <Share2 className="w-4 h-4" />;
      default:
        return <MousePointer className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const totalDeviceClicks = data.deviceClicks.desktop + data.deviceClicks.mobile + data.deviceClicks.tablet;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Click Analytics</h1>
          <p className="text-gray-600">Track user interactions and click behavior</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={fetchClickData}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MousePointer className="w-5 h-5 text-blue-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <ArrowUpRight className="w-4 h-4" /> 12.3%
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.totalClicks.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">Total Clicks</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <ArrowUpRight className="w-4 h-4" /> 8.7%
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.ctaClicks.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">CTA Clicks</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Phone className="w-5 h-5 text-amber-600" />
            </div>
            <span className="flex items-center text-green-500 text-sm">
              <ArrowUpRight className="w-4 h-4" /> 15.2%
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.phoneClicks.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">Phone Clicks</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.avgClicksPerSession}</p>
          <p className="text-gray-500 text-sm">Avg Clicks/Session</p>
        </div>
      </div>

      {/* Click Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Click Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="clicks"
                fill="#3B82F6"
                fillOpacity={0.3}
                stroke="#3B82F6"
                strokeWidth={2}
                name="Total Clicks"
              />
              <Area
                type="monotone"
                dataKey="ctaClicks"
                fill="#10B981"
                fillOpacity={0.3}
                stroke="#10B981"
                strokeWidth={2}
                name="CTA Clicks"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Click Distribution & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Click Type Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Click Type Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.clicksByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {data.clicksByType.map((entry) => (
                      <Cell key={entry.type} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 max-h-56 overflow-y-auto">
              {data.clicksByType.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-xs text-gray-600">{type.type}</span>
                  </div>
                  <span className="text-xs font-medium">{type.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Clicks by Device</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Desktop</span>
                  <span className="text-sm text-gray-500">
                    {((data.deviceClicks.desktop / totalDeviceClicks) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(data.deviceClicks.desktop / totalDeviceClicks) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{data.deviceClicks.desktop.toLocaleString()} clicks</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Mobile</span>
                  <span className="text-sm text-gray-500">
                    {((data.deviceClicks.mobile / totalDeviceClicks) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(data.deviceClicks.mobile / totalDeviceClicks) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{data.deviceClicks.mobile.toLocaleString()} clicks</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="2" />
                  <circle cx="12" cy="18" r="1" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Tablet</span>
                  <span className="text-sm text-gray-500">
                    {((data.deviceClicks.tablet / totalDeviceClicks) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(data.deviceClicks.tablet / totalDeviceClicks) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{data.deviceClicks.tablet.toLocaleString()} clicks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">CTA Button Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.ctaPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="cta" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="clicks" fill="#3B82F6" name="Clicks" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" fill="#10B981" name="Conversions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clicked Elements */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Top Clicked Elements</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Element</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Page</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Clicks</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Unique</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">CTR</th>
              </tr>
            </thead>
            <tbody>
              {data.topElements.map((element, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(element.elementType)}
                      <span className="text-sm font-medium">{element.element}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {element.elementType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-blue-600">{element.page}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-sm font-medium">
                    {element.clicks.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-500">
                    {element.uniqueClicks.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="text-sm font-medium text-green-600">{element.ctr}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Click Heatmap by Page Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Page Section Click Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.clickHeatmap.map((page) => (
            <div key={page.page} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">{page.page}</h4>
              <div className="space-y-2">
                {page.sections.map((section) => {
                  const maxClicks = Math.max(...page.sections.map((s) => s.clicks));
                  const percentage = (section.clicks / maxClicks) * 100;
                  return (
                    <div key={section.section}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{section.section}</span>
                        <span className="text-sm font-medium">{section.clicks.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: `hsl(${220 - (percentage / 100) * 40}, 80%, 55%)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Click Pattern */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Hourly Click Pattern</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.hourlyClicks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="hour" stroke="#6B7280" fontSize={10} interval={2} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="clicks" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
