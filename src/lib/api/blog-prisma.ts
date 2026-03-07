/**
 * Blog API - Prisma Database Implementation
 * Fetches blog data from the local Prisma database (admin-created content)
 * SERVER ONLY — never import this in 'use client' components directly.
 * Client components must use fetch('/api/blog/...') instead.
 */

import { prisma } from '@/lib/db/prisma';
import {
  BlogPost,
  BlogPostsResponse,
  BlogFilters,
  Category,
  Tag,
  PaginationMeta,
} from '@/types/blog';

// Helper function to normalize image paths
function normalizeImagePath(path: string | undefined | null): string {
  if (!path) return '/images/blog-default.jpg';
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

// Category colors and icons mapping
const CATEGORY_METADATA: Record<string, { color: string; icon: string }> = {
  'road-trip-guides': { color: '#3B82F6', icon: '🚗' },
  'travel-tips': { color: '#10B981', icon: '💡' },
  'destination-guides': { color: '#F59E0B', icon: '📍' },
  'car-rental-tips': { color: '#8B5CF6', icon: '🔑' },
  'bike-adventures': { color: '#EF4444', icon: '🏍️' },
  'corporate-travel': { color: '#06B6D4', icon: '💼' },
  'wedding-events': { color: '#EC4899', icon: '💒' },
  'budget-travel': { color: '#84CC16', icon: '💰' },
};

/**
 * Convert Prisma blog post to BlogPost type
 */
function convertPrismaBlogPost(post: any): BlogPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.content,
    featuredImage: normalizeImagePath(post.featuredImage),
    category: post.blog_categories
      ? {
        id: post.blog_categories.id,
        name: post.blog_categories.name,
        slug: post.blog_categories.slug,
        description: post.blog_categories.description || '',
        postCount: 0, // Can be computed separately if needed
        color: CATEGORY_METADATA[post.blog_categories.slug]?.color || '#3B82F6',
        icon: CATEGORY_METADATA[post.blog_categories.slug]?.icon || '📝',
      }
      : {
        id: 'uncategorized',
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: '',
        postCount: 0,
        color: '#6B7280',
        icon: '📝',
      },
    tags: (() => {
      let rawTags: string[] = [];
      if (post.tags) {
        if (Array.isArray(post.tags)) {
          rawTags = post.tags as string[];
        } else if (typeof post.tags === 'string') {
          try { rawTags = JSON.parse(post.tags); } catch { rawTags = []; }
        }
      }
      return rawTags.map((tag: string) => ({
        id: tag,
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, '-'),
        postCount: 0,
      }));
    })(),
    author: {
      id: post.admin_users.id,
      name: post.admin_users.name,
      slug: post.admin_users.email.split('@')[0],
      email: post.admin_users.email,
      role: 'Content Expert at TransRentals',
      bio: `${post.admin_users.name} is a travel and vehicle rental expert at TransRentals, India's leading vehicle rental marketplace. With hands-on expertise in road trips, destination planning, and rental services across India, ${post.admin_users.name} creates practical and insightful guides to help travelers explore India's diverse landscapes with confidence — from Himalayan bike adventures to coastal road trips.`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(post.admin_users.name)}&background=3B82F6&color=fff&size=200&bold=true`,
      socialLinks: {},
      postCount: 0,
    },
    publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    views: post.viewCount,
    readTime: post.readTime || Math.ceil(post.content.split(' ').length / 200),
    featured: false, // Can be added to schema if needed
    seo: post.seo_meta
      ? {
        title: post.seo_meta.metaTitle || post.title,
        description: post.seo_meta.metaDescription || post.excerpt || '',
        keywords: post.seo_meta.metaKeywords?.split(',').map((k: string) => k.trim()) || [],
        ogImage: post.seo_meta.ogImage || post.featuredImage || '',
      }
      : {
        title: post.title,
        description: post.excerpt || '',
        keywords: [],
        ogImage: post.featuredImage || '',
      },
  };
}

/**
 * Fetch blog posts with filters and pagination
 */
export async function fetchBlogPostsPrisma(
  filters: BlogFilters = {}
): Promise<BlogPostsResponse> {
  // Skip database calls during CI build
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return {
      posts: [],
      meta: {
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: filters.limit || 12,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  try {
    const {
      page = 1,
      limit = 12,
      category,
      tag,
      search,
      sortBy = 'latest',
      serviceSlug,
    } = filters;

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
    };

    // Filter by serviceSlug (undefined = all, null = general only, string = service-specific)
    if (serviceSlug !== undefined) {
      where.serviceSlug = serviceSlug;
    }

    // Use AND array to combine multiple conditions
    const andConditions: any[] = [];

    if (category) {
      andConditions.push({
        blog_categories: {
          slug: category,
        },
      });
    }

    // Note: Tag filtering is handled at the application level after fetching
    // because MySQL JSON array_contains doesn't easily support slug-to-name mapping
    // See the filterByTag variable below

    if (search) {
      // Note: MySQL with utf8mb4_unicode_ci collation is case-insensitive by default
      andConditions.push({
        OR: [
          { title: { contains: search } },
          { excerpt: { contains: search } },
          { content: { contains: search } },
        ],
      });
    }

    // Apply AND conditions if any
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Build orderBy
    let orderBy: any = { publishedAt: 'desc' }; // latest

    if (sortBy === 'popular') {
      orderBy = { viewCount: 'desc' };
    } else if (sortBy === 'oldest') {
      orderBy = { publishedAt: 'asc' };
    }

    // If filtering by tag, we need to fetch all posts and filter at application level
    // because MySQL JSON array_contains doesn't easily support slug-to-name mapping
    if (tag) {
      // Fetch all posts (no pagination at DB level when filtering by tag)
      const allPosts = await prisma.blog_posts.findMany({
        where,
        orderBy,
        include: {
          blog_categories: true,
          admin_users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seo_meta: true,
        },
      });

      // Convert slug to possible tag name formats
      const tagSlug = tag.toLowerCase();
      const tagName = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const tagNameTitleCase = tag.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      // Filter posts that contain the tag (matching by slug or name)
      const filteredPosts = allPosts.filter((post) => {
        let rawTags: string[] = [];
        if (post.tags) {
          if (Array.isArray(post.tags)) rawTags = post.tags as string[];
          else if (typeof post.tags === 'string') {
            try { rawTags = JSON.parse(post.tags); } catch { rawTags = []; }
          }
        }
        if (!rawTags.length) return false;
        return rawTags.some((t) => {
          const tLower = t.toLowerCase();
          const tSlug = t.toLowerCase().replace(/\s+/g, '-');
          return tLower === tagSlug ||
            tSlug === tagSlug ||
            t === tagName ||
            t === tagNameTitleCase;
        });
      });

      // Apply pagination at application level
      const totalPosts = filteredPosts.length;
      const totalPages = Math.ceil(totalPosts / limit);
      const start = (page - 1) * limit;
      const paginatedPosts = filteredPosts.slice(start, start + limit);

      const meta: PaginationMeta = {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return {
        posts: paginatedPosts.map(convertPrismaBlogPost),
        meta,
      };
    }

    // For non-tag filtering, use normal DB pagination
    const totalPosts = await prisma.blog_posts.count({ where });

    // Fetch posts with pagination
    const posts = await prisma.blog_posts.findMany({
      where,
      orderBy,
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
      include: {
        blog_categories: true,
        admin_users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seo_meta: true,
      },
    });

    const totalPages = Math.ceil(totalPosts / limit);

    const meta: PaginationMeta = {
      currentPage: page,
      totalPages,
      totalPosts,
      postsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      posts: posts.map(convertPrismaBlogPost),
      meta,
    };
  } catch (error) {
    console.error('Error fetching blog posts from Prisma:', error);
    return {
      posts: [],
      meta: {
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: filters.limit || 12,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

/**
 * Fetch single blog post by slug
 */
export async function fetchBlogPostPrisma(slug: string): Promise<BlogPost | null> {
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return null;
  }

  try {
    const post = await prisma.blog_posts.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        blog_categories: true,
        admin_users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seo_meta: true,
      },
    });

    if (!post) {
      return null;
    }

    // Increment view count (non-critical — fire-and-forget, ignore readonly DB errors)
    prisma.blog_posts.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return convertPrismaBlogPost(post);
  } catch (error) {
    console.error('Error fetching blog post from Prisma:', error);
    return null;
  }
}

/**
 * Fetch all categories with PUBLISHED post counts only
 */
export async function fetchCategoriesPrisma(): Promise<Category[]> {
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return [];
  }

  try {
    const categories = await prisma.blog_categories.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            blog_posts: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });

    return categories.map((cat: typeof categories[number]) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      postCount: cat._count.blog_posts,
      color: CATEGORY_METADATA[cat.slug]?.color || '#3B82F6',
      icon: CATEGORY_METADATA[cat.slug]?.icon || '📝',
    }));
  } catch (error) {
    console.error('Error fetching categories from Prisma:', error);
    return [];
  }
}

/**
 * Fetch popular tags
 */
export async function fetchPopularTagsPrisma(limit: number = 15): Promise<Tag[]> {
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return [];
  }

  try {
    // Get all posts with tags
    const posts = await prisma.blog_posts.findMany({
      where: { status: 'PUBLISHED' },
      select: { tags: true },
    });

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    posts.forEach((post: (typeof posts)[number]) => {
      let tags: string[] = [];
      if (post.tags) {
        if (Array.isArray(post.tags)) {
          tags = post.tags as string[];
        } else if (typeof post.tags === 'string') {
          try { tags = JSON.parse(post.tags); } catch { tags = []; }
        }
      }
      tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Convert to Tag array and sort by count
    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        postCount: count,
      }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, limit);

    return tags;
  } catch (error) {
    console.error('Error fetching tags from Prisma:', error);
    return [];
  }
}

/**
 * Fetch featured posts
 */
export async function fetchFeaturedPostsPrisma(limit: number = 3): Promise<BlogPost[]> {
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return [];
  }

  try {
    const posts = await prisma.blog_posts.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { viewCount: 'desc' }, // Most viewed = featured
      take: limit,
      include: {
        blog_categories: true,
        admin_users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seo_meta: true,
      },
    });

    return posts.map(convertPrismaBlogPost);
  } catch (error) {
    console.error('Error fetching featured posts from Prisma:', error);
    return [];
  }
}

/**
 * Search blog posts by query
 * Note: MySQL with utf8mb4_unicode_ci collation is case-insensitive by default
 */
export async function searchBlogPostsPrisma(query: string, limit: number = 10): Promise<BlogPost[]> {
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return [];
  }

  try {
    // Search in title, content, and excerpt
    const posts = await prisma.blog_posts.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { excerpt: { contains: query } },
          // Also search in category name if it exists
          { blog_categories: { name: { contains: query } } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        blog_categories: true,
        admin_users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seo_meta: true,
      },
    });

    return posts.map(convertPrismaBlogPost);
  } catch (error) {
    console.error('Error searching blog posts from Prisma:', error);
    return [];
  }
}

/**
 * Fetch distinct service slugs that have published blog posts
 */
export async function fetchBlogServicesPrisma(): Promise<{ slug: string; postCount: number }[]> {
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return [];
  }

  try {
    // Fetch all published posts that have a serviceSlug, then count in JS
    // (avoids Prisma groupBy issues with nullable columns in MySQL)
    const posts = await prisma.blog_posts.findMany({
      where: {
        status: 'PUBLISHED',
        serviceSlug: { not: null },
      },
      select: { serviceSlug: true },
    });

    const counts: Record<string, number> = {};
    for (const p of posts) {
      if (p.serviceSlug) {
        counts[p.serviceSlug] = (counts[p.serviceSlug] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([slug, postCount]) => ({ slug, postCount }))
      .sort((a, b) => b.postCount - a.postCount);
  } catch (error) {
    console.error('Error fetching blog services from Prisma:', error);
    return [];
  }
}
