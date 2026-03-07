-- AlterTable: add kmLimit, extraKmRate, securityDeposit to vehicle_model_locations
ALTER TABLE `vehicle_model_locations`
  ADD COLUMN IF NOT EXISTS `kmLimit` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `extraKmRate` DOUBLE NULL,
  ADD COLUMN IF NOT EXISTS `securityDeposit` DOUBLE NULL;
