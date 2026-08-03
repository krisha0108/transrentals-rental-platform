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
import { useVendorVerification } from '@/contexts/VendorVerificationContext';

interface Location {
  id: string;
  name: string;
  slug: string;
  type: string;
  cities?: Location[]; // API returns 'cities' not 'children'
}

interface UnionTerritory {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export default function RequestLocationPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]); // States with cities
  const [unionTerritories, setUnionTerritories] = useState<UnionTerritory[]>([]); // UTs as direct locations
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
  const { hasAddress, openVerificationModal } = useVendorVerification();

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/vendor/locations');
      if (res.ok) {
        const data = await res.json();
        const allLocs = data.allLocations || [];

        // Separate states (with cities) and union territories (without cities)
        const states = allLocs.filter((loc: Location) => {
          const hasCities = (loc.cities || []).length > 0;
          return hasCities; // States and UTs with cities
        });

        const uts = allLocs.filter((loc: Location) => {
          const hasCities = (loc.cities || []).length > 0;
          return !hasCities && loc.type === 'UNION_TERRITORY'; // UTs without cities
        });

        setLocations(states);
        setUnionTerritories(uts);
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

  const selectAllUnionTerritories = () => {
    const availableUTs = unionTerritories.filter(
      (ut) => getLocationStatus(ut.id) === 'available'
    );
    const allSelected = availableUTs.every((ut) =>
      selectedLocations.includes(ut.id)
    );

    if (allSelected) {
      // Deselect all UTs
      setSelectedLocations((prev) =>
        prev.filter((id) => !availableUTs.map((ut) => ut.id).includes(id))
      );
    } else {
      // Select all available UTs
      setSelectedLocations((prev) => [
        ...prev.filter((id) => !availableUTs.map((ut) => ut.id).includes(id)),
        ...availableUTs.map((ut) => ut.id),
      ]);
    }
  };

  const selectAllLocations = () => {
    const allAvailableIds: string[] = [];

    // Collect all available cities from states
    locations.forEach((state) => {
      (state.cities || []).forEach((city) => {
        if (getLocationStatus(city.id) === 'available') {
          allAvailableIds.push(city.id);
        }
      });
    });

    // Collect all available union territories
    unionTerritories.forEach((ut) => {
      if (getLocationStatus(ut.id) === 'available') {
        allAvailableIds.push(ut.id);
      }
    });

    setSelectedLocations(allAvailableIds);
  };

  const clearAllSelections = () => {
    setSelectedLocations([]);
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

  const filteredUnionTerritories = search
    ? unionTerritories.filter((ut) =>
        ut.name.toLowerCase().includes(search.toLowerCase())
      )
    : unionTerritories;

  // Get selected location names for display
  const getSelectedLocationNames = () => {
    const names: string[] = [];
    // Add selected cities from states
    locations.forEach((state) => {
      (state.cities || []).forEach((city) => {
        if (selectedLocations.includes(city.id)) {
          names.push(`${city.name}, ${state.name}`);
        }
      });
    });
    // Add selected union territories
    unionTerritories.forEach((ut) => {
      if (selectedLocations.includes(ut.id)) {
        names.push(`${ut.name} (UT)`);
      }
    });
    return names;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.08); }
          70% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes bubble-rise-1 {
          0% { opacity: 0.4; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
        }
        @keyframes bubble-rise-2 {
          0% { opacity: 0.3; transform: translateY(0) scale(0.8); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.3); }
        }
        @keyframes bubble-drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glow-emerald {
          0%, 100% { box-shadow: 0 0 8px rgba(5,150,105,0.2); }
          50% { box-shadow: 0 0 20px rgba(5,150,105,0.4); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        .animate-fade-up {
          animation: fade-up 0.5s ease-out both;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out both;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out both;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out both;
        }
        .location-card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .location-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(5,150,105,0.15), 0 0 0 1px rgba(5,150,105,0.1);
        }
        .location-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(5,150,105,0.06) 50%, transparent 100%);
          transform: translateX(-100%);
          pointer-events: none;
          transition: none;
        }
        .location-card:hover::after {
          animation: shimmer-sweep 0.8s ease-out;
        }
        .state-card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .state-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px -3px rgba(5,150,105,0.12);
        }
        .state-icon {
          transition: all 0.3s ease;
        }
        .state-card:hover .state-icon {
          transform: rotate(12deg) scale(1.1);
        }
      `}</style>

      <div className="w-full space-y-5">
        {/* Header - Animated Emerald Gradient */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #059669, #10b981, #047857, #059669)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 8s ease infinite',
          }}
        >
          {/* Filled floating bubbles (right side) */}
          <div className="absolute right-8 top-3 w-10 h-10 rounded-full bg-white/10" style={{ animation: 'float-slow 4s ease-in-out infinite' }} />
          <div className="absolute right-24 top-6 w-6 h-6 rounded-full bg-white/10" style={{ animation: 'float-rev 3.5s ease-in-out infinite' }} />
          <div className="absolute right-16 bottom-2 w-8 h-8 rounded-full bg-white/5" style={{ animation: 'float-slow 5s ease-in-out infinite' }} />

          {/* Sparkle dots */}
          <div className="absolute right-12 top-5 w-1.5 h-1.5 rounded-full bg-white/60" style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
          <div className="absolute right-32 top-8 w-1 h-1 rounded-full bg-white/50" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.5s' }} />
          <div className="absolute right-20 bottom-4 w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: 'sparkle 3s ease-in-out infinite 1s' }} />

          {/* Rising bubbles */}
          <div className="absolute right-14 bottom-0 w-3 h-3 rounded-full bg-white/15" style={{ animation: 'bubble-rise-1 3s ease-out infinite' }} />
          <div className="absolute right-28 bottom-0 w-2 h-2 rounded-full bg-white/10" style={{ animation: 'bubble-rise-2 4s ease-out infinite 1s' }} />

          {/* Shimmer sweep */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer-sweep 4s ease-in-out infinite' }} />
          </div>

          <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <div className="animate-slide-in-left" style={{ animationDelay: '0.15s' }}>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">Request Locations</h1>
              <p className="text-xs sm:text-sm text-emerald-100/80">Select cities where you want to operate</p>
            </div>

            {selectedLocations.length > 0 && (
              <div className="ml-auto hidden md:block">
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg shadow-emerald-900/20 font-semibold text-sm rounded-xl active:scale-[0.98] transition-all duration-200"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Request Selected ({selectedLocations.length})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search & Selection Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search states or cities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={selectAllLocations}
              className="whitespace-nowrap rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 text-sm"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Select All
            </Button>
            <Button
              variant="outline"
              onClick={clearAllSelections}
              className="whitespace-nowrap rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm"
            >
              <Square className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
          {selectedLocations.length > 0 && (
            <div className="flex items-center justify-between bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 font-medium text-sm">
                {selectedLocations.length} location(s) selected
              </span>
              <button
                onClick={() => setSelectedLocations([])}
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Locations List */}
        {loading ? (
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-3 w-24 bg-gray-50 rounded-lg animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLocations.length === 0 && filteredUnionTerritories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-scale-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-base font-medium text-gray-600">No locations found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLocations.map((state, stateIndex) => {
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

              const shouldAnimateState = stateIndex < 20;

              return (
                <div
                  key={state.id}
                  className={`state-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${shouldAnimateState ? 'animate-fade-up' : ''}`}
                  style={shouldAnimateState ? { animationDelay: `${0.15 + stateIndex * 0.04}s` } : undefined}
                >
                  {/* State Header */}
                  <div
                    className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50/40 transition-colors duration-200"
                    onClick={() => toggleExpand(state.id)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="state-icon w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200/50">
                        <MapPin className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">
                          {state.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {cities.length} cities
                          {selectedCitiesCount > 0 && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              ({selectedCitiesCount} selected)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {availableCities.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllCities(state);
                          }}
                          className="rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-xs transition-all duration-200"
                        >
                          {allCitiesSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-emerald-500 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                      )}
                    </div>
                  </div>

                  {/* Cities */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-3 sm:p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {cities
                          .filter(
                            (city) =>
                              !search ||
                              city.name.toLowerCase().includes(search.toLowerCase()) ||
                              state.name.toLowerCase().includes(search.toLowerCase())
                          )
                          .map((city, cityIndex) => {
                            const status = getLocationStatus(city.id);
                            const isSelected = selectedLocations.includes(city.id);
                            const shouldAnimateCity = cityIndex < 20;

                            return (
                              <div
                                key={city.id}
                                onClick={() => toggleLocationSelection(city.id)}
                                className={`location-card p-3 rounded-xl border-2 transition-all duration-200 ${
                                  status === 'approved'
                                    ? 'bg-emerald-50/60 border-emerald-200 cursor-not-allowed'
                                    : status === 'pending'
                                    ? 'bg-amber-50/60 border-amber-200 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-emerald-50 border-emerald-500 cursor-pointer shadow-sm shadow-emerald-100'
                                    : 'bg-white border-gray-200 hover:border-emerald-300 cursor-pointer'
                                } ${shouldAnimateCity ? 'animate-fade-up' : ''}`}
                                style={shouldAnimateCity ? { animationDelay: `${cityIndex * 0.03}s` } : undefined}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className="mt-0.5">
                                    {status === 'approved' ? (
                                      <div className="relative">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                      </div>
                                    ) : status === 'pending' ? (
                                      <div className="relative">
                                        <Clock className="w-5 h-5 text-amber-500" />
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                      </div>
                                    ) : isSelected ? (
                                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 text-sm truncate">
                                      {city.name}
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {status === 'approved' ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-600">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                          Active
                                        </span>
                                      ) : status === 'pending' ? (
                                        <span className="inline-flex items-center gap-1 text-amber-600">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                          Pending
                                        </span>
                                      ) : 'Click to select'}
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

            {/* Union Territories Section */}
            {filteredUnionTerritories.length > 0 && (
              <div className="state-card bg-white rounded-2xl shadow-sm border-2 border-emerald-200 overflow-hidden animate-fade-up" style={{ animationDelay: '0.3s' }}>
                {/* Union Territory Header */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="state-icon w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200/50">
                        <MapPin className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">
                          Union Territories
                        </h3>
                        <p className="text-xs text-gray-500">
                          {filteredUnionTerritories.length} locations
                          {filteredUnionTerritories.filter(ut => selectedLocations.includes(ut.id)).length > 0 && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              ({filteredUnionTerritories.filter(ut => selectedLocations.includes(ut.id)).length} selected)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {filteredUnionTerritories.filter(ut => getLocationStatus(ut.id) === 'available').length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllUnionTerritories}
                        className="bg-white hover:bg-emerald-50 rounded-lg border-emerald-200 text-emerald-700 hover:border-emerald-300 text-xs transition-all duration-200"
                      >
                        {filteredUnionTerritories
                          .filter(ut => getLocationStatus(ut.id) === 'available')
                          .every(ut => selectedLocations.includes(ut.id))
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Union Territories Grid */}
                <div className="bg-white/80 p-3 sm:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {filteredUnionTerritories.map((ut, utIndex) => {
                      const status = getLocationStatus(ut.id);
                      const isSelected = selectedLocations.includes(ut.id);
                      const shouldAnimateUT = utIndex < 20;

                      return (
                        <div
                          key={ut.id}
                          onClick={() => toggleLocationSelection(ut.id)}
                          className={`location-card p-3 rounded-xl border-2 transition-all duration-200 ${
                            status === 'approved'
                              ? 'bg-emerald-50/60 border-emerald-200 cursor-not-allowed'
                              : status === 'pending'
                              ? 'bg-amber-50/60 border-amber-200 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-50 border-emerald-500 cursor-pointer shadow-sm shadow-emerald-100'
                              : 'bg-white border-gray-200 hover:border-emerald-300 cursor-pointer'
                          } ${shouldAnimateUT ? 'animate-fade-up' : ''}`}
                          style={shouldAnimateUT ? { animationDelay: `${utIndex * 0.03}s` } : undefined}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {status === 'approved' ? (
                                <div className="relative">
                                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                </div>
                              ) : status === 'pending' ? (
                                <div className="relative">
                                  <Clock className="w-5 h-5 text-amber-500" />
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                </div>
                              ) : isSelected ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm truncate">
                                {ut.name}
                              </h4>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {status === 'approved' ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                    Active
                                  </span>
                                ) : status === 'pending' ? (
                                  <span className="inline-flex items-center gap-1 text-amber-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                                    Pending
                                  </span>
                                ) : 'Click to select'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button for Mobile */}
        {selectedLocations.length > 0 && (
          <div className="fixed bottom-6 right-6 md:hidden z-40">
            <Button
              size="lg"
              onClick={() => setShowConfirmModal(true)}
              className="rounded-2xl shadow-lg shadow-emerald-200/60 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200"
              style={{ animation: 'glow-emerald 2s ease-in-out infinite' }}
            >
              <Send className="w-5 h-5 mr-2" />
              Request ({selectedLocations.length})
            </Button>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Request {selectedLocations.length} Location(s)
              </h2>

              {/* Selected Locations List */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Locations:
                </label>
                <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto border border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {getSelectedLocationNames().map((name, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium"
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-sm"
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    className="rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={hasAddress ? handleBulkRequest : openVerificationModal}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200/50 active:scale-[0.98] transition-all duration-200 rounded-xl"
                  >
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
    </div>
  );
}
