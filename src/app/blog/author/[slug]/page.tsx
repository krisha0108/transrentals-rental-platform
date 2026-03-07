import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBlogPosts, fetchAuthor, getAuthorSlugs } from '@/lib/api/blog';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { Pagination } from '@/components/blog/Pagination';
import { User, ArrowLeft, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface AuthorPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

export async function generateStaticParams() {
  const slugs = await getAuthorSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const author = await fetchAuthor(params.slug);

  if (!author) {
    return {
      title: 'Author Not Found',
    };
  }

  return {
    title: `${author.name} - Travel Writer | TransRentals Reflections`,
    description: author.bio,
    openGraph: {
      title: `${author.name} - TransRentals Reflections`,
      description: author.bio,
      type: 'profile',
      images: [{ url: author.avatar }],
    },
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const author = await fetchAuthor(params.slug);

  if (!author) {
    notFound();
  }

  const page = Number(searchParams.page) || 1;
  const { posts, meta } = await fetchBlogPosts({
    page,
    limit: 12,
    author: params.slug,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Author Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="container mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Reflections
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
              <Image
                src={author.avatar}
                alt={author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {author.name}
              </h1>
              {author.role && (
                <p className="text-xl text-white/90 mb-4">{author.role}</p>
              )}
              <p className="text-white/80 mb-4 max-w-2xl">{author.bio}</p>
              {author.socialLinks && (
                <div className="flex gap-3">
                  {author.socialLinks.twitter && (
                    <a
                      href={author.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter size={20} />
                    </a>
                  )}
                  {author.socialLinks.linkedin && (
                    <a
                      href={author.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                  {author.socialLinks.instagram && (
                    <a
                      href={author.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram size={20} />
                    </a>
                  )}
                  {author.socialLinks.facebook && (
                    <a
                      href={author.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook size={20} />
                    </a>
                  )}
                </div>
              )}
              <p className="text-white/70 mt-4">
                {author.postCount} {author.postCount === 1 ? 'post' : 'posts'} published
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Posts by Author */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Posts by {author.name}
        </h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600">
              This author hasn't published any posts yet.
            </p>
          </div>
        ) : (
          <>
            <BlogGrid posts={posts} />
            <Pagination meta={meta} basePath={`/blog/author/${params.slug}`} />
          </>
        )}
      </div>

      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: author.name,
            description: author.bio,
            image: author.avatar,
            jobTitle: author.role,
            url: `https://transrentals.in/blog/author/${author.slug}`,
            sameAs: Object.values(author.socialLinks || {}).filter(Boolean),
          }),
        }}
      />
    </div>
  );
}
