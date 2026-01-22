'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  GripVertical,
  Loader2,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  MoreVertical,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { SubService } from '@/lib/constants/booking-services';
import { Button } from '@/components/ui/button';

interface SubServiceItem extends SubService {
  id: string;
  vehicleCount: number;
  isActive: boolean;
  displayOrder: number;
  imageUrl?: string;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Bike,
  CarTaxiFront,
  Crown,
  Bus,
  Truck,
  Package,
  Wrench,
};

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  flowType?: string;
}

export default function ServiceSubServicesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [subServices, setSubServices] = useState<SubServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubService, setEditingSubService] = useState<SubServiceItem | null>(null);
  const [newSubService, setNewSubService] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  const ServiceIcon = service ? IconMap[service.icon || ''] || Car : Car;

  // Fetch service from database
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setService(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  useEffect(() => {
    const fetchSubServices = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/services/${slug}/sub-services`);
        if (res.ok) {
          const data = await res.json();
          setSubServices(data.subServices?.map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description || '',
            vehicleCount: item.vehicleCount || 0,
            isActive: item.isActive,
            displayOrder: item.displayOrder,
            imageUrl: item.image,
          })) || []);
        }
      } catch (error) {
        console.error('Failed to fetch sub-services:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchSubServices();
    }
  }, [slug]);

  const filteredSubServices = subServices.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: subServices.length,
    active: subServices.filter((s) => s.isActive).length,
    inactive: subServices.filter((s) => !s.isActive).length,
    totalVehicles: subServices.reduce((acc, s) => acc + s.vehicleCount, 0),
  };

  const handleAddSubService = async () => {
    if (!newSubService.name || !newSubService.slug) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/sub-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubService.name,
          subServiceSlug: newSubService.slug,
          description: newSubService.description,
          isActive: newSubService.isActive,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubServices(prev => [...prev, {
          id: data.sub_service.id,
          name: data.sub_service.name,
          slug: data.sub_service.slug,
          description: data.sub_service.description || '',
          vehicleCount: 0,
          isActive: data.sub_service.isActive,
          displayOrder: data.sub_service.displayOrder,
        }]);
        setShowAddModal(false);
        setNewSubService({ name: '', slug: '', description: '', isActive: true });
      }
    } catch (error) {
      console.error('Failed to add sub-service:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return `${slug}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  };

  const handleEditSubService = async () => {
    if (!editingSubService) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/sub-services/${editingSubService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingSubService.name,
          slug: editingSubService.slug,
          description: editingSubService.description,
          isActive: editingSubService.isActive,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubServices(prev => prev.map(s =>
          s.id === editingSubService.id ? {
            ...s,
            name: data.sub_service.name,
            slug: data.sub_service.slug,
            description: data.sub_service.description || '',
            isActive: data.sub_service.isActive,
          } : s
        ));
        setShowEditModal(false);
        setEditingSubService(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Failed to update sub-service:', error);
      alert('Failed to update sub-service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubService = async (subServiceId: string, subServiceName: string) => {
    if (!confirm(`Are you sure you want to delete "${subServiceName}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/services/${slug}/sub-services/${subServiceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSubServices(prev => prev.filter(s => s.id !== subServiceId));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete sub-service:', error);
      alert('Failed to delete sub-service');
    }
  };

  const handleToggleActive = async (subServiceId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/services/${slug}/sub-services/${subServiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setSubServices(prev => prev.map(s =>
          s.id === subServiceId ? { ...s, isActive: !currentStatus } : s
        ));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const openEditModal = (subService: SubServiceItem) => {
    setEditingSubService(subService);
    setShowEditModal(true);
  };

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Link href="/admin/services" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-500">The service &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {service.name}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sub-Services / Categories</h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Reorder
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Service
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Vehicles</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalVehicles}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sub-services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sub-Services Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredSubServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Layers className="w-12 h-12 mb-4" />
            <p className="font-medium">No sub-services found</p>
            <p className="text-sm">Add categories to organize your fleet</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredSubServices.map((sub_service) => (
              <div
                key={sub_service.id}
                className="border rounded-lg p-4 bg-white hover:shadow-md transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center cursor-move group-hover:bg-gray-200 transition">
                      <GripVertical className="w-5 h-5 text-gray-400 hidden group-hover:block" />
                      <ServiceIcon className="w-6 h-6 text-gray-500 group-hover:hidden" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{sub_service.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{sub_service.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(sub_service.id, sub_service.isActive)}
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer transition hover:opacity-80 ${
                        sub_service.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {sub_service.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                {sub_service.description && (
                  <p className="text-sm text-gray-600 mb-3">{sub_service.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Car className="w-4 h-4" />
                      {sub_service.vehicleCount} vehicles
                    </span>
                    <span className="text-gray-400">Order: {sub_service.displayOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(sub_service)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubService(sub_service.id, sub_service.name)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Sub-Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Sub-Service</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="e.g., Hatchback"
                  value={newSubService.name}
                  onChange={(e) => {
                    setNewSubService(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    }));
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  placeholder="e.g., self-drive-hatchback"
                  value={newSubService.slug}
                  onChange={(e) => setNewSubService(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this category..."
                  value={newSubService.description}
                  onChange={(e) => setNewSubService(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newSubService.isActive}
                  onChange={(e) => setNewSubService(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (visible on website)
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleAddSubService}
                disabled={saving || !newSubService.name || !newSubService.slug}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? 'Adding...' : 'Add Sub-Service'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Service Modal */}
      {showEditModal && editingSubService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Sub-Service</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSubService(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="e.g., Hatchback"
                  value={editingSubService.name}
                  onChange={(e) => {
                    setEditingSubService(prev => prev ? {
                      ...prev,
                      name: e.target.value,
                    } : null);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  placeholder="e.g., self-drive-hatchback"
                  value={editingSubService.slug}
                  onChange={(e) => setEditingSubService(prev => prev ? { ...prev, slug: e.target.value } : null)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this category..."
                  value={editingSubService.description || ''}
                  onChange={(e) => setEditingSubService(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingSubService.isActive}
                  onChange={(e) => setEditingSubService(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                  className="rounded"
                />
                <label htmlFor="editIsActive" className="text-sm text-gray-700">
                  Active (visible on website)
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSubService(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleEditSubService}
                disabled={saving || !editingSubService.name || !editingSubService.slug}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
