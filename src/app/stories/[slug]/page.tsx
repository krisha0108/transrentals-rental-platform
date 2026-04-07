import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import StoryViewer from './_components/StoryViewer';

export const dynamic = 'force-dynamic';

async function getStory(rawSlug: string) {
  try {
    const now = new Date();
    // Decode URL encoding (e.g. %20 → space) and normalise to lowercase-dash slug
    const decoded = decodeURIComponent(rawSlug);
    const normalised = decoded.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Try exact match first, then normalised slug
    const story = await prisma.web_stories.findFirst({
      where: {
        OR: [{ slug: decoded }, { slug: normalised }],
      },
      include: {
        slides: { orderBy: { order: 'asc' } },
        reactions: { select: { reactionType: true } },
      },
    });
    if (!story) return null;
    if (!story.isPublished) return null;
    if (story.isArchived) return null;
    if (story.expiresAt && story.expiresAt <= now) return null;

    return {
      id: story.id,
      title: story.title,
      slug: story.slug,
      description: story.description,
      metaDescription: story.metaDescription,
      coverImage: story.coverImage,
      coverImageSquare: story.coverImageSquare,
      publisherName: story.publisherName,
      publisherLogo: story.publisherLogo,
      category: story.category,
      publishedAt: story.publishedAt?.toISOString() || null,
      slides: story.slides.map((s: any) => ({
        id: s.id,
        order: s.order,
        duration: s.duration,
        bgType: s.bgType,
        bgImage: s.bgImage,
        bgVideo: s.bgVideo,
        bgColor: s.bgColor,
        bgGradient: s.bgGradient,
        heading: s.heading,
        headingSize: s.headingSize,
        headingColor: s.headingColor,
        subtext: s.subtext,
        subtextColor: s.subtextColor,
        textPosition: s.textPosition,
        textAnimation: s.textAnimation,
        ctaText: s.ctaText,
        ctaUrl: s.ctaUrl,
        ctaStyle: s.ctaStyle,
        canvasData: s.canvasData ? JSON.parse(s.canvasData) : [],
      })),
      reactions: {
        HEART: (story.reactions as any[]).filter((r) => r.reactionType === 'HEART').length,
        FIRE: (story.reactions as any[]).filter((r) => r.reactionType === 'FIRE').length,
        THUMBS_UP: (story.reactions as any[]).filter((r) => r.reactionType === 'THUMBS_UP').length,
      },
    };
  } catch {
    return null;
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://transrentals.in';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(decodeURIComponent(slug));
  if (!story) return { title: 'Story Not Found' };

  const canonicalUrl = `${SITE_URL}/stories/${slug}`;

  return {
    title: story.title,
    description: story.metaDescription || story.description || `Read ${story.title} on TransRentals Web Stories`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: story.title,
      description: story.metaDescription || story.description || '',
      type: 'article',
      url: canonicalUrl,
      images: story.coverImage ? [{ url: story.coverImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description: story.metaDescription || story.description || '',
      images: story.coverImage ? [story.coverImage] : [],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug);

  if (!story || !story.slides.length) notFound();

  const ampUrl = `${SITE_URL}/stories/${slug}/amp`;

  return (
    <>
      {/* Tells Google the AMP version exists → shows in Discover carousel */}
      <link rel="amphtml" href={ampUrl} />
      <StoryViewer story={story} />
    </>
  );
}
