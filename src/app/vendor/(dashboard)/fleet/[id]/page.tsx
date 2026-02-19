'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  Bike,
  FileText,
  Loader2,
  Edit,
  MapPin,
  CheckCircle,
  XCircle,
  IndianRupee,
  Star,
  Fuel,
  Settings,
  Calendar,
  Gauge,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, resolveAssetUrl } from '@/lib/utils';
import FleetBlockedDatesCalendar from '@/components/vendor/FleetBlockedDatesCalendar';

interface FleetVehicle {
  id: string;
  registrationNumber?: string;
  yearOfManufacture?: number;
  color?: string;
  images?: {
    front?: string;
    back?: string;
    leftSide?: string;
    rightSide?: string;
    inside?: string;
  } | null;
  isActive: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  createdAt: string;
  // For bike-rental
  vehicle_model?: {
    id: string;
    name: string;
    slug: string;
    sideImage?: string;
    fuelType?: string;
    transmission?: string;
    seatingCapacity?: number;
    engineCC?: number;
    brand: {
      id: string;
      name: string;
      logo?: string;
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
  sub_service?: {
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
    localPackageId?: string;
    priceType: string;
    basePrice: number;
    perKmRate?: number;
    perHourRate?: number;
    perDayRate?: number;
    driverAllowance?: number;
    nightCharges?: number;
    kmLimitPerDay?: number;
    extraKmCharge?: number;
    deposit?: number;
    location?: {
      id: string;
      name: string;
    };
    tripType?: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<FleetVehicle | null>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`/api/vendor/fleet/${params.id}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setVehicle(data.vehicle);
        } else {
          setError(data.error || 'Failed to fetch vehicle');
        }
      } catch (err) {
        console.error('Failed to fetch vehicle:', err);
        setError('Failed to fetch vehicle');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVehicle();
    }
  }, [params.id]);

  const toggleAvailability = async () => {
    if (!vehicle) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/vendor/fleet/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !vehicle.isAvailable }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVehicle(data.vehicle);
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Failed to update:', err);
      alert('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const toggleActive = async () => {
    if (!vehicle) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/vendor/fleet/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVehicle(data.vehicle);
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Failed to update:', err);
      alert('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    if (!confirm('Are you sure you want to remove this vehicle from your fleet?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/vendor/fleet/${params.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/vendor/fleet');
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Handle both API field names (services vs service, vehicle_models vs vehicle_model)
  const service = (vehicle as any)?.services || (vehicle as any)?.service;
  const vehicleModel = (vehicle as any)?.vehicle_models || (vehicle as any)?.vehicle_model;
  const vehicleCategory = (vehicle as any)?.chauffeur_vehicle_categories || (vehicle as any)?.vehicle_category;
  const brandData = (vehicle as any)?.brands || (vehicle as any)?.brand;
  const fleetLocations = (vehicle as any)?.vendor_fleet_locations || (vehicle as any)?.fleetLocations || [];
  const fleetPricing = (vehicle as any)?.fleet_pricing || (vehicle as any)?.fleetPricing || [];

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

  // Helper to get all images for slider (featured + vendor images)
  const getAllImages = () => {
    const images: { url: string; label: string; isFeatured?: boolean }[] = [];

    // Add featured image first (admin's image from model/category)
    if (!vehicle) return images;

    let featuredImageUrl = null;
    if (vehicleModel?.sideImage) featuredImageUrl = vehicleModel.sideImage;
    else if (vehicleCategory?.image) featuredImageUrl = vehicleCategory.image;
    else if (brandData?.logo) featuredImageUrl = brandData.logo;

    if (featuredImageUrl) {
      images.push({ url: resolveAssetUrl(featuredImageUrl), label: 'Featured Image', isFeatured: true });
    }

    // Add vendor-uploaded images
    if (vehicle.images) {
      if (vehicle.images.front) images.push({ url: resolveAssetUrl(vehicle.images.front), label: 'Front View' });
      if (vehicle.images.back) images.push({ url: resolveAssetUrl(vehicle.images.back), label: 'Back View' });
      if (vehicle.images.leftSide) images.push({ url: resolveAssetUrl(vehicle.images.leftSide), label: 'Left Side' });
      if (vehicle.images.rightSide) images.push({ url: resolveAssetUrl(vehicle.images.rightSide), label: 'Right Side' });
      if (vehicle.images.inside) images.push({ url: resolveAssetUrl(vehicle.images.inside), label: 'Interior' });
    }

    return images;
  };

  const allImages = getAllImages();
  const hasImages = allImages.length > 0;

  // Auto-slide effect (3 seconds)
  useEffect(() => {
    if (allImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [allImages.length]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading vehicle details...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Details</h1>
        </div>

        <div className="bg-red-50 rounded-xl p-8 text-center border border-red-200">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Vehicle Not Found</h2>
          <p className="text-red-600 mb-4">{error || 'This vehicle does not exist or you do not have access.'}</p>
          <Button onClick={() => router.push('/vendor/fleet')}>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {getVehicleName()}
            </h1>
            <p className="text-gray-600">
              {vehicle.registrationNumber || 'No Registration'} | {service?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/vendor/fleet/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Vehicle Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Vehicle Image Slider */}
          <div className="w-full lg:w-96">
            {hasImages ? (
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="w-full h-56 flex items-center justify-center">
                  <img
                    src={allImages[currentImageIndex].url}
                    alt={allImages[currentImageIndex].label}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = isBikeService
                        ? '<svg class="w-24 h-24 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
                        : '<svg class="w-24 h-24 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>';

                      // Null check before accessing parentElement
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.innerHTML = `<div class="flex items-center justify-center w-full h-full">${placeholder}</div>`;
                      }
                    }}
                  />
                </div>

                {/* Featured Badge */}
                {allImages[currentImageIndex].isFeatured && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    Featured
                  </div>
                )}

                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Image Label & Counter */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-3 py-1.5 rounded-full">
                  {allImages[currentImageIndex].label} ({currentImageIndex + 1}/{allImages.length})
                </div>

                {/* Thumbnail Dots */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 flex gap-1.5">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          idx === currentImageIndex ? "bg-white w-4" : "bg-white bg-opacity-50"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-56 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                {isBikeService ? (
                  <Bike className="w-24 h-24 text-blue-300" />
                ) : (
                  <Car className="w-24 h-24 text-blue-300" />
                )}
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {vehicle.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div>
                <p className="text-sm text-gray-500">Availability</p>
                <div className="flex items-center gap-2 mt-1">
                  {vehicle.isAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>

              {/* Verification */}
              <div>
                <p className="text-sm text-gray-500">Verification</p>
                <div className="flex items-center gap-2 mt-1">
                  {vehicle.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Year */}
              {vehicle.yearOfManufacture && (
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-semibold text-gray-900">{vehicle.yearOfManufacture}</p>
                </div>
              )}

              {/* Color */}
              {vehicle.color && (
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-semibold text-gray-900">{vehicle.color}</p>
                </div>
              )}

              {/* Fuel Type */}
              {(vehicleModel?.fuelType || vehicleCategory?.fuelType) && (
                <div>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    <Fuel className="w-4 h-4 text-gray-400" />
                    {vehicleModel?.fuelType || vehicleCategory?.fuelType}
                  </p>
                </div>
              )}

              {/* Transmission */}
              {vehicleModel?.transmission && (
                <div>
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="font-semibold text-gray-900">{vehicleModel.transmission}</p>
                </div>
              )}

              {/* Seating */}
              {(vehicleModel?.seatingCapacity || vehicleCategory?.seatingCapacity) && (
                <div>
                  <p className="text-sm text-gray-500">Seating</p>
                  <p className="font-semibold text-gray-900">
                    {vehicleModel?.seatingCapacity || vehicleCategory?.seatingCapacity} Seater
                  </p>
                </div>
              )}

              {/* Car Rental Specific - AC Type */}
              {vehicleCategory?.acType && (
                <div>
                  <p className="text-sm text-gray-500">AC Type</p>
                  <p className="font-semibold text-gray-900">{vehicleCategory.acType}</p>
                </div>
              )}

              {/* Car Rental Specific - Luggage */}
              {vehicleCategory?.luggageCapacity && (
                <div>
                  <p className="text-sm text-gray-500">Luggage</p>
                  <p className="font-semibold text-gray-900">{vehicleCategory.luggageCapacity} bags</p>
                </div>
              )}

              {/* Added Date */}
              <div>
                <p className="text-sm text-gray-500">Added On</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(vehicle.createdAt)}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAvailability}
                disabled={updating}
                className={vehicle.isAvailable ? 'text-orange-600' : 'text-blue-600'}
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : vehicle.isAvailable ? (
                  <ToggleRight className="w-4 h-4 mr-2" />
                ) : (
                  <ToggleLeft className="w-4 h-4 mr-2" />
                )}
                {vehicle.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleActive}
                disabled={updating}
                className={vehicle.isActive ? 'text-red-600' : 'text-green-600'}
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                {vehicle.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Operating Locations
        </h2>

        {fleetLocations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No locations assigned</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fleetLocations.map((fl: any) => (
              <span
                key={fl.id}
                className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
              >
                <MapPin className="w-3 h-3" />
                {fl.locations?.name || fl.location?.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-green-600" />
          Pricing
        </h2>

        {fleetPricing.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No pricing set</p>
        ) : (
          <div className="space-y-4">
            {fleetPricing.map((pricing: any) => (
              <div
                key={pricing.id}
                className="p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">
                    {pricing.tripType?.name || pricing.priceType}
                    {(pricing.locations || pricing.location) && (
                      <span className="ml-2 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                        (City: {pricing.locations?.name || pricing.location?.name})
                      </span>
                    )}
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(pricing.basePrice || pricing.perDayRate || 0)}
                    {pricing.priceType === 'PER_DAY' && <span className="text-sm font-normal">/day</span>}
                    {pricing.priceType === 'PER_KM' && <span className="text-sm font-normal">/km</span>}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {pricing.perDayRate && (
                    <div>
                      <p className="text-gray-500">Per Day</p>
                      <p className="font-medium">{formatCurrency(pricing.perDayRate)}</p>
                    </div>
                  )}
                  {pricing.perKmRate && (
                    <div>
                      <p className="text-gray-500">Per Km</p>
                      <p className="font-medium">{formatCurrency(pricing.perKmRate)}/km</p>
                    </div>
                  )}
                  {pricing.kmLimitPerDay && (
                    <div>
                      <p className="text-gray-500">Km Limit</p>
                      <p className="font-medium">{pricing.kmLimitPerDay} km/day</p>
                    </div>
                  )}
                  {pricing.extraKmCharge && (
                    <div>
                      <p className="text-gray-500">Extra Km</p>
                      <p className="font-medium">{formatCurrency(pricing.extraKmCharge)}/km</p>
                    </div>
                  )}
                  {pricing.deposit && (
                    <div>
                      <p className="text-gray-500">Deposit</p>
                      <p className="font-medium">{formatCurrency(pricing.deposit)}</p>
                    </div>
                  )}
                  {pricing.driverAllowance && (
                    <div>
                      <p className="text-gray-500">Driver Allowance</p>
                      <p className="font-medium">{formatCurrency(pricing.driverAllowance)}/day</p>
                    </div>
                  )}
                  {pricing.nightCharges && (
                    <div>
                      <p className="text-gray-500">Night Charges</p>
                      <p className="font-medium">{formatCurrency(pricing.nightCharges)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked Dates Calendar */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-red-600" />
          Blocked Dates
        </h2>
        <FleetBlockedDatesCalendar fleetId={vehicle.id} />
      </div>

      {/* Category Info */}
      {vehicle.sub_service && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category</h2>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium">
            {vehicle.sub_service.name}
          </span>
        </div>
      )}
    </div>
  );
}
