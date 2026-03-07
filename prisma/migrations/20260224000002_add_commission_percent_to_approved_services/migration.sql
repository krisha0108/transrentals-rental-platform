-- AlterTable: Add commissionPercent to vendor_approved_services (idempotent)
DROP PROCEDURE IF EXISTS add_commission_percent;
CREATE PROCEDURE add_commission_percent()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_approved_services'
        AND COLUMN_NAME = 'commissionPercent'
    ) THEN
        ALTER TABLE `vendor_approved_services` ADD COLUMN `commissionPercent` DOUBLE NOT NULL DEFAULT 0;
    END IF;
END;
CALL add_commission_percent();
DROP PROCEDURE add_commission_percent;
