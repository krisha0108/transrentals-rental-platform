-- Adds pageHeading + pageDescription to service_city_content so the new
-- admin block editor can fully replace the old /admin/services/<svc>/pages
-- UI. These two fields mirror seo_meta.pageHeading / pageDescription and
-- drive the visible hero text on each service-city page (H1 heading and
-- the supporting tagline below it).
--
-- After this migration, a follow-up data-migration script copies any
-- existing seo_meta overrides for "<service>:<city>" pageIds into the
-- matching service_city_content row so no admin edits are lost.
--
-- Defensive: both ADD COLUMN steps are wrapped in INFORMATION_SCHEMA
-- guards. Re-running on an environment where either column already exists
-- (e.g. someone applied it manually, or a future Prisma autosync) is a
-- no-op rather than an error. Mirrors the pattern used for the other
-- recent migrations in this project (see 20260514000001 and the
-- 20260512000001 recovery).

SET @col_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'service_city_content'
      AND COLUMN_NAME = 'pageHeading'
);
SET @sql_add := IF(@col_exists = 0,
    'ALTER TABLE `service_city_content` ADD COLUMN `pageHeading` VARCHAR(191) NULL AFTER `h1Heading`',
    'DO 0');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'service_city_content'
      AND COLUMN_NAME = 'pageDescription'
);
SET @sql_add := IF(@col_exists = 0,
    'ALTER TABLE `service_city_content` ADD COLUMN `pageDescription` TEXT NULL AFTER `pageHeading`',
    'DO 0');
PREPARE stmt FROM @sql_add; EXECUTE stmt; DEALLOCATE PREPARE stmt;
