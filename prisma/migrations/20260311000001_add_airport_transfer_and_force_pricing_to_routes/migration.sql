-- Add isAirportTransfer and forcePackagePricing to chauffeur_route_packages (idempotent)
DROP PROCEDURE IF EXISTS add_route_package_pricing_flags;
CREATE PROCEDURE add_route_package_pricing_flags()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'chauffeur_route_packages'
          AND COLUMN_NAME = 'isAirportTransfer'
    ) THEN
        ALTER TABLE `chauffeur_route_packages` ADD COLUMN `isAirportTransfer` BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'chauffeur_route_packages'
          AND COLUMN_NAME = 'forcePackagePricing'
    ) THEN
        ALTER TABLE `chauffeur_route_packages` ADD COLUMN `forcePackagePricing` BOOLEAN NOT NULL DEFAULT false;
    END IF;
END;
CALL add_route_package_pricing_flags();
DROP PROCEDURE IF EXISTS add_route_package_pricing_flags;
