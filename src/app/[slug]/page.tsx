import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { generatePageMetadata } from '@/components/seo/DynamicSEO';
import { format } from 'date-fns';
import { resolveAssetUrl } from '@/lib/utils';
import { INDIAN_CITIES, INDIAN_STATES, STATIC_CITIES, getCityBySlug, getStateBySlug, City, IndianState } from '@/data/indian-cities';
import { CityHomePage } from '@/components/city';
import { StateHomePage } from '@/components/state/StateHomePage';
import { resolvePageMeta } from '@/lib/seo/resolve-page-meta';

interface PageProps {
  params: {
    slug: string;
  };
}

// Check if slug is a city
function getCity(slug: string): City | undefined {
  return getCityBySlug(slug);
}

// Check if slug is a state
function getState(slug: string): IndianState | undefined {
  return getStateBySlug(slug);
}

// Get CMS page from database
async function getCMSPage(slug: string) {
  try {
    const page = await prisma.pages.findUnique({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        admin_users: {
          select: {
            name: true,
          },
        },
      },
    });

    return page;
  } catch (error) {
    return null;
  }
}

// Generate static params for all cities + states + CMS pages
export async function generateStaticParams() {
  // Get all city slugs (Optimized for build time)
  const citySlugs = STATIC_CITIES.map((city) => ({
    slug: city.slug,
  }));

  // All state slugs
  const stateSlugs = INDIAN_STATES.map((state) => ({ slug: state.slug }));

  // Skip ALL static generation during CI build — pages served via ISR on first request
  if (process.env.SKIP_DATABASE_CALLS === '1') {
    return [];
  }

  // Try to get CMS page slugs (may fail if DB not available at build time)
  let cmsSlugs: { slug: string }[] = [];
  try {
    const cmsPages = await prisma.pages.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });
    cmsSlugs = cmsPages.map((page: { slug: string }) => ({ slug: page.slug }));
  } catch (error) {
    // Could not fetch CMS pages for static generation
  }

  return [...citySlugs, ...stateSlugs, ...cmsSlugs];
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;

  // Check if it's a city first
  const city = getCity(slug);
  if (city) {
    const cmsData = await resolvePageMeta(`city:${slug}`);
    const title = cmsData?.metaTitle || `Vehicle Rentals in ${city.name} | Car, Bike, Bus, Cab & More — TransRentals`;
    const description = cmsData?.metaDescription || `Rent cars, bikes, buses, luxury vehicles & more in ${city.name}, ${city.state}. Self-drive & chauffeur-driven options. Compare quotes from 500+ verified vendors. Best prices guaranteed!`;
    return {
      title,
      description,
      keywords: cmsData?.metaKeywords
        ? cmsData.metaKeywords.split(',').map((k) => k.trim())
        : [
            `vehicle rental ${city.name}`,
            `car rental ${city.name}`,
            `bike rental ${city.name}`,
            `bus rental ${city.name}`,
            `self drive car ${city.name}`,
            `luxury car rental ${city.name}`,
            `airport transfer ${city.name}`,
            `outstation cab ${city.name}`,
            `tempo traveller ${city.name}`,
            `packers movers ${city.name}`,
            ...city.keywords,
          ],
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'en_IN',
        siteName: 'TransRentals',
        url: `https://transrentals.in/${city.slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: `https://transrentals.in/${city.slug}`,
      },
    };
  }

  // Check if it's a state
  const state = getState(slug);
  if (state) {
    const cmsData = await resolvePageMeta(`state:${slug}`);
    const title = cmsData?.metaTitle || `Vehicle Rentals in ${state.name} | Car, Bike, Bus, Cab & More — TransRentals`;
    const description = cmsData?.metaDescription || `Rent cars, bikes, buses, luxury vehicles & more across ${state.name}. Self-drive & chauffeur-driven options. Compare quotes from 500+ verified vendors. Best prices guaranteed!`;
    return {
      title,
      description,
      keywords: cmsData?.metaKeywords
        ? cmsData.metaKeywords.split(',').map((k) => k.trim())
        : [`vehicle rental ${state.name}`, `car rental ${state.name}`, `bike rental ${state.name}`, `bus rental ${state.name}`, `self drive ${state.name}`, `outstation cab ${state.name}`],
      openGraph: { title, description, type: 'website', locale: 'en_IN', siteName: 'TransRentals', url: `https://transrentals.in/${state.slug}` },
      twitter: { card: 'summary_large_image', title, description },
      alternates: { canonical: `https://transrentals.in/${state.slug}` },
    };
  }

  // Check for CMS page
  const page = await getCMSPage(slug);
  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return generatePageMetadata({
    title: page.title,
    description: page.excerpt || undefined,
    seoData: page.seo_meta,
    path: `/${page.slug}`,
  });
}

// Main page component
export default async function DynamicPage({ params }: PageProps) {
  const { slug } = params;

  // Check if it's a city first
  const city = getCity(slug);
  if (city) {
    const cmsData = await resolvePageMeta(`city:${slug}`);
    return <CityHomePage city={city} cmsData={cmsData} />;
  }

  // Check if it's a state
  const state = getState(slug);
  if (state) {
    const cmsData = await resolvePageMeta(`state:${slug}`);
    return <StateHomePage state={state} cmsData={cmsData} />;
  }

  // Check for CMS page
  const page = await getCMSPage(slug);
  if (!page) {
    notFound();
  }

  const featuredImageUrl = page.featuredImage ? resolveAssetUrl(page.featuredImage) : undefined;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <article className="container-custom py-12 md:py-20">
          {/* Page Header */}
          <header className="max-w-4xl mx-auto mb-12 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {page.title}
            </h1>

            {page.excerpt && (
              <p className="text-xl text-gray-600 mb-6">
                {page.excerpt}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>By {page.admin_users.name}</span>
              <span>•</span>
              <time dateTime={page.publishedAt?.toISOString()}>
                {page.publishedAt ? format(new Date(page.publishedAt), 'MMMM d, yyyy') : ''}
              </time>
            </div>
          </header>

          {/* Featured Image */}
          {featuredImageUrl && (
            <div className="max-w-5xl mx-auto mb-12">
              <img
                src={featuredImageUrl}
                alt={page.title}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          )}

          {/* Page Content */}
          <div
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 prose prose-lg prose-blue"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </main>
    </>
  );
}
