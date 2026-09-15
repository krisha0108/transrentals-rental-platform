'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Car, Loader2, Edit, MapPin, CheckCircle, XCircle,
  Fuel, Settings, Users, Gauge, Calendar, Building2, Search,
  ChevronLeft, ChevronRight, Check, X, Image as ImageIcon,
  IndianRupee, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleDetails {
  id: string;
  name: string;
  slug: string;
  fuelType: string | null;
  transmission: string | null;
  seatingCapacity: number | null;
  engineCC: number | null;
  mileage: string | null;
  sideImage: string | null;
  specs: any;
  features: any;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  basePricePerDay?: number | null;
  weeklyDiscount?: number | null;
  monthlyDiscount?: number | null;
  brandId?: string | null;
  subServiceId?: string | null;
  brands?: { id: string; name: string; logo: string | null };
  services_vehicle_models_serviceIdToservices?: { id: string; name: string; slug: string };
  services_vehicle_models_subServiceIdToservices?: { id: string; name: string; slug: string } | null;
  chauffeur_vehicle_categories?: { id: string; name: string; slug: string } | null;
  vehicle_model_locations?: Array<{
    id: string;
    basePricePerDay: number | null;
    kmLimit?: number | null;
    extraKmRate?: number | null;
    securityDeposit?: number | null;
    isActive: boolean;
    locationId?: string;
    locations?: { id: string; name: string; slug: string };
  }>;
  vendor_fleets?: Array<{ id: string; vendors?: { id: string; businessName: string } }>;
}

interface Brand { id: string; name: string }
interface SubService { id: string; name: string }
interface ServiceLocation { id: string; name: string; state: string }

