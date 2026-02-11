'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Play, Calendar, FileText, Loader2 } from 'lucide-react';
import { REPORT_TEMPLATES, PERIOD_OPTIONS, EXPORT_FORMATS } from '@/lib/reports/report-templates';
import { downloadCSV, downloadJSON, formatters } from '@/lib/reports/export-utils';
import { formatComparison } from '@/lib/reports/comparison-utils';

export default function ReportBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [period, setPeriod] = useState<string>('last30days');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [comparePrevious, setComparePrevious] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      alert('Please select a report template');
      return;
    }

    setGenerating(true);
    setReportData(null);

    try {
      const template = REPORT_TEMPLATES.find((t) => t.id === selectedTemplate);
      if (!template) return;

      const requestBody: any = {
        reportType: template.reportType,
        period,
        comparePrevious,
        metrics: template.metrics,
        groupBy: template.groupBy,
        filters: template.filters || {},
      };

      // Add custom date range if selected
      if (period === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        requestBody.dateRange = {
          startDate: customDateRange.startDate,
          endDate: customDateRange.endDate,
        };
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        setReportData(result.report);
      } else {
        const error = await response.json();
        alert(`Failed to generate report: ${error.error}`);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = (format: string) => {
    if (!reportData || !reportData.data) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${selectedTemplate}_${timestamp}`;

    if (format === 'csv') {
      // Flatten data for CSV export
      const data = flattenReportData(reportData);
      downloadCSV({
        filename: `${filename}.csv`,
        columns: generateColumns(data[0]),
        data,
      });
    } else if (format === 'json') {
      downloadJSON(reportData, `${filename}.json`);
    }
  };

  const flattenReportData = (report: any): any[] => {
    // Flatten nested report data structure
    const flattened: any[] = [];

    if (report.data.summary) {
      flattened.push({
        section: 'Summary',
        ...report.data.summary,
      });
    }

    if (report.data.topPages) {
      report.data.topPages.forEach((page: any) => {
        flattened.push({
          section: 'Top Pages',
          ...page,
        });
      });
    }

    if (report.data.topKeywords) {
      report.data.topKeywords.forEach((keyword: any) => {
        flattened.push({
          section: 'Top Keywords',
          ...keyword,
        });
      });
    }

    return flattened;
  };

  const generateColumns = (sampleData: any) => {
    if (!sampleData) return [];

    return Object.keys(sampleData).map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Report Template
          </CardTitle>
          <CardDescription>Choose from pre-configured report templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  {selectedTemplate === template.id && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">{template.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.metrics.slice(0, 3).map((metric, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                  {template.metrics.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.metrics.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Period Selection */}
          <div>
            <Label htmlFor="period">Time Period</Label>
            <select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Compare Previous Period */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="comparePrevious"
              checked={comparePrevious}
              onChange={(e) => setComparePrevious(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="comparePrevious">Compare with previous period</Label>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={!selectedTemplate || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Report Results</CardTitle>
                <CardDescription>
                  Generated on {new Date(reportData.generatedAt).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {EXPORT_FORMATS.filter((f) => !f.disabled).map((format) => (
                  <Button
                    key={format.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(format.value)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {format.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Section */}
            {reportData.data.summary && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.data.summary).map(([key, value]: any) => {
                    if (key === 'comparison' && value) {
                      const formatted = formatComparison(value);
                      return (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Change</p>
                          <p className={`text-xl font-bold ${formatted.color}`}>
                            {formatted.icon} {formatted.text}
                          </p>
                        </div>
                      );
                    }

                    if (typeof value === 'number') {
                      return (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </p>
                          <p className="text-xl font-bold">{value.toLocaleString()}</p>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Top Pages */}
            {reportData.data.topPages && reportData.data.topPages.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Top Pages</h3>
                <div className="space-y-2">
                  {reportData.data.topPages.slice(0, 10).map((page: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.title || page.path}</p>
                        <p className="text-xs text-gray-500 truncate">{page.path}</p>
                      </div>
                      <Badge variant="secondary">{page.views} views</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data Preview */}
            <details className="mt-6">
              <summary className="cursor-pointer font-medium mb-2">View Raw Data</summary>
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
