import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types/blog';
import { Calendar, Clock } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/utils';

interface RelatedPostsProps {
  posts: BlogPost[];
}

 export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => {
          const imageUrl = resolveAssetUrl(post.featuredImage);

          return (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/blog/${post.slug}`} className="block relative h-48">
                <Image
                  src={imageUrl}
                  alt={post.title}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </Link>
              <div className="p-4">
                <Link
                  href={`/blog/category/${post.category.slug}`}
                  className="inline-block px-2 py-1 text-xs font-semibold text-white rounded mb-2"
                  style={{ backgroundColor: post.category.color }}
                >
                  {post.category.name}
                </Link>
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {post.readTime} min
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
