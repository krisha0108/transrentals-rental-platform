'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
}

interface CoverageData {
  locationId: string;
  locationName: string;
  vehicleCoverage: {
    vehicleId: string;
    vehicleName: string;
    hasCityPricing: boolean;
    hasLocalPackages: boolean;
    localPackageCount: number;
    hasOneWayRates: boolean;
    oneWayRateCount: number;
  }[];
  totalVehicles: number;
  configuredVehicles: number;
  completionPercent: number;
}

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

export default function ServiceCoveragePage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, catRes, pricingRes, packagesRes, routesRes] = await Promise.all([
          fetch(`/api/services/${serviceSlug}/locations`),
          fetch(`/api/admin/services/${serviceSlug}/vehicles`),
          fetch(`/api/admin/services/${serviceSlug}/city-pricing`),
          fetch(`/api/admin/services/${serviceSlug}/packages`),
          fetch(`/api/admin/services/${serviceSlug}/routes`),
        ]);

        const locData = await locRes.json();
        const catData = await catRes.json();
        const pricingData = await pricingRes.json();
        const packagesData = await packagesRes.json();
        const routesData = await routesRes.json();

        const locs = locData.locations || [];
        const cats = (catData.categories || []).filter(
          (c: VehicleCategory & { isActive: boolean }) => c.isActive
        );
        const pricing = pricingData.pricing || [];
        const packages = packagesData.packages || [];
        const routes = routesData.routes || [];

        setLocations(locs);
        setVehicleCategories(cats);

        // Calculate coverage for each location
        const coverage: CoverageData[] = locs.map((loc: Location) => {
          const vehicleCoverage = cats.map((cat: VehicleCategory) => {
            const hasCityPricing = pricing.some(
              (p: any) => p.locationId === loc.id && p.vehicleCategoryId === cat.id
            );
            const locationPackages = packages.filter(
              (p: any) =>
                (p.locationId === loc.id || p.locationId === null) && p.vehicleCategoryId === cat.id
            );
            const oneWayRates = routes.filter(
              (r: any) => r.toLocationId === loc.id && r.vehicleCategoryId === cat.id
            );

            return {
              vehicleId: cat.id,
              vehicleName: cat.name,
              hasCityPricing,
              hasLocalPackages: locationPackages.length > 0,
              localPackageCount: locationPackages.length,
              hasOneWayRates: oneWayRates.length > 0,
              oneWayRateCount: oneWayRates.length,
            };
          });

          const configuredVehicles = vehicleCoverage.filter(
            (v: CoverageData['vehicleCoverage'][0]) => v.hasCityPricing
          ).length;
          const completionPercent =
            cats.length > 0 ? Math.round((configuredVehicles / cats.length) * 100) : 0;

          return {
            locationId: loc.id,
            locationName: loc.name,
            vehicleCoverage,
            totalVehicles: cats.length,
            configuredVehicles,
            completionPercent,
          };
        });

        // Sort by completion (incomplete first)
        coverage.sort((a, b) => a.completionPercent - b.completionPercent);
        setCoverageData(coverage);
      } catch (error) {
        console.error('Failed to fetch coverage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceSlug]);

  const getStatusColor = (percent: number) => {
    if (percent === 0) return 'bg-red-100 text-red-800';
    if (percent < 50) return 'bg-orange-100 text-orange-800';
    if (percent < 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusBg = (percent: number) => {
    if (percent === 0) return 'bg-red-500';
    if (percent < 50) return 'bg-orange-500';
    if (percent < 100) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Summary stats
  const totalCities = coverageData.length;
  const fullyCovered = coverageData.filter((c) => c.completionPercent === 100).length;
  const partiallyCovered = coverageData.filter(
    (c) => c.completionPercent > 0 && c.completionPercent < 100
  ).length;
  const notCovered = coverageData.filter((c) => c.completionPercent === 0).length;

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/admin/services/${serviceSlug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {serviceTitle}
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coverage Dashboard - {serviceTitle}</h1>
        <p className="text-gray-600 mt-1">See which cities have complete pricing configuration</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-gray-900">{totalCities}</div>
          <div className="text-sm text-gray-500">Total Cities</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-600">{fullyCovered}</div>
          <div className="text-sm text-gray-500">Fully Configured</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-3xl font-bold text-yellow-600">{partiallyCovered}</div>
          <div className="text-sm text-gray-500">Partially Configured</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-600">{notCovered}</div>
          <div className="text-sm text-gray-500">Not Configured</div>
        </div>
      </div>

      {/* Coverage Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                City
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Coverage
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Vehicles
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coverageData.map((city) => (
              <>
                <tr
                  key={city.locationId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedCity(expandedCity === city.locationId ? null : city.locationId)
                  }
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {expandedCity === city.locationId ? 'v' : '>'}
                      </span>
                      <span className="font-medium text-gray-900">{city.locationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStatusBg(city.completionPercent)}`}
                          style={{ width: `${city.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {city.completionPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">
                      {city.configuredVehicles}/{city.totalVehicles}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(city.completionPercent)}`}
                    >
                      {city.completionPercent === 0 && 'Not Started'}
                      {city.completionPercent > 0 && city.completionPercent < 100 && 'In Progress'}
                      {city.completionPercent === 100 && 'Complete'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/admin/services/${serviceSlug}/bulk-setup?city=${city.locationId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Configure
                    </Link>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedCity === city.locationId && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {city.vehicleCoverage.map((vehicle) => (
                          <div
                            key={vehicle.vehicleId}
                            className={`p-3 rounded-lg border ${
                              vehicle.hasCityPricing
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{vehicle.vehicleName}</div>
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                {vehicle.hasCityPricing ? (
                                  <span className="text-green-600">OK</span>
                                ) : (
                                  <span className="text-red-600">X</span>
                                )}
                                <span className="text-gray-600">Per-km pricing</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {vehicle.hasLocalPackages ? (
                                  <span className="text-green-600">OK</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                                <span className="text-gray-600">
                                  Local packages ({vehicle.localPackageCount})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {vehicle.hasOneWayRates ? (
                                  <span className="text-green-600">OK</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                                <span className="text-gray-600">
                                  One-way routes ({vehicle.oneWayRateCount})
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Complete (100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded" />
          <span>Partial (50-99%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span>Started (1-49%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Not Started (0%)</span>
        </div>
      </div>
    </div>
  );
}
