'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  seatingCapacity: number;
}

interface CityPricingData {
  baseKmRate: number;
  minKmPerDay: number;
  driverDayAllowance: number;
  nightSurcharge: number;
}

interface LocalPackageData {
  hours: number;
  kms: number;
  basePrice: number;
  extraKmCharge: number;
  extraHourCharge: number;
}

interface OneWayRateData {
  fromLocationId: string;
  price: number;
  km: number;
}

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

export default function ServiceBulkSetupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;
  const isLuxury = serviceSlug === 'luxury-car-rental';

  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    searchParams.get('city') || ''
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pricing' | 'packages' | 'oneway'>('pricing');

  // City Pricing State (per vehicle category)
  const [cityPricing, setCityPricing] = useState<Record<string, CityPricingData>>({});

  // Local Packages State (per vehicle category)
  const [localPackages, setLocalPackages] = useState<Record<string, LocalPackageData[]>>({});

  // One-Way Rates State (per vehicle category)
  const [oneWayRates, setOneWayRates] = useState<Record<string, OneWayRateData[]>>({});

  // Default package templates
  const defaultPackages: Omit<LocalPackageData, 'basePrice' | 'extraKmCharge' | 'extraHourCharge'>[] =
    [
      { hours: 4, kms: 40 },
      { hours: 8, kms: 80 },
      { hours: 12, kms: 120 },
    ];

  // Default pricing based on service type
  const getDefaultPricing = () => ({
    baseKmRate: isLuxury ? 25 : 12,
    minKmPerDay: 250,
    driverDayAllowance: isLuxury ? 500 : 300,
    nightSurcharge: isLuxury ? 400 : 200,
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, catRes] = await Promise.all([
          fetch(`/api/services/${serviceSlug}/locations`),
          fetch(`/api/admin/services/${serviceSlug}/vehicles`),
        ]);

        const locData = await locRes.json();
        const catData = await catRes.json();

        if (locData.success) setLocations(locData.locations || []);
        if (catData.success) {
          const cats =
            catData.categories?.filter((c: VehicleCategory & { isActive: boolean }) => c.isActive) ||
            [];
          setVehicleCategories(cats);

          // Initialize empty pricing for each category
          const initialPricing: Record<string, CityPricingData> = {};
          const initialPackages: Record<string, LocalPackageData[]> = {};

          cats.forEach((cat: VehicleCategory) => {
            initialPricing[cat.id] = getDefaultPricing();
            initialPackages[cat.id] = defaultPackages.map((p) => ({
              ...p,
              basePrice: 0,
              extraKmCharge: isLuxury ? 20 : 12,
              extraHourCharge: isLuxury ? 200 : 100,
            }));
          });

          setCityPricing(initialPricing);
          setLocalPackages(initialPackages);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceSlug]);

  // Load existing data when location changes
  useEffect(() => {
    if (!selectedLocationId || vehicleCategories.length === 0) return;

    const loadExistingData = async () => {
      setLoading(true);
      try {
        // Fetch existing city pricing
        const pricingRes = await fetch(`/api/admin/services/${serviceSlug}/city-pricing`);
        const pricingData = await pricingRes.json();

        if (pricingData.success) {
          const existingPricing: Record<string, CityPricingData> = {};
          vehicleCategories.forEach((cat) => {
            const existing = pricingData.pricing?.find(
              (p: any) => p.vehicleCategoryId === cat.id && p.locationId === selectedLocationId
            );
            existingPricing[cat.id] = existing
              ? {
                  baseKmRate: existing.baseKmRate,
                  minKmPerDay: existing.minKmPerDay,
                  driverDayAllowance: existing.driverDayAllowance,
                  nightSurcharge: existing.nightSurcharge,
                }
              : getDefaultPricing();
          });
          setCityPricing(existingPricing);
        }

        // Fetch existing local packages
        const packagesRes = await fetch(`/api/admin/services/${serviceSlug}/packages`);
        const packagesData = await packagesRes.json();

        if (packagesData.success) {
          const existingPackages: Record<string, LocalPackageData[]> = {};
          vehicleCategories.forEach((cat) => {
            const catPackages = packagesData.packages?.filter(
              (p: any) =>
                p.vehicleCategoryId === cat.id &&
                (p.locationId === selectedLocationId || p.locationId === null)
            );
            existingPackages[cat.id] = defaultPackages.map((dp) => {
              const existing = catPackages?.find(
                (p: any) => p.hours === dp.hours && p.kms === dp.kms
              );
              return existing
                ? {
                    hours: existing.hours,
                    kms: existing.kms,
                    basePrice: existing.basePrice,
                    extraKmCharge: existing.extraKmCharge,
                    extraHourCharge: existing.extraHourCharge,
                  }
                : {
                    ...dp,
                    basePrice: 0,
                    extraKmCharge: isLuxury ? 20 : 12,
                    extraHourCharge: isLuxury ? 200 : 100,
                  };
            });
          });
          setLocalPackages(existingPackages);
        }

        // Fetch existing one-way rates
        const routesRes = await fetch(`/api/admin/services/${serviceSlug}/routes`);
        const routesData = await routesRes.json();

        if (routesData.success) {
          const existingOneWay: Record<string, OneWayRateData[]> = {};
          vehicleCategories.forEach((cat) => {
            const catRoutes = routesData.routes?.filter(
              (r: any) => r.vehicleCategoryId === cat.id && r.toLocationId === selectedLocationId
            );
            existingOneWay[cat.id] =
              catRoutes?.map((r: any) => ({
                fromLocationId: r.fromLocationId,
                price: r.basePrice,
                km: r.estimatedKm,
              })) || [];
          });
          setOneWayRates(existingOneWay);
        }
      } catch (error) {
        console.error('Failed to load existing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, [selectedLocationId, vehicleCategories, serviceSlug]);

  // Save city pricing
  const saveCityPricing = async () => {
    if (!selectedLocationId) return;

    setSaving(true);
    try {
      for (const [vehicleCategoryId, data] of Object.entries(cityPricing)) {
        if (data.baseKmRate > 0) {
          await fetch(`/api/admin/services/${serviceSlug}/city-pricing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleCategoryId,
              locationId: selectedLocationId,
              ...data,
            }),
          });
        }
      }
      alert('City pricing saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  // Save local packages
  const saveLocalPackages = async () => {
    if (!selectedLocationId) return;

    setSaving(true);
    try {
      for (const [vehicleCategoryId, packages] of Object.entries(localPackages)) {
        for (const pkg of packages) {
          if (pkg.basePrice > 0) {
            await fetch(`/api/admin/services/${serviceSlug}/packages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vehicleCategoryId,
                locationId: selectedLocationId,
                name: `${pkg.hours}hr/${pkg.kms}km`,
                ...pkg,
              }),
            });
          }
        }
      }
      alert('Local packages saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save packages');
    } finally {
      setSaving(false);
    }
  };

  // Save one-way rates
  const saveOneWayRates = async () => {
    if (!selectedLocationId) return;

    setSaving(true);
    try {
      for (const [vehicleCategoryId, rates] of Object.entries(oneWayRates)) {
        for (const rate of rates) {
          if (rate.price > 0 && rate.fromLocationId) {
            await fetch(`/api/admin/services/${serviceSlug}/routes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vehicleCategoryId,
                fromLocationId: rate.fromLocationId,
                toLocationId: selectedLocationId,
                basePrice: rate.price,
                estimatedKm: rate.km,
              }),
            });
          }
        }
      }
      alert('One-way rates saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  // Add one-way rate row
  const addOneWayRate = (vehicleCategoryId: string) => {
    setOneWayRates((prev) => ({
      ...prev,
      [vehicleCategoryId]: [
        ...(prev[vehicleCategoryId] || []),
        { fromLocationId: '', price: isLuxury ? 8000 : 3500, km: 0 },
      ],
    }));
  };

  // Quick fill - apply first vehicle's pricing to all
  const quickFillPricing = () => {
    const firstCat = vehicleCategories[0];
    if (!firstCat || !cityPricing[firstCat.id]) return;

    const basePricing = cityPricing[firstCat.id];
    const multipliers = [1, 1.15, 1.3, 1.5, 1.7]; // Base, +15%, +30%, +50%, +70%

    const newPricing: Record<string, CityPricingData> = {};
    vehicleCategories.forEach((cat, idx) => {
      const mult = multipliers[idx] || multipliers[multipliers.length - 1];
      newPricing[cat.id] = {
        baseKmRate: Math.round(basePricing.baseKmRate * mult),
        minKmPerDay: basePricing.minKmPerDay,
        driverDayAllowance: Math.round(basePricing.driverDayAllowance * mult),
        nightSurcharge: basePricing.nightSurcharge,
      };
    });
    setCityPricing(newPricing);
  };

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  if (loading && !selectedLocationId) {
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
        <h1 className="text-2xl font-bold text-gray-900">Bulk City Setup - {serviceTitle}</h1>
        <p className="text-gray-600 mt-1">Configure all pricing for a city in one place</p>
      </div>

      {/* City Selector */}
      <div
        className={`${isLuxury ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-6`}
      >
        <label
          className={`block text-sm font-medium ${isLuxury ? 'text-amber-900' : 'text-blue-900'} mb-2`}
        >
          Select City to Configure
        </label>
        <select
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          className={`w-full max-w-md px-4 py-2 border ${isLuxury ? 'border-amber-300' : 'border-blue-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">-- Select City --</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {selectedLocationId && (
        <>
          {/* Tabs */}
          <div className="flex border-b mb-6">
            {[
              { id: 'pricing' as const, label: 'Per-Km Pricing', desc: 'Round trip rates' },
              { id: 'packages' as const, label: 'Local Packages', desc: '4hr, 8hr, 12hr' },
              { id: 'oneway' as const, label: 'One-Way Rates', desc: 'Fixed drop rates' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <div>{tab.label}</div>
                <div className="text-xs font-normal text-gray-400">{tab.desc}</div>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Per-Km Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Per-Km Rates for {selectedLocation?.name}
                    </h2>
                    <button
                      onClick={quickFillPricing}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Quick Fill (apply multipliers)
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Vehicle
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Per Km (Rs)
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Min Km/Day
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Driver Allow.
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Night Charge
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vehicleCategories.map((cat) => (
                          <tr key={cat.id}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{cat.name}</div>
                              <div className="text-xs text-gray-500">{cat.seatingCapacity} seats</div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={cityPricing[cat.id]?.baseKmRate || ''}
                                onChange={(e) =>
                                  setCityPricing((prev) => ({
                                    ...prev,
                                    [cat.id]: {
                                      ...prev[cat.id],
                                      baseKmRate: parseFloat(e.target.value) || 0,
                                    },
                                  }))
                                }
                                className="w-20 px-2 py-1 border rounded text-center"
                                placeholder={isLuxury ? '25' : '12'}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={cityPricing[cat.id]?.minKmPerDay || ''}
                                onChange={(e) =>
                                  setCityPricing((prev) => ({
                                    ...prev,
                                    [cat.id]: {
                                      ...prev[cat.id],
                                      minKmPerDay: parseInt(e.target.value) || 250,
                                    },
                                  }))
                                }
                                className="w-20 px-2 py-1 border rounded text-center"
                                placeholder="250"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={cityPricing[cat.id]?.driverDayAllowance || ''}
                                onChange={(e) =>
                                  setCityPricing((prev) => ({
                                    ...prev,
                                    [cat.id]: {
                                      ...prev[cat.id],
                                      driverDayAllowance: parseFloat(e.target.value) || 0,
                                    },
                                  }))
                                }
                                className="w-20 px-2 py-1 border rounded text-center"
                                placeholder={isLuxury ? '500' : '300'}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={cityPricing[cat.id]?.nightSurcharge || ''}
                                onChange={(e) =>
                                  setCityPricing((prev) => ({
                                    ...prev,
                                    [cat.id]: {
                                      ...prev[cat.id],
                                      nightSurcharge: parseFloat(e.target.value) || 0,
                                    },
                                  }))
                                }
                                className="w-20 px-2 py-1 border rounded text-center"
                                placeholder={isLuxury ? '400' : '200'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={saveCityPricing}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save Per-Km Pricing'}
                  </button>
                </div>
              )}

              {/* Local Packages Tab */}
              {activeTab === 'packages' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">
                    Local Packages for {selectedLocation?.name}
                  </h2>

                  {vehicleCategories.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-lg shadow p-4">
                      <h3 className="font-medium text-gray-900 mb-3">{cat.name}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {(localPackages[cat.id] || []).map((pkg, idx) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              {pkg.hours}hr / {pkg.kms}km
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500">Base Price</label>
                                <input
                                  type="number"
                                  value={pkg.basePrice || ''}
                                  onChange={(e) => {
                                    const newPackages = [...(localPackages[cat.id] || [])];
                                    newPackages[idx] = {
                                      ...pkg,
                                      basePrice: parseFloat(e.target.value) || 0,
                                    };
                                    setLocalPackages((prev) => ({ ...prev, [cat.id]: newPackages }));
                                  }}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder={isLuxury ? '3000' : '1500'}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500">Extra/km</label>
                                  <input
                                    type="number"
                                    value={pkg.extraKmCharge || ''}
                                    onChange={(e) => {
                                      const newPackages = [...(localPackages[cat.id] || [])];
                                      newPackages[idx] = {
                                        ...pkg,
                                        extraKmCharge: parseFloat(e.target.value) || 0,
                                      };
                                      setLocalPackages((prev) => ({
                                        ...prev,
                                        [cat.id]: newPackages,
                                      }));
                                    }}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    placeholder={isLuxury ? '20' : '14'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500">Extra/hr</label>
                                  <input
                                    type="number"
                                    value={pkg.extraHourCharge || ''}
                                    onChange={(e) => {
                                      const newPackages = [...(localPackages[cat.id] || [])];
                                      newPackages[idx] = {
                                        ...pkg,
                                        extraHourCharge: parseFloat(e.target.value) || 0,
                                      };
                                      setLocalPackages((prev) => ({
                                        ...prev,
                                        [cat.id]: newPackages,
                                      }));
                                    }}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                    placeholder={isLuxury ? '200' : '150'}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={saveLocalPackages}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save Local Packages'}
                  </button>
                </div>
              )}

              {/* One-Way Rates Tab */}
              {activeTab === 'oneway' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">
                    One-Way Rates TO {selectedLocation?.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Set fixed prices for one-way drops coming to {selectedLocation?.name}
                  </p>

                  {vehicleCategories.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{cat.name}</h3>
                        <button
                          onClick={() => addOneWayRate(cat.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Route
                        </button>
                      </div>

                      {(oneWayRates[cat.id] || []).length === 0 ? (
                        <p className="text-sm text-gray-400">
                          No routes configured. Click "+ Add Route" to add.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(oneWayRates[cat.id] || []).map((rate, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <select
                                value={rate.fromLocationId}
                                onChange={(e) => {
                                  const newRates = [...(oneWayRates[cat.id] || [])];
                                  newRates[idx] = { ...rate, fromLocationId: e.target.value };
                                  setOneWayRates((prev) => ({ ...prev, [cat.id]: newRates }));
                                }}
                                className="flex-1 px-3 py-2 border rounded"
                              >
                                <option value="">Select from city</option>
                                {locations
                                  .filter((l) => l.id !== selectedLocationId)
                                  .map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                      {loc.name}
                                    </option>
                                  ))}
                              </select>
                              <span className="text-gray-400">to</span>
                              <span className="text-gray-600 w-24">{selectedLocation?.name}</span>
                              <input
                                type="number"
                                value={rate.km || ''}
                                onChange={(e) => {
                                  const newRates = [...(oneWayRates[cat.id] || [])];
                                  newRates[idx] = { ...rate, km: parseInt(e.target.value) || 0 };
                                  setOneWayRates((prev) => ({ ...prev, [cat.id]: newRates }));
                                }}
                                className="w-20 px-2 py-2 border rounded"
                                placeholder="km"
                              />
                              <input
                                type="number"
                                value={rate.price || ''}
                                onChange={(e) => {
                                  const newRates = [...(oneWayRates[cat.id] || [])];
                                  newRates[idx] = {
                                    ...rate,
                                    price: parseFloat(e.target.value) || 0,
                                  };
                                  setOneWayRates((prev) => ({ ...prev, [cat.id]: newRates }));
                                }}
                                className="w-24 px-2 py-2 border rounded"
                                placeholder={isLuxury ? 'Rs 8000' : 'Rs 3500'}
                              />
                              <button
                                onClick={() => {
                                  const newRates = (oneWayRates[cat.id] || []).filter(
                                    (_, i) => i !== idx
                                  );
                                  setOneWayRates((prev) => ({ ...prev, [cat.id]: newRates }));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={saveOneWayRates}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save One-Way Rates'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
