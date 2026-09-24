// Local testing helper: give the demo driver a known password.
//
// Same guard as the other demo seeder — this writes a password hash, so
// pointed at production by an inherited DATABASE_URL it would hand out a
// working login. It refuses to run against anything but a local database.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const EMAIL = process.env.DEMO_DRIVER_EMAIL || 'demo.driver@transrentals.in';
const PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

function assertLocal() {
  const url = process.env.DATABASE_URL || '';
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    host = '';
  }
  if (!LOCAL_HOSTS.has(host)) {
    console.error(`\n  Refusing to run: DATABASE_URL points at "${host || '(unparseable)'}".`);
    console.error('  This sets a known password on a driver account, so it is local-only.\n');
    process.exit(1);
  }
}

assertLocal();

const prisma = new PrismaClient();

try {
  const driver = await prisma.drivers.findUnique({
    where: { email: EMAIL },
    select: { id: true, did: true, name: true, email: true, phone: true, status: true },
  });

  if (!driver) {
    console.error(`\n  No driver with email ${EMAIL}. Register one first at /driver/register.\n`);
    process.exit(1);
  }

  await prisma.drivers.update({
    where: { id: driver.id },
    data: { password: await bcrypt.hash(PASSWORD, 12), status: 'ACTIVE' },
  });

  console.log('\n  Driver login');
  console.log('  ' + '─'.repeat(58));
  console.log(`  Email      ${driver.email}`);
  console.log(`  Driver ID  ${driver.did || '(none yet — generated on first login)'}`);
  console.log(`  Password   ${PASSWORD}`);
  console.log(`  Phone      ${driver.phone || '-'}`);
  console.log(`  Status     ACTIVE\n`);
  console.log('  Sign in at /driver/login with either the email or the Driver ID.\n');
} finally {
  await prisma.$disconnect();
}
