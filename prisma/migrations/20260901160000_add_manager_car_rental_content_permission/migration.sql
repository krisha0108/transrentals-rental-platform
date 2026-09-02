-- AlterTable
ALTER TABLE `admin_users` ADD COLUMN `canManageCarRentalContent` BOOLEAN NOT NULL DEFAULT false AFTER `phone`;
