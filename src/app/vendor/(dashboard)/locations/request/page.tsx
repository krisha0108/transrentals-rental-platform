'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  CheckCircle,
  Clock,
  Search,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  Square,
  CheckSquare,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  id: string;
  name: string;
  slug: string;
  type: string;
  cities?: Location[]; // API returns 'cities' not 'children'
}

export default function RequestLocationPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [approvedLocationIds, setApprovedLocationIds] = useState<string[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedStates, setExpandedStates] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState('');
  const [localAddress, setLocalAddress] = useState('');

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/vendor/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data.allLocations || []);
        setApprovedLocationIds(data.approvedLocationIds || []);
        setPendingRequestIds(
          (data.requests || [])
            .filter((r: any) => r.status === 'PENDING')
            .map((r: any) => r.locationId)
        );
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const toggleExpand = (stateId: string) => {
    setExpandedStates((prev) =>
      prev.includes(stateId)
        ? prev.filter((id) => id !== stateId)
        : [...prev, stateId]
    );
  };

  const getLocationStatus = (locationId: string) => {
    if (approvedLocationIds.includes(locationId)) return 'approved';
    if (pendingRequestIds.includes(locationId)) return 'pending';
    return 'available';
  };

  const toggleLocationSelection = (locationId: string) => {
    const status = getLocationStatus(locationId);
    if (status !== 'available') return;

    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  const selectAllCities = (state: Location) => {
    const cities = state.cities || [];
    const availableCities = cities.filter(
      (city) => getLocationStatus(city.id) === 'available'
    );
    const allSelected = availableCities.every((city) =>
      selectedLocations.includes(city.id)
    );

    if (allSelected) {
      // Deselect all
      setSelectedLocations((prev) =>
        prev.filter((id) => !availableCities.map((c) => c.id).includes(id))
      );
    } else {
      // Select all available
      setSelectedLocations((prev) => [
        ...prev.filter((id) => !availableCities.map((c) => c.id).includes(id)),
        ...availableCities.map((c) => c.id),
      ]);
    }
  };

  const handleBulkRequest = async () => {
    if (selectedLocations.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/locations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationIds: selectedLocations,
          message,
          localAddress,
        }),
      });

      if (res.ok) {
        alert(`Successfully requested ${selectedLocations.length} location(s)!`);
        setSelectedLocations([]);
        setShowConfirmModal(false);
        setMessage('');
        setLocalAddress('');
        router.push('/vendor/locations');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit requests');
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert('Failed to submit requests');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLocations = search
    ? locations.filter(
        (state) =>
          state.name.toLowerCase().includes(search.toLowerCase()) ||
          (state.cities || []).some((city) =>
            city.name.toLowerCase().includes(search.toLowerCase())
          )
      )
    : locations;

  // Get selected location names for display
  const getSelectedLocationNames = () => {
    const names: string[] = [];
    locations.forEach((state) => {
      (state.cities || []).forEach((city) => {
        if (selectedLocations.includes(city.id)) {
          names.push(`${city.name}, ${state.name}`);
        }
      });
    });
    return names;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request Locations</h1>
            <p className="text-gray-600">Select cities where you want to operate</p>
          </div>
        </div>
        {selectedLocations.length > 0 && (
          <Button onClick={() => setShowConfirmModal(true)}>
            <Send className="w-4 h-4 mr-2" />
            Request Selected ({selectedLocations.length})
          </Button>
        )}
      </div>

      {/* Search & Selection Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search states or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {selectedLocations.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-700 font-medium">
              {selectedLocations.length} location(s) selected
            </span>
            <button
              onClick={() => setSelectedLocations([])}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLocations.map((state) => {
            const isExpanded = expandedStates.includes(state.id);
            const cities = state.cities || [];
            const availableCities = cities.filter(
              (city) => getLocationStatus(city.id) === 'available'
            );
            const selectedCitiesCount = cities.filter((city) =>
              selectedLocations.includes(city.id)
            ).length;
            const allCitiesSelected =
              availableCities.length > 0 &&
              availableCities.every((city) => selectedLocations.includes(city.id));

            return (
              <div
                key={state.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* State Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(state.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {state.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {cities.length} cities
                        {selectedCitiesCount > 0 && (
                          <span className="ml-2 text-blue-600">
                            ({selectedCitiesCount} selected)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {availableCities.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllCities(state);
                        }}
                      >
                        {allCitiesSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Cities */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cities
                        .filter(
                          (city) =>
                            !search ||
                            city.name.toLowerCase().includes(search.toLowerCase()) ||
                            state.name.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((city) => {
                          const status = getLocationStatus(city.id);
                          const isSelected = selectedLocations.includes(city.id);

                          return (
                            <div
                              key={city.id}
                              onClick={() => toggleLocationSelection(city.id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                status === 'approved'
                                  ? 'bg-green-50 border-green-200 cursor-not-allowed'
                                  : status === 'pending'
                                  ? 'bg-yellow-50 border-yellow-200 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-blue-50 border-blue-500 cursor-pointer'
                                  : 'bg-white border-gray-200 hover:border-blue-300 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {status === 'approved' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : status === 'pending' ? (
                                    <Clock className="w-5 h-5 text-yellow-500" />
                                  ) : isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-blue-500" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">
                                    {city.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {status === 'approved'
                                      ? 'Already approved'
                                      : status === 'pending'
                                      ? 'Request pending'
                                      : 'Click to select'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      {selectedLocations.length > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            size="lg"
            onClick={() => setShowConfirmModal(true)}
            className="rounded-full shadow-lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Request ({selectedLocations.length})
          </Button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Request {selectedLocations.length} Location(s)
            </h2>

            {/* Selected Locations List */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Locations:
              </label>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {getSelectedLocationNames().map((name, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to operate in these locations? (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your business presence..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local Address (Optional)
                </label>
                <textarea
                  value={localAddress}
                  onChange={(e) => setLocalAddress(e.target.value)}
                  placeholder="Your local office/yard address in these locations..."
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleBulkRequest} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
