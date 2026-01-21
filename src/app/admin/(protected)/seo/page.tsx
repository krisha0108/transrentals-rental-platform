'use client';

import React, { useState, useEffect } from 'react';
import { Search, Globe, FileText, TrendingUp, Settings, Loader2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SeoItem {
  id: string;
  type: 'page' | 'blog';
  title: string;
  slug: string;
  url: string;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  hasOgImage: boolean;
  seoScore: number;
}

export default function SeoPage() {
  const [items, setItems] = useState<SeoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'page' | 'blog'>('all');

  useEffect(() => {
    const fetchSeoData = async () => {
      try {
        // Fetch pages and blog posts
        const [pagesRes, blogsRes] = await Promise.all([
          fetch('/api/admin/pages'),
          fetch('/api/admin/blog'),
        ]);

        const pages = pagesRes.ok ? await pagesRes.json() : [];
        const blogs = blogsRes.ok ? await blogsRes.json() : [];

        // Transform pages to SEO items
        const pageItems: SeoItem[] = (Array.isArray(pages) ? pages : []).map((page: any) => ({
          id: page.id,
          type: 'page' as const,
          title: page.title,
          slug: page.slug,
          url: `/${page.slug}`,
          status: page.status,
          metaTitle: page.seoMeta?.metaTitle || null,
          metaDescription: page.seoMeta?.metaDescription || null,
          hasOgImage: !!page.seoMeta?.ogImage,
          seoScore: calculateSeoScore(page),
        }));

        // Transform blogs to SEO items
        const blogItems: SeoItem[] = (Array.isArray(blogs) ? blogs : []).map((blog: any) => ({
          id: blog.id,
          type: 'blog' as const,
          title: blog.title,
          slug: blog.slug,
          url: `/blog/${blog.slug}`,
          status: blog.status,
          metaTitle: blog.seoMeta?.metaTitle || blog.title,
          metaDescription: blog.seoMeta?.metaDescription || blog.excerpt,
          hasOgImage: !!blog.featuredImage || !!blog.seoMeta?.ogImage,
          seoScore: calculateBlogSeoScore(blog),
        }));

        setItems([...pageItems, ...blogItems]);
      } catch (error) {
        console.error('Error fetching SEO data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeoData();
  }, []);

  const calculateSeoScore = (page: any): number => {
    let score = 0;
    if (page.title && page.title.length >= 10) score += 20;
    if (page.seoMeta?.metaTitle) score += 20;
    if (page.seoMeta?.metaDescription && page.seoMeta.metaDescription.length >= 50) score += 25;
    if (page.seoMeta?.ogImage) score += 15;
    if (page.content && page.content.length >= 300) score += 20;
    return Math.min(score, 100);
  };

  const calculateBlogSeoScore = (blog: any): number => {
    let score = 0;
    if (blog.title && blog.title.length >= 10) score += 15;
    if (blog.title && blog.title.length <= 60) score += 10;
    if (blog.excerpt && blog.excerpt.length >= 50) score += 20;
    if (blog.featuredImage) score += 15;
    if (blog.content && blog.content.length >= 500) score += 20;
    if (blog.readTime) score += 10;
    if (blog.status === 'PUBLISHED') score += 10;
    return Math.min(score, 100);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const avgScore = items.length > 0
    ? Math.round(items.reduce((acc, item) => acc + item.seoScore, 0) / items.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Overview</h1>
          <p className="text-gray-600">Monitor and optimize SEO for all your pages and blog posts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg SEO Score</p>
              <p className="text-xl font-bold text-gray-900">{avgScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">CMS Pages</p>
              <p className="text-xl font-bold text-gray-900">{items.filter(i => i.type === 'page').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">CMS Blog Posts</p>
              <p className="text-xl font-bold text-gray-900">{items.filter(i => i.type === 'blog').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search pages and posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('page')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'page' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setFilterType('blog')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'blog' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Blog Posts
            </button>
          </div>
        </div>
      </div>

      {/* SEO Items List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Page/Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Meta Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Meta Desc
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  OG Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SEO Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No items found. Create pages or blog posts to see SEO data.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.url}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'page' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.type === 'page' ? 'Page' : 'Blog'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.metaTitle ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.metaDescription ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.hasOgImage ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${getScoreColor(item.seoScore)}`}>
                        {item.seoScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={item.type === 'page' ? `/admin/pages/${item.id}/edit` : `/admin/blog/${item.id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">SEO Best Practices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Meta Title</p>
              <p className="text-sm text-gray-600">Keep between 50-60 characters for optimal display</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Meta Description</p>
              <p className="text-sm text-gray-600">Aim for 150-160 characters with relevant keywords</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">OG Image</p>
              <p className="text-sm text-gray-600">Use 1200x630px images for social sharing</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Content Length</p>
              <p className="text-sm text-gray-600">Longer content (1000+ words) often ranks better</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
