'use client';

import {
  Truck,
  Box,
  Building2,
  Wrench,
  UserCheck,
  StickyNote,
  MapPin,
  Calendar,
  Weight,
  Package as PackageIcon,
  ArrowRightLeft,
  ArrowRight,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Phone,
  User as UserIcon,
  Repeat,
} from 'lucide-react';
import {
  TruckDetailFields,
  formatTruckBodyType,
  formatTripDirection,
  formatTruckGoodsType,
  formatTruckVolume,
  formatTruckDate,
} from '@/lib/truck-display';

interface TruckRequestDetailsProps {
  data: TruckDetailFields;
  variant?: 'default' | 'compact';
  hideVehicle?: boolean;
}

interface FieldDef {
  icon?: any;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

interface SectionDef {
  title: string;
  icon: any;
  tint: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose';
  fields: FieldDef[];
}

const TINTS: Record<string, { bg: string; iconBg: string; iconText: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-50/40', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', ring: 'ring-emerald-100' },
  sky: { bg: 'bg-sky-50/40', iconBg: 'bg-sky-100', iconText: 'text-sky-700', ring: 'ring-sky-100' },
  amber: { bg: 'bg-amber-50/40', iconBg: 'bg-amber-100', iconText: 'text-amber-700', ring: 'ring-amber-100' },
  violet: { bg: 'bg-violet-50/40', iconBg: 'bg-violet-100', iconText: 'text-violet-700', ring: 'ring-violet-100' },
  rose: { bg: 'bg-rose-50/40', iconBg: 'bg-rose-100', iconText: 'text-rose-700', ring: 'ring-rose-100' },
};

