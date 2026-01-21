import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchBlogPosts, fetchTag, getTagSlugs, fetchPopularTags } from '@/lib/api/blog';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { Pagination } from '@/components/blog/Pagination';
import { Tag as TagIcon, ArrowLeft, Hash, ArrowRight, Flame, BookOpen } from 'lucide-react';

interface TagPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

// Revalidate tag pages every 60 seconds (ISR)
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getTagSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const tag = await fetchTag(params.slug);

  if (!tag) {
    return {
      title: 'Tag Not Found',
    };
  }

  return {
    title: `#${tag.name} - Travel Reflections | TransRentals`,
    description: `Browse all blog posts tagged with #${tag.name}. Discover travel guides, tips, and itineraries related to ${tag.name}.`,
    openGraph: {
      title: `#${tag.name} - TransRentals Reflections`,
      description: `Posts tagged with #${tag.name}`,
      type: 'website',
    },
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const [tag, popularTags] = await Promise.all([
    fetchTag(params.slug),
    fetchPopularTags(10),
  ]);

  if (!tag) {
    notFound();
  }

  const page = Number(searchParams.page) || 1;
  const { posts, meta } = await fetchBlogPosts({
    page,
    limit: 12,
    tag: params.slug,
  });

  // Related tags (excluding current)
  const relatedTags = popularTags
    .filter((t) => t.slug !== params.slug)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header with Wave */}
      <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl" />
          {/* Large Hash Background */}
          <div className="absolute top-1/2 right-10 -translate-y-1/2 text-[200px] text-white/5 font-bold select-none hidden lg:block">
            #
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

            {/* Tag Header */}
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Hash className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">#{tag.name}</h1>
                <p className="text-white/70 text-sm mt-1">Explore articles tagged with this topic</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg">
                <BookOpen className="w-4 h-4 text-white/80" />
                <span className="text-white font-medium">{tag.postCount}</span>
                <span className="text-white/70 text-sm">Articles</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="text-white/70 text-sm">Hot topic this month</span>
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
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-purple-100 flex items-center justify-center">
                    <TagIcon className="w-8 h-8 text-purple-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">No articles yet</h2>
                  <p className="text-gray-500 text-sm mb-6">Try exploring other tags.</p>
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
                      <Pagination meta={meta} basePath={`/blog/tag/${params.slug}`} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-20 space-y-5">
                {/* Related Tags */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Related Tags</h3>
                  </div>
                  <div className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {relatedTags.map((t) => (
                        <Link
                          key={t.id}
                          href={`/blog/tag/${t.slug}`}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full text-sm transition-colors"
                        >
                          #{t.name}
                        </Link>
                      ))}
                    </div>
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
