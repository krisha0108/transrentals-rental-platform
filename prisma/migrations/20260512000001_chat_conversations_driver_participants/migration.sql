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
--
-- DEFENSIVE: every step is wrapped in a check so the migration is safe to
-- re-apply on databases where some or all of the operations are already in
-- place. This is needed because:
--   (a) The earlier non-defensive version of this migration was applied
--       partially on production and got stuck on query 8 (a unique index
--       whose auto-generated name exceeded the 64-char MySQL identifier
--       limit). Rolling it back and re-running has to skip the parts that
--       already succeeded.
--   (b) Some local environments had `driverId` added manually before this
--       migration existed, hitting the same "duplicate column" 1060 error.
--
-- Also: the unique index over (customerId, staffDriverId, bookingType,
-- bookingId) is created with a SHORTER explicit name to stay under MySQL's
-- 64-char identifier limit. The longer Prisma-auto-truncated name
-- (`chat_conversations_customerId_staffDriverId_bookingType_bookingI_key`,
-- 68 chars) is what caused the original failure.

-- ── helper: idempotent ADD COLUMN via prepared statement ───────────────────
-- Note: each step uses its own session-vars (@col_name_exists / @sql_*) so
-- they do not collide with each other.

-- 1.1 driverId
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'driverId'
);
SET @sql_add := IF(@col_exists = 0,
  'ALTER TABLE `chat_conversations` ADD COLUMN `driverId` VARCHAR(191) NULL',
  'DO 0');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.2 staffDriverId
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'staffDriverId'
);
SET @sql_add := IF(@col_exists = 0,
  'ALTER TABLE `chat_conversations` ADD COLUMN `staffDriverId` VARCHAR(191) NULL',
  'DO 0');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.3 participantType
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'participantType'
);
SET @sql_add := IF(@col_exists = 0,
  "ALTER TABLE `chat_conversations` ADD COLUMN `participantType` VARCHAR(191) NOT NULL DEFAULT 'vendor'",
  'DO 0');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1.4 driverUnread
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'driverUnread'
);
SET @sql_add := IF(@col_exists = 0,
  'ALTER TABLE `chat_conversations` ADD COLUMN `driverUnread` INT NOT NULL DEFAULT 0',
  'DO 0');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 2. Relax vendorId to NULL (drop FK, modify, re-add FK) ─────────────────

-- 2.1 Drop FK only if it exists
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND CONSTRAINT_NAME = 'chat_conversations_vendorId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_drop := IF(@fk_exists > 0,
  'ALTER TABLE `chat_conversations` DROP FOREIGN KEY `chat_conversations_vendorId_fkey`',
  'DO 0');
PREPARE stmt FROM @sql_drop; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.2 MODIFY column is naturally idempotent (re-stating same definition is a no-op)
ALTER TABLE `chat_conversations` MODIFY COLUMN `vendorId` VARCHAR(191) NULL;

-- 2.3 Re-add FK only if missing
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND CONSTRAINT_NAME = 'chat_conversations_vendorId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_add := IF(@fk_exists = 0,
  'ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'DO 0');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 3. Indexes for the new participant columns (idempotent) ────────────────

-- 3.1 driverId index
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND INDEX_NAME = 'chat_conversations_driverId_idx'
);
SET @sql_idx := IF(@idx_exists = 0,
  'CREATE INDEX `chat_conversations_driverId_idx` ON `chat_conversations`(`driverId`)',
  'DO 0');
PREPARE stmt FROM @sql_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3.2 staffDriverId index
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND INDEX_NAME = 'chat_conversations_staffDriverId_idx'
);
SET @sql_idx := IF(@idx_exists = 0,
  'CREATE INDEX `chat_conversations_staffDriverId_idx` ON `chat_conversations`(`staffDriverId`)',
  'DO 0');
PREPARE stmt FROM @sql_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 4. Composite unique keys (idempotent, with shorter names) ──────────────

-- 4.1 customer + driver
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND INDEX_NAME = 'chat_conversations_customerId_driverId_bookingType_bookingId_key'
);
SET @sql_idx := IF(@idx_exists = 0,
  'CREATE UNIQUE INDEX `chat_conversations_customerId_driverId_bookingType_bookingId_key` ON `chat_conversations`(`customerId`, `driverId`, `bookingType`, `bookingId`)',
  'DO 0');
PREPARE stmt FROM @sql_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4.2 customer + staffDriver — uses a SHORTER name (37 chars) to stay
-- under MySQL's 64-char identifier limit. The original Prisma-generated
-- name was 68 chars and caused error 1059 on this very migration.
-- If an environment somehow already has the broken longer name (it
-- never succeeded, but defensively check both):
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND INDEX_NAME IN (
      'chat_conv_cust_staffDriver_btype_bid_key',
      'chat_conversations_customerId_staffDriverId_bookingType_bookingI_key'
    )
);
SET @sql_idx := IF(@idx_exists = 0,
  'CREATE UNIQUE INDEX `chat_conv_cust_staffDriver_btype_bid_key` ON `chat_conversations`(`customerId`, `staffDriverId`, `bookingType`, `bookingId`)',
  'DO 0');
PREPARE stmt FROM @sql_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ── 5. FK from driverId → drivers.id (idempotent) ──────────────────────────

SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_conversations'
    AND CONSTRAINT_NAME = 'chat_conversations_driverId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk := IF(@fk_exists = 0,
  'ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'DO 0');
PREPARE stmt FROM @sql_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;
