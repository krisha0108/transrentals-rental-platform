import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
// GET - Fetch page content for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find the service by slug
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get page content from SiteSetting
    const settingKey = `service_page_content_${slug}`;
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const defaultContent = {
      hero: {
        title: service.name,
        subtitle: '',
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

    let content = defaultContent;
    if (setting?.value) {
      try {
        content = JSON.parse(setting.value);
      } catch {
        content = defaultContent;
      }
    }

    return NextResponse.json({
      serviceName: service.name,
      content,
    });
  } catch (error) {
    logger.error('Failed to fetch page content', error);
    return NextResponse.json(
      { error: 'Failed to fetch page content' },
      { status: 500 }
    );
  }
}

// PATCH - Update page content for a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // Verify service exists
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const settingKey = `service_page_content_${slug}`;

    // Upsert the page content
    const setting = await prisma.settings.upsert({
      where: { key: settingKey },
      create: {
        id: generateId(),
        key: settingKey,
        value: JSON.stringify(body),
      },
      update: {
        value: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      content: setting.value,
    });
  } catch (error) {
    logger.error('Failed to update page content', error);
    return NextResponse.json(
      { error: 'Failed to update page content' },
      { status: 500 }
    );
  }
}
