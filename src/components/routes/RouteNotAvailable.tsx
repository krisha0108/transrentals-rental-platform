import Link from 'next/link';
import { MapPin, ArrowRight, AlertCircle } from 'lucide-react';

interface RouteNotAvailableProps {
  fromCity: string;
  toCity: string;
  fromSlug?: string;
  toSlug?: string;
}

export function RouteNotAvailable({
  fromCity,
  toCity,
  fromSlug,
  toSlug
}: RouteNotAvailableProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16">
      <div className="container-custom max-w-4xl">
        {/* Not Available Message */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Route Not Available
          </h1>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-lg text-gray-600">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold">{fromCity}</span>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="flex items-center gap-2 text-lg text-gray-600">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold">{toCity}</span>
            </div>
          </div>

          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We currently don't have one-way cab service from {fromCity} to {toCity}.
            But don't worry! You can still book this route by requesting a custom quote.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <a
              href={`/contact?from=${fromSlug}&to=${toSlug}&service=one-way-cab`}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition"
            >
              📝 Request Custom Quote
            </a>
            <a
              href="tel:+919737965551"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              📞 Call: +91 97379 65551
            </a>
          </div>

          <p className="text-sm text-gray-500">
            Our team will get back to you within 2 hours with the best pricing
          </p>
        </div>

        {/* Alternative Options */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Try Similar Routes
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Check out our popular one-way cab routes
            </p>
            <Link
              href="/one-way-cab"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all"
            >
              View All Routes
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Consider Round Trip
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Round trip packages may be more economical
            </p>
            <Link
              href="/outstation-cab"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
            >
              Explore Round Trips
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
