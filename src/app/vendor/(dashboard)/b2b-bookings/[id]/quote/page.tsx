// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Car, Users, MapPin, Calendar, Plus, Trash2, Send, ArrowLeft,
  AlertCircle, CheckCircle, Loader2, IndianRupee, Route, Copy,
  ChevronDown, ChevronUp, Bus, Truck, Bike, Wrench, Package, Star,
  XCircle, Edit3, X, Settings2, Fuel, Navigation, Lightbulb, Clock,
  Sparkles, StickyNote, PartyPopper, Info,
} from 'lucide-react';
import { useVendorVerification } from '@/contexts/VendorVerificationContext';

// ============ INTERFACES ============

interface BookingDetail {
  id: string;
  bookingNumber: string;
  companyName: string;
  customerName: string;
  serviceType: string;
  vehiclesRequired: number;
  passengerCount: number | null;
  vehicleCategory: string | null;
  pickupLocation: string;
  dropLocation: string | null;
  tripType: string;
  scheduledDate: string;
  scheduledTime: string;
  returnDate: string | null;
  returnTime: string | null;
  specialNotes: string | null;
  status: string;
  // CUSTOM_BULK bookings carry a full multi-day plan as JSON in this column.
  bulkBreakdown: string | null;
}

interface VehicleEntry {
  vendorFleetId: string;
  driverStaffId: string;
  useCustomPrice: boolean;
  basePrice: string;
  perKmRate: string;
  minimumKm: string;
  perHourRate: string;
  perDayRate: string;
  driverAllowance: string;
  nightCharges: string;
  extraKmCharge: string;
  extraHourCharge: string;
  // CUSTOM_BULK only: links this picker row to a specific day + service in
  // the customer's plan, plus the originally-requested vehicle label so the
  // vendor can match what was asked.
  dayIndex?: number;
  serviceIdx?: number;
  serviceType?: string;
  requestedVehicle?: string;
  // Self-drive only: where the customer picks up / drops the vehicle.
  // Shown to the customer + manager once the quote is accepted.
  pickupPoint?: string;
}

// Module-level slug map so both the fleet fetch and the per-day filter
// (used inside CUSTOM_BULK pickers) agree on which fleet rows belong to
// which service type.
const SERVICE_SLUG_MAP: Record<string, string[]> = {
  car: ['chauffeur-car-rental', 'car-rental', 'car'],
  selfdrive: ['self-drive-car-rentals', 'self-drive', 'selfdrive'],
  'self-drive': ['self-drive-car-rentals', 'self-drive', 'selfdrive'],
  bus: ['bus-rental', 'bus'],
  bike: ['bike-rental', 'bike-on-rent', 'bike'],
  truck: ['truck-rental', 'truck'],
  luxury: ['luxury-car-rental', 'luxury'],
  equipment: ['equipment-rental', 'equipment'],
  packers: ['packers-and-movers', 'packers'],
};

interface OverallPricing {
  basePrice: string;
  perKmRate: string;
  // Min km expected per vehicle. Drives the breakdown total:
  // basePrice + (perKmRate × minimumKm) + driverAllowance.
  minimumKm: string;
  perHourRate: string;
  perDayRate: string;
  driverAllowance: string;
  nightCharges: string;
  extraKmCharge: string;
  extraHourCharge: string;
  // Flat per-vehicle override. When set (>0) it replaces the
  // breakdown total when pricingMode === 'final'.
  finalAmount: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  inclusions: string[];
  exclusions: string[];
  termsConditions: string[];
  dailyRateHint?: number;
  kmLimitPerDayHint?: number;
  extraKmRateHint?: number;
  securityDepositHint?: number;
  isActive: boolean;
  isDefault: boolean;
}

const EMPTY_PRICING: OverallPricing = {
  basePrice: '', perKmRate: '', minimumKm: '', perHourRate: '', perDayRate: '',
  driverAllowance: '', nightCharges: '', extraKmCharge: '', extraHourCharge: '',
  finalAmount: '',
};

const EMPTY_VEHICLE: VehicleEntry = {
  vendorFleetId: '', driverStaffId: '', useCustomPrice: false,
  ...EMPTY_PRICING,
};

const SERVICE_CONFIG: Record<string, { label: string; icon: any }> = {
  car: { label: 'Car Rental', icon: Car },
  'self-drive': { label: 'Self Drive', icon: Car },
  bus: { label: 'Bus Rental', icon: Bus },
  truck: { label: 'Truck Rental', icon: Truck },
  bike: { label: 'Bike Rental', icon: Bike },
  equipment: { label: 'Equipment', icon: Wrench },
  packers: { label: 'Packers & Movers', icon: Package },
  luxury: { label: 'Luxury Car', icon: Star },
  CUSTOM_BULK: { label: 'Multi-Day Event', icon: PartyPopper },
};

