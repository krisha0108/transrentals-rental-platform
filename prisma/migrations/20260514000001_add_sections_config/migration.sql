-- Adds block-based section config storage to service_city_content.
--
-- `sectionsConfig` holds a JSON array of SectionConfig objects:
--   [{ id, label, visible, order, canHide, content, isCustom }]
-- This mirrors the established city-pages pattern (seo_meta.sectionsConfig)
-- and allows each service-city page to define its own ordered list of
-- sections — including service-specific ones (e.g. machine_specs for JCB,
-- packages for wedding-car-rental) and admin-created custom sections.
--
-- Additive change: existing rows unaffected. The legacy structured fields
-- (intro, whyChooseUs, popularVehicles, servicesOffered, faqs, tips, routes)
-- remain in place during the transition; a follow-up seed script will
-- backfill sectionsConfig from them.
--
-- LONGTEXT chosen to match the existing schema convention for JSON-style
-- columns and to allow rich HTML content per section without size limits.
--
-- The ADD COLUMN step is wrapped in an INFORMATION_SCHEMA check so it does
-- nothing if `sectionsConfig` already exists. Fresh production databases
-- hit the ADD COLUMN branch normally; environments where the column was
-- already added manually or by an earlier version of this migration are
-- left untouched.

SET @sectionsConfig_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'service_city_content'
      AND COLUMN_NAME = 'sectionsConfig'
);
SET @add_col_sql := IF(
    @sectionsConfig_exists = 0,
    'ALTER TABLE `service_city_content` ADD COLUMN `sectionsConfig` LONGTEXT NULL AFTER `routes`',
    'DO 0'
);
PREPARE add_col_stmt FROM @add_col_sql;
EXECUTE add_col_stmt;
DEALLOCATE PREPARE add_col_stmt;
