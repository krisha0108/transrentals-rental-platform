-- Put back the unique index that 20260922000001_sync_schema_drift dropped and
-- then failed to recreate, and make it one every server will accept.
--
-- What happened. That migration emitted:
--
--     DROP   INDEX `site_audit_pages_url_key` ON `site_audit_pages`;
--     ...
--     CREATE UNIQUE INDEX `site_audit_pages_url_key` ON `site_audit_pages`(`url`);
--
-- The drop ran. The create could not: `url` is VARCHAR(1000) in utf8mb4, so a
-- whole-column key is 4000 bytes and InnoDB stops at 3072 (error 1071). MySQL
-- does not roll DDL back, so production was left holding the column with no
-- unique constraint on it at all.
--
-- Why it was not caught. Development runs MariaDB 10.4, production runs MySQL
-- 8. MariaDB accepts that exact statement without error or warning and quietly
-- builds a whole-column index; MySQL rejects it. The statement was tested, it
-- passed, and it was still impossible where it mattered.
--
-- The index this table has always had is a 768-character prefix — 768 x 4 =
-- 3072 bytes, exactly the ceiling — which is how 20260825095300 created it.
-- schema.prisma now says so with `@unique(length: 768)`, so `migrate diff`
-- stops generating the impossible form.
--
-- Every statement below inspects the database before it changes it, and
-- converges on the right index from any starting state: missing (production
-- after the failure), already correct (development), or whole-column (a
-- database built by replaying this folder on MariaDB). The previous migration
-- assumed a state instead of asking, and a duplicate index name was enough to
-- halt it half-applied and take the site down.

-- ── site_audit_pages.url ────────────────────────────────────────────────────
-- Drop it only if it is there but wrong: not unique, or not the 768 prefix.
SET @wrong_index := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'site_audit_pages'
    AND INDEX_NAME = 'site_audit_pages_url_key'
    AND (NON_UNIQUE <> 0 OR SUB_PART IS NULL OR SUB_PART <> 768)
);

SET @sql := IF(
  @wrong_index > 0,
  'DROP INDEX `site_audit_pages_url_key` ON `site_audit_pages`',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Then create it if it is now absent.
SET @has_index := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'site_audit_pages'
    AND INDEX_NAME = 'site_audit_pages_url_key'
);

SET @sql := IF(
  @has_index = 0,
  'CREATE UNIQUE INDEX `site_audit_pages_url_key` ON `site_audit_pages`(`url`(768))',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── driver_vehicles.driverId ────────────────────────────────────────────────
-- The index whose duplicate name (error 1061) stopped the previous migration
-- at statement 27. It is already on production; it may be missing on a
-- database built from this folder.
SET @has_index := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'driver_vehicles'
    AND INDEX_NAME = 'driver_vehicles_driverId_idx'
);

SET @sql := IF(
  @has_index = 0,
  'CREATE INDEX `driver_vehicles_driverId_idx` ON `driver_vehicles`(`driverId`)',
  'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
