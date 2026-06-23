import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import axios from 'axios';

async function main() {
  try {
    // Create test vendor
    const hashedPassword = await bcrypt.hash('vendor@123', 12);

    const vendor = await prisma.vendors.upsert({
      where: { email: 'testvendor@transrentals.in' },
      update: {},
      create: {
        id: 'vendor_' + Date.now(),
        email: 'testvendor@transrentals.in',
        password: hashedPassword,
        phone: '9876543210',
        businessName: 'Test Vendor Business',
        ownerName: 'Test Owner',
        status: 'APPROVED',
        businessType: 'BIKE_RENTAL',
      },
    });

    console.log('✅ Test Vendor Created:');
    console.log('  ID:', vendor.id);
    console.log('  Email: testvendor@transrentals.in');
    console.log('  Password: vendor@123');
    console.log('');

    // Now test login via API
    console.log('Testing login via API...');
    const response = await axios.post(
      'http://localhost:3000/api/vendor/auth/mobile-login',
      {
        email: 'testvendor@transrentals.in',
        password: 'vendor@123',
        fcmToken: 'test-fcm-token',
      }
    );

    console.log('✅ Login Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
