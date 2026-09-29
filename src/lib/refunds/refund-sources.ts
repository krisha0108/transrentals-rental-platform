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
}

export const REFUND_SOURCES: RefundSource[] = [
  { table: 'car_bookings', label: 'Self Drive', gateway: true },
  { table: 'bike_bookings', label: 'Bike Rental', gateway: true },
  { table: 'bus_bookings', label: 'Bus & Tempo', gateway: true },
  { table: 'truck_bookings', label: 'Transporter', gateway: false },
  { table: 'packers_bookings', label: 'Packers & Movers', gateway: false },
  { table: 'luxury_bookings', label: 'Luxury Cars', gateway: false },
  { table: 'equipment_bookings', label: 'Equipment Rental', gateway: false },
  { table: 'chauffeur_bookings', label: 'Chauffeur Service', gateway: true },
];

export const REFUND_STATUSES = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'NOT_REQUIRED',
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export function sourceFor(table: string): RefundSource | undefined {
  return REFUND_SOURCES.find((s) => s.table === table);
}
