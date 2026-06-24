import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchBlogPost, fetchRelatedPosts, getBlogPostSlugs } from '@/lib/api/blog';
import { AuthorCard } from '@/components/blog/AuthorCard';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { CommentSection } from '@/components/blog/CommentSection';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ReadingProgressBar, ReadingProgressMeter } from '@/components/blog/ReadingProgress';
import { renderBlogContent } from '@/lib/markdown';
import { resolveAssetUrl } from '@/lib/utils';
import { Calendar, Clock, Eye, Tag, ChevronRight, ArrowRight, Car } from 'lucide-react';
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/schemas';
import { SERVICES } from '@/lib/constants/services';

const FEATURED_SERVICE_SLUGS = [
  'one-way-cab', 'airport-transfer', 'car-rental',
  'bike-on-rent', 'tempo-traveller', 'bus-rental',
];
const FEATURED_SERVICES = SERVICES.filter(s => FEATURED_SERVICE_SLUGS.includes(s.slug));


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
      url: `https://transrentals.in/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.title,
      description: post.seo.description,
      images: [featuredImageUrl],
    },
    alternates: {
      canonical: `https://transrentals.in/blog/${post.slug}`,
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
  // Fix slugs accidentally saved with "blog" prefix (e.g. "blogcomplete-..." → "complete-...")
  if (/^blog[a-z]/.test(params.slug)) {
    permanentRedirect(`/blog/${params.slug.replace(/^blog/, '')}`);
  }

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
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      {/* Reading progress bar (UI only) */}
      <ReadingProgressBar />

      {/* Structured Data */}
      <ArticleSchema
        title={post.seo.title || post.title}
        description={post.seo.description || post.excerpt || ''}
        url={`https://transrentals.in/blog/${post.slug}`}
        image={featuredImageUrl || 'https://transrentals.in/images/og-image.jpg'}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        authorName={post.author.name}
        keywords={Array.isArray(post.seo.keywords) ? post.seo.keywords : []}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://transrentals.in' },
        { name: 'Reflections', url: 'https://transrentals.in/blog' },
        { name: post.category.name, url: `https://transrentals.in/blog/category/${post.category.slug}` },
        { name: post.title, url: `https://transrentals.in/blog/${post.slug}` },
      ]} />
      {/* ===== HERO (full-bleed image + overlay) ===== */}
      <section className="relative w-full h-[55vh] min-h-[420px] md:h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
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
              <span className="text-[160px] md:text-[260px] opacity-20">{categoryIcon}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-10 md:pb-16 text-white">
          {/* Category pill */}
          <Link
            href={`/blog/category/${post.category.slug}`}
            className="inline-flex items-center gap-2 bg-[#10b981] text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5 transition-transform hover:scale-105"
          >
            <span>{categoryIcon}</span>
            {post.category.name}
          </Link>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight max-w-4xl mb-5 drop-shadow-lg font-[family-name:var(--font-blog-heading)]">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm">{post.author.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1"><Clock size={12} />{post.readTime} min read</span>
                  <span className="flex items-center gap-1"><Eye size={12} />{post.views.toLocaleString()} views</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShareButtons
                url={`https://transrentals.in/blog/${post.slug}`}
                title={post.title}
                description={post.excerpt}
                showLabel={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== MAIN: sticky sidebar + article ===== */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 py-12 md:py-16">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 space-y-8">
            <ReadingProgressMeter />
            <TableOfContents content={post.content} />

            {/* Glass CTA card */}
            <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-6">
              <h4 className="text-xl font-bold mb-2 text-[#191c1e]">Need a vehicle?</h4>
              <p className="text-sm text-[#545f73] mb-5">
                Book from our curated fleet across 150+ cities in India.
              </p>
              <Link
                href="/services"
                className="block text-center w-full bg-[#10b981] text-white font-bold py-3 rounded-xl hover:bg-[#059669] transition-colors"
              >
                Browse Services
              </Link>
            </div>
          </div>
        </aside>

        {/* Article */}
        <article className="lg:col-span-9 max-w-[850px] min-w-0">
          {/* ===== Article content box ===== */}
          <div className="relative bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(16,185,129,0.12)] border border-[#d1fae5]/60 ring-1 ring-black/[0.03] overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#10b981]" />
            {/* Content — render UNCHANGED */}
            <div className="p-6 sm:p-8 md:p-10 lg:p-12">
              <div
                className="prose prose-lg max-w-none blog-content
                  [font-family:var(--font-blog-body)] text-[#545f73]
                  prose-headings:[font-family:var(--font-blog-heading)] prose-headings:font-bold prose-headings:text-[#191c1e] prose-headings:tracking-tight
                  prose-h2:text-3xl prose-h2:leading-snug prose-h2:mt-12 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-[#d1fae5]
                  prose-h3:text-2xl prose-h3:leading-snug prose-h3:mt-9 prose-h3:mb-3 prose-h3:text-[#065f46]
                  prose-p:text-[1.125rem] prose-p:leading-[1.8] prose-p:text-[#545f73] prose-p:my-6
                  prose-a:text-[#047857] prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
                  prose-strong:text-[#191c1e] prose-strong:font-semibold
                  prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                  prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                  prose-li:text-[#545f73] prose-li:text-[1.125rem] prose-li:leading-relaxed
                  prose-blockquote:border-l-4 prose-blockquote:border-[#10b981] prose-blockquote:bg-[#ecfdf5] prose-blockquote:rounded-r-2xl prose-blockquote:pl-6 prose-blockquote:pr-6 prose-blockquote:my-8 prose-blockquote:py-5 prose-blockquote:text-xl prose-blockquote:text-[#065f46] prose-blockquote:font-medium prose-blockquote:not-italic
                  prose-code:text-[#047857] prose-code:bg-[#10b981]/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.875em] prose-code:font-medium
                  prose-pre:bg-[#2d3133] prose-pre:text-gray-100 prose-pre:p-6 prose-pre:rounded-2xl prose-pre:my-8 prose-pre:text-sm
                  prose-img:rounded-2xl prose-img:shadow-md prose-img:my-8
                  prose-hr:border-[#d1fae5]/40 prose-hr:my-10"
                dangerouslySetInnerHTML={{ __html: renderBlogContent(post.content) }}
              />
            </div>

            {/* Tags footer (inside box) */}
            {post.tags.length > 0 && (
              <div className="px-6 sm:px-8 md:px-10 py-6 bg-[#f7f9fb] border-t border-[#d1fae5]/40">
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={18} className="text-[#545f73]" />
                  <span className="font-semibold text-[#191c1e] text-sm">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog/tag/${tag.slug}`}
                      className="px-4 py-2 bg-white text-[#545f73] rounded-full text-sm font-medium border border-[#d1fae5]/60 hover:border-[#10b981] hover:text-[#047857] transition-all"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inline CTA */}
          <div className="relative overflow-hidden mt-10 rounded-3xl bg-gradient-to-br from-[#10b981] to-[#047857] p-8 md:p-10 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.45)] flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            {/* Decorative blobs */}
            <div className="absolute -right-10 -top-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-12 -bottom-20 w-52 h-52 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center shrink-0 ring-1 ring-white/20">
                <Car size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">Ready to book your ride?</h3>
                <p className="text-white/85">Compare and book vehicles across 150+ cities in minutes.</p>
              </div>
            </div>

            <Link
              href="/services"
              className="relative z-10 inline-flex items-center gap-2 bg-white text-[#047857] px-7 py-4 rounded-xl font-bold shadow-lg hover:gap-3 hover:shadow-xl transition-all shrink-0"
            >
              Explore Vehicles <ArrowRight size={18} />
            </Link>
          </div>

          {/* Author Card */}
          <section className="mt-12 border-t border-[#d1fae5]/40 pt-10">
            <AuthorCard author={post.author} showBio={true} />
          </section>

          {/* Explore Our Services */}
          <div className="mt-10 bg-white rounded-2xl shadow-sm border border-[#d1fae5]/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-[#d1fae5]/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Explore Our Services</h3>
                <p className="text-sm text-[#545f73] mt-0.5">Book your vehicle for any occasion across India</p>
              </div>
              <Link
                href="/services"
                className="text-sm font-medium text-[#047857] hover:text-[#10b981] flex items-center gap-1 shrink-0"
              >
                View all
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#d1fae5]/20">
              {FEATURED_SERVICES.map((service) => (
                <Link
                  key={service.slug}
                  href={service.base_url}
                  className="group bg-white p-4 hover:bg-[#ecfdf5] transition-colors"
                >
                  <div className="text-2xl mb-2">{service.icon}</div>
                  <div className="font-semibold text-sm text-[#191c1e] group-hover:text-[#047857] transition-colors leading-tight">
                    {service.name}
                  </div>
                  <div className="text-xs text-[#545f73] mt-0.5 line-clamp-1">{service.description}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Comments */}
          {/* <CommentSection postId={post.id} /> */}
        </article>
      </main>

      {/* ===== CONTINUE EXPLORING (Related Posts) ===== */}
      {relatedPosts.length > 0 && (
        <section className="bg-white py-16 md:py-24 border-t border-[#d1fae5]/30">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold mb-10 text-[#191c1e]">Continue Exploring</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-[#d1fae5]/20 shadow-sm hover:shadow-[0_10px_30px_-5px_rgba(30,41,59,0.15)] hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={resolveAssetUrl(rp.featuredImage)}
                      alt={rp.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#047857] mb-2 block">
                      {rp.category.name}
                    </span>
                    <h4 className="text-xl font-bold mb-2 line-clamp-2 text-[#191c1e] group-hover:text-[#047857] transition-colors">
                      {rp.title}
                    </h4>
                    <p className="text-sm text-[#545f73] mb-4 line-clamp-2">{rp.excerpt}</p>
                    <span className="inline-flex items-center gap-2 text-[#10b981] font-bold group-hover:gap-3 transition-all">
                      Read More <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
              url: `https://transrentals.in/blog`,
            },
            publisher: {
              '@type': 'Organization',
              name: 'TransRentals',
              logo: {
                '@type': 'ImageObject',
                url: 'https://transrentals.in/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://transrentals.in/blog/${post.slug}`,
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
                item: 'https://transrentals.in',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Reflections',
                item: 'https://transrentals.in/blog',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: post.category.name,
                item: `https://transrentals.in/blog/category/${post.category.slug}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: post.title,
                item: `https://transrentals.in/blog/${post.slug}`,
              },
            ],
          }),
        }}
      />
    </div>
  );
}
