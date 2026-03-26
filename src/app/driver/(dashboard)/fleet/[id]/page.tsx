'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Car, Wrench, Shield, FileText, Plus,
  Loader2, AlertTriangle, CheckCircle, Gauge, Calendar,
  Building2, IndianRupee, Pencil, Camera, X,
} from 'lucide-react';

interface MaintenanceLog {
  id: string;
  type: string;
  description?: string;
  cost: number;
  date: string;
  odometer?: number;
  nextDueDate?: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  registrationNo?: string;
  color?: string;
  category?: string;
  fuelType?: string;
  seatingCapacity?: number;
  isActive?: boolean;
  isVendorVehicle?: boolean;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  insuranceDocument?: string;
  rcNumber?: string;
  rcExpiry?: string;
  rcDocument?: string;
  fitnessExpiry?: string;
  fitnessDocument?: string;
  permitExpiry?: string;
  permitDocument?: string;
  vehiclePhotos?: string;
  currentOdometer?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  maintenance_logs?: MaintenanceLog[];
}

function docStatus(expiry?: string) {
  if (!expiry) return null;
  const d = new Date(expiry);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { label: 'Expired', cls: 'text-red-600 bg-red-50 border-red-200' };
  if (days <= 7) return { label: `${days}d left`, cls: 'text-red-600 bg-red-50 border-red-200' };
  if (days <= 30) return { label: `${days}d left`, cls: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: `${days}d left`, cls: 'text-green-600 bg-green-50 border-green-200' };
}

