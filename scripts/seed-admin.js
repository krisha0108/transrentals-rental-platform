const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

/**
 * Admin Users Seed File
 *
 * Creates default admin users for the application.
 * Passwords are hashed using bcryptjs.
 *
 * Usage: node scripts/seed-admin.js
 */

// Admin users data
const ADMIN_USERS = [
  {
    id: 'admin-super-001',
    email: 'superadmin@transrentals.com',
    password: 'SuperAdmin@123', // Will be hashed
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    phone: '+91-9999999999',
    isActive: true,
  },
  {
    id: 'admin-001',
    email: 'admin@transrentals.com',
    password: '123123', // Will be hashed
    name: 'Admin User',
    role: 'ADMIN',
    phone: '+91-9999999998',
    isActive: true,
  },
  {
    id: 'admin-sub-001',
    email: 'subadmin@transrentals.com',
    password: 'SubAdmin@123', // Will be hashed
    name: 'Sub Admin',
    role: 'SUB_ADMIN',
    phone: '+91-9999999997',
    isActive: true,
  },
];

async function seedAdmins() {
  console.log('\n👤 Seeding admin users...');
  console.log('=' .repeat(50));

  let count = 0;
  for (const admin of ADMIN_USERS) {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(admin.password, 10);

      await prisma.admin_users.upsert({
        where: { id: admin.id },
        update: {
          email: admin.email,
          password: hashedPassword,
          name: admin.name,
          role: admin.role,
          phone: admin.phone,
          isActive: admin.isActive,
        },
        create: {
          id: admin.id,
          email: admin.email,
          password: hashedPassword,
          name: admin.name,
          role: admin.role,
          phone: admin.phone,
          isActive: admin.isActive,
        },
      });

      console.log(`✅ ${admin.name} (${admin.email}) - Role: ${admin.role}`);
      count++;
    } catch (error) {
      console.error(`❌ Failed to seed ${admin.name}:`, error.message);
    }
  }

  console.log('=' .repeat(50));
  console.log(`✅ Total admin users seeded: ${count}\n`);
}

async function main() {
  console.log('\n🌱 Starting Admin Users Seed\n');

  try {
    await seedAdmins();
    console.log('🎉 Admin seed completed successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('=' .repeat(50));
    ADMIN_USERS.forEach(admin => {
      console.log(`\n${admin.name}:`);
      console.log(`  Email:    ${admin.email}`);
      console.log(`  Password: ${admin.password}`);
      console.log(`  Role:     ${admin.role}`);
    });
    console.log('\n' + '=' .repeat(50));
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
