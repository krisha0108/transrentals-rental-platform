'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Save,
  Search,
  AlertCircle,
  Car,
  Fuel,
  Gauge,
  Users,
  IndianRupee,
  Wrench,
  Zap,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import MediaPicker from '@/components/admin/MediaPicker';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface SubService {
  id: string;
  name: string;
  slug: string;
}

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
}

interface VehicleModel {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  serviceId: string;
  subServiceId: string | null;
  vehicleCategoryId: string | null;
  sideImage: string | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  engineCC: number | null;
  mileage: string | null;
  basePricePerDay: number | null;
  isActive: boolean;
  displayOrder: number;
  brand: Brand;
  sub_service?: SubService | null;
  vehicle_category?: VehicleCategory | null;
  _count?: {
    vendorFleets: number;
  };
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const TRANSMISSION_TYPES = ['Manual', 'Automatic', 'Semi-Automatic'];
const TRUCK_BODY_TYPES = ['Open', 'Closed', 'Container', 'Flatbed', 'Tanker', 'Refrigerated'];
const TRUCK_WHEEL_OPTIONS = ['4 Wheeler', '6 Wheeler', '10 Wheeler', '12 Wheeler', '14 Wheeler', '16 Wheeler', '18 Wheeler', '22 Wheeler'];
const BUS_TYPES = ['AC Seater', 'Non-AC Seater', 'AC Sleeper', 'Non-AC Sleeper', 'Luxury Coach', 'Semi-Sleeper', 'Volvo', 'Mercedes'];
const BUS_AC_OPTIONS = ['AC', 'Non-AC', 'Both'];

// Service-specific field configurations
const getServiceFields = (serviceSlug: string) => {
  switch (serviceSlug) {
    case 'truck-rental':
    case 'transporter':
    case 'truck-tempo-rental':
    case 'mini-truck-rental':
      return {
        showSeating: false,
        showEngine: false,
        showMileage: false,
        showFuel: true,
        showTransmission: false,
        showLoadCapacity: true,
        showBodyType: true,
        showWheels: true,
        showDimensions: false, // Dimensions come from category
      };
    case 'packers-and-movers':
      return {
        showSeating: false,
        showEngine: false,
        showMileage: false,
        showFuel: false,
        showTransmission: false,
        showLoadCapacity: true,
        showBodyType: true,
        showWheels: true,
        showDimensions: false, // Dimensions come from category
      };
    case 'bus-rental':
      return {
        showSeating: true,
        showEngine: false,
        showMileage: false,
        showFuel: true,
        showTransmission: false,
        showLoadCapacity: false,
        showBodyType: false,
        showWheels: false,
        showDimensions: false,
        showBusType: true, // Use bodyType field to store bus type
      };
    case 'bike-rental':
      return {
        showSeating: false,
        showEngine: true,
        showMileage: true,
        showFuel: true,
        showTransmission: false,
        showLoadCapacity: false,
        showBodyType: false,
        showWheels: false,
        showDimensions: false,
      };
    default: // car-rental, self-drive
      return {
        showSeating: true,
        showEngine: true,
        showMileage: true,
        showFuel: true,
        showTransmission: true,
        showLoadCapacity: false,
        showBodyType: false,
        showWheels: false,
        showDimensions: false,
      };
  }
};

// Equipment-specific options
const EQUIPMENT_POWER_TYPES = ['Diesel', 'Electric', 'Hydraulic', 'Petrol', 'Manual', 'Pneumatic'];
const EQUIPMENT_CONDITIONS = ['New', 'Excellent', 'Good', 'Fair'];

// Check if service is equipment rental
const isEquipmentService = (slug: string) => {
  return slug === 'equipment-rental' || slug.includes('equipment') || slug.includes('crane') || slug.includes('jcb');
};

export default function ServiceVehicleModelsPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;

