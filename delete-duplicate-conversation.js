// Script to delete the duplicate conversation with null customerId
// Run with: node delete-duplicate-conversation.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDuplicateConversation() {
  const conversationIdToDelete = 'c6mzzrkhed50knhhr'; // The one with NULL customerId

  console.log('Deleting conversation:', conversationIdToDelete);
  console.log('='.repeat(80));

  try {
    // First delete all messages in this conversation
    const deletedMessages = await prisma.chat_messages.deleteMany({
      where: {
        conversationId: conversationIdToDelete
      }
    });
    console.log(`✓ Deleted ${deletedMessages.count} messages`);

    // Then delete the conversation
    const deletedConversation = await prisma.chat_conversations.delete({
      where: {
        id: conversationIdToDelete
      }
    });
    console.log(`✓ Deleted conversation: ${deletedConversation.id}`);
    console.log('\n✅ Successfully deleted duplicate conversation!');
    console.log('Now both customer and vendor will use the same conversation.');

  } catch (error) {
    console.error('❌ Error deleting conversation:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicateConversation();
