-- AlterTable: add kmLimit, extraKmRate, securityDeposit to vehicle_model_locations
-- Using stored procedure for idempotency (ADD COLUMN IF NOT EXISTS not supported in all MySQL versions)

DROP PROCEDURE IF EXISTS add_vehicle_model_location_pricing_fields;
CREATE PROCEDURE add_vehicle_model_location_pricing_fields()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_model_locations' AND COLUMN_NAME = 'kmLimit'
    ) THEN
        ALTER TABLE `vehicle_model_locations` ADD COLUMN `kmLimit` INTEGER NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_model_locations' AND COLUMN_NAME = 'extraKmRate'
    ) THEN
        ALTER TABLE `vehicle_model_locations` ADD COLUMN `extraKmRate` DOUBLE NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_model_locations' AND COLUMN_NAME = 'securityDeposit'
    ) THEN
        ALTER TABLE `vehicle_model_locations` ADD COLUMN `securityDeposit` DOUBLE NULL;
    END IF;
END;
CALL add_vehicle_model_location_pricing_fields();
DROP PROCEDURE IF EXISTS add_vehicle_model_location_pricing_fields;
