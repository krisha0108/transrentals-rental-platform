import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import StoryViewer from '@/app/stories/[slug]/_components/StoryViewer';

async function getStoryForPreview(id: string) {
  try {
    const story = await prisma.web_stories.findUnique({
      where: { id },
      include: {
        slides: { orderBy: { order: 'asc' } },
        reactions: { select: { reactionType: true } },
      },
    });
    if (!story) return null;

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

export default async function AdminStoryPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await getStoryForPreview(id);

  if (!story) notFound();

  if (!story.slides.length) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center px-8">
          <div className="text-5xl mb-4">🎞️</div>
          <h2 className="text-white text-xl font-bold mb-2">No slides yet</h2>
          <p className="text-white/60 text-sm mb-6">Add at least one slide to preview this story.</p>
          <a
            href="/admin/web-stories"
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
          >
            Back to Stories
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Admin badge */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
        <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-lg uppercase tracking-wide">
          Admin Preview
        </span>
      </div>
      <StoryViewer story={story} backUrl="/admin/web-stories" />
    </>
  );
}
