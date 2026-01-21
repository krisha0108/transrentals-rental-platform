'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Bike,
  Car,
  Bus,
  Truck,
  Settings2,
  Loader2,
  X,
  Save,
  Zap,
  FileText,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  shortDesc: string | null;
  icon: string | null;
  image: string | null;
  flowType: string;
  config: any;
  formFields: any;
  isActive: boolean;
  displayOrder: number;
  parent?: { id: string; name: string; slug: string } | null;
  children?: Service[];
  _count?: { children: number; serviceLocations: number };
}

const FLOW_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  BROWSE_FIRST: { label: 'Browse First', color: 'bg-green-100 text-green-700', icon: Zap },
  TRIP_FIRST: { label: 'Trip First', color: 'bg-blue-100 text-blue-700', icon: Zap },
  QUOTE_BASED: { label: 'Quote Based', color: 'bg-amber-100 text-amber-700', icon: FileText },
  // Legacy values (in case they exist)
  FLEET_BASED: { label: 'Fleet Based', color: 'bg-green-100 text-green-700', icon: Zap },
};

const DEFAULT_FLOW_CONFIG = { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: Settings2 };

// Default service icons mapping
const SERVICE_ICONS: Record<string, any> = {
  bike: Bike,
  car: Car,
  bus: Bus,
  truck: Truck,
  default: Settings2,
};

