/**
 * Shared helpers for displaying packers & movers quote/booking field metadata.
 * These keep customer/vendor/admin/manager UIs consistent.
 */

export interface PackersDetailFields {
  shiftingScope?: string | null;
  pickupPincode?: string | null;
  dropPincode?: string | null;
  expectedDeliveryDate?: string | Date | null;
  expectedDeliveryTime?: string | null;
  inventoryList?: string | null;
  boxesCount?: number | null;
  bagsCount?: number | null;
  estimatedWeight?: number | null;
  estimatedVolumeCubFt?: number | null;
  hasHeavyItems?: boolean | null;
  heavyItemsDesc?: string | null;
  hasFragileItems?: boolean | null;
  fragileItemsDesc?: string | null;
  pickupFloor?: number | null;
  hasPickupLift?: boolean | null;
  dropFloor?: number | null;
  hasDropLift?: boolean | null;
  needPacking?: boolean | null;
  needLoading?: boolean | null;
  needUnloading?: boolean | null;
  labourCount?: number | null;
  vehicleType?: string | null;
  partLoadAccepted?: boolean | null;
  needInsurance?: boolean | null;
  insuranceValue?: number | null;
  requiresPOD?: boolean | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  hasMultipleStops?: boolean | null;
  multipleStopsDetails?: string | null;
  propertySize?: string | null;
  shiftingType?: string | null;
}

export const SHIFTING_SCOPE_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  DOMESTIC: 'Domestic (within state)',
  INTERCITY: 'Intercity (between states)',
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SHARED: 'Shared',
  DEDICATED: 'Dedicated',
};

const PROPERTY_SIZE_LABELS: Record<string, string> = {
  // BHK series
  BHK_1: '1 BHK',
  BHK_2: '2 BHK',
  BHK_3: '3 BHK',
  BHK_4: '4 BHK',
  BHK_5: '5+ BHK',
  '1bhk': '1 BHK',
  '2bhk': '2 BHK',
  '3bhk': '3 BHK',
  '4bhk': '4 BHK',
  '5bhk': '5+ BHK',
  // Office
  UPTO_10_EMPLOYEES: '1-10 Employees',
  UPTO_25_EMPLOYEES: '11-25 Employees',
  UPTO_50_EMPLOYEES: '26-50 Employees',
  UPTO_100_EMPLOYEES: '51-100 Employees',
  ABOVE_100_EMPLOYEES: '100+ Employees',
  'office-small': 'Small Office',
  'office-large': 'Large Office',
  // Vehicle
  CAR: 'Car',
  BIKE: 'Bike',
  SCOOTER: 'Scooter',
  // Other
  villa: 'Villa',
  STUDIO: 'Studio',
};

export function formatShiftingScope(value?: string | null): string | null {
  if (!value) return null;
  return SHIFTING_SCOPE_LABELS[value] || value;
}

export function formatVehicleType(value?: string | null): string | null {
  if (!value) return null;
  return VEHICLE_TYPE_LABELS[value] || value;
}

export function formatPropertySize(value?: string | null): string | null {
  if (!value) return null;
  return PROPERTY_SIZE_LABELS[value] || value;
}

/** Combined "Home – 2 BHK" / "Office – 1-10 Employees" / "Vehicle – Car" */
export function formatPropertyTypeAndSize(
  shiftingType?: string | null,
  propertySize?: string | null
): string | null {
  const parts: string[] = [];
  if (shiftingType) {
    const t = shiftingType.toLowerCase();
    if (t.includes('home') || t.includes('household')) parts.push('Home');
    else if (t.includes('office')) parts.push('Office');
    else if (t.includes('vehicle')) parts.push('Vehicle');
    else parts.push(shiftingType);
  }
  const sizeLabel = formatPropertySize(propertySize);
  if (sizeLabel) parts.push(sizeLabel);
  return parts.length ? parts.join(' – ') : null;
}

export function formatDate(value?: string | Date | null): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

export function formatBoolean(value?: boolean | null): string {
  return value ? 'Yes' : 'No';
}
