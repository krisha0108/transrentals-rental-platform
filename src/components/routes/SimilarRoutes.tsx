import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';

interface RouteInfo {
  fromCity?: string;
  fromSlug?: string;
  toCity?: string;
  toSlug?: string;
  distance: number;
  estimatedTime?: string | null;
  price: number;
  vehicleType: string;
}

interface SimilarRoutesProps {
  fromCity: string;
  fromSlug: string;
  toCity: string;
  toSlug: string;
  similarFrom: RouteInfo[];
  similarTo: RouteInfo[];
}

export function SimilarRoutes({
  fromCity,
  fromSlug,
  toCity,
  toSlug,
  similarFrom,
  similarTo,
}: SimilarRoutesProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        {/* Similar Routes FROM Same City */}
        {similarFrom.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-2">
              Popular Routes from {fromCity}
            </h2>
            <p className="text-gray-600 mb-8">
              Other destinations you can travel to from {fromCity}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarFrom.map((route) => (
                <Link
                  key={route.toSlug}
                  href={`/one-way-cab/${fromSlug}-to-${route.toSlug}`}
                  className="block bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{fromCity}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-emerald-600 my-1" />
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">{route.toCity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">₹{route.price}</p>
                      <p className="text-xs text-gray-500">starting</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                    <span>{route.distance} km</span>
                    {route.estimatedTime && <span>{route.estimatedTime}</span>}
                    <span className="text-emerald-600 group-hover:translate-x-1 transition">
                      Book →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href={`/one-way-cab/${fromSlug}`}
                className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:gap-3 transition-all"
              >
                View all routes from {fromCity}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}

        {/* Similar Routes TO Same City */}
        {similarTo.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Popular Routes to {toCity}
            </h2>
            <p className="text-gray-600 mb-8">
              Other cities from where you can travel to {toCity}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarTo.map((route) => (
                <Link
                  key={route.fromSlug}
                  href={`/one-way-cab/${route.fromSlug}-to-${toSlug}`}
                  className="block bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-lg transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">{route.fromCity}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-600 my-1" />
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{toCity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₹{route.price}</p>
                      <p className="text-xs text-gray-500">starting</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-blue-100">
                    <span>{route.distance} km</span>
                    {route.estimatedTime && <span>{route.estimatedTime}</span>}
                    <span className="text-blue-600 group-hover:translate-x-1 transition">
                      Book →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href={`/one-way-cab/to-${toSlug}`}
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
              >
                View all routes to {toCity}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
