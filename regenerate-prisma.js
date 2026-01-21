// Script to regenerate Prisma client
// Run this after stopping the dev server: node regenerate-prisma.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Regenerating Prisma Client...\n');

try {
  // Try to delete the old client first
  const clientPath = path.join(__dirname, 'node_modules', '.prisma', 'client');
  if (fs.existsSync(clientPath)) {
    console.log('🗑️  Removing old Prisma client...');
    try {
      fs.rmSync(clientPath, { recursive: true, force: true });
      console.log('✅ Old client removed\n');
    } catch (err) {
      console.log('⚠️  Could not remove old client (might be locked)\n');
    }
  }

  // Generate new client
  console.log('🔨 Generating new Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\n✅ Prisma client regenerated successfully!');
  console.log('\n📌 Next steps:');
  console.log('   1. Restart your dev server: npm run dev');
  console.log('   2. Try creating a template again\n');

} catch (error) {
  console.error('\n❌ Error regenerating Prisma client:', error.message);
  console.log('\n💡 If you see file permission errors:');
  console.log('   1. Stop the dev server completely (Ctrl+C)');
  console.log('   2. Close any other processes using Node.js');
  console.log('   3. Run this script again: node regenerate-prisma.js');
  console.log('   4. Then restart: npm run dev\n');
  process.exit(1);
}
