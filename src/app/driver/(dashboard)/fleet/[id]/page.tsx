'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Car, Wrench, Shield, Plus, Loader2, Gauge, Calendar,
  Building2, IndianRupee, Pencil, Camera, X, Droplets, AlertTriangle,
  CheckCircle, Clock, Fuel, Hash, Users, Palette, MapPin, FileText,
  ChevronRight, Activity, TrendingUp, AlertCircle,
} from 'lucide-react';

interface MaintenanceLog {
  id: string; type: string; description?: string;
  cost: number; date: string; odometer?: number; nextDueDate?: string;
}
interface FuelLog {
  id: string; date: string; liters: number; pricePerLiter?: number;
  totalAmount: number; odometer?: number; fuelStation?: string; fuelType?: string; notes?: string;
}
interface Incident {
  id: string; date: string; type: string; description?: string;
  severity: string; repairCost?: number; repairStatus: string; notes?: string;
}
interface Vehicle {
  id: string; make: string; model: string; year?: number;
  registrationNo?: string; color?: string; category?: string;
  fuelType?: string; seatingCapacity?: number; isActive?: boolean; isVendorVehicle?: boolean;
  insuranceNumber?: string; insuranceExpiry?: string; insuranceDocument?: string;
  rcNumber?: string; rcExpiry?: string; rcDocument?: string;
  fitnessExpiry?: string; fitnessDocument?: string;
  permitExpiry?: string; permitDocument?: string;
  photoFront?: string; photoBack?: string; photoLeftSide?: string;
  photoRightSide?: string; photoInterior?: string;
  currentOdometer?: number; lastServiceDate?: string; nextServiceDate?: string;
  maintenance_logs?: MaintenanceLog[];
  fuel_logs?: FuelLog[];
  incidents?: Incident[];
}

const PHOTO_SLOTS = [
  { key: 'photoFront',     type: 'front',     label: 'Front' },
  { key: 'photoBack',      type: 'back',      label: 'Back' },
  { key: 'photoLeftSide',  type: 'leftSide',  label: 'Left Side' },
  { key: 'photoRightSide', type: 'rightSide', label: 'Right Side' },
  { key: 'photoInterior',  type: 'interior',  label: 'Interior' },
];

function docStatus(expiry?: string) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days <= 0) return { label: 'Expired', dot: 'bg-red-500', badge: 'text-red-700 bg-red-50 border-red-200', border: 'border-l-red-500' };
  if (days <= 7) return { label: `${days}d left`, dot: 'bg-red-500', badge: 'text-red-700 bg-red-50 border-red-200', border: 'border-l-red-500' };
  if (days <= 30) return { label: `${days}d left`, dot: 'bg-amber-500', badge: 'text-amber-700 bg-amber-50 border-amber-200', border: 'border-l-amber-400' };
  return { label: `${days}d left`, dot: 'bg-green-500', badge: 'text-green-700 bg-green-50 border-green-200', border: 'border-l-green-400' };
}

