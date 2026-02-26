import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

const DEFAULT_CATEGORIES = [
  { name: 'Travel Guides', slug: 'travel-guides', description: 'Comprehensive travel guides for exploring India' },
  { name: 'Rental Tips', slug: 'rental-tips', description: 'Expert tips for renting vehicles' },
  { name: 'Destination Spotlights', slug: 'destination-spotlights', description: 'Explore popular destinations' },
  { name: 'Adventure Stories', slug: 'adventure-stories', description: 'Real adventure tales from travelers' },
  { name: 'Wedding & Events', slug: 'wedding-events', description: 'Vehicle rentals for weddings and events' },
  { name: 'Corporate Travel', slug: 'corporate-travel', description: 'Corporate transportation solutions' },
  { name: 'Seasonal Guides', slug: 'seasonal-guides', description: 'Season-specific travel guides' },
  { name: 'Budget Travel', slug: 'budget-travel', description: 'Smart travel on a budget' },
  { name: 'Road Trip Guides', slug: 'road-trip-guides', description: 'Epic road trips across India' },
  { name: 'News & Updates', slug: 'news-updates', description: 'Latest news and updates' },
];

// GET - Fetch all categories (with optional seeding)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Seed default categories if none exist
    const count = await prisma.blog_categories.count();
    if (count === 0) {
      await prisma.blog_categories.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          id: generateId(),
          name: c.name,
          slug: c.slug,
          description: c.description,
        })),
        skipDuplicates: true,
      });
    }

    const categories = await prisma.blog_categories.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { blog_posts: true },
        },
      },
    });

    return NextResponse.json({
      categories: categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        postCount: c._count.blog_posts,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch blog categories', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await prisma.blog_categories.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 });

    const category = await prisma.blog_categories.create({
      data: {
        id: generateId(),
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create blog category', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
