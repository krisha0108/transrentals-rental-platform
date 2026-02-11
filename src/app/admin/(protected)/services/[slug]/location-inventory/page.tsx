'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Search,
  Package,
  Car,
  Building2,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  X,
  Plane,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleModel {
  id: string;
  name: string;
  brand: string;
  category: string;
  basePrice: number;
}

interface FleetVehicle {
  id: string;
  modelName: string;
  registrationNumber: string;
  vendorName: string;
}

interface LocationInventory {
  locationId: string;
  locationName: string;
  locationSlug: string;
  stateName: string;
  vehicleModels?: VehicleModel[];
  fleetVehicles?: FleetVehicle[];
  totalModels?: number;
  totalFleet?: number;
  // Chauffeur service fields
  localPackages?: any[];
  cityPricing?: any[];
  routesFrom?: any[];
  routesTo?: any[];
  airportRoutesFrom?: any[];
  airportRoutesTo?: any[];
  totalLocalPackages?: number;
  totalCityPricing?: number;
  totalRoutesFrom?: number;
  totalRoutesTo?: number;
  totalAirportRoutesFrom?: number;
  totalAirportRoutesTo?: number;
}

interface InventoryData {
  success: boolean;
  serviceType: 'fleet' | 'chauffeur';
  inventory: LocationInventory[];
  summary: {
    totalLocations: number;
    totalModels?: number;
    totalFleet?: number;
    totalLocalPackages?: number;
    totalCityPricing?: number;
    totalRoutes?: number;
    totalAirportRoutes?: number;
  };
  vehicleCategories?: any[];
}