export default function VehicleViewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [formData, setFormData] = useState({
    name: '', slug: '', brandId: '', subServiceId: '',
    fuelType: '', transmission: '', seatingCapacity: '', engineCC: '', mileage: '',
    basePricePerDay: '', weeklyDiscount: '', monthlyDiscount: '',
    sideImage: '', isActive: true,
  });

  // City pricing state
  const [cityPrices, setCityPrices] = useState<Record<string, {
    basePricePerDay: string; kmLimit: string; extraKmRate: string; securityDeposit: string;
  }>>({});
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Fetch vehicle
  const fetchVehicle = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/services/${slug}/fleet/${vehicleId}`);
      if (res.ok) {
        const data = await res.json();
        setVehicle(data.vehicle);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch vehicle');
      }
    } catch {
      setError('Failed to fetch vehicle');
    } finally {
      setLoading(false);
    }
  }, [slug, vehicleId]);

  useEffect(() => { if (slug && vehicleId) fetchVehicle(); }, [fetchVehicle]);

  // Load brands + subservices once
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/admin/services/${slug}/brands`)
      .then(r => r.json()).then(d => setBrands((d.brands || []).filter((b: any) => b.isActive !== false)));
    fetch(`/api/admin/services/${slug}/fleet?limit=1`)
      .then(r => r.json()).then(d => setSubServices(d.subServices || []));
  }, [slug]);

  // Load service locations when edit opens
  useEffect(() => {
    if (!showEdit || serviceLocations.length > 0) return;
    setLoadingLocations(true);
    fetch(`/api/admin/services/${slug}/locations`)
      .then(r => r.json())
      .then(d => setServiceLocations(
        (d.locations || []).filter((l: any) => l.isEnabled).map((l: any) => ({ id: l.id, name: l.name, state: l.state }))
      ))
      .catch(() => {})
      .finally(() => setLoadingLocations(false));
  }, [showEdit, slug]);

  const openEdit = () => {
    if (!vehicle) return;
    setFormData({
      name: vehicle.name,
      slug: vehicle.slug,
      brandId: vehicle.brandId || vehicle.brands?.id || '',
      subServiceId: vehicle.subServiceId || vehicle.services_vehicle_models_subServiceIdToservices?.id || '',
      fuelType: vehicle.fuelType || '',
      transmission: vehicle.transmission || '',
      seatingCapacity: vehicle.seatingCapacity?.toString() || '',
      engineCC: vehicle.specs?.engineCC || vehicle.engineCC?.toString() || '',
      mileage: vehicle.mileage || vehicle.specs?.mileage || '',
      basePricePerDay: vehicle.basePricePerDay?.toString() || '',
      weeklyDiscount: vehicle.weeklyDiscount?.toString() || '',
      monthlyDiscount: vehicle.monthlyDiscount?.toString() || '',
      sideImage: vehicle.sideImage || '',
      isActive: vehicle.isActive,
    });
    setFormStep(1);
    setCityPrices({});
    setSelectedCities([]);
    setCitySearch('');
    // Load existing city prices
    fetch(`/api/admin/services/${slug}/fleet/${vehicleId}/locations`)
      .then(r => r.json())
      .then(data => {
        const existing: Record<string, any> = {};
        const sel: string[] = [];
        (data.assignedLocations || []).forEach((al: any) => {
          if (al.basePricePerDay || al.kmLimit || al.extraKmRate || al.securityDeposit) {
            existing[al.locationId] = {
              basePricePerDay: al.basePricePerDay ? String(al.basePricePerDay) : '',
              kmLimit: al.kmLimit ? String(al.kmLimit) : '',
              extraKmRate: al.extraKmRate ? String(al.extraKmRate) : '',
              securityDeposit: al.securityDeposit ? String(al.securityDeposit) : '',
            };
            sel.push(al.locationId);
          }
        });
        setCityPrices(existing);
        setSelectedCities(sel);
      })
      .catch(() => {});
    setShowEdit(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/fleet/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          vehicleSlug: formData.slug,
          brandId: formData.brandId || null,
          subServiceId: formData.subServiceId || null,
          sideImage: formData.sideImage || null,
          basePricePerDay: formData.basePricePerDay || null,
          weeklyDiscount: formData.weeklyDiscount || null,
          monthlyDiscount: formData.monthlyDiscount || null,
          fuelType: formData.fuelType || null,
          transmission: formData.transmission || null,
          seatingCapacity: formData.seatingCapacity || null,
          engineCC: formData.engineCC || null,
          mileage: formData.mileage || null,
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        // Save city prices
        const cityEntries = Object.entries(cityPrices).filter(([, p]) =>
          p.basePricePerDay || p.kmLimit || p.extraKmRate || p.securityDeposit
        );
        if (cityEntries.length > 0) {
          await Promise.all(
            cityEntries.map(([locationId, p]) =>
              fetch(`/api/admin/services/${slug}/fleet/${vehicleId}/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  locationIds: [locationId],
                  basePricePerDay: p.basePricePerDay ? Number(p.basePricePerDay) : null,
                  kmLimit: p.kmLimit ? Number(p.kmLimit) : null,
                  extraKmRate: p.extraKmRate ? Number(p.extraKmRate) : null,
                  securityDeposit: p.securityDeposit ? Number(p.securityDeposit) : null,
                }),
              })
            )
          );
        }
        setShowEdit(false);
        fetchVehicle();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update vehicle');
      }
    } catch {
      alert('Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (error || !vehicle) return (
    <div className="space-y-6">
      <Link href={`/admin/services/${slug}/fleet`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Fleet
      </Link>
      <div className="bg-white rounded-xl p-12 text-center border">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500">{error || 'Vehicle not found'}</p>
      </div>
    </div>
  );

  // ── Step indicator labels ──
  const STEPS = ['Basic Info', 'Specifications', 'Pricing', 'City Pricing'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={`/admin/services/${slug}/fleet`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Fleet
          </Link>
          <div className="flex items-center gap-4">
            {vehicle.sideImage ? (
              <img src={vehicle.sideImage} alt={vehicle.name} className="w-20 h-14 object-cover rounded-lg" />
            ) : (
              <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                <Car className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
              <p className="text-gray-600">{vehicle.brands?.name || 'Unknown Brand'} · {vehicle.services_vehicle_models_serviceIdToservices?.name || 'Unknown Service'}</p>
            </div>
          </div>
        </div>
        <Button onClick={openEdit}>
          <Edit className="w-4 h-4 mr-2" /> Edit Vehicle
        </Button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        {vehicle.isActive ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle className="w-4 h-4" /> Inactive
          </span>
        )}
        {(vehicle.services_vehicle_models_subServiceIdToservices || vehicle.chauffeur_vehicle_categories) && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {vehicle.services_vehicle_models_subServiceIdToservices?.name || vehicle.chauffeur_vehicle_categories?.name}
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Specs */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vehicle.fuelType && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Fuel className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-gray-500">Fuel Type</p><p className="font-medium">{vehicle.fuelType}</p></div></div>}
              {vehicle.transmission && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Settings className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-gray-500">Transmission</p><p className="font-medium">{vehicle.transmission}</p></div></div>}
              {vehicle.seatingCapacity && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Users className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-gray-500">Seating</p><p className="font-medium">{vehicle.seatingCapacity} Seats</p></div></div>}
              {vehicle.engineCC && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Gauge className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-gray-500">Engine</p><p className="font-medium">{vehicle.engineCC} CC</p></div></div>}
              {vehicle.mileage && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Gauge className="w-5 h-5 text-green-500" /><div><p className="text-xs text-gray-500">Mileage</p><p className="font-medium">{vehicle.mileage}</p></div></div>}
            </div>
          </div>

          {/* Features */}
          {vehicle.features && Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((f: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Locations */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Assigned Locations</h2>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{vehicle.vehicle_model_locations?.length || 0} locations</span>
            </div>
            {!vehicle.vehicle_model_locations || vehicle.vehicle_model_locations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No locations assigned yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {vehicle.vehicle_model_locations.map((loc) => (
                  <div key={loc.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{loc.locations?.name || 'Unknown'}</p>
                      {loc.basePricePerDay && <p className="text-xs text-green-600">₹{loc.basePricePerDay}/day</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              {[
                // The key is only here to satisfy react/jsx-key: this element is a
                // tuple value, not a list child, so React never needs it.
                ['Slug', <span key="slug" className="font-mono bg-gray-100 px-2 py-0.5 rounded">{vehicle.slug}</span>],
                ['Brand', vehicle.brands?.name || '—'],
                ['Service', vehicle.services_vehicle_models_serviceIdToservices?.name || '—'],
                ['Category', vehicle.services_vehicle_models_subServiceIdToservices?.name || vehicle.chauffeur_vehicle_categories?.name || '—'],
                ['Base Price', vehicle.basePricePerDay ? `₹${vehicle.basePricePerDay}/day` : '—'],
                ['Locations', vehicle.vehicle_model_locations?.length || 0],
                ['Vendors', vehicle.vendor_fleets?.length || 0],
              ].map(([label, val], i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{val as any}</span>
                </div>
              ))}
            </div>
          </div>

          {vehicle.vendor_fleets && vehicle.vendor_fleets.length > 0 && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendors ({vehicle.vendor_fleets.length})</h2>
              <div className="space-y-2">
                {vehicle.vendor_fleets.map((vf) => (
                  <div key={vf.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{vf.vendors?.businessName || 'Unknown Vendor'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Created: {new Date(vehicle.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Vehicle</h2>
              <button onClick={() => setShowEdit(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0 mb-6">
              {STEPS.map((label, i) => {
                const step = i + 1;
                const isActive = formStep === step;
                const isDone = formStep > step;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isDone ? 'bg-green-500 border-green-500 text-white' :
                        isActive ? 'bg-blue-600 border-blue-600 text-white' :
                        'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : step}
                      </div>
                      <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                    </div>
                    {step < 4 && <div className={`h-0.5 flex-1 mx-1 mb-4 ${formStep > step ? 'bg-green-400' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>

            <form onSubmit={e => e.preventDefault()} className="space-y-4">

              {/* ── STEP 1: Basic Info ── */}
              {formStep === 1 && <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleFormChange} required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select name="brandId" value={formData.brandId} onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select name="subServiceId" value={formData.subServiceId} onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Category</option>
                    {subServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </>}

              {/* ── STEP 2: Specifications + Image ── */}
              {formStep === 2 && <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                    <select name="fuelType" value={formData.fuelType} onChange={handleFormChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select</option>
                      {['Petrol','Diesel','CNG','Electric','Hybrid'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                    <select name="transmission" value={formData.transmission} onChange={handleFormChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select</option>
                      {['Manual','Automatic','AMT','CVT'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                    <input type="number" name="seatingCapacity" value={formData.seatingCapacity} onChange={handleFormChange}
                      placeholder="e.g., 5" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Engine (CC)</label>
                    <input type="number" name="engineCC" value={formData.engineCC} onChange={handleFormChange}
                      placeholder="e.g., 1197" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                  <input type="text" name="mileage" value={formData.mileage} onChange={handleFormChange}
                    placeholder="e.g., 22 kmpl" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                {/* Image */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Image</label>
                  {formData.sideImage ? (
                    <div className="relative inline-block">
                      <img src={formData.sideImage} alt="Vehicle" className="w-48 h-32 object-cover rounded-lg border" />
                      <button type="button" onClick={() => setFormData(p => ({ ...p, sideImage: '' }))}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input type="url" placeholder="Paste image URL..."
                        onChange={e => { if (e.target.value) setFormData(p => ({ ...p, sideImage: e.target.value })); }}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                      <p className="text-xs text-gray-400 mt-1">Enter a direct image URL</p>
                    </div>
                  )}
                </div>
              </>}

              {/* ── STEP 3: Default Pricing ── */}
              {formStep === 3 && <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Default Pricing</h3>
                  <p className="text-xs text-gray-500 mb-4">Default price across all cities. Override per city in the next step.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price/Day (₹)</label>
                    <input type="number" name="basePricePerDay" value={formData.basePricePerDay} onChange={handleFormChange}
                      placeholder="e.g., 1500" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Discount (%)</label>
                    <input type="number" name="weeklyDiscount" value={formData.weeklyDiscount} onChange={handleFormChange}
                      placeholder="e.g., 10" min="0" max="100" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Discount (%)</label>
                    <input type="number" name="monthlyDiscount" value={formData.monthlyDiscount} onChange={handleFormChange}
                      placeholder="e.g., 20" min="0" max="100" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </>}

              {/* ── STEP 4: City-wise Pricing ── */}
              {formStep === 4 && <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">City-wise Pricing <span className="text-gray-400 font-normal">(Optional)</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">Select cities and set a different price for each.</p>
                    </div>
                    {selectedCities.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{selectedCities.length} selected</span>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    {loadingLocations ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading cities...
                      </div>
                    ) : serviceLocations.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">No cities configured for this service.</p>
                    ) : (
                      <>
                        {/* Step 1 — Select */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-500">Step 1: Select cities</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setSelectedCities(serviceLocations.map(l => l.id))}
                                className="text-xs text-blue-600 hover:underline">Select All</button>
                              {selectedCities.length > 0 && <>
                                <span className="text-xs text-gray-300">|</span>
                                <button type="button" onClick={() => { setSelectedCities([]); setCityPrices({}); }}
                                  className="text-xs text-gray-400 hover:text-red-500 hover:underline">Clear All</button>
                              </>}
                            </div>
                          </div>
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search cities..." value={citySearch}
                              onChange={e => setCitySearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                            {serviceLocations.filter(loc =>
                              !citySearch || loc.name.toLowerCase().includes(citySearch.toLowerCase()) || loc.state.toLowerCase().includes(citySearch.toLowerCase())
                            ).map(loc => {
                              const isSel = selectedCities.includes(loc.id);
                              return (
                                <button key={loc.id} type="button"
                                  onClick={() => {
                                    setSelectedCities(prev => isSel ? prev.filter(id => id !== loc.id) : [...prev, loc.id]);
                                    if (isSel) setCityPrices(prev => { const n = { ...prev }; delete n[loc.id]; return n; });
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                                    isSel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                                  }`}>
                                  {isSel ? <CheckCircle className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                                  {loc.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step 2 — Prices */}
                        {selectedCities.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">
                              Step 2: Set pricing <span className="font-normal text-gray-400">(leave blank to use default)</span>
                            </p>
                            <div className="space-y-3">
                              {selectedCities.map(locId => {
                                const loc = serviceLocations.find(l => l.id === locId);
                                if (!loc) return null;
                                const cp = cityPrices[locId] || { basePricePerDay: '', kmLimit: '', extraKmRate: '', securityDeposit: '' };
                                const upd = (field: string, val: string) =>
                                  setCityPrices(prev => ({ ...prev, [locId]: { ...cp, [field]: val } }));
                                return (
                                  <div key={locId} className="rounded-lg border border-blue-200 bg-blue-50 overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 bg-blue-100 border-b border-blue-200">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-800">{loc.name}</span>
                                        <span className="text-xs text-blue-500">{loc.state}</span>
                                      </div>
                                      <button type="button"
                                        onClick={() => {
                                          setSelectedCities(prev => prev.filter(id => id !== locId));
                                          setCityPrices(prev => { const n = { ...prev }; delete n[locId]; return n; });
                                        }}
                                        className="p-0.5 rounded-full hover:bg-blue-200 text-blue-400 hover:text-red-500">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 p-3">
                                      {[
                                        { field: 'basePricePerDay', label: 'Base Price/Day (₹)', ph: formData.basePricePerDay || '—' },
                                        { field: 'kmLimit', label: 'Km Limit/Day', ph: 'e.g. 150' },
                                        { field: 'extraKmRate', label: 'Extra Km Rate (₹/km)', ph: 'e.g. 12' },
                                        { field: 'securityDeposit', label: 'Security Deposit (₹)', ph: 'e.g. 5000' },
                                      ].map(({ field, label, ph }) => (
                                        <div key={field}>
                                          <label className="block text-xs text-gray-500 mb-1">{label}</label>
                                          <input type="number" min="0"
                                            value={(cp as any)[field]}
                                            onChange={e => upd(field, e.target.value)}
                                            placeholder={ph}
                                            className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Active */}
                <label className="flex items-center gap-2 pt-2">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleFormChange} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </>}

              {/* Navigation */}
              <div className="flex justify-between gap-3 pt-4 border-t">
                <div>
                  {formStep > 1 && (
                    <Button type="button" variant="outline" onClick={() => setFormStep(s => s - 1)}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                  {formStep < 4 ? (
                    <Button type="button" onClick={() => setFormStep(s => s + 1)} disabled={formStep === 1 && !formData.name}>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Update'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
