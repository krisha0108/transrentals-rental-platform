// One-off: put already-cancelled bookings on the refunds queue.
//
// The queue was added after these cancellations happened, so bookings that
// were cancelled earlier have no row — the customer sees nothing on their
// page and the desk has no record. This walks each booking table and creates
// the row that the cancel handler would create today.
//
// Safe to run more than once: rows are keyed on (source, bookingId) and an
// existing one is left exactly as it is, so a refund someone has already
// worked cannot be reset. Nothing is notified — these are historical.
//
//   npx tsx scripts/backfill-refund-followups.ts           (dry run)
//   npx tsx scripts/backfill-refund-followups.ts --write
import { prisma } from '../src/lib/db/prisma';

const WRITE = process.argv.includes('--write');

interface Spec {
  source: string;
  label: string;
  /** Delegate on the prisma client. */
  model: string;
  /** Field holding what the customer paid. */
  paidField: string;
}

const SPECS: Spec[] = [
  { source: 'bike_bookings', label: 'Bike Rental', model: 'bike_bookings', paidField: 'paidAmount' },
  { source: 'car_bookings', label: 'Self Drive', model: 'car_bookings', paidField: 'paidAmount' },
  { source: 'bus_bookings', label: 'Bus & Tempo', model: 'bus_bookings', paidField: 'advancePaid' },
  { source: 'truck_bookings', label: 'Transporter', model: 'truck_bookings', paidField: 'advancePaid' },
  { source: 'packers_bookings', label: 'Packers & Movers', model: 'packers_bookings', paidField: 'advancePaid' },
  { source: 'luxury_bookings', label: 'Luxury Cars', model: 'luxury_bookings', paidField: 'advancePaid' },
  { source: 'equipment_bookings', label: 'Equipment Rental', model: 'equipment_bookings', paidField: 'advancePaid' },
];

async function main() {
  console.log(WRITE ? 'WRITING\n' : 'DRY RUN — pass --write to apply\n');

  let created = 0;
  let skipped = 0;

  for (const spec of SPECS) {
    const delegate = (prisma as any)[spec.model];
    let rows: any[] = [];
    try {
      rows = await delegate.findMany({ where: { status: 'CANCELLED' } });
    } catch (e: any) {
      console.log(`${spec.source.padEnd(20)} could not read: ${e.message.split('\n')[0]}`);
      continue;
    }

    let made = 0;
    let had = 0;
    let ignored = 0;

    for (const b of rows) {
      const paid = Number(b[spec.paidField] ?? 0);
      const refund = Number(b.refundAmount ?? 0);

      // Nothing was ever paid — there is nothing to tell anyone.
      if (paid <= 0 && refund <= 0) { ignored++; continue; }

      const existing = await prisma.refund_followups.findUnique({
        where: { source_bookingId: { source: spec.source, bookingId: b.id } },
        select: { id: true },
      });
      if (existing) { had++; continue; }

      const owesNothing = refund <= 0;
      const notes = [
        b.cancellationReason ? `Cancellation reason: ${b.cancellationReason}` : null,
        owesNothing
          ? `Nothing refundable under the policy — customer had paid ₹${Math.round(paid).toLocaleString('en-IN')}.`
          : null,
        'Added by backfill; this booking was cancelled before the refunds queue existed.',
      ]
        .filter(Boolean)
        .join(' ');

      if (WRITE) {
        await prisma.refund_followups.create({
          data: {
            source: spec.source,
            bookingId: b.id,
            bookingNumber: b.bookingNumber,
            serviceType: spec.label,
            customerId: b.customerId ?? null,
            customerName: b.customerName ?? null,
            amount: refund,
            status: owesNothing ? 'NOT_REQUIRED' : 'PENDING',
            notes,
            createdAt: b.cancelledAt ?? b.updatedAt ?? new Date(),
          },
        });
      }
      made++;
    }

    created += made;
    skipped += had;
    console.log(
      `${spec.source.padEnd(20)} cancelled ${String(rows.length).padStart(3)} · ` +
        `${WRITE ? 'created' : 'would create'} ${made} · already had ${had} · nothing paid ${ignored}`
    );
  }

  console.log(`\n${WRITE ? 'created' : 'would create'} ${created}, left alone ${skipped}`);

  if (WRITE) {
    const pending = await prisma.refund_followups.count({ where: { status: 'PENDING' } });
    const owed = await prisma.refund_followups.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    });
    console.log(`queue now: ${pending} pending, ₹${Math.round(owed._sum.amount || 0).toLocaleString('en-IN')} owed`);
  }
}

main()
  .catch((e) => { console.error('FAILED:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
