const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // First, find customer by ID (from app logs)
    let customer = await prisma.customers.findUnique({
      where: { id: 'CUST_3' }
    });

    // If not found by ID, try email
    if (!customer) {
      customer = await prisma.customers.findFirst({
        where: { email: 'shrusti@cre8r.in' }
      });
    }

    // If not found, list available customers
    if (!customer) {
      console.log('❌ Customer not found with email: shrusti@cre8r.in\n');
      console.log('Available customers in database:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const customers = await prisma.customers.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true }
      });

      customers.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name || 'N/A'}`);
        console.log(`   Email: ${c.email || 'N/A'}`);
        console.log(`   Phone: ${c.phone || 'N/A'}`);
        console.log(`   ID: ${c.id}\n`);
      });

      console.log('Please use one of these customer emails to test.\n');
      return;
    }

    console.log('✅ Found Customer:');
    console.log(`   Name: ${customer.name}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   ID: ${customer.id}\n`);

    // Create test notifications
    const notif1 = await prisma.notifications.create({
      data: {
        customerId: customer.id,
        title: '🎉 Test Notification',
        body: 'This is a test notification to verify the module is working! You should see this with a GREEN border and unread dot indicator.',
        type: 'general',
        isRead: false,
      }
    });

    console.log('✅ Test Notification #1 Created (UNREAD - Green)');

    const notif2 = await prisma.notifications.create({
      data: {
        customerId: customer.id,
        title: '📝 Booking Update',
        body: 'Your recent booking has been confirmed. Click to view details.',
        type: 'booking',
        isRead: false,
      }
    });

    console.log('✅ Test Notification #2 Created (UNREAD - Green)');

    const notif3 = await prisma.notifications.create({
      data: {
        customerId: customer.id,
        title: '✅ Already Read Notification',
        body: 'This notification is already marked as read. It should appear with normal white background.',
        type: 'general',
        isRead: true,
      }
    });

    console.log('✅ Test Notification #3 Created (READ - White)\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 All test notifications created successfully!\n');
    console.log('📱 Now in your app:');
    console.log('   1. Pull down to refresh the Notifications screen');
    console.log('   2. You should see 3 NEW notifications');
    console.log('   3. Two should have GREEN borders (unread)');
    console.log('   4. One should have normal white background (read)');
    console.log('   5. Tap an unread one - it should turn white');
    console.log('   6. Badge count should decrease');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
