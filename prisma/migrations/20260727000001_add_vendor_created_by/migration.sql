-- Add createdById column to vendors (idempotent) — tracks which manager/admin
-- created a vendor record directly (see /manager/vendors/create).
DROP PROCEDURE IF EXISTS add_vendor_created_by;
CREATE PROCEDURE add_vendor_created_by()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'vendors'
          AND COLUMN_NAME = 'createdById'
    ) THEN
        ALTER TABLE `vendors` ADD COLUMN `createdById` VARCHAR(191) NULL;
        CREATE INDEX `vendors_createdById_fkey` ON `vendors`(`createdById`);
        ALTER TABLE `vendors` ADD CONSTRAINT `vendors_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END;
CALL add_vendor_created_by();
DROP PROCEDURE IF EXISTS add_vendor_created_by;
