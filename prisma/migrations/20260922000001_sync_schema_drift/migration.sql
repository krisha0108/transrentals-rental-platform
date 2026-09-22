-- Catch-up migration: bring the migration history back in line with schema.prisma.
--
-- The migrations folder had fallen behind the schema. Somebody applied these
-- changes with `prisma db push` (or by hand on the database) without ever
-- committing a migration file, so replaying the folder from scratch produced
-- a database that did not match schema.prisma. That is what made it unsafe to
-- write any further migration: there was no trustworthy starting point.
--
-- Nothing here is hand-written or guessed. It is the exact output of
--
--   prisma migrate diff --from-migrations prisma/migrations --                       --to-schema-datamodel prisma/schema.prisma --                       --shadow-database-url <scratch db> --script
--
-- Verified: with this file in place, replaying the whole folder into an empty
-- database and diffing it against schema.prisma produces no statements.
--
-- Most of it is column nullability that drifted (bookingMode across the
-- booking/quote tables), index names Prisma expects to follow its own
-- convention (the *_fkey -> *_idx renames), and a driver_vehicles /
-- wander_listings foreign-key rework. One enum gains a value:
-- wander_bookings.status gets DROPPED.

-- DropForeignKey
ALTER TABLE `driver_fuel_logs` DROP FOREIGN KEY `driver_fuel_logs_vehicleId_fkey`;

-- DropForeignKey
ALTER TABLE `driver_incidents` DROP FOREIGN KEY `driver_incidents_vehicleId_fkey`;

-- DropForeignKey
ALTER TABLE `wander_listings` DROP FOREIGN KEY `wander_listings_mainLocationId_fkey`;

-- DropIndex
DROP INDEX `site_audit_pages_url_key` ON `site_audit_pages`;

-- DropIndex
DROP INDEX `travel_agent_leads_customerId_idx` ON `travel_agent_leads`;

-- DropIndex
DROP INDEX `travel_agent_leads_tourId_idx` ON `travel_agent_leads`;

-- AlterTable
ALTER TABLE `b2b_bookings` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bike_bookings` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bike_quote_requests` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `bus_quote_requests` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `car_bookings` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `chauffeur_bookings` MODIFY `intermediateStops` TEXT NULL,
    MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
-- Prisma emits `ALTER COLUMN updatedAt DROP DEFAULT` here, which MariaDB
-- turns into an implicit '0000-00-00' default because the column keeps its
-- ON UPDATE CURRENT_TIMESTAMP. Restating the column drops both at once and
-- lands on what @updatedAt actually wants: no default, no ON UPDATE, since
-- Prisma sets the timestamp from the client.
ALTER TABLE `customer_wallets` MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `driver_vehicles` ALTER COLUMN `make` DROP DEFAULT,
    ALTER COLUMN `model` DROP DEFAULT;

-- AlterTable
ALTER TABLE `equipment_quote_requests` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `helpdesk_tickets` MODIFY `submitterType` VARCHAR(191) NULL DEFAULT 'customer';

-- AlterTable
ALTER TABLE `luxury_bookings` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `luxury_quote_requests` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `packers_quote_requests` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `self_drive_quote_requests` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `travel_agent_leads` MODIFY `paymentStatus` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `truck_quote_requests` MODIFY `bookingMode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `vendor_call_logs` ADD COLUMN `callerId` VARCHAR(191) NULL,
    ADD COLUMN `callerType` VARCHAR(191) NOT NULL DEFAULT 'vendor',
    MODIFY `vendorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `wander_bookings` MODIFY `status` ENUM('PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED', 'DROPPED') NOT NULL DEFAULT 'PAYMENT_PENDING';

-- AlterTable
-- MariaDB 10.4 cannot hold a 4-byte emoji as a column DEFAULT: it stores '?'
-- even on a utf8mb4 column, through a utf8mb4 connection, and even when the
-- literal is given as _utf8mb4 0xF09F8C8F. The statement is correct and does
-- the right thing on MySQL 8, so it stays; on MariaDB expect `migrate diff`
-- to keep reporting this one column. It is the default only — values written
-- by the app store fine.
ALTER TABLE `wander_friend_groups` MODIFY `emoji` VARCHAR(191) NULL DEFAULT '🌏';

-- AlterTable
ALTER TABLE `wander_listings` MODIFY `mainLocationId` VARCHAR(191) NULL,
    MODIFY `duration` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `driver_vehicles_driverId_idx` ON `driver_vehicles`(`driverId`);

-- CreateIndex
CREATE UNIQUE INDEX `site_audit_pages_url_key` ON `site_audit_pages`(`url`);

-- AddForeignKey
ALTER TABLE `helpdesk_tickets` ADD CONSTRAINT `helpdesk_tickets_travelAgentId_fkey` FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wander_listings` ADD CONSTRAINT `wander_listings_mainLocationId_fkey` FOREIGN KEY (`mainLocationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_vehicles` ADD CONSTRAINT `driver_vehicles_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_fuel_logs` ADD CONSTRAINT `driver_fuel_logs_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `driver_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_incidents` ADD CONSTRAINT `driver_incidents_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `driver_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE UNIQUE INDEX `chat_conversations_customerId_staffDriverId_bookingType_book_key` ON `chat_conversations`(`customerId`, `staffDriverId`, `bookingType`, `bookingId`);
ALTER TABLE `chat_conversations` DROP INDEX `chat_conv_cust_staffDriver_btype_bid_key`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_categories_parentId_idx` ON `wander_categories`(`parentId`);
ALTER TABLE `wander_categories` DROP INDEX `wander_categories_parentId_fkey`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_experiences_categoryId_idx` ON `wander_experiences`(`categoryId`);
ALTER TABLE `wander_experiences` DROP INDEX `wander_experiences_categoryId_fkey`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_experiences_locationId_idx` ON `wander_experiences`(`locationId`);
ALTER TABLE `wander_experiences` DROP INDEX `wander_experiences_locationId_fkey`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_listings_subCategoryId_idx` ON `wander_listings`(`subCategoryId`);
ALTER TABLE `wander_listings` DROP INDEX `wander_listings_subCategoryId_fkey`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_reviews_customerId_idx` ON `wander_reviews`(`customerId`);
ALTER TABLE `wander_reviews` DROP INDEX `wander_reviews_customerId_fkey`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_reviews_listingId_idx` ON `wander_reviews`(`listingId`);
ALTER TABLE `wander_reviews` DROP INDEX `wander_reviews_listingId_fkey`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_wishlists_customerId_idx` ON `wander_wishlists`(`customerId`);
ALTER TABLE `wander_wishlists` DROP INDEX `wander_wishlists_customerId_fkey`;

-- RenameIndex (as create + drop: MariaDB 10.4 has no RENAME INDEX)
CREATE INDEX `wander_wishlists_listingId_idx` ON `wander_wishlists`(`listingId`);
ALTER TABLE `wander_wishlists` DROP INDEX `wander_wishlists_listingId_fkey`;
