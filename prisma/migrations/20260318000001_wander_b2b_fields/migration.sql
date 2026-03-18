-- AlterTable: add bookingFor and companyName to wander_quote_requests
ALTER TABLE `wander_quote_requests`
  ADD COLUMN `bookingFor` VARCHAR(191) NOT NULL DEFAULT 'PERSONAL',
  ADD COLUMN `companyName` VARCHAR(191) NULL;

-- AlterTable: add B2B and invoice fields to wander_bookings
ALTER TABLE `wander_bookings`
  ADD COLUMN `isB2BBooking` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `companyName` VARCHAR(191) NULL,
  ADD COLUMN `invoiceSent` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `invoiceSentAt` DATETIME(3) NULL,
  ADD COLUMN `invoiceNotes` TEXT NULL;
