'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Save,
  Search,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaPicker from '@/components/admin/MediaPicker';

interface Service {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Service[];
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface VehicleModel {
  id: string;
  name: string;
  slug: string;
  sideImage: string | null;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  engineCC: number | null;
  mileage: string | null;
  isActive: boolean;
  displayOrder: number;
  service: { id: string; name: string; slug: string };
  services_vehicle_models_subServiceIdToservices: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string; logo: string | null };
  _count?: {
    vendorFleets: number;
  };
}

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'AMT'];

export default function VehicleModelsPage() {
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    serviceId: '',
    subServiceId: '',
    brandId: '',
    sideImage: '',
    fuelType: '',
    transmission: '',
    seatingCapacity: '',
    engineCC: '',
    mileage: '',
    isActive: true,
    displayOrder: 0,
  });

  const fetchVehicleModels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterService) params.set('serviceId', filterService);
      if (filterBrand) params.set('brandId', filterBrand);

      const res = await fetch(`/api/admin/booking/vehicle-models?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVehicleModels(data);
      }
    } catch (error) {
      // Failed to fetch vehicle models
    } finally {
      setLoading(false);
    }
  }, [filterService, filterBrand]);

  const fetchServicesAndBrands = async () => {
    try {
      const [servicesRes, brandsRes] = await Promise.all([
        fetch('/api/admin/booking/services?parentOnly=true&includeChildren=true'),
        fetch('/api/admin/booking/brands'),
      ]);

      if (servicesRes.ok) {
        setServices(await servicesRes.json());
      }
      if (brandsRes.ok) {
        setBrands(await brandsRes.json());
      }
    } catch (error) {
      // Failed to fetch services/brands
    }
  };

  useEffect(() => {
    fetchVehicleModels();
  }, [fetchVehicleModels]);

  useEffect(() => {
    fetchServicesAndBrands();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

      // Reset subServiceId when serviceId changes
      if (name === 'serviceId') {
        newData.subServiceId = '';
      }

      return newData;
    });
  };

  const getSubServices = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.children || [];
  };

  const openAddModal = () => {
    setEditingModel(null);
    setFormData({
      name: '',
      slug: '',
      serviceId: '',
      subServiceId: '',
      brandId: '',
      sideImage: '',
      fuelType: '',
      transmission: '',
      seatingCapacity: '',
      engineCC: '',
      mileage: '',
      isActive: true,
      displayOrder: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (model: VehicleModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      slug: model.slug,
      serviceId: model.service.id,
      subServiceId: model.sub_service?.id || '',
      brandId: model.brand.id,
      sideImage: model.sideImage || '',
      fuelType: model.fuelType || '',
      transmission: model.transmission || '',
      seatingCapacity: model.seatingCapacity?.toString() || '',
      engineCC: model.engineCC?.toString() || '',
      mileage: model.mileage || '',
      isActive: model.isActive,
      displayOrder: model.displayOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingModel
        ? `/api/admin/booking/vehicle-models/${editingModel.id}`
        : '/api/admin/booking/vehicle-models';
      const method = editingModel ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        slug: formData.slug,
        serviceId: formData.serviceId,
        subServiceId: formData.subServiceId || null,
        brandId: formData.brandId,
        sideImage: formData.sideImage || null,
        fuelType: formData.fuelType || null,
        transmission: formData.transmission || null,
        seatingCapacity: formData.seatingCapacity ? parseInt(formData.seatingCapacity) : null,
        engineCC: formData.engineCC ? parseInt(formData.engineCC) : null,
        mileage: formData.mileage || null,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchVehicleModels();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save vehicle model');
      }
    } catch (error) {
      // Failed to save vehicle model
      alert('Failed to save vehicle model');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (model: VehicleModel) => {
    if (model._count && model._count.vendorFleets > 0) {
      alert('Cannot delete model with vendor fleets. Delete vendor fleets first.');
      return;
    }

    if (!confirm(`Delete "${model.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/booking/vehicle-models/${model.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVehicleModels();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete vehicle model');
      }
    } catch (error) {
      // Failed to delete vehicle model
    }
  };

  const filteredModels = search
    ? vehicleModels.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.brand.name.toLowerCase().includes(search.toLowerCase())
      )
    : vehicleModels;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Models</h1>
          <p className="text-gray-600">Manage vehicle models (Swift, Classic 350, Mercedes E-Class)</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Model
        </Button>
      </div>

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
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <Button variant="outline" onClick={fetchVehicleModels}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Models Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicle models found</h3>
          <p className="text-gray-500 mb-4">Start by adding a vehicle model</p>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Model
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Model</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Service</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Brand</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Specs</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredModels.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {model.sideImage ? (
                        <img src={model.sideImage} alt={model.name} className="w-16 h-10 object-cover rounded bg-gray-100" />
                      ) : (
                        <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Car className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{model.name}</p>
                        <p className="text-xs text-gray-400">{model.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{model.service.name}</p>
                      {model.sub_service && (
                        <p className="text-xs text-gray-500">{model.sub_service.name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {model.brand.logo ? (
                        <img src={model.brand.logo} alt={model.brand.name} className="w-6 h-6 object-contain" />
                      ) : null}
                      <span className="text-sm">{model.brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {model.fuelType && <span className="block">{model.fuelType}</span>}
                      {model.transmission && <span className="block">{model.transmission}</span>}
                      {model.seatingCapacity && <span className="block">{model.seatingCapacity} Seater</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${model.isActive ? 'text-green-600' : 'text-red-500'}`}>
                      {model.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingModel ? 'Edit Vehicle Model' : 'Add Vehicle Model'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Swift Dzire, Classic 350"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="subServiceId"
                    value={formData.subServiceId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.serviceId}
                  >
                    <option value="">Select Category</option>
                    {getSubServices(formData.serviceId).map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <select
                    name="brandId"
                    value={formData.brandId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <MediaPicker
                    value={formData.sideImage}
                    onChange={(url) => setFormData((prev) => ({ ...prev, sideImage: url }))}
                    label="Vehicle Side Image"
                  />
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fuel Type</label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      {FUEL_TYPES.map((ft) => (
                        <option key={ft} value={ft}>{ft}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Transmission</label>
                    <select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      {TRANSMISSIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Seating Capacity</label>
                    <input
                      type="number"
                      name="seatingCapacity"
                      value={formData.seatingCapacity}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Engine CC</label>
                    <input
                      type="number"
                      name="engineCC"
                      value={formData.engineCC}
                      onChange={handleChange}
                      placeholder="e.g., 1197"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mileage</label>
                    <input
                      type="text"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleChange}
                      placeholder="e.g., 18-20 kmpl"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Active Status */}
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

              {/* Actions */}
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
