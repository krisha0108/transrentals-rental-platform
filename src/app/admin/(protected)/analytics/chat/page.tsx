'use client';

import React, { useState, useEffect } from 'react';
import { AnalyticsError } from '../_components/AnalyticsError';
import {
  MessageCircle,
  Bot,
  Clock,
  CheckCircle,
  ThumbsUp,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  MessageSquare,
  Zap,
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
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface ChatData {
  overview: {
    totalConversations: number;
    totalMessages: number;
    avgResponseTime: number;
    resolutionRate: number;
    avgConversationLength: number;
    // Nothing in the chat widget collects a rating, so the API reports null here.
    satisfactionScore: number | null;
    bookingsFromChat: number;
    kbQueriesAnswered: number;
  };
  changes: {
    totalConversations: number | null;
    totalMessages: number | null;
    resolutionRate: number | null;
    bookingsFromChat: number | null;
  };
  trends: Array<{
    date: string;
    conversations: number;
    messages: number;
    resolutions: number;
  }>;
  hourlyActivity: Array<{
    hour: string;
    conversations: number;
  }>;
  intentAnalysis: Array<{
    intent: string;
    count: number;
    percentage: number;
  }>;
  outcomeDistribution: Array<{
    outcome: string;
    count: number;
    color: string;
  }>;
  topQuestions: Array<{
    question: string;
    count: number;
    resolution: string;
  }>;
  recentConversations: Array<{
    id: string;
    sessionId: string;
    messages: number;
    duration: string;
    intent: string;
    outcome: string;
    timestamp: string;
  }>;
  performanceMetrics: Array<{
    metric: string;
    value: number;
    fullMark: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];


/**
 * Period-over-period delta for a stat card. `null` means there was no comparable
 * previous window, which reads as a dash rather than an invented percentage.
 */
function DeltaBadge({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined) {
    return (
      <span className="text-sm text-gray-400" title="No data for the previous period">
        &mdash;
      </span>
    );
  }
  const tone = change === 0 ? 'text-gray-400' : change > 0 ? 'text-green-500' : 'text-red-500';
  const Icon = change < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={`flex items-center text-sm ${tone}`} title="vs previous period">
      {change !== 0 && <Icon className="w-4 h-4" />}
      {Math.abs(change)}%
    </span>
  );
}

export default function ChatAnalyticsPage() {
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchChatData();
  }, [dateRange]);

  const fetchChatData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/analytics/chat?range=${dateRange}`);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const result = await response.json();
      if (!result?.overview || typeof result.overview.totalConversations !== 'number') {
        throw new Error('Response did not contain chat overview data');
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return <AnalyticsError subject="chat analytics" message={error} onRetry={fetchChatData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Analytics - Shivi</h1>
          <p className="text-gray-600">Chatbot performance and conversation insights</p>
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
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchChatData}
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
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <DeltaBadge change={data.changes?.totalConversations} />
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.totalConversations.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">Total Conversations</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <DeltaBadge change={data.changes?.resolutionRate} />
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.resolutionRate}%</p>
          <p className="text-gray-500 text-sm">Resolution Rate</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <DeltaBadge change={data.changes?.bookingsFromChat} />
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.bookingsFromChat}</p>
          <p className="text-gray-500 text-sm">Bookings from Chat</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold">{data.overview.avgResponseTime}s</p>
          <p className="text-gray-500 text-sm">Avg Response Time</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <MessageSquare className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">{data.overview.totalMessages.toLocaleString()}</p>
          <p className="text-blue-100 text-sm">Total Messages</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <Bot className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">{data.overview.kbQueriesAnswered.toLocaleString()}</p>
          <p className="text-green-100 text-sm">KB Queries Answered</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <Clock className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">{data.overview.avgConversationLength}</p>
          <p className="text-purple-100 text-sm">Avg Messages/Chat</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <ThumbsUp className="w-6 h-6 opacity-80" />
          <p className="mt-3 text-3xl font-bold">
            {data.overview.satisfactionScore === null ? 'N/A' : `${data.overview.satisfactionScore}/5`}
          </p>
          <p className="text-amber-100 text-sm">
            {data.overview.satisfactionScore === null ? 'Satisfaction — not collected' : 'Satisfaction Score'}
          </p>
        </div>
      </div>

      {/* Conversation Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Conversation Trends</h3>
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
                dataKey="conversations"
                fill="#3B82F6"
                fillOpacity={0.3}
                stroke="#3B82F6"
                strokeWidth={2}
                name="Conversations"
              />
              <Area
                type="monotone"
                dataKey="resolutions"
                fill="#10B981"
                fillOpacity={0.3}
                stroke="#10B981"
                strokeWidth={2}
                name="Resolutions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intent Analysis & Outcome Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intent Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">User Intent Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.intentAnalysis} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis dataKey="intent" type="category" stroke="#6B7280" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                  {data.intentAnalysis.map((entry, index) => (
                    <Cell key={entry.intent} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcome Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Conversation Outcomes</h3>
          <div className="flex items-center gap-4">
            <div className="h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.outcomeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {data.outcomeDistribution.map((entry) => (
                      <Cell key={entry.outcome} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.outcomeDistribution.map((outcome) => (
                <div key={outcome.outcome} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: outcome.color }}
                    />
                    <span className="text-sm text-gray-600">{outcome.outcome}</span>
                  </div>
                  <span className="text-sm font-medium">{outcome.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Activity & Performance Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Hourly Chat Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourlyActivity}>
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
                <Line
                  type="monotone"
                  dataKey="conversations"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Radar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Bot Performance Metrics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data.performanceMetrics}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Questions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Top User Questions</h3>
        <div className="space-y-3">
          {data.topQuestions.map((q, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{q.question}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{q.count} times</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    q.resolution === 'KB'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {q.resolution === 'KB' ? 'Knowledge Base' : 'Agent Handled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Recent Conversations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Session ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Messages</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Intent</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Outcome</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentConversations.map((conv) => (
                <tr key={conv.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono text-blue-600">{conv.sessionId}</span>
                  </td>
                  <td className="py-3 px-4 text-sm">{conv.messages}</td>
                  <td className="py-3 px-4 text-sm">{conv.duration}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {conv.intent}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        conv.outcome === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : conv.outcome === 'Resolved'
                          ? 'bg-blue-100 text-blue-700'
                          : conv.outcome === 'Escalated'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {conv.outcome}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{conv.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
