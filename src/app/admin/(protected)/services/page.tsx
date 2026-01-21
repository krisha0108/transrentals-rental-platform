'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Bike,
  Car,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  Settings,
  ChevronRight,
  ChevronDown,
  MapPin,
  Users,
  BarChart3,
} from 'lucide-react';

// 8 Main Services with Sub-Services (from database seed)
const services = [
  {
    name: 'Self-Drive Car Rental',
    slug: 'self-drive-car-rental',
    icon: Car,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    flowType: 'BROWSE_FIRST',
    description: 'Rent a car and drive yourself',
    subServices: [
      { name: 'Hatchback', slug: 'self-drive-hatchback' },
      { name: 'Sedan', slug: 'self-drive-sedan' },
      { name: 'SUV', slug: 'self-drive-suv' },
      { name: 'MUV/MPV', slug: 'self-drive-muv' },
    ],
  },
  {
    name: 'Bike Rental',
    slug: 'bike-rental',
    icon: Bike,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    flowType: 'BROWSE_FIRST',
    description: 'Rent bikes and scooters',
    subServices: [
      { name: 'Scooter', slug: 'scooter-rental' },
      { name: 'Bike (100-150cc)', slug: 'bike-100-150cc' },
      { name: 'Bike (150-200cc)', slug: 'bike-150-200cc' },
      { name: 'Sports Bike', slug: 'sports-bike-rental' },
      { name: 'Cruiser', slug: 'cruiser-bike-rental' },
    ],
  },
  {
    name: 'Car Rental with Driver',
    slug: 'car-rental-with-driver',
    icon: CarTaxiFront,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50',
    flowType: 'TRIP_FIRST',
    description: 'Hire a car with professional driver',
    subServices: [
      { name: 'Hatchback', slug: 'driver-hatchback' },
      { name: 'Sedan', slug: 'driver-sedan' },
      { name: 'SUV', slug: 'driver-suv' },
      { name: 'MUV/MPV', slug: 'driver-muv' },
    ],
  },
  {
    name: 'Luxury Car Rental',
    slug: 'luxury-car-rental',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    flowType: 'TRIP_FIRST',
    description: 'Premium luxury car experiences',
    subServices: [
      { name: 'Luxury Sedan', slug: 'luxury-sedan' },
      { name: 'Luxury SUV', slug: 'luxury-suv' },
      { name: 'Limousine', slug: 'limousine-rental' },
      { name: 'Convertible', slug: 'convertible-rental' },
      { name: 'Vintage/Classic', slug: 'vintage-car-rental' },
    ],
  },
  {
    name: 'Bus Rental',
    slug: 'bus-rental',
    icon: Bus,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    flowType: 'TRIP_FIRST',
    description: 'Rent buses for group travel',
    subServices: [
      { name: 'Mini Bus (12-15 Seater)', slug: 'mini-bus-rental' },
      { name: 'Tempo Traveller (17-26 Seater)', slug: 'tempo-traveller-rental' },
      { name: 'Bus (30-45 Seater)', slug: 'bus-30-45-seater' },
      { name: 'Volvo Coach (45-52 Seater)', slug: 'volvo-coach-rental' },
    ],
  },
  {
    name: 'Truck/Tempo Rental',
    slug: 'truck-tempo-rental',
    icon: Truck,
    color: 'from-slate-500 to-gray-700',
    bgColor: 'bg-slate-50',
    flowType: 'QUOTE_BASED',
    description: 'Hire trucks for goods transport',
    subServices: [
      { name: 'Mini Truck (Tata Ace/Pickup)', slug: 'mini-truck-rental' },
      { name: 'Tempo (407/709)', slug: 'tempo-rental' },
      { name: 'Truck (14ft/17ft/19ft/22ft)', slug: 'truck-rental' },
      { name: 'Container', slug: 'container-rental' },
      { name: 'Trailer', slug: 'trailer-rental' },
    ],
  },
  {
    name: 'Packers & Movers',
    slug: 'packers-movers',
    icon: Package,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    flowType: 'QUOTE_BASED',
    description: 'Complete relocation services',
    subServices: [
      { name: 'Local Shifting (Within City)', slug: 'local-shifting' },
      { name: 'Domestic Relocation', slug: 'domestic-relocation' },
      { name: 'Office/Commercial Shifting', slug: 'office-shifting' },
      { name: 'Vehicle Transportation', slug: 'vehicle-transport' },
      { name: 'Storage/Warehouse', slug: 'storage-warehouse' },
    ],
  },
  {
    name: 'Equipment Rental',
    slug: 'equipment-rental',
    icon: Wrench,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    flowType: 'QUOTE_BASED',
    description: 'Rent construction & event equipment',
    subServices: [
      { name: 'Construction Equipment', slug: 'construction-equipment' },
      { name: 'Industrial Equipment', slug: 'industrial-equipment' },
      { name: 'Event Equipment', slug: 'event-equipment' },
      { name: 'Audio/Visual Equipment', slug: 'av-equipment' },
      { name: 'Agricultural Equipment', slug: 'agricultural-equipment' },
      { name: 'Medical Equipment', slug: 'medical-equipment' },
    ],
  },
];

const flowTypeColors: Record<string, string> = {
  BROWSE_FIRST: 'bg-blue-100 text-blue-700',
  TRIP_FIRST: 'bg-green-100 text-green-700',
  QUOTE_BASED: 'bg-amber-100 text-amber-700',
};

export default function AdminServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedServices, setExpandedServices] = useState<string[]>([]);

  const toggleService = (slug: string) => {
    setExpandedServices((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Filter services based on search
  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.subServices.some((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const totalSubServices = services.reduce(
    (acc, s) => acc + s.subServices.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-1">
            Manage {services.length} services with {totalSubServices} sub-categories
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              <p className="text-sm text-gray-500">Total Services</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalSubServices}</p>
              <p className="text-sm text-gray-500">Sub-Services</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">150+</p>
              <p className="text-sm text-gray-500">Cities Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500">Vendors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services or sub-services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map((service) => {
          const Icon = service.icon;
          const isExpanded = expandedServices.includes(service.slug);

          return (
            <div
              key={service.slug}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Service Header */}
              <div
                className={`${service.bgColor} px-6 py-4 border-b flex items-center justify-between`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {service.name}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          flowTypeColors[service.flowType]
                        }`}
                      >
                        {service.flowType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {service.subServices.length} sub-services
                  </span>
                  <Link
                    href={`/admin/services/${service.slug}`}
                    className="px-4 py-2 bg-white rounded-lg border shadow-sm hover:shadow-md transition flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </Link>
                  <button
                    onClick={() => toggleService(service.slug)}
                    className="p-2 hover:bg-white/50 rounded-lg transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-Services (Expandable) */}
              {isExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {service.subServices.map((sub) => (
                    <div
                      key={sub.slug}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {sub.name}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No services found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
}
