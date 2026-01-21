/**
 * Blog API Integration Layer
 * Currently uses mock data but structured for easy Laravel API swap
 *
 * To switch to Laravel API:
 * 1. Update API_BASE_URL to your Laravel backend URL
 * 2. Uncomment the fetch() calls
 * 3. Comment out the mock data returns
 * 4. Ensure Laravel API returns data in the same format
 */

import {
  BlogPost,
  BlogPostsResponse,
  BlogFilters,
  Category,
  Tag,
  Author,
  Comment,
  CommentFormData,
  PaginationMeta,
} from '@/types/blog';

import {
  blogPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getPostsByAuthor,
  getRelatedPosts,
  searchPosts,
  getLatestPosts,
  getPopularPosts,
  getFeaturedPosts,
  blogTags,
  getTagBySlug,
  popularTags,
} from '@/data/blog-posts';

import {
  blogCategories,
  getCategoryBySlug,
  getCategoryById,
  popularCategories,
} from '@/data/blog-categories';

import {
  blogAuthors,
  getAuthorBySlug,
  getAuthorById,
} from '@/data/blog-authors';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Use relative path as fallback

// Data source options: 'mock' | 'laravel' | 'prisma'
const BLOG_DATA_SOURCE = process.env.NEXT_PUBLIC_BLOG_DATA_SOURCE || 'mock';
const USE_MOCK_DATA = BLOG_DATA_SOURCE === 'mock';
const USE_PRISMA = BLOG_DATA_SOURCE === 'prisma';

// Import Prisma functions
import {
  fetchBlogPostsPrisma,
  fetchBlogPostPrisma,
  fetchCategoriesPrisma,
  fetchPopularTagsPrisma,
  fetchFeaturedPostsPrisma,
  searchBlogPostsPrisma,
} from './blog-prisma';

/**
 * Fetch blog posts with filters and pagination
 * Combines mock data (static blogs) and database data (CMS blogs)
 */
