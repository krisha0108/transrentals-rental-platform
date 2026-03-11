-- Add uploadedById column to vendor_documents (idempotent)
DROP PROCEDURE IF EXISTS add_vendor_documents_uploadedById;
CREATE PROCEDURE add_vendor_documents_uploadedById()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'vendor_documents'
          AND COLUMN_NAME = 'uploadedById'
    ) THEN
        ALTER TABLE `vendor_documents` ADD COLUMN `uploadedById` VARCHAR(191) NULL;
        ALTER TABLE `vendor_documents` ADD CONSTRAINT `fk_vendor_documents_uploadedById` FOREIGN KEY (`uploadedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
        CREATE INDEX `vendor_documents_uploadedById_idx` ON `vendor_documents`(`uploadedById`);
    END IF;
END;
CALL add_vendor_documents_uploadedById();
DROP PROCEDURE IF EXISTS add_vendor_documents_uploadedById;
