-- bike_bookings was the only one of the ten booking tables without
-- cancelledAt/cancelledBy, so every route that handles all services with one
-- shared shape crashed on bike alone (vendor financials) or carried a
-- bike-only workaround (vendor cancelled-bookings).
--
-- Purely additive: both columns are nullable, so the existing rows are
-- untouched by the ALTER.
ALTER TABLE `bike_bookings`
  ADD COLUMN `cancelledAt` DATETIME(3) NULL,
  ADD COLUMN `cancelledBy` VARCHAR(191) NULL;

-- Backfill for bookings cancelled before the column existed. The real
-- cancellation timestamp was never recorded; updatedAt is the closest thing
-- to it, and is already what the vendor cancelled-bookings page has been
-- showing as the cancellation date for bikes. Without this the old rows sort
-- last with a blank date and disappear from any date-filtered view.
-- Approximate by nature — drop this statement if you would rather the old
-- rows stay honestly empty.
UPDATE `bike_bookings`
   SET `cancelledAt` = `updatedAt`
 WHERE `status` = 'CANCELLED'
   AND `cancelledAt` IS NULL;
