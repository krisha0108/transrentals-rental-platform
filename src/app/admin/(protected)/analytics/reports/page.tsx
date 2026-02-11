'use client';

import ReportBuilder from '@/components/reports/ReportBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, Calendar, Download, Zap } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Advanced Reports
        </h1>
        <p className="text-gray-500 mt-2">
          Generate custom reports, export data, and analyze trends
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-blue-600">
              <FileText className="h-5 w-5" />
              <CardTitle className="text-base">Report Templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Pre-configured reports for common use cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              <CardTitle className="text-base">Comparisons</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Period-over-period analysis and trends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-purple-600">
              <Download className="h-5 w-5" />
              <CardTitle className="text-base">Export Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Download reports in CSV or JSON format
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-orange-600">
              <Calendar className="h-5 w-5" />
              <CardTitle className="text-base">Custom Ranges</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Flexible date ranges and time periods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Builder */}
      <ReportBuilder />

      {/* Quick Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">1. Choose a Template</h4>
            <p>
              Select from 10 pre-configured report templates covering traffic, conversions,
              SEO rankings, bookings, and more.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">2. Configure Time Period</h4>
            <p>
              Choose from common periods (last 7/30/90 days, this month, etc.) or select
              a custom date range.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">3. Enable Comparison</h4>
            <p>
              Optionally compare with the previous period to see trends and changes
              (e.g., this month vs last month).
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">4. Generate & Export</h4>
            <p>
              Click "Generate Report" to analyze your data. Once ready, export to CSV or JSON
              for further analysis in Excel or other tools.
            </p>
          </div>

          <div className="pt-3 border-t">
            <h4 className="font-medium text-gray-900 mb-1">Available Report Types:</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">Weekly Traffic</Badge>
              <Badge variant="secondary">Monthly Performance</Badge>
              <Badge variant="secondary">Conversion Funnel</Badge>
              <Badge variant="secondary">SEO Rankings</Badge>
              <Badge variant="secondary">Revenue & Bookings</Badge>
              <Badge variant="secondary">Daily Snapshot</Badge>
              <Badge variant="secondary">Traffic Sources</Badge>
              <Badge variant="secondary">User Behavior</Badge>
              <Badge variant="secondary">Quarterly Review</Badge>
              <Badge variant="secondary">Page Performance</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
