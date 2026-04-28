-- AlterTable: add status, resolution, resolvedAt to contact_inquiries
ALTER TABLE `contact_inquiries`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
  ADD COLUMN `resolution` TEXT NULL,
  ADD COLUMN `resolvedAt` DATETIME(3) NULL;
