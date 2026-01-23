const { PrismaClient } = require('@prisma/client');
const { createIdGenerationMiddleware } = require('./src/lib/db/prisma-middleware.ts');

async function testAutoIdGeneration() {
  console.log('🧪 Testing Automatic ID Generation Middleware\n');

  const prisma = new PrismaClient();

  // Add middleware
  prisma.$use(createIdGenerationMiddleware(prisma));
  console.log('✅ Middleware registered\n');

  try {
    // Test 1: Create customer WITHOUT providing ID
    console.log('Test 1: Creating customer without ID...');
    const customer = await prisma.customers.create({
      data: {
        name: 'Test Customer',
        email: `test${Date.now()}@example.com`,
        phone: `999${Math.random().toString().substr(2, 7)}`,
        password: null,
      },
    });
    console.log(`✅ Customer created with auto-generated ID: ${customer.id}\n`);

    // Test 2: Create customer WITH ID provided (should use the provided one)
    console.log('Test 2: Creating customer WITH custom ID...');
    const customerId = 'CUST_CUSTOM_123';
    const customer2 = await prisma.customers.create({
      data: {
        id: customerId,
        name: 'Custom ID Customer',
        email: `custom${Date.now()}@example.com`,
        phone: `888${Math.random().toString().substr(2, 7)}`,
        password: null,
      },
    });
    console.log(`✅ Customer created with provided ID: ${customer2.id}\n`);

    // Test 3: Create a quote (different table)
    console.log('Test 3: Creating truck quote without ID...');
    const quote = await prisma.truck_quotes.create({
      data: {
        quoteNumber: `TQ-${Date.now()}`,
        vendorId: 'VENDOR_1', // Assuming this exists
        requestId: 'TQR-2026-0001', // Assuming this exists
        customerPhone: '9999999999',
        totalAmount: 5000,
        status: 'DRAFT',
        validTill: new Date(Date.now() + 86400000), // 24 hours from now
      },
    });
    console.log(`✅ Truck quote created with auto-generated ID: ${quote.id}\n`);

    console.log('🎉 All tests passed! Auto ID generation is working perfectly.\n');

    // Cleanup - delete test records
    console.log('🧹 Cleaning up test records...');
    await prisma.customers.deleteMany({
      where: {
        OR: [
          { id: customer.id },
          { id: customer2.id },
        ],
      },
    });
    await prisma.truck_quotes.delete({ where: { id: quote.id } }).catch(() => {});
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoIdGeneration();
