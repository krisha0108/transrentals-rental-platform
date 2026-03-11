-- Add servicePageId, pageHeading, pageDescription to seo_meta (idempotent)

DROP PROCEDURE IF EXISTS add_seo_meta_service_page_fields;
CREATE PROCEDURE add_seo_meta_service_page_fields()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'seo_meta'
          AND COLUMN_NAME = 'servicePageId'
    ) THEN
        ALTER TABLE `seo_meta` ADD COLUMN `servicePageId` VARCHAR(191) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'seo_meta'
          AND COLUMN_NAME = 'pageHeading'
    ) THEN
        ALTER TABLE `seo_meta` ADD COLUMN `pageHeading` VARCHAR(191) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'seo_meta'
          AND COLUMN_NAME = 'pageDescription'
    ) THEN
        ALTER TABLE `seo_meta` ADD COLUMN `pageDescription` TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'seo_meta'
          AND INDEX_NAME = 'seo_meta_servicePageId_key'
    ) THEN
        CREATE UNIQUE INDEX `seo_meta_servicePageId_key` ON `seo_meta`(`servicePageId`);
    END IF;
END;
CALL add_seo_meta_service_page_fields();
DROP PROCEDURE IF EXISTS add_seo_meta_service_page_fields;
