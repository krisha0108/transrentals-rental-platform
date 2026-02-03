// Quick script to check conversations for a booking
// Run with: node check-conversations.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConversations() {
  const bookingId = 'cml69f25m0020vmo0rn3pzf5n'; // Your luxury booking ID

  console.log('Checking conversations for booking:', bookingId);
  console.log('='.repeat(80));

  const conversations = await prisma.chat_conversations.findMany({
    where: {
      bookingId: bookingId
    },
    include: {
      chat_messages: {
        select: {
          id: true,
          senderType: true,
          content: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  console.log(`\nFound ${conversations.length} conversation(s):\n`);

  conversations.forEach((conv, index) => {
    console.log(`Conversation #${index + 1}:`);
    console.log('  ID:', conv.id);
    console.log('  Customer ID:', conv.customerId || 'NULL (guest)');
    console.log('  Vendor ID:', conv.vendorId);
    console.log('  Booking Type:', conv.bookingType);
    console.log('  Booking ID:', conv.bookingId);
    console.log('  Messages Count:', conv.chat_messages.length);
    console.log('  Messages:');
    conv.chat_messages.forEach(msg => {
      console.log(`    - [${msg.senderType}] ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    });
    console.log('');
  });

  await prisma.$disconnect();
}

checkConversations().catch(console.error);
