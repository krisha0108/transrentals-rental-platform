-- Add advance payment fields to truck_quotes
ALTER TABLE `truck_quotes` ADD COLUMN `advanceAmount` DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE `truck_quotes` ADD COLUMN `advancePercent` INTEGER NOT NULL DEFAULT 50;

-- Add advance payment fields to packers_quotes
ALTER TABLE `packers_quotes` ADD COLUMN `advanceAmount` DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE `packers_quotes` ADD COLUMN `advancePercent` INTEGER NOT NULL DEFAULT 50;

-- Add advance payment fields to equipment_quotes
ALTER TABLE `equipment_quotes` ADD COLUMN `advanceAmount` DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE `equipment_quotes` ADD COLUMN `advancePercent` INTEGER NOT NULL DEFAULT 30;