const getServiceIcon = (slug: string) => {
  const iconKey = Object.keys(SERVICE_ICONS).find(key => slug.toLowerCase().includes(key));
  return SERVICE_ICONS[iconKey || 'default'];
};

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [flowTypeFilter, setFlowTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [parentOptions, setParentOptions] = useState<Service[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    description: '',
    shortDesc: '',
    icon: '',
    image: '',
    flowType: 'BROWSE_FIRST',
    displayOrder: 0,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (viewMode === 'flat') {
        params.set('flat', 'true');
        if (flowTypeFilter) params.set('flowType', flowTypeFilter);
      }

      const res = await fetch(`/api/admin/services?${params}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        // Auto-expand first level
        if (viewMode === 'tree' && data.length > 0) {
          setExpandedIds(new Set(data.map((s: Service) => s.id)));
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }, [viewMode, flowTypeFilter]);

  const fetchParentOptions = async () => {
    try {
      const res = await fetch('/api/admin/services?flat=true&parentsOnly=true');
      if (res.ok) {
        setParentOptions(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch parent options:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'name' && !editingService) {
      setFormData((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  const openAddModal = (parentService?: Service) => {
    setEditingService(null);
    setFormData({
      name: '',
      slug: '',
      parentId: parentService?.id || '',
      description: '',
      shortDesc: '',
      icon: '',
      image: '',
      flowType: parentService?.flowType || 'BROWSE_FIRST',
      displayOrder: 0,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
    });

    fetchParentOptions();
    setShowModal(true);
  };

  const openEditModal = async (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      slug: service.slug,
      parentId: service.parentId || '',
      description: service.description || '',
      shortDesc: service.shortDesc || '',
      icon: service.icon || '',
      image: service.image || '',
      flowType: service.flowType,
      displayOrder: service.displayOrder,
      isActive: service.isActive,
      metaTitle: '',
      metaDescription: '',
    });

    await fetchParentOptions();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchServices();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save service');
      }
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string, childCount: number) => {
    if (childCount > 0) {
      alert(`Cannot delete "${name}" because it has ${childCount} sub-service(s). Delete sub-services first.`);
      return;
    }
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderServiceTree = (serviceList: Service[], level: number = 0) => {
    const filtered = search
      ? serviceList.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      : serviceList;

    return filtered.map((service) => {
      const flowConfig = FLOW_TYPE_CONFIG[service.flowType] || DEFAULT_FLOW_CONFIG;
      const Icon = getServiceIcon(service.slug);
      const hasChildren = service.children && service.children.length > 0;
      const isExpanded = expandedIds.has(service.id);
      const isParent = !service.parentId;

      return (
        <div key={service.id}>
          <div
            className={`flex items-center gap-2 px-4 py-3 hover:bg-gray-50 border-b ${
              level > 0 ? 'bg-gray-50/50' : ''
            }`}
            style={{ paddingLeft: `${16 + level * 24}px` }}
          >
            {/* Expand/Collapse button */}
            <button
              onClick={() => toggleExpand(service.id)}
              className={`p-1 rounded hover:bg-gray-200 ${!hasChildren ? 'invisible' : ''}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Icon & Name */}
            <Icon className={`w-5 h-5 ${isParent ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{service.name}</span>
                {isParent && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${flowConfig.color}`}>
                    {flowConfig.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>/{service.slug}</span>
                {service.shortDesc && (
                  <span className="text-gray-400">• {service.shortDesc}</span>
                )}
              </div>
            </div>

            {/* Children count */}
            {service._count && service._count.children > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Settings2 className="w-3 h-3" />
                {service._count.children} sub-services
              </span>
            )}

            {/* Locations count */}
            {service._count && service._count.service_locationss > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {service._count.service_locationss} locations
              </span>
            )}

            {/* Status */}
            <span className={`text-xs ${service.isActive ? 'text-green-600' : 'text-red-500'}`}>
              {service.isActive ? '● Active' : '○ Inactive'}
            </span>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => openAddModal(service)}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Add sub-service"
              >
                <Plus className="w-4 h-4 text-blue-500" />
              </button>
              <button
                onClick={() => openEditModal(service)}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete(service.id, service.name, service._count?.children || 0)}
                className="p-1.5 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* Children */}
          {isExpanded && hasChildren && renderServiceTree(service.children!, level + 1)}
        </div>
      );
    });
  };

  const renderFlatList = () => {
    const filtered = search
      ? services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      : services;

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filtered.map((service) => {
          const flowConfig = FLOW_TYPE_CONFIG[service.flowType] || DEFAULT_FLOW_CONFIG;
          const Icon = getServiceIcon(service.slug);
          const isParent = !service.parentId;

          return (
            <div
              key={service.id}
              className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition ${
                isParent ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-6 h-6 ${isParent ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.parent && (
                      <p className="text-sm text-gray-500">Under: {service.parent.name}</p>
                    )}
                  </div>
                </div>
                {isParent && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${flowConfig.color}`}>
                    {flowConfig.label}
                  </span>
                )}
              </div>

              {service.shortDesc && (
                <p className="text-sm text-gray-600 mb-3">{service.shortDesc}</p>
              )}

              <div className="text-sm text-gray-500 mb-3">
                <span>/{service.slug}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {service._count && service._count.children > 0 && (
                    <span>{service._count.children} sub-services</span>
                  )}
                  <span className={service.isActive ? 'text-green-600' : 'text-red-500'}>
                    {service.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openAddModal(service)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <Plus className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id, service.name, service._count?.children || 0)}
                    className="p-1.5 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600">Manage services and sub-services (Bike Rental, Car Rental, etc.)</p>
        </div>
        <Button onClick={() => openAddModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Browse First</span>
          </div>
          <p className="text-sm text-green-700">
            User browses vehicles first then books. Used for: Bike Rental, Self-Drive Cars
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Trip First</span>
          </div>
          <p className="text-sm text-blue-700">
            User enters trip details first. Used for: Chauffeur Service, Luxury Car Rental
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-800">Quote Based</span>
          </div>
          <p className="text-sm text-amber-700">
            Quotation-based booking. Used for: Bus, Truck, Equipment, Packers & Movers
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {viewMode === 'flat' && (
            <select
              value={flowTypeFilter}
              onChange={(e) => setFlowTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="BROWSE_FIRST">Browse First</option>
              <option value="TRIP_FIRST">Trip First</option>
              <option value="QUOTE_BASED">Quote Based</option>
            </select>
          )}

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              onClick={() => setViewMode('tree')}
            >
              Tree View
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'outline'}
              onClick={() => setViewMode('flat')}
            >
              Flat View
            </Button>
          </div>

          <Button variant="outline" onClick={fetchServices}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Settings2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500 mb-4">Start by adding your main services (Bike Rental, Car Rental, etc.)</p>
          <Button onClick={() => openAddModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Service
          </Button>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {renderServiceTree(services)}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {renderFlatList()}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Service (leave empty for main service)
                </label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">No parent (Main service)</option>
                  {parentOptions
                    .filter(p => p.id !== editingService?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Bike Rental, Scooter"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g., bike-rental"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Flow *</label>
                  <select
                    name="flowType"
                    value={formData.flowType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    disabled={!!formData.parentId}
                  >
                    <option value="BROWSE_FIRST">Browse First (Bike, Self-Drive)</option>
                    <option value="TRIP_FIRST">Trip First (Chauffeur, Luxury)</option>
                    <option value="QUOTE_BASED">Quote Based (Bus, Truck, Equipment)</option>
                  </select>
                  {formData.parentId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sub-services inherit flow type from parent
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input
                  type="text"
                  name="shortDesc"
                  value={formData.shortDesc}
                  onChange={handleChange}
                  placeholder="Brief description for listings"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed service description"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon Name</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="e.g., bike, car, bus"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingService ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
