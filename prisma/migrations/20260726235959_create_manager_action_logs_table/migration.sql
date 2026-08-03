-- Backfills a missing migration. `manager_action_logs` was originally created
-- via `prisma db push` during early development of the manager accountability
-- feature and was never captured as a migration, so any environment built
-- purely from `prisma migrate deploy` (never having run `db push`) is missing
-- this table entirely. That caused 20260727000004_expand_manager_action_types
-- to fail with P3018 ("table doesn't exist") when it tried to ALTER it.
--
-- This recreates the table as it looked BEFORE 20260727000004 widened
-- actionType (the original 8-value enum), so the existing chain of later
-- migrations (20260727000004, 20260728000001, 20260728000002) replays
-- exactly as it did in dev, progressively widening the enum to its current
-- state. IF NOT EXISTS makes this a safe no-op on databases (like local dev)
-- where the table already exists.

CREATE TABLE IF NOT EXISTS `manager_action_logs` (
  `id` VARCHAR(191) NOT NULL,
  `recordType` VARCHAR(191) NOT NULL,
  `serviceType` VARCHAR(191) NOT NULL,
  `recordId` VARCHAR(191) NOT NULL,
  `actionType` ENUM(
    'CALLED',
    'NOTE_ADDED',
    'FOLLOW_UP',
    'CONVERTED',
    'NOT_INTERESTED',
    'STATUS_CHANGED',
    'VENDOR_ASSIGNED',
    'CANCELLED'
  ) NOT NULL,
  `note` TEXT NULL,
  `previousStatus` VARCHAR(191) NULL,
  `newStatus` VARCHAR(191) NULL,
  `managerId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `manager_action_logs_managerId_createdAt_idx` (`managerId`, `createdAt`),
  INDEX `manager_action_logs_recordType_recordId_idx` (`recordType`, `recordId`),
  INDEX `manager_action_logs_recordType_serviceType_createdAt_idx` (`recordType`, `serviceType`, `createdAt`),

  CONSTRAINT `manager_action_logs_managerId_fkey`
    FOREIGN KEY (`managerId`) REFERENCES `admin_users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
