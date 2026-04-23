import Link from 'next/link';
import { Clock, Car, ArrowRight, MapPin } from 'lucide-react';

interface OneWayCabComingSoonProps {
  label: string;        // e.g. "Ambala to Pune" or "Bikaner"
  slug: string;
}

export function OneWayCabComingSoon({ label, slug }: OneWayCabComingSoonProps) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
            <a href="/" className="hover:text-primary">Home</a>
            <span className="mx-2">/</span>
            <a href="/one-way-cab" className="hover:text-primary">One Way Cab</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{label}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-20 md:py-28">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
              <Clock className="inline w-4 h-4 mr-1" />
              Coming Soon
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <Car className="w-10 h-10 text-orange-500" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {label} — One Way Cab
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            We&apos;re adding this one way cab route very soon. Our team is verifying
            pricing and driver availability for this route. Check out other available
            routes below!
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span className="text-gray-700 font-medium">Route launching soon</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-gray-700 font-medium">No return fare charged</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/one-way-cab"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              Browse All One Way Routes
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
            Why Choose TransRentals for One Way Cabs?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💰', title: 'No Return Fare', desc: 'Pay only for one direction' },
              { icon: '🚗', title: 'Top Vehicles', desc: 'Sedan, SUV, Innova & more' },
              { icon: '👨‍✈️', title: 'Pro Drivers', desc: 'Verified & experienced' },
              { icon: '📱', title: 'Easy Booking', desc: 'Book in under 2 minutes' },
            ].map((f) => (
              <div key={f.title} className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://transrentals.in' },
              { '@type': 'ListItem', position: 2, name: 'One Way Cab', item: 'https://transrentals.in/one-way-cab' },
              { '@type': 'ListItem', position: 3, name: label, item: `https://transrentals.in/one-way-cab/${slug}` },
            ],
          }),
        }}
      />
    </>
  );
}
