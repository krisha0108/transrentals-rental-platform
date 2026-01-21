'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  RefreshCw,
  ArrowLeft,
  Save,
  X,
  Loader2,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ALL_CITIES, City } from '@/data/indian-cities';

interface Location {
  id: string;
  name: string;
  slug: string;
  state: string;
  stateCode: string | null;
  tier: number;
  isActive: boolean;
  displayOrder: number;
  _count: { rates: number; availability: number };
}

const STATES = [
  { name: 'Maharashtra', code: 'MH' },
  { name: 'Delhi', code: 'DL' },
  { name: 'Karnataka', code: 'KA' },
  { name: 'Tamil Nadu', code: 'TN' },
  { name: 'Gujarat', code: 'GJ' },
  { name: 'Rajasthan', code: 'RJ' },
  { name: 'Uttar Pradesh', code: 'UP' },
  { name: 'West Bengal', code: 'WB' },
  { name: 'Kerala', code: 'KL' },
  { name: 'Andhra Pradesh', code: 'AP' },
  { name: 'Telangana', code: 'TS' },
  { name: 'Madhya Pradesh', code: 'MP' },
  { name: 'Goa', code: 'GA' },
  { name: 'Punjab', code: 'PB' },
  { name: 'Haryana', code: 'HR' },
  { name: 'Himachal Pradesh', code: 'HP' },
  { name: 'Uttarakhand', code: 'UK' },
  { name: 'Bihar', code: 'BR' },
  { name: 'Odisha', code: 'OD' },
  { name: 'Assam', code: 'AS' },
];

