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

interface RoutePackage {
  id: string;
  vehicleCategoryId: string;
  fromLocationId: string;
  toLocationId: string;
  basePrice: number;
  estimatedKm: number;
  estimatedDuration: string | null;
  tollsEstimate: number;
  isActive: boolean;
  chauffeur_vehicle_categories: { id: string; name: string };
  fromLocation: { id: string; name: string };
  toLocation: { id: string; name: string };
}

interface GroupedRoutes {
  [fromLocationId: string]: {
    fromLocation: Location;
    routes: RoutePackage[];
  };
}

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

export default function ServiceOneWayPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;

  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [routes, setRoutes] = useState<RoutePackage[]>([]);
  const [baseLocationId, setBaseLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFromLocation, setSelectedFromLocation] = useState<string>('');
  const [rates, setRates] = useState<{
    [vehicleCategoryId: string]: { price: number; km: number; duration: string; tolls: number };
  }>({});

  // Fetch locations and vehicle categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, catRes] = await Promise.all([
          fetch(`/api/services/${serviceSlug}/locations`),
          fetch(`/api/admin/services/${serviceSlug}/vehicles`),
        ]);

        const locData = await locRes.json();
        const catData = await catRes.json();

        if (locData.success) {
          setLocations(locData.locations || []);
        }
        if (catData.success) {
          setVehicleCategories(catData.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceSlug]);

  // Fetch routes when base location changes
  useEffect(() => {
    if (!baseLocationId) {
      setRoutes([]);
      return;
    }

    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/services/${serviceSlug}/routes`);
        const data = await res.json();

        if (data.success) {
          // Filter routes where toLocation is the base location
          const filtered = (data.routes || []).filter(
            (r: RoutePackage) => r.toLocationId === baseLocationId
          );
          setRoutes(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [baseLocationId, serviceSlug]);

  // Group routes by fromLocation
  const groupedRoutes: GroupedRoutes = routes.reduce((acc, route) => {
    if (!acc[route.fromLocationId]) {
      acc[route.fromLocationId] = {
        fromLocation: route.fromLocation as Location,
        routes: [],
      };
    }
    acc[route.fromLocationId].routes.push(route);
    return acc;
  }, {} as GroupedRoutes);

  // Get available "from" locations (exclude base location and already added)
  const availableFromLocations = locations.filter(
    (loc) => loc.id !== baseLocationId && !groupedRoutes[loc.id]
  );

  // Open modal to add new from location
  const openAddModal = () => {
    setSelectedFromLocation('');
    setRates({});
    // Initialize rates for all vehicle categories with default pricing
    const initialRates: typeof rates = {};
    vehicleCategories.forEach((cat) => {
      initialRates[cat.id] = {
        price: serviceSlug === 'luxury-car-rental' ? 8000 : 3500,
        km: 0,
        duration: '',
        tolls: 0,
      };
    });
    setRates(initialRates);
    setShowModal(true);
  };

  // Open modal to edit existing routes
  const openEditModal = (fromLocationId: string) => {
    setSelectedFromLocation(fromLocationId);
    const existingRates: typeof rates = {};

    // Initialize with existing data
    vehicleCategories.forEach((cat) => {
      const existingRoute = routes.find(
        (r) => r.fromLocationId === fromLocationId && r.vehicleCategoryId === cat.id
      );
      existingRates[cat.id] = {
        price: existingRoute?.basePrice || (serviceSlug === 'luxury-car-rental' ? 8000 : 3500),
        km: existingRoute?.estimatedKm || 0,
        duration: existingRoute?.estimatedDuration || '',
        tolls: existingRoute?.tollsEstimate || 0,
      };
    });

    setRates(existingRates);
    setShowModal(true);
  };

  // Save rates
  const handleSave = async () => {
    if (!selectedFromLocation || !baseLocationId) {
      alert('Please select a from location');
      return;
    }

    setSaving(true);
    try {
      // Save each vehicle category rate
      for (const [vehicleCategoryId, rateData] of Object.entries(rates)) {
        if (rateData.price > 0) {
          await fetch(`/api/admin/services/${serviceSlug}/routes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleCategoryId,
              fromLocationId: selectedFromLocation,
              toLocationId: baseLocationId,
              basePrice: rateData.price,
              estimatedKm: rateData.km,
              estimatedDuration: rateData.duration || null,
              tollsEstimate: rateData.tolls,
              isActive: true,
            }),
          });
        }
      }

      // Refresh routes
      const res = await fetch(`/api/admin/services/${serviceSlug}/routes`);
      const data = await res.json();
      if (data.success) {
        const filtered = (data.routes || []).filter(
          (r: RoutePackage) => r.toLocationId === baseLocationId
        );
        setRoutes(filtered);
      }

      setShowModal(false);
    } catch (error) {
      console.error('Failed to save rates:', error);
      alert('Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  // Delete all routes from a location
  const handleDeleteFromLocation = async (fromLocationId: string) => {
    if (!confirm('Delete all rates from this location?')) return;

    try {
      const routesToDelete = routes.filter((r) => r.fromLocationId === fromLocationId);
      for (const route of routesToDelete) {
        await fetch(`/api/admin/services/${serviceSlug}/routes?id=${route.id}`, {
          method: 'DELETE',
        });
      }

      setRoutes(routes.filter((r) => r.fromLocationId !== fromLocationId));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete');
    }
  };

  const baseLocation = locations.find((l) => l.id === baseLocationId);

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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            One-Way Rates - {serviceTitle}
          </h1>
          <p className="text-gray-600 mt-1">
            Set fixed prices for one-way trips TO your base city
          </p>
        </div>
      </div>

      {/* Base Location Selector */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          Select Your Base Location (Destination City)
        </label>
        <select
          value={baseLocationId}
          onChange={(e) => setBaseLocationId(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select Base City --</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        {baseLocation && (
          <p className="mt-2 text-sm text-blue-700">
            Showing one-way rates for trips ending in <strong>{baseLocation.name}</strong>
          </p>
        )}
      </div>

      {!baseLocationId ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Select a base location to manage one-way rates</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Add From Location Button */}
          <div className="mb-6">
            <button
              onClick={openAddModal}
              disabled={availableFromLocations.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              + Add From Location
            </button>
            {availableFromLocations.length === 0 && (
              <span className="ml-3 text-sm text-gray-500">All locations have been added</span>
            )}
          </div>

          {/* Routes Table */}
          {Object.keys(groupedRoutes).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No one-way rates configured yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Add From Location" to add rates
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      From Location
                    </th>
                    {vehicleCategories.map((cat) => (
                      <th
                        key={cat.id}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                      >
                        {cat.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.values(groupedRoutes).map(({ fromLocation, routes: locationRoutes }) => (
                    <tr key={fromLocation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{fromLocation.name}</div>
                        <div className="text-sm text-gray-500">to {baseLocation?.name}</div>
                      </td>
                      {vehicleCategories.map((cat) => {
                        const route = locationRoutes.find((r) => r.vehicleCategoryId === cat.id);
                        return (
                          <td key={cat.id} className="px-4 py-4 text-center">
                            {route ? (
                              <div>
                                <div className="font-semibold text-gray-900">
                                  Rs{route.basePrice.toLocaleString()}
                                </div>
                                {route.estimatedKm > 0 && (
                                  <div className="text-xs text-gray-500">{route.estimatedKm} km</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => openEditModal(fromLocation.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFromLocation(fromLocation.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">How One-Way Pricing Works</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                * Customer selects pickup city (e.g., Vadodara) to Drop city ({baseLocation?.name})
              </li>
              <li>* System shows fixed rate based on vehicle category selected</li>
              <li>* Rates are inclusive - set the final price you want to charge</li>
              <li>* GST (5%) will be added at checkout</li>
            </ul>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {selectedFromLocation ? 'Edit Rates' : 'Add From Location'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Set one-way rates to {baseLocation?.name}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* From Location Selector (only for new) */}
              {!selectedFromLocation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Location (Pickup City)
                  </label>
                  <select
                    value={selectedFromLocation}
                    onChange={(e) => setSelectedFromLocation(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select City --</option>
                    {availableFromLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedFromLocation && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Route:{' '}
                  <strong>{locations.find((l) => l.id === selectedFromLocation)?.name}</strong>
                  {' to '}
                  <strong>{baseLocation?.name}</strong>
                </div>
              )}

              {/* Rates per Vehicle Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rates by Vehicle Category
                </label>
                <div className="space-y-4">
                  {vehicleCategories.map((cat) => (
                    <div key={cat.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="font-medium text-gray-900 mb-3">{cat.name}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Price (Rs)</label>
                          <input
                            type="number"
                            value={rates[cat.id]?.price || ''}
                            onChange={(e) =>
                              setRates({
                                ...rates,
                                [cat.id]: {
                                  ...rates[cat.id],
                                  price: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="3500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Distance (km)</label>
                          <input
                            type="number"
                            value={rates[cat.id]?.km || ''}
                            onChange={(e) =>
                              setRates({
                                ...rates,
                                [cat.id]: {
                                  ...rates[cat.id],
                                  km: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="120"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Duration</label>
                          <input
                            type="text"
                            value={rates[cat.id]?.duration || ''}
                            onChange={(e) =>
                              setRates({
                                ...rates,
                                [cat.id]: {
                                  ...rates[cat.id],
                                  duration: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="2.5 hrs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tolls (Rs)</label>
                          <input
                            type="number"
                            value={rates[cat.id]?.tolls || ''}
                            onChange={(e) =>
                              setRates({
                                ...rates,
                                [cat.id]: {
                                  ...rates[cat.id],
                                  tolls: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="250"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedFromLocation}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Rates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
