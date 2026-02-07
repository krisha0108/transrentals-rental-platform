'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';

interface Airport {
  id: string;
  name: string;
  code: string;
  slug: string;
  displayName: string;
  city: string;
  cityId: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
}

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  seatingCapacity: number;
}

interface AirportTransfer {
  id: string;
  vehicleCategoryId: string;
  fromLocationId: string;
  toLocationId: string;
  estimatedKm: number;
  estimatedDuration: string | null;
  basePrice: number;
  returnMultiplier: number;
  tollsEstimate: number | null;
  airportSurcharge: number | null;
  nightSurcharge: number | null;
  isActive: boolean;
  chauffeur_vehicle_categories: { id: string; name: string; slug: string };
  locations_chauffeur_route_packages_fromLocationIdTolocations: { id: string; name: string; slug: string; type: string };
  locations_chauffeur_route_packages_toLocationIdTolocations: { id: string; name: string; slug: string; type: string };
}

export default function AirportTransfersPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;

  const [airports, setAirports] = useState<Airport[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [transfers, setTransfers] = useState<AirportTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for bulk adding
  const [selectedAirport, setSelectedAirport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [transferType, setTransferType] = useState<'from_airport' | 'to_airport'>('from_airport');
  const [estimatedKm, setEstimatedKm] = useState(25);
  const [estimatedDuration, setEstimatedDuration] = useState('45 mins');

  // Pricing per category
  const [categoryPrices, setCategoryPrices] = useState<Record<string, {
    basePrice: number;
    tollsEstimate: number;
    airportSurcharge: number;
    nightSurcharge: number;
  }>>({});

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AirportTransfer>>({});

  // Filter for viewing existing transfers
  const [filterAirport, setFilterAirport] = useState('');

  // API base path based on service
  const apiBasePath = `/api/admin/services/${serviceSlug}`;

  useEffect(() => {
    fetchData();
  }, [serviceSlug]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch airports
      const airportsRes = await fetch('/api/airports');
      const airportsData = await airportsRes.json();
      if (airportsData.success) {
        setAirports(airportsData.airports);
      }

      // Fetch cities
      const citiesRes = await fetch('/api/locations?type=CITY');
      const citiesData = await citiesRes.json();
      if (citiesData.success) {
        setCities(citiesData.locations);
      }

      // Fetch vehicle categories for this service
      const categoriesRes = await fetch(`${apiBasePath}/vehicles`);
      const categoriesData = await categoriesRes.json();
      if (categoriesData.categories) {
        setVehicleCategories(categoriesData.categories);
        // Initialize pricing
        const initialPrices: Record<string, any> = {};
        categoriesData.categories.forEach((cat: VehicleCategory) => {
          initialPrices[cat.id] = {
            basePrice: 0,
            tollsEstimate: 0,
            airportSurcharge: 100,
            nightSurcharge: 200,
          };
        });
        setCategoryPrices(initialPrices);
      }

      // Fetch existing transfers
      await fetchTransfers();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransfers() {
    try {
      const res = await fetch('/api/admin/car-rental/airport-transfers');
      const data = await res.json();
      if (data.success) {
        setTransfers(data.transfers);
      }
    } catch (error) {
      console.error('Failed to fetch transfers:', error);
    }
  }

  async function handleBulkCreate() {
    if (!selectedAirport || !selectedCity) {
      alert('Please select both airport and city');
      return;
    }

    const hasAnyPrice = Object.values(categoryPrices).some(p => p.basePrice > 0);
    if (!hasAnyPrice) {
      alert('Please enter at least one vehicle category price');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const category of vehicleCategories) {
      const price = categoryPrices[category.id];
      if (price && price.basePrice > 0) {
        try {
          const fromId = transferType === 'from_airport' ? selectedAirport : selectedCity;
          const toId = transferType === 'from_airport' ? selectedCity : selectedAirport;

          const res = await fetch('/api/admin/car-rental/airport-transfers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleCategoryId: category.id,
              fromLocationId: fromId,
              toLocationId: toId,
              estimatedKm,
              estimatedDuration,
              basePrice: price.basePrice,
              returnMultiplier: 1.8,
              tollsEstimate: price.tollsEstimate,
              airportSurcharge: price.airportSurcharge,
              nightSurcharge: price.nightSurcharge,
              isActive: true,
            }),
          });

          const data = await res.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
    }

    setSaving(false);

    if (successCount > 0) {
      alert(`Created ${successCount} airport transfer package(s)`);
      await fetchTransfers();
      // Reset form
      setSelectedAirport('');
      setSelectedCity('');
      const resetPrices: Record<string, any> = {};
      vehicleCategories.forEach((cat) => {
        resetPrices[cat.id] = {
          basePrice: 0,
          tollsEstimate: 0,
          airportSurcharge: 100,
          nightSurcharge: 200,
        };
      });
      setCategoryPrices(resetPrices);
    }
    if (errorCount > 0) {
      alert(`Failed to create ${errorCount} package(s)`);
    }
  }

  async function handleUpdateTransfer(id: string) {
    if (!editForm.basePrice) {
      alert('Base price is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/car-rental/airport-transfers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (data.success) {
        alert('Transfer updated successfully');
        await fetchTransfers();
        setEditingId(null);
        setEditForm({});
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (error) {
      alert('Failed to update transfer');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTransfer(id: string) {
    if (!confirm('Are you sure you want to delete this transfer?')) return;

    try {
      const res = await fetch(`/api/admin/car-rental/airport-transfers/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        alert('Transfer deleted');
        await fetchTransfers();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      alert('Failed to delete transfer');
    }
  }

  function handleExport(exportFiltered = false) {
    const transfersToExport = exportFiltered ? filteredTransfers : transfers;

    if (transfersToExport.length === 0) {
      alert('No airport transfers to export');
      return;
    }

    // Create CSV headers
    const headers = [
      'From Location',
      'To Location',
      'Vehicle Category',
      'Estimated Km',
      'Estimated Duration',
      'Base Price',
      'Return Multiplier',
      'Toll Estimate',
      'Airport Surcharge',
      'Night Surcharge',
      'Is Active'
    ];

    // Convert transfers to CSV rows
    const rows = transfersToExport.map(transfer => {
      return [
        transfer.locations_chauffeur_route_packages_fromLocationIdTolocations.name,
        transfer.locations_chauffeur_route_packages_toLocationIdTolocations.name,
        transfer.chauffeur_vehicle_categories.name,
        transfer.estimatedKm,
        transfer.estimatedDuration || '',
        transfer.basePrice,
        transfer.returnMultiplier,
        transfer.tollsEstimate || 0,
        transfer.airportSurcharge || 0,
        transfer.nightSurcharge || 0,
        transfer.isActive
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    const suffix = exportFiltered ? 'filtered' : 'all';
    a.download = `${serviceSlug}-airport-transfers-${suffix}-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function startEditing(transfer: AirportTransfer) {
    setEditingId(transfer.id);
    setEditForm({
      estimatedKm: transfer.estimatedKm,
      estimatedDuration: transfer.estimatedDuration,
      basePrice: transfer.basePrice,
      returnMultiplier: transfer.returnMultiplier,
      tollsEstimate: transfer.tollsEstimate,
      airportSurcharge: transfer.airportSurcharge,
      nightSurcharge: transfer.nightSurcharge,
      isActive: transfer.isActive,
    });
  }

  // Filter transfers by selected airport
  const filteredTransfers = filterAirport
    ? transfers.filter(t =>
        t.fromLocationId === filterAirport || t.toLocationId === filterAirport
      )
    : transfers;

  // Group transfers by route (airport-city pair)
  const groupedTransfers: Record<string, AirportTransfer[]> = {};
  filteredTransfers.forEach(transfer => {
    const key = `${transfer.locations_chauffeur_route_packages_fromLocationIdTolocations.name} → ${transfer.locations_chauffeur_route_packages_toLocationIdTolocations.name}`;
    if (!groupedTransfers[key]) {
      groupedTransfers[key] = [];
    }
    groupedTransfers[key].push(transfer);
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/admin/services/${serviceSlug}`} className="text-blue-600 hover:underline text-sm mb-2 inline-block">
          ← Back to {serviceSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Airport Transfer Pricing</h1>
        <p className="text-gray-600 mt-1">
          Configure pickup/drop pricing between airports and cities for each vehicle category
        </p>
      </div>

      {/* Create New Transfer Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Airport Transfer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Transfer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value as 'from_airport' | 'to_airport')}
              className="w-full border rounded-lg p-2"
            >
              <option value="from_airport">Airport to City (Drop)</option>
              <option value="to_airport">City to Airport (Pickup)</option>
            </select>
          </div>

          {/* Airport Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Airport</label>
            <select
              value={selectedAirport}
              onChange={(e) => setSelectedAirport(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select Airport</option>
              {airports.map((airport) => (
                <option key={airport.id} value={airport.id}>
                  {airport.code} - {airport.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Distance (km)</label>
            <input
              type="number"
              value={estimatedKm}
              onChange={(e) => setEstimatedKm(Number(e.target.value))}
              className="w-full border rounded-lg p-2"
              min="1"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration</label>
          <input
            type="text"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            className="w-full max-w-xs border rounded-lg p-2"
            placeholder="e.g., 45 mins"
          />
        </div>

        {/* Vehicle Category Pricing Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price (INR)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tolls Est.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Airport Charge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Night Surcharge</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicleCategories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.seatingCapacity} seater</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={categoryPrices[category.id]?.basePrice || 0}
                      onChange={(e) => setCategoryPrices(prev => ({
                        ...prev,
                        [category.id]: { ...prev[category.id], basePrice: Number(e.target.value) }
                      }))}
                      className="w-28 border rounded p-1"
                      min="0"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={categoryPrices[category.id]?.tollsEstimate || 0}
                      onChange={(e) => setCategoryPrices(prev => ({
                        ...prev,
                        [category.id]: { ...prev[category.id], tollsEstimate: Number(e.target.value) }
                      }))}
                      className="w-24 border rounded p-1"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={categoryPrices[category.id]?.airportSurcharge || 0}
                      onChange={(e) => setCategoryPrices(prev => ({
                        ...prev,
                        [category.id]: { ...prev[category.id], airportSurcharge: Number(e.target.value) }
                      }))}
                      className="w-24 border rounded p-1"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={categoryPrices[category.id]?.nightSurcharge || 0}
                      onChange={(e) => setCategoryPrices(prev => ({
                        ...prev,
                        [category.id]: { ...prev[category.id], nightSurcharge: Number(e.target.value) }
                      }))}
                      className="w-24 border rounded p-1"
                      min="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleBulkCreate}
            disabled={saving || !selectedAirport || !selectedCity}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Create Transfer Packages'}
          </button>
        </div>
      </div>

      {/* Existing Transfers Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Existing Airport Transfers</h2>

          <div className="flex items-center gap-4">
            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport(false)}
                disabled={transfers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                title={transfers.length === 0 ? 'No transfers to export' : 'Export all airport transfers to CSV'}
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
              {filterAirport && filteredTransfers.length > 0 && filteredTransfers.length < transfers.length && (
                <button
                  onClick={() => handleExport(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm"
                  title={`Export ${filteredTransfers.length} filtered transfer(s)`}
                >
                  <Download className="w-4 h-4" />
                  Export Filtered ({filteredTransfers.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Filter by Airport:</label>
              <select
                value={filterAirport}
                onChange={(e) => setFilterAirport(e.target.value)}
                className="border rounded-lg p-2"
              >
                <option value="">All Airports</option>
                {airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>
                    {airport.code} - {airport.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {Object.keys(groupedTransfers).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No airport transfers configured yet. Add your first one above!
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransfers).map(([route, routeTransfers]) => (
              <div key={route} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 font-medium text-gray-900">
                  {route}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({routeTransfers[0]?.estimatedKm || 0} km, {routeTransfers[0]?.estimatedDuration || '-'})
                  </span>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tolls</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Airport</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Night</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {routeTransfers.map((transfer) => (
                      <tr key={transfer.id}>
                        {editingId === transfer.id ? (
                          <>
                            <td className="px-4 py-2 font-medium">{transfer.chauffeur_vehicle_categories.name}</td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={editForm.basePrice || 0}
                                onChange={(e) => setEditForm(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                                className="w-24 border rounded p-1"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={editForm.tollsEstimate || 0}
                                onChange={(e) => setEditForm(prev => ({ ...prev, tollsEstimate: Number(e.target.value) }))}
                                className="w-20 border rounded p-1"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={editForm.airportSurcharge || 0}
                                onChange={(e) => setEditForm(prev => ({ ...prev, airportSurcharge: Number(e.target.value) }))}
                                className="w-20 border rounded p-1"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={editForm.nightSurcharge || 0}
                                onChange={(e) => setEditForm(prev => ({ ...prev, nightSurcharge: Number(e.target.value) }))}
                                className="w-20 border rounded p-1"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={editForm.isActive ? 'active' : 'inactive'}
                                onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                                className="border rounded p-1"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateTransfer(transfer.id)}
                                  disabled={saving}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingId(null); setEditForm({}); }}
                                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2 font-medium">{transfer.chauffeur_vehicle_categories.name}</td>
                            <td className="px-4 py-2">₹{transfer.basePrice.toLocaleString()}</td>
                            <td className="px-4 py-2">₹{(transfer.tollsEstimate || 0).toLocaleString()}</td>
                            <td className="px-4 py-2">₹{(transfer.airportSurcharge || 0).toLocaleString()}</td>
                            <td className="px-4 py-2">₹{(transfer.nightSurcharge || 0).toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${transfer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {transfer.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditing(transfer)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTransfer(transfer.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>From Airport:</strong> Customer is picked up from airport and dropped to city location</li>
          <li>• <strong>To Airport:</strong> Customer is picked up from city and dropped at airport</li>
          <li>• <strong>Base Price:</strong> Fixed price for the transfer (one-way)</li>
          <li>• <strong>Airport Surcharge:</strong> Extra charges for airport parking/entry fees</li>
          <li>• <strong>Night Surcharge:</strong> Additional charge for transfers between 10 PM - 6 AM</li>
          <li>• Prices entered here will show when customers select airport transfers in booking form</li>
        </ul>
      </div>
    </div>
  );
}
