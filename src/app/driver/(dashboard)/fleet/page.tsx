'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, Plus, Trash2, Loader2, AlertTriangle, Shield, Wrench, Building2 } from 'lucide-react';
import { PageHeader, EmptyState } from '../_components/PortalUI';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registrationNo?: string;
  category?: string;
  fuelType?: string;
  seatingCapacity?: number;
  color?: string;
  year?: number;
  isActive?: boolean;
  isVendorVehicle?: boolean;
  insuranceExpiry?: string;
  rcExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  nextServiceDate?: string;
}

function ExpiryBadge({ date, label }: { date?: string; label: string }) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft > 60) return null;
  const color = daysLeft <= 7 ? 'text-red-600 border-red-300 bg-red-50'
    : daysLeft <= 30 ? 'text-amber-600 border-amber-300 bg-amber-50'
    : 'text-gray-500 border-gray-300 bg-gray-50';
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${color}`}>
      {label} {daysLeft <= 0 ? 'expired' : `${daysLeft}d`}
    </span>
  );
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFleet = () => {
    setIsLoading(true);
    fetch('/api/driver/fleet')
      .then(r => r.json())
      .then(d => { if (d.success) setVehicles(d.vehicles || []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadFleet(); }, []);

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) return;
    setDeleting(vehicle.id);
    try {
      const res = await fetch(`/api/driver/fleet/${vehicle.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setVehicles(v => v.filter(x => x.id !== vehicle.id));
      else alert(data.error || 'Failed to delete');
    } catch {
      alert('Failed to delete vehicle');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Car}
        title="My Fleet"
        subtitle={
          isLoading
            ? 'Loading your vehicles\u2026'
            : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} on your account`
        }
        actions={
          <Link href="/driver/fleet/add" className="dv-action">
            <Plus className="w-4 h-4" /> Add Vehicle
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          message="Add the vehicle you drive and you can start being matched to trips."
          action={{ href: '/driver/fleet/add', label: 'Add your first vehicle', icon: Plus }}
        />
      ) : (
        <div className="space-y-3">
          {vehicles.map(vehicle => (
            <Link key={vehicle.id} href={`/driver/fleet/${vehicle.id}`} className={`block bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition ${!vehicle.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${vehicle.isVendorVehicle ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {vehicle.isVendorVehicle
                    ? <Building2 className="w-5 h-5 text-blue-600" />
                    : <Car className="w-5 h-5 text-green-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{vehicle.make} {vehicle.model}</p>
                    {vehicle.isVendorVehicle && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Vendor</span>
                    )}
                    {!vehicle.isActive && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Inactive</span>
                    )}
                  </div>
                  {vehicle.registrationNo && (
                    <p className="text-sm font-semibold text-green-700 mt-0.5">{vehicle.registrationNo}</p>
                  )}
                  {(vehicle.category || vehicle.fuelType || vehicle.seatingCapacity) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {[vehicle.category, vehicle.fuelType, vehicle.seatingCapacity ? `${vehicle.seatingCapacity} seats` : null]
                        .filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {/* Expiry warnings */}
                  {(vehicle.insuranceExpiry || vehicle.rcExpiry || vehicle.fitnessExpiry || vehicle.permitExpiry) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <ExpiryBadge date={vehicle.insuranceExpiry} label="Insurance" />
                      <ExpiryBadge date={vehicle.rcExpiry} label="RC" />
                      <ExpiryBadge date={vehicle.fitnessExpiry} label="Fitness" />
                      <ExpiryBadge date={vehicle.permitExpiry} label="Permit" />
                    </div>
                  )}
                </div>
                {/* Delete — only for personal vehicles */}
                {!vehicle.isVendorVehicle && (
                  <button
                    onClick={e => { e.preventDefault(); handleDelete(vehicle); }}
                    disabled={deleting === vehicle.id}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  >
                    {deleting === vehicle.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
