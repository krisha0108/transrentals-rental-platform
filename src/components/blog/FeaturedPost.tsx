import { BlogPost } from '@/types/blog';
import { BlogPostCard } from './BlogPostCard';

interface FeaturedPostProps {
  post: BlogPost;
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  return <BlogPostCard post={post} featured={true} />;
}
