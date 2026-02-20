'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Car,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Shield,
  Fuel,
  BarChart3,
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleName: string;
  registrationNumber: string | null;
  service: string;
  isActive: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  totalTrips: number;
  avgRating: number;
  totalRatings: number;
  fuelType: string | null;
  insuranceExpired: boolean;
  fitnessExpired: boolean;
}

interface Summary {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  verifiedVehicles: number;
  totalTrips: number;
  avgRating: number;
  expiredInsurance: number;
  expiredFitness: number;
}

export default function FleetAnalyticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalVehicles: 0, activeVehicles: 0, availableVehicles: 0,
    verifiedVehicles: 0, totalTrips: 0, avgRating: 0,
    expiredInsurance: 0, expiredFitness: 0,
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/vendor/fleet/analytics');
        const data = await res.json();
        if (res.ok && data.success) {
          setVehicles(data.vehicles || []);
          setSummary(data.summary || {});
          setServiceBreakdown(data.serviceBreakdown || {});
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch {
        setError('Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const utilizationRate = summary.totalVehicles > 0
    ? Math.round((summary.availableVehicles / summary.totalVehicles) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fleet Analytics</h1>
        <p className="text-gray-600">Overview of your fleet performance and health</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Car className="w-4 h-4" />
            <span className="text-sm">Total Fleet</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalVehicles}</p>
          <p className="text-xs text-gray-500">{summary.activeVehicles} active</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Available</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{summary.availableVehicles}</p>
          <p className="text-xs text-gray-500">{utilizationRate}% utilization</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Trips</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{summary.totalTrips}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{summary.avgRating}</p>
          <p className="text-xs text-gray-500">out of 5.0</p>
        </div>
      </div>

      {/* Alerts */}
      {(summary.expiredInsurance > 0 || summary.expiredFitness > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Attention Required</h3>
            <p className="text-red-600 text-sm">
              {summary.expiredInsurance > 0 &&
                `${summary.expiredInsurance} vehicle(s) with expired insurance. `}
              {summary.expiredFitness > 0 &&
                `${summary.expiredFitness} vehicle(s) with expired fitness certificate.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Breakdown */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Vehicles by Service
          </h2>
          {Object.keys(serviceBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(serviceBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([service, count]) => {
                  const pct = summary.totalVehicles > 0
                    ? Math.round((count / summary.totalVehicles) * 100)
                    : 0;
                  return (
                    <div key={service}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{service}</span>
                        <span className="text-sm font-medium text-gray-900">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No service data available</p>
          )}
        </div>

        {/* Fleet Health */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Fleet Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Verified Vehicles</span>
              </div>
              <span className="font-bold text-gray-900">
                {summary.verifiedVehicles}/{summary.totalVehicles}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Valid Insurance</span>
              </div>
              <span className="font-bold text-gray-900">
                {summary.totalVehicles - summary.expiredInsurance}/{summary.totalVehicles}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">Valid Fitness</span>
              </div>
              <span className="font-bold text-gray-900">
                {summary.totalVehicles - summary.expiredFitness}/{summary.totalVehicles}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700">Active Fleet</span>
              </div>
              <span className="font-bold text-gray-900">
                {summary.activeVehicles}/{summary.totalVehicles}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Vehicles */}
      {vehicles.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Vehicle Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trips</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{vehicle.vehicleName}</p>
                        <p className="text-sm text-gray-500">{vehicle.registrationNumber || 'No Reg.'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{vehicle.service}</td>
                    <td className="px-4 py-3">
                      {vehicle.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{vehicle.totalTrips}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-gray-900">{vehicle.avgRating}</span>
                        <span className="text-xs text-gray-500">({vehicle.totalRatings})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {!vehicle.insuranceExpired && !vehicle.fitnessExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" /> Good
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          <AlertTriangle className="w-3 h-3" /> Issues
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
