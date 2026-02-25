'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Car,
  User,
  Phone,
  Battery,
  Fuel,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  RefreshCcw,
  Maximize2,
  List,
  Grid,
  Play,
  Pause,
  History,
  Route,
  Zap,
  Signal,
  ThermometerSun,
  Gauge
} from 'lucide-react';

interface VehicleLocation {
  id: string;
  vehicle: {
    name: string;
    number: string;
    type: string;
  };
  driver: {
    name: string;
    phone: string;
  };
  location: {
    lat: number;
    lng: number;
    address: string;
    lastUpdated: string;
  };
  status: 'moving' | 'idle' | 'stopped' | 'offline';
  speed: number;
  heading: number;
  ignition: boolean;
  ac: boolean;
  fuel: number;
  battery: number;
  odometer: number;
  currentTrip?: {
    bookingId: string;
    customer: string;
    from: string;
    to: string;
    startTime: string;
  };
}

// Mock vehicle location data
const mockVehicles: VehicleLocation[] = [
  {
    id: 'V001',
    vehicle: { name: 'Toyota Innova', number: 'KA-01-AB-1234', type: 'SUV' },
    driver: { name: 'Ramesh Kumar', phone: '+91 9737965551' },
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'MG Road, Bangalore',
      lastUpdated: '2 min ago'
    },
    status: 'moving',
    speed: 42,
    heading: 135,
    ignition: true,
    ac: true,
    fuel: 68,
    battery: 95,
    odometer: 45678,
    currentTrip: {
      bookingId: 'BK-2024-0156',
      customer: 'Rahul Sharma',
      from: 'Koramangala',
      to: 'Airport',
      startTime: '10:30 AM'
    }
  },
  {
    id: 'V002',
    vehicle: { name: 'Maruti Swift', number: 'KA-01-CD-5678', type: 'Hatchback' },
    driver: { name: 'Suresh Babu', phone: '+91 9737965551' },
    location: {
      lat: 12.9352,
      lng: 77.6245,
      address: 'Koramangala 5th Block',
      lastUpdated: '1 min ago'
    },
    status: 'idle',
    speed: 0,
    heading: 0,
    ignition: true,
    ac: false,
    fuel: 45,
    battery: 88,
    odometer: 32456
  },
  {
    id: 'V003',
    vehicle: { name: 'Honda City', number: 'KA-01-EF-9012', type: 'Sedan' },
    driver: { name: 'Prakash Raj', phone: '+91 97379 65551' },
    location: {
      lat: 12.9698,
      lng: 77.7500,
      address: 'Whitefield ITPL',
      lastUpdated: '5 min ago'
    },
    status: 'stopped',
    speed: 0,
    heading: 270,
    ignition: false,
    ac: false,
    fuel: 82,
    battery: 76,
    odometer: 28945,
    currentTrip: {
      bookingId: 'BK-2024-0158',
      customer: 'Priya Menon',
      from: 'HSR Layout',
      to: 'Whitefield',
      startTime: '09:15 AM'
    }
  },
  {
    id: 'V004',
    vehicle: { name: 'Mahindra XUV500', number: 'KA-01-GH-3456', type: 'SUV' },
    driver: { name: 'Arun Nair', phone: '+91 97379 65551' },
    location: {
      lat: 12.8399,
      lng: 77.6770,
      address: 'Electronic City Phase 1',
      lastUpdated: '30 min ago'
    },
    status: 'offline',
    speed: 0,
    heading: 0,
    ignition: false,
    ac: false,
    fuel: 55,
    battery: 12,
    odometer: 56789
  },
  {
    id: 'V005',
    vehicle: { name: 'Toyota Fortuner', number: 'KA-01-IJ-7890', type: 'SUV' },
    driver: { name: 'Vijay Shetty', phone: '+91 97379 65551' },
    location: {
      lat: 12.9141,
      lng: 77.6411,
      address: 'Indiranagar 100ft Road',
      lastUpdated: 'Just now'
    },
    status: 'moving',
    speed: 28,
    heading: 45,
    ignition: true,
    ac: true,
    fuel: 91,
    battery: 100,
    odometer: 12345,
    currentTrip: {
      bookingId: 'BK-2024-0162',
      customer: 'Amit Patel',
      from: 'Indiranagar',
      to: 'Electronic City',
      startTime: '11:00 AM'
    }
  }
];

