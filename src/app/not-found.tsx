import Link from 'next/link';
import { Phone, MessageCircle, ArrowRight, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 md:py-32">
        <div className="container-custom text-center">
          <h1 className="text-8xl md:text-9xl font-bold mb-6 text-white/20">
            404
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Page Not Found
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-gray-50">
        <div className="container-custom">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 text-center">
            Explore Our Services
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Bike Rental',
                desc: 'Rent bikes across India',
                link: '/bike-on-rent',
                icon: '🏍️',
              },
              {
                name: 'Car Rental',
                desc: 'Self-drive & chauffeur cars',
                link: '/car-rental',
                icon: '🚗',
              },
              {
                name: 'One Way Cab',
                desc: 'Drop at different city',
                link: '/one-way-cab',
                icon: '🚕',
              },
              {
                name: 'Bus Rental',
                desc: 'Mini & luxury buses',
                link: '/bus-rental',
                icon: '🚌',
              },
              {
                name: 'Tempo Traveller',
                desc: 'Group travel solutions',
                link: '/tempo-traveller',
                icon: '🚐',
              },
              {
                name: 'Luxury Cars',
                desc: 'Premium vehicles',
                link: '/luxury-car-rental',
                icon: '✨',
              },
            ].map((service) => (
              <Link
                key={service.link}
                href={service.link}
                className="group bg-white border border-gray-200 rounded-lg p-6 hover:border-emerald-500 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">
                  {service.name}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {service.desc}
                </p>
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="py-16 bg-white">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Need Help?
          </h3>
          <p className="text-gray-600 mb-8">
            Our customer support team is available 24/7 to assist you
          </p>
        </div>
      </div>
    </div>
  );
}
