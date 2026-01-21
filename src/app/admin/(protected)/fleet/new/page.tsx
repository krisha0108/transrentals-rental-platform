'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Car,
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
  Upload,
  FolderOpen,
  MapPin,
  IndianRupee,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaPicker from '@/components/admin/MediaPicker';

interface SpecField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  options?: string[];
}

interface FleetType {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  specFields: SpecField[] | null;
  types: FleetType[];
}

interface Location {
  id: string;
  name: string;
  slug: string;
  state: string;
}

interface LocationRate {
  locationId: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  kmLimit: number;
  extraKmRate: number;
  securityDeposit: number;
  isActive: boolean;
  location?: Location;
}

interface Availability {
  locationId: string;
  isAvailable: boolean;
  quantity: number;
  location?: Location;
}

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'rates' | 'availability'>('details');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    categoryId: '',
    typeId: '',
    vehicleType: '',
    basePrice: '',
    description: '',
    shortDesc: '',
    primaryImage: '',
    availabilityType: 'ALL_INDIA',
    isActive: true,
    isFeatured: false,
    priority: 5,
  });
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [features, setFeatures] = useState<string[]>(['']);
  const [seoKeywords, setSeoKeywords] = useState<string[]>(['']);
  const [locationRates, setLocationRates] = useState<LocationRate[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/fleet/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/admin/fleet/locations?activeOnly=true');
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const addLocationRate = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    if (!location || locationRates.some((r) => r.locationId === locationId)) return;

    setLocationRates([
      ...locationRates,
      {
        locationId,
        dailyRate: parseFloat(formData.basePrice) || 0,
        kmLimit: 100,
        extraKmRate: 5,
        securityDeposit: 2000,
        isActive: true,
        location,
      },
    ]);
  };

  const addAvailability = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    if (!location || availability.some((a) => a.locationId === locationId)) return;

    setAvailability([
      ...availability,
      {
        locationId,
        isAvailable: true,
        quantity: 1,
        location,
      },
    ]);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    setSelectedCategory(category || null);
    setFormData((prev) => ({
      ...prev,
      categoryId,
      typeId: '',
      vehicleType: '',
      // Set default availability type based on category
      availabilityType: category?.slug === 'bus-rental' || category?.slug === 'truck-rental'
        ? 'ALL_INDIA'
        : 'SPECIFIC_LOCATIONS',
    }));
    // Reset specs when category changes
    setSpecs({});
  };

  const handleTypeChange = (typeId: string) => {
    const type = selectedCategory?.types.find((t) => t.id === typeId);
    setFormData((prev) => ({
      ...prev,
      typeId,
      vehicleType: type?.name || '',
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleSpecChange = (fieldName: string, value: string) => {
    setSpecs((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handlePrimaryImageUpload = async (file?: File) => {
    if (!file) return;

    setUploadingImage(true);
    setImageUploadError('');

    try {
      const payload = new FormData();
      payload.append('file', file);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || 'Failed to upload image');
      }

      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        primaryImage: data.url || prev.primaryImage,
      }));
    } catch (error: any) {
      console.error('Image upload failed:', error);
      setImageUploadError(error?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build specs object from dynamic fields
      const specsData: Record<string, any> = {};
      Object.entries(specs).forEach(([key, value]) => {
        if (value) {
          // Check if it should be a number
          const specField = selectedCategory?.specFields?.find((f) => f.name === key);
          if (specField?.type === 'number') {
            specsData[key] = parseInt(value) || value;
          } else {
            specsData[key] = value;
          }
        }
      });

      const payload = {
        name: formData.name,
        slug: formData.slug,
        brand: formData.brand,
        categoryId: formData.categoryId,
        typeId: formData.typeId || null,
        vehicleType: formData.vehicleType,
        basePrice: formData.basePrice,
        description: formData.description,
        shortDesc: formData.shortDesc,
        primaryImage: formData.primaryImage || null,
        availabilityType: formData.availabilityType,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        priority: formData.priority,
        specs: Object.keys(specsData).length > 0 ? specsData : null,
        features: features.filter(Boolean),
        seoKeywords: seoKeywords.filter(Boolean),
      };

      const res = await fetch('/api/admin/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdVehicle = await res.json();
        const fleetId = createdVehicle.id;

        // Save location rates if any
        if (locationRates.length > 0) {
          try {
            await fetch('/api/admin/fleet/rates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fleetId, rates: locationRates }),
            });
          } catch (error) {
            console.error('Failed to save location rates:', error);
          }
        }

        // Save availability if SPECIFIC_LOCATIONS and has entries
        if (formData.availabilityType === 'SPECIFIC_LOCATIONS' && availability.length > 0) {
          try {
            await fetch('/api/admin/fleet/availability', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fleetId, availability }),
            });
          } catch (error) {
            console.error('Failed to save availability:', error);
          }
        }

        router.push('/admin/fleet');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create vehicle');
      }
    } catch (error) {
      console.error('Failed to create vehicle:', error);
      alert('Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Get spec fields to render based on selected category
  const specFields = selectedCategory?.specFields || [];

  // Default spec fields if category doesn't have custom ones
  const defaultSpecFields: SpecField[] = [
    { name: 'engine', label: 'Engine', type: 'text' },
    { name: 'mileage', label: 'Mileage', type: 'text' },
    { name: 'seating', label: 'Seating', type: 'number' },
    { name: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic', 'Manual/Automatic'] },
    { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Petrol/Diesel', 'Electric', 'CNG'] },
    { name: 'capacity', label: 'Capacity', type: 'text' },
  ];

  const fieldsToRender = specFields.length > 0 ? specFields : defaultSpecFields;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/fleet">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
          <p className="text-gray-600">Add a new vehicle to your fleet</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'details'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Car className="w-4 h-4 inline mr-2" />
          Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'rates'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <IndianRupee className="w-4 h-4 inline mr-2" />
          Location Rates ({locationRates.length})
        </button>
        {formData.availabilityType === 'SPECIFIC_LOCATIONS' && (
          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'availability'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Availability ({availability.length})
          </button>
        )}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category & Type Selection - FIRST */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            Service Category & Type
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the service type (Bike Rental, Self Drive, Bus, Truck, etc.)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type *
              </label>
              {selectedCategory && selectedCategory.types.length > 0 ? (
                <select
                  name="typeId"
                  value={formData.typeId}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  {selectedCategory.types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  placeholder="e.g., Cruiser, SUV, Sedan"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {selectedCategory?.types.length
                  ? 'Select from available types'
                  : 'No types configured. Enter manually or add types in Fleet > Types'}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Royal Enfield Classic 350"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="royal-enfield-classic-350"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g., Royal Enfield"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price (₹/day) *
              </label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                placeholder="e.g., 599"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              name="shortDesc"
              value={formData.shortDesc}
              onChange={handleChange}
              placeholder="Brief description for cards"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the vehicle"
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dynamic Specifications based on Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">
            Specifications
            {selectedCategory && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                for {selectedCategory.name}
              </span>
            )}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {fieldsToRender.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' && field.options ? (
                  <select
                    value={specs[field.name] || ''}
                    onChange={(e) => handleSpecChange(field.name, e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={field.required}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={specs[field.name] || ''}
                    onChange={(e) => handleSpecChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Features</h2>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...features];
                    newFeatures[index] = e.target.value;
                    setFeatures(newFeatures);
                  }}
                  placeholder="e.g., Comfortable Seating"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFeatures(features.filter((_, i) => i !== index))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFeatures([...features, ''])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Vehicle Image
          </h2>

          {/* Current Image Preview */}
          {formData.primaryImage && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Image</p>
              <div className="relative inline-block">
                <div className="relative h-40 w-40 overflow-hidden rounded-xl border-2 border-gray-200 shadow-md bg-gray-100">
                  <img
                    src={formData.primaryImage}
                    alt="Uploaded vehicle"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/fleet/honda-city.jpg';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, primaryImage: '' }))}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 max-w-[160px] truncate">{formData.primaryImage}</p>
            </div>
          )}

          {/* Image Selection Options */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Option 1: Media Gallery */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Media Gallery</p>
                  <p className="text-xs text-gray-500">Select from uploaded images</p>
                </div>
              </div>
              <MediaPicker
                value={formData.primaryImage}
                onChange={(url) => setFormData((prev) => ({ ...prev, primaryImage: url }))}
                label=""
              />
            </div>

            {/* Option 2: Upload New */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Upload New</p>
                  <p className="text-xs text-gray-500">Upload a new image</p>
                </div>
              </div>
              <div className="space-y-3">
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${
                    uploadingImage
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 10MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePrimaryImageUpload(e.target.files?.[0])}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                {imageUploadError && (
                  <p className="text-xs text-red-500">{imageUploadError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability Type
              </label>
              <select
                name="availabilityType"
                value={formData.availabilityType}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL_INDIA">All India (Buses, Tempo Travellers, Trucks)</option>
                <option value="SPECIFIC_LOCATIONS">Specific Locations Only (Bikes, Self-Drive Cars)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.availabilityType === 'ALL_INDIA'
                  ? 'Vehicle available across all of India'
                  : 'Vehicle only available at specific locations (configure in edit page)'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                min={1}
                max={10}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher priority vehicles appear first in listings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
        </div>

        {/* SEO Keywords */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">SEO Keywords</h2>
          <div className="space-y-2">
            {seoKeywords.map((keyword, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    const newKeywords = [...seoKeywords];
                    newKeywords[index] = e.target.value;
                    setSeoKeywords(newKeywords);
                  }}
                  placeholder="e.g., bullet on rent"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSeoKeywords(seoKeywords.filter((_, i) => i !== index))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSeoKeywords([...seoKeywords, ''])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Keyword
            </Button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/fleet">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Vehicle
              </>
            )}
          </Button>
        </div>
      </form>
      )}

      {/* Location Rates Tab */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Location-Specific Rates</h2>
              <select
                onChange={(e) => addLocationRate(e.target.value)}
                value=""
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Add Location...</option>
                {locations
                  .filter((l) => !locationRates.some((r) => r.locationId === l.id))
                  .map((l) => (
                    <option key={l.id} value={l.id}>{l.name}, {l.state}</option>
                  ))}
              </select>
            </div>

            {locationRates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No location rates configured. Add locations to set specific pricing.</p>
            ) : (
              <div className="space-y-4">
                {locationRates.map((rate, idx) => (
                  <div key={rate.locationId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{rate.location?.name}</span>
                        <span className="text-gray-500">{rate.location?.state}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocationRates(locationRates.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Daily Rate (₹)</label>
                        <input
                          type="number"
                          value={rate.dailyRate}
                          onChange={(e) => {
                            const newRates = [...locationRates];
                            newRates[idx].dailyRate = parseFloat(e.target.value) || 0;
                            setLocationRates(newRates);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Weekly Rate (₹)</label>
                        <input
                          type="number"
                          value={rate.weeklyRate || ''}
                          onChange={(e) => {
                            const newRates = [...locationRates];
                            newRates[idx].weeklyRate = parseFloat(e.target.value) || undefined;
                            setLocationRates(newRates);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">KM Limit/Day</label>
                        <input
                          type="number"
                          value={rate.kmLimit}
                          onChange={(e) => {
                            const newRates = [...locationRates];
                            newRates[idx].kmLimit = parseInt(e.target.value) || 100;
                            setLocationRates(newRates);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Security Deposit (₹)</label>
                        <input
                          type="number"
                          value={rate.securityDeposit}
                          onChange={(e) => {
                            const newRates = [...locationRates];
                            newRates[idx].securityDeposit = parseFloat(e.target.value) || 2000;
                            setLocationRates(newRates);
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            💡 Location rates will be saved when you create the vehicle from the Details tab.
          </p>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && formData.availabilityType === 'SPECIFIC_LOCATIONS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Location Availability</h2>
              <select
                onChange={(e) => addAvailability(e.target.value)}
                value=""
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Add Location...</option>
                {locations
                  .filter((l) => !availability.some((a) => a.locationId === l.id))
                  .map((l) => (
                    <option key={l.id} value={l.id}>{l.name}, {l.state}</option>
                  ))}
              </select>
            </div>

            {availability.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No locations configured. Add locations where this vehicle is available.</p>
            ) : (
              <div className="space-y-3">
                {availability.map((avail, idx) => (
                  <div key={avail.locationId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={avail.isAvailable}
                        onChange={(e) => {
                          const newAvail = [...availability];
                          newAvail[idx].isAvailable = e.target.checked;
                          setAvailability(newAvail);
                        }}
                        className="w-4 h-4"
                      />
                    </label>
                    <div className="flex-1">
                      <span className="font-medium">{avail.location?.name}</span>
                      <span className="text-gray-500 ml-2">{avail.location?.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">Qty:</label>
                      <input
                        type="number"
                        value={avail.quantity}
                        onChange={(e) => {
                          const newAvail = [...availability];
                          newAvail[idx].quantity = parseInt(e.target.value) || 1;
                          setAvailability(newAvail);
                        }}
                        min={0}
                        className="w-20 px-2 py-1 border rounded"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAvailability(availability.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            💡 Availability will be saved when you create the vehicle from the Details tab.
          </p>
        </div>
      )}
    </div>
  );
}