  const [service, setService] = useState<Service | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brandId: '',
    subServiceId: '',
    vehicleCategoryId: '',
    sideImage: '',
    fuelType: '',
    transmission: '',
    seatingCapacity: '',
    engineCC: '',
    mileage: '',
    basePricePerDay: '',
    isActive: true,
    displayOrder: 0,
    // Truck/Packers/Bus specific fields
    loadCapacity: '',
    bodyType: '',
    wheels: '',
    lengthFt: '',
    widthFt: '',
    heightFt: '',
    // Equipment-specific fields
    capacity: '',
    capacityUnit: 'ton',
    powerType: '',
    condition: '',
    hourlyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    operatorRequired: false,
    specifications: '',
  });

  // Get service-specific field configuration
  const serviceFields = getServiceFields(serviceSlug);

  // Fetch service details (includes children for categories)
  const fetchService = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/services?slug=${serviceSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const svc = data[0];
          setService(svc);
          // Also set sub-services from the returned children
          if (svc.children && Array.isArray(svc.children)) {
            setSubServices(svc.children);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch service:', error);
    }
  }, [serviceSlug]);

  // Fetch brands for this service
  const fetchBrands = useCallback(async () => {
    if (!service?.id) return;
    try {
      const res = await fetch(`/api/admin/services/${serviceSlug}/brands`);
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || data);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  }, [service?.id, serviceSlug]);

  // Fetch sub-services (only if not already loaded from service query)
  const fetchSubServices = useCallback(async () => {
    if (!service?.id) return;
    // Skip if we already have subServices from the service query
    if (subServices.length > 0) return;
    try {
      const res = await fetch(`/api/admin/services?parentId=${service.id}`);
      if (res.ok) {
        const data = await res.json();
        setSubServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch sub-services:', error);
    }
  }, [service?.id, subServices.length]);

  // Fetch vehicle categories for this service
  const fetchVehicleCategories = useCallback(async () => {
    if (!service?.id) return;
    try {
      const res = await fetch(`/api/admin/services/${serviceSlug}/vehicles`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.categories) {
          setVehicleCategories(data.categories);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vehicle categories:', error);
    }
  }, [service?.id, serviceSlug]);

  // Fetch vehicle models
  const fetchModels = useCallback(async () => {
    if (!service?.id) return;
    setLoading(true);
    try {
      let url = `/api/admin/services/${serviceSlug}/vehicle-models`;
      if (filterBrand) {
        url += `?brandId=${filterBrand}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  }, [service?.id, serviceSlug, filterBrand]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  useEffect(() => {
    if (service?.id) {
      fetchBrands();
      fetchSubServices();
      fetchVehicleCategories();
      fetchModels();
    }
  }, [service?.id, fetchBrands, fetchSubServices, fetchVehicleCategories, fetchModels]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'name' && !editingModel) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const openAddModal = () => {
    setEditingModel(null);
    setFormData({
      name: '',
      slug: '',
      brandId: '',
      subServiceId: '',
      vehicleCategoryId: '',
      sideImage: '',
      fuelType: '',
      transmission: '',
      seatingCapacity: '',
      engineCC: '',
      mileage: '',
      basePricePerDay: '',
      isActive: true,
      displayOrder: models.length,
      // Truck/Packers specific fields
      loadCapacity: '',
      bodyType: '',
      wheels: '',
      lengthFt: '',
      widthFt: '',
      heightFt: '',
      // Equipment fields
      capacity: '',
      capacityUnit: 'ton',
      powerType: '',
      condition: '',
      hourlyRate: '',
      weeklyRate: '',
      monthlyRate: '',
      operatorRequired: false,
      specifications: '',
    });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (model: VehicleModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      slug: model.slug,
      brandId: model.brandId,
      subServiceId: model.subServiceId || '',
      vehicleCategoryId: model.vehicleCategoryId || '',
      sideImage: model.sideImage || '',
      fuelType: model.fuelType || '',
      transmission: model.transmission || '',
      seatingCapacity: model.seatingCapacity?.toString() || '',
      engineCC: model.engineCC?.toString() || '',
      mileage: model.mileage || '',
      basePricePerDay: model.basePricePerDay?.toString() || '',
      isActive: model.isActive,
      displayOrder: model.displayOrder,
      // Truck/Packers specific fields
      loadCapacity: (model as any).loadCapacity?.toString() || '',
      bodyType: (model as any).bodyType || '',
      wheels: (model as any).wheels || '',
      lengthFt: (model as any).lengthFt?.toString() || '',
      widthFt: (model as any).widthFt?.toString() || '',
      heightFt: (model as any).heightFt?.toString() || '',
      // Equipment fields - parse from model if exists
      capacity: (model as any).capacity?.toString() || '',
      capacityUnit: (model as any).capacityUnit || 'ton',
      powerType: (model as any).powerType || '',
      condition: (model as any).condition || '',
      hourlyRate: (model as any).hourlyRate?.toString() || '',
      weeklyRate: (model as any).weeklyRate?.toString() || '',
      monthlyRate: (model as any).monthlyRate?.toString() || '',
      operatorRequired: (model as any).operatorRequired || false,
      specifications: (model as any).specifications || '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service?.id) return;

    setSaving(true);
    setError(null);

    try {
      const url = editingModel
        ? `/api/admin/services/${serviceSlug}/vehicle-models/${editingModel.id}`
        : `/api/admin/services/${serviceSlug}/vehicle-models`;
      const method = editingModel ? 'PUT' : 'POST';

      const isEquipment = isEquipmentService(serviceSlug);

      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        brandId: formData.brandId,
        serviceId: service.id,
        subServiceId: formData.subServiceId || null,
        vehicleCategoryId: formData.vehicleCategoryId || null,
        sideImage: formData.sideImage || null,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
        // Truck/Packers specific fields
        loadCapacity: formData.loadCapacity ? parseFloat(formData.loadCapacity) : null,
        bodyType: formData.bodyType || null,
        wheels: formData.wheels || null,
        lengthFt: formData.lengthFt ? parseFloat(formData.lengthFt) : null,
        widthFt: formData.widthFt ? parseFloat(formData.widthFt) : null,
        heightFt: formData.heightFt ? parseFloat(formData.heightFt) : null,
      };

      if (isEquipment) {
        // Equipment-specific fields
        payload.capacity = formData.capacity ? parseFloat(formData.capacity) : null;
        payload.capacityUnit = formData.capacityUnit || 'ton';
        payload.powerType = formData.powerType || null;
        payload.condition = formData.condition || null;
        payload.hourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : null;
        payload.basePricePerDay = formData.basePricePerDay ? parseFloat(formData.basePricePerDay) : null;
        payload.weeklyRate = formData.weeklyRate ? parseFloat(formData.weeklyRate) : null;
        payload.monthlyRate = formData.monthlyRate ? parseFloat(formData.monthlyRate) : null;
        payload.operatorRequired = formData.operatorRequired;
        payload.specifications = formData.specifications || null;
        payload.fuelType = formData.powerType || null; // Map powerType to fuelType for DB
      } else {
        // Vehicle-specific fields
        payload.fuelType = formData.fuelType || null;
        payload.transmission = formData.transmission || null;
        payload.seatingCapacity = formData.seatingCapacity ? parseInt(formData.seatingCapacity) : null;
        payload.engineCC = formData.engineCC ? parseInt(formData.engineCC) : null;
        payload.mileage = formData.mileage || null;
        payload.basePricePerDay = formData.basePricePerDay ? parseFloat(formData.basePricePerDay) : null;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchModels();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to save vehicle model');
      }
    } catch (error) {
      setError('Failed to save vehicle model');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (model: VehicleModel) => {
    if (model._count && model._count.vendorFleets > 0) {
      alert('Cannot delete model with vendor fleets. Remove vendor fleets first.');
      return;
    }

    if (!confirm(`Delete "${model.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/services/${serviceSlug}/vehicle-models/${model.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchModels();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete model');
      }
    } catch (error) {
      alert('Failed to delete model');
    }
  };

  const filteredModels = search
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.brand.name.toLowerCase().includes(search.toLowerCase())
      )
    : models;

  if (!service) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEquipmentService(serviceSlug) ? 'Equipment Models' : 'Vehicle Models'}
          </h1>
          <p className="text-gray-600">
            Manage {isEquipmentService(serviceSlug) ? 'equipment' : 'vehicle'} catalog for {service.name}
          </p>
        </div>
        <Button onClick={openAddModal} disabled={brands.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Add {isEquipmentService(serviceSlug) ? 'Equipment' : 'Model'}
        </Button>
      </div>

      {brands.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-amber-800">
            Add brands first before creating vehicle models.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={fetchModels}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicle models found</h3>
          <p className="text-gray-500 mb-4">Add vehicle models for {service.name}</p>
          {brands.length > 0 && (
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Model
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-100">
                {model.sideImage ? (
                  <Image
                    src={model.sideImage}
                    alt={model.name}
                    fill
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                <span
                  className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                    model.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {model.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {model.brand.logo && (
                    <img
                      src={model.brand.logo}
                      alt={model.brand.name}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span className="text-sm text-gray-500">{model.brand.name}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{model.name}</h3>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  {model.fuelType && (
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" />
                      <span>{model.fuelType}</span>
                    </div>
                  )}
                  {model.transmission && (
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{model.transmission}</span>
                    </div>
                  )}
                  {model.seatingCapacity && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{model.seatingCapacity} Seats</span>
                    </div>
                  )}
                  {model.basePricePerDay && (
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{model.basePricePerDay}/day</span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-500 mb-3">
                  {model._count?.vendorFleets || 0} vendor fleets
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => openEditModal(model)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(model)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingModel
                  ? `Edit ${isEquipmentService(serviceSlug) ? 'Equipment' : 'Vehicle'} Model`
                  : `Add ${isEquipmentService(serviceSlug) ? 'Equipment' : 'Vehicle'} Model`}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vehicle Image - Using MediaPicker */}
              <MediaPicker
                value={formData.sideImage}
                onChange={(url) => setFormData((prev) => ({ ...prev, sideImage: url }))}
                label="Vehicle Image"
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <select
                    name="brandId"
                    value={formData.brandId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category - Use vehicleCategories if available, otherwise subServices */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name={vehicleCategories.length > 0 ? "vehicleCategoryId" : "subServiceId"}
                    value={vehicleCategories.length > 0 ? formData.vehicleCategoryId : formData.subServiceId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {/* Show vehicle categories if available */}
                    {vehicleCategories.length > 0 ? (
                      vehicleCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    ) : (
                      subServices.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))
                    )}
                  </select>
                  {vehicleCategories.length === 0 && subServices.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No categories found. Add categories in the Categories section first.
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={
                      serviceSlug === 'bus-rental' ? 'e.g., Volvo 9600' :
                      (serviceSlug === 'truck-rental' || serviceSlug === 'transporter' || serviceSlug === 'truck-tempo-rental') ? 'e.g., Tata 407' :
                      serviceSlug === 'bike-rental' ? 'e.g., Activa 6G' :
                      'e.g., Ertiga'
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Fuel Type - for car, bike, bus, truck */}
                {serviceFields.showFuel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Fuel Type</option>
                      {FUEL_TYPES.map((fuel) => (
                        <option key={fuel} value={fuel}>
                          {fuel}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Transmission - for car only */}
                {serviceFields.showTransmission && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmission
                    </label>
                    <select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Transmission</option>
                      {TRANSMISSION_TYPES.map((trans) => (
                        <option key={trans} value={trans}>
                          {trans}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Seating - for car, bus */}
                {serviceFields.showSeating && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seating Capacity
                    </label>
                    <input
                      type="number"
                      name="seatingCapacity"
                      value={formData.seatingCapacity}
                      onChange={handleChange}
                      placeholder={serviceSlug === 'bus-rental' ? 'e.g., 50' : 'e.g., 5'}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Bus Type - for buses */}
                {serviceFields.showBusType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bus Type
                    </label>
                    <select
                      name="bodyType"
                      value={formData.bodyType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Bus Type</option>
                      {BUS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Engine CC - for car, bike */}
                {serviceFields.showEngine && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Engine (CC)
                    </label>
                    <input
                      type="number"
                      name="engineCC"
                      value={formData.engineCC}
                      onChange={handleChange}
                      placeholder="e.g., 110"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Mileage - for car, bike */}
                {serviceFields.showMileage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage
                    </label>
                    <input
                      type="text"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleChange}
                      placeholder="e.g., 50 km/l"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Load Capacity - for truck, packers */}
                {serviceFields.showLoadCapacity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Load Capacity (Tons)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      name="loadCapacity"
                      value={formData.loadCapacity}
                      onChange={handleChange}
                      placeholder="e.g., 2.5"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Body Type - for truck, packers */}
                {serviceFields.showBodyType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Type
                    </label>
                    <select
                      name="bodyType"
                      value={formData.bodyType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Body Type</option>
                      {TRUCK_BODY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Wheels - for truck, packers */}
                {serviceFields.showWheels && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wheels
                    </label>
                    <select
                      name="wheels"
                      value={formData.wheels}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Wheels</option>
                      {TRUCK_WHEEL_OPTIONS.map((wheel) => (
                        <option key={wheel} value={wheel}>
                          {wheel}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dimensions - for truck, packers */}
                {serviceFields.showDimensions && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Length (Ft)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        name="lengthFt"
                        value={formData.lengthFt}
                        onChange={handleChange}
                        placeholder="e.g., 14"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width (Ft)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        name="widthFt"
                        value={formData.widthFt}
                        onChange={handleChange}
                        placeholder="e.g., 6"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (Ft)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        name="heightFt"
                        value={formData.heightFt}
                        onChange={handleChange}
                        placeholder="e.g., 7"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Equipment-specific fields */}
                {isEquipmentService(serviceSlug) && (
                  <>
                    {/* Capacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity/Tonnage
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleChange}
                          placeholder="e.g., 10"
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          name="capacityUnit"
                          value={formData.capacityUnit}
                          onChange={handleChange}
                          className="w-24 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ton">Ton</option>
                          <option value="kg">KG</option>
                          <option value="kva">KVA</option>
                          <option value="hp">HP</option>
                          <option value="m3">M³</option>
                          <option value="feet">Feet</option>
                        </select>
                      </div>
                    </div>

                    {/* Power Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Power Type
                      </label>
                      <select
                        name="powerType"
                        value={formData.powerType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Power Type</option>
                        {EQUIPMENT_POWER_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment Condition
                      </label>
                      <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Condition</option>
                        {EQUIPMENT_CONDITIONS.map((cond) => (
                          <option key={cond} value={cond}>
                            {cond}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hourly Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        placeholder="e.g., 2500"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Daily Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="basePricePerDay"
                        value={formData.basePricePerDay}
                        onChange={handleChange}
                        placeholder="e.g., 15000"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Weekly Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weekly Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="weeklyRate"
                        value={formData.weeklyRate}
                        onChange={handleChange}
                        placeholder="e.g., 90000"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Monthly Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="monthlyRate"
                        value={formData.monthlyRate}
                        onChange={handleChange}
                        placeholder="e.g., 300000"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Operator Required */}
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="operatorRequired"
                          checked={formData.operatorRequired}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Operator Required</span>
                      </label>
                    </div>

                    {/* Specifications */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Technical Specifications
                      </label>
                      <textarea
                        name="specifications"
                        value={formData.specifications}
                        onChange={handleChange}
                        placeholder="Enter technical specifications (e.g., Engine: 6.6L Diesel, Max Lift: 25m, Boom Length: 30m)"
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Base Price/Day - for non-equipment services */}
                {!isEquipmentService(serviceSlug) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price/Day (₹)
                    </label>
                    <input
                      type="number"
                      name="basePricePerDay"
                      value={formData.basePricePerDay}
                      onChange={handleChange}
                      placeholder="e.g., 399"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingModel ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
