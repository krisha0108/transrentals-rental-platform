'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Gauge,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// TypeScript Interfaces
interface SEOAuditResult {
  id: string;
  url: string;
  pageTitle: string;
  path: string;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onPageScore: number;
  issues: string[];
  warnings: string[];
  passed: string[];
  contentMetrics: {
    wordCount: number;
    h1Count: number;
    h1Text?: string;
    titleLength: number;
    metaDescriptionLength: number;
    metaDescription?: string;
  };
  imageMetrics: {
    totalImages: number;
    imagesWithAlt: number;
    imagesWithoutAlt: number;
  };
  linkMetrics: {
    internalLinks: number;
    externalLinks: number;
    brokenLinks: number;
  };
  technicalMetrics: {
    isIndexable: boolean;
    isMobileFriendly: boolean;
    hasStructuredData: boolean;
    hasOpenGraph: boolean;
    canonicalUrl?: string;
  };
  performanceMetrics: {
    loadTime: number;
    pageSize: number;
  };
  lastAudited: string;
  createdAt: string;
}

interface AuditSummary {
  totalPages: number;
  averageScore: number;
  scoreDistribution: {
    good: number; // 80+
    needsWork: number; // 60-79
    poor: number; // <60
  };
  lastAuditDate: string;
}

export default function SEOAuditPage() {
  const [audits, setAudits] = useState<SEOAuditResult[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditingUrl, setAuditingUrl] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<SEOAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/seo/audits');
      if (response.ok) {
        const data = await response.json();
        setAudits(data.audits || []);
        setSummary(data.summary || calculateSummary(data.audits || []));
      } else {
        // Use mock data for demonstration
        const mockData = getMockAudits();
        setAudits(mockData);
        setSummary(calculateSummary(mockData));
      }
    } catch (err) {
      console.error('Failed to fetch audits:', err);
      // Use mock data on error
      const mockData = getMockAudits();
      setAudits(mockData);
      setSummary(calculateSummary(mockData));
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    if (!auditingUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAuditing(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: auditingUrl }),
      });

      if (response.ok) {
        const newAudit = await response.json();
        setAudits([newAudit, ...audits]);
        setSummary(calculateSummary([newAudit, ...audits]));
        setAuditingUrl('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to run audit');
      }
    } catch (err) {
      console.error('Audit error:', err);
      setError('Failed to run audit. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const calculateSummary = (auditData: SEOAuditResult[]): AuditSummary => {
    if (auditData.length === 0) {
      return {
        totalPages: 0,
        averageScore: 0,
        scoreDistribution: { good: 0, needsWork: 0, poor: 0 },
        lastAuditDate: new Date().toISOString(),
      };
    }

    const totalScore = auditData.reduce((sum, audit) => sum + audit.overallScore, 0);
    const avgScore = totalScore / auditData.length;

    const distribution = auditData.reduce(
      (acc, audit) => {
        if (audit.overallScore >= 80) acc.good++;
        else if (audit.overallScore >= 60) acc.needsWork++;
        else acc.poor++;
        return acc;
      },
      { good: 0, needsWork: 0, poor: 0 }
    );

    return {
      totalPages: auditData.length,
      averageScore: Math.round(avgScore),
      scoreDistribution: distribution,
      lastAuditDate: auditData[0]?.lastAudited || new Date().toISOString(),
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBorderColor = (score: number): string => {
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMockAudits = (): SEOAuditResult[] => {
    return [
      {
        id: '1',
        url: 'https://example.com/',
        pageTitle: 'Home - Example Company',
        path: '/',
        overallScore: 92,
        technicalScore: 95,
        contentScore: 88,
        onPageScore: 93,
        issues: [],
        warnings: ['Meta description could be more descriptive'],
        passed: [
          'Title tag is present and optimal length',
          'H1 tag is present',
          'All images have alt text',
          'Page is mobile-friendly',
          'HTTPS is enabled',
          'Canonical URL is set',
        ],
        contentMetrics: {
          wordCount: 1250,
          h1Count: 1,
          h1Text: 'Welcome to Example Company',
          titleLength: 28,
          metaDescriptionLength: 145,
          metaDescription: 'Example Company provides innovative solutions for your business needs. Discover our services and how we can help you grow.',
        },
        imageMetrics: {
          totalImages: 12,
          imagesWithAlt: 12,
          imagesWithoutAlt: 0,
        },
        linkMetrics: {
          internalLinks: 24,
          externalLinks: 5,
          brokenLinks: 0,
        },
        technicalMetrics: {
          isIndexable: true,
          isMobileFriendly: true,
          hasStructuredData: true,
          hasOpenGraph: true,
          canonicalUrl: 'https://example.com/',
        },
        performanceMetrics: {
          loadTime: 1.8,
          pageSize: 245,
        },
        lastAudited: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        url: 'https://example.com/products',
        pageTitle: 'Our Products',
        path: '/products',
        overallScore: 72,
        technicalScore: 80,
        contentScore: 65,
        onPageScore: 71,
        issues: ['Content length is below recommended 800 words', '3 images missing alt text'],
        warnings: ['Title tag is too short', 'Missing meta description'],
        passed: [
          'H1 tag is present',
          'Page is mobile-friendly',
          'HTTPS is enabled',
          'No broken links found',
        ],
        contentMetrics: {
          wordCount: 520,
          h1Count: 1,
          h1Text: 'Our Products',
          titleLength: 12,
          metaDescriptionLength: 0,
        },
        imageMetrics: {
          totalImages: 15,
          imagesWithAlt: 12,
          imagesWithoutAlt: 3,
        },
        linkMetrics: {
          internalLinks: 18,
          externalLinks: 2,
          brokenLinks: 0,
        },
        technicalMetrics: {
          isIndexable: true,
          isMobileFriendly: true,
          hasStructuredData: false,
          hasOpenGraph: true,
          canonicalUrl: 'https://example.com/products',
        },
        performanceMetrics: {
          loadTime: 2.4,
          pageSize: 380,
        },
        lastAudited: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        url: 'https://example.com/blog/seo-tips',
        pageTitle: 'Top 10 SEO Tips for 2024 - Example Blog',
        path: '/blog/seo-tips',
        overallScore: 55,
        technicalScore: 60,
        contentScore: 48,
        onPageScore: 57,
        issues: [
          'Multiple H1 tags found (should be only one)',
          'Title tag exceeds recommended length',
          '8 images missing alt text',
          '2 broken internal links found',
          'Page load time exceeds 3 seconds',
        ],
        warnings: [
          'Meta description is too long',
          'Low internal linking',
          'No structured data found',
        ],
        passed: ['HTTPS is enabled', 'Page is mobile-friendly', 'Canonical URL is set'],
        contentMetrics: {
          wordCount: 450,
          h1Count: 3,
          h1Text: 'SEO Tips',
          titleLength: 68,
          metaDescriptionLength: 185,
          metaDescription: 'Discover the top 10 SEO tips that will help your website rank higher in search engines in 2024. Learn about keyword research, content optimization, technical SEO, and more in this comprehensive guide.',
        },
        imageMetrics: {
          totalImages: 10,
          imagesWithAlt: 2,
          imagesWithoutAlt: 8,
        },
        linkMetrics: {
          internalLinks: 5,
          externalLinks: 8,
          brokenLinks: 2,
        },
        technicalMetrics: {
          isIndexable: true,
          isMobileFriendly: true,
          hasStructuredData: false,
          hasOpenGraph: false,
          canonicalUrl: 'https://example.com/blog/seo-tips',
        },
        performanceMetrics: {
          loadTime: 3.8,
          pageSize: 520,
        },
        lastAudited: new Date(Date.now() - 172800000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Audit Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and improve your website's search engine optimization</p>
        </div>
        <Button onClick={fetchAudits} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Pages Audited</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalPages}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500 opacity-80" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Average Score</p>
                <p className={`text-3xl font-bold mt-2 ${getScoreTextColor(summary.averageScore)}`}>
                  {summary.averageScore}
                </p>
              </div>
              <Gauge className={`w-10 h-10 opacity-80 ${getScoreTextColor(summary.averageScore)}`} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-3">Score Distribution</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Good (80+)
                  </span>
                  <span className="font-semibold">{summary.scoreDistribution.good}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-600 flex items-center">
                    <Minus className="w-4 h-4 mr-1" />
                    Needs Work (60-79)
                  </span>
                  <span className="font-semibold">{summary.scoreDistribution.needsWork}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Poor (&lt;60)
                  </span>
                  <span className="font-semibold">{summary.scoreDistribution.poor}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Last Audit</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">
                  {formatDate(summary.lastAuditDate)}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-purple-500 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Audit Trigger Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Run New Audit</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={auditingUrl}
              onChange={(e) => setAuditingUrl(e.target.value)}
              placeholder="Enter URL to audit (e.g., https://example.com/page)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={isAuditing}
              onKeyPress={(e) => e.key === 'Enter' && runAudit()}
            />
          </div>
          <Button
            onClick={runAudit}
            disabled={isAuditing || !auditingUrl.trim()}
            className="px-6"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Run Audit
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Audits Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Overall Score
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Technical
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  On-Page
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Warnings
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Audit
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No audits found. Run your first audit above.
                  </td>
                </tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm">{audit.pageTitle}</span>
                        <span className="text-xs text-gray-500 flex items-center mt-1">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {audit.path}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 ${getScoreBorderColor(audit.overallScore)}`}>
                        <span className={`text-2xl font-bold ${getScoreTextColor(audit.overallScore)}`}>
                          {audit.overallScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(audit.technicalScore)}`}>
                        {audit.technicalScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(audit.contentScore)}`}>
                        {audit.contentScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(audit.onPageScore)}`}>
                        {audit.onPageScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {audit.issues.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <XCircle className="w-4 h-4" />
                          {audit.issues.length}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {audit.warnings.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          {audit.warnings.length}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(audit.lastAudited)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        onClick={() => setSelectedAudit(audit)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{selectedAudit.pageTitle}</h2>
                <p className="text-sm text-gray-600 mt-1 flex items-center">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {selectedAudit.url}
                </p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-2">Overall Score</p>
                  <p className={`text-4xl font-bold ${getScoreTextColor(selectedAudit.overallScore)}`}>
                    {selectedAudit.overallScore}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <p className="text-xs text-purple-700 font-semibold uppercase mb-2">Technical</p>
                  <p className={`text-4xl font-bold ${getScoreTextColor(selectedAudit.technicalScore)}`}>
                    {selectedAudit.technicalScore}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <p className="text-xs text-green-700 font-semibold uppercase mb-2">Content</p>
                  <p className={`text-4xl font-bold ${getScoreTextColor(selectedAudit.contentScore)}`}>
                    {selectedAudit.contentScore}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
                  <p className="text-xs text-amber-700 font-semibold uppercase mb-2">On-Page</p>
                  <p className={`text-4xl font-bold ${getScoreTextColor(selectedAudit.onPageScore)}`}>
                    {selectedAudit.onPageScore}
                  </p>
                </div>
              </div>

              {/* Issues Section */}
              {selectedAudit.issues.length > 0 && (
                <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900">
                      Issues ({selectedAudit.issues.length})
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {selectedAudit.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings Section */}
              {selectedAudit.warnings.length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-900">
                      Warnings ({selectedAudit.warnings.length})
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {selectedAudit.warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-yellow-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Passed Section */}
              {selectedAudit.passed.length > 0 && (
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Passed ({selectedAudit.passed.length})
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {selectedAudit.passed.map((pass, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{pass}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Content Metrics */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Content Metrics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Word Count</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedAudit.contentMetrics.wordCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">H1 Count</p>
                    <p className={`text-2xl font-bold ${selectedAudit.contentMetrics.h1Count === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAudit.contentMetrics.h1Count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Title Length</p>
                    <p className={`text-2xl font-bold ${selectedAudit.contentMetrics.titleLength >= 30 && selectedAudit.contentMetrics.titleLength <= 60 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedAudit.contentMetrics.titleLength}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Meta Desc Length</p>
                    <p className={`text-2xl font-bold ${selectedAudit.contentMetrics.metaDescriptionLength >= 120 && selectedAudit.contentMetrics.metaDescriptionLength <= 160 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedAudit.contentMetrics.metaDescriptionLength}
                    </p>
                  </div>
                </div>
                {selectedAudit.contentMetrics.h1Text && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">H1 Text</p>
                    <p className="text-sm text-gray-700 font-medium">{selectedAudit.contentMetrics.h1Text}</p>
                  </div>
                )}
                {selectedAudit.contentMetrics.metaDescription && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Meta Description</p>
                    <p className="text-sm text-gray-700">{selectedAudit.contentMetrics.metaDescription}</p>
                  </div>
                )}
              </div>

              {/* Images & Links Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Images</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Images</span>
                      <span className="text-lg font-bold text-gray-900">{selectedAudit.imageMetrics.totalImages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">With Alt Text</span>
                      <span className="text-lg font-bold text-green-600">{selectedAudit.imageMetrics.imagesWithAlt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Missing Alt Text</span>
                      <span className="text-lg font-bold text-red-600">{selectedAudit.imageMetrics.imagesWithoutAlt}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <LinkIcon className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Links</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Internal Links</span>
                      <span className="text-lg font-bold text-gray-900">{selectedAudit.linkMetrics.internalLinks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">External Links</span>
                      <span className="text-lg font-bold text-blue-600">{selectedAudit.linkMetrics.externalLinks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Broken Links</span>
                      <span className="text-lg font-bold text-red-600">{selectedAudit.linkMetrics.brokenLinks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Metrics */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Technical Metrics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    {selectedAudit.technicalMetrics.isIndexable ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">Indexable</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedAudit.technicalMetrics.isMobileFriendly ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">Mobile Friendly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedAudit.technicalMetrics.hasStructuredData ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">Structured Data</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedAudit.technicalMetrics.hasOpenGraph ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">Open Graph</span>
                  </div>
                </div>
                {selectedAudit.technicalMetrics.canonicalUrl && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Canonical URL</p>
                    <p className="text-sm text-gray-700 font-mono">{selectedAudit.technicalMetrics.canonicalUrl}</p>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Load Time</p>
                    <p className={`text-2xl font-bold ${selectedAudit.performanceMetrics.loadTime < 3 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAudit.performanceMetrics.loadTime}s
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Page Size</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedAudit.performanceMetrics.pageSize} KB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <Button onClick={() => setSelectedAudit(null)} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