function DocRow({ label, number, expiry, docUrl }: { label: string; number?: string; expiry?: string; docUrl?: string }) {
  const status = docStatus(expiry);
  if (!number && !expiry && !docUrl) return null;
  return (
    <div className="flex items-start justify-between py-3 border-b last:border-0 gap-3">
      <div className="flex items-start gap-2">
        {docUrl && (
          <a href={docUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <img src={docUrl} alt={label} className="w-10 h-10 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition" />
          </a>
        )}
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {number && <p className="text-xs text-gray-500 mt-0.5">{number}</p>}
        </div>
      </div>
      <div className="text-right shrink-0">
        {expiry && (
          <>
            <p className="text-xs text-gray-500">{new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            {status && <span className={`text-xs px-2 py-0.5 rounded border font-medium ${status.cls}`}>{status.label}</span>}
          </>
        )}
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  SERVICE: 'bg-emerald-100 text-emerald-700',
  REPAIR: 'bg-red-100 text-red-700',
  FUEL: 'bg-blue-100 text-blue-700',
  INSURANCE: 'bg-purple-100 text-purple-700',
  TIRE: 'bg-amber-100 text-amber-700',
  BATTERY: 'bg-yellow-100 text-yellow-700',
  OIL_CHANGE: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function VehicleDetailPage() {
  const params = useParams()!;
  const id = params.id as string;
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/driver/fleet/${id}`);
      const data = await res.json();
      if (data.success) setVehicle(data.vehicle);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const uploadPhoto = async (file: File, type: string) => {
    setUploadingPhoto(type);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await fetch(`/api/driver/fleet/${id}/photos`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) await load();
    } catch {}
    setUploadingPhoto(null);
  };

  const removeVehiclePhoto = async (url: string) => {
    try {
      await fetch(`/api/driver/fleet/${id}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      await load();
    } catch {}
  };

  const toggleActive = async () => {
    if (!vehicle) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/driver/fleet/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      });
      const data = await res.json();
      if (data.success) setVehicle(v => v ? { ...v, isActive: data.vehicle.isActive } : v);
    } catch {}
    setToggling(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  );

  if (!vehicle) return (
    <div className="text-center py-12">
      <p className="text-red-600">Vehicle not found</p>
      <Link href="/driver/fleet" className="text-emerald-600 mt-3 inline-block text-sm">← Back to Fleet</Link>
    </div>
  );

  const logs = vehicle.maintenance_logs || [];

  return (
    <div className="space-y-5 max-w-lg">
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Full size" className="max-w-full max-h-full rounded-lg object-contain" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxUrl(null)}>
            <X className="w-8 h-8" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{vehicle.make} {vehicle.model}</h1>
            {vehicle.registrationNo && <p className="text-sm text-emerald-700 font-semibold">{vehicle.registrationNo}</p>}
          </div>
        </div>
        {!vehicle.isVendorVehicle && (
          <div className="flex items-center gap-2">
            <Link
              href={`/driver/fleet/${id}/edit`}
              className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
            <button
              onClick={toggleActive}
              disabled={toggling}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                vehicle.isActive
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-green-600 bg-green-50 hover:bg-green-100'
              }`}
            >
              {toggling ? '...' : vehicle.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${vehicle.isVendorVehicle ? 'bg-blue-100' : 'bg-emerald-100'}`}>
          {vehicle.isVendorVehicle ? <Building2 className="w-8 h-8 text-blue-600" /> : <Car className="w-8 h-8 text-emerald-600" />}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{vehicle.make} {vehicle.model}</h2>
        {vehicle.registrationNo && <p className="text-base font-bold text-emerald-600 mt-1">{vehicle.registrationNo}</p>}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {vehicle.year && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{vehicle.year}</span>}
          {vehicle.category && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{vehicle.category}</span>}
          {vehicle.fuelType && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{vehicle.fuelType}</span>}
          {vehicle.seatingCapacity && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{vehicle.seatingCapacity} seats</span>}
          {vehicle.color && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{vehicle.color}</span>}
        </div>
        {vehicle.isVendorVehicle && (
          <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">Vendor Vehicle (Read-only)</span>
        )}
        {!vehicle.isActive && (
          <span className="inline-block mt-2 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">INACTIVE</span>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-1 flex items-center gap-1.5">
          <Shield className="w-4 h-4" /> Documents
        </h2>
        <DocRow label="Insurance" number={vehicle.insuranceNumber} expiry={vehicle.insuranceExpiry} docUrl={vehicle.insuranceDocument} />
        <DocRow label="RC (Registration Certificate)" number={vehicle.rcNumber} expiry={vehicle.rcExpiry} docUrl={vehicle.rcDocument} />
        <DocRow label="Fitness Certificate" expiry={vehicle.fitnessExpiry} docUrl={vehicle.fitnessDocument} />
        <DocRow label="Permit" expiry={vehicle.permitExpiry} docUrl={vehicle.permitDocument} />
        {!vehicle.insuranceExpiry && !vehicle.rcExpiry && !vehicle.fitnessExpiry && !vehicle.permitExpiry
          && !vehicle.insuranceDocument && !vehicle.rcDocument && !vehicle.fitnessDocument && !vehicle.permitDocument && (
          <p className="text-sm text-gray-400 py-2">No document details added</p>
        )}
      </div>

      {/* Service Info */}
      {(vehicle.currentOdometer || vehicle.lastServiceDate || vehicle.nextServiceDate) && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-3 flex items-center gap-1.5">
            <Wrench className="w-4 h-4" /> Service
          </h2>
          <div className="space-y-2">
            {vehicle.currentOdometer != null && (
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span className="text-gray-600">Odometer:</span>
                <span className="font-semibold">{vehicle.currentOdometer.toLocaleString()} km</span>
              </div>
            )}
            {vehicle.lastServiceDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Last Service:</span>
                <span className="font-semibold">{new Date(vehicle.lastServiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            {vehicle.nextServiceDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600">Next Service:</span>
                <span className="font-semibold text-amber-700">{new Date(vehicle.nextServiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Photos */}
      {!vehicle.isVendorVehicle && (() => {
        const photos: string[] = vehicle.vehiclePhotos ? JSON.parse(vehicle.vehiclePhotos) : [];
        return (
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700 uppercase text-xs tracking-wide flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Vehicle Photos
              </h2>
              <label className={`flex items-center gap-1 text-xs font-semibold text-emerald-600 cursor-pointer hover:underline ${uploadingPhoto === 'vehicle' ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingPhoto === 'vehicle' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add Photo
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, 'vehicle'); e.target.value = ''; }} />
              </label>
            </div>
            {photos.length === 0 ? (
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-emerald-400 transition">
                <Camera className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">Tap to add vehicle photos</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, 'vehicle'); e.target.value = ''; }} />
              </label>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={p} alt={`Vehicle ${i + 1}`}
                      className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                      onClick={() => setLightboxUrl(p)}
                    />
                    <button
                      onClick={() => removeVehiclePhoto(p)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center text-xs hidden group-hover:flex"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-emerald-400 transition">
                  <Plus className="w-5 h-5 text-gray-400" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, 'vehicle'); e.target.value = ''; }} />
                </label>
              </div>
            )}
          </div>
        );
      })()}

      {/* Maintenance Logs */}
      {!vehicle.isVendorVehicle && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700 uppercase text-xs tracking-wide flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> Maintenance Logs
            </h2>
            <Link
              href={`/driver/fleet/${id}/maintenance/add`}
              className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Log
            </Link>
          </div>

          {logs.length === 0 ? (
            <Link
              href={`/driver/fleet/${id}/maintenance/add`}
              className="flex items-center gap-3 bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 hover:border-emerald-400 transition"
            >
              <Plus className="w-6 h-6 text-emerald-500" />
              <span className="text-sm font-medium text-gray-600">Add first maintenance log</span>
            </Link>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${TYPE_COLORS[log.type] || TYPE_COLORS.OTHER}`}>
                      {log.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {log.description && <p className="text-sm text-gray-700 mb-2">{log.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {log.cost > 0 && (
                      <span className="flex items-center gap-0.5 font-semibold text-emerald-700">
                        <IndianRupee className="w-3 h-3" />{log.cost.toLocaleString()}
                      </span>
                    )}
                    {log.odometer && <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{log.odometer.toLocaleString()} km</span>}
                    {log.nextDueDate && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Calendar className="w-3 h-3" />Next: {new Date(log.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
