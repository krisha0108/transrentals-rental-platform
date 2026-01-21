import { BlogPost } from '@/types/blog';
import { BlogPostCard } from './BlogPostCard';

interface BlogGridProps {
  posts: BlogPost[];
  className?: string;
}

export function BlogGrid({ posts, className = '' }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No articles found.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
