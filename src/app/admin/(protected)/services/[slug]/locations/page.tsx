'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Search,
  Check,
  AlertCircle,
  Loader2,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  Save,
  CheckCircle,
  Building,
  Filter,
  ChevronRight,
  ChevronDown,
  Square,
  CheckSquare,
  MinusSquare,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CityLocation {
  id: string;
  name: string;
  slug: string;
  type?: 'CITY' | 'VILLAGE';
  parentName?: string | null;
  isEnabled: boolean;
  vehicleCount: number;
  vendorCount: number;
}

interface StateLocation {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  cities: CityLocation[];
  enabledCount: number;
  totalCount: number;
  isExpanded?: boolean;
}

interface FlatLocation {
  id: string;
  name: string;
  state: string;
  type?: 'CITY' | 'VILLAGE' | 'UNION_TERRITORY';
  parentName?: string | null;
  tier: number;
  isActive: boolean;
  isEnabled: boolean;
  vehicleCount: number;
  vendorCount: number;
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

export default function ServiceLocationsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [locationHierarchy, setLocationHierarchy] = useState<StateLocation[]>([]);
  const [flatLocations, setFlatLocations] = useState<FlatLocation[]>([]);
  const [unionTerritories, setUnionTerritories] = useState<CityLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');

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
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/services/${slug}/locations`);
        if (res.ok) {
          const data = await res.json();
          // Set hierarchical data with expanded state
          setLocationHierarchy(
            (data.locationHierarchy || []).map((state: StateLocation) => ({
              ...state,
              isExpanded: false,
            }))
          );
          // Set flat locations for grid view
          setFlatLocations(
            data.locations.map((loc: any) => ({
              id: loc.id,
              name: loc.name,
              state: loc.state,
              type: loc.type,
              parentName: loc.parentName,
              tier: loc.tier,
              isActive: loc.isActive,
              isEnabled: loc.isEnabled,
              vehicleCount: loc.vehicleCount || 0,
              vendorCount: loc.vendorCount || 0,
            }))
          );
          // Set union territories (and any villages directly under UTs, returned by API)
          setUnionTerritories(
            (data.unionTerritories || []).map((ut: any) => ({
              id: ut.id,
              name: ut.name,
              slug: ut.slug,
              type: ut.type,
              parentName: ut.parentName,
              isEnabled: ut.isEnabled,
              vehicleCount: ut.vehicleCount || 0,
              vendorCount: ut.vendorCount || 0,
            }))
          );
        } else {
          const errorData = await res.json();
          console.error('API error:', errorData);
          setLocationHierarchy([]);
          setFlatLocations([]);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        setLocationHierarchy([]);
        setFlatLocations([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLocations();
    }
  }, [slug]);

  const toggleStateExpanded = (stateId: string) => {
    setLocationHierarchy((prev) =>
      prev.map((state) =>
        state.id === stateId ? { ...state, isExpanded: !state.isExpanded } : state
      )
    );
  };

  const toggleCity = (stateId: string, cityId: string) => {
    setLocationHierarchy((prev) =>
      prev.map((state) =>
        state.id === stateId
          ? {
              ...state,
              cities: state.cities.map((city) =>
                city.id === cityId ? { ...city, isEnabled: !city.isEnabled } : city
              ),
              enabledCount:
                state.cities.filter((c) =>
                  c.id === cityId ? !c.isEnabled : c.isEnabled
                ).length,
            }
          : state
      )
    );
    // Also update flat locations
    setFlatLocations((prev) =>
      prev.map((loc) =>
        loc.id === cityId ? { ...loc, isEnabled: !loc.isEnabled } : loc
      )
    );
    setHasChanges(true);
  };

  const toggleStateAllCities = (stateId: string) => {
    setLocationHierarchy((prev) =>
      prev.map((state) => {
        if (state.id !== stateId) return state;

        const allEnabled = state.cities.every((c) => c.isEnabled);
        const newEnabledState = !allEnabled;

        // Update flat locations too
        const cityIds = state.cities.map((c) => c.id);
        setFlatLocations((prevFlat) =>
          prevFlat.map((loc) =>
            cityIds.includes(loc.id) ? { ...loc, isEnabled: newEnabledState } : loc
          )
        );

        return {
          ...state,
          cities: state.cities.map((city) => ({ ...city, isEnabled: newEnabledState })),
          enabledCount: newEnabledState ? state.cities.length : 0,
        };
      })
    );
    setHasChanges(true);
  };

  const expandAll = () => {
    setLocationHierarchy((prev) => prev.map((state) => ({ ...state, isExpanded: true })));
  };

  const toggleUnionTerritory = (utId: string) => {
    setUnionTerritories((prev) =>
      prev.map((ut) => (ut.id === utId ? { ...ut, isEnabled: !ut.isEnabled } : ut))
    );
    setHasChanges(true);
  };

  const collapseAll = () => {
    setLocationHierarchy((prev) => prev.map((state) => ({ ...state, isExpanded: false })));
  };

  const selectAll = () => {
    setLocationHierarchy((prev) =>
      prev.map((state) => ({
        ...state,
        cities: state.cities.map((city) => ({ ...city, isEnabled: true })),
        enabledCount: state.cities.length,
      }))
    );
    setFlatLocations((prev) => prev.map((loc) => ({ ...loc, isEnabled: true })));
    // Also select all union territories
    setUnionTerritories((prev) => prev.map((ut) => ({ ...ut, isEnabled: true })));
    setHasChanges(true);
  };

  const clearAll = () => {
    setLocationHierarchy((prev) =>
      prev.map((state) => ({
        ...state,
        cities: state.cities.map((city) => ({ ...city, isEnabled: false })),
        enabledCount: 0,
      }))
    );
    setFlatLocations((prev) => prev.map((loc) => ({ ...loc, isEnabled: false })));
    // Also clear all union territories
    setUnionTerritories((prev) => prev.map((ut) => ({ ...ut, isEnabled: false })));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Collect all enabled city IDs from hierarchy
      const enabledCityIds = locationHierarchy.flatMap((state) =>
        state.cities.filter((city) => city.isEnabled).map((city) => city.id)
      );

      // Collect enabled union territory IDs
      const enabledUTIds = unionTerritories
        .filter((ut) => ut.isEnabled)
        .map((ut) => ut.id);

      // Combine both
      const enabledIds = [...enabledCityIds, ...enabledUTIds];

      const res = await fetch(`/api/admin/services/${slug}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationIds: enabledIds }),
      });

      if (res.ok) {
        setHasChanges(false);
      } else {
        const error = await res.json();
        console.error('Failed to save locations:', error);
        alert(error.error || 'Failed to save locations');
      }
    } catch (error) {
      console.error('Failed to save locations:', error);
      alert('Failed to save locations');
    } finally {
      setSaving(false);
    }
  };

  // Filter states and cities based on search
  const filteredHierarchy = locationHierarchy
    .map((state) => {
      if (!search) return state;

      const stateMatches = state.name.toLowerCase().includes(search.toLowerCase());
      const matchingCities = state.cities.filter((city) =>
        city.name.toLowerCase().includes(search.toLowerCase())
      );

      if (stateMatches) {
        return { ...state, isExpanded: true }; // Show all cities if state matches
      } else if (matchingCities.length > 0) {
        return { ...state, cities: matchingCities, isExpanded: true };
      }
      return null;
    })
    .filter((state): state is StateLocation => state !== null);

  // Stats
  const totalCities = locationHierarchy.reduce((acc, s) => acc + s.totalCount, 0);
  const enabledCities = locationHierarchy.reduce((acc, s) => acc + s.enabledCount, 0);
  const totalStates = locationHierarchy.length;

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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Locations</h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {enabledCities + unionTerritories.filter(ut => ut.isEnabled).length} of {totalCities + unionTerritories.length} locations enabled
          </span>
          <Button
            disabled={!hasChanges || saving}
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total States</p>
          <p className="text-2xl font-bold text-gray-900">{totalStates}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Union Territories</p>
          <p className="text-2xl font-bold text-indigo-600">{unionTerritories.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Cities</p>
          <p className="text-2xl font-bold text-gray-900">{totalCities}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Enabled Locations</p>
          <p className="text-2xl font-bold text-green-600">{enabledCities + unionTerritories.filter(ut => ut.isEnabled).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Coverage</p>
          <p className="text-2xl font-bold text-blue-600">
            {(totalCities + unionTerritories.length) > 0
              ? Math.round(((enabledCities + unionTerritories.filter(ut => ut.isEnabled).length) / (totalCities + unionTerritories.length)) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search states or cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tree')}
            >
              <List className="w-4 h-4 mr-1" />
              Tree
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Grid
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'tree' && (
              <>
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-yellow-800">You have unsaved changes</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              Save Now
            </Button>
          </div>
        </div>
      )}

      {/* Location Tree View */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 border flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : locationHierarchy.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Locations Found</h3>
          <p className="text-gray-500 mb-4">
            No cities are available in the database. Please add locations from the{' '}
            <Link href="/admin/locations" className="text-blue-600 hover:underline">
              Location Management
            </Link>{' '}
            page first.
          </p>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {filteredHierarchy.map((state) => {
              const allEnabled = state.cities.length > 0 && state.cities.every((c) => c.isEnabled);
              const someEnabled = state.cities.some((c) => c.isEnabled);

              return (
                <div key={state.id}>
                  {/* State Header */}
                  <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <button
                      onClick={() => toggleStateExpanded(state.id)}
                      className="flex-1 flex items-center gap-3 p-4 text-left"
                    >
                      {state.isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Building className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">{state.name}</span>
                        {state.code && (
                          <span className="ml-2 text-sm text-gray-400">({state.code})</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 mr-4">
                        {state.enabledCount}/{state.totalCount} cities
                      </span>
                    </button>
                    <button
                      onClick={() => toggleStateAllCities(state.id)}
                      className="p-4 hover:bg-gray-200 rounded transition-colors"
                      title={allEnabled ? 'Deselect all cities' : 'Select all cities'}
                    >
                      {allEnabled ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : someEnabled ? (
                        <MinusSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Cities Grid */}
                  {state.isExpanded && state.cities.length > 0 && (
                    <div className="border-t bg-white p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {state.cities.map((city) => (
                          <button
                            key={city.id}
                            onClick={() => toggleCity(state.id, city.id)}
                            className={`p-3 rounded-lg border-2 text-left transition ${
                              city.isEnabled
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-medium text-gray-900 text-sm truncate">{city.name}</span>
                                {city.type === 'VILLAGE' && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 shrink-0">
                                    Village
                                  </span>
                                )}
                              </div>
                              {city.isEnabled && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                            </div>
                            {city.parentName && (
                              <div className="text-[11px] text-gray-400 mb-1">in {city.parentName}</div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                {city.vehicleCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {city.vendorCount}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Union Territories Section */}
          {unionTerritories.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <div className="flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 p-4">
                <MapPin className="w-5 h-5 text-indigo-600 mr-3" />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">Union Territories</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({unionTerritories.filter(ut => ut.isEnabled).length}/{unionTerritories.length} enabled)
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {unionTerritories
                    .filter(ut => !search || ut.name.toLowerCase().includes(search.toLowerCase()))
                    .map((ut) => (
                      <button
                        key={ut.id}
                        onClick={() => toggleUnionTerritory(ut.id)}
                        className={`p-3 rounded-lg border-2 text-left transition ${
                          ut.isEnabled
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-gray-900 text-sm truncate">{ut.name}</span>
                            {ut.type === 'VILLAGE' && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 shrink-0">
                                Village
                              </span>
                            )}
                          </div>
                          {ut.isEnabled && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </div>
                        {ut.parentName && (
                          <div className="text-[11px] text-gray-400 mb-1">in {ut.parentName}</div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {ut.vehicleCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {ut.vendorCount}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Grid View (by tier)
        <div className="space-y-6">
          {[1, 2, 3].map((tier) => {
            const tierLocations = flatLocations.filter((l) => l.tier === tier);
            if (tierLocations.length === 0) return null;

            const tierLabel = tier === 1 ? 'Metro Cities' : tier === 2 ? 'Tier 2 Cities' : 'Tier 3 Cities';
            const tierColor = tier === 1 ? 'blue' : tier === 2 ? 'purple' : 'orange';
            const enabledInTier = tierLocations.filter((l) => l.isEnabled).length;

            return (
              <div key={tier} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${tierColor}-500`}></div>
                    <h3 className="font-semibold text-gray-900">{tierLabel}</h3>
                    <span className="text-sm text-gray-500">
                      ({enabledInTier}/{tierLocations.length} enabled)
                    </span>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {tierLocations
                    .filter(
                      (loc) =>
                        !search ||
                        loc.name.toLowerCase().includes(search.toLowerCase()) ||
                        loc.state.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((location) => {
                      // Find state for this city to toggle properly
                      const parentState = locationHierarchy.find((s) =>
                        s.cities.some((c) => c.id === location.id)
                      );

                      return (
                        <button
                          key={location.id}
                          onClick={() => {
                            if (parentState) {
                              toggleCity(parentState.id, location.id);
                            }
                          }}
                          className={`p-4 rounded-lg border-2 text-left transition ${
                            location.isEnabled
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-medium text-gray-900 truncate">{location.name}</span>
                              {location.type === 'VILLAGE' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 shrink-0">
                                  Village
                                </span>
                              )}
                            </div>
                            {location.isEnabled && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {location.parentName ? `${location.parentName}, ${location.state}` : location.state}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {location.vehicleCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {location.vendorCount}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
