// @ts-nocheck
//
// Social Network service layer — single source of truth for posts, likes,
// saves, comments. Both /api/social/* (cross-type) and /api/vendor/social/*
// (vendor only) call these functions so behavior is identical regardless of
// which entry point hits the DB.
//
// Every function takes a `SocialActor` ({ type: 'vendor'|'agent', id, ... })
// and consults it to decide which DB column to filter / write on.

import { prisma } from '@/lib/db/prisma';
import { SocialActor, whereActorOwns, actorAuthorData } from '@/lib/auth/social-auth';
import { authorInclude, formatAuthor, vendorShapedAuthor } from './author';

const PAGE_SIZE = 20;

// social_posts.images is stored as a JSON-string array of URLs. Parse safely
// for responses; never throw on malformed data.
function parseImages(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

// Build a where-clause fragment that matches rows authored by THIS actor,
// regardless of whether they're vendor- or agent-authored.
function actorPostsWhere(actor: SocialActor) {
  return actor.type === 'vendor'
    ? { vendorId: actor.id }
    : { agentId: actor.id };
}

// Used inside the post include block to determine "did *this actor* like /
// save the post?" — we filter the per-actor relation list to at most 1 row.
function selfRelationWhere(actor: SocialActor) {
  return actor.type === 'vendor'
    ? { vendorId: actor.id }
    : { agentId: actor.id };
}

// Composite-unique selector for likes/saves keyed by (postId, actorColumn).
// social_post_likes / social_post_saves both have @@unique([postId, vendorId])
// AND @@unique([postId, agentId]).
function uniqueByPostAndActor(actor: SocialActor, postId: string) {
  return actor.type === 'vendor'
    ? { postId_vendorId: { postId, vendorId: actor.id } }
    : { postId_agentId:  { postId, agentId:  actor.id } };
}

// Project a post row from Prisma into the response shape the UI consumes.
function serializePost(post: any, actor: SocialActor) {
  return {
    ...post,
    images: parseImages(post.images),
    // keep `vendor` populated for backwards compat — agent-authored posts
    // get a vendor-shaped projection so existing vendor UI keeps rendering.
    vendor: vendorShapedAuthor(post),
    agent: post.agent ?? null,
    author: formatAuthor(post),
    likedByMe: (post.social_post_likes?.length ?? 0) > 0,
    savedByMe: (post.social_post_saves?.length ?? 0) > 0,
    likesCount: post._count?.social_post_likes ?? 0,
    commentsCount: post._count?.social_post_comments ?? 0,
  };
}

// ── Categories ───────────────────────────────────────────────────────────────
export async function listCategories() {
  const categories = await prisma.social_categories.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  return { categories };
}

// ── Feed (main / sos / saved / my) ───────────────────────────────────────────
export async function getFeed(
  actor: SocialActor,
  opts: { type?: string | null; cursor?: string | null; categoryId?: string | null } = {},
) {
  const { type, cursor, categoryId } = opts;

  // SOS stories — last 24h, SOS-flagged categories, NOT scoped to the viewer
  if (type === 'sos') {
    const sosCategoryIds = await prisma.social_categories.findMany({
      where: { isSOS: true, isActive: true },
      select: { id: true },
    });
    const sosIds = sosCategoryIds.map((c) => c.id);
    if (!sosIds.length) return { posts: [] };

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sosPosts = await prisma.social_posts.findMany({
      where: { categoryId: { in: sosIds }, isActive: true, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      include: {
        ...authorInclude,
        category: { select: { id: true, name: true, isSOS: true } },
        _count: { select: { social_post_likes: true, social_post_comments: true } },
      },
    });
    return { posts: sosPosts.map((p) => serializePost(p, actor)) };
  }

  // Saved posts — only those THIS actor has saved
  if (type === 'saved') {
    const saves = await prisma.social_post_saves.findMany({
      where: selfRelationWhere(actor),
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
      include: {
        post: {
          include: {
            ...authorInclude,
            category: { select: { id: true, name: true, isSOS: true } },
            _count: { select: { social_post_likes: true, social_post_comments: true } },
            social_post_likes: { where: selfRelationWhere(actor), select: { id: true } },
            social_post_saves: { where: selfRelationWhere(actor), select: { id: true } },
          },
        },
      },
    });
    const posts = saves.map((s) => serializePost({ ...s.post, savedByMe: true }, actor));
    // savedByMe is already true from the query; ensure flag is set even if
    // the included relation row was filtered out by `take`.
    posts.forEach((p) => (p.savedByMe = true));
    const nextCursor = saves.length === PAGE_SIZE ? saves[saves.length - 1].id : null;
    return { posts, nextCursor };
  }

  // My posts — authored by THIS actor
  if (type === 'my') {
    const posts = await prisma.social_posts.findMany({
      where: { ...actorPostsWhere(actor), isActive: true },
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
      include: {
        ...authorInclude,
        category: { select: { id: true, name: true, isSOS: true } },
        _count: { select: { social_post_likes: true, social_post_comments: true } },
        social_post_likes: { where: selfRelationWhere(actor), select: { id: true } },
        social_post_saves: { where: selfRelationWhere(actor), select: { id: true } },
      },
    });
    const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null;
    return { posts: posts.map((p) => serializePost(p, actor)), nextCursor };
  }

  // Main feed — everyone's active posts
  const where: any = { isActive: true };
  if (categoryId) where.categoryId = categoryId;

  const posts = await prisma.social_posts.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: PAGE_SIZE,
    include: {
      ...authorInclude,
      category: { select: { id: true, name: true, isSOS: true } },
      _count: { select: { social_post_likes: true, social_post_comments: true } },
      social_post_likes: { where: selfRelationWhere(actor), select: { id: true } },
      social_post_saves: { where: selfRelationWhere(actor), select: { id: true } },
    },
  });

  const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null;
  return { posts: posts.map((p) => serializePost(p, actor)), nextCursor };
}

