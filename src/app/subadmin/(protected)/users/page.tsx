'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  RefreshCw,
  Loader2,
  X,
  Save,
  Eye,
  EyeOff,
  MapPin,
  Briefcase,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
  type: string;
  slug: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'MANAGER';
  isActive: boolean;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string } | null;
  managerLocations?: { location: Location }[];
  managerServices?: { service: Service }[];
}

export default function SubAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Search states for modal
  const [locationSearch, setLocationSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isActive: true,
    locationIds: [] as string[],
    serviceIds: [] as string[],
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLocationsAndServices = async () => {
    try {
      const [locRes, svcRes] = await Promise.all([
        fetch('/api/admin/locations?flat=true&type=CITY'),
        fetch('/api/admin/services?flat=true'),
      ]);

      if (locRes.ok) {
        setLocations(await locRes.json());
      }
      if (svcRes.ok) {
        setServices(await svcRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch locations/services:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLocationsAndServices();
  }, [fetchUsers]);

  // Filtered locations based on search
  const filteredLocations = useMemo(() => {
    if (!locationSearch) return locations;
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locations, locationSearch]);

  // Filtered services based on search
  const filteredServices = useMemo(() => {
    if (!serviceSearch) return services;
    return services.filter((svc) =>
      svc.name.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [services, serviceSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  // Select All / Deselect All for Locations
  const selectAllLocations = () => {
    const allFilteredIds = filteredLocations.map((loc) => loc.id);
    setFormData((prev) => ({
      ...prev,
      locationIds: [...new Set([...prev.locationIds, ...allFilteredIds])],
    }));
  };

  const deselectAllLocations = () => {
    const filteredIds = new Set(filteredLocations.map((loc) => loc.id));
    setFormData((prev) => ({
      ...prev,
      locationIds: prev.locationIds.filter((id) => !filteredIds.has(id)),
    }));
  };

  // Select All / Deselect All for Services
  const selectAllServices = () => {
    const allFilteredIds = filteredServices.map((svc) => svc.id);
    setFormData((prev) => ({
      ...prev,
      serviceIds: [...new Set([...prev.serviceIds, ...allFilteredIds])],
    }));
  };

  const deselectAllServices = () => {
    const filteredIds = new Set(filteredServices.map((svc) => svc.id));
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.filter((id) => !filteredIds.has(id)),
    }));
  };

  // Check if all filtered items are selected
  const allLocationsSelected = filteredLocations.length > 0 &&
    filteredLocations.every((loc) => formData.locationIds.includes(loc.id));
  const allServicesSelected = filteredServices.length > 0 &&
    filteredServices.every((svc) => formData.serviceIds.includes(svc.id));

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      isActive: true,
      locationIds: [],
      serviceIds: [],
    });
    setLocationSearch('');
    setServiceSearch('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      isActive: user.isActive,
      locationIds: user.managerLocations?.map((ml) => ml.location.id) || [],
      serviceIds: user.managerServices?.map((ms) => ms.service.id) || [],
    });
    setLocationSearch('');
    setServiceSearch('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        isActive: formData.isActive,
        locationIds: formData.locationIds,
        serviceIds: formData.serviceIds,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      // SubAdmin can only create Managers
      if (!editingUser) {
        payload.role = 'MANAGER';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save manager');
      }
    } catch (error) {
      console.error('Failed to save manager:', error);
      alert('Failed to save manager');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete manager "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete manager');
      }
    } catch (error) {
      console.error('Failed to delete manager:', error);
    }
  };

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Management</h1>
          <p className="text-gray-600">Add and manage Managers for your locations</p>
        </div>
        <Button onClick={openAddModal} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Manager
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search managers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No managers found</h3>
          <p className="text-gray-500 mb-4">Start by adding a Manager for your locations</p>
          <Button onClick={openAddModal} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add First Manager
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Manager</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Assignments</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-700">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {user.managerLocations && user.managerLocations.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{user.managerLocations.length} location(s)</span>
                        </div>
                      )}
                      {user.managerServices && user.managerServices.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Briefcase className="w-3 h-3" />
                          <span>{user.managerServices.length} service(s)</span>
                        </div>
                      )}
                      {(!user.managerLocations || user.managerLocations.length === 0) &&
                        (!user.managerServices || user.managerServices.length === 0) && (
                          <span className="text-xs text-gray-400">No assignments</span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm ${user.isActive ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {user.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
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
                {editingUser ? 'Edit Manager' : 'Add Manager'}
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Assigned Locations (Cities)
                  </label>
                  <button
                    type="button"
                    onClick={allLocationsSelected ? deselectAllLocations : selectAllLocations}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    {allLocationsSelected ? (
                      <>
                        <Square className="w-3 h-3" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3 h-3" />
                        Select All
                      </>
                    )}
                  </button>
                </div>

                {/* Location Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {filteredLocations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      {locationSearch ? 'No cities found' : 'No cities available'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredLocations.map((loc) => (
                        <label
                          key={loc.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                            formData.locationIds.includes(loc.id) ? 'bg-green-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.locationIds.includes(loc.id)}
                            onChange={() => toggleLocation(loc.id)}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <span className="text-sm truncate">{loc.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.locationIds.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.locationIds.length} location(s) selected
                  </p>
                )}
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Assigned Services
                  </label>
                  <button
                    type="button"
                    onClick={allServicesSelected ? deselectAllServices : selectAllServices}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    {allServicesSelected ? (
                      <>
                        <Square className="w-3 h-3" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3 h-3" />
                        Select All
                      </>
                    )}
                  </button>
                </div>

                {/* Service Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {filteredServices.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      {serviceSearch ? 'No services found' : 'No services available'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredServices.map((svc) => (
                        <label
                          key={svc.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                            formData.serviceIds.includes(svc.id) ? 'bg-green-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.serviceIds.includes(svc.id)}
                            onChange={() => toggleService(svc.id)}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <span className="text-sm truncate">{svc.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.serviceIds.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.serviceIds.length} service(s) selected
                  </p>
                )}
              </div>

              {/* Active Status */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
