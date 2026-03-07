'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types/blog';
import { Clock, Eye, ArrowRight } from 'lucide-react';

const DEFAULT_ICON = '📝';

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
  variant?: 'default' | 'featured' | 'compact';
}

function CategoryPlaceholder({ color, icon }: { color: string; icon: string }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-xl shadow-inner border border-gray-100">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <span className="text-[5rem] opacity-25">{icon}</span>
      </div>
    </div>
  );
}

function CompactPlaceholder({ color, icon }: { color: string; icon: string }) {
  return (
    <div
      className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-xl opacity-60">
        {icon}
      </div>
    </div>
  );
}

export function BlogPostCard({ post, featured = false, variant = 'default' }: BlogPostCardProps) {
  const categoryColor = post.category.color || '#10B981';
  const categoryIcon = post.category.icon || DEFAULT_ICON;
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (featured || variant === 'featured') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group relative block h-80 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
      >
        {post.featuredImage ? (
          <img src={post.featuredImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <CategoryPlaceholder color={categoryColor} icon={categoryIcon} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white"
            style={{ backgroundColor: categoryColor }}
          >
            <span>{categoryIcon}</span>
            {post.category.name}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-white/70">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime} min
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {post.featuredImage ? (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <CompactPlaceholder color={categoryColor} icon={categoryIcon} />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
            {post.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
    >
      {post.featuredImage ? (
        <div className="relative h-44 overflow-hidden">
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <CategoryPlaceholder color={categoryColor} icon={categoryIcon} />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>{formattedDate}</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {post.views?.toLocaleString() || '0'}
          </span>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">{post.excerpt}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: categoryColor }}
            >
              {post.author.name.charAt(0)}
            </div>
            <span className="text-xs text-gray-600">{post.author.name}</span>
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            Read <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
