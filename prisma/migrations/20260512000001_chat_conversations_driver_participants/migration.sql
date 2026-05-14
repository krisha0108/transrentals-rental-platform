-- Bring `chat_conversations` in sync with the Prisma schema.
--
-- The schema had driver / staff-driver participant fields and a
-- participantType discriminator added, plus `vendorId` was relaxed to
-- nullable, but no migration was created. Prisma queries that select these
-- columns fail at runtime with:
--   "The column trans_stable.chat_conversations.driverId does not exist
--    in the current database."
--
-- This migration adds the four missing columns, relaxes vendorId, and
-- adds the supporting indexes / FK that the Prisma schema declares.

-- ── 1. New participant + counter columns ────────────────────────────────────
ALTER TABLE `chat_conversations`
  ADD COLUMN `driverId` VARCHAR(191) NULL,
  ADD COLUMN `staffDriverId` VARCHAR(191) NULL,
  ADD COLUMN `participantType` VARCHAR(191) NOT NULL DEFAULT 'vendor',
  ADD COLUMN `driverUnread` INT NOT NULL DEFAULT 0;

-- ── 2. Relax vendorId to NULL (schema declares `vendorId String?`) ──────────
-- Must drop the FK before changing nullability, then re-add it.
ALTER TABLE `chat_conversations` DROP FOREIGN KEY `chat_conversations_vendorId_fkey`;
ALTER TABLE `chat_conversations` MODIFY COLUMN `vendorId` VARCHAR(191) NULL;
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `chat_conversations_vendorId_fkey`
  FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 3. Indexes for the new participant columns ──────────────────────────────
CREATE INDEX `chat_conversations_driverId_idx` ON `chat_conversations`(`driverId`);
CREATE INDEX `chat_conversations_staffDriverId_idx` ON `chat_conversations`(`staffDriverId`);

-- ── 4. Composite unique keys (mirror Prisma @@unique declarations) ──────────
CREATE UNIQUE INDEX `chat_conversations_customerId_driverId_bookingType_bookingId_key`
  ON `chat_conversations`(`customerId`, `driverId`, `bookingType`, `bookingId`);
CREATE UNIQUE INDEX `chat_conversations_customerId_staffDriverId_bookingType_bookingI_key`
  ON `chat_conversations`(`customerId`, `staffDriverId`, `bookingType`, `bookingId`);

-- ── 5. FK from driverId → drivers.id ────────────────────────────────────────
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `chat_conversations_driverId_fkey`
  FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
