'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Loader2,
  X,
  Save,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripType {
  id: string;
  name: string;
  slug: string;
}

interface ServiceTripType {
  tripType: TripType;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  description: string | null;
  shortDesc: string | null;
  flowType: 'BROWSE_FIRST' | 'TRIP_FIRST' | 'QUOTE_BASED';
  isActive: boolean;
  displayOrder: number;
  parentId: string | null;
  children?: Service[];
  serviceTripTypes?: ServiceTripType[];
  _count?: {
    vehicleModels: number;
    vendorFleets: number;
    children: number;
  };
}

const FLOW_TYPE_CONFIG = {
  BROWSE_FIRST: { label: 'Browse First', color: 'bg-blue-100 text-blue-700' },
  TRIP_FIRST: { label: 'Trip First', color: 'bg-green-100 text-green-700' },
  QUOTE_BASED: { label: 'Quote Based', color: 'bg-orange-100 text-orange-700' },
};

const ICON_MAP: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Car: Car,
  Bike: Bike,
  Bus: Bus,
  Truck: Truck,
  Package: Package,
  Wrench: Wrench,
  Crown: Crown,
  CarTaxiFront: CarTaxiFront,
};

export default function ServicesManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [parentService, setParentService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    description: '',
    shortDesc: '',
    flowType: 'QUOTE_BASED' as Service['flowType'],
    isActive: true,
    displayOrder: 0,
    tripTypeIds: [] as string[],
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/booking/services?parentOnly=true&includeChildren=true');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      // Failed to fetch services
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTripTypes = async () => {
    try {
      const res = await fetch('/api/admin/booking/trip-types');
      if (res.ok) {
        const data = await res.json();
        setTripTypes(data);
      }
    } catch (error) {
      // Failed to fetch trip types
    }
  };

  useEffect(() => {
    fetchServices();
    fetchTripTypes();
  }, [fetchServices]);

  const toggleExpand = (serviceId: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

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

      // Auto-generate slug from name
      if (name === 'name' && !editingService) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const toggleTripType = (tripTypeId: string) => {
    setFormData((prev) => ({
      ...prev,
      tripTypeIds: prev.tripTypeIds.includes(tripTypeId)
        ? prev.tripTypeIds.filter((id) => id !== tripTypeId)
        : [...prev.tripTypeIds, tripTypeId],
    }));
  };

  const openAddModal = (parent?: Service) => {
    setEditingService(null);
    setParentService(parent || null);
    setFormData({
      name: '',
      slug: '',
      icon: parent?.icon || '',
      description: '',
      shortDesc: '',
      flowType: parent?.flowType || 'QUOTE_BASED',
      isActive: true,
      displayOrder: 0,
      tripTypeIds: [],
    });
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setParentService(null);
    setFormData({
      name: service.name,
      slug: service.slug,
      icon: service.icon || '',
      description: service.description || '',
      shortDesc: service.shortDesc || '',
      flowType: service.flowType,
      isActive: service.isActive,
      displayOrder: service.displayOrder,
      tripTypeIds: service.serviceTripTypes?.map((st) => st.tripType.id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingService
        ? `/api/admin/booking/services/${editingService.id}`
        : '/api/admin/booking/services';
      const method = editingService ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        icon: formData.icon || null,
        description: formData.description || null,
        shortDesc: formData.shortDesc || null,
        flowType: formData.flowType,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      };

      if (!editingService && parentService) {
        payload.parentId = parentService.id;
      }

      // Only include tripTypeIds for parent services
      if (!parentService && !editingService?.parentId) {
        payload.tripTypeIds = formData.tripTypeIds;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchServices();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save service');
      }
    } catch (error) {
      // Failed to save service
      alert('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    const hasChildren = service.children && service.children.length > 0;
    if (hasChildren) {
      alert('Cannot delete service with sub-services. Delete sub-services first.');
      return;
    }

    if (!confirm(`Delete "${service.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/booking/services/${service.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete service');
      }
    } catch (error) {
      // Failed to delete service
    }
  };

  const renderServiceRow = (service: Service, isChild = false) => {
    const hasChildren = service.children && service.children.length > 0;
    const isExpanded = expandedServices.includes(service.id);
    const flowConfig = FLOW_TYPE_CONFIG[service.flowType];
    const IconComponent = service.icon ? ICON_MAP[service.icon] : Car;

    return (
      <React.Fragment key={service.id}>
        <tr className={`hover:bg-gray-50 ${isChild ? 'bg-gray-50/50' : ''}`}>
          <td className="px-6 py-4">
            <div className={`flex items-center gap-3 ${isChild ? 'ml-8' : ''}`}>
              {!isChild && hasChildren && (
                <button
                  onClick={() => toggleExpand(service.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {!isChild && !hasChildren && <div className="w-6" />}
              {isChild && <div className="w-2 h-2 bg-gray-300 rounded-full" />}

              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isChild ? 'bg-gray-100' : 'bg-blue-100'}`}>
                {IconComponent && <IconComponent className={`w-5 h-5 ${isChild ? 'text-gray-600' : 'text-blue-600'}`} />}
              </div>

              <div>
                <p className={`font-medium ${isChild ? 'text-gray-700' : 'text-gray-900'}`}>
                  {service.name}
                </p>
                <p className="text-xs text-gray-400">{service.slug}</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            {!isChild && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${flowConfig.color}`}>
                {flowConfig.label}
              </span>
            )}
          </td>
          <td className="px-6 py-4">
            {!isChild && service.serviceTripTypes && service.serviceTripTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {service.serviceTripTypes.slice(0, 3).map((st) => (
                  <span key={st.tripType.id} className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                    {st.tripType.name}
                  </span>
                ))}
                {service.serviceTripTypes.length > 3 && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                    +{service.serviceTripTypes.length - 3}
                  </span>
                )}
              </div>
            )}
          </td>
          <td className="px-6 py-4">
            {!isChild && (
              <div className="text-sm text-gray-500">
                <span>{service._count?.children || 0} sub-services</span>
                <span className="mx-2">|</span>
                <span>{service._count?.vehicle_modelss || 0} models</span>
              </div>
            )}
          </td>
          <td className="px-6 py-4">
            <span className={`text-sm ${service.isActive ? 'text-green-600' : 'text-red-500'}`}>
              {service.isActive ? '● Active' : '○ Inactive'}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex justify-end gap-2">
              {!isChild && (
                <button
                  onClick={() => openAddModal(service)}
                  className="p-2 hover:bg-blue-50 rounded-lg"
                  title="Add Sub-Service"
                >
                  <Plus className="w-4 h-4 text-blue-500" />
                </button>
              )}
              <button
                onClick={() => openEditModal(service)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete(service)}
                className="p-2 hover:bg-red-50 rounded-lg"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && service.children?.map((child) => renderServiceRow(child, true))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600">Manage services, sub-services, and trip types</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchServices}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => openAddModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500 mb-4">Start by adding a service</p>
          <Button onClick={() => openAddModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Service
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Service</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Flow Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Trip Types</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Stats</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((service) => renderServiceRow(service))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  {editingService ? 'Edit Service' : parentService ? `Add Sub-Service to ${parentService.name}` : 'Add Service'}
                </h2>
                {parentService && (
                  <p className="text-sm text-gray-500">This will be a sub-service/category</p>
                )}
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Icon</option>
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Bus">Bus</option>
                    <option value="Truck">Truck</option>
                    <option value="Package">Package</option>
                    <option value="Wrench">Wrench</option>
                    <option value="Crown">Crown</option>
                    <option value="CarTaxiFront">Taxi</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    name="shortDesc"
                    value={formData.shortDesc}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={150}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Flow Type (only for parent services) */}
              {!parentService && !editingService?.parentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booking Flow Type *</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(FLOW_TYPE_CONFIG).map(([key, config]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="flowType"
                          value={key}
                          checked={formData.flowType === key}
                          onChange={handleChange}
                          className="w-4 h-4"
                        />
                        <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Browse First: User sees vehicles first (Self-drive, Bike) |
                    Trip First: User enters trip details first (Car with Driver) |
                    Quote Based: Request quote form (Packers, Equipment)
                  </p>
                </div>
              )}

              {/* Trip Types (only for parent services) */}
              {!parentService && !editingService?.parentId && tripTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supported Trip Types
                  </label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {tripTypes.map((tt) => (
                        <label
                          key={tt.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                            formData.tripTypeIds.includes(tt.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.tripTypeIds.includes(tt.id)}
                            onChange={() => toggleTripType(tt.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">{tt.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
