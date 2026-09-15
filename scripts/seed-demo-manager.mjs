// Creates (or resets) a local demo manager so the manager panel can be logged into
// for testing. Local dev only — it writes to whatever DATABASE_URL points at.
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = 'demo.manager@transrentals.in';
const PASSWORD = 'Demo@12345';
const NAME = 'Demo Manager';
const ID = 'user-demo-manager-local';

async function main() {
  const url = process.env.DATABASE_URL || '';
  const dbName = url.split('/').pop()?.split('?')[0] || '(unknown)';
  console.log(`Database: ${dbName}`);

  const hash = await bcrypt.hash(PASSWORD, 10);

  await prisma.admin_users.upsert({
    where: { email: EMAIL },
    create: {
      id: ID,
      email: EMAIL,
      password: hash,
      name: NAME,
      role: 'MANAGER',
      isActive: true,
      updatedAt: new Date(),
    },
    update: {
      // Re-running resets the password, so it is always the one printed below.
      password: hash,
      name: NAME,
      role: 'MANAGER',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const user = await prisma.admin_users.findUnique({ where: { email: EMAIL }, select: { id: true } });
  const managerId = user.id;

  // A manager only sees inquiries for the locations and services assigned to them, so
  // without these the panel would load but every list would be empty.
  const [locations, services] = await Promise.all([
    prisma.locations.findMany({ where: { isActive: true }, select: { id: true } }),
    prisma.services.findMany({ select: { id: true } }),
  ]);

  await prisma.manager_locations.deleteMany({ where: { managerId } });
  await prisma.manager_services.deleteMany({ where: { managerId } });

  if (locations.length) {
    await prisma.manager_locations.createMany({
      data: locations.map((l, i) => ({
        id: `mloc-demo-${i}`,
        managerId,
        locationId: l.id,
        createdAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  if (services.length) {
    await prisma.manager_services.createMany({
      data: services.map((s, i) => ({
        id: `msvc-demo-${i}`,
        managerId,
        serviceId: s.id,
        createdAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  console.log('\n  Manager ready');
  console.log('  ─────────────────────────────────────────');
  console.log(`  Login : http://localhost:3000/manager/login`);
  console.log(`  Email : ${EMAIL}`);
  console.log(`  Pass  : ${PASSWORD}`);
  console.log(`  Scope : ${locations.length} locations, ${services.length} services`);
  console.log('  ─────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
