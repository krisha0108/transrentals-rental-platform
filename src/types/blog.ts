/**
 * Blog System Type Definitions
 * Complete TypeScript interfaces for TransRentals Blog
 */

export interface BlogSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatar: string;
  email?: string;
  role?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  postCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
  color?: string;
  icon?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  approved: boolean;
  parentId?: string; // For nested comments
  replies?: Comment[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: Author;
  category: Category;
  tags: Tag[];
  publishedAt: string;
  updatedAt?: string;
  views: number;
  readTime: number; // in minutes
  seo: BlogSEO;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  commentsCount?: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  postsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  meta: PaginationMeta;
}

export interface CommentFormData {
  postId: string;
  name: string;
  email: string;
  content: string;
  parentId?: string;
}

export interface BlogFilters {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'oldest';
}

export interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: Category;
  publishedAt: string;
  readTime: number;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
  children?: TableOfContentsItem[];
}
