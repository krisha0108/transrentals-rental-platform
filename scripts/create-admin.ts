import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('admin@123', 10);

    const admin = await prisma.admin_users.upsert({
      where: { email: 'admin@transrentals.in' },
      update: {},
      create: {
        id: 'admin_' + Date.now(),
        email: 'admin@transrentals.in',
        password: hashedPassword,
        name: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created/updated:');
    console.log('Email: admin@transrentals.in');
    console.log('Password: admin@123');
    console.log('Role: SUPER_ADMIN');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
