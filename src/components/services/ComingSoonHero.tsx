import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Bell, ArrowRight } from 'lucide-react';

interface ComingSoonHeroProps {
  city: string;
  citySlug: string;
  serviceSlug: string;
  serviceName: string;
  themeColor?: string; // tailwind color class e.g. 'emerald' | 'blue'
}

export function ComingSoonHero({
  city,
  citySlug,
  serviceSlug,
  serviceName,
  themeColor = 'emerald',
}: ComingSoonHeroProps) {
  const colorMap: Record<string, { bg: string; text: string; badge: string; btn: string }> = {
    emerald: {
      bg: 'from-emerald-50 to-green-50',
      text: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    blue: {
      bg: 'from-blue-50 to-indigo-50',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const colors = colorMap[themeColor] ?? colorMap.emerald;

  return (
    <section className={`bg-gradient-to-br ${colors.bg} py-20 md:py-28`}>
      <div className="container-custom text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${colors.badge}`}>
            <Clock className="inline w-4 h-4 mr-1" />
            Coming Soon
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {serviceName} in{' '}
          <span className={colors.text}>{city}</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          We&apos;re working hard to bring our{' '}
          <span className="font-semibold">{serviceName}</span> service to{' '}
          <span className="font-semibold">{city}</span>. Check nearby cities
          below where you can book right now!
        </p>

        {/* Info cards */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm">
            <MapPin className={`w-5 h-5 ${colors.text}`} />
            <span className="text-gray-700 font-medium">Expanding to {city} soon</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-sm">
            <Bell className={`w-5 h-5 ${colors.text}`} />
            <span className="text-gray-700 font-medium">Trusted by 1L+ customers</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#nearby-cities"
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-colors ${colors.btn}`}
          >
            View Nearby Cities
            <ArrowRight className="w-5 h-5" />
          </a>
          <Link
            href={`/${serviceSlug}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            Browse All Locations
          </Link>
        </div>
      </div>
    </section>
  );
}
