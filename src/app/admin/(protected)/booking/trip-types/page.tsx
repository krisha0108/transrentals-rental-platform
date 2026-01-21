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
  Route,
  MapPin,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  requiresFromLocation: boolean;
  requiresToLocation: boolean;
  requiresReturnDate: boolean;
  isActive: boolean;
  displayOrder: number;
  _count?: {
    serviceTripTypes: number;
    fleetPricing: number;
  };
}

export default function TripTypesManagementPage() {
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTripType, setEditingTripType] = useState<TripType | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    requiresFromLocation: true,
    requiresToLocation: false,
    requiresReturnDate: false,
    isActive: true,
    displayOrder: 0,
  });

  const fetchTripTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/booking/trip-types');
      if (res.ok) {
        const data = await res.json();
        setTripTypes(data);
      }
    } catch (error) {
      // Failed to fetch trip types
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTripTypes();
  }, [fetchTripTypes]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'name' && !editingTripType) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const openAddModal = () => {
    setEditingTripType(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      requiresFromLocation: true,
      requiresToLocation: false,
      requiresReturnDate: false,
      isActive: true,
      displayOrder: tripTypes.length,
    });
    setShowModal(true);
  };

  const openEditModal = (tripType: TripType) => {
    setEditingTripType(tripType);
    setFormData({
      name: tripType.name,
      slug: tripType.slug,
      description: tripType.description || '',
      icon: tripType.icon || '',
      requiresFromLocation: tripType.requiresFromLocation,
      requiresToLocation: tripType.requiresToLocation,
      requiresReturnDate: tripType.requiresReturnDate,
      isActive: tripType.isActive,
      displayOrder: tripType.displayOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingTripType
        ? `/api/admin/booking/trip-types/${editingTripType.id}`
        : '/api/admin/booking/trip-types';
      const method = editingTripType ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        icon: formData.icon || null,
        requiresFromLocation: formData.requiresFromLocation,
        requiresToLocation: formData.requiresToLocation,
        requiresReturnDate: formData.requiresReturnDate,
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchTripTypes();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save trip type');
      }
    } catch (error) {
      // Failed to save trip type
      alert('Failed to save trip type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tripType: TripType) => {
    if (tripType._count && (tripType._count.serviceTripTypes > 0 || tripType._count.fleetPricing > 0)) {
      alert('Cannot delete trip type that is in use. Remove associations first.');
      return;
    }

    if (!confirm(`Delete "${tripType.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/booking/trip-types/${tripType.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTripTypes();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete trip type');
      }
    } catch (error) {
      // Failed to delete trip type
    }
  };

  const filteredTripTypes = search
    ? tripTypes.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase())
      )
    : tripTypes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Types Management</h1>
          <p className="text-gray-600">Manage trip types (Local, Outstation, Airport, etc.)</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Trip Type
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trip types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" onClick={fetchTripTypes}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Trip Types Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredTripTypes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Route className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trip types found</h3>
          <p className="text-gray-500 mb-4">Start by adding a trip type</p>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Trip Type
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trip Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Requirements</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Services</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTripTypes.map((tripType) => (
                <tr key={tripType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Route className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{tripType.name}</div>
                        <div className="text-xs text-gray-500">{tripType.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {tripType.requiresFromLocation && (
                        <span className="flex items-center gap-1 text-green-600">
                          <MapPin className="w-3 h-3" /> From
                        </span>
                      )}
                      {tripType.requiresToLocation && (
                        <>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="flex items-center gap-1 text-orange-600">
                            <MapPin className="w-3 h-3" /> To
                          </span>
                        </>
                      )}
                      {tripType.requiresReturnDate && (
                        <span className="flex items-center gap-1 text-purple-600 ml-2">
                          <Calendar className="w-3 h-3" /> Return
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{tripType._count?.serviceTripTypes || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">{tripType.displayOrder}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tripType.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tripType.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(tripType)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(tripType)}
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
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingTripType ? 'Edit Trip Type' : 'Add Trip Type'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide name)</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="e.g., car, plane, map-pin"
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

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Trip Requirements</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requiresFromLocation"
                      checked={formData.requiresFromLocation}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="text-sm text-gray-700">Requires From Location</span>
                      <p className="text-xs text-gray-500">User must select pickup location</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requiresToLocation"
                      checked={formData.requiresToLocation}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="text-sm text-gray-700">Requires To Location</span>
                      <p className="text-xs text-gray-500">User must select drop-off location</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requiresReturnDate"
                      checked={formData.requiresReturnDate}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="text-sm text-gray-700">Requires Return Date</span>
                      <p className="text-xs text-gray-500">User must select return date (round trips)</p>
                    </div>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer border-t pt-4">
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
                  {editingTripType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
