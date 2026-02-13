import React from 'react';
import { prisma } from '@/lib/db/prisma';
import {
  ArrowRightLeft,
  Image,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { CITY_STATS } from '@/data/indian-cities';
import { FLEET_STATS } from '@/data/fleet';
import { blogPosts } from '@/data/blog-posts';
import Link from 'next/link';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import EnhancedDashboard from '@/components/admin/EnhancedDashboard';

// Count of static redirects defined in next.config.js
const STATIC_REDIRECTS_COUNT = 72; // Approximate count from next.config.js redirects array

// Static service pages count
const SERVICES = [
  'activa-on-rent', 'airport-transfer', 'bike-on-rent', 'bus-rental',
  'car-rental', 'chauffeur-service', 'corporate-bus-rental', 'corporate-car-rental',
  'equipment-rental', 'jcb-on-rent', 'local-taxi', 'luxury-car-rental',
  'mini-truck-rental', 'monthly-car-rental', 'one-way-car-rental', 'outstation-cab',
  'outstation-car-rental', 'packers-and-movers', 'royal-enfield-on-rent',
  'self-drive-car-rentals', 'sports-car-rental', 'tempo-traveller', 'trailer-on-rent',
  'transporter', 'vintage-car-rental', 'wedding-bus-rental', 'wedding-car-rental'
];

// Calculate all static pages
const STATIC_PAGES_COUNT = {
  services: SERVICES.length,
  cities: CITY_STATS.total,
  serviceLocationPages: SERVICES.length * CITY_STATS.total,
  fleetPages: FLEET_STATS.total,
  fleetLocationPages: FLEET_STATS.total * CITY_STATS.total,
  staticBlogPosts: blogPosts.length,
  totalStaticPages:
    SERVICES.length + // Service category pages
    (SERVICES.length * CITY_STATS.total) + // Service + location pages
    FLEET_STATS.total + // Fleet pages
    blogPosts.length + // Static blog posts
    10, // Other static pages (home, about, contact, etc.)
};

async function getStats() {
  try {
    const [
      totalPages,
      publishedPages,
      totalBlogPosts,
      publishedBlogPosts,
      totalRedirects,
      activeRedirects,
      totalMedia,
      totalViews,
      // Fleet management counts from database (using correct model names)
      totalVehicles,
      activeVehicles,
      totalLocations,
      activeLocations,
      totalCategories,
      activeCategories,
    ] = await Promise.all([
      prisma.pages.count(),
      prisma.pages.count({ where: { status: 'PUBLISHED' } }),
      prisma.blog_posts.count(),
      prisma.blog_posts.count({ where: { status: 'PUBLISHED' } }),
      prisma.redirects.count(),
      prisma.redirects.count({ where: { isActive: true } }),
      prisma.media.count(),
      prisma.blog_posts.aggregate({ _sum: { viewCount: true } }),
      // Fleet counts - using correct Prisma model names
      prisma.fleet.count(),
      prisma.fleet.count({ where: { isActive: true } }),
      prisma.fleet_locations.count(),
      prisma.fleet_locations.count({ where: { isActive: true } }),
      prisma.fleet_categories.count(),
      prisma.fleet_categories.count({ where: { isActive: true } }),
    ]);

    return {
      totalPages,
      publishedPages,
      totalBlogPosts,
      publishedBlogPosts,
      totalRedirects,
      activeRedirects,
      totalMedia,
      totalViews: totalViews._sum.viewCount || 0,
      // Fleet management
      totalVehicles,
      activeVehicles,
      totalLocations,
      activeLocations,
      totalCategories,
      activeCategories,
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return {
      totalPages: 0,
      publishedPages: 0,
      totalBlogPosts: 0,
      publishedBlogPosts: 0,
      totalRedirects: 0,
      activeRedirects: 0,
      totalMedia: 0,
      totalViews: 0,
      totalVehicles: 0,
      activeVehicles: 0,
      totalLocations: 0,
      activeLocations: 0,
      totalCategories: 0,
      activeCategories: 0,
    };
  }
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  viewCount: number;
  updatedAt: Date;
}

async function getRecentPosts(): Promise<RecentPost[]> {
  try {
    return await prisma.blog_posts.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
        updatedAt: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const recentPosts = await getRecentPosts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Comprehensive overview of your website and bookings</p>
      </div>

      {/* Enhanced Dashboard with Bookings & Quotes */}
      <EnhancedDashboard />

      {/* Visitor Analytics */}
      <AnalyticsDashboard />

      {/* Secondary Stats - 3 columns */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/admin/redirects" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-amber-300 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Redirects</p>
              <p className="text-xl font-bold text-gray-900">{STATIC_REDIRECTS_COUNT + stats.totalRedirects}</p>
              <p className="text-xs text-gray-500">{STATIC_REDIRECTS_COUNT} static + {stats.totalRedirects} CMS</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/media" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-rose-300 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Media Files</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalMedia}</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Services</p>
              <p className="text-xl font-bold text-gray-900">{STATIC_PAGES_COUNT.services}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blog Posts */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Blog Posts</h2>
            <Link href="/admin/blog" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-gray-500 text-sm">No blog posts yet</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/blog/${post.id}/edit`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-500">{post.viewCount} views</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {post.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* SEO Coverage */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-green-900">SEO Coverage</h2>
          </div>
          <p className="text-sm text-green-800 mb-4">
            Your website has <strong>{STATIC_PAGES_COUNT.totalStaticPages.toLocaleString()}+</strong> pages for SEO:
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Service Types</span>
              <span className="font-semibold text-green-900">{STATIC_PAGES_COUNT.services}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Cities Covered</span>
              <span className="font-semibold text-green-900">{STATIC_PAGES_COUNT.cities}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Service+Location Pages</span>
              <span className="font-semibold text-green-900">{STATIC_PAGES_COUNT.serviceLocationPages.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Fleet Vehicle Pages</span>
              <span className="font-semibold text-green-900">{STATIC_PAGES_COUNT.fleetPages}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Static Blog Articles</span>
              <span className="font-semibold text-green-900">{STATIC_PAGES_COUNT.staticBlogPosts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
