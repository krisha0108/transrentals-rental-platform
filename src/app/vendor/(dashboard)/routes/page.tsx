'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Fuel,
  IndianRupee,
  Car,
  Users,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Route,
  Target,
  Zap,
  Save,
  Share2,
  Trash2,
  Edit,
  Copy,
  ChevronRight,
  ArrowRight,
  Star,
  History
} from 'lucide-react';

interface RouteStop {
  id: string;
  name: string;
  address: string;
  type: 'pickup' | 'dropoff' | 'waypoint';
  arrivalTime?: string;
  departureTime?: string;
  status: 'pending' | 'arrived' | 'completed' | 'skipped';
  notes?: string;
}

interface PlannedRoute {
  id: string;
  name: string;
  vehicle: string;
  vehicleNumber: string;
  driver: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  stops: RouteStop[];
  totalDistance: number;
  estimatedTime: number;
  fuelCost: number;
  tollCost: number;
  optimized: boolean;
  createdAt: string;
}

// Mock saved routes
const mockRoutes: PlannedRoute[] = [
  {
    id: 'RT001',
    name: 'Airport Shuttle - Morning',
    vehicle: 'Toyota Innova',
    vehicleNumber: 'KA-01-AB-1234',
    driver: 'Ramesh Kumar',
    date: '2024-01-20',
    status: 'planned',
    stops: [
      { id: 'S1', name: 'Office - Koramangala', address: '5th Block, Koramangala', type: 'pickup', arrivalTime: '05:00', departureTime: '05:15', status: 'pending' },
      { id: 'S2', name: 'HSR Pickup', address: 'HSR Layout Sector 2', type: 'pickup', arrivalTime: '05:30', departureTime: '05:40', status: 'pending' },
      { id: 'S3', name: 'Whitefield Pickup', address: 'EPIP Zone, Whitefield', type: 'pickup', arrivalTime: '06:15', departureTime: '06:25', status: 'pending' },
      { id: 'S4', name: 'Kempegowda Airport', address: 'Devanahalli', type: 'dropoff', arrivalTime: '07:00', status: 'pending' }
    ],
    totalDistance: 52,
    estimatedTime: 120,
    fuelCost: 520,
    tollCost: 150,
    optimized: true,
    createdAt: '2024-01-18'
  },
  {
    id: 'RT002',
    name: 'Corporate Transfer - TechPark',
    vehicle: 'Maruti Ertiga',
    vehicleNumber: 'KA-01-CD-5678',
    driver: 'Suresh Babu',
    date: '2024-01-20',
    status: 'in_progress',
    stops: [
      { id: 'S1', name: 'Residency Road', address: 'Residency Road', type: 'pickup', arrivalTime: '09:00', departureTime: '09:10', status: 'completed' },
      { id: 'S2', name: 'Embassy Tech Village', address: 'Outer Ring Road', type: 'dropoff', arrivalTime: '09:45', status: 'arrived' }
    ],
    totalDistance: 18,
    estimatedTime: 45,
    fuelCost: 180,
    tollCost: 0,
    optimized: true,
    createdAt: '2024-01-19'
  },
  {
    id: 'RT003',
    name: 'Weekend Outstation - Mysore',
    vehicle: 'Honda City',
    vehicleNumber: 'KA-01-EF-9012',
    driver: 'Prakash Raj',
    date: '2024-01-21',
    status: 'planned',
    stops: [
      { id: 'S1', name: 'MG Road', address: 'MG Road Metro Station', type: 'pickup', arrivalTime: '06:00', departureTime: '06:15', status: 'pending' },
      { id: 'S2', name: 'Mysore Palace', address: 'Mysore Palace, Mysore', type: 'waypoint', arrivalTime: '09:30', departureTime: '11:00', status: 'pending' },
      { id: 'S3', name: 'Chamundi Hills', address: 'Chamundi Hills, Mysore', type: 'waypoint', arrivalTime: '11:30', departureTime: '13:00', status: 'pending' },
      { id: 'S4', name: 'MG Road', address: 'MG Road Metro Station', type: 'dropoff', arrivalTime: '17:00', status: 'pending' }
    ],
    totalDistance: 300,
    estimatedTime: 480,
    fuelCost: 2400,
    tollCost: 200,
    optimized: false,
    createdAt: '2024-01-15'
  }
];

// Mock popular routes
const popularRoutes = [
  { from: 'Koramangala', to: 'Airport', distance: 42, time: 75, uses: 156 },
  { from: 'Whitefield', to: 'Electronic City', distance: 28, time: 55, uses: 89 },
  { from: 'HSR Layout', to: 'MG Road', distance: 12, time: 35, uses: 234 },
  { from: 'Indiranagar', to: 'Manyata Tech Park', distance: 15, time: 40, uses: 178 }
];