export default function LocationInventoryPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [minModels, setMinModels] = useState<string>('');
  const [minFleet, setMinFleet] = useState<string>('');

  useEffect(() => {
    fetchInventory();
  }, [serviceSlug]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/services/${serviceSlug}/location-inventory`);

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    const newExpanded = new Set(expandedLocations);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedLocations(newExpanded);
  };

  // Extract unique values for filters
  const uniqueStates = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.inventory.map(loc => loc.stateName))).sort();
  }, [data]);

  const uniqueBrands = useMemo(() => {
    if (!data || data.serviceType !== 'fleet') return [];
    const brands = new Set<string>();
    data.inventory.forEach(loc => {
      loc.vehicleModels?.forEach(model => brands.add(model.brand));
    });
    return Array.from(brands).sort();
  }, [data]);

  const uniqueCategories = useMemo(() => {
    if (!data || data.serviceType !== 'fleet') return [];
    const categories = new Set<string>();
    data.inventory.forEach(loc => {
      loc.vehicleModels?.forEach(model => categories.add(model.category));
    });
    return Array.from(categories).sort();
  }, [data]);

  const uniqueVendors = useMemo(() => {
    if (!data || data.serviceType !== 'fleet') return [];
    const vendors = new Set<string>();
    data.inventory.forEach(loc => {
      loc.fleetVehicles?.forEach(vehicle => vendors.add(vehicle.vendorName));
    });
    return Array.from(vendors).sort();
  }, [data]);

  // Apply filters
  const filteredInventory = useMemo(() => {
    if (!data) return [];

    return data.inventory.filter(loc => {
      // Search filter
      const matchesSearch = loc.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.stateName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // State filter
      if (selectedState && loc.stateName !== selectedState) return false;

      // Min models filter
      if (minModels && loc.totalModels! < parseInt(minModels)) return false;

      // Min fleet filter
      if (minFleet && loc.totalFleet! < parseInt(minFleet)) return false;

      // Brand filter
      if (selectedBrand && data.serviceType === 'fleet') {
        const hasBrand = loc.vehicleModels?.some(model => model.brand === selectedBrand);
        if (!hasBrand) return false;
      }

      // Category filter
      if (selectedCategory && data.serviceType === 'fleet') {
        const hasCategory = loc.vehicleModels?.some(model => model.category === selectedCategory);
        if (!hasCategory) return false;
      }

      // Vendor filter
      if (selectedVendor && data.serviceType === 'fleet') {
        const hasVendor = loc.fleetVehicles?.some(vehicle => vehicle.vendorName === selectedVendor);
        if (!hasVendor) return false;
      }

      return true;
    });
  }, [data, searchTerm, selectedState, selectedBrand, selectedCategory, selectedVendor, minModels, minFleet]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedBrand('');
    setSelectedCategory('');
    setSelectedVendor('');
    setMinModels('');
    setMinFleet('');
  };

  const activeFiltersCount = [
    selectedState,
    selectedBrand,
    selectedCategory,
    selectedVendor,
    minModels,
    minFleet,
  ].filter(Boolean).length;

  // Export to Excel
  const exportToExcel = () => {
    if (!data) return;

    const workbook = XLSX.utils.book_new();

    if (data.serviceType === 'fleet') {
      // Sheet 1: Location Summary
      const summaryData = filteredInventory.map(loc => ({
        'Location': loc.locationName,
        'State': loc.stateName,
        'Total Models': loc.totalModels || 0,
        'Total Fleet': loc.totalFleet || 0,
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Location Summary');

      // Sheet 2: Vehicle Models Details
      const modelsData: any[] = [];
      filteredInventory.forEach(loc => {
        loc.vehicleModels?.forEach(model => {
          modelsData.push({
            'Location': loc.locationName,
            'State': loc.stateName,
            'Model Name': model.name,
            'Brand': model.brand,
            'Category': model.category,
            'Base Price/Day': model.basePrice,
          });
        });
      });
      const modelsSheet = XLSX.utils.json_to_sheet(modelsData);
      XLSX.utils.book_append_sheet(workbook, modelsSheet, 'Vehicle Models');

      // Sheet 3: Fleet Vehicles Details
      const fleetData: any[] = [];
      filteredInventory.forEach(loc => {
        loc.fleetVehicles?.forEach(vehicle => {
          fleetData.push({
            'Location': loc.locationName,
            'State': loc.stateName,
            'Model': vehicle.modelName,
            'Registration Number': vehicle.registrationNumber,
            'Vendor': vehicle.vendorName,
          });
        });
      });
      const fleetSheet = XLSX.utils.json_to_sheet(fleetData);
      XLSX.utils.book_append_sheet(workbook, fleetSheet, 'Fleet Vehicles');

    } else {
      // Chauffeur Service Export
      const summaryData = filteredInventory.map(loc => ({
        'Location': loc.locationName,
        'State': loc.stateName,
        'Local Packages': loc.totalLocalPackages || 0,
        'City Pricing': loc.totalCityPricing || 0,
        'City Routes': loc.totalRoutesFrom || 0,
        'Airport Routes': loc.totalAirportRoutesFrom || 0,
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Location Summary');

      // Local Packages
      const packagesData: any[] = [];
      filteredInventory.forEach(loc => {
        loc.localPackages?.forEach((pkg: any) => {
          packagesData.push({
            'Location': loc.locationName,
            'State': loc.stateName,
            'Package Name': pkg.name,
            'Hours': pkg.hours,
            'KMs': pkg.kms,
            'Base Price': pkg.basePrice,
            'Category': pkg.category,
          });
        });
      });
      if (packagesData.length > 0) {
        const packagesSheet = XLSX.utils.json_to_sheet(packagesData);
        XLSX.utils.book_append_sheet(workbook, packagesSheet, 'Local Packages');
      }

      // City Routes
      const routesData: any[] = [];
      filteredInventory.forEach(loc => {
        loc.routesFrom?.forEach((route: any) => {
          routesData.push({
            'From': loc.locationName,
            'To': route.to,
            'Distance (km)': route.estimatedKm,
            'Base Price': route.basePrice,
            'Category': route.category,
          });
        });
      });
      if (routesData.length > 0) {
        const routesSheet = XLSX.utils.json_to_sheet(routesData);
        XLSX.utils.book_append_sheet(workbook, routesSheet, 'City Routes');
      }

      // Airport Routes
      const airportRoutesData: any[] = [];
      filteredInventory.forEach(loc => {
        // Routes FROM location
        loc.airportRoutesFrom?.forEach((route: any) => {
          airportRoutesData.push({
            'Direction': 'From',
            'Location': loc.locationName,
            'To/From': route.to,
            'Type': route.toType === 'AIRPORT' ? 'To Airport' : 'From Airport',
            'Distance (km)': route.estimatedKm,
            'Base Price': route.basePrice,
            'Category': route.category,
          });
        });
        // Routes TO location
        loc.airportRoutesTo?.forEach((route: any) => {
          airportRoutesData.push({
            'Direction': 'To',
            'Location': loc.locationName,
            'To/From': route.from,
            'Type': route.fromType === 'AIRPORT' ? 'From Airport' : 'To Airport',
            'Distance (km)': route.estimatedKm,
            'Base Price': route.basePrice,
            'Category': route.category,
          });
        });
      });
      if (airportRoutesData.length > 0) {
        const airportSheet = XLSX.utils.json_to_sheet(airportRoutesData);
        XLSX.utils.book_append_sheet(workbook, airportSheet, 'Airport Routes');
      }
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${serviceSlug}-location-inventory-${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 mb-4">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Error Loading Inventory</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchInventory} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/admin/services/${serviceSlug}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Location Inventory</h1>
                <p className="text-sm text-gray-500 capitalize">{serviceSlug.replace(/-/g, ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={exportToExcel}
                disabled={filteredInventory.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Locations</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalLocations}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {data.serviceType === 'fleet' && (
              <>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Vehicle Models</p>
                      <p className="text-2xl font-bold text-gray-900">{data.summary.totalModels || 0}</p>
                    </div>
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Fleet Vehicles</p>
                      <p className="text-2xl font-bold text-gray-900">{data.summary.totalFleet || 0}</p>
                    </div>
                    <Car className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </>
            )}

            {data.serviceType === 'chauffeur' && (
              <>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Local Packages</p>
                      <p className="text-2xl font-bold text-gray-900">{data.summary.totalLocalPackages || 0}</p>
                    </div>
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">City Routes</p>
                      <p className="text-2xl font-bold text-gray-900">{data.summary.totalRoutes || 0}</p>
                    </div>
                    <Route className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Airport Routes</p>
                      <p className="text-2xl font-bold text-gray-900">{data.summary.totalAirportRoutes || 0}</p>
                    </div>
                    <Plane className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* State Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All States</option>
                    {uniqueStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* Fleet Service Filters */}
                {data?.serviceType === 'fleet' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                      </label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Brands</option>
                        {uniqueBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor
                      </label>
                      <select
                        value={selectedVendor}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Vendors</option>
                        {uniqueVendors.map(vendor => (
                          <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min. Models
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={minModels}
                        onChange={(e) => setMinModels(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min. Fleet Vehicles
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={minFleet}
                        onChange={(e) => setMinFleet(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Active Filters Summary */}
              {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {selectedState && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        State: {selectedState}
                        <button
                          onClick={() => setSelectedState('')}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedBrand && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Brand: {selectedBrand}
                        <button
                          onClick={() => setSelectedBrand('')}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Category: {selectedCategory}
                        <button
                          onClick={() => setSelectedCategory('')}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedVendor && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Vendor: {selectedVendor}
                        <button
                          onClick={() => setSelectedVendor('')}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {minModels && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Min Models: {minModels}+
                        <button
                          onClick={() => setMinModels('')}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {minFleet && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Min Fleet: {minFleet}+
                        <button
                          onClick={() => setMinFleet('')}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Counter */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredInventory.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{data?.inventory.length || 0}</span> locations
            </p>
            {filteredInventory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allIds = new Set(filteredInventory.map(loc => loc.locationId));
                  setExpandedLocations(allIds);
                }}
              >
                Expand All
              </Button>
            )}
          </div>

          {/* Inventory List */}
          <div className="space-y-4">
            {filteredInventory.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No locations found</p>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              filteredInventory.map((location) => {
                const isExpanded = expandedLocations.has(location.locationId);
                const hasContent = data.serviceType === 'fleet'
                  ? (location.totalModels! > 0 || location.totalFleet! > 0)
                  : (location.totalLocalPackages! > 0 || location.totalRoutesFrom! > 0 || location.totalAirportRoutesFrom! > 0);

                return (
                  <div key={location.locationId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Location Header */}
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleLocation(location.locationId)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{location.locationName}</h3>
                          <p className="text-sm text-gray-500">{location.stateName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {data.serviceType === 'fleet' && (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Models</p>
                              <p className="text-lg font-semibold text-gray-900">{location.totalModels || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Fleet</p>
                              <p className="text-lg font-semibold text-gray-900">{location.totalFleet || 0}</p>
                            </div>
                          </>
                        )}
                        {data.serviceType === 'chauffeur' && (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Packages</p>
                              <p className="text-sm font-semibold text-gray-900">{location.totalLocalPackages || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">City Routes</p>
                              <p className="text-sm font-semibold text-gray-900">{location.totalRoutesFrom || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Airport</p>
                              <p className="text-sm font-semibold text-gray-900">{location.totalAirportRoutesFrom || 0}</p>
                            </div>
                          </>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && hasContent && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        {data.serviceType === 'fleet' && (
                          <div className="space-y-4">
                            {/* Vehicle Models */}
                            {location.vehicleModels && location.vehicleModels.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Package className="w-4 h-4 mr-2" />
                                  Vehicle Models ({location.vehicleModels.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {location.vehicleModels.map((model) => (
                                    <div key={model.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900 text-sm">{model.name}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium">Brand:</span> {model.brand}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        <span className="font-medium">Category:</span> {model.category}
                                      </p>
                                      {model.basePrice > 0 && (
                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                          ₹{model.basePrice}/day
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Fleet Vehicles */}
                            {location.fleetVehicles && location.fleetVehicles.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Car className="w-4 h-4 mr-2" />
                                  Fleet Vehicles ({location.fleetVehicles.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {location.fleetVehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900 text-sm">{vehicle.modelName}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium">Reg:</span> {vehicle.registrationNumber}
                                      </p>
                                      <p className="text-xs text-gray-500 flex items-center mt-1">
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {vehicle.vendorName}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {data.serviceType === 'chauffeur' && (
                          <div className="space-y-4">
                            {/* Local Packages */}
                            {location.localPackages && location.localPackages.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Package className="w-4 h-4 mr-2 text-green-600" />
                                  Local Packages ({location.localPackages.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {location.localPackages.map((pkg: any) => (
                                    <div key={pkg.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900 text-sm">{pkg.name}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {pkg.hours} hrs / {pkg.kms} kms
                                      </p>
                                      <p className="text-xs text-gray-500">{pkg.category}</p>
                                      <p className="text-xs text-green-600 mt-1 font-medium">₹{pkg.basePrice}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* City Routes From */}
                            {location.routesFrom && location.routesFrom.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Route className="w-4 h-4 mr-2 text-orange-600" />
                                  City-to-City Routes From {location.locationName} ({location.routesFrom.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {location.routesFrom.map((route: any) => (
                                    <div key={route.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900 text-sm">To: {route.to}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {route.estimatedKm} km
                                      </p>
                                      <p className="text-xs text-gray-500">{route.category}</p>
                                      <p className="text-xs text-green-600 mt-1 font-medium">₹{route.basePrice}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Airport Routes From */}
                            {location.airportRoutesFrom && location.airportRoutesFrom.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Plane className="w-4 h-4 mr-2 text-indigo-600" />
                                  Airport Routes From {location.locationName} ({location.airportRoutesFrom.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {location.airportRoutesFrom.map((route: any) => (
                                    <div key={route.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900 text-sm flex items-center">
                                        <Plane className="w-3 h-3 mr-1" />
                                        To: {route.to}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {route.estimatedKm} km {route.toType === 'AIRPORT' ? '(Airport)' : ''}
                                      </p>
                                      <p className="text-xs text-gray-500">{route.category}</p>
                                      <p className="text-xs text-green-600 mt-1 font-medium">₹{route.basePrice}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Airport Routes To */}
                            {location.airportRoutesTo && location.airportRoutesTo.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <Plane className="w-4 h-4 mr-2 text-sky-600" />
                                  Airport Routes To {location.locationName} ({location.airportRoutesTo.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {location.airportRoutesTo.map((route: any) => (
                                    <div key={route.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900 text-sm flex items-center">
                                        <Plane className="w-3 h-3 mr-1" />
                                        From: {route.from}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {route.estimatedKm} km {route.fromType === 'AIRPORT' ? '(Airport)' : ''}
                                      </p>
                                      <p className="text-xs text-gray-500">{route.category}</p>
                                      <p className="text-xs text-green-600 mt-1 font-medium">₹{route.basePrice}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