// ── Create post ──────────────────────────────────────────────────────────────
export async function createPost(
  actor: SocialActor,
  { content, categoryId, images }: { content: string; categoryId: string; images?: string[] },
) {
  if (!content?.trim()) throw new SocialError('Content is required', 400);
  if (!categoryId) throw new SocialError('Category is required', 400);

  const category = await prisma.social_categories.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) throw new SocialError('Invalid category', 400);

  // Keep only valid string URLs; cap to 4 to match the composer limit.
  const cleanImages = Array.isArray(images)
    ? images.filter((u) => typeof u === 'string' && u.trim()).slice(0, 4)
    : [];

  const post = await prisma.social_posts.create({
    data: {
      ...actorAuthorData(actor),
      categoryId,
      content: content.trim(),
      images: cleanImages.length ? JSON.stringify(cleanImages) : null,
    },
    include: {
      ...authorInclude,
      category: { select: { id: true, name: true, isSOS: true } },
    },
  });

  return {
    post: {
      ...post,
      images: parseImages(post.images),
      vendor: vendorShapedAuthor(post),
      agent: post.agent ?? null,
      author: formatAuthor(post),
      likedByMe: false,
      savedByMe: false,
      likesCount: 0,
      commentsCount: 0,
    },
  };
}

// ── Delete (soft) own post ───────────────────────────────────────────────────
export async function deletePost(actor: SocialActor, postId: string) {
  const post = await prisma.social_posts.findUnique({ where: { id: postId } });
  if (!post) throw new SocialError('Post not found', 404);

  const owns = actor.type === 'vendor'
    ? post.vendorId === actor.id
    : post.agentId === actor.id;
  if (!owns) throw new SocialError('Post not found', 404); // 404 vs 403 keeps owner ids private

  await prisma.social_posts.update({ where: { id: postId }, data: { isActive: false } });
  return { success: true };
}

// ── Toggle like ──────────────────────────────────────────────────────────────
export async function togglePostLike(actor: SocialActor, postId: string) {
  const existing = await prisma.social_post_likes.findUnique({
    where: uniqueByPostAndActor(actor, postId) as any,
  });

  if (existing) {
    await prisma.social_post_likes.delete({ where: { id: existing.id } });
    const count = await prisma.social_post_likes.count({ where: { postId } });
    return { liked: false, likesCount: count };
  }

  // Make sure the post exists before creating a like (FK would catch it
  // anyway, but a clean error message helps the UI).
  const post = await prisma.social_posts.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new SocialError('Post not found', 404);

  await prisma.social_post_likes.create({
    data: {
      postId,
      ...actorAuthorData(actor),
    },
  });
  const count = await prisma.social_post_likes.count({ where: { postId } });
  return { liked: true, likesCount: count };
}

// ── Toggle save ──────────────────────────────────────────────────────────────
export async function togglePostSave(actor: SocialActor, postId: string) {
  const existing = await prisma.social_post_saves.findUnique({
    where: uniqueByPostAndActor(actor, postId) as any,
  });

  if (existing) {
    await prisma.social_post_saves.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  const post = await prisma.social_posts.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new SocialError('Post not found', 404);

  await prisma.social_post_saves.create({
    data: {
      postId,
      ...actorAuthorData(actor),
    },
  });
  return { saved: true };
}

// ── Comments ─────────────────────────────────────────────────────────────────
export async function listComments(actor: SocialActor, postId: string) {
  const comments = await prisma.social_post_comments.findMany({
    where: { postId, isActive: true },
    orderBy: { createdAt: 'asc' },
    include: authorInclude,
  });
  return {
    comments: comments.map((c: any) => ({
      ...c,
      vendor: vendorShapedAuthor(c),
      agent: c.agent ?? null,
      author: formatAuthor(c),
    })),
  };
}

export async function addComment(
  actor: SocialActor,
  postId: string,
  { content }: { content: string },
) {
  if (!content?.trim()) throw new SocialError('Comment cannot be empty', 400);

  const post = await prisma.social_posts.findUnique({ where: { id: postId } });
  if (!post || !post.isActive) throw new SocialError('Post not found', 404);

  const comment = await prisma.social_post_comments.create({
    data: {
      postId,
      ...actorAuthorData(actor),
      content: content.trim(),
    },
    include: authorInclude,
  });
  return {
    comment: {
      ...comment,
      vendor: vendorShapedAuthor(comment as any),
      agent: (comment as any).agent ?? null,
      author: formatAuthor(comment as any),
    },
  };
}

export async function deleteComment(actor: SocialActor, commentId: string) {
  const comment = await prisma.social_post_comments.findUnique({ where: { id: commentId } });
  if (!comment) throw new SocialError('Comment not found', 404);

  const owns = actor.type === 'vendor'
    ? comment.vendorId === actor.id
    : comment.agentId === actor.id;
  if (!owns) throw new SocialError('Comment not found', 404);

  await prisma.social_post_comments.update({ where: { id: commentId }, data: { isActive: false } });
  return { success: true };
}

// ── Error type ───────────────────────────────────────────────────────────────
export class SocialError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}
