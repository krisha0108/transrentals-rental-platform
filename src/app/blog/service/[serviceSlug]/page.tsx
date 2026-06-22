import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchBlogPostsPrisma, fetchCategoriesPrisma } from '@/lib/api/blog-prisma';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { Pagination } from '@/components/blog/Pagination';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';

export const revalidate = 60;

interface ServiceBlogPageProps {
  params: { serviceSlug: string };
  searchParams: { page?: string; category?: string };
}

async function getService(slug: string) {
  try {
    return await prisma.services.findFirst({
      where: { slug },
      select: { name: true, slug: true },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ServiceBlogPageProps): Promise<Metadata> {
  const service = await getService(params.serviceSlug);
  if (!service) return { title: 'Blog Not Found' };

  const name = service.name;
  return {
    title: `${name} Blog — Tips, Guides & Stories | TransRentals`,
    description: `Expert guides, tips, and travel stories for ${name}. Get the most out of your ${name} experience with TransRentals.`,
    openGraph: {
      title: `${name} Blog | TransRentals`,
      description: `Expert guides and tips for ${name}.`,
      type: 'website',
    },
    alternates: {
      canonical: `https://transrentals.in/blog/service/${params.serviceSlug.toLowerCase()}`,
    },
  };
}

export default async function ServiceBlogPage({ params, searchParams }: ServiceBlogPageProps) {
  const service = await getService(params.serviceSlug);
  if (!service) notFound();

  const page = Number(searchParams.page) || 1;
  const limit = 12;

  const [postsResponse, categories] = await Promise.all([
    fetchBlogPostsPrisma({
      page,
      limit,
      serviceSlug: params.serviceSlug,
      category: searchParams.category,
      sortBy: 'latest',
    }),
    fetchCategoriesPrisma(),
  ]);

  const { posts, meta } = postsResponse;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Blog Posts
          </Link>
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-200" />
              <span className="text-blue-200 text-sm font-medium uppercase tracking-wide">
                {service.name} Blog
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {service.name} — Guides, Tips & Stories
            </h1>
            <p className="text-blue-100 text-lg">
              Expert guides, travel tips, and real stories for{' '}
              <span className="font-semibold text-white">{service.name}</span>. Everything you need for an amazing experience.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href={`/blog/service/${params.serviceSlug.toLowerCase()}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !searchParams.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog/service/${params.serviceSlug.toLowerCase()}?category=${cat.slug}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchParams.category === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Post count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {meta.totalPosts} {meta.totalPosts === 1 ? 'article' : 'articles'} for {service.name}
          </p>
        </div>

        {posts.length > 0 ? (
          <>
            <BlogGrid posts={posts} />
            {meta.totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-gray-200">
                <Pagination meta={meta} basePath={`/blog/service/${params.serviceSlug.toLowerCase()}`} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
            <p className="text-gray-500 mb-6">
              Check back soon — we're working on {service.name} guides.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Browse All Articles
            </Link>
          </div>
        )}
      </div>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${service.name} Blog | TransRentals`,
            description: `Expert guides and tips for ${service.name}`,
            url: `https://transrentals.in/blog/service/${params.serviceSlug.toLowerCase()}`,
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://transrentals.in/blog' },
                { '@type': 'ListItem', position: 3, name: `${service.name} Blog`, item: `https://transrentals.in/blog/service/${params.serviceSlug.toLowerCase()}` },
              ],
            },
          }),
        }}
      />
    </div>
  );
}
