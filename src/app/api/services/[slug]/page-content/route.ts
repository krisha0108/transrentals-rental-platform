import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getParentServiceSlug } from '@/lib/constants/service-mapping';

import logger from '@/lib/security/logger';
// settings.value is `String @db.Text`, so everything in it comes back as raw
// JSON text. Returning it unparsed handed the page a string where it expected
// an object, and the first nested read (ctaSection.visible) threw.
function parseSetting<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

// Public API - Fetch page content for a service (used by frontend)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const parentSlug = getParentServiceSlug(slug);

    // Find the service by slug
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true, description: true },
    });

    // Get page content from Setting - use PARENT slug for inheritance
    // First try the specific sub-service, then fall back to parent
    let setting = await prisma.settings.findUnique({
      where: { key: `service_page_content_${slug}` },
    });

    // If no content for this specific slug, inherit from parent
    if (!setting?.value && parentSlug !== slug) {
      setting = await prisma.settings.findUnique({
        where: { key: `service_page_content_${parentSlug}` },
      });
    }

    const defaultContent = {
      hero: {
        title: service?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        subtitle: service?.description || '',
        backgroundImage: '',
        ctaText: 'Book Now',
        ctaLink: '#booking',
        overlayOpacity: 50,
      },
      introText: '',
      features: [],
      featuresTitle: 'Why Choose Us',
      featuresVisible: true,
      howItWorks: [],
      howItWorksTitle: 'How It Works',
      howItWorksVisible: true,
      testimonials: [],
      testimonialsTitle: 'What Our Customers Say',
      testimonialsVisible: true,
      faqs: [],
      faqsTitle: 'Frequently Asked Questions',
      faqsVisible: true,
      gallery: [],
      galleryTitle: 'Gallery',
      galleryVisible: false,
      customSections: [],
      ctaSection: {
        title: 'Ready to Get Started?',
        subtitle: 'Book your vehicle today and experience the difference.',
        buttonText: 'Book Now',
        buttonLink: '#booking',
        visible: true,
      },
    };

    // Also fetch blog posts for this service - inherit from parent if needed
    let blogSetting = await prisma.settings.findUnique({
      where: { key: `service_blog_${slug}` },
    });
    if (!blogSetting?.value && parentSlug !== slug) {
      blogSetting = await prisma.settings.findUnique({
        where: { key: `service_blog_${parentSlug}` },
      });
    }
    const blogData = parseSetting<any>(blogSetting?.value, { posts: [] });
    const publishedPosts = (blogData.posts || [])
      .filter((p: any) => p.status === 'published')
      .slice(0, 3);

    // Fetch knowledge base - inherit from parent if needed
    let kbSetting = await prisma.settings.findUnique({
      where: { key: `service_knowledge_base_${slug}` },
    });
    if (!kbSetting?.value && parentSlug !== slug) {
      kbSetting = await prisma.settings.findUnique({
        where: { key: `service_knowledge_base_${parentSlug}` },
      });
    }
    const kbData = parseSetting<any>(kbSetting?.value, { articles: [] });
    const publishedArticles = (kbData.articles || [])
      .filter((a: any) => a.status === 'published')
      .slice(0, 5);

    return NextResponse.json({
      serviceName: service?.name || slug,
      slug,
      parentSlug,
      isInherited: parentSlug !== slug && !!setting?.value,
      // Merged over the defaults so a CMS record that predates a newer
      // section still comes back with every key the page reads.
      content: { ...defaultContent, ...parseSetting<any>(setting?.value, {}) },
      blogPosts: publishedPosts,
      helpArticles: publishedArticles,
    });
  } catch (error) {
    logger.error('Failed to fetch service page content', error);
    return NextResponse.json(
      { error: 'Failed to fetch page content' },
      { status: 500 }
    );
  }
}
