'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Car,
  Plus,
  Pencil,
  Trash2,
  Users,
  Save,
  Loader2,
  Star,
  X,
  Truck,
  Package,
  Ruler,
  Bike,
  Gauge,
  Fuel,
  Bus,
  Wifi,
  Tv,
  BatteryCharging,
  Armchair,
} from 'lucide-react';

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seatingCapacity: number;
  luggageCapacity: string | null;
  acType: string | null;
  fuelType: string | null;
  image: string | null;
  icon: string | null;
  exampleVehicles: string | null;
  displayOrder: number;
  isActive: boolean;
  isPopular: boolean;
  cityPricingCount: number;
  localPackagesCount: number;
  routePackagesCount: number;
  // Truck specific
  loadCapacity?: number | null;
  bodyType?: string | null;
  wheels?: string | null;
  lengthFt?: number | null;
  widthFt?: number | null;
  heightFt?: number | null;
  // Equipment specific
  powerCapacity?: string | null;
  equipmentFuelType?: string | null;
  operatorIncluded?: boolean;
  dailyRate?: number | null;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
  securityDeposit?: number | null;
  specifications?: string | null;
  // Bike specific
  engineCC?: string | null;
  bikeType?: string | null;
  mileage?: string | null;
  topSpeed?: string | null;
  // Bus specific
  busType?: string | null;
  amenities?: string | null;
  hasPushbackSeats?: boolean;
  hasTV?: boolean;
  hasCharging?: boolean;
  hasWifi?: boolean;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  seatingCapacity: number;
  luggageCapacity: string;
  acType: string;
  fuelType: string;
  image: string;
  exampleVehicles: string;
  displayOrder: number;
  isActive: boolean;
  isPopular: boolean;
  // Truck specific
  loadCapacity: string;
  bodyType: string;
  wheels: string;
  lengthFt: string;
  widthFt: string;
  heightFt: string;
  // Equipment specific
  powerCapacity: string;
  equipmentFuelType: string;
  operatorIncluded: boolean;
  dailyRate: string;
  weeklyRate: string;
  monthlyRate: string;
  securityDeposit: string;
  specifications: string;
  // Bike specific
  engineCC: string;
  bikeType: string;
  mileage: string;
  topSpeed: string;
  // Bus specific
  busType: string;
  amenities: string;
  hasPushbackSeats: boolean;
  hasTV: boolean;
  hasCharging: boolean;
  hasWifi: boolean;
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  description: '',
  seatingCapacity: 4,
  luggageCapacity: '',
  acType: 'AC',
  fuelType: 'Diesel',
  image: '',
  exampleVehicles: '',
  displayOrder: 0,
  isActive: true,
  isPopular: false,
  // Truck specific
  loadCapacity: '',
  bodyType: '',
  wheels: '',
  lengthFt: '',
  widthFt: '',
  heightFt: '',
  // Equipment specific
  powerCapacity: '',
  equipmentFuelType: 'Diesel',
  operatorIncluded: false,
  dailyRate: '',
  weeklyRate: '',
  monthlyRate: '',
  securityDeposit: '',
  specifications: '',
  // Bike specific
  engineCC: '',
  bikeType: '',
  mileage: '',
  topSpeed: '',
  // Bus specific
  busType: '',
  amenities: '',
  hasPushbackSeats: false,
  hasTV: false,
  hasCharging: false,
  hasWifi: false,
};

const serviceNames: Record<string, string> = {
  'car-rental': 'Car Rental',
  'luxury-car-rental': 'Luxury Car Rental',
  'bus-rental': 'Bus Rental',
  'truck-rental': 'Truck Rental',
  'transporter': 'Transporter',
  'packers-and-movers': 'Packers & Movers',
  'equipment-rental': 'Equipment Rental',
  'self-drive-car-rental': 'Self-Drive Car Rental',
  'bike-rental': 'Bike Rental',
  'bike-on-rent': 'Bike On Rent',
};

const TRUCK_BODY_TYPES = ['Open', 'Closed', 'Container', 'Flatbed', 'Tanker', 'Refrigerated'];
const TRUCK_WHEEL_OPTIONS = ['4 Wheeler', '6 Wheeler', '10 Wheeler', '12 Wheeler', '14 Wheeler', '16 Wheeler', '18 Wheeler', '22 Wheeler'];
const EQUIPMENT_FUEL_TYPES = ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'Manual'];
const BIKE_ENGINE_OPTIONS = ['100cc', '110cc', '125cc', '150cc', '160cc', '180cc', '200cc', '220cc', '250cc', '300cc', '350cc', '400cc', '500cc', '650cc'];
const BIKE_TYPES = ['Scooter', 'Commuter', 'Sports', 'Cruiser', 'Adventure', 'Electric'];
const BUS_TYPES = ['Mini Bus', 'Tempo Traveller', 'Standard Bus', 'Luxury Bus', 'Volvo', 'Volvo Sleeper', 'Semi-Sleeper', 'Sleeper', 'AC Coach', 'Non-AC Coach'];
const BUS_SEATING_OPTIONS = [12, 13, 14, 15, 17, 18, 20, 21, 25, 26, 27, 32, 35, 40, 41, 45, 49, 52, 56];

