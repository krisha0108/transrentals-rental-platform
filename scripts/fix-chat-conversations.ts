import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

const steps: Array<[string, string]> = [
  ['+ driverId', 'ALTER TABLE `chat_conversations` ADD COLUMN `driverId` VARCHAR(191) NULL'],
  ['+ staffDriverId', 'ALTER TABLE `chat_conversations` ADD COLUMN `staffDriverId` VARCHAR(191) NULL'],
  ["+ participantType", "ALTER TABLE `chat_conversations` ADD COLUMN `participantType` VARCHAR(191) NOT NULL DEFAULT 'vendor'"],
  ['+ driverUnread', 'ALTER TABLE `chat_conversations` ADD COLUMN `driverUnread` INT NOT NULL DEFAULT 0'],
  ['- vendorId FK', 'ALTER TABLE `chat_conversations` DROP FOREIGN KEY `chat_conversations_vendorId_fkey`'],
  ['~ vendorId nullable', 'ALTER TABLE `chat_conversations` MODIFY COLUMN `vendorId` VARCHAR(191) NULL'],
  ['+ vendorId FK', 'ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'],
  ['+ idx driverId', 'CREATE INDEX `chat_conversations_driverId_idx` ON `chat_conversations`(`driverId`)'],
  ['+ idx staffDriverId', 'CREATE INDEX `chat_conversations_staffDriverId_idx` ON `chat_conversations`(`staffDriverId`)'],
];

(async () => {
  for (const [label, sql] of steps) {
    try {
      await p.$executeRawUnsafe(sql);
      console.log(label);
    } catch (e: any) {
      console.log(`SKIP ${label} — ${e.message?.split('\n')[0]}`);
    }
  }
  await p.$disconnect();
})();