export default function LocationsManagementPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'predefined'>('database');
  const [predefinedSearch, setPredefinedSearch] = useState('');
  const [predefinedStateFilter, setPredefinedStateFilter] = useState('');
  const [predefinedTierFilter, setPredefinedTierFilter] = useState('');
  const [addingCities, setAddingCities] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    state: '',
    stateCode: '',
    tier: 2,
    displayOrder: 0,
    isActive: true,
  });

  // Get existing location slugs for comparison
  const existingLocationSlugs = useMemo(() => {
    return new Set(locations.map(loc => loc.slug.toLowerCase()));
  }, [locations]);

  // Filter predefined cities
  const filteredPredefinedCities = useMemo(() => {
    return ALL_CITIES.filter(city => {
      const matchesSearch = predefinedSearch === '' ||
        city.name.toLowerCase().includes(predefinedSearch.toLowerCase()) ||
        city.slug.toLowerCase().includes(predefinedSearch.toLowerCase());
      const matchesState = predefinedStateFilter === '' || city.state === predefinedStateFilter;
      const matchesTier = predefinedTierFilter === '' || city.tier === parseInt(predefinedTierFilter);
      return matchesSearch && matchesState && matchesTier;
    });
  }, [predefinedSearch, predefinedStateFilter, predefinedTierFilter]);

  // Check if a city already exists in database
  const isCityInDatabase = useCallback((city: City) => {
    return existingLocationSlugs.has(city.slug.toLowerCase());
  }, [existingLocationSlugs]);

  // Add predefined city to database
  const addPredefinedCity = async (city: City) => {
    if (isCityInDatabase(city)) return;

    setAddingCities(prev => new Set(prev).add(city.slug));

    try {
      const res = await fetch('/api/admin/fleet/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: city.name,
          slug: city.slug,
          state: city.state,
          stateCode: city.stateCode,
          tier: city.tier,
          displayOrder: 10 - city.priority, // Higher priority = lower display order
          isActive: true,
        }),
      });

      if (res.ok) {
        fetchLocations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add city');
      }
    } catch (error) {
      console.error('Failed to add city:', error);
    } finally {
      setAddingCities(prev => {
        const next = new Set(prev);
        next.delete(city.slug);
        return next;
      });
    }
  };

  // Bulk add all filtered cities
  const addAllFilteredCities = async () => {
    const citiesToAdd = filteredPredefinedCities.filter(city => !isCityInDatabase(city));
    if (citiesToAdd.length === 0) {
      alert('All cities in this filter are already in the database');
      return;
    }

    if (!confirm(`Add ${citiesToAdd.length} cities to the database?`)) return;

    for (const city of citiesToAdd) {
      await addPredefinedCity(city);
    }
  };

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(stateFilter && { state: stateFilter }),
        ...(tierFilter && { tier: tierFilter }),
      });

      const res = await fetch(`/api/admin/fleet/locations?${params}`);
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter, tierFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'tier' || name === 'displayOrder' ? parseInt(value) : value,
    }));

    if (name === 'name' && !editingLocation) {
      setFormData((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }

    if (name === 'state') {
      const stateData = STATES.find((s) => s.name === value);
      setFormData((prev) => ({ ...prev, stateCode: stateData?.code || '' }));
    }
  };

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({ name: '', slug: '', state: '', stateCode: '', tier: 2, displayOrder: 0, isActive: true });
    setShowModal(true);
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      slug: location.slug,
      state: location.state,
      stateCode: location.stateCode || '',
      tier: location.tier,
      displayOrder: location.displayOrder,
      isActive: location.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingLocation
        ? `/api/admin/fleet/locations/${editingLocation.id}`
        : '/api/admin/fleet/locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also remove all associated rates and availability.`)) return;

    try {
      const res = await fetch(`/api/admin/fleet/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocations();
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Tier 1';
      case 2: return 'Tier 2';
      case 3: return 'Tier 3';
      case 4: return 'Tier 4';
      default: return `Tier ${tier}`;
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-blue-100 text-blue-700';
      case 2: return 'bg-green-100 text-green-700';
      case 3: return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get unique states from predefined cities for filter dropdown
  const predefinedStates = useMemo(() => {
    const states = [...new Set(ALL_CITIES.map(city => city.state))].sort();
    return states;
  }, []);

  // Stats for predefined cities
  const predefinedStats = useMemo(() => {
    const total = filteredPredefinedCities.length;
    const inDb = filteredPredefinedCities.filter(city => isCityInDatabase(city)).length;
    const notInDb = total - inDb;
    return { total, inDb, notInDb };
  }, [filteredPredefinedCities, isCityInDatabase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/fleet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Locations</h1>
            <p className="text-gray-600">Add and manage cities for fleet availability and pricing</p>
          </div>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('database')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Database Locations ({locations.length})
            </button>
            <button
              onClick={() => setActiveTab('predefined')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'predefined'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Predefined Cities ({ALL_CITIES.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'database' ? (
            /* Database Locations Filters */
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
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">All States</option>
                {STATES.map((s) => (
                  <option key={s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">All Tiers</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
              </select>
              <Button variant="outline" onClick={fetchLocations}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          ) : (
            /* Predefined Cities Filters */
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search predefined cities..."
                    value={predefinedSearch}
                    onChange={(e) => setPredefinedSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={predefinedStateFilter}
                  onChange={(e) => setPredefinedStateFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="">All States</option>
                  {predefinedStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <select
                  value={predefinedTierFilter}
                  onChange={(e) => setPredefinedTierFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="">All Tiers</option>
                  <option value="1">Tier 1</option>
                  <option value="2">Tier 2</option>
                  <option value="3">Tier 3</option>
                  <option value="4">Tier 4</option>
                </select>
                <Button
                  onClick={addAllFilteredCities}
                  disabled={predefinedStats.notInDb === 0}
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add All ({predefinedStats.notInDb})
                </Button>
              </div>
              {/* Stats bar */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Showing {predefinedStats.total} cities:
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  {predefinedStats.inDb} in database
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  {predefinedStats.notInDb} not added
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'database' ? (
        /* Database Locations Grid */
        loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-500 mb-4">Add cities where your fleet operates</p>
            <div className="flex justify-center gap-3">
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('predefined')}>
                <Database className="w-4 h-4 mr-2" />
                Import from Predefined
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">{location.state}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTierColor(location.tier)}`}>
                    {getTierLabel(location.tier)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>{location._count.rates} rates</span>
                  <span>{location._count.availability} vehicles</span>
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
                      onClick={() => handleDelete(location.id, location.name)}
                      className="p-1.5 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Predefined Cities Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPredefinedCities.map((city) => {
            const isInDb = isCityInDatabase(city);
            const isAdding = addingCities.has(city.slug);

            return (
              <div
                key={city.slug}
                className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition ${
                  isInDb ? 'border-green-200 bg-green-50/30' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-5 h-5 ${isInDb ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{city.name}</h3>
                      <p className="text-sm text-gray-500">{city.state}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTierColor(city.tier)}`}>
                    Tier {city.tier}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>/{city.slug}</span>
                  <span>Priority: {city.priority}</span>
                </div>

                <div className="flex items-center justify-between">
                  {isInDb ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Database
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600">Not added yet</span>
                  )}
                  {!isInDb && (
                    <Button
                      size="sm"
                      onClick={() => addPredefinedCity(city)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Mumbai"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="e.g., mumbai"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select State</option>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City Tier</label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value={1}>Tier 1</option>
                  <option value={2}>Tier 2</option>
                  <option value={3}>Tier 3</option>
                  <option value={4}>Tier 4</option>
                </select>
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
