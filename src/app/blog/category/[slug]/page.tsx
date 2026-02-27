import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchBlogPosts, fetchCategory, getCategorySlugs, fetchCategories } from '@/lib/api/blog';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { Pagination } from '@/components/blog/Pagination';
import { FolderOpen, ArrowLeft, ArrowRight, BookOpen, TrendingUp } from 'lucide-react';

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await fetchCategory(params.slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} - Travel Reflections | TransRentals`,
    description: category.description,
    openGraph: {
      title: `${category.name} - TransRentals Reflections`,
      description: category.description,
      type: 'website',
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [category, allCategories] = await Promise.all([
    fetchCategory(params.slug),
    fetchCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const page = Number(searchParams.page) || 1;
  const { posts, meta } = await fetchBlogPosts({
    page,
    limit: 12,
    category: params.slug,
  });

  // Get related categories (excluding current)
  const relatedCategories = allCategories
    .filter((c) => c.slug !== params.slug)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header with Wave */}
      <div className="relative overflow-hidden" style={{ backgroundColor: category.color }}>
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
          {/* Large Icon Background */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 text-[200px] opacity-10 select-none hidden lg:block">
            {category.icon}
          </div>
        </div>

        <div className="relative container mx-auto px-4 pt-14 pb-24 md:pt-16 md:pb-28">
          <div className="max-w-7xl mx-auto">
            {/* Back Link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reflections
            </Link>

            {/* Category Header */}
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
                {category.icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{category.name}</h1>
                {category.description && (
                  <p className="text-white/70 text-sm mt-1 max-w-md">{category.description}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg">
                <BookOpen className="w-4 h-4 text-white/80" />
                <span className="text-white font-medium">{category.postCount}</span>
                <span className="text-white/70 text-sm">Articles</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg">
                <TrendingUp className="w-4 h-4 text-white/80" />
                <span className="text-white/70 text-sm">Trending this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 70L48 64C96 58 192 46 288 40C384 34 480 34 576 37C672 40 768 46 864 49C960 52 1056 52 1152 49C1248 46 1344 40 1392 37L1440 34V70H1392C1344 70 1248 70 1152 70C1056 70 960 70 864 70C768 70 672 70 576 70C480 70 384 70 288 70C192 70 96 70 48 70H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {posts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <FolderOpen className="w-8 h-8" style={{ color: category.color }} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">No articles yet</h2>
                  <p className="text-gray-500 text-sm mb-6">Check back soon for new content.</p>
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Browse All Articles
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <BlogGrid posts={posts} />

                  {meta.totalPages > 1 && (
                    <div className="mt-10 pt-6 border-t border-gray-200">
                      <Pagination meta={meta} basePath={`/blog/category/${params.slug}`} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-20 space-y-5">
                {/* Other Categories */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Other Categories</h3>
                  </div>
                  <div className="p-2">
                    {relatedCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/blog/category/${cat.slug}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                          style={{ backgroundColor: `${cat.color}15` }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                            {cat.name}
                          </p>
                          <p className="text-xs text-gray-400">{cat.postCount} articles</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Back to All */}
                <Link
                  href="/blog"
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-700">View All Articles</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