const statusConfig = {
  moving: { label: 'Moving', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-100' },
  idle: { label: 'Idle', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-100' },
  stopped: { label: 'Stopped', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-100' },
  offline: { label: 'Offline', color: 'bg-gray-500', textColor: 'text-gray-600', bgLight: 'bg-gray-100' }
};

export default function GPSTrackingPage() {
  const [vehicles] = useState<VehicleLocation[]>(mockVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicle.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === 'moving').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    stopped: vehicles.filter(v => v.status === 'stopped').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
    onTrip: vehicles.filter(v => v.currentTrip).length
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live GPS Tracking</h1>
            <p className="text-gray-600">Real-time vehicle location monitoring</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLiveUpdating(!isLiveUpdating)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isLiveUpdating ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
            >
              {isLiveUpdating ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isLiveUpdating ? 'Live' : 'Paused'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center cursor-pointer" onClick={() => setStatusFilter('moving')}>
            <p className="text-2xl font-bold text-green-600">{stats.moving}</p>
            <p className="text-xs text-green-600">Moving</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center cursor-pointer" onClick={() => setStatusFilter('idle')}>
            <p className="text-2xl font-bold text-yellow-600">{stats.idle}</p>
            <p className="text-xs text-yellow-600">Idle</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center cursor-pointer" onClick={() => setStatusFilter('stopped')}>
            <p className="text-2xl font-bold text-orange-600">{stats.stopped}</p>
            <p className="text-xs text-orange-600">Stopped</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 text-center cursor-pointer" onClick={() => setStatusFilter('offline')}>
            <p className="text-2xl font-bold text-gray-600">{stats.offline}</p>
            <p className="text-xs text-gray-600">Offline</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.onTrip}</p>
            <p className="text-xs text-blue-600">On Trip</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Vehicle List Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          {/* Search & Filter */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="+91 9737965551"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="moving">Moving</option>
              <option value="idle">Idle</option>
              <option value="stopped">Stopped</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto">
            {filteredVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${statusConfig[vehicle.status].color}`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{vehicle.vehicle.name}</p>
                      <p className="text-xs text-gray-500">{vehicle.vehicle.number}</p>
                    </div>
                  </div>
                  {vehicle.status === 'moving' && (
                    <span className="text-sm font-medium text-green-600">{vehicle.speed} km/h</span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{vehicle.location.address}</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-400">{vehicle.location.lastUpdated}</span>
                  {vehicle.currentTrip && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">On Trip</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-gray-100">
          {/* Placeholder Map */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">Map View</p>
              <p className="text-gray-400 text-sm">Integrate with Google Maps or Mappls API</p>
              <div className="mt-4 flex justify-center gap-2">
                {filteredVehicles.map(v => (
                  <div
                    key={v.id}
                    className={`w-4 h-4 rounded-full ${statusConfig[v.status].color} cursor-pointer`}
                    onClick={() => setSelectedVehicle(v)}
                    title={`${v.vehicle.number} - ${v.status}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-50">
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Selected Vehicle Info Card */}
          {selectedVehicle && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 max-w-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{selectedVehicle.vehicle.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[selectedVehicle.status].bgLight} ${statusConfig[selectedVehicle.status].textColor}`}>
                      {statusConfig[selectedVehicle.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selectedVehicle.vehicle.number}</p>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Driver Info */}
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedVehicle.driver.name}</p>
                  <p className="text-xs text-gray-500">{selectedVehicle.driver.phone}</p>
                </div>
                <button className="p-2 bg-green-100 rounded-full hover:bg-green-200">
                  <Phone className="w-4 h-4 text-green-600" />
                </button>
              </div>

              {/* Vehicle Stats */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Gauge className="w-4 h-4 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedVehicle.speed}</p>
                  <p className="text-xs text-gray-500">km/h</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Fuel className="w-4 h-4 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedVehicle.fuel}%</p>
                  <p className="text-xs text-gray-500">Fuel</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <Battery className="w-4 h-4 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedVehicle.battery}%</p>
                  <p className="text-xs text-gray-500">Battery</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <ThermometerSun className="w-4 h-4 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedVehicle.ac ? 'ON' : 'OFF'}</p>
                  <p className="text-xs text-gray-500">AC</p>
                </div>
              </div>

              {/* Current Trip */}
              {selectedVehicle.currentTrip && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600">Active Trip</span>
                    <span className="text-xs text-blue-600">{selectedVehicle.currentTrip.bookingId}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedVehicle.currentTrip.customer}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <span>{selectedVehicle.currentTrip.from}</span>
                    <Route className="w-3 h-3" />
                    <span>{selectedVehicle.currentTrip.to}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Started: {selectedVehicle.currentTrip.startTime}</p>
                </div>
              )}

              {/* Location */}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{selectedVehicle.location.address}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Last updated: {selectedVehicle.location.lastUpdated}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
