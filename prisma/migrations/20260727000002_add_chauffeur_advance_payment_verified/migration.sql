-- Add advancePaymentVerified column to chauffeur_bookings (idempotent).
-- Every other booking table (bike/bus/car/luxury/truck) already tracks this;
-- chauffeur_bookings was missing it, causing the admin panel to always show
-- "Verification Pending" for chauffeur bookings regardless of actual payment state.
DROP PROCEDURE IF EXISTS add_chauffeur_advance_payment_verified;
CREATE PROCEDURE add_chauffeur_advance_payment_verified()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'chauffeur_bookings'
          AND COLUMN_NAME = 'advancePaymentVerified'
    ) THEN
        ALTER TABLE `chauffeur_bookings` ADD COLUMN `advancePaymentVerified` BOOLEAN NOT NULL DEFAULT false;
    END IF;
END;
CALL add_chauffeur_advance_payment_verified();
DROP PROCEDURE IF EXISTS add_chauffeur_advance_payment_verified;
