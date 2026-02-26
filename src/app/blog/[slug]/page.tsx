import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchBlogPost, fetchRelatedPosts, getBlogPostSlugs } from '@/lib/api/blog';
import { AuthorCard } from '@/components/blog/AuthorCard';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { CommentSection } from '@/components/blog/CommentSection';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { renderBlogContent } from '@/lib/markdown';
import { resolveAssetUrl } from '@/lib/utils';
import { Calendar, Clock, Eye, ArrowLeft, Tag, ChevronRight, Bookmark, Heart } from 'lucide-react';


interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Revalidate blog post pages every 60 seconds (ISR)
export const revalidate = 60;

export async function generateStaticParams() {
  // Generate static pages for top 20 posts
  const slugs = await getBlogPostSlugs(20);
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await fetchBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const featuredImageUrl = resolveAssetUrl(post.featuredImage);

  return {
    title: post.seo.title,
    description: post.seo.description,
    keywords: post.seo.keywords,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.seo.title,
      description: post.seo.description,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      images: [
        {
          url: featuredImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      url: `https://transrentals.com/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.title,
      description: post.seo.description,
      images: [featuredImageUrl],
    },
    alternates: {
      canonical: `https://transrentals.com/blog/${post.slug}`,
    },
  };
}

// Helper function to ensure image path starts with /
function normalizeImagePath(path: string | undefined): string {
  if (!path) return '/images/blog-default.jpg';
  // If it's already an absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Remove 'public' prefix if present (Next.js serves from public as root)
  if (path.startsWith('public/')) path = path.replace('public/', '/');
  if (path.startsWith('/public/')) path = path.replace('/public/', '/');
  // If path already starts with /uploads or /images, return as is
  if (path.startsWith('/uploads/') || path.startsWith('/images/')) return path;
  // If path starts with uploads/ (without leading slash), add it
  if (path.startsWith('uploads/')) return `/${path}`;
  // If it's just a filename (like "image.jpg"), assume it's in uploads
  if (!path.startsWith('/')) return `/uploads/${path}`;
  return path;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await fetchBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  const featuredImageUrl = resolveAssetUrl(post.featuredImage);
  const normalizedFeaturedImage = normalizeImagePath(post.featuredImage);

  const relatedPosts = await fetchRelatedPosts(post.id, 3);
  const categoryColor = post.category.color || '#10B981';
  const categoryIcon = post.category.icon || '📝';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Featured Image Hero */}
        <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden">
          {normalizedFeaturedImage && normalizedFeaturedImage !== '/images/blog-default.jpg' ? (
            <Image
              src={normalizedFeaturedImage}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}cc 50%, ${categoryColor}99 100%)`,
              }}
            >
              <span className="text-[200px] md:text-[300px] opacity-20">
                {categoryIcon}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end">
                <div className="container relative mx-auto px-4 pb-12 md:pb-16">
                  <Link
                    href="/blog"
                    className="absolute -top-8 left-0 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all font-medium text-sm"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Reflections</span>
                  </Link>
                <div className="max-w-4xl space-y-4">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-white/70 mb-6 mt-10">
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                  <ChevronRight size={14} />
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Reflections
                  </Link>
                  <ChevronRight size={14} />
                  <Link
                    href={`/blog/category/${post.category.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {post.category.name}
                  </Link>
                </nav>

                {/* Category Badge */}
                <Link
                  href={`/blog/category/${post.category.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white mb-6 backdrop-blur-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: `${categoryColor}dd` }}
                >
                  <span>{categoryIcon}</span>
                  {post.category.name}
                </Link>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg font-[family-name:var(--font-blog-heading)]">
                  {post.title}
                </h1>

                {/* Excerpt */}
                <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl leading-relaxed">
                  {post.excerpt}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/30">
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{post.author.name}</div>
                      <div className="text-xs text-white/70">{post.author.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={16} />
                      {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={16} />
                      {post.readTime} min read
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye size={16} />
                      {post.views.toLocaleString()} views
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ShareButtons
                      url={`https://transrentals.com/blog/${post.slug}`}
                      title={post.title}
                      description={post.excerpt}
                      showLabel={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Article Content */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-8 md:p-12">
                  <div
                    className="prose prose-lg max-w-none blog-content
                      [font-family:var(--font-blog-body)] text-gray-800
                      prose-headings:[font-family:var(--font-blog-heading)] prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                      prose-h2:text-[1.85rem] prose-h2:leading-snug prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
                      prose-h3:text-[1.45rem] prose-h3:leading-snug prose-h3:mt-9 prose-h3:mb-3
                      prose-p:text-[1.0625rem] prose-p:leading-[1.85] prose-p:text-gray-700 prose-p:my-5
                      prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-ul:my-5 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-1
                      prose-ol:my-5 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-1
                      prose-li:text-gray-700 prose-li:leading-relaxed
                      prose-blockquote:border-l-[3px] prose-blockquote:border-emerald-500 prose-blockquote:pl-6 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:bg-emerald-50/60 prose-blockquote:py-4 prose-blockquote:pr-6 prose-blockquote:rounded-r-xl prose-blockquote:text-gray-600 prose-blockquote:not-italic
                      prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.875em] prose-code:font-medium
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-6 prose-pre:rounded-xl prose-pre:my-6 prose-pre:text-sm
                      prose-img:rounded-xl prose-img:shadow-md prose-img:my-8
                      prose-hr:border-gray-200 prose-hr:my-10"
                    dangerouslySetInnerHTML={{ __html: renderBlogContent(post.content) }}
                  />
                </div>

                {/* Tags Section */}
                <div className="px-8 md:px-12 py-6 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Tag size={20} className="text-gray-500" />
                    <span className="font-semibold text-gray-900">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/blog/tag/${tag.slug}`}
                        className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>

              </div>

              {/* Author Bio */}
              <div className="mt-10 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                  About the Author
                </h3>
                <AuthorCard author={post.author} showBio={true} />
              </div>



              {/* CTA Card - Before Related Posts */}
<div className="my-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
  <h3 className="text-xl font-bold mb-2">Start Your Journey Today!</h3>
  <p className="text-blue-100 text-sm mb-4">
    Get the best rental deals for your next trip with TransRentals
  </p>
  <Link
    href="/services"
    className="inline-block bg-white text-blue-600 font-semibold py-2 px-6 rounded-lg hover:bg-blue-50 transition-colors"
  >
    Book Your Vehicle
  </Link>
</div>

              {/* Related Posts */}
              {/* <RelatedPosts posts={relatedPosts} /> */}

              {/* Comments */}
              {/* <CommentSection postId={post.id} /> */}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <TableOfContents content={post.content} />
            </aside>
          </div>
        </div>
      </article>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: featuredImageUrl,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: {
              '@type': 'Person',
              name: post.author.name,
              url: `https://transrentals.com/blog`,
            },
            publisher: {
              '@type': 'Organization',
              name: 'TransRentals',
              logo: {
                '@type': 'ImageObject',
                url: 'https://transrentals.com/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://transrentals.com/blog/${post.slug}`,
            },
            keywords: post.seo.keywords.join(', '),
            articleSection: post.category.name,
          }),
        }}
      />

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://transrentals.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Reflections',
                item: 'https://transrentals.com/blog',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: post.category.name,
                item: `https://transrentals.com/blog/category/${post.category.slug}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: post.title,
                item: `https://transrentals.com/blog/${post.slug}`,
              },
            ],
          }),
        }}
      />
    </div>
  );
}
