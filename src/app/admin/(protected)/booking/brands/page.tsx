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
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaPicker from '@/components/admin/MediaPicker';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  country: string | null;
  serviceId: string;
  isActive: boolean;
  displayOrder: number;
  service?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    vehicleModels: number;
  };
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

export default function BrandsManagementPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    country: '',
    serviceId: '',
    isActive: true,
    displayOrder: 0,
  });

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services?flat=true&parentsOnly=true');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        // Auto-select 'all' if none selected
        if (!selectedServiceId) {
          setSelectedServiceId('all');
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  }, [selectedServiceId]);

  const fetchBrands = useCallback(async () => {
    if (!selectedServiceId) return;
    setLoading(true);
    try {
      let url = '/api/admin/booking/brands';
      if (selectedServiceId === 'unassigned') {
        url += '?unassigned=true';
      } else if (selectedServiceId !== 'all') {
        url += `?serviceId=${selectedServiceId}`;
      }
      // 'all' = no filter, get all brands

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      }
    } catch (error) {
      // Failed to fetch brands
    } finally {
      setLoading(false);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchBrands();
    }
  }, [selectedServiceId, fetchBrands]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'name' && !editingBrand) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      slug: '',
      logo: '',
      description: '',
      country: '',
      serviceId: selectedServiceId,
      isActive: true,
      displayOrder: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || '',
      description: brand.description || '',
      country: brand.country || '',
      serviceId: brand.serviceId,
      isActive: brand.isActive,
      displayOrder: brand.displayOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingBrand
        ? `/api/admin/booking/brands/${editingBrand.id}`
        : '/api/admin/booking/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        slug: formData.slug,
        logo: formData.logo || null,
        description: formData.description || null,
        country: formData.country || null,
        serviceId: formData.serviceId,
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
        fetchBrands();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save brand');
      }
    } catch (error) {
      // Failed to save brand
      alert('Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (brand._count && brand._count.vehicle_modelss > 0) {
      alert('Cannot delete brand with vehicle models. Delete vehicle models first.');
      return;
    }

    if (!confirm(`Delete "${brand.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/booking/brands/${brand.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBrands();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete brand');
      }
    } catch (error) {
      // Failed to delete brand
    }
  };

  const filteredBrands = search
    ? brands.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.country?.toLowerCase().includes(search.toLowerCase())
      )
    : brands;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
          <p className="text-gray-600">Manage vehicle brands (Toyota, BMW, Royal Enfield, etc.)</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Service Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedServiceId('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedServiceId === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Brands
          </button>
          <button
            onClick={() => setSelectedServiceId('unassigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedServiceId === 'unassigned'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            Unassigned
          </button>
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedServiceId(service.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedServiceId === service.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {service.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" onClick={fetchBrands}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Brands Grid */}
      {!selectedServiceId ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a service</h3>
          <p className="text-gray-500">Choose a service above to manage its brands</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
          <p className="text-gray-500 mb-4">Add brands for {services.find(s => s.id === selectedServiceId)?.name}</p>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Brand
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBrands.map((brand) => (
            <div key={brand.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-12 h-12 object-contain rounded-lg bg-gray-50" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{brand.name}</h3>
                    <p className="text-xs text-gray-500">{brand.country || 'N/A'}</p>
                  </div>
                </div>
                <span className={`text-xs ${brand.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {brand.isActive ? '●' : '○'}
                </span>
              </div>

              {/* Service Badge */}
              <div className="mb-3">
                {brand.service ? (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {brand.service.name}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                    Unassigned
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-500 mb-3">
                {brand._count?.vehicle_modelss || 0} vehicle models
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openEditModal(brand)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(brand)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingBrand ? 'Edit Brand' : 'Add Brand'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., Japan, India, Germany"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
                    value={formData.logo}
                    onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
                    label="Brand Logo"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
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
                  {editingBrand ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
