-- Add a UPI ID alongside the existing bank fields, for drivers and
-- vendor-employed staff (both edit through the same profile form).
ALTER TABLE `drivers` ADD COLUMN `upiId` VARCHAR(191) NULL;
ALTER TABLE `vendor_staff` ADD COLUMN `upiId` VARCHAR(191) NULL;
