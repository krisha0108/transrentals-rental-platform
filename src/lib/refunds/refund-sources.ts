// What the refunds desk needs to know about each booking table.
//
// Only some services store the gateway payment id, so only some can be
// refunded through Razorpay from here. The rest are settled by hand and
// marked on the queue — the page says which is which rather than offering a
// button that would always fail.

export interface RefundSource {
  /** Booking table, matching refund_followups.source. */
  table: string;
  /** How the service is named to a human. */
  label: string;
  /** Whether the table carries the gateway payment id for a one-click refund. */
  gateway: boolean;
  /** The real `services.slug` in the DB — for linking to the booking's own detail page. */
  slug: string;
}

export const REFUND_SOURCES: RefundSource[] = [
  { table: 'car_bookings', label: 'Self Drive', gateway: true, slug: 'self-drive-car-rentals' },
  { table: 'bike_bookings', label: 'Bike Rental', gateway: true, slug: 'bike-on-rent' },
  { table: 'bus_bookings', label: 'Bus & Tempo', gateway: true, slug: 'bus-rental' },
  { table: 'truck_bookings', label: 'Transporter', gateway: false, slug: 'transporter' },
  { table: 'packers_bookings', label: 'Packers & Movers', gateway: false, slug: 'packers-and-movers' },
  { table: 'luxury_bookings', label: 'Luxury Cars', gateway: false, slug: 'luxury-car-rental' },
  { table: 'equipment_bookings', label: 'Equipment Rental', gateway: false, slug: 'equipment-rental' },
  { table: 'chauffeur_bookings', label: 'Chauffeur Service', gateway: true, slug: 'car-rental' },
];

export const REFUND_STATUSES = [
  'PENDING',
  'MANAGER_REVIEWED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'NOT_REQUIRED',
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export function sourceFor(table: string): RefundSource | undefined {
  return REFUND_SOURCES.find((s) => s.table === table);
}
