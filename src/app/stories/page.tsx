import type { Metadata } from 'next';
import Link from 'next/link';
import { Film } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = {
  title: 'Web Stories | TransRentals',
  description: 'Explore immersive stories about travel, rentals, deals and more.',
  openGraph: {
    title: 'Web Stories | TransRentals',
    description: 'Explore immersive stories about travel, rentals, deals and more.',
    type: 'website',
  },
};

interface Story {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  coverImageSquare: string | null;
  publisherName: string | null;
  publisherLogo: string | null;
  category: string | null;
  publishedAt: string | null;
  slideCount: number;
  totalReactions: number;
}

async function getStories(): Promise<Story[]> {
  try {
    const now = new Date();
    const stories = await prisma.web_stories.findMany({
      where: {
        isPublished: true,
        isArchived: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        slides: { select: { id: true } },
        reactions: { select: { id: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
    });

    return stories.map((s: any) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      coverImage: s.coverImage,
      coverImageSquare: s.coverImageSquare,
      publisherName: s.publisherName,
      publisherLogo: s.publisherLogo,
      category: s.category,
      publishedAt: s.publishedAt?.toISOString() || null,
      slideCount: s.slides.length,
      totalReactions: s.reactions.length,
    }));
  } catch {
    return [];
  }
}

function StoryCard({ story }: { story: Story }) {
  const cover = story.coverImageSquare || story.coverImage;
  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl shadow-md aspect-[9/16] bg-gray-900 group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
        {cover ? (
          <img
            src={cover}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
            <Film className="w-12 h-12 text-white/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Category badge */}
        {story.category && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full uppercase tracking-wide">
              {story.category}
            </span>
          </div>
        )}

        {/* Slide count */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium rounded-full">
            {story.slideCount} slides
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Publisher */}
          <div className="flex items-center gap-1.5 mb-2">
            {story.publisherLogo ? (
              <img src={story.publisherLogo} alt="" className="w-5 h-5 rounded-full object-cover border border-white/30" />
            ) : null}
            {story.publisherName && (
              <span className="text-white/70 text-[11px] font-medium">{story.publisherName}</span>
            )}
          </div>
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{story.title}</h3>
          {story.totalReactions > 0 && (
            <p className="text-white/50 text-[10px] mt-1">{story.totalReactions} reactions</p>
          )}
        </div>

        {/* Hover play indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-gray-900 via-purple-950 to-indigo-900 text-white py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-[10%] w-32 h-32 rounded-full bg-purple-400 blur-3xl" />
          <div className="absolute bottom-4 right-[15%] w-40 h-40 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium mb-4 border border-white/20">
            <Film className="w-3.5 h-3.5" />
            Immersive Stories
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Web Stories</h1>
          <p className="text-white/60 text-base md:text-lg">
            Tap through stunning visual stories about travel, deals, tips and inspiration.
          </p>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {stories.length === 0 ? (
          <div className="text-center py-24">
            <Film className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-500">No stories yet</h2>
            <p className="text-gray-400 text-sm mt-1">Check back soon for immersive stories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
