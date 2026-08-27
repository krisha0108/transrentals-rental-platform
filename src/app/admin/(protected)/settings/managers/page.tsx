'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, User, MapPin, Briefcase, Eye, EyeOff, Check, X, Shield, Activity, TrendingUp, Mail, Phone as PhoneIcon, Search } from 'lucide-react';

type PresenceStatus = 'active' | 'idle' | 'offline';

interface PresenceInfo {
  status: PresenceStatus;
  lastSeenAt: string | null;
}

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Active now', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-700' },
  idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-700' },
  offline: { label: 'Offline', dot: 'bg-gray-300', text: 'text-gray-500' },
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

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
  const [locationSearch, setLocationSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Manager | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [viewingManager, setViewingManager] = useState<Manager | null>(null);
  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});

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
    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPresence = async () => {
    try {
      const res = await fetch('/api/admin/managers/presence');
      const data = await res.json();
      if (data.presence) {
        setPresence(data.presence);
      }
    } catch (error) {
      console.error('Failed to fetch manager presence:', error);
    }
  };

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
      // flat=true — a plain array, not wrapped in {success, locations}.
      // Without it, this endpoint returns a parentId-nested tree, which
      // doesn't work for a flat assignable-locations checkbox list.
      const res = await fetch('/api/admin/locations?flat=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocations(data);
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
    setLocationSearch('');
    setServiceSearch('');
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

  const filteredLocations = locations.filter((loc) =>
    !locationSearch.trim() || loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase())
  );
  const filteredServices = services.filter((svc) =>
    !serviceSearch.trim() || svc.name.toLowerCase().includes(serviceSearch.trim().toLowerCase())
  );

  // "Select all" adds every currently-filtered item to the existing
  // selection (so searching then selecting doesn't wipe out picks made
  // before the search); "Clear all" resets the whole selection outright.
  const selectAllLocations = () => {
    setFormData((prev) => ({
      ...prev,
      locationIds: Array.from(new Set([...prev.locationIds, ...filteredLocations.map((l) => l.id)])),
    }));
  };
  const selectAllServices = () => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: Array.from(new Set([...prev.serviceIds, ...filteredServices.map((s) => s.id)])),
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
        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings/managers/performance"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50"
          >
            <TrendingUp size={18} />
            Performance
          </Link>
          <Link
            href="/admin/settings/managers/activity"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50"
          >
            <Activity size={18} />
            Manager Activity
          </Link>
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
      </div>

      {/* Managers Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {managers.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Managers</h3>
            <p className="mt-2 text-gray-500">
              Add manager accounts to delegate booking management.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b text-xs text-gray-500">
                <tr>
                  <th className="text-left px-5 py-2.5 font-semibold">Manager</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Phone</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Activity</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Locations</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Services</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {managers.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setViewingManager(item)}
                    className={`cursor-pointer hover:bg-gray-50 transition ${!item.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg shrink-0">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{item.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const p = presence[item.id];
                        const meta = PRESENCE_META[p?.status || 'offline'];
                        return (
                          <div>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
                              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                              {meta.label}
                            </span>
                            {p?.status !== 'active' && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {p ? `Last seen ${timeAgo(p.lastSeenAt)}` : 'Never logged in'}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        <MapPin size={12} />
                        {item.locations.length}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        <Briefcase size={12} />
                        {item.services.length}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manager Detail Modal */}
      {viewingManager && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingManager(null)}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{viewingManager.name}</h2>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      viewingManager.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {viewingManager.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail size={12} /> {viewingManager.email}
                  </p>
                  {viewingManager.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <PhoneIcon size={12} /> {viewingManager.phone}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setViewingManager(null)} className="p-1.5 hover:bg-gray-100 rounded-lg shrink-0">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-blue-600" />
                  Locations ({viewingManager.locations.length})
                </h3>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {viewingManager.locations.length > 0 ? (
                    viewingManager.locations.map((loc) => (
                      <span key={loc.id} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {loc.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No locations assigned</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <Briefcase size={16} className="text-green-600" />
                  Services ({viewingManager.services.length})
                </h3>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {viewingManager.services.length > 0 ? (
                    viewingManager.services.map((svc) => (
                      <span key={svc.id} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        {svc.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No services assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex justify-end gap-2">
              <button
                onClick={() => { setViewingManager(null); handleEdit(viewingManager); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() => setViewingManager(null)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin size={18} />
                    Assign Locations
                  </h3>
                  <div className="flex items-center gap-3">
                    {formData.locationIds.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {formData.locationIds.length} selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={selectAllLocations}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Select All{locationSearch.trim() ? ' (shown)' : ''}
                    </button>
                    {formData.locationIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, locationIds: [] }))}
                        className="text-xs text-gray-400 hover:text-red-500 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {locations.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-3">No locations available</p>
                  ) : filteredLocations.length === 0 ? (
                    <p className="text-sm text-gray-400 col-span-3">No locations match "{locationSearch}"</p>
                  ) : (
                    filteredLocations.map((loc) => (
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Briefcase size={18} />
                    Assign Services
                  </h3>
                  <div className="flex items-center gap-3">
                    {formData.serviceIds.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {formData.serviceIds.length} selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={selectAllServices}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Select All{serviceSearch.trim() ? ' (shown)' : ''}
                    </button>
                    {formData.serviceIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, serviceIds: [] }))}
                        className="text-xs text-gray-400 hover:text-red-500 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services..."
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-2">No services available</p>
                  ) : filteredServices.length === 0 ? (
                    <p className="text-sm text-gray-400 col-span-2">No services match "{serviceSearch}"</p>
                  ) : (
                    filteredServices.map((svc) => (
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
