import { Metadata } from 'next';

interface SEOData {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogType?: string | null;
  twitterCard?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
  nofollow?: boolean;
}

interface GenerateMetadataProps {
  title: string;
  description?: string;
  seoData?: SEOData | null;
  path?: string;
}

export function generatePageMetadata({
  title,
  description,
  seoData,
  path = '',
}: GenerateMetadataProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const fullUrl = `${baseUrl}${path}`;

  const metadata: Metadata = {
    title: seoData?.metaTitle || title,
    description: seoData?.metaDescription || description || '',
    keywords: seoData?.metaKeywords?.split(',').map(k => k.trim()),
    robots: {
      index: !seoData?.noindex,
      follow: !seoData?.nofollow,
    },
    openGraph: {
      title: seoData?.ogTitle || seoData?.metaTitle || title,
      description: seoData?.ogDescription || seoData?.metaDescription || description || '',
      url: fullUrl,
      siteName: 'TransRentals',
      images: seoData?.ogImage
        ? [{ url: seoData.ogImage }]
        : [{ url: `${baseUrl}${process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '/images/og-image.jpg'}` }],
      type: (seoData?.ogType as any) || 'website',
    },
    twitter: {
      card: (seoData?.twitterCard as any) || 'summary_large_image',
      title: seoData?.twitterTitle || seoData?.metaTitle || title,
      description: seoData?.twitterDescription || seoData?.metaDescription || description || '',
      images: seoData?.twitterImage ? [seoData.twitterImage] : undefined,
    },
    alternates: {
      canonical: seoData?.canonicalUrl || fullUrl,
    },
  };

  return metadata;
}
