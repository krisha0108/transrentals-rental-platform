-- Add payment reference fields to packers_bookings
ALTER TABLE `packers_bookings`
  ADD COLUMN `advancePaymentRef` VARCHAR(191) NULL,
  ADD COLUMN `advancePaymentDate` DATETIME(3) NULL,
  ADD COLUMN `paymentMethod` VARCHAR(50) NULL;

-- Add payment reference fields to equipment_bookings
ALTER TABLE `equipment_bookings`
  ADD COLUMN `advancePaymentRef` VARCHAR(191) NULL,
  ADD COLUMN `advancePaymentDate` DATETIME(3) NULL,
  ADD COLUMN `paymentMethod` VARCHAR(50) NULL;
