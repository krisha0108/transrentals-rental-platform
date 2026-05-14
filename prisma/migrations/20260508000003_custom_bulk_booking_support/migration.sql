-- Custom-bulk multi-day, multi-service event bookings flow through the existing
-- B2B infrastructure. Two safe, additive changes to b2b_bookings:
--
--  1. companyName becomes nullable — custom-bulk requesters are often individuals
--     (event organisers, families, wedding planners) who have no company name.
--     Existing rows are unaffected; the constraint is only relaxed. The MODIFY
--     operation is naturally idempotent (re-applying the same column definition
--     is a no-op).
--
--  2. bulkBreakdown LONGTEXT — JSON payload describing the full event plan:
--     { occasion_type, occasion_name, total_days, total_people,
--       base_location, services_used: [...],
--       start_datetime, end_datetime,
--       days: [{ date, services: [{ service_type, vehicles: [{ id, count, ... }],
--                                   people_count, pickup, drop, time, notes }] }] }
--     Only populated when serviceType = 'CUSTOM_BULK'; NULL for regular B2B rows.
--
-- The ADD COLUMN step is wrapped in an INFORMATION_SCHEMA check so it does
-- nothing if `bulkBreakdown` already exists. This makes the migration safe
-- to apply on environments where an earlier renamed migration (visible in
-- some `_prisma_migrations` histories as 20260508000001) already added the
-- column. Fresh production databases hit the ADD COLUMN branch normally.
--
-- Both operations are MySQL 8.0+ INSTANT DDL — metadata-only, no table rewrite.
-- Reversible by ALTER TABLE DROP COLUMN bulkBreakdown + restore NOT NULL.

ALTER TABLE `b2b_bookings` MODIFY `companyName` VARCHAR(191) NULL;

SET @bulkBreakdown_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'b2b_bookings'
      AND COLUMN_NAME = 'bulkBreakdown'
);
SET @add_col_sql := IF(
    @bulkBreakdown_exists = 0,
    'ALTER TABLE `b2b_bookings` ADD COLUMN `bulkBreakdown` LONGTEXT NULL',
    'DO 0'
);
PREPARE add_col_stmt FROM @add_col_sql;
EXECUTE add_col_stmt;
DEALLOCATE PREPARE add_col_stmt;
