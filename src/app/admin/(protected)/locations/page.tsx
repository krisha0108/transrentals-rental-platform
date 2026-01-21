'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Globe,
  Building2,
  Map,
  Navigation,
  Loader2,
  X,
  Save,
  MapPinned,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
  slug: string;
  type: 'COUNTRY' | 'STATE' | 'CITY' | 'AREA' | 'AIRPORT';
  parentId: string | null;
  code: string | null;
  image: string | null;
  isActive: boolean;
  displayOrder: number;
  latitude: number | null;
  longitude: number | null;
  parent?: { id: string; name: string; type: string } | null;
  children?: Location[];
  _count?: { children: number; serviceLocations: number };
}

const TYPE_CONFIG = {
  COUNTRY: { label: 'Country', icon: Globe, color: 'bg-blue-100 text-blue-700', order: 1 },
  STATE: { label: 'State', icon: Building2, color: 'bg-purple-100 text-purple-700', order: 2 },
  CITY: { label: 'City', icon: Map, color: 'bg-green-100 text-green-700', order: 3 },
  AREA: { label: 'Area', icon: Navigation, color: 'bg-amber-100 text-amber-700', order: 4 },
  AIRPORT: { label: 'Airport', icon: Plane, color: 'bg-sky-100 text-sky-700', order: 5 },
};

