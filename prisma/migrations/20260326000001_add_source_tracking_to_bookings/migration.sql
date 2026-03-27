-- Add source tracking to all booking/quote tables
-- Tracks whether inquiry came from 'web' (website) or 'app' (mobile app)
-- Safe: will not error if column already exists (MariaDB/MySQL 10.x+ compatible)

-- Quote request tables
ALTER TABLE `chauffeur_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `self_drive_quote_requests` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `bike_quote_requests` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `bus_quote_requests` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `luxury_quote_requests` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `truck_quote_requests` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `packers_quote_requests` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `equipment_quote_requests` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';

-- Confirmed booking tables
ALTER TABLE `bike_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `car_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `bus_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `luxury_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `truck_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `packers_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
ALTER TABLE `equipment_bookings` ADD COLUMN IF NOT EXISTS `source` VARCHAR(20) NULL DEFAULT 'web';