const FieldRow = ({ icon: Icon, label, value, highlight }: FieldDef) => {
  if (value === null || value === undefined || value === '' || value === false) return null;
  return (
    <div
      className={`flex items-start gap-2.5 ${
        highlight ? 'bg-white border border-emerald-200 shadow-sm' : 'bg-white/70'
      } rounded-xl p-2.5 transition-shadow hover:shadow-sm`}
    >
      {Icon && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center mt-0.5">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{label}</p>
        <p className={`text-sm ${highlight ? 'font-extrabold text-emerald-700' : 'font-semibold text-gray-900'} mt-0.5 break-words`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon: Icon, tint, fields }: SectionDef) => {
  const visible = fields.filter((f) => !(f.value === null || f.value === undefined || f.value === '' || f.value === false));
  if (!visible.length) return null;
  const t = TINTS[tint];
  return (
    <div className={`rounded-2xl border border-gray-200 ${t.bg} p-4 sm:p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${t.iconBg} ${t.iconText} flex items-center justify-center ring-2 ${t.ring}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">{title}</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visible.map((f, i) => (
          <FieldRow key={i} {...f} />
        ))}
      </div>
    </div>
  );
};

export default function TruckRequestDetails({
  data,
  hideVehicle,
}: TruckRequestDetailsProps) {
  const bodyTypeLabel = formatTruckBodyType(data.truckBodyType);
  const tripDirLabel = formatTripDirection(data.tripDirection);
  const goodsLabel = formatTruckGoodsType(data.goodsType);
  const volumeLabel = formatTruckVolume(data.estimatedVolume) || data.estimatedVolume;

  const tripFields: FieldDef[] = [
    !hideVehicle && data.vehicleCategoryName
      ? { icon: Truck, label: 'Truck Type', value: data.vehicleCategoryName, highlight: true }
      : null,
    bodyTypeLabel ? { icon: Box, label: 'Body Type', value: bodyTypeLabel } : null,
    tripDirLabel ? { icon: ArrowRightLeft, label: 'Trip Direction', value: tripDirLabel } : null,
    data.pickupPincode ? { icon: MapPin, label: 'Pickup Pincode', value: data.pickupPincode } : null,
    data.dropPincode ? { icon: MapPin, label: 'Drop Pincode', value: data.dropPincode } : null,
    data.expectedDeliveryDate
      ? {
          icon: Calendar,
          label: 'Expected Delivery',
          value: `${formatTruckDate(data.expectedDeliveryDate)}${data.expectedDeliveryTime ? ` · ${data.expectedDeliveryTime}` : ''}`,
        }
      : data.expectedDeliveryTime
        ? { icon: Clock, label: 'Delivery Time', value: data.expectedDeliveryTime }
        : null,
  ].filter(Boolean) as FieldDef[];

  const cargoFields: FieldDef[] = [
    goodsLabel ? { icon: PackageIcon, label: 'Goods Type', value: goodsLabel } : null,
    data.estimatedWeight
      ? { icon: Weight, label: 'Estimated Weight', value: `${data.estimatedWeight} kg`, highlight: true }
      : null,
    volumeLabel ? { icon: Layers, label: 'Approximate Volume', value: volumeLabel } : null,
  ].filter(Boolean) as FieldDef[];

  const accessFields: FieldDef[] = [
    data.pickupFloor !== null && data.pickupFloor !== undefined
      ? {
          icon: ArrowUpDown,
          label: 'Pickup Floor',
          value: (
            <span>
              Floor {data.pickupFloor}{' '}
              <span
                className={`ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  data.hasPickupLift ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {data.hasPickupLift ? '✓ Lift' : '✗ No lift'}
              </span>
            </span>
          ),
        }
      : null,
    data.dropFloor !== null && data.dropFloor !== undefined
      ? {
          icon: ArrowUpDown,
          label: 'Drop Floor',
          value: (
            <span>
              Floor {data.dropFloor}{' '}
              <span
                className={`ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  data.hasDropLift ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {data.hasDropLift ? '✓ Lift' : '✗ No lift'}
              </span>
            </span>
          ),
        }
      : null,
  ].filter(Boolean) as FieldDef[];

  const servicesFields: FieldDef[] = [
    data.requiresLabour
      ? {
          icon: CheckCircle2,
          label: 'Loading & Unloading',
          value: data.labourCount ? `Yes · ${data.labourCount} labourer(s)` : 'Required',
        }
      : null,
    data.needInsurance ? { icon: ShieldCheck, label: 'Insurance', value: 'Required' } : null,
    data.needPackaging ? { icon: PackageIcon, label: 'Packaging', value: 'Required' } : null,
    data.isFlexibleDate ? { icon: Calendar, label: 'Flexible Date', value: 'Yes' } : null,
  ].filter(Boolean) as FieldDef[];

  const receiverFields: FieldDef[] = [
    data.receiverName ? { icon: UserIcon, label: 'Receiver Name', value: data.receiverName } : null,
    data.receiverPhone ? { icon: Phone, label: 'Receiver Phone', value: data.receiverPhone } : null,
    data.requiresPOD ? { icon: ShieldCheck, label: 'Proof of Delivery', value: 'Required' } : null,
    data.hasMultipleStops
      ? {
          icon: Repeat,
          label: 'Multiple Stops',
          value: data.multipleStopsDetails ? `Yes – ${data.multipleStopsDetails}` : 'Yes',
        }
      : null,
  ].filter(Boolean) as FieldDef[];

  const hasGoodsDescription =
    data.goodsDescription && data.goodsDescription.trim() && data.goodsDescription !== goodsLabel;
  const hasRequirements = data.requirements && data.requirements.trim();

  const allEmpty =
    !tripFields.length &&
    !cargoFields.length &&
    !accessFields.length &&
    !servicesFields.length &&
    !receiverFields.length &&
    !hasGoodsDescription &&
    !hasRequirements;

  if (allEmpty) return null;

  return (
    <div className="space-y-4">
      {tripFields.length > 0 && (
        <SectionCard title="Trip Info" icon={ArrowRight} tint="emerald" fields={tripFields} />
      )}

      {(cargoFields.length > 0 || hasGoodsDescription) && (
        <div className="rounded-2xl border border-gray-200 bg-amber-50/40 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center ring-2 ring-amber-100">
              <PackageIcon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">Cargo</h4>
          </div>
          {hasGoodsDescription && (
            <div className="bg-white rounded-xl border border-amber-200 p-3 mb-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-amber-700 mb-1 inline-flex items-center gap-1">
                <StickyNote className="w-3 h-3" /> Material Details
              </p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{data.goodsDescription}</p>
            </div>
          )}
          {cargoFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {cargoFields.map((f, i) => (
                <FieldRow key={i} {...f} />
              ))}
            </div>
          )}
        </div>
      )}

      {accessFields.length > 0 && (
        <SectionCard title="Property Access" icon={Building2} tint="sky" fields={accessFields} />
      )}
      {servicesFields.length > 0 && (
        <SectionCard title="Services Required" icon={Wrench} tint="violet" fields={servicesFields} />
      )}
      {receiverFields.length > 0 && (
        <SectionCard title="Receiver & POD" icon={UserCheck} tint="rose" fields={receiverFields} />
      )}

      {hasRequirements && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center ring-2 ring-gray-100">
              <StickyNote className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">Notes</h4>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{data.requirements}</p>
          </div>
        </div>
      )}
    </div>
  );
}
