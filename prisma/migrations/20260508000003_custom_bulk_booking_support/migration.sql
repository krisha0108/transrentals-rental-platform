-- Custom-bulk multi-day, multi-service event bookings flow through the existing
-- B2B infrastructure. Two safe, additive changes to b2b_bookings:
--
--  1. companyName becomes nullable — custom-bulk requesters are often individuals
--     (event organisers, families, wedding planners) who have no company name.
--     Existing rows are unaffected; the constraint is only relaxed.
--
--  2. bulkBreakdown LONGTEXT — JSON payload describing the full event plan:
--     { occasion_type, occasion_name, total_days, total_people,
--       base_location, services_used: [...],
--       start_datetime, end_datetime,
--       days: [{ date, services: [{ service_type, vehicles: [{ id, count, ... }],
--                                   people_count, pickup, drop, time, notes }] }] }
--     Only populated when serviceType = 'CUSTOM_BULK'; NULL for regular B2B rows.
--
-- Both operations are MySQL 8.0+ INSTANT DDL — metadata-only, no table rewrite.
-- Reversible by ALTER TABLE DROP COLUMN bulkBreakdown + restore NOT NULL.

ALTER TABLE `b2b_bookings`
    MODIFY `companyName` VARCHAR(191) NULL,
    ADD COLUMN `bulkBreakdown` LONGTEXT NULL;
