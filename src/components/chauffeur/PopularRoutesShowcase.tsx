'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Car, Users, Clock } from 'lucide-react';

interface RoutePackage {
  id: string;
  vehicleCategoryId: string;
  fromLocationId: string;
  toLocationId: string;
  basePrice: number;
  estimatedKm: number;
  estimatedDuration: string | null;
  isPopular: boolean;
  vehicleCategory: { id: string; name: string; slug: string };
  fromLocation: { id: string; name: string; slug: string };
  toLocation: { id: string; name: string; slug: string };
}

interface GroupedRoute {
  fromLocation: { id: string; name: string; slug: string };
  toLocation: { id: string; name: string; slug: string };
  estimatedKm: number;
  estimatedDuration: string | null;
  lowestPrice: number;
  vehicles: {
    categoryId: string;
    categoryName: string;
    price: number;
  }[];
}

interface PopularRoutesShowcaseProps {
  citySlug?: string; // Optional - filter by origin city
  limit?: number;
  title?: string;
  showViewAll?: boolean;
}

export function PopularRoutesShowcase({
  citySlug,
  limit = 6,
  title = 'Popular Routes',
  showViewAll = true,
}: PopularRoutesShowcaseProps) {
  const [routes, setRoutes] = useState<GroupedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch('/api/admin/chauffeur/routes');
        const data = await res.json();

        if (data.success && data.routes) {
          // Filter by city if provided
          let filteredRoutes = data.routes.filter((r: RoutePackage) => r.isPopular);

          if (citySlug) {
            filteredRoutes = filteredRoutes.filter(
              (r: RoutePackage) => r.fromLocation.slug === citySlug
            );
          }

          // Group routes by from-to combination
          const routeMap = new Map<string, GroupedRoute>();

          filteredRoutes.forEach((route: RoutePackage) => {
            const key = `${route.fromLocationId}-${route.toLocationId}`;

            if (!routeMap.has(key)) {
              routeMap.set(key, {
                fromLocation: route.fromLocation,
                toLocation: route.toLocation,
                estimatedKm: route.estimatedKm,
                estimatedDuration: route.estimatedDuration,
                lowestPrice: route.basePrice,
                vehicles: [],
              });
            }

            const existing = routeMap.get(key)!;
            existing.vehicles.push({
              categoryId: route.vehicleCategory.id,
              categoryName: route.vehicleCategory.name,
              price: route.basePrice,
            });

            if (route.basePrice < existing.lowestPrice) {
              existing.lowestPrice = route.basePrice;
            }
          });

          // Convert to array and sort by popularity (most vehicles = more popular)
          const groupedRoutes = Array.from(routeMap.values())
            .sort((a, b) => b.vehicles.length - a.vehicles.length)
            .slice(0, limit);

          setRoutes(groupedRoutes);
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [citySlug, limit]);

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (routes.length === 0) {
    return null; // Don't show section if no popular routes
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-1">Book popular outstation routes at best prices</p>
          </div>
          {showViewAll && (
            <Link
              href="/chauffeur-service"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm hidden md:block"
            >
              View All Routes →
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route, idx) => (
            <div
              key={`${route.fromLocation.id}-${route.toLocation.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
            >
              {/* Route Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{route.fromLocation.name}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">{route.toLocation.name}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-emerald-100">
                  <span>{route.estimatedKm} km</span>
                  {route.estimatedDuration && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.estimatedDuration}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Vehicle Options */}
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-3">Available vehicles:</div>
                <div className="space-y-2">
                  {route.vehicles.slice(0, 3).map((vehicle) => (
                    <div
                      key={vehicle.categoryId}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{vehicle.categoryName}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ₹{vehicle.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={`/chauffeur-service/${route.fromLocation.slug}?to=${route.toLocation.slug}`}
                  className="block mt-4 w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-2 rounded-lg transition"
                >
                  Book Now from ₹{route.lowestPrice.toLocaleString()}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {showViewAll && (
          <div className="text-center mt-8 md:hidden">
            <Link
              href="/chauffeur-service"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition"
            >
              View All Routes
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
