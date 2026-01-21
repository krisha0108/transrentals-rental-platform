'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Upload,
  Check,
  Fuel,
  Settings2,
  Users,
  Gauge,
  IndianRupee,
  Loader2,
  MapPin,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VehicleModel {
  id: string;
  name: string;
  slug: string;
  sideImage?: string;
  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  brand: { id: string; name: string; logo?: string };
  service?: { id: string; slug: string; name: string; parentId?: string | null };
  serviceId?: string;
  subServiceId?: string | null;
}

interface Service {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  children?: { id: string; name: string; slug?: string }[];
}

interface Location {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
}

const STEPS = [
  { id: 1, name: 'Select Car', description: 'Choose vehicle model' },
  { id: 2, name: 'Details', description: 'Car info & locations' },
  { id: 3, name: 'Pricing', description: 'Rates & limits' },
];

export default function AddSelfDriveCarPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data from API
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [approvedServices, setApprovedServices] = useState<Service[]>([]);
  const [approvedLocations, setApprovedLocations] = useState<Location[]>([]);

  // Form state
  const [vehicleModelId, setVehicleModelId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [yearOfManufacture, setYearOfManufacture] = useState(new Date().getFullYear().toString());
  const [color, setColor] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Pricing
  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [kmLimitPerDay, setKmLimitPerDay] = useState('200');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  // Search
  const [modelSearch, setModelSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/vendor/fleet');
      const data = await res.json();
      if (res.ok && data.success) {
        setVehicleModels(data.vehicle_modelss || []);
        setApprovedServices(data.approvedServices || []);
        setApprovedLocations(data.approvedLocations || []);

        // Auto-select self-drive service if available
        const selfDriveService = (data.approvedServices || []).find(
          (s: Service) =>
            s.slug === 'self-drive-car-rental' ||
            s.slug === 'self-drive-car-rentals' ||
            s.slug === 'self-drive' ||
            s.name?.toLowerCase().includes('self-drive') ||
            s.name?.toLowerCase().includes('self drive')
        );
        if (selfDriveService) {
          setServiceId(selfDriveService.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter vehicle models for self-drive (cars only)
  const filteredModels = vehicleModels.filter((m) => {
    // Filter by service (self-drive)
    const modelServiceSlug = m.service?.slug || '';
    const isCarModel =
      modelServiceSlug.includes('self-drive') ||
      modelServiceSlug.includes('car-rental') ||
      m.service?.name?.toLowerCase().includes('self-drive') ||
      m.service?.name?.toLowerCase().includes('car');

    if (!isCarModel && serviceId) {
      // If we have serviceId, check if model belongs to this service
      if (m.serviceId !== serviceId && m.service?.id !== serviceId) {
        return false;
      }
    }

    // Filter by search
    const matchesSearch =
      !modelSearch ||
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.brand?.name?.toLowerCase().includes(modelSearch.toLowerCase());

    // Filter by brand
    const matchesBrand = !selectedBrand || m.brand?.name === selectedBrand;

    return matchesSearch && matchesBrand;
  });

  // Get unique brands
  const availableBrands = [...new Set(vehicleModels.map((m) => m.brand?.name).filter(Boolean))];

  const selectedModel = vehicleModels.find((m) => m.id === vehicleModelId);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!vehicleModelId) {
        newErrors.vehicle_modelsId = 'Please select a vehicle model';
      }
    }

    if (step === 2) {
      if (!registrationNumber) {
        newErrors.registrationNumber = 'Registration number is required';
      } else if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(registrationNumber.toUpperCase())) {
        newErrors.registrationNumber = 'Invalid format (e.g., MH02AB1234)';
      }
      if (selectedLocations.length === 0) {
        newErrors.locations = 'Select at least one location';
      }
    }

    if (step === 3) {
      if (!dailyRate || parseFloat(dailyRate) <= 0) {
        newErrors.dailyRate = 'Daily rate is required';
      }
      if (!extraKmRate || parseFloat(extraKmRate) <= 0) {
        newErrors.extraKmRate = 'Extra KM rate is required';
      }
      if (!securityDeposit || parseFloat(securityDeposit) <= 0) {
        newErrors.securityDeposit = 'Security deposit is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
    if (errors.locations) {
      setErrors((prev) => ({ ...prev, locations: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setSubmitting(true);
    try {
      // Build pricing array for self-drive
      const pricing = [
        {
          tripTypeId: 'self-drive',
          pricingType: 'PER_DAY',
          basePrice: parseFloat(dailyRate),
          perDayRate: parseFloat(dailyRate),
          perKmRate: extraKmRate ? parseFloat(extraKmRate) : undefined,
          kmLimit: kmLimitPerDay ? parseInt(kmLimitPerDay) : 200,
          deposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
        },
      ];

      const res = await fetch('/api/vendor/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleModelId,
          serviceId,
          registrationNumber: registrationNumber.toUpperCase(),
          yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture) : undefined,
          color: color || undefined,
          locationIds: selectedLocations,
          pricing,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        router.push('/vendor/self-drive/fleet');
      } else {
        alert(result.error || result.details || 'Failed to add car');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to add car');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/self-drive/fleet"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Car</h1>
          <p className="text-gray-600">Add a self-drive car to your fleet</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-gray-900">{step.name}</p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-4 rounded',
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {/* Step 1: Select Vehicle Model */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Select Vehicle Model</h2>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by name or brand..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Brands</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {errors.vehicle_modelsId && (
              <p className="text-red-500 text-sm">{errors.vehicle_modelsId}</p>
            )}

            {/* Vehicle Models Grid */}
            {filteredModels.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No vehicle models available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Contact admin to add self-drive car models
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setVehicleModelId(model.id);
                      if (errors.vehicle_modelsId) {
                        setErrors((prev) => ({ ...prev, vehicleModelId: '' }));
                      }
                    }}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      vehicleModelId === model.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {model.sideImage ? (
                        <img
                          src={model.sideImage}
                          alt={model.name}
                          className="w-16 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <Car className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {model.brand?.name} {model.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {model.transmission && <span>{model.transmission}</span>}
                          {model.fuelType && (
                            <>
                              <span>•</span>
                              <span>{model.fuelType}</span>
                            </>
                          )}
                          {model.seatingCapacity && (
                            <>
                              <span>•</span>
                              <span>{model.seatingCapacity} Seats</span>
                            </>
                          )}
                        </div>
                      </div>
                      {vehicleModelId === model.id && (
                        <Check className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Car Details & Locations */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Car Details</h2>

            {/* Selected Model Preview */}
            {selectedModel && (
              <div className="p-4 bg-indigo-50 rounded-xl flex items-center gap-4">
                {selectedModel.sideImage ? (
                  <img
                    src={selectedModel.sideImage}
                    alt={selectedModel.name}
                    className="w-20 h-14 object-contain"
                  />
                ) : (
                  <div className="w-20 h-14 bg-white rounded flex items-center justify-center">
                    <Car className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedModel.brand?.name} {selectedModel.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedModel.transmission} • {selectedModel.fuelType} •{' '}
                    {selectedModel.seatingCapacity} Seats
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value.toUpperCase());
                    if (errors.registrationNumber) {
                      setErrors((prev) => ({ ...prev, registrationNumber: '' }));
                    }
                  }}
                  placeholder="MH02AB1234"
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500',
                    errors.registrationNumber ? 'border-red-500' : 'border-gray-200'
                  )}
                />
                {errors.registrationNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.registrationNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of Manufacture
                </label>
                <input
                  type="number"
                  value={yearOfManufacture}
                  onChange={(e) => setYearOfManufacture(e.target.value)}
                  min={2010}
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="e.g., White, Silver, Black"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Operating Locations *
              </label>
              {errors.locations && (
                <p className="text-red-500 text-sm mb-2">{errors.locations}</p>
              )}

              {approvedLocations.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No approved locations. Contact admin to approve locations for your account.
                </p>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedLocations(approvedLocations.map((l) => l.id))}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedLocations([])}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {approvedLocations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => toggleLocation(location.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm border transition',
                          selectedLocations.includes(location.id)
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {selectedLocations.includes(location.id) && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {location.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Pricing & Limits</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Rate (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => {
                      setDailyRate(e.target.value);
                      if (errors.dailyRate) {
                        setErrors((prev) => ({ ...prev, dailyRate: '' }));
                      }
                    }}
                    placeholder="e.g., 1499"
                    className={cn(
                      'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500',
                      errors.dailyRate ? 'border-red-500' : 'border-gray-200'
                    )}
                  />
                </div>
                {errors.dailyRate && (
                  <p className="text-red-500 text-sm mt-1">{errors.dailyRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => {
                      setSecurityDeposit(e.target.value);
                      if (errors.securityDeposit) {
                        setErrors((prev) => ({ ...prev, securityDeposit: '' }));
                      }
                    }}
                    placeholder="e.g., 5000"
                    className={cn(
                      'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500',
                      errors.securityDeposit ? 'border-red-500' : 'border-gray-200'
                    )}
                  />
                </div>
                {errors.securityDeposit && (
                  <p className="text-red-500 text-sm mt-1">{errors.securityDeposit}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Rate (₹)
                  <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={weeklyRate}
                    onChange={(e) => setWeeklyRate(e.target.value)}
                    placeholder="Leave blank for no weekly discount"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rate (₹)
                  <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    placeholder="Leave blank for no monthly discount"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Kilometer Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free KM per Day
                  </label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={kmLimitPerDay}
                      onChange={(e) => setKmLimitPerDay(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra KM Rate (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={extraKmRate}
                      onChange={(e) => {
                        setExtraKmRate(e.target.value);
                        if (errors.extraKmRate) {
                          setErrors((prev) => ({ ...prev, extraKmRate: '' }));
                        }
                      }}
                      placeholder="e.g., 10"
                      className={cn(
                        'w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500',
                        errors.extraKmRate ? 'border-red-500' : 'border-gray-200'
                      )}
                    />
                  </div>
                  {errors.extraKmRate && (
                    <p className="text-red-500 text-sm mt-1">{errors.extraKmRate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Preview */}
            {dailyRate && (
              <div className="bg-indigo-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">Pricing Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Daily</p>
                    <p className="font-semibold text-indigo-600">₹{dailyRate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Weekly</p>
                    <p className="font-semibold text-gray-900">
                      ₹{weeklyRate || parseInt(dailyRate) * 7}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">KM Limit</p>
                    <p className="font-semibold text-gray-900">{kmLimitPerDay} km/day</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deposit</p>
                    <p className="font-semibold text-gray-900">₹{securityDeposit || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={currentStep === 1 ? 'invisible' : ''}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Car...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add Car
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
