/**
 * Shared helpers for displaying truck rental quote/booking field metadata.
 * These keep customer/vendor/admin/manager/driver UIs consistent.
 */

export interface TruckDetailFields {
  truckBodyType?: string | null;
  tripDirection?: string | null;
  vehicleCategoryName?: string | null;
  goodsType?: string | null;
  goodsDescription?: string | null;
  estimatedWeight?: number | null;
  estimatedVolume?: string | null;
  pickupPincode?: string | null;
  dropPincode?: string | null;
  expectedDeliveryDate?: string | Date | null;
  expectedDeliveryTime?: string | null;
  pickupFloor?: number | null;
  hasPickupLift?: boolean | null;
  dropFloor?: number | null;
  hasDropLift?: boolean | null;
  requiresLabour?: boolean | null;
  labourCount?: number | null;
  hasMultipleStops?: boolean | null;
  multipleStopsDetails?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  requiresPOD?: boolean | null;
  needInsurance?: boolean | null;
  needPackaging?: boolean | null;
  isFlexibleDate?: boolean | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  serviceType?: string | null;
  requirements?: string | null;
}

export const TRUCK_BODY_TYPE_LABELS: Record<string, string> = {
  OPEN: 'Open Truck',
  CLOSED_BODY: 'Closed Body',
  CONTAINER: 'Container',
  TRAILER: 'Trailer',
  LCV: 'LCV',
  REFRIGERATED: 'Refrigerated',
  FLATBED: 'Flatbed',
  OTHER: 'Other',
};

export const TRIP_DIRECTION_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way',
  ROUND_TRIP: 'Round Trip',
};

export const TRUCK_GOODS_TYPE_LABELS: Record<string, string> = {
  '1': 'Building Materials',
  '2': 'Granites/Marbles',
  '3': 'Cement',
  '4': 'Chemical',
  '5': 'Coal & Ash',
  '6': 'Container',
  '7': 'Engineering Goods',
  '8': 'Electronics',
  '9': 'Fertilizer',
  '10': 'Fruits & Vegetables',
  '11': 'Furniture & Wood',
  '12': 'Household Goods',
  '13': 'Industrial Equipment',
  '14': 'Iron/Steel Material',
  '15': 'Liquid/Oil Drums',
  '16': 'Machineries',
  '17': 'Marble Slab/Block',
  '18': 'Medicines',
  '19': 'Packed Foods',
  '20': 'Plastic Pipes',
  '21': 'Books/Paper Rolls',
  '22': 'Plastic Granules',
  '23': 'Crop/Agriculture',
  '24': 'Scrap',
  '25': 'Stones/Tiles',
  '26': 'Textiles',
  '27': 'Tyres & Rubber',
  '28': 'Vehicles/Automobiles',
  '29': 'Others',
};

export const TRUCK_VOLUME_LABELS: Record<string, string> = {
  LIGHT: 'Light (small load)',
  MEDIUM: 'Medium (canter-load)',
  LARGE: 'Large (truck-load)',
};

export function formatTruckBodyType(value?: string | null): string | null {
  if (!value) return null;
  return TRUCK_BODY_TYPE_LABELS[value] || value;
}

export function formatTripDirection(value?: string | null): string | null {
  if (!value) return null;
  return TRIP_DIRECTION_LABELS[value] || value;
}

export function formatTruckGoodsType(value?: string | null): string | null {
  if (!value) return null;
  return TRUCK_GOODS_TYPE_LABELS[value] || value;
}

export function formatTruckVolume(value?: string | null): string | null {
  if (!value) return null;
  return TRUCK_VOLUME_LABELS[value] || value;
}

export function formatTruckDate(value?: string | Date | null): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

export function formatTruckBoolean(value?: boolean | null): string {
  return value ? 'Yes' : 'No';
}
