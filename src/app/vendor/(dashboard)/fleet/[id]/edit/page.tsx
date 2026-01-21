'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  Bike,
  Loader2,
  Save,
  MapPin,
  Check,
  Search,
  IndianRupee,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FleetVehicle {
  id: string;
  registrationNumber?: string;
  yearOfManufacture?: number;
  color?: string;
  images?: string[];
  isActive: boolean;
  isAvailable: boolean;
  // For bike-rental
  vehicle_model?: {
    id: string;
    name: string;
    slug: string;
    sideImage?: string;
    fuelType?: string;
    transmission?: string;
    brand: {
      id: string;
      name: string;
    };
  } | null;
  // For car-rental
  vehicle_category?: {
    id: string;
    name: string;
    slug: string;
    seatingCapacity?: number;
    luggageCapacity?: number;
    acType?: string;
    fuelType?: string;
    image?: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  } | null;
  service: {
    id: string;
    name: string;
    slug: string;
  };
  fleetLocations: {
    id: string;
    location: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  fleetPricing: {
    id: string;
    tripTypeId: string;
    priceType: string;
    basePrice: number;
    perKmRate?: number;
    perDayRate?: number;
    kmLimitPerDay?: number;
    extraKmCharge?: number;
    deposit?: number;
  }[];
}

interface Location {
  id: string;
  name: string;
  slug?: string;
}

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState<FleetVehicle | null>(null);
  const [approvedLocations, setApprovedLocations] = useState<Location[]>([]);
  const [error, setError] = useState('');

  // Form state
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [yearOfManufacture, setYearOfManufacture] = useState('');
  const [color, setColor] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');

  // Bike pricing state
  const [perDayRate, setPerDayRate] = useState('');
  const [kmPerDay, setKmPerDay] = useState('100');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vehicle and approved locations in parallel
        const [vehicleRes, fleetRes] = await Promise.all([
          fetch(`/api/vendor/fleet/${params.id}`),
          fetch('/api/vendor/fleet'),
        ]);

        const vehicleData = await vehicleRes.json();
        const fleetData = await fleetRes.json();

        if (vehicleRes.ok && vehicleData.success) {
          const v = vehicleData.vehicle;
          setVehicle(v);

          // Set form values
          setRegistrationNumber(v.registrationNumber || '');
          setYearOfManufacture(v.yearOfManufacture?.toString() || '');
          setColor(v.color || '');

          // Handle both API field names (vendor_fleet_locations vs fleetLocations)
          const locations = v.vendor_fleet_locations || v.fleetLocations || [];
          setSelectedLocations(locations.map((fl: any) => (fl.locations?.id || fl.location?.id)));

          // Set pricing values from first pricing entry (for bikes)
          // Handle both API field names (fleet_pricing vs fleetPricing)
          const pricingData = v.fleet_pricing || v.fleetPricing || [];
          if (pricingData.length > 0) {
            const pricing = pricingData[0];
            setPerDayRate(pricing.perDayRate?.toString() || pricing.basePrice?.toString() || '');
            setKmPerDay(pricing.kmLimitPerDay?.toString() || '100');
            setExtraKmRate(pricing.extraKmCharge?.toString() || pricing.perKmRate?.toString() || '');
            setSecurityDeposit(pricing.deposit?.toString() || '');
          }
        } else {
          setError(vehicleData.error || 'Failed to fetch vehicle');
        }

        if (fleetRes.ok && fleetData.success) {
          setApprovedLocations(fleetData.approvedLocations || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  // Handle both API field names (services vs service, vehicle_models vs vehicle_model)
  const service = (vehicle as any)?.services || (vehicle as any)?.service;
  const vehicleModel = (vehicle as any)?.vehicle_models || (vehicle as any)?.vehicle_model;
  const vehicleCategory = (vehicle as any)?.chauffeur_vehicle_categories || (vehicle as any)?.vehicle_category;
  const brandData = (vehicle as any)?.brands || (vehicle as any)?.brand;

  const isBikeService = service?.slug === 'bike-rental' ||
    service?.name?.toLowerCase().includes('bike');

  const isCarRental = service?.slug === 'car-rental' ||
    service?.name?.toLowerCase().includes('car rental');

  // Helper to get vehicle name (handles both bike-rental and car-rental)
  const getVehicleName = () => {
    if (!vehicle) return 'Vehicle';
    // For bike-rental: Brand + Model name
    if (vehicleModel) {
      const brand = vehicleModel.brands || vehicleModel.brand;
      return `${brand?.name || ''} ${vehicleModel.name || ''}`.trim();
    }
    // For car-rental: Brand + Category name
    if (brandData || vehicleCategory) {
      return `${brandData?.name || ''} ${vehicleCategory?.name || ''}`.trim();
    }
    return 'Unknown Vehicle';
  };

  // Helper to get vehicle image
  const getVehicleImage = () => {
    if (!vehicle) return null;
    if (vehicle.images && vehicle.images.length > 0) return vehicle.images[0];
    if (vehicleModel?.sideImage) return vehicleModel.sideImage;
    if (vehicleCategory?.image) return vehicleCategory.image;
    if (brandData?.logo) return brandData.logo;
    return null;
  };

  const filteredLocations = approvedLocations.filter(
    (loc) => !locationSearch || loc.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const toggleLocation = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  const selectAllLocations = () => {
    setSelectedLocations(approvedLocations.map((l) => l.id));
  };

  const clearAllLocations = () => {
    setSelectedLocations([]);
  };

  const handleSave = async () => {
    if (selectedLocations.length === 0) {
      alert('Please select at least one location');
      return;
    }

    if (isBikeService && (!perDayRate || parseFloat(perDayRate) <= 0)) {
      alert('Please enter a valid per day rate');
      return;
    }

    setSaving(true);
    try {
      // Build pricing for bikes
      let pricing = undefined;
      if (isBikeService) {
        pricing = [
          {
            tripTypeId: 'self-drive',
            pricingType: 'PER_DAY',
            basePrice: parseFloat(perDayRate),
            perDayRate: parseFloat(perDayRate),
            perKmRate: extraKmRate ? parseFloat(extraKmRate) : null,
            deposit: securityDeposit ? parseFloat(securityDeposit) : null,
            kmLimit: kmPerDay ? parseInt(kmPerDay) : 100,
          },
        ];
      }

      const res = await fetch(`/api/vendor/fleet/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber: registrationNumber || undefined,
          yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture) : undefined,
          color: color || undefined,
          locationIds: selectedLocations,
          pricing,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/vendor/fleet/${params.id}`);
      } else {
        alert(data.error || 'Failed to update vehicle');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
        </div>

        <div className="bg-red-50 rounded-xl p-8 text-center border border-red-200">
          <p className="text-red-600">{error || 'Vehicle not found'}</p>
          <Button className="mt-4" onClick={() => router.push('/vendor/fleet')}>
            Back to Fleet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
            <p className="text-gray-600">
              {getVehicleName()}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Info Card */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
            {getVehicleImage() ? (
              <img
                src={getVehicleImage()!}
                alt={getVehicleName()}
                className="w-full h-full object-contain"
              />
            ) : isBikeService ? (
              <Bike className="w-10 h-10 text-gray-400" />
            ) : (
              <Car className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900">
              {getVehicleName()}
            </p>
            <p className="text-sm text-gray-500">{service?.name}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              {(vehicleModel?.fuelType || vehicleCategory?.fuelType) && (
                <span>{vehicleModel?.fuelType || vehicleCategory?.fuelType}</span>
              )}
              {vehicleModel?.transmission && <span>{vehicleModel.transmission}</span>}
              {vehicleCategory?.seatingCapacity && (
                <span>{vehicleCategory.seatingCapacity} Seater</span>
              )}
              {vehicleCategory?.acType && <span>{vehicleCategory.acType}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Vehicle Details</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                placeholder="e.g., MH01AB1234"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Manufacture
              </label>
              <input
                type="number"
                value={yearOfManufacture}
                onChange={(e) => setYearOfManufacture(e.target.value)}
                placeholder="e.g., 2022"
                min="2000"
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g., White"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Operating Locations</h2>
        </div>

        <div className="p-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllLocations}
                className="whitespace-nowrap"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllLocations}
                className="whitespace-nowrap"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Selected Count */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Selected:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {selectedLocations.length} of {approvedLocations.length} locations
            </span>
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[250px] overflow-y-auto">
            {filteredLocations.map((location) => {
              const isSelected = selectedLocations.includes(location.id);
              return (
                <button
                  key={location.id}
                  onClick={() => toggleLocation(location.id)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-left',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MapPin
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium truncate',
                        isSelected ? 'text-blue-700' : 'text-gray-700'
                      )}
                    >
                      {location.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing - Only for Bikes */}
      {isBikeService && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Daily Rate */}
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
              <label className="block text-sm font-semibold text-blue-800 mb-3">
                Per Day Rate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  value={perDayRate}
                  onChange={(e) => setPerDayRate(e.target.value)}
                  placeholder="Enter daily rate"
                  className="w-full pl-10 pr-4 py-4 text-xl font-bold border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Other Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Km Limit Per Day
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={kmPerDay}
                    onChange={(e) => setKmPerDay(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">km</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Km Rate
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={extraKmRate}
                    onChange={(e) => setExtraKmRate(e.target.value)}
                    placeholder="5"
                    className="w-full pl-10 pr-16 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">/km</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="2000"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-xl border">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-500" />
                Pricing Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Per Day</p>
                  <p className="font-bold text-gray-900">₹{perDayRate || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Km Limit</p>
                  <p className="font-bold text-gray-900">{kmPerDay || '100'} km/day</p>
                </div>
                <div>
                  <p className="text-gray-500">Extra Km</p>
                  <p className="font-bold text-gray-900">₹{extraKmRate || '0'}/km</p>
                </div>
                <div>
                  <p className="text-gray-500">Deposit</p>
                  <p className="font-bold text-gray-900">₹{securityDeposit || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
