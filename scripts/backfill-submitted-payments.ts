// One-off: release manual payments that are stuck out of the admin queue.
//
// /admin/payments filters on paymentStatus in (SUBMITTED, PARTIAL, PAID), but
// six services wrote PENDING when the customer submitted their proof. Those
// bookings say PAYMENT_SUBMITTED on the booking itself and sit invisible to
// the people who verify them. The route now writes SUBMITTED; this moves the
// ones already stuck.
//
// Only touches bookings where the booking status already says the payment was
// submitted and the payment status is still PENDING — nothing else can match,
// so a real PENDING booking (no payment attempted) is left alone.
//
//   npx tsx scripts/backfill-submitted-payments.ts           (dry run)
//   npx tsx scripts/backfill-submitted-payments.ts --write
import { prisma } from '../src/lib/db/prisma';

const WRITE = process.argv.includes('--write');

const MODELS = [
  'bike_bookings',
  'car_bookings',
  'bus_bookings',
  'truck_bookings',
  'packers_bookings',
  'equipment_bookings',
];

async function main() {
  console.log(WRITE ? 'WRITING\n' : 'DRY RUN — pass --write to apply\n');
  let total = 0;

  for (const model of MODELS) {
    const delegate = (prisma as any)[model];

    let stuck: any[] = [];
    try {
      stuck = await delegate.findMany({
        where: { status: 'PAYMENT_SUBMITTED', paymentStatus: 'PENDING' },
        select: { id: true, bookingNumber: true, customerName: true },
      });
    } catch (e: any) {
      console.log(`${model.padEnd(20)} could not read: ${e.message.split('\n')[0]}`);
      continue;
    }

    if (stuck.length && WRITE) {
      await delegate.updateMany({
        where: { status: 'PAYMENT_SUBMITTED', paymentStatus: 'PENDING' },
        data: { paymentStatus: 'SUBMITTED' },
      });
    }

    total += stuck.length;
    console.log(`${model.padEnd(20)} ${WRITE ? 'released' : 'would release'} ${stuck.length}`);
    stuck.forEach((b) => console.log(`    ${b.bookingNumber}  ${b.customerName ?? ''}`));
  }

  console.log(`\n${WRITE ? 'released' : 'would release'} ${total} booking(s) into the verification queue`);
}

main()
  .catch((e) => { console.error('FAILED:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
