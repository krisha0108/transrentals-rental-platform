'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Save,
  AlertCircle,
  Loader2,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  Search,
  Link2,
  FileText,
  Tag,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  schema: string;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Bike,
  CarTaxiFront,
  Crown,
  Bus,
  Truck,
  Package,
  Wrench,
};

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  flowType?: string;
}

export default function ServiceSEOPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const ServiceIcon = service ? IconMap[service.icon || ''] || Car : Car;

  const [seoData, setSeoData] = useState<SEOData>({
    metaTitle: '',
    metaDescription: '',
    focusKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    robotsIndex: true,
    robotsFollow: true,
    schema: '',
  });

  // Fetch service from database
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setService(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  useEffect(() => {
    const fetchSeo = async () => {
      if (!service) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/services/${slug}/seo`);
        if (res.ok) {
          const data = await res.json();
          setSeoData(data.seo);
        } else {
          // Fallback to service defaults
          setSeoData({
            metaTitle: `${service.name} in India - Best Prices | TransRentals`,
            metaDescription: `${service.description || service.name}. Book ${service.name.toLowerCase()} at best prices in Mumbai, Delhi, Bangalore & 50+ cities. Instant booking, verified vehicles.`,
            focusKeywords: `${service.slug.replace(/-/g, ' ')}, ${service.name.toLowerCase()}, rent ${service.name.toLowerCase()}, ${service.name.toLowerCase()} near me`,
            canonicalUrl: `https://transrentals.in/${service.slug}`,
            ogTitle: `${service.name} - TransRentals`,
            ogDescription: service.description || service.name,
            ogImage: `https://transrentals.in/images/og/${service.slug}.jpg`,
            robotsIndex: true,
            robotsFollow: true,
            schema: JSON.stringify(
              {
                '@context': 'https://schema.org',
                '@type': 'Service',
                name: service.name,
                description: service.description || service.name,
                provider: {
                  '@type': 'Organization',
                  name: 'TransRentals',
                },
              },
              null,
              2
            ),
          });
        }
      } catch (error) {
        console.error('Failed to fetch SEO settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchSeo();
    }
  }, [slug, service]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoData),
      });

      if (res.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save SEO settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SEOData, value: string | boolean) => {
    setSeoData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const metaTitleLength = seoData.metaTitle.length;
  const metaDescLength = seoData.metaDescription.length;

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Link href="/admin/services" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-500">The service &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {service.name}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href={`/admin/seo-content?service=${slug}`}>
            <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <FileText className="w-4 h-4 mr-2" />
              Manage City Pages Content
            </Button>
          </Link>
          <Link href={`/${service.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
          <Button
            disabled={!hasChanges || saving}
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 border flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main SEO Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Meta */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Basic Meta Tags
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                    <span className={`ml-2 text-xs ${metaTitleLength > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                      ({metaTitleLength}/60)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={seoData.metaTitle}
                    onChange={(e) => updateField('metaTitle', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Page title for search engines"
                  />
                  {metaTitleLength > 60 && (
                    <p className="text-xs text-red-500 mt-1">Title is too long. Recommended: 50-60 characters</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                    <span className={`ml-2 text-xs ${metaDescLength > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                      ({metaDescLength}/160)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={seoData.metaDescription}
                    onChange={(e) => updateField('metaDescription', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description for search results"
                  />
                  {metaDescLength > 160 && (
                    <p className="text-xs text-red-500 mt-1">Description is too long. Recommended: 150-160 characters</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Focus Keywords
                  </label>
                  <input
                    type="text"
                    value={seoData.focusKeywords}
                    onChange={(e) => updateField('focusKeywords', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Link2 className="w-4 h-4 inline mr-1" />
                    Canonical URL
                  </label>
                  <input
                    type="text"
                    value={seoData.canonicalUrl}
                    onChange={(e) => updateField('canonicalUrl', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Open Graph */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                Open Graph (Social Sharing)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OG Title</label>
                  <input
                    type="text"
                    value={seoData.ogTitle}
                    onChange={(e) => updateField('ogTitle', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OG Description</label>
                  <textarea
                    rows={2}
                    value={seoData.ogDescription}
                    onChange={(e) => updateField('ogDescription', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OG Image URL</label>
                  <input
                    type="text"
                    value={seoData.ogImage}
                    onChange={(e) => updateField('ogImage', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1200x630 pixels</p>
                </div>
              </div>
            </div>

            {/* Schema Markup */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                Schema Markup (JSON-LD)
              </h3>
              <textarea
                rows={12}
                value={seoData.schema}
                onChange={(e) => updateField('schema', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Structured data helps search engines understand your content better
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search Preview */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Preview</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                  {seoData.metaTitle || 'Page Title'}
                </p>
                <p className="text-green-700 text-sm truncate">{seoData.canonicalUrl}</p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {seoData.metaDescription || 'Meta description will appear here...'}
                </p>
              </div>
            </div>

            {/* Robots Settings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Robots Directives</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Index this page</p>
                    <p className="text-sm text-gray-500">Allow search engines to index</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seoData.robotsIndex}
                      onChange={(e) => updateField('robotsIndex', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Follow links</p>
                    <p className="text-sm text-gray-500">Allow bots to follow links</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seoData.robotsFollow}
                      onChange={(e) => updateField('robotsFollow', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* SEO Score */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Score</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {metaTitleLength >= 30 && metaTitleLength <= 60 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">Meta title length</span>
                </div>
                <div className="flex items-center gap-2">
                  {metaDescLength >= 120 && metaDescLength <= 160 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">Meta description length</span>
                </div>
                <div className="flex items-center gap-2">
                  {seoData.focusKeywords.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">Focus keywords set</span>
                </div>
                <div className="flex items-center gap-2">
                  {seoData.ogImage.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">OG image set</span>
                </div>
                <div className="flex items-center gap-2">
                  {seoData.schema.length > 10 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">Schema markup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
