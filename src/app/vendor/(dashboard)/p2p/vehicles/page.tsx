'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Search,
  Filter,
  Star,
  Phone,
  MessageSquare,
  CheckCircle,
  Truck,
  Bus,
  Bike,
  User,
  Plus,
} from 'lucide-react';

// Mock Available Vehicles
const mockAvailableVehicles = [
  {
    id: '1',
    vendorId: 'v1',
    vendorName: 'Krishna Travels',
    vendorRating: 4.7,
    vendorTrips: 234,
    vendorPhone: '+91 9737965551',
    vehicleType: 'Tempo Traveller',
    vehicle_models: 'Force Traveller 12-Seater',
    registrationNumber: 'MH04XX1234',
    vehicleYear: 2022,
    features: ['AC', 'Pushback Seats', 'Music System'],
    route: {
      from: 'Pune',
      to: 'Mumbai',
      distance: 150,
    },
    availableDate: '2024-02-15',
    availableTime: '14:00',
    expectedArrival: '17:00',
    price: 3500,
    driverIncluded: true,
    fuelIncluded: false,
    status: 'available',
    postedAt: '2024-02-13T10:30:00',
  },
  {
    id: '2',
    vendorId: 'v2',
    vendorName: 'Sharma Transport',
    vendorRating: 4.5,
    vendorTrips: 156,
    vendorPhone: '+91 9737965551',
    vehicleType: 'Mini Truck',
    vehicle_models: 'Tata Ace Gold',
    registrationNumber: 'MH12YY5678',
    vehicleYear: 2023,
    features: ['GPS Tracking', 'Covered Body'],
    route: {
      from: 'Nashik',
      to: 'Mumbai',
      distance: 180,
    },
    availableDate: '2024-02-16',
    availableTime: '09:00',
    expectedArrival: '13:00',
    price: 2500,
    driverIncluded: true,
    fuelIncluded: true,
    status: 'available',
    postedAt: '2024-02-13T08:00:00',
  },
  {
    id: '3',
    vendorId: 'v3',
    vendorName: 'Royal Cars',
    vendorRating: 4.8,
    vendorTrips: 312,
    vendorPhone: '+91 98765 43212',
    vehicleType: 'Sedan',
    vehicle_models: 'Honda City ZX',
    registrationNumber: 'MH02ZZ9012',
    vehicleYear: 2023,
    features: ['AC', 'Leather Seats', 'Sunroof'],
    route: {
      from: 'Mumbai',
      to: 'Lonavala',
      distance: 85,
    },
    availableDate: '2024-02-15',
    availableTime: '18:00',
    expectedArrival: '20:00',
    price: 1500,
    driverIncluded: true,
    fuelIncluded: false,
    status: 'available',
    postedAt: '2024-02-12T16:00:00',
  },
  {
    id: '4',
    vendorId: 'v4',
    vendorName: 'Express Movers',
    vendorRating: 4.4,
    vendorTrips: 89,
    vendorPhone: '+91 98765 43213',
    vehicleType: 'Truck',
    vehicle_models: 'Tata 407 14ft',
    registrationNumber: 'MH14AA3456',
    vehicleYear: 2021,
    features: ['Covered Body', 'Hydraulic Lift'],
    route: {
      from: 'Pune',
      to: 'Kolhapur',
      distance: 230,
    },
    availableDate: '2024-02-17',
    availableTime: '06:00',
    expectedArrival: '11:00',
    price: 4500,
    driverIncluded: true,
    fuelIncluded: false,
    status: 'available',
    postedAt: '2024-02-13T14:00:00',
  },
  {
    id: '5',
    vendorId: 'v5',
    vendorName: 'City Tours',
    vendorRating: 4.9,
    vendorTrips: 456,
    vendorPhone: '+91 98765 43214',
    vehicleType: 'Bus',
    vehicle_models: 'Volvo B7R 45-Seater',
    registrationNumber: 'MH01BB7890',
    vehicleYear: 2022,
    features: ['AC', 'Pushback Seats', 'TV', 'Toilet'],
    route: {
      from: 'Mumbai',
      to: 'Shirdi',
      distance: 250,
    },
    availableDate: '2024-02-18',
    availableTime: '15:00',
    expectedArrival: '20:00',
    price: 12000,
    driverIncluded: true,
    fuelIncluded: true,
    status: 'available',
    postedAt: '2024-02-13T09:00:00',
  },
];

const vehicleTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Sedan': Car,
  'SUV': Car,
  'Tempo Traveller': Bus,
  'Mini Truck': Truck,
  'Truck': Truck,
  'Bus': Bus,
  'Bike': Bike,
};

export default function BrowseVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof mockAvailableVehicles[0] | null>(null);

  const filteredVehicles = mockAvailableVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicle_models.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFrom = !filterFrom || vehicle.route.from.toLowerCase().includes(filterFrom.toLowerCase());
    const matchesTo = !filterTo || vehicle.route.to.toLowerCase().includes(filterTo.toLowerCase());
    const matchesType = filterType === 'all' || vehicle.vehicleType === filterType;
    return matchesSearch && matchesFrom && matchesTo && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const VehicleIcon = (type: string) => {
    const Icon = vehicleTypeIcons[type] || Car;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vendor/p2p"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Vehicles</h1>
            <p className="text-gray-600">Find empty vehicles from other vendors</p>
          </div>
        </div>
        <Link
          href="/vendor/p2p/vehicles/post"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Post Your Vehicle
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="From city..."
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="To city..."
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Vehicle Types</option>
            <option value="1">Rajesh Kumar (+91 9737965551)</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Tempo Traveller">Tempo Traveller</option>
            <option value="Mini Truck">Mini Truck</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
          </select>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-gray-600">{filteredVehicles.length} vehicles available</p>

        {filteredVehicles.map((vehicle) => {
          const Icon = VehicleIcon(vehicle.vehicleType);

          return (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Vehicle Info */}
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-blue-100 rounded-xl">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">{vehicle.vehicle_models}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {vehicle.vehicleType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {vehicle.registrationNumber} • {vehicle.vehicleYear}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vehicle.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Route & Time */}
                  <div className="flex-1 lg:text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{vehicle.route.from}</p>
                        <p className="text-sm text-gray-500">{vehicle.availableTime}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-600 to-green-600"></div>
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{vehicle.route.to}</p>
                        <p className="text-sm text-gray-500">{vehicle.expectedArrival}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {vehicle.route.distance} km • {formatDate(vehicle.availableDate)}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(vehicle.price)}</p>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      {vehicle.driverIncluded && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> Driver
                        </span>
                      )}
                      {vehicle.fuelIncluded && (
                        <span className="text-xs text-gray-500">+ Fuel</span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Request Vehicle
                    </button>
                  </div>
                </div>

                {/* Vendor Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {vehicle.vendorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.vendorName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {vehicle.vendorRating}
                        </span>
                        <span>•</span>
                        <span>{vehicle.vendorTrips} trips</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${vehicle.vendorPhone}`}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Phone className="w-5 h-5 text-gray-600" />
                    </a>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredVehicles.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search filters</p>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request Vehicle</h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedVehicle.vehicle_models}</p>
                    <p className="text-sm text-gray-500">
                      {selectedVehicle.route.from} → {selectedVehicle.route.to}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedVehicle.availableDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{selectedVehicle.availableTime}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Purpose / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe why you need this vehicle..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Price</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(selectedVehicle.price)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Payment will be settled after trip completion
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
