import React from 'react';

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://transrentals.in/#organization',
  name: 'TransRentals',
  alternateName: ['Trans Rentals', 'TransRentals.in', 'Transrentals'],
  description: 'TransRentals is India\'s vehicle rental marketplace offering car rental, self-drive cars, bike rental, bus rental, tempo traveller rental, mini truck rental, packers and movers, equipment rental (JCB, crane, excavator, hydra), and generator rental across 250+ cities in India.',
  url: 'https://transrentals.in',
  foundingDate: '2022',
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  logo: {
    '@type': 'ImageObject',
    url: 'https://transrentals.in/images/logo.png',
    width: 200,
    height: 60,
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9737965551',
    email: 'book@transrentals.in',
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '215, Galaxy Business, 2nd Floor, SP Ring Road',
    addressLocality: 'Ahmedabad',
    addressRegion: 'Gujarat',
    postalCode: '382350',
    addressCountry: 'IN',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Vehicle and Equipment Rental Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Car Rental', description: 'Self-drive and chauffeur-driven car rental across India' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bike Rental', description: 'Honda Activa, Royal Enfield, KTM and all bikes on rent' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bus Rental', description: 'Mini bus, tempo traveller and luxury bus rental for group travel' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mini Truck Rental', description: 'Tata Ace and mini truck rental for goods transport and house shifting' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Packers and Movers', description: 'House shifting and relocation services across India' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Equipment Rental', description: 'JCB, crane, excavator, hydra crane and construction equipment rental' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Generator Rental', description: 'Diesel generator and DG set rental for events and construction' } },
    ],
  },
  sameAs: [
    'https://www.facebook.com/transrentals',
    'https://www.instagram.com/transrentals',
    'https://twitter.com/transrentals',
    'https://www.linkedin.com/company/transrentals',
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
  serviceSlug?: string;
}

export function LocalBusinessSchema({
  name,
  description,
  city,
  state = '',
  address,
  telephone = '+91-9737965551',
  priceRange = '₹₹',
  image,
  rating,
  reviewCount,
  geo,
  serviceSlug = 'bike-on-rent',
}: LocalBusinessSchemaProps) {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://transrentals.in/${serviceSlug}/${citySlug}/#localbusiness`,
    name,
    description,
    url: `https://transrentals.in/${serviceSlug}/${citySlug}`,
    telephone,
    priceRange,
    image: image || 'https://transrentals.in/images/og-image.jpg',
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
  serviceSlug?: string;
  vehicles?: Array<{
    name: string;
    brand: string;
    price: number;
    image?: string;
  }>;
  priceRange?: { min: number; max: number };
  rating?: number;
  reviewCount?: number;
}

