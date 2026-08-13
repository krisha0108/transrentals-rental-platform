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
  /** 'rows' renders a flat spec sheet for narrow side rails. */
  variant?: 'default' | 'compact' | 'rows';
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

// One brand treatment for every section — the five separate hues read as a
// rainbow next to the rest of the customer area. Section identity comes from
// the icon and the label, not from a different background colour each time.
const BRAND_TINT = { bg: 'bg-[#FCFDFC]', iconBg: 'bg-[#E9FAF2]', iconText: 'text-[#056B3E]', ring: 'ring-[#C8F1DF]' };

const TINTS: Record<string, { bg: string; iconBg: string; iconText: string; ring: string }> = {
  emerald: BRAND_TINT,
  sky: BRAND_TINT,
  amber: BRAND_TINT,
  violet: BRAND_TINT,
  rose: BRAND_TINT,
};

const FieldRow = ({ icon: Icon, label, value, highlight }: FieldDef) => {
  if (value === null || value === undefined || value === '' || value === false) return null;
  return (
    <div
      className={`flex items-start gap-2.5 ${
        highlight ? 'bg-white border border-[#C8F1DF]' : 'bg-white border border-gray-100'
      } rounded-xl p-2.5 transition hover:border-[#96E4C2]`}
    >
      {Icon && (
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gray-100 bg-[#F4F8F6] text-gray-500">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-gray-400">{label}</p>
        <p className={`mt-0.5 break-words text-[13px] ${highlight ? 'font-extrabold text-[#056B3E]' : 'font-bold text-gray-900'}`}>
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
    <div className={`rounded-2xl border border-gray-100 ${t.bg} p-4 sm:p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${t.iconBg} ${t.iconText} flex items-center justify-center ring-2 ${t.ring}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400">{title}</h4>
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
  variant,
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
                  data.hasPickupLift ? 'bg-[#E9FAF2] text-[#056B3E]' : 'bg-red-50 text-red-600'
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
                  data.hasDropLift ? 'bg-[#E9FAF2] text-[#056B3E]' : 'bg-red-50 text-red-600'
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

  // Flat spec-sheet layout for narrow side rails. Same fields, same filtering —
  // only the presentation differs, so callers that don't ask for it are
  // unaffected.
  if (variant === 'rows') {
    const allFields: FieldDef[] = [
      ...tripFields,
      ...cargoFields,
      ...accessFields,
      ...servicesFields,
      ...receiverFields,
    ];
    return (
      <div className="flex flex-col gap-3">
        {allFields.length > 0 && (
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-gray-50">
            {allFields.map((f, i) => (
              <div key={i} className="flex items-start justify-between gap-3 bg-white px-3.5 py-2.5">
                <span className="flex-none text-xs text-gray-500">{f.label}</span>
                <span className={`break-words text-right text-[12.5px] font-bold ${f.highlight ? 'text-[#056B3E]' : 'text-gray-900'}`}>
                  {f.value}
                </span>
              </div>
            ))}
            {/* Lift state rides along inside the floor rows when a floor is
                known; these standalone rows only fill the gap when it isn't. */}
            {(data.pickupFloor === null || data.pickupFloor === undefined) && (
              <div className="flex items-start justify-between gap-3 bg-white px-3.5 py-2.5">
                <span className="flex-none text-xs text-gray-500">Pickup Lift</span>
                <span className={`text-right text-[12.5px] font-bold ${data.hasPickupLift ? 'text-[#056B3E]' : 'text-gray-400'}`}>
                  {data.hasPickupLift ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {(data.dropFloor === null || data.dropFloor === undefined) && (
              <div className="flex items-start justify-between gap-3 bg-white px-3.5 py-2.5">
                <span className="flex-none text-xs text-gray-500">Drop Lift</span>
                <span className={`text-right text-[12.5px] font-bold ${data.hasDropLift ? 'text-[#056B3E]' : 'text-gray-400'}`}>
                  {data.hasDropLift ? 'Yes' : 'No'}
                </span>
              </div>
            )}
          </div>
        )}

        {hasGoodsDescription && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-blue-700">Material Details</p>
            <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-blue-900">{data.goodsDescription}</p>
          </div>
        )}

        {hasRequirements && (
          <div className="rounded-xl border border-gray-100 bg-[#FCFDFC] px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-gray-400">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-gray-700">{data.requirements}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tripFields.length > 0 && (
        <SectionCard title="Trip Info" icon={ArrowRight} tint="emerald" fields={tripFields} />
      )}

      {(cargoFields.length > 0 || hasGoodsDescription) && (
        <div className="rounded-2xl border border-gray-100 bg-[#FCFDFC] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E9FAF2] text-[#056B3E] ring-2 ring-[#C8F1DF]">
              <PackageIcon className="w-4 h-4" />
            </div>
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Cargo</h4>
          </div>
          {hasGoodsDescription && (
            <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="mb-1 inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-blue-700">
                <StickyNote className="w-3 h-3" /> Material Details
              </p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-blue-900">{data.goodsDescription}</p>
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
        <div className="rounded-2xl border border-gray-100 bg-[#FCFDFC] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E9FAF2] text-[#056B3E] ring-2 ring-[#C8F1DF]">
              <StickyNote className="w-4 h-4" />
            </div>
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-400">Notes</h4>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">{data.requirements}</p>
          </div>
        </div>
      )}
    </div>
  );
}
