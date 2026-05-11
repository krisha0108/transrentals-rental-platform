import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { fetchBlogPosts, fetchCategories, fetchPopularTags, fetchFeaturedPosts, fetchBlogServices } from '@/lib/api/blog';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogSearch } from '@/components/blog/BlogSearch';
import { BlogSortSelect } from '@/components/blog/BlogSortSelect';
import { Pagination } from '@/components/blog/Pagination';
import { PopularCategoriesScroller } from '@/components/blog/PopularCategoriesScroller';
import { Compass, Car, ArrowRight, Globe, Tags } from 'lucide-react';
import { WebPageSchema } from '@/components/seo/schemas';

// Revalidate blog listing page every 60 seconds (ISR)
export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: { page?: string } }): Promise<Metadata> {
  const page = Number(searchParams.page) || 1;
  return {
    title: 'Travel Reflection - Car Rental Tips, Road Trip Guides & Destination Guides | TransRentals',
    description: 'Discover the best travel guides, road trip itineraries, bike trip tips, car rental advice, and destination guides for exploring India. Expert advice from TransRentals travel experts.',
    keywords: [
      'travel reflection india',
      'road trip guides',
      'car rental tips',
      'bike trip itineraries',
      'leh ladakh guide',
      'manali trip',
      'goa travel',
      'kerala road trip',
      'rajasthan heritage tour',
      'wedding car rental guide',
      'corporate car rental',
      'budget travel tips',
      'india travel reflection',
    ],
    openGraph: {
      title: 'TransRentals Travel Reflection - Road Trip Guides & Car Rental Tips',
      description: 'Expert travel guides, road trip itineraries, and car rental tips for exploring incredible India.',
      type: 'website',
      url: 'https://transrentals.in/blog',
      images: [
        {
          url: '/images/blog-og.jpg',
          width: 1200,
          height: 630,
          alt: 'TransRentals Travel Reflection',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'TransRentals Travel Reflection',
      description: 'Expert travel guides and car rental tips for India',
    },
    alternates: {
      canonical: page > 1
        ? `https://transrentals.in/blog?page=${page}`
        : 'https://transrentals.in/blog',
    },
  };
}

// Slug → display info mapping for services
const SERVICE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  'bike-on-rent':       { label: 'Bike Rentals',        icon: '🏍️', color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200 hover:border-orange-400' },
  'car-rental':         { label: 'Car Rentals',          icon: '🚗', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
  'self-drive':         { label: 'Self Drive',           icon: '🗝️', color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200 hover:border-purple-400' },
  'bus-rental':         { label: 'Bus Rentals',          icon: '🚌', color: 'text-green-600',   bg: 'bg-green-50 border-green-200 hover:border-green-400' },
  'truck-rental':       { label: 'Truck Rentals',        icon: '🚚', color: 'text-red-600',     bg: 'bg-red-50 border-red-200 hover:border-red-400' },
  'packers-and-movers': { label: 'Packers & Movers',     icon: '📦', color: 'text-yellow-600',  bg: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400' },
  'equipment-rental':   { label: 'Equipment Rentals',    icon: '🏗️', color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200 hover:border-slate-400' },
  'luxury-car-rental':  { label: 'Luxury Cars',          icon: '✨', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200 hover:border-amber-400' },
  'airport-transfer':   { label: 'Airport Transfers',    icon: '✈️', color: 'text-sky-600',     bg: 'bg-sky-50 border-sky-200 hover:border-sky-400' },
  'one-way-cab':        { label: 'One Way Cab',          icon: '🚕', color: 'text-teal-600',    bg: 'bg-teal-50 border-teal-200 hover:border-teal-400' },
  'tempo-traveller':    { label: 'Tempo Traveller',      icon: '🚐', color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400' },
  'wedding-cars':       { label: 'Wedding Cars',         icon: '💒', color: 'text-pink-600',    bg: 'bg-pink-50 border-pink-200 hover:border-pink-400' },
};

function serviceLabel(slug: string) {
  return SERVICE_META[slug]?.label || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function serviceIcon(slug: string) {
  return SERVICE_META[slug]?.icon || '🔧';
}
function serviceBg(slug: string) {
  return SERVICE_META[slug]?.bg || 'bg-gray-50 border-gray-200 hover:border-gray-400';
}
function serviceColor(slug: string) {
  return SERVICE_META[slug]?.color || 'text-gray-700';
}

interface BlogPageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    sort?: 'latest' | 'popular' | 'oldest';
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const page = Number(searchParams.page) || 1;
  const limit = 12;

  // Fetch data
  const [postsResponse, categories, tags, featuredPosts, blogServices] = await Promise.all([
    fetchBlogPosts({
      page,
      limit,
      category: searchParams.category,
      tag: searchParams.tag,
      sortBy: searchParams.sort || 'latest',
    }),
    fetchCategories(),
    fetchPopularTags(),
    page === 1 ? fetchFeaturedPosts(4) : Promise.resolve([]),
    fetchBlogServices(),
  ]);

  const { posts, meta } = postsResponse;

  return (
    <div className="min-h-screen bg-gray-50">
      <WebPageSchema
        type="CollectionPage"
        name="Travel Reflection - Road Trip Guides & Car Rental Tips | TransRentals"
        description="Discover the best travel guides, road trip itineraries, bike trip tips, car rental advice, and destination guides for exploring India."
        url={`https://transrentals.in/blog${page > 1 ? `?page=${page}` : ''}`}
        breadcrumbs={[
          { name: 'Home', url: 'https://transrentals.in' },
          { name: 'Travel Reflection', url: 'https://transrentals.in/blog' },
        ]}
      />
      {/* Compact Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-400/20"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-full bg-emerald-700/10"></div>
        </div>

        <div className="relative container mx-auto mt-5 px-4 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="md:w-2/3">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-medium">TRANSRENTALS TRAVEL REFLECTION</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  Discover India's Hidden Roads
                  <span className="block text-emerald-100 text-2xl md:text-3xl mt-2">
                    Curated Travel Guides & Expert Tips
                  </span>
                </h1>

                <p className="text-emerald-50/90 mb-6 max-w-2xl">
                  Expert travel guides, road trip itineraries, and car rental insights for exploring
                  the diverse landscapes and cultures of India.
                </p>

                <div className="max-w-xl w-full">
                  <div className="bg-white rounded-2xl p-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <BlogSearch />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-100/80 mt-2 px-1">
                    Search destinations, itineraries, or travel tips
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="md:w-1/3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium uppercase tracking-wider">WEEKLY DISPATCH</span>
                  </div>
                  <h3 className="text-lg font-bold mb-3">New Guides Every Friday</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">250+</div>
                      <div className="text-xs text-white/70 mt-1">Stories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">50+</div>
                      <div className="text-xs text-white/70 mt-1">Destinations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <div>
              {/* <p className="text-xs font-semibold tracking-[0.3em] text-gray-400 uppercase">
                Categories
              </p> */}
              <h2 className="text-2xl font-semibold text-gray-900">
                Explore Popular Categories
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Discover travel stories and tips grouped by the experiences you love.
              </p>
            </div>
            <div>
              <PopularCategoriesScroller categories={categories} />
            </div>
          </div>
        </div>
      </div>

      {/* Browse by Service */}
      {blogServices.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-gray-900">Browse by Service</h2>
              <p className="text-sm text-gray-500 mt-1">
                Find blogs specific to the vehicle service you need
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {blogServices.map((svc) => (
                <Link
                  key={svc.slug}
                  href={`/blog/service/${svc.slug}`}
                  className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${serviceBg(svc.slug)} ${serviceColor(svc.slug)}`}
                >
                  <span className="text-lg">{serviceIcon(svc.slug)}</span>
                  <span>{serviceLabel(svc.slug)}</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/70 text-xs font-semibold text-gray-500">
                    {svc.postCount}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Posts - Magazine Layout */}
      {page === 1 && featuredPosts.length > 0 && (
        <div className="bg-gray-50/50 border-y border-gray-100">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-400">Featured Stories</p>
                <h2 className="text-3xl font-semibold text-gray-900">Handpicked travel tales</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Deep dives, curated journeys, and actionable guides for passionate explorers.
                </p>
              </div>

              {/* Magazine Layout: 70% main + 30% sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                {/* Main Featured Post - 70% */}
                {featuredPosts[0] && (
                  <Link
                    href={`/blog/${featuredPosts[0].slug}`}
                    className="lg:col-span-7 group relative overflow-hidden rounded-2xl bg-gray-900 min-h-[400px] lg:min-h-[500px]"
                  >
                    {/* Background with gradient overlay */}
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${featuredPosts[0].category.color || '#10B981'} 0%, ${featuredPosts[0].category.color || '#10B981'}99 100%)`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Large category icon watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] opacity-10 select-none">
                      {featuredPosts[0].category.icon || '📝'}
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                      {/* Featured badge */}
                      <div className="absolute top-6 left-6 flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                          Editor's Pick
                        </span>
                      </div>

                      {/* Category */}
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 w-fit"
                        style={{ backgroundColor: `${featuredPosts[0].category.color}cc` }}
                      >
                        <span>{featuredPosts[0].category.icon || '📝'}</span>
                        <span className="text-white">{featuredPosts[0].category.name}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-emerald-200 transition-colors">
                        {featuredPosts[0].title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-white/80 text-base md:text-lg mb-6 line-clamp-2 max-w-2xl">
                        {featuredPosts[0].excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-white/70 text-sm">
                          <span>{new Date(featuredPosts[0].publishedAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>{featuredPosts[0].readTime} min read</span>
                        </div>
                        <span className="flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all">
                          Read Story <ArrowRight className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Side Posts - 30% */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  {featuredPosts.slice(1, 4).map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex-1 relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all"
                    >
                      <div className="p-5 h-full flex flex-col">
                        {/* Category & Date */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${post.category.color}15`,
                              color: post.category.color,
                            }}
                          >
                            <span>{post.category.icon || '📝'}</span>
                            {post.category.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(post.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2 flex-grow">
                          {post.title}
                        </h3>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
                          <span>{post.readTime} min read</span>
                          <span className="flex items-center gap-1 text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* Side accent bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: post.category.color }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Weekly Digest card commented out per request */}
          {/*
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Weekly Digest</h3>
                <p className="text-sm text-emerald-100">Travel tips in your inbox</p>
              </div>
            </div>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-emerald-100 text-sm focus:outline-none focus:ring-1 focus:ring-white"
                required
              />
              <button
                type="submit"
                className="w-full bg-white text-emerald-600 font-medium py-2 px-4 rounded-lg hover:bg-emerald-50 transition-colors text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
          */}
          <div className="min-w-0">
            {/* Content Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchParams.category
                    ? categories.find((c) => c.slug === searchParams.category)?.name || 'Category'
                    : searchParams.tag
                    ? `#${searchParams.tag}`
                    : 'Latest Articles'}
                </h2>
                <p className="text-gray-500 text-sm">{meta.totalPosts} articles</p>
              </div>
              <BlogSortSelect defaultSort={searchParams.sort} />
            </div>

            {/* Active Filters */}
            {(searchParams.category || searchParams.tag) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {searchParams.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                    {categories.find((c) => c.slug === searchParams.category)?.icon}{' '}
                    {categories.find((c) => c.slug === searchParams.category)?.name}
                    <Link href="/blog" className="text-emerald-500 hover:text-emerald-700 ml-1">
                      A-
                    </Link>
                  </span>
                )}
                {searchParams.tag && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                    #{searchParams.tag}
                    <Link href="/blog" className="text-purple-500 hover:text-purple-700 ml-1">
                      A-
                    </Link>
                  </span>
                )}
              </div>
            )}

            {/* Blog Grid */}
            <Suspense
              fallback={
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                </div>
              }
            >
              {posts.length > 0 ? (
                <BlogGrid posts={posts} />
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <Compass className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No guides found</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Try adjusting your filters or explore different categories
                  </p>
                </div>
              )}
            </Suspense>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-gray-200">
                <Pagination meta={meta} basePath="/blog" />
              </div>
            )}

            {tags.length > 0 && (
              <div className="mt-12 relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl" />

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-bold text-white/5 select-none">#</div>

                <div className="relative p-8 md:p-10">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Tags className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white">Trending Topics</h3>
                        <p className="text-white/70 text-sm">Explore what travelers are reading</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-white/90 text-sm font-medium">{tags.length}+ topics</span>
                    </div>
                  </div>

                  {/* Tags Grid */}
                  <div className="flex flex-wrap gap-3">
                    {tags.slice(0, 12).map((tag, index) => (
                      <Link
                        key={tag.id}
                        href={`/blog/tag/${tag.slug}`}
                        className={`group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                          index < 3
                            ? 'bg-white text-gray-900 shadow-md hover:shadow-xl'
                            : 'bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25'
                        }`}
                      >
                        {index < 3 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                            {index + 1}
                          </span>
                        )}
                        <span className={index < 3 ? 'text-purple-600' : 'text-white/80'}>#</span>
                        <span>{tag.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          index < 3
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-white/20 text-white/80'
                        }`}>
                          {tag.postCount}
                        </span>
                      </Link>
                    ))}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-6">
              <Car className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-3xl font-serif font-light text-gray-900 mb-4">
              Start Your Journey Today
            </h2>

            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Find the perfect vehicle for your next Indian adventure. From rugged SUVs for mountain trails
              to comfortable sedans for city exploration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Vehicles
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Get Travel Advice
              </a>
            </div>

            <p className="text-sm text-gray-500 mt-8">
              24/7 support • Free cancellation • Best price guarantee
            </p>
          </div>
        </div>
      </div>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'TransRentals Travel Reflection',
            description: 'Travel guides, road trip itineraries, and car rental tips for India',
            url: 'https://transrentals.in/blog',
            publisher: {
              '@type': 'Organization',
              name: 'TransRentals',
              logo: {
                '@type': 'ImageObject',
                url: 'https://transrentals.in/logo.png',
              },
            },
          }),
        }}
      />
    </div>
  );
}