export function VehicleRentalSchema({
  serviceName,
  description,
  city,
  serviceSlug = 'bike-on-rent',
  vehicles = [],
  priceRange,
  rating,
  reviewCount,
}: VehicleRentalSchemaProps) {
  const citySlug = city ? city.toLowerCase().replace(/\s+/g, '-') : null;
  const baseUrl = citySlug
    ? `https://transrentals.in/${serviceSlug}/${citySlug}`
    : `https://transrentals.in/${serviceSlug}`;

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
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(vehicles.length > 0 && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${serviceName} - Available Vehicles`,
        itemListElement: vehicles.slice(0, 10).map((vehicle) => ({
          '@type': 'Offer',
          price: vehicle.price,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          seller: ORGANIZATION,
          itemOffered: {
            '@type': 'Product',
            name: vehicle.name,
            description: `Rent ${vehicle.name} in ${city || 'India'}. Book online at TransRentals.`,
            brand: { '@type': 'Brand', name: vehicle.brand },
            image: vehicle.image || 'https://transrentals.in/images/og-image.jpg',
          },
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

// ============= PRODUCT SCHEMA =============
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

// ============= HOW TO SCHEMA =============
interface HowToSchemaProps {
  name: string;
  description?: string;
  steps: Array<{
    name: string;
    text: string;
    image?: string;
  }>;
  totalTime?: string;
}

export function HowToSchema({ name, description, steps, totalTime }: HowToSchemaProps) {
  if (!steps || steps.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    ...(description && { description }),
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= ARTICLE SCHEMA =============
interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrl?: string;
  publisherName?: string;
  publisherLogo?: string;
  keywords?: string[];
}

export function ArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  publisherName = 'TransRentals',
  publisherLogo = 'https://transrentals.in/images/logo.png',
  keywords = [],
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    image: {
      '@type': 'ImageObject',
      url: image,
      width: 1200,
      height: 630,
    },
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
        width: 200,
        height: 60,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(keywords.length > 0 && { keywords: keywords.join(', ') }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============= WEB PAGE SCHEMA =============
interface WebPageSchemaProps {
  name: string;
  description: string;
  url: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'FAQPage' | 'CollectionPage';
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function WebPageSchema({
  name,
  description,
  url,
  type = 'WebPage',
  breadcrumbs,
}: WebPageSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TransRentals',
      url: 'https://transrentals.in',
    },
    publisher: ORGANIZATION,
    ...(breadcrumbs && breadcrumbs.length > 0 && {
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url,
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

// ============= ITEM LIST SCHEMA =============
interface ItemListSchemaProps {
  name: string;
  description?: string;
  url: string;
  items: Array<{
    name: string;
    url: string;
    image?: string;
    description?: string;
  }>;
}

export function ItemListSchema({ name, description, url, items }: ItemListSchemaProps) {
  if (!items || items.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description && { description }),
    url,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
      ...(item.description && { description: item.description }),
    })),
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
  rating,
  reviewCount,
}: BikeServiceSchemaProps) {
  const baseUrl = 'https://transrentals.in';

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
        serviceName={serviceName}
        description={description}
        city={city}
        serviceSlug={serviceSlug}
        vehicles={vehicles}
        priceRange={priceRange}
        rating={rating}
        reviewCount={reviewCount}
      />
      {city && (
        <LocalBusinessSchema
          name={`TransRentals ${serviceName} - ${city}`}
          description={description}
          city={city}
          serviceSlug={serviceSlug}
          rating={rating}
          reviewCount={reviewCount}
        />
      )}
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RouteSchema — Trip structured data for one-way-cab and airport-transfer pages
// ─────────────────────────────────────────────────────────────────────────────

interface RouteSchemaProps {
  fromCity: string;
  toCity: string;
  distance?: number;
  estimatedTime?: string;
  minPrice?: number;
  maxPrice?: number;
  pageUrl: string;
  serviceType?: 'one-way-cab' | 'airport-transfer' | 'round-trip';
}

export function RouteSchema({
  fromCity,
  toCity,
  distance,
  estimatedTime,
  minPrice,
  maxPrice,
  pageUrl,
  serviceType = 'one-way-cab',
}: RouteSchemaProps) {
  const serviceLabel =
    serviceType === 'airport-transfer'
      ? 'Airport Transfer'
      : serviceType === 'round-trip'
      ? 'Round Trip Cab'
      : 'One Way Cab';

  const descParts = [`${serviceLabel} from ${fromCity} to ${toCity}`];
  if (distance) descParts.push(`${distance} km`);
  if (estimatedTime) descParts.push(estimatedTime);
  if (minPrice) descParts.push(`starting from ₹${minPrice}`);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    name: `${fromCity} to ${toCity} ${serviceLabel}`,
    description: descParts.join('. '),
    departureLocation: {
      '@type': 'Place',
      name: fromCity,
      address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    },
    arrivalLocation: {
      '@type': 'Place',
      name: toCity,
      address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    },
    provider: ORGANIZATION,
  };

  if (minPrice) {
    schema.offers = {
      '@type': 'AggregateOffer',
      lowPrice: minPrice,
      ...(maxPrice ? { highPrice: maxPrice } : {}),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AutoRentalSchema — schema.org/AutoRental (subtype of LocalBusiness)
// No Indian car-rental competitor uses this type — first-mover rich-result advantage
// ─────────────────────────────────────────────────────────────────────────────

interface AutoRentalSchemaProps {
  name: string;
  description: string;
  city: string;
  citySlug: string;
  serviceSlug?: string;
  vehicleTypes?: string[];
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
}

export function AutoRentalSchema({
  name,
  description,
  city,
  citySlug,
  serviceSlug = 'car-rental',
  vehicleTypes = ['Car', 'SUV', 'Hatchback', 'Sedan'],
  priceRange = '₹₹',
  rating,
  reviewCount,
}: AutoRentalSchemaProps) {
  const offerLowPrice = serviceSlug === 'self-drive-car-rentals' ? 899 : 999;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name,
    description,
    url: `https://transrentals.in/${serviceSlug}/${citySlug}`,
    priceRange,
    areaServed: { '@type': 'City', name: city, addressCountry: 'IN' },
    provider: ORGANIZATION,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: offerLowPrice,
      highPrice: 9999,
      offerCount: vehicleTypes.length * 10,
    },
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    vehicleType: vehicleTypes.join(', '),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '06:00',
        closes: '23:00',
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
