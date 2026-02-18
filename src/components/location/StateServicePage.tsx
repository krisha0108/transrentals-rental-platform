import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import type { IndianState } from '@/data/indian-cities';

interface StateServicePageProps {
  state: IndianState;
  activeCities: Array<{ name: string; slug: string; tier?: number }>;
  serviceSlug: string;
  serviceName: string;
}

const TIER_LABELS: Record<number, string> = {
  1: 'Metro',
  2: 'Major City',
  3: 'Large City',
  4: 'City',
  5: 'Town',
};

export function StateServicePage({ state, activeCities, serviceSlug, serviceName }: StateServicePageProps) {
  const cityNames = activeCities.map(c => c.name).join(', ');
  const count = activeCities.length;

  const faqs = [
    {
      question: `Which cities in ${state.name} have ${serviceName}?`,
      answer: `${serviceName} is currently available in ${count} ${count === 1 ? 'city' : 'cities'} in ${state.name}: ${cityNames}. Select your city above to see pricing, packages, and book instantly.`,
    },
    {
      question: `How do I book ${serviceName} in ${state.name}?`,
      answer: `Click on your city from the grid above to go to the ${state.name} city page, then search for available options and book directly online.`,
    },
    {
      question: `Is ${serviceName} available across all of ${state.name}?`,
      answer: `We're actively expanding in ${state.name}. Currently available in ${cityNames}. More cities coming soon.`,
    },
    {
      question: `What is the price of ${serviceName} in ${state.name}?`,
      answer: `Pricing varies by city and vehicle type. Select your city from the list above to see real-time rates and available packages in your area.`,
    },
  ];

  const itemListElements = activeCities.map((city, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: `${serviceName} in ${city.name}`,
    url: `https://transrentals.in/${serviceSlug}/${city.slug}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${serviceName} in ${state.name}`,
    description: `Available cities for ${serviceName} in ${state.name}`,
    numberOfItems: count,
    itemListElement: itemListElements,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container-custom py-3">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <Link href={`/${serviceSlug}`} className="hover:text-primary">{serviceName}</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{state.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-16">
          <div className="container-custom text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <MapPin className="w-4 h-4" />
              Available in {count} {count === 1 ? 'city' : 'cities'}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {serviceName} in {state.name}
            </h1>
            <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
              {serviceName} in {state.name} is available across {count} {count === 1 ? 'city' : 'cities'}.
              Choose your city below to see prices, packages, and book instantly.
            </p>
          </div>
        </section>

        {/* Cities Grid */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full mb-4">
                <Building2 className="w-4 h-4" />
                Select Your City
              </span>
              <h2 className="text-3xl font-bold text-gray-900">
                Cities in {state.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {activeCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/${serviceSlug}/${city.slug}`}
                  className="group bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {city.name}
                      </p>
                      {city.tier && (
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          {TIER_LABELS[city.tier] ?? 'City'}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                  <div className="mt-3">
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full group-hover:bg-indigo-100 transition-colors">
                      Book Now
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Content */}
        <section className="py-12 bg-gray-50">
          <div className="container-custom max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About {serviceName} in {state.name}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {serviceName} in {state.name} is available across {count} {count === 1 ? 'city' : 'cities'}.
              Choose your city below to see prices, packages, and book instantly.
              TransRentals partners with verified operators across {state.name} to ensure reliable,
              affordable service wherever you need it.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Currently serving: {cityNames}.
              We are continuously expanding our network across {state.name} — check back soon for more cities.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="container-custom max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none">
                    <span>{faq.question}</span>
                    <span className="ml-4 text-indigo-600 flex-shrink-0 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
