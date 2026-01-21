/**
 * SEO Schema Components
 * JSON-LD structured data for better search engine visibility
 */

import React from 'react';

// Base organization info used across all schemas
const ORGANIZATION = {
  '@type': 'Organization',
  name: 'TransRentals',
  url: 'https://transrentals.in',
  logo: 'https://transrentals.in/images/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9999999999',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi'],
  },
  sameAs: [
    'https://facebook.com/transrentals',
    'https://instagram.com/transrentals',
    'https://twitter.com/transrentals',
  ],
};

// ============= LOCAL BUSINESS SCHEMA =============
interface LocalBusinessSchemaProps {
  name: string;
  description: string;
  city: string;
  state?: string;
  address?: string;
  telephone?: string;
  priceRange?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  geo?: { lat: number; lng: number };
}

export function LocalBusinessSchema({
  name,
  description,
  city,
  state = '',
  address,
  telephone = '+91-9999999999',
  priceRange = '₹₹',
  image,
  rating,
  reviewCount,
  geo,
}: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://transrentals.in/#${city.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    description,
    url: `https://transrentals.in/bike-on-rent/${city.toLowerCase().replace(/\s+/g, '-')}`,
    telephone,
    priceRange,
    image: image || 'https://transrentals.in/images/bike-rental-hero.jpg',
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state,
      addressCountry: 'IN',
      streetAddress: address || city,
    },
    ...(geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: geo.lat,
        longitude: geo.lng,
      },
    }),
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '22:00',
      },
    ],
    parentOrganization: ORGANIZATION,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= VEHICLE RENTAL SCHEMA =============
interface VehicleRentalSchemaProps {
  serviceName: string;
  description: string;
  city?: string;
  vehicles?: Array<{
    name: string;
    brand: string;
    price: number;
    image?: string;
  }>;
  priceRange?: { min: number; max: number };
}

export function VehicleRentalSchema({
  serviceName,
  description,
  city,
  vehicles = [],
  priceRange,
}: VehicleRentalSchemaProps) {
  const baseUrl = city
    ? `https://transrentals.in/bike-on-rent/${city.toLowerCase().replace(/\s+/g, '-')}`
    : 'https://transrentals.in/bike-on-rent';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Vehicle Rental',
    name: serviceName,
    description,
    url: baseUrl,
    provider: ORGANIZATION,
    areaServed: city
      ? { '@type': 'City', name: city, addressCountry: 'IN' }
      : { '@type': 'Country', name: 'India' },
    ...(priceRange && {
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: priceRange.min,
        highPrice: priceRange.max,
        priceCurrency: 'INR',
        offerCount: vehicles.length || 50,
      },
    }),
    ...(vehicles.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${serviceName} - Available Vehicles`,
        itemListElement: vehicles.slice(0, 10).map((vehicle, index) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: vehicle.name,
            brand: { '@type': 'Brand', name: vehicle.brand },
            image: vehicle.image,
          },
          price: vehicle.price,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          position: index + 1,
        })),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= FAQ SCHEMA =============
interface FAQSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= BREADCRUMB SCHEMA =============
interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  if (!items || items.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= PRODUCT SCHEMA (for individual bikes) =============
interface ProductSchemaProps {
  name: string;
  brand: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
  sku?: string;
}

export function ProductSchema({
  name,
  brand,
  description,
  image,
  price,
  currency = 'INR',
  availability = 'InStock',
  rating,
  reviewCount,
  sku,
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: { '@type': 'Brand', name: brand },
    sku: sku || name.toLowerCase().replace(/\s+/g, '-'),
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      seller: ORGANIZATION,
    },
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= WEBSITE SCHEMA =============
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TransRentals',
    url: 'https://transrentals.in',
    description: "India's Largest Vehicle Rental Marketplace",
    publisher: ORGANIZATION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://transrentals.in/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= COMBINED BIKE SERVICE SCHEMA =============
interface BikeServiceSchemaProps {
  serviceName: string;
  serviceSlug: string;
  description: string;
  city?: string;
  citySlug?: string;
  faqs?: Array<{ question: string; answer: string }>;
  vehicles?: Array<{ name: string; brand: string; price: number; image?: string }>;
  priceRange?: { min: number; max: number };
  rating?: number;
  reviewCount?: number;
}

export function BikeServiceSchema({
  serviceName,
  serviceSlug,
  description,
  city,
  citySlug,
  faqs = [],
  vehicles = [],
  priceRange = { min: 299, max: 1499 },
  rating = 4.5,
  reviewCount = 1250,
}: BikeServiceSchemaProps) {
  const baseUrl = 'https://transrentals.in';

  // Build breadcrumbs
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: serviceName, url: `${baseUrl}/${serviceSlug}` },
  ];
  if (city && citySlug) {
    breadcrumbs.push({
      name: `${serviceName} in ${city}`,
      url: `${baseUrl}/${serviceSlug}/${citySlug}`,
    });
  }

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <VehicleRentalSchema
        serviceName={city ? `${serviceName} in ${city}` : serviceName}
        description={description}
        city={city}
        vehicles={vehicles}
        priceRange={priceRange}
      />
      {city && (
        <LocalBusinessSchema
          name={`TransRentals ${serviceName} - ${city}`}
          description={description}
          city={city}
          rating={rating}
          reviewCount={reviewCount}
        />
      )}
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
    </>
  );
}
