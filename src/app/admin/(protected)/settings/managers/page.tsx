'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, MapPin, Briefcase, Eye, EyeOff, Check, X, Shield } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  locations: Location[];
  services: Service[];
}

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Manager | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isActive: true,
    locationIds: [] as string[],
    serviceIds: [] as string[],
  });

  useEffect(() => {
    fetchManagers();
    fetchLocations();
    fetchServices();
  }, []);

  const fetchManagers = async () => {
    try {
      const res = await fetch('/api/admin/managers');
      const data = await res.json();
      if (data.success) {
        setManagers(data.managers);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/admin/locations');
      const data = await res.json();
      if (data.success) {
        setLocations(data.locations);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services?parentOnly=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingItem
        ? `/api/admin/managers/${editingItem.id}`
        : '/api/admin/managers';
      const method = editingItem ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        isActive: formData.isActive,
        locationIds: formData.locationIds,
        serviceIds: formData.serviceIds,
      };

      // Only include password if it's provided (for new managers or password change)
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        fetchManagers();
        setShowModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save manager');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this manager?')) return;

    try {
      const res = await fetch(`/api/admin/managers/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchManagers();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete manager');
    }
  };

  const handleEdit = (item: Manager) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      email: item.email,
      phone: item.phone || '',
      password: '',
      isActive: item.isActive,
      locationIds: item.locations.map((l) => l.id),
      serviceIds: item.services.map((s) => s.id),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      isActive: true,
      locationIds: [],
      serviceIds: [],
    });
    setShowPassword(false);
  };

  const toggleLocation = (locationId: string) => {
    setFormData((prev) => ({
      ...prev,
      locationIds: prev.locationIds.includes(locationId)
        ? prev.locationIds.filter((id) => id !== locationId)
        : [...prev.locationIds, locationId],
    }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Managers</h1>
          <p className="text-gray-600 mt-1">
            Manage manager accounts and their location/service assignments
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Manager
        </button>
      </div>

      {/* Managers List */}
      <div className="grid gap-4">
        {managers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Managers</h3>
            <p className="mt-2 text-gray-500">
              Add manager accounts to delegate booking management.
            </p>
          </div>
        ) : (
          managers.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg border p-4 ${!item.isActive ? 'opacity-60' : ''
                }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {!item.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{item.email}</p>
                    {item.phone && (
                      <p className="text-sm text-gray-500">{item.phone}</p>
                    )}

                    {/* Assigned Locations */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                        <MapPin size={14} />
                        <span>Locations:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.locations.length > 0 ? (
                          item.locations.map((loc) => (
                            <span
                              key={loc.id}
                              className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
                            >
                              {loc.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No locations assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Assigned Services */}
                    <div className="mt-2">
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                        <Briefcase size={14} />
                        <span>Services:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.services.length > 0 ? (
                          item.services.map((svc) => (
                            <span
                              key={svc.id}
                              className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
                            >
                              {svc.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No services assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingItem ? 'Edit Manager' : 'Add Manager'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="+91 9737965551"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="manager@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingItem ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingItem}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin size={18} />
                  Assign Locations
                </h3>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {locations.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-3">No locations available</p>
                  ) : (
                    locations.map((loc) => (
                      <label
                        key={loc.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${formData.locationIds.includes(loc.id) ? 'bg-blue-50' : ''
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.locationIds.includes(loc.id)}
                          onChange={() => toggleLocation(loc.id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{loc.name}</span>
                        <span className="text-xs text-gray-400">({loc.type})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase size={18} />
                  Assign Services
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-2">No services available</p>
                  ) : (
                    services.map((svc) => (
                      <label
                        key={svc.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${formData.serviceIds.includes(svc.id) ? 'bg-green-50' : ''
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.serviceIds.includes(svc.id)}
                          onChange={() => toggleService(svc.id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{svc.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
