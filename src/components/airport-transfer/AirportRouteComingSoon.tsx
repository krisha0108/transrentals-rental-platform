import Link from 'next/link';
import { Clock, Plane, ArrowRight, MapPin } from 'lucide-react';

interface AirportRouteComingSoonProps {
  fromLabel: string;
  toLabel: string;
  slug: string;
}

export function AirportRouteComingSoon({ fromLabel, toLabel, slug }: AirportRouteComingSoonProps) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/airport-transfer" className="hover:text-primary">Airport Transfer</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{fromLabel} to {toLabel}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20 md:py-28">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
              <Clock className="inline w-4 h-4 mr-1" />
              Coming Soon
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <Plane className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{fromLabel}</p>
            </div>
            <ArrowRight className="w-8 h-8 text-blue-400 flex-shrink-0" />
            <div className="text-center">
              <Plane className="w-10 h-10 text-blue-600 mx-auto mb-2 rotate-90" />
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{toLabel}</p>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {fromLabel} to {toLabel} Airport Transfer
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            We&apos;re setting up this airport transfer route. Our team is verifying pricing,
            routes, and driver availability for this corridor — it will be live very soon!
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">Route launching soon</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">45 min free wait on all pickups</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/airport-transfer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Browse All Airport Routes
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Why TransRentals */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Why Choose TransRentals for Airport Transfers?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '⏱️', title: '45 Min Free Wait', desc: 'No stress if your flight is late' },
              { icon: '✈️', title: 'Flight Tracking', desc: 'We monitor your flight live' },
              { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges, ever' },
              { icon: '🚗', title: 'Clean Vehicles', desc: 'Sanitized cars for every ride' },
            ].map((f) => (
              <div key={f.title} className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'Airport Transfer', item: 'https://transrentals.in/airport-transfer' },
              { '@type': 'ListItem', position: 3, name: `${fromLabel} to ${toLabel}`, item: `https://transrentals.in/airport-transfer/${slug}` },
            ],
          }),
        }}
      />
    </>
  );
}
