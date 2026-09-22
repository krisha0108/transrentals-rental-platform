// Local testing helper for the driver app.
//
// Shows the demo driver, what the app should currently be offering, and the
// trip OTPs — which normally go to the customer by SMS, and so never arrive
// for seeded bookings with made-up phone numbers.
//
//   node scripts/show-demo-driver-state.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PREFIX = 'CB-DEMO-';

const driver = await prisma.drivers.findFirst({
  where: { email: 'demo.driver@transrentals.in' },
  select: { id: true, did: true, name: true, email: true, phone: true, status: true },
});

console.log('\n  Driver');
console.log('  ─────────────────────────────────────────────────────────────');
if (!driver) {
  console.log('  Not seeded. Run the driver seed script first.');
} else {
  console.log(`  ${driver.name}  (${driver.did})   status ${driver.status}`);
  console.log(`  ${driver.email}  /  Demo@12345   phone ${driver.phone}`);
}

// The three conditions the app's "Available Bookings" screen filters on.
const today = new Date(new Date().setHours(0, 0, 0, 0));
const available = await prisma.chauffeur_bookings.findMany({
  where: {
    status: 'BROADCASTED',
    acceptedVendorId: null,
    acceptedDriverId: null,
    pickupDate: { gte: today },
  },
  select: { bookingNumber: true, pickupCity: true, dropCity: true, pickupDate: true, grandTotal: true },
  orderBy: { pickupDate: 'asc' },
});

console.log(`\n  Available Bookings should show ${available.length}`);
console.log('  ─────────────────────────────────────────────────────────────');
for (const b of available) {
  const route = `${b.pickupCity}${b.dropCity ? ' → ' + b.dropCity : ''}`;
  console.log(`  ${b.bookingNumber.padEnd(13)}${route.padEnd(26)}${String(b.pickupDate).slice(0, 15)}  ₹${b.grandTotal}`);
}

const mine = driver
  ? await prisma.chauffeur_bookings.findMany({
      where: { acceptedDriverId: driver.id },
      select: { bookingNumber: true, status: true, tripStartOtp: true, tripEndOtp: true },
      orderBy: { pickupDate: 'asc' },
    })
  : [];

console.log(`\n  Accepted by this driver: ${mine.length}`);

const demo = await prisma.chauffeur_bookings.findMany({
  where: { bookingNumber: { startsWith: PREFIX } },
  select: { bookingNumber: true, status: true, tripStartOtp: true, tripEndOtp: true },
  orderBy: { bookingNumber: 'asc' },
});

console.log('\n  Trip OTPs  (blank until you tap "Send OTP" in the app)');
console.log('  ─────────────────────────────────────────────────────────────');
console.log('  BOOKING       STATUS          START OTP    END OTP');
for (const b of demo) {
  console.log(
    `  ${b.bookingNumber.padEnd(13)} ${(b.status || '').padEnd(15)} ${(b.tripStartOtp || '—').padEnd(12)} ${b.tripEndOtp || '—'}`,
  );
}
console.log('');

await prisma.$disconnect();
process.exit(0);
