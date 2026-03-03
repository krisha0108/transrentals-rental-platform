-- Add uploadedById column to vendor_documents if it doesn't exist

DROP PROCEDURE IF EXISTS add_uploaded_by;
CREATE PROCEDURE add_uploaded_by()
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_documents'
        AND COLUMN_NAME = 'uploadedById'
    ) THEN
        ALTER TABLE `vendor_documents` ADD COLUMN `uploadedById` VARCHAR(191) NULL;
    END IF;

    -- Drop old FK if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_documents'
        AND CONSTRAINT_NAME = 'fk_vendor_documents_uploadedById' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE `vendor_documents` DROP FOREIGN KEY `fk_vendor_documents_uploadedById`;
    END IF;

    -- Drop old index if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_documents'
        AND INDEX_NAME = 'idx_vendor_documents_uploadedById'
    ) THEN
        DROP INDEX `idx_vendor_documents_uploadedById` ON `vendor_documents`;
    END IF;

    -- Create Prisma-convention index if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_documents'
        AND INDEX_NAME = 'vendor_documents_uploadedById_idx'
    ) THEN
        CREATE INDEX `vendor_documents_uploadedById_idx` ON `vendor_documents`(`uploadedById`);
    END IF;

    -- Create Prisma-convention FK if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_documents'
        AND CONSTRAINT_NAME = 'vendor_documents_uploadedById_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE `vendor_documents` ADD CONSTRAINT `vendor_documents_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END;

CALL add_uploaded_by();
DROP PROCEDURE add_uploaded_by;
