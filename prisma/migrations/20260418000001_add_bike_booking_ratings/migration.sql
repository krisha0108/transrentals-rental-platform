-- AlterTable: Add rating fields to bike_bookings
ALTER TABLE `bike_bookings` ADD COLUMN `rating` INTEGER NULL;
ALTER TABLE `bike_bookings` ADD COLUMN `review` TEXT NULL;
ALTER TABLE `bike_bookings` ADD COLUMN `driverRating` INTEGER NULL;
ALTER TABLE `bike_bookings` ADD COLUMN `vehicleRating` INTEGER NULL;
