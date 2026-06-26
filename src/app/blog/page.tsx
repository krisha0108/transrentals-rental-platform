import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { fetchBlogPosts, fetchCategories, fetchPopularTags, fetchFeaturedPosts, fetchBlogServices } from '@/lib/api/blog';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { FeaturedStoriesCarousel } from '@/components/blog/FeaturedStoriesCarousel';
import { CategoriesCarousel } from '@/components/blog/CategoriesCarousel';
import { BlogSearch } from '@/components/blog/BlogSearch';
import { BlogSortSelect } from '@/components/blog/BlogSortSelect';
import { Pagination } from '@/components/blog/Pagination';
import { PopularCategoriesScroller } from '@/components/blog/PopularCategoriesScroller';
import {
  Compass, Car, ArrowRight, Globe, Tags,
  MapPin, Mountain, Route, BookOpen, Camera, Utensils, Bike, Plane, Waves, Tent, Newspaper,
} from 'lucide-react';
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

// Map a blog category to a premium line icon (instead of emojis)
function categoryIconFor(cat: { name?: string; slug?: string }) {
  const s = `${cat.name || ''} ${cat.slug || ''}`.toLowerCase();
  if (/road|trip|route|itinerary/.test(s)) return Route;
  if (/mountain|hill|trek|himalaya|ladakh|spiti/.test(s)) return Mountain;
  if (/beach|coast|sea|island|goa/.test(s)) return Waves;
  if (/food|cuisine|eat|restaurant|taste/.test(s)) return Utensils;
  if (/bike|motorcycle|scooter/.test(s)) return Bike;
  if (/car|drive|rental|vehicle|self/.test(s)) return Car;
  if (/photo|camera|gear/.test(s)) return Camera;
  if (/flight|air|airport/.test(s)) return Plane;
  if (/camp|adventure|wild|safari|forest|nature/.test(s)) return Tent;
  if (/news|update|story|stories/.test(s)) return Newspaper;
  if (/destination|place|city|location|guide-destination/.test(s)) return MapPin;
  if (/guide|tip|how|review|reflection/.test(s)) return BookOpen;
  return Compass;
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
    page === 1 ? fetchFeaturedPosts(6) : Promise.resolve([]),
    fetchBlogServices(),
  ]);

  const { posts, meta } = postsResponse;

  // Trending destinations — real, currently-popular India travel spots; we only
  // surface the ones that actually have blog posts in the DB (via existing search).
  const TRENDING_DESTINATIONS = [
    'Ladakh', 'Manali', 'Goa', 'Kerala', 'Jaipur', 'Rishikesh',
    'Coorg', 'Munnar', 'Ooty', 'Udaipur', 'Shimla', 'Nainital', 'Darjeeling', 'Kashmir',
  ];
  const destResults = await Promise.all(
    TRENDING_DESTINATIONS.map(async (name) => {
      const r = await fetchBlogPosts({ search: name, limit: 5 });
      return { name, posts: r.posts };
    })
  );
  // Pick up to 4 destinations, each mapped to a DISTINCT blog (no repeats)
  const seenSlugs = new Set<string>();
  const trendingDestinations: { name: string; slug: string; title: string; image: string | null }[] = [];
  for (const d of destResults) {
    const post = d.posts.find((p) => p.slug && !seenSlugs.has(p.slug));
    if (!post) continue;
    seenSlugs.add(post.slug);
    trendingDestinations.push({ name: d.name, slug: post.slug, title: post.title, image: post.featuredImage || null });
    if (trendingDestinations.length >= 4) break;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
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
      {/* ===== Editorial Hero ===== */}
      <header className="relative overflow-hidden bg-[#064e3b] text-white">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes blogBubbleRise {
            0%   { transform: translateY(30px) scale(0.7); opacity: 0; }
            15%  { opacity: 0.55; }
            85%  { opacity: 0.35; }
            100% { transform: translateY(-320px) scale(1.15); opacity: 0; }
          }
          .blog-bubble {
            position: absolute;
            bottom: -50px;
            border-radius: 9999px;
            background: radial-gradient(circle at 30% 30%, rgba(110,231,183,0.55), rgba(16,185,129,0.12));
            border: 1px solid rgba(255,255,255,0.12);
            animation: blogBubbleRise linear infinite;
            pointer-events: none;
          }
          @media (prefers-reduced-motion: reduce) { .blog-bubble { animation: none; opacity: 0; } }
        ` }} />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#065f46] via-[#064e3b] to-[#022c22]" />
          <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-[#10b981]/30 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-24 w-[26rem] h-[26rem] bg-[#34d399]/15 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

          {/* Floating bubbles */}
          <span className="blog-bubble" style={{ left: '4%', width: 26, height: 26, animationDuration: '7.8s', animationDelay: '0s' }} />
          <span className="blog-bubble" style={{ left: '10%', width: 14, height: 14, animationDuration: '6.1s', animationDelay: '1.5s' }} />
          <span className="blog-bubble" style={{ left: '16%', width: 36, height: 36, animationDuration: '10.2s', animationDelay: '0.6s' }} />
          <span className="blog-bubble" style={{ left: '23%', width: 18, height: 18, animationDuration: '7.4s', animationDelay: '2.2s' }} />
          <span className="blog-bubble" style={{ left: '30%', width: 28, height: 28, animationDuration: '9.0s', animationDelay: '1s' }} />
          <span className="blog-bubble" style={{ left: '37%', width: 16, height: 16, animationDuration: '6.8s', animationDelay: '3s' }} />
          <span className="blog-bubble" style={{ left: '44%', width: 40, height: 40, animationDuration: '11.2s', animationDelay: '0.3s' }} />
          <span className="blog-bubble" style={{ left: '50%', width: 20, height: 20, animationDuration: '8.4s', animationDelay: '2.6s' }} />
          <span className="blog-bubble" style={{ left: '56%', width: 30, height: 30, animationDuration: '9.6s', animationDelay: '0.9s' }} />
          <span className="blog-bubble" style={{ left: '62%', width: 13, height: 13, animationDuration: '5.7s', animationDelay: '2s' }} />
          <span className="blog-bubble" style={{ left: '68%', width: 34, height: 34, animationDuration: '10.6s', animationDelay: '1.3s' }} />
          <span className="blog-bubble" style={{ left: '74%', width: 18, height: 18, animationDuration: '7.6s', animationDelay: '3.4s' }} />
          <span className="blog-bubble" style={{ left: '80%', width: 24, height: 24, animationDuration: '8.1s', animationDelay: '0.5s' }} />
          <span className="blog-bubble" style={{ left: '86%', width: 40, height: 40, animationDuration: '11.9s', animationDelay: '1.8s' }} />
          <span className="blog-bubble" style={{ left: '92%', width: 15, height: 15, animationDuration: '6.4s', animationDelay: '2.9s' }} />
          <span className="blog-bubble" style={{ left: '97%', width: 22, height: 22, animationDuration: '9.1s', animationDelay: '0.2s' }} />
          <span className="blog-bubble" style={{ left: '8%', width: 20, height: 20, animationDuration: '9.9s', animationDelay: '3.6s' }} />
          <span className="blog-bubble" style={{ left: '14%', width: 30, height: 30, animationDuration: '8.6s', animationDelay: '2.7s' }} />
          <span className="blog-bubble" style={{ left: '21%', width: 12, height: 12, animationDuration: '5.8s', animationDelay: '4s' }} />
          <span className="blog-bubble" style={{ left: '27%', width: 24, height: 24, animationDuration: '10.4s', animationDelay: '1.1s' }} />
          <span className="blog-bubble" style={{ left: '34%', width: 16, height: 16, animationDuration: '7.1s', animationDelay: '3.1s' }} />
          <span className="blog-bubble" style={{ left: '41%', width: 32, height: 32, animationDuration: '11.4s', animationDelay: '0.4s' }} />
          <span className="blog-bubble" style={{ left: '48%', width: 14, height: 14, animationDuration: '6.4s', animationDelay: '2.4s' }} />
          <span className="blog-bubble" style={{ left: '60%', width: 22, height: 22, animationDuration: '9.6s', animationDelay: '3.8s' }} />
          <span className="blog-bubble" style={{ left: '66%', width: 38, height: 38, animationDuration: '12.1s', animationDelay: '1.6s' }} />
          <span className="blog-bubble" style={{ left: '77%', width: 14, height: 14, animationDuration: '6.1s', animationDelay: '4.2s' }} />
          <span className="blog-bubble" style={{ left: '88%', width: 26, height: 26, animationDuration: '10.6s', animationDelay: '2.1s' }} />
          <span className="blog-bubble" style={{ left: '95%', width: 32, height: 32, animationDuration: '12.3s', animationDelay: '1.2s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-6 md:pt-24 md:pb-8 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-[#34d399] mb-3">
            <Globe className="w-4 h-4" /> TransRentals Travel Reflection
          </span>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight max-w-3xl mx-auto mb-2">
            Discover India&apos;s Hidden Roads
          </h1>
          <p className="font-serif text-lg md:text-2xl text-white/70 mb-4">Curated Travel Guides &amp; Expert Tips</p>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-6 leading-relaxed">
            Expert travel guides, road trip itineraries, and car rental insights for exploring the diverse landscapes and cultures of India.
          </p>

          {/* Glass search */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl border border-white/30">
              <BlogSearch placeholder="Search destinations, guides or travel tips..." />
            </div>
            <p className="text-xs text-white/50 mt-3">Search destinations, itineraries, or travel tips</p>
          </div>

          {/* Stats */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-6 sm:gap-8 px-6 sm:px-8 py-3 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10">
            <div className="text-center">
              <div className="font-serif text-2xl font-bold text-[#34d399]">250+</div>
              <div className="text-[11px] uppercase tracking-wider text-white/60 mt-1">Stories</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/15" />
            <div className="text-center">
              <div className="font-serif text-2xl font-bold text-[#34d399]">50+</div>
              <div className="text-[11px] uppercase tracking-wider text-white/60 mt-1">Destinations</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/15" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">New Guides Every Friday</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Weekly Dispatch</div>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Categories Bar */}
      <div className="bg-white border-b border-[#d1fae5]/20">
        <div className="container mx-auto px-4 py-12">
          <CategoriesCarousel categories={categories} />
        </div>
      </div>


      {/* ===== Featured Stories (carousel) ===== */}
      {page === 1 && featuredPosts.length > 0 && (
        <section className="bg-white border-y border-[#d1fae5]/20">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-7xl mx-auto">
              <FeaturedStoriesCarousel posts={featuredPosts} />
            </div>
          </div>
        </section>
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
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#047857]">The Journal</span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#191c1e] mt-1">
                  {searchParams.category
                    ? categories.find((c) => c.slug === searchParams.category)?.name || 'Category'
                    : searchParams.tag
                    ? `#${searchParams.tag}`
                    : 'Handpicked travel tales'}
                </h2>
                <p className="text-[#5a6172] text-sm mt-1">{meta.totalPosts} articles</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post, i) => {
                    const large = i === 0;
                    const dateStr = new Date(post.publishedAt)
                      .toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })
                      .toUpperCase();
                    return (
                      <article key={post.id} className={`group ${large ? 'lg:col-span-2' : ''}`}>
                        <Link href={`/blog/${post.slug}`}>
                          <div className={`relative overflow-hidden rounded-xl mb-5 shadow-md ${large ? 'h-[320px] md:h-[400px]' : 'h-[250px]'}`}>
                            {post.featuredImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={post.featuredImage}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${post.category.color || '#047857'} 0%, ${post.category.color || '#047857'}99 100%)` }}
                              >
                                <span className="text-[100px] opacity-20">{post.category.icon || '📝'}</span>
                              </div>
                            )}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#047857] shadow-sm">
                              {post.category.name}
                            </div>
                          </div>
                          <div className={large ? 'max-w-2xl' : ''}>
                            <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-[#5a6172] mb-3">
                              <span>{dateStr}</span>
                              <span className="w-1 h-1 rounded-full bg-[#d1fae5]" />
                              <span>{post.readTime} MIN READ</span>
                            </div>
                            <h3 className={`font-serif font-bold text-[#191c1e] mb-3 group-hover:text-[#047857] transition-colors line-clamp-2 ${large ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                              {post.title}
                            </h3>
                            <p className="text-[#5a6172] leading-relaxed line-clamp-2">{post.excerpt}</p>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
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

          </div>
        </div>
      </div>

      {/* ===== Trending Destinations + Browse by Service ===== */}
      <section className="bg-white border-t border-[#d1fae5]/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Trending Destinations */}
            <div className="lg:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#047857]">Discover</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#191c1e] mt-2 mb-6">Trending Destinations</h2>
              {trendingDestinations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                  {trendingDestinations.map((d) => (
                    <Link
                      key={d.name}
                      href={`/blog/${d.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[#d1fae5]/40 bg-white hover:border-[#047857] hover:shadow-md transition-all group"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#f2f4f6]">
                        {d.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#047857] to-[#065f46] text-white text-xl">📍</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#047857]">{d.name}</span>
                        <h4 className="text-sm font-bold text-[#191c1e] group-hover:text-[#047857] transition-colors line-clamp-2 leading-snug">{d.title}</h4>
                      </div>
                      <ArrowRight className="ml-auto w-4 h-4 text-[#8e7164] group-hover:text-[#047857] group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#5a6172]">Explore destination guides across India.</p>
              )}
            </div>

            {/* Browse by Service (pills) */}
            {blogServices.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#047857]">Rentals</span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#191c1e] mt-2 mb-6">Browse by Service</h2>
                <div className="flex flex-wrap gap-2">
                  {blogServices.map((svc) => (
                    <Link
                      key={svc.slug}
                      href={`/blog/service/${svc.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#d1fae5] text-sm text-[#191c1e] hover:bg-[#047857] hover:text-white hover:border-[#047857] transition-all"
                    >
                      <span>{serviceIcon(svc.slug)}</span>
                      <span>{serviceLabel(svc.slug)}</span>
                      <span className="opacity-60">({svc.postCount})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Trending Topics (below Trending Destinations) ===== */}
      {tags.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-7xl mx-auto relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#065f46] via-[#064e3b] to-[#022c22] rounded-2xl" />

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#34d399]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
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
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#34d399] to-[#10b981] rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                        {index + 1}
                      </span>
                    )}
                    <span className={index < 3 ? 'text-[#047857]' : 'text-white/80'}>#</span>
                    <span>{tag.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      index < 3
                        ? 'bg-emerald-100 text-[#047857]'
                        : 'bg-white/20 text-white/80'
                    }`}>
                      {tag.postCount}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <div className="bg-[#f7f9fb] border-t border-[#d1fae5]/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ecfdf5] rounded-2xl mb-6">
              <Car className="w-8 h-8 text-[#047857]" />
            </div>

            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#191c1e] mb-4">
              Start Your Journey Today
            </h2>

            <p className="text-[#5a6172] mb-8 max-w-xl mx-auto">
              Find the perfect vehicle for your next Indian adventure. From rugged SUVs for mountain trails
              to comfortable sedans for city exploration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#047857] text-white font-semibold rounded-xl hover:bg-[#065f46] transition-colors"
              >
                Browse Vehicles
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-[#191c1e]/20 text-[#191c1e] font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Get Travel Advice
              </a>
            </div>

            <p className="text-sm text-[#5a6172] mt-8">
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