// Styling/labelling for service chips inside the CUSTOM_BULK day-wise plan.
// CustomBookingForm writes service types without the hyphen ('selfdrive'),
// while older single-service B2B uses 'self-drive' — accept both.
const SERVICE_META: Record<string, { Icon: any; cls: string; label: string }> = {
  car:          { Icon: Car,     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Car Rental'   },
  selfdrive:    { Icon: Car,     cls: 'bg-sky-50 text-sky-700 border-sky-200',             label: 'Self Drive'   },
  'self-drive': { Icon: Car,     cls: 'bg-sky-50 text-sky-700 border-sky-200',             label: 'Self Drive'   },
  bus:          { Icon: Bus,     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Bus'          },
  truck:        { Icon: Truck,   cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Truck'        },
  bike:         { Icon: Bike,    cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Bike'         },
  equipment:    { Icon: Wrench,  cls: 'bg-cyan-50 text-cyan-700 border-cyan-200',          label: 'Equipment'    },
  packers:      { Icon: Package, cls: 'bg-pink-50 text-pink-700 border-pink-200',          label: 'Packers'      },
  luxury:       { Icon: Star,    cls: 'bg-purple-50 text-purple-700 border-purple-200',    label: 'Luxury Car'   },
};

// Resolve a service type to its self-drive flag — covers both spellings.
const isSelfDriveService = (t?: string) => t === 'selfdrive' || t === 'self-drive';

const formatDayLabel = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly',
};

// Pricing fields for non-self-drive services
function getPricingFields(serviceType: string, tripType: string): string[] {
  if (tripType === 'HOURLY' || tripType === 'LOCAL') {
    return ['basePrice', 'perHourRate', 'perKmRate', 'driverAllowance', 'nightCharges'];
  }
  if (tripType === 'ROUND_TRIP' || tripType === 'OUTSTATION') {
    return ['basePrice', 'perKmRate', 'minimumKm', 'perDayRate', 'driverAllowance', 'nightCharges', 'extraKmCharge'];
  }
  return ['basePrice', 'perKmRate', 'minimumKm', 'driverAllowance', 'nightCharges'];
}

const FIELD_LABELS: Record<string, string> = {
  basePrice: 'Base Price (Rs.)',
  perKmRate: 'Per KM Rate (Rs.)',
  minimumKm: 'Minimum KM',
  perHourRate: 'Per Hour Rate (Rs.)',
  perDayRate: 'Per Day Rate (Rs.)',
  driverAllowance: 'Driver Allowance (Rs.)',
  nightCharges: 'Night Charges (Rs.)',
  extraKmCharge: 'Extra KM Charge (Rs.)',
  extraHourCharge: 'Extra Hour Charge (Rs.)',
};

// ============ SELF-DRIVE DEFAULTS ============

const SD_DEFAULT_INCLUSIONS = [
  'Vehicle with full tank',
  'Valid insurance & registration',
  'Basic maintenance during rental',
  '24x7 roadside assistance',
  'No hidden charges',
];

const SD_DEFAULT_EXCLUSIONS = [
  'Fuel charges',
  'Traffic challans/fines',
  'Toll charges',
  'Damage due to negligence',
  'Any unauthorized usage',
];

const SD_DEFAULT_TERMS = [
  'Valid driving license (2+ years old) required',
  'Original Aadhaar card required',
  'Security deposit refundable after inspection',
  'No inter-state travel without prior approval',
  'Late return charges: Rs.200/hour after 2 hours grace',
];

// ============ CAR RENTAL DEFAULTS ============

const CR_DEFAULT_INCLUSIONS = [
  'Professional driver',
  'Vehicle with AC',
  'Valid insurance & registration',
  'Fuel included as per package',
  '24x7 roadside assistance',
];

const CR_DEFAULT_EXCLUSIONS = [
  'Toll charges',
  'Parking charges',
  'State tax / border charges',
  'Night charges (after 10 PM)',
  'Extra km / extra hour charges',
];

const CR_DEFAULT_TERMS = [
  'Cancellation must be 24 hours before pickup',
  'Driver bata (food allowance) to be borne by customer',
  'Waiting charges apply after 45 minutes',
  'Route and stops as per booking only',
  'Payment to be settled before trip ends',
];

// ============ HELPER: Parse self-drive pref from specialNotes ============
function parseSelfDrivePref(notes: string | null): any {
  if (!notes) return null;
  try { return JSON.parse(notes); } catch {
    if (notes.includes('|') || notes.includes('Preferred:')) {
      const result: any = {};
      const parts = notes.split('|').map(s => s.trim());
      for (const part of parts) {
        if (part.startsWith('Preferred:')) {
          const val = part.replace('Preferred:', '').trim();
          const words = val.split(' ');
          result.vehicleBrand = words[0] || null;
          result.vehicleModelName = words.slice(1).join(' ') || null;
        }
        if (part.startsWith('Transmission:')) result.transmission = part.replace('Transmission:', '').trim();
        if (part.startsWith('Fuel:')) result.fuelType = part.replace('Fuel:', '').trim();
        if (part.startsWith('Category:')) result.vehicleCategory = part.replace('Category:', '').trim();
      }
      return Object.keys(result).length > 0 ? result : null;
    }
    return null;
  }
}

// ============ MAIN COMPONENT ============

export default function B2BQuoteSubmitPage({ params }: { params: { id: string } }) {
  const bookingId = params.id;
  const { isApproved, openVerificationModal } = useVendorVerification();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQuoteId = searchParams?.get('edit') || '';
  const isEditMode = !!editQuoteId;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [fleet, setFleet] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ---- Non-self-drive state ----
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([{ ...EMPTY_VEHICLE }]);
  const [overallPricing, setOverallPricing] = useState<OverallPricing>({ ...EMPTY_PRICING });
  // 'final'    → vendor enters one flat per-vehicle price
  // 'breakdown' → vendor fills the rate breakdown (base + km + allowance, etc.)
  const [pricingMode, setPricingMode] = useState<'final' | 'breakdown'>('breakdown');

  // ---- Self-drive state ----
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sdVehicles, setSdVehicles] = useState<{ vendorFleetId: string; totalPrice: string }[]>([{ vendorFleetId: '', totalPrice: '' }]);
  const [sdTotalPrice, setSdTotalPrice] = useState('');
  const [sdSecurityDeposit, setSdSecurityDeposit] = useState('');
  const [sdKmLimitPerDay, setSdKmLimitPerDay] = useState('200');
  const [sdExtraKmRate, setSdExtraKmRate] = useState('10');
  const [sdDeliveryCharges, setSdDeliveryCharges] = useState('');
  const [sdPickupCharges, setSdPickupCharges] = useState('');
  const [sdAdvancePercent, setSdAdvancePercent] = useState('30');
  const [sdValidityDays, setSdValidityDays] = useState('3');
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<'inclusions' | 'exclusions' | 'terms' | null>(null);
  const [newItem, setNewItem] = useState('');

  // ---- Common ----
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchData(); }, [bookingId]);

  // Set default inclusions/exclusions/terms based on service type
  useEffect(() => {
    if (!booking) return;
    if (isEditMode) return; // edit prefill effect handles inclusions/exclusions/terms
    if (inclusions.length > 0) return; // already set (don't override on re-render)
    if (booking.serviceType === 'self-drive') {
      setInclusions(SD_DEFAULT_INCLUSIONS);
      setExclusions(SD_DEFAULT_EXCLUSIONS);
      setTermsConditions(SD_DEFAULT_TERMS);
    } else {
      setInclusions(CR_DEFAULT_INCLUSIONS);
      setExclusions(CR_DEFAULT_EXCLUSIONS);
      setTermsConditions(CR_DEFAULT_TERMS);
    }
  }, [booking, isEditMode]);

  // Prefill state from an existing quote when editing.
  // Runs once booking is loaded so isSelfDrive is known.
  useEffect(() => {
    if (!isEditMode || !booking) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vendor/b2b-quotes/${editQuoteId}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status !== 'success' || !data.quote) {
          setError(data.error || 'Could not load the quote for editing');
          return;
        }
        const q = data.quote;
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(q.status)) {
          setError(`Quote cannot be edited once it is ${q.status}`);
          return;
        }

        // Parse stored notes JSON (carries inclusions/exclusions/terms and self-drive details)
        let parsedNotes: any = null;
        if (q.notes) {
          try { parsedNotes = JSON.parse(q.notes); } catch { parsedNotes = null; }
        }
        if (parsedNotes?.inclusions) setInclusions(parsedNotes.inclusions);
        if (parsedNotes?.exclusions) setExclusions(parsedNotes.exclusions);
        if (parsedNotes?.termsConditions) setTermsConditions(parsedNotes.termsConditions);
        setNotes(parsedNotes?.vendorMessage || (typeof q.notes === 'string' && !parsedNotes ? q.notes : ''));

        const qVehicles = q.quoteVehicles || [];

        if (booking.serviceType === 'self-drive') {
          // Self-drive prefill
          if (parsedNotes?.securityDeposit != null) setSdSecurityDeposit(String(parsedNotes.securityDeposit));
          if (parsedNotes?.kmLimitPerDay != null) setSdKmLimitPerDay(String(parsedNotes.kmLimitPerDay));
          if (parsedNotes?.extraKmRate != null) setSdExtraKmRate(String(parsedNotes.extraKmRate));
          if (parsedNotes?.deliveryCharges != null) setSdDeliveryCharges(String(parsedNotes.deliveryCharges));
          if (parsedNotes?.pickupCharges != null) setSdPickupCharges(String(parsedNotes.pickupCharges));
          if (parsedNotes?.advancePercent != null) setSdAdvancePercent(String(parsedNotes.advancePercent));
          if (parsedNotes?.validityDays != null) setSdValidityDays(String(parsedNotes.validityDays));
          if (parsedNotes?.pricePerVehicle != null) setSdTotalPrice(String(parsedNotes.pricePerVehicle));

          setSdVehicles(
            qVehicles.length > 0
              ? qVehicles.map((qv: any) => ({
                  vendorFleetId: qv.vendorFleetId || qv.vehicle?.id || '',
                  totalPrice: qv.basePrice != null ? String(qv.basePrice) : '',
                }))
              : [{ vendorFleetId: '', totalPrice: '' }]
          );
        } else {
          // Non-self-drive prefill
          const op: OverallPricing = { ...EMPTY_PRICING };
          if (parsedNotes) {
            if (parsedNotes.basePrice != null) op.basePrice = String(parsedNotes.basePrice);
            if (parsedNotes.perKmRate != null) op.perKmRate = String(parsedNotes.perKmRate);
            if (parsedNotes.minimumKm != null) op.minimumKm = String(parsedNotes.minimumKm);
            if (parsedNotes.perDayRate != null) op.perDayRate = String(parsedNotes.perDayRate);
            if (parsedNotes.driverAllowance != null) op.driverAllowance = String(parsedNotes.driverAllowance);
            if (parsedNotes.nightCharges != null) op.nightCharges = String(parsedNotes.nightCharges);
            if (parsedNotes.extraKmCharge != null) op.extraKmCharge = String(parsedNotes.extraKmCharge);
            if (parsedNotes.finalAmount != null && parsedNotes.finalAmount > 0) {
              op.finalAmount = String(parsedNotes.finalAmount);
            }
          }
          setOverallPricing(op);
          // Restore the pricing mode: explicit if saved, else infer from data.
          if (parsedNotes?.pricingMode === 'final' || parsedNotes?.pricingMode === 'breakdown') {
            setPricingMode(parsedNotes.pricingMode);
          } else if (parsedNotes?.finalAmount > 0) {
            setPricingMode('final');
          } else {
            setPricingMode('breakdown');
          }

          const pickupPoints: (string | null)[] = Array.isArray(parsedNotes?.vehiclePickupPoints)
            ? parsedNotes.vehiclePickupPoints
            : [];
          const savedDayMeta: any[] = Array.isArray(parsedNotes?.vehicleDayMeta)
            ? parsedNotes.vehicleDayMeta
            : [];
          const savedEditorState: any[] = Array.isArray(parsedNotes?.editorState)
            ? parsedNotes.editorState
            : [];

          // Preferred path: rebuild vehicles state directly from the saved
          // editorState blob. This is order-stable and carries every field
          // the editor needs.
          if (savedEditorState.length > 0) {
            setVehicles(savedEditorState.map((s: any) => ({
              vendorFleetId: s.vendorFleetId || '',
              driverStaffId: s.driverStaffId || '',
              useCustomPrice: !!s.useCustomPrice,
              basePrice: s.basePrice || '',
              perKmRate: s.perKmRate || '',
              minimumKm: s.minimumKm || '',
              perHourRate: s.perHourRate || '',
              perDayRate: s.perDayRate || '',
              driverAllowance: s.driverAllowance || '',
              nightCharges: s.nightCharges || '',
              extraKmCharge: s.extraKmCharge || '',
              extraHourCharge: s.extraHourCharge || '',
              pickupPoint: s.pickupPoint || '',
              dayIndex: typeof s.dayIndex === 'number' ? s.dayIndex : undefined,
              serviceIdx: typeof s.serviceIdx === 'number' ? s.serviceIdx : undefined,
              serviceType: s.serviceType || undefined,
              requestedVehicle: s.requestedVehicle || undefined,
            })));
          } else {
            // Legacy fallback: no editorState in notes. Use qVehicles + day
            // metadata (or bulkPlan slot walk for the oldest quotes).
            let fallbackSlots: { dayIndex: number; serviceIdx: number; serviceType: string; requestedVehicle: string }[] = [];
            if (isBulk && bulkPlan && savedDayMeta.length === 0) {
              (bulkPlan.days || []).forEach((day: any, dIdx: number) => {
                (day.services || []).forEach((svc: any, sIdx: number) => {
                  const requested = Array.isArray(svc.vehicles) ? svc.vehicles : [];
                  if (requested.length === 0) {
                    const total = Math.max(Number(svc.total_vehicles) || 1, 1);
                    for (let i = 0; i < total; i++) {
                      fallbackSlots.push({ dayIndex: dIdx, serviceIdx: sIdx, serviceType: svc.service_type, requestedVehicle: '' });
                    }
                    return;
                  }
                  requested.forEach((v: any) => {
                    const count = Math.max(Number(v.count) || 1, 1);
                    for (let i = 0; i < count; i++) {
                      fallbackSlots.push({
                        dayIndex: dIdx,
                        serviceIdx: sIdx,
                        serviceType: svc.service_type,
                        requestedVehicle: v.vehicle_name || v.vehicle_slug || '',
                      });
                    }
                  });
                });
              });
            }
            const dayMeta: any[] = savedDayMeta.length > 0 ? savedDayMeta : fallbackSlots;
            setVehicles(
              qVehicles.length > 0
                ? qVehicles.map((qv: any, idx: number) => {
                    const meta = dayMeta[idx] || {};
                    return {
                      vendorFleetId: qv.vendorFleetId || qv.vehicle?.id || '',
                      driverStaffId: qv.driverStaffId || qv.driver?.id || '',
                      useCustomPrice: false,
                      basePrice: qv.basePrice != null ? String(qv.basePrice) : '',
                      perKmRate: qv.perKmRate != null ? String(qv.perKmRate) : '',
                      perHourRate: qv.perHourRate != null ? String(qv.perHourRate) : '',
                      perDayRate: qv.perDayRate != null ? String(qv.perDayRate) : '',
                      driverAllowance: qv.driverAllowance != null ? String(qv.driverAllowance) : '',
                      nightCharges: qv.nightCharges != null ? String(qv.nightCharges) : '',
                      extraKmCharge: qv.extraKmCharge != null ? String(qv.extraKmCharge) : '',
                      extraHourCharge: qv.extraHourCharge != null ? String(qv.extraHourCharge) : '',
                      pickupPoint: pickupPoints[idx] || '',
                      dayIndex: typeof meta.dayIndex === 'number' ? meta.dayIndex : undefined,
                      serviceIdx: typeof meta.serviceIdx === 'number' ? meta.serviceIdx : undefined,
                      serviceType: meta.serviceType || undefined,
                      requestedVehicle: meta.requestedVehicle || undefined,
                    };
                  })
                : [{ ...EMPTY_VEHICLE }]
            );
          }
        }
      } catch (e) {
        console.error('Failed to load quote for edit:', e);
        if (!cancelled) setError('Failed to load quote for editing');
      }
    })();
    return () => { cancelled = true; };
  }, [isEditMode, editQuoteId, booking]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingRes, fleetRes, driversRes] = await Promise.all([
        fetch(`/api/b2b/bookings/${bookingId}`),
        fetch('/api/vendor/fleet'),
        fetch('/api/vendor/staff?role=DRIVER'),
      ]);

      const bookingData = await bookingRes.json();
      const fleetData = await fleetRes.json();
      const driversData = await driversRes.json();

      if (bookingData.status === 'success' || bookingData.booking) {
        setBooking(bookingData.booking || bookingData);
      }

      const allFleet = Array.isArray(fleetData) ? fleetData : (fleetData.vehicles || fleetData.fleet || []);
      const bookingServiceType = bookingData?.booking?.serviceType || bookingData?.serviceType;

      // Filter fleet for self-drive
      if (bookingServiceType === 'self-drive') {
        setFleet(allFleet.filter((v: any) => {
          if (!v.isActive) return false;
          const serviceSlug = v.services?.slug || '';
          const serviceName = (v.services?.name || '').toLowerCase();
          return serviceSlug.includes('self-drive') || serviceName.includes('self drive') || serviceName.includes('self-drive');
        }));

        // Fetch self-drive templates
        try {
          const templatesRes = await fetch('/api/vendor/self-drive-templates?activeOnly=true');
          const templatesData = await templatesRes.json();
          if (templatesData.success && templatesData.templates) {
            setTemplates(templatesData.templates);
          }
        } catch (e) { console.error('Failed to fetch templates:', e); }
      } else {
        // Filter fleet by service type (CUSTOM_BULK keeps the full fleet —
        // the per-day picker filters by each service's own type)
        const allowedSlugs = SERVICE_SLUG_MAP[bookingServiceType] || [];
        if (allowedSlugs.length > 0) {
          setFleet(allFleet.filter((v: any) => {
            const slug = v.services?.slug || '';
            return allowedSlugs.some((s: string) => slug.includes(s));
          }));
        } else {
          setFleet(allFleet);
        }
      }

      setDrivers(Array.isArray(driversData) ? driversData : (driversData.staff || driversData.drivers || []));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const isSelfDrive = booking?.serviceType === 'self-drive';
  const isBulk = booking?.serviceType === 'CUSTOM_BULK';
  const selfDrivePref = isSelfDrive ? parseSelfDrivePref(booking?.specialNotes || null) : null;
  const pricingFields = booking ? getPricingFields(booking.serviceType, booking.tripType) : [];

  // Parse the CUSTOM_BULK day-wise plan from the booking JSON. Vendors need
  // this to see exactly which vehicle the customer asked for on which day —
  // without it they were assigning arbitrary vehicles. Memoised so the seed
  // effect doesn't re-fire on every render.
  const bulkPlan: any = useMemo(() => {
    if (!isBulk || !booking?.bulkBreakdown) return null;
    try { return JSON.parse(booking.bulkBreakdown); } catch { return null; }
  }, [isBulk, booking?.bulkBreakdown]);

  // Calculate rental days for self-drive
  const rentalDays = (() => {
    if (!booking?.scheduledDate) return 1;
    const start = new Date(booking.scheduledDate);
    const end = booking.returnDate ? new Date(booking.returnDate) : start;
    const diffMs = end.getTime() - start.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(days, 1);
  })();

  // Seed the vehicle picker rows from the customer's day-wise plan once
  // the bulk booking loads. One picker row per requested vehicle, carrying
  // the day/service link so each row sits next to the right request.
  useEffect(() => {
    if (!isBulk || !bulkPlan || isEditMode) return;
    if (vehicles.some(v => v.dayIndex !== undefined)) return; // already seeded
    const seeded: VehicleEntry[] = [];
    (bulkPlan.days || []).forEach((day: any, dIdx: number) => {
      (day.services || []).forEach((svc: any, sIdx: number) => {
        const requested = Array.isArray(svc.vehicles) ? svc.vehicles : [];
        if (requested.length === 0) {
          // Still create one empty slot so the vendor has somewhere to pick.
          const totalSlots = Math.max(Number(svc.total_vehicles) || 1, 1);
          for (let i = 0; i < totalSlots; i++) {
            seeded.push({
              ...EMPTY_VEHICLE,
              dayIndex: dIdx,
              serviceIdx: sIdx,
              serviceType: svc.service_type,
            });
          }
          return;
        }
        requested.forEach((v: any) => {
          const count = Math.max(Number(v.count) || 1, 1);
          for (let i = 0; i < count; i++) {
            seeded.push({
              ...EMPTY_VEHICLE,
              dayIndex: dIdx,
              serviceIdx: sIdx,
              serviceType: svc.service_type,
              requestedVehicle: v.vehicle_name || v.vehicle_slug || '',
            });
          }
        });
      });
    });
    if (seeded.length > 0) setVehicles(seeded);
  }, [isBulk, bulkPlan, isEditMode]);

  // Filter the loaded fleet to a particular service type — used inside the
  // per-day pickers so a "bike" slot only lists bikes, etc.
  const filterFleetByService = (serviceType?: string): any[] => {
    if (!serviceType) return fleet;
    const slugs = SERVICE_SLUG_MAP[serviceType];
    if (!slugs || slugs.length === 0) return fleet;
    return fleet.filter((v: any) => {
      const slug = v.services?.slug || '';
      return slugs.some(s => slug.includes(s));
    });
  };

  // ============ NON-SELF-DRIVE HANDLERS ============

  const addVehicleRow = () => {
    if (booking && vehicles.length >= booking.vehiclesRequired) {
      setError(`Maximum ${booking.vehiclesRequired} vehicles required`);
      return;
    }
    setVehicles([...vehicles, { ...EMPTY_VEHICLE }]);
  };

  // Append a picker row scoped to a specific day + service in the bulk plan.
  // The booking-level vehiclesRequired cap doesn't apply here — that number is
  // the customer's total across all days, but the vendor often wants to offer
  // extra vehicles (alternatives) per day on a CUSTOM_BULK quote.
  const addVehicleForService = (dayIdx: number, serviceIdx: number, serviceType?: string) => {
    // Insert right after the last row that belongs to the same service so
    // the picker rows stay grouped in render order.
    const lastIdxForService = vehicles.reduce((acc, v, i) =>
      v.dayIndex === dayIdx && v.serviceIdx === serviceIdx ? i : acc, -1);
    const newEntry: VehicleEntry = {
      ...EMPTY_VEHICLE,
      dayIndex: dayIdx,
      serviceIdx: serviceIdx,
      serviceType,
    };
    if (lastIdxForService === -1) {
      setVehicles([...vehicles, newEntry]);
    } else {
      const next = [...vehicles];
      next.splice(lastIdxForService + 1, 0, newEntry);
      setVehicles(next);
    }
  };

  // Remove a picker row by absolute index. For CUSTOM_BULK we allow removing
  // even down to zero rows in a given service (the customer's intent stays
  // visible above); regular bookings keep the existing min-1 guard.
  const removeVehicleByIndex = (absIdx: number) => {
    if (!isBulk && vehicles.length <= 1) return;
    setVehicles(vehicles.filter((_, i) => i !== absIdx));
  };

  const removeVehicleRow = (index: number) => {
    if (vehicles.length <= 1) return;
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const updateVehicle = (index: number, field: string, value: any) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  // Copy this row's pickup point onto every other self-drive row. Vendors
  // typically run one garage so the same address is reused across days.
  const applyPickupToAllSelfDrive = (sourceIdx: number) => {
    const pickup = vehicles[sourceIdx]?.pickupPoint?.trim() || '';
    if (!pickup) return;
    setVehicles(vehicles.map((v, i) => {
      if (i === sourceIdx) return v;
      if (!isSelfDriveService(v.serviceType)) return v;
      return { ...v, pickupPoint: pickup };
    }));
  };

  const applyOverallToAll = () => {
    // finalAmount lives only at the overall level — it shouldn't be copied
    // onto each VehicleEntry (per-vehicle custom pricing has its own breakdown).
    const { finalAmount: _ignored, ...rest } = overallPricing;
    setVehicles(vehicles.map(v => ({ ...v, useCustomPrice: false, ...rest })));
  };

  const calcVehicleTotal = (entry: VehicleEntry | OverallPricing) => {
    // For the overall pricing entry, pricingMode picks the source.
    // For per-vehicle custom entries (toggled via useCustomPrice) we always
    // use the breakdown — custom pricing has its own breakdown inputs.
    if (entry === overallPricing && pricingMode === 'final') {
      return parseFloat((entry as any).finalAmount) || 0;
    }
    // Breakdown: basePrice + (perKmRate × minimumKm) + driverAllowance.
    // Other fields (perDayRate, nightCharges, extraKmCharge) are informational.
    const base = parseFloat((entry as any).basePrice) || 0;
    const perKm = parseFloat((entry as any).perKmRate) || 0;
    const minKm = parseFloat((entry as any).minimumKm) || 0;
    const driverAllow = parseFloat((entry as any).driverAllowance) || 0;
    return base + (perKm * minKm) + driverAllow;
  };

  const overallTotal = calcVehicleTotal(overallPricing);
  const grandTotal = vehicles.reduce((sum, v) => {
    const vTotal = v.useCustomPrice ? calcVehicleTotal(v) : overallTotal;
    return sum + vTotal;
  }, 0);

  // ============ SELF-DRIVE HANDLERS ============

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setInclusions(t.inclusions);
      setExclusions(t.exclusions);
      setTermsConditions(t.termsConditions);
      if (t.dailyRateHint) setSdTotalPrice((t.dailyRateHint * rentalDays).toString());
      if (t.kmLimitPerDayHint) setSdKmLimitPerDay(t.kmLimitPerDayHint.toString());
      if (t.extraKmRateHint) setSdExtraKmRate(t.extraKmRateHint.toString());
      if (t.securityDepositHint) setSdSecurityDeposit(t.securityDepositHint.toString());
    }
  };

  const addSdVehicle = () => {
    if (booking && sdVehicles.length >= booking.vehiclesRequired) {
      setError(`Maximum ${booking.vehiclesRequired} vehicles required`);
      return;
    }
    setSdVehicles([...sdVehicles, { vendorFleetId: '', totalPrice: '' }]);
  };

  const removeSdVehicle = (index: number) => {
    if (sdVehicles.length <= 1) return;
    setSdVehicles(sdVehicles.filter((_, i) => i !== index));
  };

  const updateSdVehicle = (index: number, field: string, value: string) => {
    const updated = [...sdVehicles];
    updated[index] = { ...updated[index], [field]: value };
    setSdVehicles(updated);
  };

  const sdPerVehiclePrice = parseFloat(sdTotalPrice) || 0;
  const sdDelivery = parseFloat(sdDeliveryCharges) || 0;
  const sdPickup = parseFloat(sdPickupCharges) || 0;
  const sdPerVehicleTotal = sdPerVehiclePrice + sdDelivery + sdPickup;
  const sdValidVehicles = sdVehicles.filter(v => v.vendorFleetId);
  const sdGrandTotal = (() => {
    // If any vehicle has custom price, use that; else use the common price
    return sdVehicles.reduce((sum, v) => {
      if (!v.vendorFleetId) return sum;
      const vPrice = v.totalPrice ? parseFloat(v.totalPrice) : sdPerVehiclePrice;
      return sum + vPrice + sdDelivery + sdPickup;
    }, 0);
  })();
  const sdAdvanceAmount = Math.round((sdGrandTotal * (parseInt(sdAdvancePercent) || 30)) / 100);
  const sdDailyRate = rentalDays > 0 ? sdPerVehiclePrice / rentalDays : 0;

  const addItem = (list: string[], setList: (items: string[]) => void) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setList([...list, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeListItem = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item));
  };

  // ============ SUBMIT ============

  const handleSubmit = async () => {
    setError('');

    if (isSelfDrive) {
      return handleSelfDriveSubmit();
    }
    return handleRegularSubmit();
  };

  const handleSelfDriveSubmit = async () => {
    if (sdValidVehicles.length === 0) {
      setError('Please select at least one vehicle');
      return;
    }
    if (!sdTotalPrice || sdPerVehiclePrice <= 0) {
      setError('Please enter the total price');
      return;
    }
    if (!sdSecurityDeposit) {
      setError('Please enter the security deposit');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build self-drive details JSON to store in notes
      const selfDriveDetails = {
        isSelfDriveQuote: true,
        rentalDays,
        dailyRate: Math.round(sdDailyRate),
        pricePerVehicle: sdPerVehiclePrice,
        securityDeposit: parseFloat(sdSecurityDeposit) || 0,
        kmLimitPerDay: parseInt(sdKmLimitPerDay) || 200,
        extraKmRate: parseFloat(sdExtraKmRate) || 10,
        deliveryCharges: sdDelivery,
        pickupCharges: sdPickup,
        advancePercent: parseInt(sdAdvancePercent) || 30,
        advanceAmount: sdAdvanceAmount,
        validityDays: parseInt(sdValidityDays) || 3,
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
      };

      const vehiclePricing = sdValidVehicles.map(v => {
        const vPrice = v.totalPrice ? parseFloat(v.totalPrice) : sdPerVehiclePrice;
        return {
          vendorFleetId: v.vendorFleetId,
          basePrice: vPrice,
          perDayRate: Math.round(vPrice / rentalDays),
          perKmRate: parseFloat(sdExtraKmRate) || 0,
          extraKmCharge: parseFloat(sdExtraKmRate) || 0,
        };
      });

      const endpoint = isEditMode
        ? `/api/vendor/b2b-quotes/${editQuoteId}`
        : '/api/vendor/b2b-quotes';
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditMode ? {} : { bookingId }),
          vehicles: sdValidVehicles.map(v => ({
            vendorFleetId: v.vendorFleetId,
            driverStaffId: null,
          })),
          pricePerVehicle: sdPerVehiclePrice,
          totalPrice: sdGrandTotal,
          vehiclePricing,
          notes: JSON.stringify(selfDriveDetails),
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSuccess(true);
        setTimeout(() => router.push(`/vendor/b2b-bookings/${bookingId}`), 2000);
      } else {
        setError(data.error || 'Failed to submit quote');
      }
    } catch (err) {
      setError('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegularSubmit = async () => {
    const validVehicles = vehicles.filter(v => v.vendorFleetId);
    if (validVehicles.length === 0) {
      setError('Please select at least one vehicle');
      return;
    }
    if (overallTotal <= 0 && !validVehicles.some(v => v.useCustomPrice && calcVehicleTotal(v) > 0)) {
      setError('Please enter pricing details');
      return;
    }
    // Self-drive rows intentionally have no driver — the customer drives.
    const missingDrivers = validVehicles.filter(v => !v.driverStaffId && !isSelfDriveService(v.serviceType));
    if (missingDrivers.length > 0) {
      setError('Please select a driver for each vehicle');
      return;
    }
    // Self-drive rows need a pickup point so the customer knows where to
    // collect the vehicle.
    const missingPickup = validVehicles.filter(v => isSelfDriveService(v.serviceType) && !v.pickupPoint?.trim());
    if (missingPickup.length > 0) {
      setError('Please add a pickup point for each self-drive vehicle');
      return;
    }

    setIsSubmitting(true);
    try {
      const vehiclePricing = validVehicles.map(v => {
        const pricing = v.useCustomPrice ? v : overallPricing;
        return {
          vendorFleetId: v.vendorFleetId,
          driverStaffId: v.driverStaffId || null,
          basePrice: parseFloat(pricing.basePrice) || 0,
          perKmRate: parseFloat(pricing.perKmRate) || 0,
          perHourRate: parseFloat(pricing.perHourRate) || 0,
          perDayRate: parseFloat(pricing.perDayRate) || 0,
          driverAllowance: parseFloat(pricing.driverAllowance) || 0,
          nightCharges: parseFloat(pricing.nightCharges) || 0,
          extraKmCharge: parseFloat(pricing.extraKmCharge) || 0,
          extraHourCharge: parseFloat(pricing.extraHourCharge) || 0,
        };
      });

      // Build quote details JSON with inclusions/exclusions/terms
      const quoteDetails = {
        isCarRentalQuote: true,
        serviceType: booking?.serviceType,
        tripType: booking?.tripType,
        pricePerVehicle: overallTotal,
        basePrice: parseFloat(overallPricing.basePrice) || 0,
        perKmRate: parseFloat(overallPricing.perKmRate) || 0,
        minimumKm: parseFloat(overallPricing.minimumKm) || 0,
        perDayRate: parseFloat(overallPricing.perDayRate) || 0,
        driverAllowance: parseFloat(overallPricing.driverAllowance) || 0,
        nightCharges: parseFloat(overallPricing.nightCharges) || 0,
        extraKmCharge: parseFloat(overallPricing.extraKmCharge) || 0,
        finalAmount: pricingMode === 'final' ? (parseFloat(overallPricing.finalAmount) || 0) : 0,
        pricingMode,
        // Per-row pickup points, aligned with the order of `vehicles` posted
        // alongside. Self-drive rows carry a non-empty string here.
        vehiclePickupPoints: validVehicles.map(v => v.pickupPoint?.trim() || null),
        // CUSTOM_BULK day-link metadata so edit-mode can rebuild the per-day
        // picker UI instead of falling back to the flat list.
        vehicleDayMeta: validVehicles.map(v => ({
          dayIndex: v.dayIndex ?? null,
          serviceIdx: v.serviceIdx ?? null,
          serviceType: v.serviceType ?? null,
          requestedVehicle: v.requestedVehicle ?? null,
        })),
        // Full editor state — the saved quoteVehicles rows in the DB come
        // back in an indeterminate order (createMany with cuid + same-instant
        // createdAt), so the index-based mapping above isn't reliable. This
        // blob is the source of truth for edit mode.
        editorState: validVehicles.map(v => ({
          vendorFleetId: v.vendorFleetId,
          driverStaffId: v.driverStaffId || '',
          useCustomPrice: !!v.useCustomPrice,
          basePrice: v.basePrice || '',
          perKmRate: v.perKmRate || '',
          minimumKm: v.minimumKm || '',
          perHourRate: v.perHourRate || '',
          perDayRate: v.perDayRate || '',
          driverAllowance: v.driverAllowance || '',
          nightCharges: v.nightCharges || '',
          extraKmCharge: v.extraKmCharge || '',
          extraHourCharge: v.extraHourCharge || '',
          pickupPoint: v.pickupPoint || '',
          dayIndex: v.dayIndex ?? null,
          serviceIdx: v.serviceIdx ?? null,
          serviceType: v.serviceType ?? null,
          requestedVehicle: v.requestedVehicle ?? null,
        })),
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
      };

      const endpoint = isEditMode
        ? `/api/vendor/b2b-quotes/${editQuoteId}`
        : '/api/vendor/b2b-quotes';
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditMode ? {} : { bookingId }),
          vehicles: validVehicles.map(v => ({
            vendorFleetId: v.vendorFleetId,
            driverStaffId: v.driverStaffId || null,
          })),
          pricePerVehicle: overallTotal,
          totalPrice: grandTotal,
          vehiclePricing,
          notes: JSON.stringify(quoteDetails),
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSuccess(true);
        setTimeout(() => router.push(`/vendor/b2b-bookings/${bookingId}`), 2000);
      } else {
        setError(data.error || 'Failed to submit quote');
      }
    } catch (err) {
      setError('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ============ RENDER STATES ============

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800">{isEditMode ? 'Quote Updated!' : 'Quote Submitted!'}</h2>
          <p className="text-green-600 mt-2">
            Your quote with {isSelfDrive ? sdValidVehicles.length : vehicles.filter(v => v.vendorFleetId).length} vehicles has been {isEditMode ? 'updated' : 'submitted'}.
            The manager will review and include it in the super quote.
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <p className="text-gray-500">Booking not found</p>
      </div>
    );
  }

  const svc = SERVICE_CONFIG[booking.serviceType] || SERVICE_CONFIG.car;
  const SvcIcon = svc.icon;
  const selectedFleetIds = isSelfDrive
    ? sdVehicles.map(v => v.vendorFleetId).filter(Boolean)
    : vehicles.map(v => v.vendorFleetId).filter(Boolean);
  const selectedDriverIds = vehicles.map(v => v.driverStaffId).filter(Boolean);

  // ============ RENDER ============

  return (
    <div className="pb-24">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
        <ArrowLeft className="w-4 h-4" /> Back to B2B Requests
      </button>

      {/* Booking Summary */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-6 h-6 text-teal-600" />
              <h1 className="text-xl font-bold text-teal-800">{booking.bookingNumber}</h1>
              <span className="text-sm font-mono text-teal-600 bg-teal-100 px-2 py-0.5 rounded">{booking.bookingNumber}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <SvcIcon className="w-4 h-4 text-teal-600" />
                {isSelfDrive ? 'Self Drive Rental' : `${svc.label} — ${TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}`}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                {isSelfDrive ? `Location: ${booking.pickupLocation}` : booking.pickupLocation}
                {!isSelfDrive && booking.dropLocation && ` → ${booking.dropLocation}`}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                {isSelfDrive
                  ? `${formatDate(booking.scheduledDate)}${booking.returnDate ? ` → ${formatDate(booking.returnDate)}` : ''} (${rentalDays} day${rentalDays > 1 ? 's' : ''})`
                  : `${formatDate(booking.scheduledDate)} at ${booking.scheduledTime}${booking.returnDate ? ` — Return: ${formatDate(booking.returnDate)}` : ''}`
                }
              </div>
              {!isSelfDrive && booking.vehicleCategory && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-500" />
                  Category: {booking.vehicleCategory}
                </div>
              )}
            </div>

            {/* Self-drive vehicle preference */}
            {isSelfDrive && selfDrivePref && (selfDrivePref.vehicleModelName || selfDrivePref.vehicleBrand) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-teal-800">Preferred:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {[selfDrivePref.vehicleBrand, selfDrivePref.vehicleModelName].filter(Boolean).join(' ')}
                </span>
                {selfDrivePref.transmission && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{selfDrivePref.transmission}</span>
                )}
                {selfDrivePref.fuelType && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{selfDrivePref.fuelType}</span>
                )}
                {selfDrivePref.minSeats && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{selfDrivePref.minSeats}+ seats</span>
                )}
              </div>
            )}

            {!isSelfDrive && booking.specialNotes && (
              <p className="mt-3 text-sm text-gray-600 italic">Notes: {booking.specialNotes}</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="bg-teal-100 rounded-xl p-4 text-center min-w-[80px]">
              <SvcIcon className="w-6 h-6 text-teal-700 mx-auto mb-1" />
              <p className="text-2xl font-bold text-teal-800">{booking.vehiclesRequired}</p>
              <p className="text-xs text-teal-600">Vehicles</p>
            </div>
            {booking.passengerCount && (
              <div className="bg-emerald-50 rounded-xl p-4 text-center min-w-[80px]">
                <Users className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-700">{booking.passengerCount}</p>
                <p className="text-xs text-emerald-600">Persons</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ CUSTOM_BULK — Customer's Day-wise Vehicle Request ============
          Shown BEFORE the quote form so the vendor reads exactly which vehicle the
          customer asked for on which day. Earlier the vendor only saw aggregate
          numbers and ended up assigning arbitrary vehicles. */}
      {isBulk && bulkPlan && (
        <div className="mt-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-900">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <p>
              <span className="font-semibold">Read carefully — </span>
              the customer has requested specific vehicles for each day below.
              Please match these in your quote so we can fulfil the booking correctly.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    Customer's Day-wise Request
                    {bulkPlan.occasion_name ? ` · ${bulkPlan.occasion_name}` : ''}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {bulkPlan.occasion_type && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700">
                        {bulkPlan.occasion_type}
                      </span>
                    )}
                    {bulkPlan.base_location && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <MapPin className="w-3 h-3" /> {bulkPlan.base_location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {bulkPlan.total_days && (
                  <div className="px-3 py-1.5 bg-white rounded-lg border border-purple-100 text-center">
                    <p className="text-lg font-extrabold text-purple-700 leading-none tabular-nums">{bulkPlan.total_days}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Days</p>
                  </div>
                )}
                {bulkPlan.total_people && (
                  <div className="px-3 py-1.5 bg-white rounded-lg border border-emerald-100 text-center">
                    <p className="text-lg font-extrabold text-emerald-700 leading-none tabular-nums">{bulkPlan.total_people}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">People</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {Array.isArray(bulkPlan.days) && bulkPlan.days.length > 0 ? bulkPlan.days.map((day: any, dIdx: number) => {
                const dayVehicleTotal = (day.services || []).reduce((sum: number, s: any) => {
                  if (typeof s.total_vehicles === 'number') return sum + s.total_vehicles;
                  if (Array.isArray(s.vehicles)) {
                    return sum + s.vehicles.reduce((a: number, v: any) => a + (Number(v.count) || 0), 0);
                  }
                  return sum;
                }, 0);
                // Duplicate-blocks are scoped to this DAY only — a vehicle or
                // driver used on Day 1 stays selectable for Day 2 etc., since
                // the same physical vehicle/driver can serve multiple days.
                const dayFleetIds = vehicles
                  .filter(v => v.dayIndex === dIdx && v.vendorFleetId)
                  .map(v => v.vendorFleetId);
                const dayDriverIds = vehicles
                  .filter(v => v.dayIndex === dIdx && v.driverStaffId)
                  .map(v => v.driverStaffId);
                return (
                  <div key={dIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-extrabold text-xs shrink-0">
                          D{dIdx + 1}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          Day {dIdx + 1}
                        </span>
                        {day.date && (
                          <span className="text-sm text-gray-600 font-medium">
                            · {formatDayLabel(day.date)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {dayVehicleTotal > 0 && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold tabular-nums">
                            {dayVehicleTotal} vehicle{dayVehicleTotal !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-gray-500 font-medium">
                          {(day.services || []).length} service{(day.services || []).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(day.services || []).map((svc: any, sIdx: number) => {
                        const meta = SERVICE_META[svc.service_type] || { Icon: Car, cls: 'bg-gray-50 text-gray-700 border-gray-200', label: svc.service_type };
                        const SvcIcon = meta.Icon;
                        // Pickers belonging to this exact day+service slot.
                        const pickerIdxs = vehicles
                          .map((v, i) => (v.dayIndex === dIdx && v.serviceIdx === sIdx ? i : -1))
                          .filter(i => i !== -1);
                        const serviceFleet = filterFleetByService(svc.service_type);
                        return (
                          <div key={sIdx} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${meta.cls}`}>
                                <SvcIcon className="w-3.5 h-3.5" />
                                {meta.label}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {svc.total_vehicles ? <span className="font-bold text-gray-700 tabular-nums">{svc.total_vehicles} veh</span> : null}
                                {svc.people_count ? <span className="font-medium">· {svc.people_count} pax</span> : null}
                                {svc.pickup_time ? <span className="font-medium">· {svc.pickup_time}</span> : null}
                              </div>
                            </div>
                            {Array.isArray(svc.vehicles) && svc.vehicles.length > 0 && (
                              <div className="mb-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Customer requested</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {svc.vehicles.map((v: any, vIdx: number) => (
                                    <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-700">
                                      <span className="font-bold tabular-nums text-purple-700">×{v.count}</span>
                                      <span className="truncate max-w-[220px]">
                                        {v.vehicle_name || v.vehicle_slug || 'Vehicle'}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(svc.pickup_location || svc.drop_location) && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1 flex-wrap">
                                {svc.pickup_location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" />{svc.pickup_location}</span>}
                                {svc.drop_location && (
                                  <>
                                    <span className="text-gray-300">→</span>
                                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" />{svc.drop_location}</span>
                                  </>
                                )}
                              </div>
                            )}
                            {svc.notes && (
                              <p className="flex items-start gap-1.5 text-xs text-gray-500 italic mt-1 mb-2">
                                <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                                {svc.notes}
                              </p>
                            )}

                            {/* Vendor's vehicle pickers for THIS service.
                                Renders in both new + edit mode now that the
                                saved quote carries day metadata. */}
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                                  <Car className="w-3.5 h-3.5" /> Your vehicles for this {meta.label.toLowerCase()}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => addVehicleForService(dIdx, sIdx, svc.service_type)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md text-xs font-medium transition"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add vehicle
                                </button>
                              </div>
                              {pickerIdxs.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No vehicles added yet. Use "Add vehicle" to assign from your fleet.</p>
                              ) : pickerIdxs.map((absIdx, slotNum) => {
                                const entry = vehicles[absIdx];
                                return (
                                  <div key={absIdx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-gray-500 w-6 shrink-0">#{slotNum + 1}</span>
                                      {entry.requestedVehicle && (
                                        <span className="text-[11px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
                                          Asked: {entry.requestedVehicle}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-2">
                                      <div className="flex-1 min-w-0">
                                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Vehicle</label>
                                        <select
                                          value={entry.vendorFleetId}
                                          onChange={(e) => updateVehicle(absIdx, 'vendorFleetId', e.target.value)}
                                          className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                                        >
                                          <option value="">Select vehicle...</option>
                                          {serviceFleet.map((v: any) => {
                                            const brandName = v.brands?.name || v.vehicle_models?.brands?.name || '';
                                            const modelName = v.vehicle_models?.name || v.vehicleName || 'Vehicle';
                                            const label = [brandName, modelName].filter(Boolean).join(' ');
                                            const extras = [v.fuelType, v.transmission, v.registrationNumber].filter(Boolean).join(' | ');
                                            return (
                                              <option key={v.id} value={v.id} disabled={dayFleetIds.includes(v.id) && entry.vendorFleetId !== v.id}>
                                                {label}{extras ? ` (${extras})` : ''}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </div>
                                      {isSelfDriveService(svc.service_type) ? (
                                        <div className="flex-1 min-w-0 flex items-end">
                                          <p className="text-[11px] text-sky-700 bg-sky-50 border border-sky-200 rounded-md px-2.5 py-2 w-full">
                                            <span className="font-semibold">Self-drive</span> — no driver. Customer drives the vehicle themselves.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="flex-1 min-w-0">
                                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Driver</label>
                                          <select
                                            value={entry.driverStaffId}
                                            onChange={(e) => updateVehicle(absIdx, 'driverStaffId', e.target.value)}
                                            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                                          >
                                            <option value="">Select driver...</option>
                                            {drivers.map((d: any) => (
                                              <option key={d.id} value={d.id} disabled={dayDriverIds.includes(d.id) && entry.driverStaffId !== d.id}>
                                                {d.name} ({d.phone})
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeVehicleByIndex(absIdx)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition md:mt-5 self-end"
                                        aria-label="Remove vehicle"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Self-drive pickup point — visible to
                                        the customer after they accept the
                                        quote and to the manager throughout. */}
                                    {isSelfDriveService(svc.service_type) && (() => {
                                      // Count other self-drive picker rows so we
                                      // only show the "Apply to all" button when
                                      // there's actually somewhere to copy to.
                                      const otherSelfDriveSlots = vehicles.reduce(
                                        (n, v, i) => (i !== absIdx && isSelfDriveService(v.serviceType) ? n + 1 : n),
                                        0,
                                      );
                                      return (
                                        <div>
                                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                                            <label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
                                              <MapPin className="w-3.5 h-3.5 text-sky-600" /> Pickup Point
                                              <span className="text-red-500">*</span>
                                            </label>
                                            {otherSelfDriveSlots > 0 && entry.pickupPoint?.trim() && (
                                              <button
                                                type="button"
                                                onClick={() => applyPickupToAllSelfDrive(absIdx)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded text-[10px] font-semibold transition"
                                                title="Copy this pickup point to every other self-drive vehicle in the quote"
                                              >
                                                <Copy className="w-3 h-3" /> Apply to all self-drive ({otherSelfDriveSlots})
                                              </button>
                                            )}
                                          </div>
                                          <input
                                            type="text"
                                            value={entry.pickupPoint || ''}
                                            onChange={(e) => updateVehicle(absIdx, 'pickupPoint', e.target.value)}
                                            placeholder="Where the customer picks up the vehicle, e.g. ABC Showroom, Satellite, Ahmedabad"
                                            className="w-full px-2.5 py-2 border border-sky-200 rounded-lg text-sm focus:outline-none focus:border-sky-500"
                                          />
                                        </div>
                                      );
                                    })()}

                                    {entry.vendorFleetId && (
                                      <button
                                        type="button"
                                        onClick={() => updateVehicle(absIdx, 'useCustomPrice', !entry.useCustomPrice)}
                                        className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-teal-600 transition"
                                      >
                                        {entry.useCustomPrice ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {entry.useCustomPrice ? 'Hide custom pricing' : 'Set custom pricing for this vehicle'}
                                      </button>
                                    )}

                                    {entry.useCustomPrice && (
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {pricingFields.map(field => (
                                          <div key={field}>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">{FIELD_LABELS[field]}</label>
                                            <input
                                              type="number"
                                              value={(entry as any)[field]}
                                              onChange={(e) => updateVehicle(absIdx, field, e.target.value)}
                                              placeholder="0"
                                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-teal-500"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-gray-500 text-center py-4">No day-wise breakdown provided.</p>
              )}
            </div>

            {bulkPlan.special_requirements && (
              <div className="border-t border-purple-100 px-6 py-3 bg-purple-50/40 text-sm text-purple-900">
                <span className="font-bold">Special requirements:</span> {bulkPlan.special_requirements}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ SELF-DRIVE QUOTE FORM ============ */}
      {isSelfDrive ? (
        <>
          {/* Template Selector */}
          {templates.length > 0 && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-200">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-teal-900">Quick Fill with Template</h3>
              </div>
              <p className="text-sm text-teal-700 mb-3">Load saved template to auto-fill inclusions, exclusions, terms & rates</p>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelection(e.target.value)}
                className="w-full px-4 py-2.5 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">-- Select a template (optional) --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.description && `- ${t.description}`}
                  </option>
                ))}
              </select>
              {selectedTemplateId && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Template loaded! You can still edit any field before sending.
                </div>
              )}
            </div>
          )}

          {/* Select Vehicles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-teal-600" />
                Select Vehicles ({sdVehicles.length})
              </h2>
              <button
                onClick={addSdVehicle}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Select self-drive vehicles from your fleet. You don't need to fill all {booking.vehiclesRequired} — submit what you have.
            </p>

            {fleet.length === 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                No self-drive vehicles found in your fleet. Please add self-drive vehicles first.
              </div>
            )}

            <div className="space-y-3">
              {sdVehicles.map((entry, index) => {
                const selectedVehicle = fleet.find(v => v.id === entry.vendorFleetId);
                return (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-8">#{index + 1}</span>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle</label>
                        <select
                          value={entry.vendorFleetId}
                          onChange={(e) => updateSdVehicle(index, 'vendorFleetId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                        >
                          <option value="">-- Select a car from fleet --</option>
                          {fleet.map((v) => {
                            const brandName = v.brands?.name || v.vehicle_models?.brands?.name || '';
                            const modelName = v.vehicle_models?.name || v.vehicleName || 'Vehicle';
                            const label = [brandName, modelName].filter(Boolean).join(' ');
                            const regNum = v.registrationNumber ? ` (${v.registrationNumber})` : '';
                            const specs = [v.transmission, v.fuelType].filter(Boolean).join(' | ');
                            return (
                              <option
                                key={v.id}
                                value={v.id}
                                disabled={selectedFleetIds.includes(v.id) && entry.vendorFleetId !== v.id}
                              >
                                {label}{regNum}{specs ? ` — ${specs}` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Custom price per vehicle (optional) */}
                      <div className="w-40">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Custom Price (opt.)</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rs.</span>
                          <input
                            type="number"
                            value={entry.totalPrice}
                            onChange={(e) => updateSdVehicle(index, 'totalPrice', e.target.value)}
                            placeholder={sdTotalPrice || '0'}
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {sdVehicles.length > 1 && (
                        <button
                          onClick={() => removeSdVehicle(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Selected vehicle details */}
                    {selectedVehicle && (
                      <div className="ml-8 flex items-center gap-3 text-xs text-gray-500">
                        {selectedVehicle.vehicle_models?.name && (
                          <span className="font-medium text-gray-700">{selectedVehicle.brands?.name || selectedVehicle.vehicle_models?.brands?.name} {selectedVehicle.vehicle_models.name}</span>
                        )}
                        {selectedVehicle.transmission && <span className="px-1.5 py-0.5 bg-gray-100 rounded">{selectedVehicle.transmission}</span>}
                        {selectedVehicle.fuelType && <span className="px-1.5 py-0.5 bg-gray-100 rounded">{selectedVehicle.fuelType}</span>}
                        {selectedVehicle.seatingCapacity && <span>{selectedVehicle.seatingCapacity} seater</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-teal-600" />
              Pricing
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Price per vehicle (for {rentalDays} day{rentalDays > 1 ? 's' : ''}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={sdTotalPrice}
                    onChange={(e) => setSdTotalPrice(e.target.value)}
                    placeholder={`${rentalDays * 2500}`}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                {sdPerVehiclePrice > 0 && rentalDays > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Daily rate: Rs.{Math.round(sdDailyRate).toLocaleString('en-IN')}/day</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={sdSecurityDeposit}
                    onChange={(e) => setSdSecurityDeposit(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KM Limit Per Day</label>
                <input
                  type="number"
                  value={sdKmLimitPerDay}
                  onChange={(e) => setSdKmLimitPerDay(e.target.value)}
                  placeholder="200"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra KM Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                  <input
                    type="number"
                    value={sdExtraKmRate}
                    onChange={(e) => setSdExtraKmRate(e.target.value)}
                    placeholder="10"
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/km</span>
                </div>
              </div>
              {selfDrivePref?.isDeliveryRequested && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Navigation className="w-4 h-4" /> Delivery Charges
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                      <input
                        type="number"
                        value={sdDeliveryCharges}
                        onChange={(e) => setSdDeliveryCharges(e.target.value)}
                        placeholder="500"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Charges</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                      <input
                        type="number"
                        value={sdPickupCharges}
                        onChange={(e) => setSdPickupCharges(e.target.value)}
                        placeholder="500"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment</label>
                <div className="flex items-center gap-3">
                  <select
                    value={sdAdvancePercent}
                    onChange={(e) => setSdAdvancePercent(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                  >
                    <option value="20">20%</option>
                    <option value="25">25%</option>
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                  </select>
                  <span className="text-gray-600 text-sm">= Rs.{sdAdvanceAmount.toLocaleString('en-IN')} advance</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Valid For</label>
                <select
                  value={sdValidityDays}
                  onChange={(e) => setSdValidityDays(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                >
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                </select>
              </div>
            </div>

            {/* Total Summary */}
            <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Base Price per vehicle ({rentalDays} days)</span>
                <span className="text-gray-900 font-semibold">Rs. {sdPerVehiclePrice.toLocaleString('en-IN')}</span>
              </div>
              {(sdDelivery > 0 || sdPickup > 0) && (
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-600">Delivery + Pickup (per vehicle)</span>
                  <span className="text-gray-900">Rs. {(sdDelivery + sdPickup).toLocaleString('en-IN')}</span>
                </div>
              )}
              {sdValidVehicles.length > 1 && (
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-600">Vehicles</span>
                  <span className="text-gray-900">x {sdValidVehicles.length}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-teal-200 pt-2 mt-2">
                <span className="font-semibold text-teal-800">Grand Total</span>
                <span className="text-2xl font-bold text-teal-700">Rs. {sdGrandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-teal-700">Advance ({sdAdvancePercent}%)</span>
                <span className="font-semibold text-teal-600">Rs. {sdAdvanceAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                <span>Security Deposit (refundable)</span>
                <span>Rs. {(parseFloat(sdSecurityDeposit) || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                KM Limit: {sdKmLimitPerDay} km/day | Extra KM: Rs.{sdExtraKmRate}/km
              </div>
            </div>
          </div>

          {/* Inclusions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Inclusions ({inclusions.length})
              </h2>
              <button
                type="button"
                onClick={() => setEditMode(editMode === 'inclusions' ? null : 'inclusions')}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-4 h-4" />
                {editMode === 'inclusions' ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {inclusions.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                  {item}
                  {editMode === 'inclusions' && (
                    <button type="button" onClick={() => removeListItem(inclusions, setInclusions, item)} className="hover:text-green-900">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editMode === 'inclusions' && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(inclusions, setInclusions))}
                  placeholder="Add inclusion..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <button type="button" onClick={() => addItem(inclusions, setInclusions)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Exclusions ({exclusions.length})
              </h2>
              <button
                type="button"
                onClick={() => setEditMode(editMode === 'exclusions' ? null : 'exclusions')}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-4 h-4" />
                {editMode === 'exclusions' ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {exclusions.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
                  {item}
                  {editMode === 'exclusions' && (
                    <button type="button" onClick={() => removeListItem(exclusions, setExclusions, item)} className="hover:text-red-900">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editMode === 'exclusions' && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(exclusions, setExclusions))}
                  placeholder="Add exclusion..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <button type="button" onClick={() => addItem(exclusions, setExclusions)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Terms & Conditions ({termsConditions.length})</h2>
              <button
                type="button"
                onClick={() => setEditMode(editMode === 'terms' ? null : 'terms')}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-4 h-4" />
                {editMode === 'terms' ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="space-y-2">
              {termsConditions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-teal-500 font-bold">{idx + 1}.</span>
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  {editMode === 'terms' && (
                    <button type="button" onClick={() => removeListItem(termsConditions, setTermsConditions, item)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editMode === 'terms' && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(termsConditions, setTermsConditions))}
                  placeholder="Add term..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <button type="button" onClick={() => addItem(termsConditions, setTermsConditions)} className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Notes for Customer (Optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes or messages..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-center"
            >
              Cancel
            </button>
            <button
              onClick={isApproved ? handleSubmit : openVerificationModal}
              disabled={isSubmitting || !sdTotalPrice || !sdSecurityDeposit || sdValidVehicles.length === 0}
              className="flex-1 flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl transition disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : `${isEditMode ? 'Update' : 'Send'} Quote — Rs. ${sdGrandTotal.toLocaleString('en-IN')}`}
            </button>
          </div>
        </>
      ) : (
        /* ============ NON-SELF-DRIVE QUOTE FORM (existing) ============ */
        <>
          {/* Overall Pricing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-teal-600" />
                Pricing (per vehicle)
              </h2>
              <button
                onClick={applyOverallToAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-sm font-medium transition"
              >
                <Copy className="w-4 h-4" /> Apply to All Vehicles
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Pick how you want to price this quote — either a single flat per-vehicle amount,
              or a detailed rate breakdown.
            </p>

            {/* Mode toggle */}
            <div className="inline-flex p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPricingMode('final')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  pricingMode === 'final'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Final Amount
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('breakdown')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  pricingMode === 'breakdown'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Per-Vehicle Rate
              </button>
            </div>

            {pricingMode === 'final' ? (
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
                  Final Amount per Vehicle
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rs.</span>
                  <input
                    type="number"
                    value={overallPricing.finalAmount}
                    onChange={(e) => setOverallPricing({ ...overallPricing, finalAmount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full pl-10 pr-3 py-2.5 border border-teal-200 rounded-lg text-base font-medium focus:outline-none focus:border-teal-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  One flat number — used as the per-vehicle total in this quote.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {pricingFields.map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{FIELD_LABELS[field]}</label>
                    <input
                      type="number"
                      value={(overallPricing as any)[field]}
                      onChange={(e) => setOverallPricing({ ...overallPricing, [field]: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {overallTotal > 0 && (
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg gap-3 flex-wrap">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-teal-700">Per Vehicle Total</span>
                  <span className="text-[11px] text-teal-600 italic">
                    {pricingMode === 'final' ? (
                      'Flat amount'
                    ) : (() => {
                      const base = parseFloat(overallPricing.basePrice) || 0;
                      const perKm = parseFloat(overallPricing.perKmRate) || 0;
                      const minKm = parseFloat(overallPricing.minimumKm) || 0;
                      const driver = parseFloat(overallPricing.driverAllowance) || 0;
                      const parts: string[] = [];
                      if (base > 0) parts.push(`Base ${base}`);
                      if (perKm > 0 && minKm > 0) parts.push(`${perKm} × ${minKm} km = ${perKm * minKm}`);
                      if (driver > 0) parts.push(`Driver ${driver}`);
                      return parts.length > 0 ? parts.join(' + ') : 'Base Price + Driver Allowance';
                    })()}
                  </span>
                </div>
                <span className="text-lg font-bold text-teal-800">Rs. {overallTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Vehicles & Drivers — CUSTOM_BULK uses the inline per-day picker
              under each day above (both new + edit mode), so skip this flat
              list entirely for bulk quotes. */}
          {!isBulk && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-teal-600" />
                Select Vehicles & Drivers ({vehicles.length})
              </h2>
              <button
                onClick={addVehicleRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Select vehicles you can provide. You don't need to fill all {booking.vehiclesRequired} — submit what you have.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-3">
              {vehicles.map((entry, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-8">#{index + 1}</span>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle</label>
                      <select
                        value={entry.vendorFleetId}
                        onChange={(e) => updateVehicle(index, 'vendorFleetId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                      >
                        <option value="">Select vehicle...</option>
                        {fleet.map((v) => {
                          const brandName = v.brands?.name || v.vehicle_models?.brands?.name || '';
                          const modelName = v.vehicle_models?.name || v.vehicleName || 'Vehicle';
                          const label = [brandName, modelName].filter(Boolean).join(' ');
                          const extras = [v.fuelType, v.transmission, v.registrationNumber].filter(Boolean).join(' | ');
                          return (
                            <option key={v.id} value={v.id} disabled={selectedFleetIds.includes(v.id) && entry.vendorFleetId !== v.id}>
                              {label}{extras ? ` (${extras})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
                      <select
                        value={entry.driverStaffId}
                        onChange={(e) => updateVehicle(index, 'driverStaffId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                      >
                        <option value="">Select driver...</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id} disabled={selectedDriverIds.includes(d.id) && entry.driverStaffId !== d.id}>
                            {d.name} ({d.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                    {vehicles.length > 1 && (
                      <button
                        onClick={() => removeVehicleRow(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition mt-5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {entry.vendorFleetId && (
                    <button
                      onClick={() => updateVehicle(index, 'useCustomPrice', !entry.useCustomPrice)}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-teal-600 transition ml-8"
                    >
                      {entry.useCustomPrice ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {entry.useCustomPrice ? 'Hide custom pricing' : 'Set custom pricing for this vehicle'}
                    </button>
                  )}

                  {entry.useCustomPrice && (
                    <div className="ml-8 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {pricingFields.map(field => (
                        <div key={field}>
                          <label className="block text-xs text-gray-500 mb-0.5">{FIELD_LABELS[field]}</label>
                          <input
                            type="number"
                            value={(entry as any)[field]}
                            onChange={(e) => updateVehicle(index, field, e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Inclusions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Inclusions ({inclusions.length})
              </h2>
              <button
                type="button"
                onClick={() => setEditMode(editMode === 'inclusions' ? null : 'inclusions')}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-4 h-4" />
                {editMode === 'inclusions' ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {inclusions.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                  {item}
                  {editMode === 'inclusions' && (
                    <button type="button" onClick={() => removeListItem(inclusions, setInclusions, item)} className="hover:text-green-900">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editMode === 'inclusions' && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(inclusions, setInclusions))}
                  placeholder="Add inclusion..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <button type="button" onClick={() => addItem(inclusions, setInclusions)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Exclusions ({exclusions.length})
              </h2>
              <button
                type="button"
                onClick={() => setEditMode(editMode === 'exclusions' ? null : 'exclusions')}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-4 h-4" />
                {editMode === 'exclusions' ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {exclusions.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
                  {item}
                  {editMode === 'exclusions' && (
                    <button type="button" onClick={() => removeListItem(exclusions, setExclusions, item)} className="hover:text-red-900">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editMode === 'exclusions' && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(exclusions, setExclusions))}
                  placeholder="Add exclusion..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <button type="button" onClick={() => addItem(exclusions, setExclusions)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Terms & Conditions ({termsConditions.length})</h2>
              <button
                type="button"
                onClick={() => setEditMode(editMode === 'terms' ? null : 'terms')}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-4 h-4" />
                {editMode === 'terms' ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="space-y-2">
              {termsConditions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-teal-500 font-bold">{idx + 1}.</span>
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  {editMode === 'terms' && (
                    <button type="button" onClick={() => removeListItem(termsConditions, setTermsConditions, item)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editMode === 'terms' && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(termsConditions, setTermsConditions))}
                  placeholder="Add term..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <button type="button" onClick={() => addItem(termsConditions, setTermsConditions)} className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Summary & Submit */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Quote Summary</h2>

            <div className="space-y-2">
              {vehicles.filter(v => v.vendorFleetId).map((v, i) => {
                const fl = fleet.find(f => f.id === v.vendorFleetId);
                const dr = drivers.find(d => d.id === v.driverStaffId);
                const vTotal = v.useCustomPrice ? calcVehicleTotal(v) : overallTotal;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium text-gray-800">
                        {fl?.vehicleName || 'Vehicle'} {fl?.registrationNumber ? `(${fl.registrationNumber})` : ''}
                      </span>
                      {dr && <span className="text-gray-500 ml-2">| {dr.name}</span>}
                    </div>
                    <span className="font-bold text-gray-800">Rs. {vTotal.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl border border-teal-200">
              <div>
                <p className="text-sm text-teal-600">Grand Total ({vehicles.filter(v => v.vendorFleetId).length} vehicles)</p>
                <p className="text-2xl font-bold text-teal-800">Rs. {grandTotal.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special conditions, availability notes..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={isApproved ? handleSubmit : openVerificationModal}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl transition disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : `${isEditMode ? 'Update' : 'Submit'} Quote — Rs. ${grandTotal.toLocaleString('en-IN')}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