export default function LocationsManagementPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [parentOptions, setParentOptions] = useState<Location[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'CITY' as 'COUNTRY' | 'STATE' | 'CITY' | 'AREA' | 'AIRPORT',
    parentId: '',
    code: '',
    image: '',
    latitude: '',
    longitude: '',
    displayOrder: 0,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  });

  const [fetchingCoords, setFetchingCoords] = useState(false);
  const [coordsFetchStatus, setCoordsFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch coordinates from location name
  const fetchCoordinates = useCallback(async (locationName: string, locationType: string) => {
    if (!locationName || locationName.trim().length < 2) return;
    if (locationType === 'COUNTRY') return; // Don't fetch for countries

    setFetchingCoords(true);
    setCoordsFetchStatus('idle');

    try {
      const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(locationName)}`);
      const data = await res.json();

      if (data.success && data.latitude && data.longitude) {
        setFormData(prev => ({
          ...prev,
          latitude: data.latitude.toFixed(7),
          longitude: data.longitude.toFixed(7),
        }));
        setCoordsFetchStatus('success');
      } else {
        setCoordsFetchStatus('error');
      }
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      setCoordsFetchStatus('error');
    } finally {
      setFetchingCoords(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (viewMode === 'flat') {
        params.set('flat', 'true');
        if (typeFilter) params.set('type', typeFilter);
      }

      const res = await fetch(`/api/admin/locations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
        // Auto-expand first level
        if (viewMode === 'tree' && data.length > 0) {
          setExpandedIds(new Set(data.map((l: Location) => l.id)));
        }
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  }, [viewMode, typeFilter]);

  const fetchParentOptions = async (type: string) => {
    // Hierarchy: COUNTRY -> STATE -> CITY -> (AREA | AIRPORT)
    // STATE's parent is COUNTRY
    // CITY's parent is STATE
    // AREA's parent is CITY
    // AIRPORT's parent is CITY (airports are located in cities)
    // COUNTRY has no parent
    let parentType: string | null = null;
    if (type === 'STATE') parentType = 'COUNTRY';
    else if (type === 'CITY') parentType = 'STATE';
    else if (type === 'AREA' || type === 'AIRPORT') parentType = 'CITY';

    if (!parentType) {
      setParentOptions([]);
      return;
    }

    try {
      const res = await fetch(`/api/admin/locations?flat=true&type=${parentType}`);
      if (res.ok) {
        setParentOptions(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch parent options:', error);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'name' && !editingLocation) {
      setFormData((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));

      // Debounced auto-fetch coordinates for new locations
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      geocodeTimeoutRef.current = setTimeout(() => {
        fetchCoordinates(value, formData.type);
      }, 800); // Wait 800ms after user stops typing
    }

    if (name === 'type') {
      fetchParentOptions(value);
      setFormData((prev) => ({ ...prev, parentId: '' }));
    }
  };

  const openAddModal = (parent_location?: Location) => {
    setEditingLocation(null);
    setCoordsFetchStatus('idle');
    const defaultType = parent_location
      ? (parent_location.type === 'COUNTRY' ? 'STATE' : parent_location.type === 'STATE' ? 'CITY' : 'AREA')
      : 'CITY';

    setFormData({
      name: '',
      slug: '',
      type: defaultType as any,
      parentId: parent_location?.id || '',
      code: '',
      image: '',
      latitude: '',
      longitude: '',
      displayOrder: 0,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
    });

    fetchParentOptions(defaultType);
    setShowModal(true);
  };

  const openEditModal = async (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      slug: location.slug,
      type: location.type,
      parentId: location.parentId || '',
      code: location.code || '',
      image: location.image || '',
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
      displayOrder: location.displayOrder,
      isActive: location.isActive,
      metaTitle: '',
      metaDescription: '',
    });

    await fetchParentOptions(location.type);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingLocation
        ? `/api/admin/locations/${editingLocation.id}`
        : '/api/admin/locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchLocations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Failed to save location:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string, childCount: number) => {
    if (childCount > 0) {
      alert(`Cannot delete "${name}" because it has ${childCount} child location(s). Delete children first.`);
      return;
    }
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
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

  const renderLocationTree = (locationList: Location[], level: number = 0) => {
    const filtered = search
      ? locationList.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
      : locationList;

    return filtered.map((location) => {
      const config = TYPE_CONFIG[location.type];
      const Icon = config.icon;
      const hasChildren = location.children && location.children.length > 0;
      const isExpanded = expandedIds.has(location.id);

      return (
        <div key={location.id}>
          <div
            className={`flex items-center gap-2 px-4 py-3 hover:bg-gray-50 border-b ${
              level > 0 ? 'bg-gray-50/50' : ''
            }`}
            style={{ paddingLeft: `${16 + level * 24}px` }}
          >
            {/* Expand/Collapse button */}
            <button
              onClick={() => toggleExpand(location.id)}
              className={`p-1 rounded hover:bg-gray-200 ${!hasChildren ? 'invisible' : ''}`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Icon & Name */}
            <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{location.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${config.color}`}>
                  {config.label}
                </span>
                {location.code && (
                  <span className="text-xs text-gray-400">({location.code})</span>
                )}
              </div>
              <span className="text-sm text-gray-500">/{location.slug}</span>
            </div>

            {/* Children count */}
            {location._count && (
              <span className="text-xs text-gray-400">
                {location._count.children} children
              </span>
            )}

            {/* Status */}
            <span className={`text-xs ${location.isActive ? 'text-green-600' : 'text-red-500'}`}>
              {location.isActive ? '● Active' : '○ Inactive'}
            </span>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => openAddModal(location)}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Add child location"
              >
                <Plus className="w-4 h-4 text-blue-500" />
              </button>
              <button
                onClick={() => openEditModal(location)}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Edit"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleDelete(location.id, location.name, location._count?.children || 0)}
                className="p-1.5 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* Children */}
          {isExpanded && hasChildren && renderLocationTree(location.children!, level + 1)}
        </div>
      );
    });
  };

  const renderFlatList = () => {
    const filtered = search
      ? locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
      : locations;

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {filtered.map((location) => {
          const config = TYPE_CONFIG[location.type];
          const Icon = config.icon;

          return (
            <div
              key={location.id}
              className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    {location.parent && (
                      <p className="text-sm text-gray-500">{location.parent.name}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
                  {config.label}
                </span>
              </div>

              <div className="text-sm text-gray-500 mb-3">
                <span>/{location.slug}</span>
                {location.code && <span className="ml-2">({location.code})</span>}
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs ${location.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {location.isActive ? '● Active' : '○ Inactive'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(location)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(location.id, location.name, location._count?.children || 0)}
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
          <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600">Manage hierarchical locations (Country → State → City → Area)</p>
        </div>
        <Button onClick={() => openAddModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {viewMode === 'flat' && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="COUNTRY">Countries</option>
              <option value="STATE">States</option>
              <option value="CITY">Cities</option>
              <option value="AREA">Areas</option>
              <option value="AIRPORT">Airports</option>
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

          <Button variant="outline" onClick={fetchLocations}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">Start by adding a country, then states, cities, and areas</p>
          <Button onClick={() => openAddModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Location
          </Button>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {renderLocationTree(locations)}
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
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                    disabled={!!editingLocation}
                  >
                    <option value="COUNTRY">Country</option>
                    <option value="STATE">State</option>
                    <option value="CITY">City</option>
                    <option value="AREA">Area</option>
                    <option value="AIRPORT">Airport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent {formData.type !== 'COUNTRY' && '*'}
                  </label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required={formData.type !== 'COUNTRY'}
                    disabled={formData.type === 'COUNTRY'}
                  >
                    <option value="">
                      {formData.type === 'COUNTRY' ? 'No parent (Top level)' : 'Select parent...'}
                    </option>
                    {parentOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Maharashtra, Mumbai"
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
                    placeholder="e.g., maharashtra, mumbai"
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., MH, IN"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {(formData.type === 'CITY' || formData.type === 'AREA' || formData.type === 'STATE') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Coordinates
                      {!editingLocation && (
                        <span className="text-xs text-gray-400 ml-2">(auto-fetched from name)</span>
                      )}
                    </label>
                    {fetchingCoords && (
                      <span className="flex items-center text-xs text-blue-600">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Fetching...
                      </span>
                    )}
                    {!fetchingCoords && coordsFetchStatus === 'success' && (
                      <span className="flex items-center text-xs text-green-600">
                        <MapPinned className="w-3 h-3 mr-1" />
                        Coordinates found
                      </span>
                    )}
                    {!fetchingCoords && coordsFetchStatus === 'error' && (
                      <span className="flex items-center text-xs text-amber-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        Not found (enter manually)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        placeholder="Latitude (e.g., 19.0760)"
                        className={`w-full px-4 py-2 border rounded-lg ${
                          fetchingCoords ? 'bg-gray-50' : ''
                        } ${coordsFetchStatus === 'success' ? 'border-green-300' : ''}`}
                        disabled={fetchingCoords}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        placeholder="Longitude (e.g., 72.8777)"
                        className={`w-full px-4 py-2 border rounded-lg ${
                          fetchingCoords ? 'bg-gray-50' : ''
                        } ${coordsFetchStatus === 'success' ? 'border-green-300' : ''}`}
                        disabled={fetchingCoords}
                      />
                    </div>
                  </div>
                  {!editingLocation && formData.name && !fetchingCoords && (
                    <button
                      type="button"
                      onClick={() => fetchCoordinates(formData.name, formData.type)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Re-fetch coordinates
                    </button>
                  )}
                </div>
              )}

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
                  {editingLocation ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
