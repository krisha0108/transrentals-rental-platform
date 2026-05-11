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
  ArrowRight,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Phone,
  User as UserIcon,
  Repeat,
  Home,
  Boxes,
  Briefcase,
  HardHat,
  Sparkles,
  IndianRupee,
} from 'lucide-react';
import {
  PackersDetailFields,
  formatShiftingScope,
  formatVehicleType,
  formatPropertyTypeAndSize,
  formatDate,
} from '@/lib/packers-display';

interface PackersRequestDetailsProps {
  data: PackersDetailFields;
  variant?: 'default' | 'compact';
  hidePropertyType?: boolean;
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

export default function PackersRequestDetails({
  data,
  hidePropertyType,
}: PackersRequestDetailsProps) {
  const scopeLabel = formatShiftingScope(data.shiftingScope);
  const vehicleTypeLabel = formatVehicleType(data.vehicleType);
  const propertyLabel = formatPropertyTypeAndSize(data.shiftingType, data.propertySize);

  const tripFields: FieldDef[] = [
    scopeLabel ? { icon: ArrowRight, label: 'Shifting Scope', value: scopeLabel, highlight: true } : null,
    !hidePropertyType && propertyLabel ? { icon: Home, label: 'Property', value: propertyLabel } : null,
    data.pickupPincode ? { icon: MapPin, label: 'Pickup Pincode', value: data.pickupPincode } : null,
    data.dropPincode ? { icon: MapPin, label: 'Drop Pincode', value: data.dropPincode } : null,
    data.expectedDeliveryDate
      ? {
          icon: Calendar,
          label: 'Expected Delivery',
          value: `${formatDate(data.expectedDeliveryDate)}${data.expectedDeliveryTime ? ` · ${data.expectedDeliveryTime}` : ''}`,
        }
      : null,
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

  const inventoryFields: FieldDef[] = [
    data.boxesCount ? { icon: Box, label: 'Boxes', value: data.boxesCount } : null,
    data.bagsCount ? { icon: Briefcase, label: 'Bags', value: data.bagsCount } : null,
    data.estimatedWeight
      ? { icon: Weight, label: 'Estimated Weight', value: `${data.estimatedWeight} kg`, highlight: true }
      : null,
    data.estimatedVolumeCubFt
      ? { icon: Layers, label: 'Estimated Volume', value: `${data.estimatedVolumeCubFt} cuft` }
      : null,
    data.hasHeavyItems
      ? {
          icon: HardHat,
          label: 'Heavy Items',
          value: data.heavyItemsDesc ? `Yes – ${data.heavyItemsDesc}` : 'Yes',
        }
      : null,
    data.hasFragileItems
      ? {
          icon: Sparkles,
          label: 'Fragile Items',
          value: data.fragileItemsDesc ? `Yes – ${data.fragileItemsDesc}` : 'Yes',
        }
      : null,
  ].filter(Boolean) as FieldDef[];

  const servicesFields: FieldDef[] = [
    data.needPacking ? { icon: PackageIcon, label: 'Packing', value: 'Required' } : null,
    data.needLoading ? { icon: CheckCircle2, label: 'Loading', value: 'Required' } : null,
    data.needUnloading ? { icon: CheckCircle2, label: 'Unloading', value: 'Required' } : null,
    data.labourCount ? { icon: HardHat, label: 'Labour Count', value: data.labourCount } : null,
    vehicleTypeLabel ? { icon: Truck, label: 'Vehicle Type', value: vehicleTypeLabel } : null,
    data.partLoadAccepted ? { icon: Boxes, label: 'Part Load', value: 'Accepted' } : null,
    data.needInsurance
      ? {
          icon: ShieldCheck,
          label: 'Insurance',
          value: data.insuranceValue ? (
            <span className="inline-flex items-center gap-0.5">
              Yes <IndianRupee className="w-3 h-3 ml-0.5" />
              {data.insuranceValue.toLocaleString()}
            </span>
          ) : (
            'Yes'
          ),
        }
      : null,
    data.requiresPOD ? { icon: ShieldCheck, label: 'POD', value: 'Required' } : null,
  ].filter(Boolean) as FieldDef[];

  const receiverFields: FieldDef[] = [
    data.receiverName ? { icon: UserIcon, label: 'Receiver Name', value: data.receiverName } : null,
    data.receiverPhone ? { icon: Phone, label: 'Receiver Phone', value: data.receiverPhone } : null,
    data.hasMultipleStops
      ? {
          icon: Repeat,
          label: 'Multiple Stops',
          value: data.multipleStopsDetails ? `Yes – ${data.multipleStopsDetails}` : 'Yes',
        }
      : null,
  ].filter(Boolean) as FieldDef[];

  const allEmpty =
    !tripFields.length &&
    !accessFields.length &&
    !inventoryFields.length &&
    !servicesFields.length &&
    !receiverFields.length &&
    !data.inventoryList;

  if (allEmpty) return null;

  return (
    <div className="space-y-4">
      {tripFields.length > 0 && (
        <SectionCard title="Trip Info" icon={ArrowRight} tint="emerald" fields={tripFields} />
      )}
      {accessFields.length > 0 && (
        <SectionCard title="Property Access" icon={Building2} tint="sky" fields={accessFields} />
      )}

      {(inventoryFields.length > 0 || data.inventoryList) && (
        <div className="rounded-2xl border border-gray-200 bg-amber-50/40 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center ring-2 ring-amber-100">
              <PackageIcon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">Inventory</h4>
          </div>
          {data.inventoryList && (
            <div className="bg-white rounded-xl border border-amber-200 p-3 mb-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-amber-700 mb-1 inline-flex items-center gap-1">
                <StickyNote className="w-3 h-3" /> Inventory List
              </p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{data.inventoryList}</p>
            </div>
          )}
          {inventoryFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {inventoryFields.map((f, i) => (
                <FieldRow key={i} {...f} />
              ))}
            </div>
          )}
        </div>
      )}

      {servicesFields.length > 0 && (
        <SectionCard title="Services Required" icon={Wrench} tint="violet" fields={servicesFields} />
      )}
      {receiverFields.length > 0 && (
        <SectionCard title="Receiver & Stops" icon={UserCheck} tint="rose" fields={receiverFields} />
      )}
    </div>
  );
}