const MAINT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SERVICE:    { bg: 'bg-green-100', text: 'text-green-700', border: 'border-l-green-500' },
  REPAIR:     { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-l-red-500' },
  FUEL:       { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-l-blue-500' },
  INSURANCE:  { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-l-purple-500' },
  TIRE:       { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-l-amber-500' },
  BATTERY:    { bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-l-yellow-500' },
  OIL_CHANGE: { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-l-orange-500' },
  OTHER:      { bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-l-gray-400' },
};

const SEV: Record<string, { bg: string; text: string; dot: string }> = {
  LOW:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  MEDIUM: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  HIGH:   { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const REPAIR_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Pending',     cls: 'text-gray-500 bg-gray-100' },
  IN_PROGRESS: { label: 'In Progress', cls: 'text-blue-700 bg-blue-100' },
  RESOLVED:    { label: 'Resolved',    cls: 'text-green-700 bg-green-100' },
};

function SectionHeader({ icon: Icon, label, iconBg, iconColor, labelColor, children }: any) {
  return (
    <div className={`flex items-center justify-between px-5 py-3 border-b ${iconBg}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100')}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function VehicleDetailPage() {
  const params = useParams()!;
  const id = params.id as string;
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
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

  const uploadPhoto = async (file: File, slotType: string) => {
    setUploadingSlot(slotType);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', slotType);
      const res = await fetch(`/api/driver/fleet/${id}/photos`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) await load();
    } catch {}
    setUploadingSlot(null);
  };

  const deleteMaintenanceLog = async (logId: string) => {
    if (!confirm('Delete this maintenance log?')) return;
    try { await fetch(`/api/driver/fleet/${id}/maintenance/${logId}`, { method: 'DELETE' }); await load(); } catch {}
  };
  const deleteFuelLog = async (logId: string) => {
    if (!confirm('Delete this fuel log?')) return;
    try { await fetch(`/api/driver/fleet/${id}/fuel/${logId}`, { method: 'DELETE' }); await load(); } catch {}
  };
  const deleteIncidentLog = async (incidentId: string) => {
    if (!confirm('Delete this incident?')) return;
    try { await fetch(`/api/driver/fleet/${id}/incidents/${incidentId}`, { method: 'DELETE' }); await load(); } catch {}
  };
  const removePhoto = async (slotType: string) => {
    if (!confirm('Remove this photo?')) return;
    try {
      await fetch(`/api/driver/fleet/${id}/photos`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: slotType }),
      });
      await load();
    } catch {}
  };
  const toggleActive = async () => {
    if (!vehicle) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/driver/fleet/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      });
      const data = await res.json();
      if (data.success) setVehicle(v => v ? { ...v, isActive: data.vehicle.isActive } : v);
    } catch {}
    setToggling(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );
  if (!vehicle) return (
    <div className="text-center py-12">
      <p className="text-red-600 font-medium">Vehicle not found</p>
      <Link href="/driver/fleet" className="text-green-600 mt-3 inline-block text-sm">← Back to Fleet</Link>
    </div>
  );

  const isVendor = !!vehicle.isVendorVehicle;
  const logs = vehicle.maintenance_logs || [];
  const fuelLogs = vehicle.fuel_logs || [];
  const incidents = vehicle.incidents || [];

  const filledPhotos = PHOTO_SLOTS.filter(s => !!(vehicle as any)[s.key]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Full size" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
          <button className="absolute top-5 right-5 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition" onClick={() => setLightboxUrl(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Hero Gradient Header */}
      <div className="relative mb-14">
      <div className={`rounded-2xl overflow-hidden shadow-lg ${isVendor ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 shadow-blue-200' : 'bg-gradient-to-r from-green-700 via-green-600 to-teal-500 shadow-green-200'}`}>
        <div className="px-5 pt-5 pb-14">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            {!isVendor && (
              <div className="flex items-center gap-2">
                <Link href={`/driver/fleet/${id}/edit`}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <button onClick={toggleActive} disabled={toggling}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${vehicle.isActive ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                  {toggling ? '...' : vehicle.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            )}
          </div>

          {/* Vehicle info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              {isVendor ? <Building2 className="w-7 h-7 text-white" /> : <Car className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{vehicle.make} {vehicle.model}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {vehicle.registrationNo && (
                  <span className="text-xs font-bold bg-white/25 text-white px-2.5 py-1 rounded-lg tracking-wider">{vehicle.registrationNo}</span>
                )}
                {!vehicle.isActive && <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-lg">INACTIVE</span>}
                {isVendor && <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded-lg">Vendor Vehicle</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip — overlaps bottom of header */}
        <div className="absolute bottom-0 left-4 right-4 translate-y-1/2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
            {[
              { icon: Gauge, label: 'Odometer', value: vehicle.currentOdometer ? `${vehicle.currentOdometer.toLocaleString()} km` : '—', color: 'text-green-600' },
              { icon: Car, label: 'Category', value: vehicle.category || '—', color: 'text-blue-600' },
              { icon: Fuel, label: 'Fuel', value: vehicle.fuelType || '—', color: 'text-orange-500' },
              { icon: Users, label: 'Seats', value: vehicle.seatingCapacity ? `${vehicle.seatingCapacity}` : '—', color: 'text-purple-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center py-3 px-2">
                <Icon className={`w-4 h-4 ${color} mb-1`} />
                <p className="text-xs font-bold text-gray-800 truncate max-w-full text-center">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      <div className="space-y-4">
        {/* Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <SectionHeader icon={Shield} label="Documents" iconBg="bg-blue-50 border-blue-100" iconColor="text-blue-600" labelColor="text-blue-800" />
          <div className="p-4 space-y-2">
            {[
              { label: 'Insurance', number: vehicle.insuranceNumber, expiry: vehicle.insuranceExpiry, docUrl: vehicle.insuranceDocument },
              { label: 'RC Certificate', number: vehicle.rcNumber, expiry: vehicle.rcExpiry, docUrl: vehicle.rcDocument },
              { label: 'Fitness Certificate', expiry: vehicle.fitnessExpiry, docUrl: vehicle.fitnessDocument },
              { label: 'Permit', expiry: vehicle.permitExpiry, docUrl: vehicle.permitDocument },
            ].map(doc => {
              if (!doc.number && !doc.expiry && !doc.docUrl) return null;
              const st = docStatus(doc.expiry);
              return (
                <div key={doc.label} className={`flex items-center justify-between p-3 rounded-xl border-l-4 bg-gray-50 border border-gray-100 ${st?.border || 'border-l-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    {doc.docUrl ? (
                      <a href={doc.docUrl} target="_blank" rel="noopener noreferrer">
                        <img src={doc.docUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition" alt={doc.label} />
                      </a>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{doc.label}</p>
                      {doc.number && <p className="text-xs text-gray-500 mt-0.5">{doc.number}</p>}
                      {doc.expiry && <p className="text-xs text-gray-400 mt-0.5">{new Date(doc.expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                    </div>
                  </div>
                  {st && <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${st.badge}`}>{st.label}</span>}
                </div>
              );
            })}
            {!vehicle.insuranceExpiry && !vehicle.rcExpiry && !vehicle.fitnessExpiry && !vehicle.permitExpiry
              && !vehicle.insuranceDocument && !vehicle.rcDocument && !vehicle.fitnessDocument && !vehicle.permitDocument && (
              <p className="text-sm text-gray-400 text-center py-4">No documents added</p>
            )}
          </div>
        </div>

        {/* Vehicle Photos */}
        {!isVendor && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Vehicle Photos</span>
                {filledPhotos.length > 0 && <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">{filledPhotos.length}/5</span>}
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {PHOTO_SLOTS.map(slot => {
                  const url = (vehicle as any)[slot.key] as string | undefined;
                  const isUploading = uploadingSlot === slot.type;
                  return (
                    <div key={slot.key} className="flex flex-col items-center gap-1.5">
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                        ) : url ? (
                          <>
                            <img src={url} alt={slot.label} className="w-full h-full object-cover cursor-pointer" onClick={() => setLightboxUrl(url)} />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-end justify-between p-1 opacity-0 hover:opacity-100">
                              <label className="cursor-pointer bg-white/90 rounded-md p-1">
                                <Camera className="w-3 h-3 text-gray-700" />
                                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, slot.type); e.target.value = ''; }} />
                              </label>
                              <button onClick={() => removePhoto(slot.type)} className="bg-red-500 text-white rounded-md p-1"><X className="w-3 h-3" /></button>
                            </div>
                          </>
                        ) : (
                          <label className="flex flex-col items-center gap-1 cursor-pointer p-2 w-full h-full justify-center">
                            <Camera className="w-5 h-5 text-gray-300" />
                            <span className="text-xs text-gray-400">Add</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, slot.type); e.target.value = ''; }} />
                          </label>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{slot.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Service Info */}
        {(vehicle.currentOdometer || vehicle.lastServiceDate || vehicle.nextServiceDate) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SectionHeader icon={Wrench} label="Service Info" iconBg="bg-green-50 border-green-100" iconColor="text-green-600" labelColor="text-green-800" />
            <div className="p-4 grid grid-cols-3 gap-3">
              {vehicle.currentOdometer != null && (
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Gauge className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-800">{vehicle.currentOdometer.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">km</p>
                </div>
              )}
              {vehicle.lastServiceDate && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Calendar className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-800">{new Date(vehicle.lastServiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">Last Service</p>
                </div>
              )}
              {vehicle.nextServiceDate && (
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-amber-700">{new Date(vehicle.nextServiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">Next Service</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Logs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <span className="text-xs font-bold text-violet-800 uppercase tracking-wider">Maintenance Logs</span>
              {logs.length > 0 && <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">{logs.length}</span>}
            </div>
            {!isVendor && (
              <Link href={`/driver/fleet/${id}/maintenance/add`}
                className="flex items-center gap-1 text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 px-3 py-1.5 rounded-xl transition">
                <Plus className="w-3.5 h-3.5" /> Add
              </Link>
            )}
          </div>
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              !isVendor ? (
                <Link href={`/driver/fleet/${id}/maintenance/add`}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-violet-300 transition text-sm text-gray-400 hover:text-violet-500">
                  <Plus className="w-4 h-4" /> Add first maintenance log
                </Link>
              ) : <p className="text-sm text-gray-400 text-center py-4">No maintenance logs</p>
            ) : (
              logs.map(log => {
                const c = MAINT_COLORS[log.type] || MAINT_COLORS.OTHER;
                return (
                  <div key={log.id} className={`border-l-4 ${c.border} bg-gray-50 rounded-xl border border-gray-100 p-3.5`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${c.bg} ${c.text}`}>{log.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {log.description && <p className="text-sm text-gray-600 mt-1 leading-snug">{log.description}</p>}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {log.cost > 0 && <span className="flex items-center gap-0.5 text-xs font-bold text-green-700"><IndianRupee className="w-3 h-3" />{log.cost.toLocaleString()}</span>}
                          {log.odometer && <span className="flex items-center gap-1 text-xs text-gray-500"><Gauge className="w-3 h-3" />{log.odometer.toLocaleString()} km</span>}
                          {log.nextDueDate && <span className="flex items-center gap-1 text-xs text-amber-600"><Clock className="w-3 h-3" />Next: {new Date(log.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href={`/driver/fleet/${id}/maintenance/${log.id}/edit`} className="w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition">
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </Link>
                        <button onClick={() => deleteMaintenanceLog(log.id)} className="w-7 h-7 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition">
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Fuel Logs */}
        {!isVendor && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Fuel Logs</span>
                {fuelLogs.length > 0 && <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{fuelLogs.length}</span>}
              </div>
              <Link href={`/driver/fleet/${id}/fuel/add`}
                className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-xl transition">
                <Plus className="w-3.5 h-3.5" /> Add
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {fuelLogs.length === 0 ? (
                <Link href={`/driver/fleet/${id}/fuel/add`}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-blue-300 transition text-sm text-gray-400 hover:text-blue-500">
                  <Plus className="w-4 h-4" /> Add first fuel log
                </Link>
              ) : (
                fuelLogs.map(log => (
                  <div key={log.id} className="border-l-4 border-l-blue-400 bg-gray-50 rounded-xl border border-gray-100 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700">{log.fuelType || 'Fuel'} · {log.liters}L</span>
                          <span className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {log.fuelStation && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{log.fuelStation}</p>}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="flex items-center gap-0.5 text-xs font-bold text-green-700"><IndianRupee className="w-3 h-3" />{log.totalAmount.toLocaleString()}</span>
                          {log.pricePerLiter && <span className="text-xs text-gray-500">₹{log.pricePerLiter}/L</span>}
                          {log.odometer && <span className="flex items-center gap-1 text-xs text-gray-500"><Gauge className="w-3 h-3" />{log.odometer.toLocaleString()} km</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href={`/driver/fleet/${id}/fuel/${log.id}/edit`} className="w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition">
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </Link>
                        <button onClick={() => deleteFuelLog(log.id)} className="w-7 h-7 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition">
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Incidents */}
        {!isVendor && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                </div>
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Incidents</span>
                {incidents.length > 0 && <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{incidents.length}</span>}
              </div>
              <Link href={`/driver/fleet/${id}/incidents/add`}
                className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-xl transition">
                <Plus className="w-3.5 h-3.5" /> Report
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {incidents.length === 0 ? (
                <Link href={`/driver/fleet/${id}/incidents/add`}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-red-300 transition text-sm text-gray-400 hover:text-red-500">
                  <Plus className="w-4 h-4" /> Report an incident
                </Link>
              ) : (
                incidents.map(inc => {
                  const sev = SEV[inc.severity] || SEV.MEDIUM;
                  const rst = REPAIR_STATUS[inc.repairStatus] || REPAIR_STATUS.PENDING;
                  return (
                    <div key={inc.id} className={`border-l-4 ${inc.severity === 'HIGH' ? 'border-l-red-500' : inc.severity === 'MEDIUM' ? 'border-l-amber-400' : 'border-l-green-400'} bg-gray-50 rounded-xl border border-gray-100 p-3.5`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${sev.bg} ${sev.text}`}>{inc.type}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${rst.cls}`}>{rst.label}</span>
                            <span className="text-xs text-gray-400">{new Date(inc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {inc.description && <p className="text-sm text-gray-600 mt-1 leading-snug">{inc.description}</p>}
                          {inc.repairCost != null && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-500 mt-1.5"><IndianRupee className="w-3 h-3" />{inc.repairCost.toLocaleString()} repair cost</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link href={`/driver/fleet/${id}/incidents/${inc.id}/edit`} className="w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition">
                            <Pencil className="w-3.5 h-3.5 text-blue-500" />
                          </Link>
                          <button onClick={() => deleteIncidentLog(inc.id)} className="w-7 h-7 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition">
                            <X className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
