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

interface PricingResult {
  success: boolean;
  tripType: string;
  pricingMethod?: string;
  pricing?: {
    grandTotal: number;
    totalBeforeGst: number;
    gst: number;
    baseKmCharge?: number;
    driverAllowance?: number;
    tollEstimate?: number;
    nightCharge?: number;
    statePermitCharge?: number;
    basePrice?: number;
    extraKmCharge?: number;
    extraHourCharge?: number;
  };
  calculation?: {
    days: number;
    actualKm: number;
    chargeableKm: number;
    perKmRate: number;
    minKmPerDay: number;
  };
  route?: {
    from: { name: string };
    to: { name: string };
    oneWayDistance: number;
  };
  routePackage?: {
    basePrice: number;
    estimatedKm: number;
  };
  package?: {
    name: string;
    hours: number;
    kms: number;
    basePrice: number;
  };
  inclusions?: {
    tollsIncluded: boolean;
    parkingIncluded: boolean;
    statePermitIncluded: boolean;
  };
  notes?: string[];
  error?: string;
  suggestion?: string;
}

const SERVICE_TITLES: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
};

export default function ServicePriceTesterPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const serviceTitle = SERVICE_TITLES[serviceSlug] || serviceSlug;
  const isLuxury = serviceSlug === 'luxury-car-rental';

  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [localPackages, setLocalPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [tripType, setTripType] = useState<'local' | 'one_way' | 'round_trip' | 'airport'>('round_trip');
  const [airportMode, setAirportMode] = useState<'pickup' | 'drop'>('pickup'); // pickup = airport→city, drop = city→airport
  const [vehicleCategoryId, setVehicleCategoryId] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');

  // Result state
  const [result, setResult] = useState<PricingResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Set default dates
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    setEndDate(dayAfter.toISOString().split('T')[0]);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, catRes, pkgRes] = await Promise.all([
          fetch(`/api/services/${serviceSlug}/locations`),
          fetch(`/api/admin/services/${serviceSlug}/vehicles`),
          fetch(`/api/admin/services/${serviceSlug}/packages`),
        ]);

        const locData = await locRes.json();
        const catData = await catRes.json();
        const pkgData = await pkgRes.json();

        if (locData.success) setLocations(locData.locations || []);
        if (catData.success) {
          const cats = (catData.categories || []).filter(
            (c: VehicleCategory & { isActive: boolean }) => c.isActive
          );
          setVehicleCategories(cats);
          if (cats.length > 0) setVehicleCategoryId(cats[0].id);
        }
        if (pkgData.success) setLocalPackages(pkgData.packages || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceSlug]);

  // Test pricing
  const testPricing = async () => {
    if (!vehicleCategoryId) {
      alert('Please select a vehicle category');
      return;
    }

    if (tripType === 'local' && !packageId) {
      alert('Please select a local package');
      return;
    }

    if ((tripType === 'one_way' || tripType === 'round_trip' || tripType === 'airport') && (!fromLocationId || !toLocationId)) {
      alert('Please select from and to locations');
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const params = new URLSearchParams({
        vehicleCategory: vehicleCategoryId,
        tripType,
        serviceSlug,
      });

      if (tripType === 'local') {
        params.set('packageId', packageId);
      } else {
        params.set('from', fromLocationId);
        params.set('to', toLocationId);
        if (startDate) params.set('startDate', startDate);
        if (endDate && tripType === 'round_trip') params.set('endDate', endDate);
      }

      if (pickupTime) params.set('pickupTime', pickupTime);

      const res = await fetch(`/api/chauffeur-pricing?${params.toString()}`);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to test pricing:', error);
      setResult({ success: false, tripType, error: 'Failed to calculate pricing' });
    } finally {
      setTesting(false);
    }
  };

  // Get packages for selected vehicle
  const availablePackages = localPackages.filter((p) => p.vehicleCategoryId === vehicleCategoryId);

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
        <h1 className="text-2xl font-bold text-gray-900">Price Tester - {serviceTitle}</h1>
        <p className="text-gray-600 mt-1">Simulate bookings to verify pricing before going live</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className={`bg-white rounded-lg shadow p-6 ${isLuxury ? 'border-t-4 border-amber-500' : ''}`}>
          <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>

          <div className="space-y-4">
            {/* Trip Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
              <div className="flex gap-2">
                {[
                  { id: 'local', label: 'Local' },
                  { id: 'one_way', label: 'One-Way' },
                  { id: 'round_trip', label: 'Round Trip' },
                  { id: 'airport', label: 'Airport' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTripType(type.id as any)}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition ${
                      tripType === type.id
                        ? isLuxury
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Category</label>
              <select
                value={vehicleCategoryId}
                onChange={(e) => {
                  setVehicleCategoryId(e.target.value);
                  setPackageId('');
                }}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select vehicle</option>
                {vehicleCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Local Package */}
            {tripType === 'local' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local Package</label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select package</option>
                  {availablePackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.hours}hr/{pkg.kms}km - Rs{pkg.basePrice}
                    </option>
                  ))}
                </select>
                {availablePackages.length === 0 && vehicleCategoryId && (
                  <p className="text-sm text-red-500 mt-1">
                    No packages configured for this vehicle
                  </p>
                )}
              </div>
            )}

            {/* Airport mode toggle */}
            {tripType === 'airport' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                <div className="flex gap-2">
                  {[
                    { id: 'pickup', label: '✈ Airport → City' },
                    { id: 'drop', label: '🏙 City → Airport' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setAirportMode(m.id as 'pickup' | 'drop')}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition ${
                        airportMode === m.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* From/To Locations */}
            {(tripType === 'one_way' || tripType === 'round_trip') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From City</label>
                  <select
                    value={fromLocationId}
                    onChange={(e) => setFromLocationId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select city</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To City</label>
                  <select
                    value={toLocationId}
                    onChange={(e) => setToLocationId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select city</option>
                    {locations
                      .filter((l) => l.id !== fromLocationId)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}

            {/* Airport From/To */}
            {tripType === 'airport' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {airportMode === 'pickup' ? 'Airport (From)' : 'City (From)'}
                  </label>
                  <select
                    value={fromLocationId}
                    onChange={(e) => setFromLocationId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {airportMode === 'pickup' ? 'City (To)' : 'Airport (To)'}
                  </label>
                  <select
                    value={toLocationId}
                    onChange={(e) => setToLocationId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select location</option>
                    {locations.filter((l) => l.id !== fromLocationId).map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Dates */}
            {(tripType === 'one_way' || tripType === 'round_trip') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                {tripType === 'round_trip' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Pickup Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Night charges apply 10pm - 6am</p>
            </div>

            {/* Test Button */}
            <button
              onClick={testPricing}
              disabled={testing}
              className={`w-full ${isLuxury ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition`}
            >
              {testing ? 'Calculating...' : 'Test Pricing'}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing Result</h2>

          {!result && (
            <div className="text-center py-12 text-gray-400">
              Configure test parameters and click "Test Pricing"
            </div>
          )}

          {result && !result.success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="font-medium text-red-800">Pricing Not Available</div>
              <div className="text-sm text-red-600 mt-1">{result.error}</div>
              {result.suggestion && (
                <div className="text-sm text-red-500 mt-2 italic">{result.suggestion}</div>
              )}
            </div>
          )}

          {result && result.success && result.pricing && (
            <div className="space-y-4">
              {/* Grand Total */}
              <div
                className={`${isLuxury ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 text-center`}
              >
                <div className={`text-sm ${isLuxury ? 'text-amber-600' : 'text-green-600'}`}>
                  Grand Total
                </div>
                <div
                  className={`text-3xl font-bold ${isLuxury ? 'text-amber-700' : 'text-green-700'}`}
                >
                  Rs{result.pricing.grandTotal.toLocaleString()}
                </div>
                <div className={`text-xs ${isLuxury ? 'text-amber-500' : 'text-green-500'} mt-1`}>
                  Method:{' '}
                  {result.pricingMethod === 'forced_package'
                    ? '⚡ Fixed (Admin Override)'
                    : result.pricingMethod === 'route_package'
                    ? '📦 Fixed Route Package'
                    : result.pricingMethod === 'airport_transfer'
                    ? '✈ Airport Transfer'
                    : '📐 Dynamic (Distance Matrix)'}
                </div>
              </div>

              {/* Route Info */}
              {result.route && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-800">
                    {result.route.from.name} to {result.route.to.name}
                  </div>
                  <div className="text-xs text-blue-600">
                    Distance: {result.route.oneWayDistance} km (one-way)
                  </div>
                </div>
              )}

              {/* Package Info */}
              {result.package && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-800">{result.package.name}</div>
                  <div className="text-xs text-purple-600">
                    {result.package.hours}hr / {result.package.kms}km package
                  </div>
                </div>
              )}

              {/* Calculation Details */}
              {result.calculation && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Calculation</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Days: {result.calculation.days}</div>
                    <div>Actual KM: {result.calculation.actualKm}</div>
                    <div>Min KM/Day: {result.calculation.minKmPerDay}</div>
                    <div>Chargeable KM: {result.calculation.chargeableKm}</div>
                    <div>Per KM Rate: Rs{result.calculation.perKmRate}</div>
                  </div>
                </div>
              )}

              {/* Breakdown */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Fare Breakdown</div>
                <div className="space-y-2 text-sm">
                  {result.pricing.baseKmCharge !== undefined && result.pricing.baseKmCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">KM Charge</span>
                      <span>Rs{result.pricing.baseKmCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {result.pricing.basePrice !== undefined && result.pricing.basePrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price</span>
                      <span>Rs{result.pricing.basePrice.toLocaleString()}</span>
                    </div>
                  )}
                  {result.pricing.driverAllowance !== undefined &&
                    result.pricing.driverAllowance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Driver Allowance</span>
                        <span>Rs{result.pricing.driverAllowance.toLocaleString()}</span>
                      </div>
                    )}
                  {result.pricing.nightCharge !== undefined && result.pricing.nightCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Night Charge</span>
                      <span>Rs{result.pricing.nightCharge.toLocaleString()}</span>
                    </div>
                  )}
                  {result.pricing.tollEstimate !== undefined && result.pricing.tollEstimate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toll Estimate</span>
                      <span>Rs{result.pricing.tollEstimate.toLocaleString()}</span>
                    </div>
                  )}
                  {result.pricing.statePermitCharge !== undefined &&
                    result.pricing.statePermitCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">State Permit</span>
                        <span>Rs{result.pricing.statePermitCharge.toLocaleString()}</span>
                      </div>
                    )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>Rs{result.pricing.totalBeforeGst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (5%)</span>
                    <span>Rs{result.pricing.gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Total</span>
                    <span className={isLuxury ? 'text-amber-600' : 'text-green-600'}>
                      Rs{result.pricing.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inclusions */}
              {result.inclusions && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Inclusions</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded ${result.inclusions.tollsIncluded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Tolls: {result.inclusions.tollsIncluded ? 'Included' : 'Extra'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded ${result.inclusions.parkingIncluded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Parking: {result.inclusions.parkingIncluded ? 'Included' : 'Extra'}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {result.notes && result.notes.length > 0 && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {result.notes.map((note, idx) => (
                      <li key={idx}>* {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
