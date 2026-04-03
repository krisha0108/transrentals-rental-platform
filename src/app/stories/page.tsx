import type { Metadata } from 'next';
import Link from 'next/link';
import { Play, Zap, TrendingUp, Clock } from 'lucide-react';
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

function StoryCard({ story, featured = false }: { story: Story; featured?: boolean }) {
  const cover = story.coverImageSquare || story.coverImage;

  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gray-900 shadow-md group-hover:shadow-2xl group-hover:shadow-[#09B368]/15 transition-all duration-300 group-hover:scale-[1.02] ${featured ? 'aspect-[9/16]' : 'aspect-[9/16]'}`}
      >
        {cover ? (
          <img
            src={cover}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#09B368] via-[#065f35] to-[#022c1a]">
            <Play className="w-12 h-12 text-white/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {story.category ? (
            <span className="px-2 py-0.5 bg-[#09B368]/85 backdrop-blur-sm text-white text-[9px] font-bold rounded-full uppercase tracking-wide">
              {story.category}
            </span>
          ) : <span />}
          <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white/80 text-[9px] font-medium rounded-full whitespace-nowrap">
            {story.slideCount} slides
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            {story.publisherLogo && (
              <img src={story.publisherLogo} alt="" className="w-4 h-4 rounded-full object-cover border border-white/30 flex-shrink-0" />
            )}
            {story.publisherName && (
              <span className="text-white/55 text-[10px] truncate">{story.publisherName}</span>
            )}
          </div>
          <h3 className={`text-white font-bold leading-tight line-clamp-2 ${featured ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>
            {story.title}
          </h3>
          {story.totalReactions > 0 && (
            <p className="text-white/40 text-[10px] mt-1.5 flex items-center gap-1">
              <span>❤️</span> {story.totalReactions} reactions
            </p>
          )}
        </div>

        {/* Hover play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 bg-[#09B368]/75 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-xl shadow-[#09B368]/30">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function StoriesPage() {
  const stories = await getStories();

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(stories.map(s => s.category).filter(Boolean) as string[]))];

  return (
    <div className="min-h-screen bg-[#f8faf9]">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#022c1a] via-[#043d24] to-[#011a10] overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#09B368]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-[#09B368]/10 rounded-full blur-3xl" />


        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#09B368]/15 border border-[#09B368]/30 rounded-full text-[#09B368] text-xs font-semibold mb-5 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            Immersive Web Stories
            <div className="w-1.5 h-1.5 bg-[#09B368] rounded-full animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            Visual <span className="text-[#09B368]">Stories</span>
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-8">
            Tap through stunning visual stories about travel, deals, tips and inspiration.
          </p>

          {/* Stats strip */}
          <div className="inline-flex items-center gap-6 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <TrendingUp className="w-4 h-4 text-[#09B368]" />
              <span><strong className="text-white">{stories.length}</strong> Stories</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Play className="w-4 h-4 text-[#09B368]" />
              <span><strong className="text-white">{stories.reduce((a, s) => a + s.slideCount, 0)}</strong> Slides</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Clock className="w-4 h-4 text-[#09B368]" />
              <span>Free to watch</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {stories.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-20 h-20 bg-[#09B368]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Play className="w-8 h-8 text-[#09B368]" />
            </div>
            <h2 className="text-xl font-bold text-gray-700">No stories yet</h2>
            <p className="text-gray-400 text-sm mt-2">Check back soon for immersive stories.</p>
            <Link href="/" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-[#09B368] text-white text-sm font-semibold rounded-full hover:bg-[#078F53] transition">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