const statusConfig = {
  planned: { label: 'Planned', color: 'bg-blue-100 text-blue-700', icon: Target },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function RoutePlannerPage() {
  const [routes] = useState<PlannedRoute[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<PlannedRoute | null>(null);
  const [showNewRouteModal, setShowNewRouteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'templates'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New route planner state
  const [newRoute, setNewRoute] = useState<{
    stops: { id: string; name: string; address: string; type: 'pickup' | 'dropoff' | 'waypoint' }[];
  }>({
    stops: [
      { id: '1', name: '', address: '', type: 'pickup' },
      { id: '2', name: '', address: '', type: 'dropoff' }
    ]
  });

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.driver.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'today') {
      return matchesSearch && route.date === '2024-01-20';
    } else if (activeTab === 'upcoming') {
      return matchesSearch && route.date > '2024-01-20';
    }
    return matchesSearch;
  });

  const addStop = () => {
    setNewRoute(prev => ({
      ...prev,
      stops: [
        ...prev.stops.slice(0, -1),
        { id: Date.now().toString(), name: '', address: '', type: 'waypoint' as const },
        prev.stops[prev.stops.length - 1]
      ]
    }));
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Planner</h1>
          <p className="text-gray-600 mt-1">Plan optimized routes for efficient trips</p>
        </div>

        <button
          onClick={() => setShowNewRouteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Plan New Route
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Route className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
              <p className="text-sm text-gray-500">Total Routes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{routes.filter(r => r.optimized).length}</p>
              <p className="text-sm text-gray-500">Optimized</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Fuel className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{routes.reduce((sum, r) => sum + r.fuelCost, 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Est. Fuel Cost</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Navigation className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{routes.reduce((sum, r) => sum + r.totalDistance, 0)} km</p>
              <p className="text-sm text-gray-500">Total Distance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routes List */}
        <div className="lg:col-span-2">
          {/* Tabs & Search */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search routes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  {(['all', 'today', 'upcoming', 'templates'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Routes */}
            <div className="divide-y divide-gray-100">
              {filteredRoutes.map(route => {
                const StatusIcon = statusConfig[route.status].icon;
                return (
                  <div
                    key={route.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedRoute?.id === route.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedRoute(route)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          route.status === 'in_progress' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          <Route className={`w-5 h-5 ${
                            route.status === 'in_progress' ? 'text-yellow-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{route.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <Car className="w-4 h-4" />
                            <span>{route.vehicle}</span>
                            <span>•</span>
                            <Users className="w-4 h-4" />
                            <span>{route.driver}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[route.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[route.status].label}
                      </span>
                    </div>

                    {/* Route Preview */}
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <span className="truncate max-w-[120px]">{route.stops[0].name}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      {route.stops.length > 2 && (
                        <>
                          <span className="text-gray-400">+{route.stops.length - 2}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </>
                      )}
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="truncate max-w-[120px]">{route.stops[route.stops.length - 1].name}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Navigation className="w-4 h-4" />
                        <span>{route.totalDistance} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(route.estimatedTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        <span>₹{route.fuelCost}</span>
                      </div>
                      {route.optimized && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Zap className="w-4 h-4" />
                          <span>Optimized</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Popular Routes & Details */}
        <div className="space-y-6">
          {/* Selected Route Details */}
          {selectedRoute ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Route Details</h3>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedRoute.name}</h4>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Car className="w-4 h-4" />
                  <span>{selectedRoute.vehicle} ({selectedRoute.vehicleNumber})</span>
                </div>

                {/* Stops Timeline */}
                <div className="space-y-3 mb-4">
                  {selectedRoute.stops.map((stop, index) => (
                    <div key={stop.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          stop.status === 'completed' ? 'bg-green-500' :
                          stop.status === 'arrived' ? 'bg-yellow-500' :
                          stop.type === 'pickup' ? 'bg-green-500' :
                          stop.type === 'dropoff' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        {index < selectedRoute.stops.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-sm font-medium text-gray-900">{stop.name}</p>
                        <p className="text-xs text-gray-500">{stop.address}</p>
                        {stop.arrivalTime && (
                          <p className="text-xs text-gray-400 mt-1">
                            ETA: {stop.arrivalTime}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Route Stats */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-medium text-gray-900">{selectedRoute.totalDistance} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{formatTime(selectedRoute.estimatedTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fuel Cost</p>
                    <p className="font-medium text-gray-900">₹{selectedRoute.fuelCost}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Toll Cost</p>
                    <p className="font-medium text-gray-900">₹{selectedRoute.tollCost}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a route to view details</p>
            </div>
          )}

          {/* Popular Routes */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Popular Routes</h3>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {popularRoutes.map((route, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{route.from}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{route.to}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{route.distance} km</span>
                    <span>{route.time} min</span>
                    <span className="text-blue-600">{route.uses} trips</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Optimization Tips</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Group nearby pickups to reduce distance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Avoid peak hours (8-10 AM, 5-8 PM)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use ORR for East-West routes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* New Route Modal */}
      {showNewRouteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Plan New Route</h2>
                <button
                  onClick={() => setShowNewRouteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Route Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                <input
                  type="text"
                  placeholder="e.g., Airport Shuttle - Morning"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Vehicle & Driver */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Select Vehicle</option>
                    <option>Toyota Innova - KA-01-AB-1234</option>
                    <option>Maruti Ertiga - KA-01-CD-5678</option>
                    <option>Honda City - KA-01-EF-9012</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Select Driver</option>
                    <option>Ramesh Kumar</option>
                    <option>Suresh Babu</option>
                    <option>Prakash Raj</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Stops */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Route Stops</label>
                <div className="space-y-3">
                  {newRoute.stops.map((stop, index) => (
                    <div key={stop.id} className="flex gap-3">
                      <div className="flex flex-col items-center pt-3">
                        <div className={`w-3 h-3 rounded-full ${
                          stop.type === 'pickup' ? 'bg-green-500' :
                          stop.type === 'dropoff' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        {index < newRoute.stops.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            stop.type === 'pickup' ? 'bg-green-100 text-green-700' :
                            stop.type === 'dropoff' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {stop.type === 'pickup' ? 'Pickup' : stop.type === 'dropoff' ? 'Drop-off' : 'Waypoint'}
                          </span>
                          {stop.type === 'waypoint' && (
                            <button className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Location name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                        />
                        <input
                          type="text"
                          placeholder="Full address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addStop}
                  className="flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Waypoint
                </button>
              </div>

              {/* Optimization Options */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Optimize Route</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Automatically reorder stops for shortest distance and time
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewRouteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                  <Save className="w-4 h-4" />
                  Save as Template
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Navigation className="w-4 h-4" />
                  Create Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