// Check if service is truck or packers type
const isTruckService = (slug: string) => ['truck-rental', 'transporter', 'packers-and-movers', 'mini-truck-rental'].includes(slug);
// Check if service is equipment rental
const isEquipmentService = (slug: string) => slug === 'equipment-rental';
// Check if service is bike rental
const isBikeService = (slug: string) => ['bike-rental', 'bike-on-rent'].includes(slug);
// Check if service is bus rental
const isBusService = (slug: string) => ['bus-rental', 'bus-on-rent'].includes(slug);

export default function ServiceVehiclesPage() {
  const params = useParams();
  const serviceSlug = (params?.slug as string) || '';
  const serviceName = serviceNames[serviceSlug] || serviceSlug;

  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/admin/services/${serviceSlug}/vehicles`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (serviceSlug) {
      fetchCategories();
    }
  }, [serviceSlug]);

  const handleEdit = (category: VehicleCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      seatingCapacity: category.seatingCapacity,
      luggageCapacity: category.luggageCapacity || '',
      acType: category.acType || 'AC',
      fuelType: category.fuelType || 'Diesel',
      image: category.image || '',
      exampleVehicles: category.exampleVehicles || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      isPopular: category.isPopular,
      // Truck specific
      loadCapacity: category.loadCapacity?.toString() || '',
      bodyType: category.bodyType || '',
      wheels: category.wheels || '',
      lengthFt: category.lengthFt?.toString() || '',
      widthFt: category.widthFt?.toString() || '',
      heightFt: category.heightFt?.toString() || '',
      // Equipment specific
      powerCapacity: category.powerCapacity || '',
      equipmentFuelType: category.equipmentFuelType || 'Diesel',
      operatorIncluded: category.operatorIncluded || false,
      dailyRate: category.dailyRate?.toString() || '',
      weeklyRate: category.weeklyRate?.toString() || '',
      monthlyRate: category.monthlyRate?.toString() || '',
      securityDeposit: category.securityDeposit?.toString() || '',
      specifications: category.specifications || '',
      // Bike specific
      engineCC: category.engineCC || '',
      bikeType: category.bikeType || '',
      mileage: category.mileage || '',
      topSpeed: category.topSpeed || '',
      // Bus specific
      busType: category.busType || '',
      amenities: category.amenities || '',
      hasPushbackSeats: category.hasPushbackSeats || false,
      hasTV: category.hasTV || false,
      hasCharging: category.hasCharging || false,
      hasWifi: category.hasWifi || false,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      ...initialFormData,
      displayOrder: categories.length, // Auto-increment based on existing categories
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const url = editingId
        ? `/api/admin/services/${serviceSlug}/vehicles/${editingId}`
        : `/api/admin/services/${serviceSlug}/vehicles`;
      const method = editingId ? 'PATCH' : 'POST';

      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
        isPopular: formData.isPopular,
      };

      // Add service-specific fields
      if (isEquipmentService(serviceSlug)) {
        // Equipment fields
        payload.powerCapacity = formData.powerCapacity || null;
        payload.equipmentFuelType = formData.equipmentFuelType || null;
        payload.operatorIncluded = formData.operatorIncluded;
        payload.dailyRate = formData.dailyRate ? parseFloat(formData.dailyRate) : null;
        payload.weeklyRate = formData.weeklyRate ? parseFloat(formData.weeklyRate) : null;
        payload.monthlyRate = formData.monthlyRate ? parseFloat(formData.monthlyRate) : null;
        payload.securityDeposit = formData.securityDeposit ? parseFloat(formData.securityDeposit) : null;
        payload.specifications = formData.specifications || null;
      } else if (isTruckService(serviceSlug)) {
        // Truck/Packers fields
        payload.loadCapacity = formData.loadCapacity ? parseFloat(formData.loadCapacity) : null;
        payload.bodyType = formData.bodyType || null;
        payload.wheels = formData.wheels || null;
        payload.lengthFt = formData.lengthFt ? parseFloat(formData.lengthFt) : null;
        payload.widthFt = formData.widthFt ? parseFloat(formData.widthFt) : null;
        payload.heightFt = formData.heightFt ? parseFloat(formData.heightFt) : null;
      } else if (isBikeService(serviceSlug)) {
        // Bike fields
        payload.engineCC = formData.engineCC || null;
        payload.bikeType = formData.bikeType || null;
        payload.mileage = formData.mileage || null;
        payload.topSpeed = formData.topSpeed || null;
        payload.fuelType = formData.fuelType;
      } else if (isBusService(serviceSlug)) {
        // Bus fields
        payload.busType = formData.busType || null;
        payload.seatingCapacity = formData.seatingCapacity;
        payload.acType = formData.acType;
        payload.luggageCapacity = formData.luggageCapacity;
        payload.amenities = formData.amenities || null;
        payload.hasPushbackSeats = formData.hasPushbackSeats;
        payload.hasTV = formData.hasTV;
        payload.hasCharging = formData.hasCharging;
        payload.hasWifi = formData.hasWifi;
      } else {
        // Car fields
        payload.seatingCapacity = formData.seatingCapacity;
        payload.luggageCapacity = formData.luggageCapacity;
        payload.acType = formData.acType;
        payload.fuelType = formData.fuelType;
        payload.image = formData.image || null;
        payload.exampleVehicles = formData.exampleVehicles || null;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchCategories();
      } else {
        setError(data.error + (data.details ? `: ${data.details}` : ''));
      }
    } catch (err: any) {
      setError('Failed to save vehicle category: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle category?')) return;

    try {
      const response = await fetch(`/api/admin/services/${serviceSlug}/vehicles/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Failed to delete vehicle category');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Categories</h1>
          <p className="text-gray-600">Manage vehicle categories for {serviceName}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Vehicle Category' : 'Add Vehicle Category'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: editingId ? formData.slug : generateSlug(e.target.value),
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      isBikeService(serviceSlug)
                        ? "e.g., Activa, Splendor, Pulsar"
                        : isTruckService(serviceSlug)
                        ? "e.g., Tata Ace, Eicher 14ft"
                        : isEquipmentService(serviceSlug)
                        ? "e.g., JCB 3DX, Crane 20T"
                        : "e.g., Sedan, Innova Crysta"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="sedan"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder={
                    isBikeService(serviceSlug)
                      ? "Brief description of this bike category"
                      : "Brief description of this vehicle category"
                  }
                />
              </div>

              {/* Service-specific fields */}
              {isEquipmentService(serviceSlug) ? (
                <>
                  {/* Equipment Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Power/Capacity
                      </label>
                      <input
                        type="text"
                        value={formData.powerCapacity}
                        onChange={(e) => setFormData({ ...formData, powerCapacity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 20 Ton, 100 HP, 50 KVA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuel Type
                      </label>
                      <select
                        value={formData.equipmentFuelType}
                        onChange={(e) => setFormData({ ...formData, equipmentFuelType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {EQUIPMENT_FUEL_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.dailyRate}
                        onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 5000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weekly Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.weeklyRate}
                        onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 30000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.monthlyRate}
                        onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 100000"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Deposit (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.securityDeposit}
                        onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 10000"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="operatorIncluded"
                        checked={formData.operatorIncluded}
                        onChange={(e) => setFormData({ ...formData, operatorIncluded: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="operatorIncluded" className="text-sm font-medium text-gray-700">
                        Operator Included in Rate
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specifications
                    </label>
                    <textarea
                      value={formData.specifications}
                      onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter equipment specifications (bucket size, arm reach, etc.)"
                    />
                  </div>
                </>
              ) : isTruckService(serviceSlug) ? (
                <>
                  {/* Truck/Packers Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Load Capacity (Tons)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.loadCapacity}
                        onChange={(e) => setFormData({ ...formData, loadCapacity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Body Type
                      </label>
                      <select
                        value={formData.bodyType}
                        onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Body Type</option>
                        {TRUCK_BODY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wheels
                      </label>
                      <select
                        value={formData.wheels}
                        onChange={(e) => setFormData({ ...formData, wheels: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Wheels</option>
                        {TRUCK_WHEEL_OPTIONS.map((wheel) => (
                          <option key={wheel} value={wheel}>{wheel}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Length (Ft)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.lengthFt}
                        onChange={(e) => setFormData({ ...formData, lengthFt: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 14"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width (Ft)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.widthFt}
                        onChange={(e) => setFormData({ ...formData, widthFt: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (Ft)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.heightFt}
                        onChange={(e) => setFormData({ ...formData, heightFt: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 7"
                      />
                    </div>
                  </div>
                </>
              ) : isBikeService(serviceSlug) ? (
                <>
                  {/* Bike Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bike Type
                      </label>
                      <select
                        value={formData.bikeType}
                        onChange={(e) => setFormData({ ...formData, bikeType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Bike Type</option>
                        {BIKE_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Engine CC
                      </label>
                      <select
                        value={formData.engineCC}
                        onChange={(e) => setFormData({ ...formData, engineCC: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Engine CC</option>
                        {BIKE_ENGINE_OPTIONS.map((cc) => (
                          <option key={cc} value={cc}>{cc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuel Type
                      </label>
                      <select
                        value={formData.fuelType}
                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Electric">Electric</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mileage (km/l)
                      </label>
                      <input
                        type="text"
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 45-50 km/l"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Top Speed (km/h)
                      </label>
                      <input
                        type="text"
                        value={formData.topSpeed}
                        onChange={(e) => setFormData({ ...formData, topSpeed: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 90 km/h"
                      />
                    </div>
                  </div>
                </>
              ) : isBusService(serviceSlug) ? (
                <>
                  {/* Bus Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bus Type *
                      </label>
                      <select
                        value={formData.busType}
                        onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Bus Type</option>
                        {BUS_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seating Capacity *
                      </label>
                      <select
                        value={formData.seatingCapacity}
                        onChange={(e) => setFormData({ ...formData, seatingCapacity: parseInt(e.target.value) || 17 })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {BUS_SEATING_OPTIONS.map((seats) => (
                          <option key={seats} value={seats}>{seats} Seater</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AC Type *
                      </label>
                      <select
                        value={formData.acType}
                        onChange={(e) => setFormData({ ...formData, acType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AC">AC</option>
                        <option value="Non-AC">Non-AC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Luggage Capacity
                    </label>
                    <input
                      type="text"
                      value={formData.luggageCapacity}
                      onChange={(e) => setFormData({ ...formData, luggageCapacity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Large boot space, Overhead storage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasPushbackSeats}
                          onChange={(e) => setFormData({ ...formData, hasPushbackSeats: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">Pushback Seats</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasTV}
                          onChange={(e) => setFormData({ ...formData, hasTV: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">TV/Entertainment</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasCharging}
                          onChange={(e) => setFormData({ ...formData, hasCharging: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">Charging Points</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hasWifi}
                          onChange={(e) => setFormData({ ...formData, hasWifi: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">WiFi</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Amenities / Features
                    </label>
                    <textarea
                      value={formData.amenities}
                      onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="e.g., Water bottles, Blankets, First aid kit, Fire extinguisher, GPS tracking"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Car Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seating Capacity
                      </label>
                      <select
                        value={formData.seatingCapacity}
                        onChange={(e) =>
                          setFormData({ ...formData, seatingCapacity: parseInt(e.target.value) || 4 })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={4}>4 Seater (Sedan/Hatchback)</option>
                        <option value={5}>5 Seater (SUV Compact)</option>
                        <option value={6}>6 Seater (MUV)</option>
                        <option value={7}>7 Seater (Innova/Ertiga)</option>
                        <option value={8}>8 Seater (Innova Crysta)</option>
                        <option value={9}>9 Seater</option>
                        <option value={10}>10 Seater</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AC Type
                      </label>
                      <select
                        value={formData.acType}
                        onChange={(e) => setFormData({ ...formData, acType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AC">AC</option>
                        <option value="Non-AC">Non-AC</option>
                        <option value="Both">Both Available</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuel Type
                      </label>
                      <select
                        value={formData.fuelType}
                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Petrol/CNG">Petrol + CNG</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Luggage Capacity
                      </label>
                      <input
                        type="text"
                        value={formData.luggageCapacity}
                        onChange={(e) => setFormData({ ...formData, luggageCapacity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2 Large + 2 Small Bags"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Example Vehicles
                      </label>
                      <input
                        type="text"
                        value={formData.exampleVehicles}
                        onChange={(e) => setFormData({ ...formData, exampleVehicles: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Swift Dzire, Honda Amaze, Hyundai Aura"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/sedan-image.jpg"
                    />
                    {formData.image && (
                      <div className="mt-2">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="h-20 object-contain rounded border"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
                    Popular/Recommended
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`bg-white rounded-xl border-2 p-5 ${
              category.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {isEquipmentService(serviceSlug) ? (
                  <Package className="w-6 h-6 text-amber-600" />
                ) : isTruckService(serviceSlug) ? (
                  <Truck className="w-6 h-6 text-blue-600" />
                ) : isBikeService(serviceSlug) ? (
                  <Bike className="w-6 h-6 text-orange-600" />
                ) : isBusService(serviceSlug) ? (
                  <Bus className="w-6 h-6 text-purple-600" />
                ) : (
                  <Car className="w-6 h-6 text-blue-600" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {category.name}
                    {category.isPopular && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                  </h3>
                  <p className="text-xs text-gray-500">/{category.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {category.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-3 text-xs">
              {isEquipmentService(serviceSlug) ? (
                <>
                  {category.powerCapacity && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {category.powerCapacity}
                    </span>
                  )}
                  {category.equipmentFuelType && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {category.equipmentFuelType}
                    </span>
                  )}
                  {category.dailyRate && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      ₹{category.dailyRate.toLocaleString()}/day
                    </span>
                  )}
                  {category.operatorIncluded && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      With Operator
                    </span>
                  )}
                </>
              ) : isTruckService(serviceSlug) ? (
                <>
                  {category.loadCapacity && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      <Package className="w-3 h-3" />
                      {category.loadCapacity} Tons
                    </span>
                  )}
                  {category.bodyType && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {category.bodyType}
                    </span>
                  )}
                  {category.wheels && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      {category.wheels}
                    </span>
                  )}
                  {(category.lengthFt || category.widthFt || category.heightFt) && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      <Ruler className="w-3 h-3" />
                      {category.lengthFt || '-'}x{category.widthFt || '-'}x{category.heightFt || '-'} ft
                    </span>
                  )}
                </>
              ) : isBikeService(serviceSlug) ? (
                <>
                  {category.bikeType && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                      {category.bikeType}
                    </span>
                  )}
                  {category.engineCC && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      <Gauge className="w-3 h-3" />
                      {category.engineCC}
                    </span>
                  )}
                  {category.fuelType && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      <Fuel className="w-3 h-3" />
                      {category.fuelType}
                    </span>
                  )}
                  {category.mileage && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {category.mileage}
                    </span>
                  )}
                </>
              ) : isBusService(serviceSlug) ? (
                <>
                  {category.busType && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {category.busType}
                    </span>
                  )}
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    <Users className="w-3 h-3" />
                    {category.seatingCapacity} Seater
                  </span>
                  {category.acType && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {category.acType}
                    </span>
                  )}
                  {category.hasPushbackSeats && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      <Armchair className="w-3 h-3" />
                      Pushback
                    </span>
                  )}
                  {category.hasTV && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-full">
                      <Tv className="w-3 h-3" />
                      TV
                    </span>
                  )}
                  {category.hasWifi && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full">
                      <Wifi className="w-3 h-3" />
                      WiFi
                    </span>
                  )}
                  {category.hasCharging && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      <BatteryCharging className="w-3 h-3" />
                      Charging
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    <Users className="w-3 h-3" />
                    {category.seatingCapacity} Seats
                  </span>
                  {category.acType && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {category.acType}
                    </span>
                  )}
                  {category.fuelType && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      {category.fuelType}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t text-xs text-gray-500">
              <span>{category.cityPricingCount} cities</span>
              <span>{category.localPackagesCount} packages</span>
              <span>{category.routePackagesCount} routes</span>
            </div>

            {!category.isActive && (
              <div className="mt-3 flex items-center gap-1 text-xs text-red-600">
                <X className="w-3 h-3" />
                Inactive
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full bg-gray-50 rounded-xl p-8 text-center">
            {isBikeService(serviceSlug) ? (
              <Bike className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            ) : isTruckService(serviceSlug) ? (
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            ) : isEquipmentService(serviceSlug) ? (
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            ) : isBusService(serviceSlug) ? (
              <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            ) : (
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            )}
            <h3 className="font-medium text-gray-900 mb-1">
              No {isBikeService(serviceSlug) ? 'bike' : isBusService(serviceSlug) ? 'bus' : 'vehicle'} categories yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {isBikeService(serviceSlug)
                ? "Start by adding bike categories like Activa, Splendor, Pulsar"
                : isTruckService(serviceSlug)
                ? "Start by adding truck categories like Tata Ace, Eicher 14ft"
                : isEquipmentService(serviceSlug)
                ? "Start by adding equipment categories like JCB, Crane, Forklift"
                : isBusService(serviceSlug)
                ? "Start by adding bus categories like Tempo Traveller 17 Seater, Volvo 45 Seater"
                : "Start by adding vehicle categories like Sedan, Ertiga, Innova Crysta"
              }
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add First Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