export async function fetchBlogPosts(
  filters: BlogFilters = {}
): Promise<BlogPostsResponse> {
  const {
    page = 1,
    limit = 12,
    category,
    tag,
    author,
    search,
    sortBy = 'latest',
  } = filters;

  // Get mock data posts
  let mockFilteredPosts = [...blogPosts];

  // Apply filters to mock data
  if (category) {
    mockFilteredPosts = getPostsByCategory(category);
  }
  if (tag) {
    mockFilteredPosts = getPostsByTag(tag);
  }
  if (author) {
    mockFilteredPosts = getPostsByAuthor(author);
  }
  if (search) {
    mockFilteredPosts = searchPosts(search);
  }

  // Try to get database posts as well
  // Fetch ALL matching posts from database (no limit) to ensure we combine everything
  let dbPosts: BlogPost[] = [];
  try {
    const dbResponse = await fetchBlogPostsPrisma({
      ...filters,
      page: 1,
      limit: 1000, // Get all posts for proper combination (pagination happens after combining)
    });
    dbPosts = dbResponse.posts;
  } catch (error) {
    console.error('Error fetching from database:', error);
  }

  // Combine database and mock posts (database takes priority for duplicates)
  // This ensures edited posts from the CMS are shown instead of stale mock data
  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const uniqueMockPosts = mockFilteredPosts.filter((p) => !dbSlugs.has(p.slug));
  let allPosts = [...dbPosts, ...uniqueMockPosts];

  // Apply sorting
  switch (sortBy) {
    case 'popular':
      allPosts.sort((a, b) => b.views - a.views);
      break;
    case 'oldest':
      allPosts.sort(
        (a, b) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
      break;
    case 'latest':
    default:
      allPosts.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  }

  // Pagination
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedPosts = allPosts.slice(start, end);

  const meta: PaginationMeta = {
    currentPage: page,
    totalPages,
    totalPosts,
    postsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return {
    posts: paginatedPosts,
    meta,
  };
}

/**
 * Fetch single blog post by slug
 * Prioritizes database (CMS) posts over mock data to ensure edits are visible
 */
export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  // Check database first (CMS blogs - these can be edited by admin)
  try {
    const dbPost = await fetchBlogPostPrisma(slug);
    if (dbPost) {
      return dbPost;
    }
  } catch (error) {
    console.error('Error fetching from database:', error);
  }

  // Fall back to mock data (static blogs)
  const mockPost = getPostBySlug(slug);
  if (mockPost) {
    return mockPost;
  }

  // Laravel API implementation (uncomment when ready)
  /*
  const response = await fetch(`${API_BASE_URL}/api/blog/posts/${slug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
  */

  return null;
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  // Get mock categories and compute ACTUAL post counts from mock data
  const mockCategories = [...blogCategories];

  // Calculate actual mock post counts per category
  const mockPostCounts = new Map<string, number>();
  blogPosts.forEach((post) => {
    const slug = post.category.slug;
    mockPostCounts.set(slug, (mockPostCounts.get(slug) || 0) + 1);
  });

  // Get database categories (these already have accurate post counts)
  let dbCategories: Category[] = [];
  try {
    dbCategories = await fetchCategoriesPrisma();
  } catch (error) {
    console.error('Error fetching categories from database:', error);
  }

  // Combine: database categories take priority, add counts from both
  const categoryMap = new Map<string, Category>();

  // First add mock categories with ACTUAL post counts (not hardcoded)
  mockCategories.forEach((cat) => {
    const actualCount = mockPostCounts.get(cat.slug) || 0;
    categoryMap.set(cat.slug, { ...cat, postCount: actualCount });
  });

  // Then add/update with database categories (database post counts add to mock counts)
  dbCategories.forEach((cat) => {
    const existing = categoryMap.get(cat.slug);
    if (existing) {
      // Combine post counts
      categoryMap.set(cat.slug, {
        ...existing,
        ...cat,
        postCount: (existing.postCount || 0) + (cat.postCount || 0),
      });
    } else {
      categoryMap.set(cat.slug, cat);
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch single category by slug
 */
export async function fetchCategory(slug: string): Promise<Category | null> {
  // Calculate actual mock post count for this category
  const actualMockPostCount = blogPosts.filter(
    (post) => post.category.slug === slug
  ).length;

  // First check database categories
  try {
    const dbCategories = await fetchCategoriesPrisma();
    const dbCategory = dbCategories.find((cat) => cat.slug === slug);
    if (dbCategory) {
      // Combine with actual mock data post count if available
      const mockCategory = getCategoryBySlug(slug);
      if (mockCategory) {
        return {
          ...dbCategory,
          postCount: (dbCategory.postCount || 0) + actualMockPostCount,
        };
      }
      return dbCategory;
    }
  } catch (error) {
    console.error('Error fetching category from database:', error);
  }

  // Fall back to mock data with actual count
  const mockCategory = getCategoryBySlug(slug);
  if (mockCategory) {
    return {
      ...mockCategory,
      postCount: actualMockPostCount,
    };
  }

  return null;
}

/**
 * Fetch all tags
 * Combines mock data tags with database tags, using actual post counts
 */
export async function fetchTags(): Promise<Tag[]> {
  // Calculate actual mock post counts per tag
  const mockTagCounts = new Map<string, number>();
  blogPosts.forEach((post) => {
    post.tags.forEach((tag) => {
      mockTagCounts.set(tag.slug, (mockTagCounts.get(tag.slug) || 0) + 1);
    });
  });

  // Get mock tags with actual counts
  const mockTagsWithActualCounts = blogTags.map((tag) => ({
    ...tag,
    postCount: mockTagCounts.get(tag.slug) || 0,
  }));

  // Get database tags
  let dbTags: Tag[] = [];
  try {
    dbTags = await fetchPopularTagsPrisma(1000); // Get all DB tags
  } catch (error) {
    console.error('Error fetching tags from database:', error);
  }

  // Combine: merge mock and DB tags, combine counts for matching slugs
  const tagMap = new Map<string, Tag>();

  // First add mock tags with actual counts (even if 0, to ensure they exist)
  mockTagsWithActualCounts.forEach((tag) => {
    tagMap.set(tag.slug, tag);
  });

  // Then add/update with database tags
  dbTags.forEach((tag) => {
    const existing = tagMap.get(tag.slug);
    if (existing) {
      tagMap.set(tag.slug, {
        ...existing,
        postCount: (existing.postCount || 0) + (tag.postCount || 0),
      });
    } else {
      tagMap.set(tag.slug, tag);
    }
  });

  // Return all tags sorted alphabetically
  return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch single tag by slug
 * Combines mock data tags with database tags, using actual post counts
 */
export async function fetchTag(slug: string): Promise<Tag | null> {
  // Calculate actual mock post count for this tag
  let mockPostCount = 0;
  blogPosts.forEach((post) => {
    if (post.tags.some((t) => t.slug === slug)) {
      mockPostCount++;
    }
  });

  // Try to find tag in mock data
  const mockTag = getTagBySlug(slug);

  // Try to find tag in database posts
  let dbPostCount = 0;
  try {
    // Get posts with this tag from database
    const dbResponse = await fetchBlogPostsPrisma({
      tag: slug,
      page: 1,
      limit: 1000,
    });
    dbPostCount = dbResponse.posts.length;
  } catch (error) {
    console.error('Error fetching tag posts from database:', error);
  }

  // If tag exists in mock data, return it with combined count
  if (mockTag) {
    return {
      ...mockTag,
      postCount: mockPostCount + dbPostCount,
    };
  }

  // If tag only exists in database, create a tag object for it
  if (dbPostCount > 0) {
    return {
      id: slug,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: slug,
      postCount: dbPostCount,
    };
  }

  return null;
}

/**
 * Fetch popular tags
 * Combines mock data tags with database tags, using actual post counts
 */
export async function fetchPopularTags(limit: number = 15): Promise<Tag[]> {
  // Calculate actual mock post counts per tag
  const mockTagCounts = new Map<string, number>();
  blogPosts.forEach((post) => {
    post.tags.forEach((tag) => {
      mockTagCounts.set(tag.slug, (mockTagCounts.get(tag.slug) || 0) + 1);
    });
  });

  // Get mock tags with actual counts
  const mockTagsWithActualCounts = blogTags.map((tag) => ({
    ...tag,
    postCount: mockTagCounts.get(tag.slug) || 0,
  }));

  // Get database tags
  let dbTags: Tag[] = [];
  try {
    dbTags = await fetchPopularTagsPrisma(100); // Get all DB tags
  } catch (error) {
    console.error('Error fetching tags from database:', error);
  }

  // Combine: merge mock and DB tags, combine counts for matching slugs
  const tagMap = new Map<string, Tag>();

  // First add mock tags with actual counts
  mockTagsWithActualCounts.forEach((tag) => {
    if (tag.postCount > 0) {
      tagMap.set(tag.slug, tag);
    }
  });

  // Then add/update with database tags
  dbTags.forEach((tag) => {
    const existing = tagMap.get(tag.slug);
    if (existing) {
      tagMap.set(tag.slug, {
        ...existing,
        postCount: (existing.postCount || 0) + (tag.postCount || 0),
      });
    } else {
      tagMap.set(tag.slug, tag);
    }
  });

  // Sort by post count and return top tags
  return Array.from(tagMap.values())
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, limit);
}

/**
 * Fetch all authors
 */
export async function fetchAuthors(): Promise<Author[]> {
  if (USE_MOCK_DATA) {
    return blogAuthors;
  }

  // Laravel API implementation
  /*
  const response = await fetch(`${API_BASE_URL}/api/blog/authors`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch authors');
  }

  return response.json();
  */

  return [];
}

/**
 * Fetch single author by slug
 */
export async function fetchAuthor(slug: string): Promise<Author | null> {
  if (USE_MOCK_DATA) {
    return getAuthorBySlug(slug) || null;
  }

  // Laravel API implementation
  /*
  const response = await fetch(`${API_BASE_URL}/api/blog/authors/${slug}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
  */

  return null;
}

/**
 * Fetch featured posts
 */
export async function fetchFeaturedPosts(limit: number = 3): Promise<BlogPost[]> {
  if (USE_PRISMA) {
    return await fetchFeaturedPostsPrisma(limit);
  }

  if (USE_MOCK_DATA) {
    return getFeaturedPosts().slice(0, limit);
  }

  // Laravel API implementation
  /*
  const response = await fetch(`${API_BASE_URL}/api/blog/posts/featured?limit=${limit}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch featured posts');
  }

  return response.json();
  */

  return [];
}

/**
 * Fetch related posts for a specific post
 */
export async function fetchRelatedPosts(
  postId: string,
  limit: number = 3
): Promise<BlogPost[]> {
  if (USE_MOCK_DATA) {
    return getRelatedPosts(postId, limit);
  }

  // Laravel API implementation
  /*
  const response = await fetch(
    `${API_BASE_URL}/api/blog/posts/${postId}/related?limit=${limit}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch related posts');
  }

  return response.json();
  */

  return [];
}

/**
 * Submit a comment
 */
export async function submitComment(
  data: CommentFormData
): Promise<{ success: boolean; message: string; comment?: Comment }> {
  if (USE_MOCK_DATA) {
    // Mock implementation - simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation
    if (!data.name || !data.email || !data.content) {
      return {
        success: false,
        message: 'All fields are required',
      };
    }

    // Mock success response
    const mockComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      postId: data.postId,
      author: {
        name: data.name,
        email: data.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}`,
      },
      content: data.content,
      createdAt: new Date().toISOString(),
      approved: false, // Comments need admin approval
      parentId: data.parentId,
    };

    return {
      success: true,
      message: 'Comment submitted successfully! It will appear after moderation.',
      comment: mockComment,
    };
  }

  // Laravel API implementation
  /*
  const response = await fetch(`${API_BASE_URL}/api/blog/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: result.message || 'Failed to submit comment',
    };
  }

  return result;
  */

  return {
    success: false,
    message: 'Comment submission is currently unavailable',
  };
}

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId: string): Promise<Comment[]> {
  if (USE_MOCK_DATA) {
    // Mock comments
    return [
      {
        id: '1',
        postId,
        author: {
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
          avatar: 'https://ui-avatars.com/api/?name=Rahul+Sharma',
        },
        content: 'Great article! Very helpful for planning my Leh Ladakh trip.',
        createdAt: '2024-03-16T10:30:00Z',
        approved: true,
      },
      {
        id: '2',
        postId,
        author: {
          name: 'Priya Singh',
          email: 'priya@example.com',
          avatar: 'https://ui-avatars.com/api/?name=Priya+Singh',
        },
        content: 'Thanks for the detailed itinerary. Bookmarking this for my summer trip!',
        createdAt: '2024-03-17T14:20:00Z',
        approved: true,
      },
    ];
  }

  // Laravel API implementation
  /*
  const response = await fetch(`${API_BASE_URL}/api/blog/posts/${postId}/comments`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  return response.json();
  */

  return [];
}

/**
 * Increment post view count
 */
export async function incrementPostViews(postId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    // In mock mode, we don't actually update anything
    // In production, this would update the database
    console.log(`View count incremented for post: ${postId}`);
    return;
  }

  // Laravel API implementation
  /*
  await fetch(`${API_BASE_URL}/api/blog/posts/${postId}/views`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  */
}

/**
 * Search blog posts
 * Searches both mock data and database, combines results
 */
export async function searchBlogPosts(query: string, limit: number = 10): Promise<BlogPost[]> {
  // Search mock data
  const mockResults = searchPosts(query);

  // Search database
  let dbResults: BlogPost[] = [];
  try {
    dbResults = await searchBlogPostsPrisma(query, limit);
  } catch (error) {
    console.error('Error searching database:', error);
  }

  // Combine results (database takes priority for duplicates)
  const dbSlugs = new Set(dbResults.map((p) => p.slug));
  const uniqueMockResults = mockResults.filter((p) => !dbSlugs.has(p.slug));
  const allResults = [...dbResults, ...uniqueMockResults];

  // Sort by relevance (title match first) then by date
  allResults.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(query.toLowerCase());
    const bTitle = b.title.toLowerCase().includes(query.toLowerCase());
    if (aTitle && !bTitle) return -1;
    if (!aTitle && bTitle) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return allResults.slice(0, limit);
}

/**
 * Get popular categories
 */
export async function fetchPopularCategories(limit: number = 6): Promise<Category[]> {
  if (USE_MOCK_DATA) {
    return popularCategories.slice(0, limit);
  }

  // Laravel API implementation
  /*
  const response = await fetch(
    `${API_BASE_URL}/api/blog/categories/popular?limit=${limit}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch popular categories');
  }

  return response.json();
  */

  return [];
}

/**
 * Utility: Generate static params for blog posts (for static generation)
 */
export async function getBlogPostSlugs(limit?: number): Promise<string[]> {
  const posts = USE_MOCK_DATA ? blogPosts : await fetchBlogPosts({ limit: 100 }).then(res => res.posts);
  const slugs = posts.map((post) => post.slug);
  return limit ? slugs.slice(0, limit) : slugs;
}

/**
 * Utility: Generate static params for categories
 */
export async function getCategorySlugs(): Promise<string[]> {
  const categories = await fetchCategories();
  // Limit to top 10 categories for static generation to reduce DB load
  return categories.slice(0, 10).map((cat) => cat.slug);
}

/**
 * Utility: Generate static params for tags
 */
export async function getTagSlugs(): Promise<string[]> {
  // Only generate pages for top 20 tags to save build time and DB load
  const tags = await fetchPopularTags(20);
  return tags.map((tag) => tag.slug);
}

/**
 * Utility: Generate static params for authors
 */
export async function getAuthorSlugs(): Promise<string[]> {
  const authors = await fetchAuthors();
  // Limit to top 5 authors for static generation
  return authors.slice(0, 5).map((author) => author.slug);
}
