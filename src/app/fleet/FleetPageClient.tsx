'use client';

import { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { VehicleCard, DynamicVehicle } from '@/components/fleet/VehicleCard';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface Location {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  tier: number;
}

interface FleetPageClientProps {
  categories: Category[];
  locations: Location[];
  vehiclesByCategory: Record<string, DynamicVehicle[]>;
}

// Category display configuration - colors and grid sizes
const categoryConfig: Record<string, { bgColor: string; gridCols: string }> = {
  'bike': { bgColor: 'bg-gradient-to-br from-gray-200 to-gray-300', gridCols: 'md:grid-cols-3 lg:grid-cols-4' },
  'bike-rental': { bgColor: 'bg-gradient-to-br from-gray-200 to-gray-300', gridCols: 'md:grid-cols-3 lg:grid-cols-4' },
  'car': { bgColor: 'bg-gradient-to-br from-blue-200 to-blue-300', gridCols: 'md:grid-cols-3 lg:grid-cols-4' },
  'self-drive-car': { bgColor: 'bg-gradient-to-br from-blue-200 to-blue-300', gridCols: 'md:grid-cols-3 lg:grid-cols-4' },
  'self-drive-car-rentals': { bgColor: 'bg-gradient-to-br from-blue-200 to-blue-300', gridCols: 'md:grid-cols-3 lg:grid-cols-4' },
  'bus': { bgColor: 'bg-gradient-to-br from-yellow-200 to-yellow-300', gridCols: 'md:grid-cols-3' },
  'bus-rental': { bgColor: 'bg-gradient-to-br from-yellow-200 to-yellow-300', gridCols: 'md:grid-cols-3' },
  'tempo-traveller': { bgColor: 'bg-gradient-to-br from-orange-200 to-orange-300', gridCols: 'md:grid-cols-3' },
  'truck-rental': { bgColor: 'bg-gradient-to-br from-red-200 to-red-300', gridCols: 'md:grid-cols-3' },
  'mini-truck-rental': { bgColor: 'bg-gradient-to-br from-amber-200 to-amber-300', gridCols: 'md:grid-cols-3' },
  'luxury-car-rental': { bgColor: 'bg-gradient-to-br from-purple-200 to-purple-300', gridCols: 'md:grid-cols-3' },
  'wedding-car-rental': { bgColor: 'bg-gradient-to-br from-pink-200 to-pink-300', gridCols: 'md:grid-cols-3' },
};

// Get config for a category, with default fallback
function getCategoryConfig(slug: string) {
  // Check direct match first
  if (categoryConfig[slug]) return categoryConfig[slug];

  // Check partial matches
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (slug.includes(key) || key.includes(slug)) return config;
  }

  // Default config
  return { bgColor: 'bg-gradient-to-br from-green-200 to-green-300', gridCols: 'md:grid-cols-3' };
}

export function FleetPageClient({
  categories,
  locations,
  vehiclesByCategory: initialVehiclesByCategory,
}: FleetPageClientProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [vehiclesByCategory, setVehiclesByCategory] = useState<Record<string, DynamicVehicle[]>>(initialVehiclesByCategory);
  const [loading, setLoading] = useState(false);

  // Group locations by tier for better UX
  const metroLocations = locations.filter(l => l.tier === 1);
  const tier2Locations = locations.filter(l => l.tier === 2);
  const tier3Locations = locations.filter(l => l.tier === 3);

  // Fetch vehicles with location-based pricing
  useEffect(() => {
    if (!selectedLocation) {
      // Reset to initial data if no location selected
      setVehiclesByCategory(initialVehiclesByCategory);
      return;
    }

    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/fleet?location=${selectedLocation}`);
        if (response.ok) {
          const vehicles: DynamicVehicle[] = await response.json();

          // Group vehicles by category
          const grouped: Record<string, DynamicVehicle[]> = {};
          categories.forEach(category => {
            grouped[category.id] = vehicles.filter(v => v.category.id === category.id);
          });

          setVehiclesByCategory(grouped);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [selectedLocation, initialVehiclesByCategory, categories]);

  const selectedLocationName = locations.find(l => l.slug === selectedLocation)?.name;

  // Filter categories that have vehicles
  const categoriesWithVehicles = categories.filter(
    category => vehiclesByCategory[category.id] && vehiclesByCategory[category.id].length > 0
  );

  // Check if any vehicles are available
  const totalVehicles = Object.values(vehiclesByCategory).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <>
      {/* Location Selector */}
      <section className="py-8 bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-gray-700">Select Location:</span>
            </div>
            <div className="flex-1 max-w-md">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
              >
                <option value="">All Locations (Base Pricing)</option>
                {metroLocations.length > 0 && (
                  <optgroup label="Metro Cities">
                    {metroLocations.map(loc => (
                      <option key={loc.slug} value={loc.slug}>
                        {loc.name}, {loc.state}
                      </option>
                    ))}
                  </optgroup>
                )}
                {tier2Locations.length > 0 && (
                  <optgroup label="Tier 2 Cities">
                    {tier2Locations.map(loc => (
                      <option key={loc.slug} value={loc.slug}>
                        {loc.name}, {loc.state}
                      </option>
                    ))}
                  </optgroup>
                )}
                {tier3Locations.length > 0 && (
                  <optgroup label="Tier 3 Cities">
                    {tier3Locations.map(loc => (
                      <option key={loc.slug} value={loc.slug}>
                        {loc.name}, {loc.state}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {loading && (
              <RefreshCw className="w-5 h-5 text-primary-600 animate-spin" />
            )}
          </div>
          {selectedLocation && (
            <p className="text-center mt-4 text-sm text-gray-600">
              Showing prices and availability for <span className="font-semibold text-primary-600">{selectedLocationName}</span>
            </p>
          )}
        </div>
      </section>

      {/* Dynamic Category Sections */}
      {categoriesWithVehicles.map((category, index) => {
        const vehicles = vehiclesByCategory[category.id];
        const config = getCategoryConfig(category.slug);
        const isAllIndia = vehicles.some(v => v.availabilityType === 'ALL_INDIA');

        return (
          <section
            key={category.id}
            className={`py-16 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}
          >
            <div className="container-custom">
              <h2 className="text-3xl font-bold mb-8">
                {category.name} ({vehicles.length})
                {selectedLocation && (
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    {isAllIndia ? '- Available All India' : `in ${selectedLocationName}`}
                  </span>
                )}
              </h2>
              <div className={`grid ${config.gridCols} gap-6`}>
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    bgColor={config.bgColor}
                    location={selectedLocation}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Empty State */}
      {totalVehicles === 0 && (
        <section className="py-20">
          <div className="container-custom text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Vehicles Found</h3>
            <p className="text-gray-600">
              {selectedLocation
                ? `No vehicles available in ${selectedLocationName}. Try selecting a different location.`
                : 'No vehicles available at the moment. Please check back later.'}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
