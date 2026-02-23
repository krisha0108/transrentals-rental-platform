-- CreateEnum
-- Check if enums already exist before creating (idempotent)

-- P2P Enums (MySQL uses inline ENUMs in column definitions, not standalone types)
-- The enums are defined in the CREATE TABLE statements below

-- CreateTable
CREATE TABLE IF NOT EXISTS `p2p_vehicle_postings` (
    `id` VARCHAR(191) NOT NULL,
    `postingNumber` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `capacity` VARCHAR(191) NULL,
    `bodyType` VARCHAR(191) NULL,
    `fromCity` VARCHAR(191) NOT NULL,
    `toCity` VARCHAR(191) NOT NULL,
    `departureDate` DATETIME(3) NOT NULL,
    `departureTime` VARCHAR(191) NULL,
    `arrivalDate` DATETIME(3) NULL,
    `arrivalTime` VARCHAR(191) NULL,
    `priceFullLoad` DOUBLE NULL,
    `pricePartLoad` DOUBLE NULL,
    `acceptsPartLoad` BOOLEAN NOT NULL DEFAULT false,
    `availableSpace` VARCHAR(191) NULL,
    `driverIncluded` BOOLEAN NOT NULL DEFAULT true,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `fuelIncluded` BOOLEAN NOT NULL DEFAULT false,
    `labourAvailable` BOOLEAN NOT NULL DEFAULT false,
    `labourCount` INTEGER NULL,
    `goodsAccepted` LONGTEXT NULL,
    `totalSeats` INTEGER NULL,
    `availableSeats` INTEGER NULL,
    `busType` VARCHAR(191) NULL,
    `isAC` BOOLEAN NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `p2p_vehicle_postings_postingNumber_key`(`postingNumber`),
    INDEX `p2p_vehicle_postings_vendorId_idx`(`vendorId`),
    INDEX `p2p_vehicle_postings_vehicleId_idx`(`vehicleId`),
    INDEX `p2p_vehicle_postings_serviceType_idx`(`serviceType`),
    INDEX `p2p_vehicle_postings_fromCity_idx`(`fromCity`),
    INDEX `p2p_vehicle_postings_toCity_idx`(`toCity`),
    INDEX `p2p_vehicle_postings_status_idx`(`status`),
    INDEX `p2p_vehicle_postings_departureDate_idx`(`departureDate`),
    INDEX `p2p_vehicle_postings_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `p2p_booking_postings` (
    `id` VARCHAR(191) NOT NULL,
    `postingNumber` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `bookingType` VARCHAR(191) NULL,
    `vehicleRequired` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NULL,
    `fromCity` VARCHAR(191) NOT NULL,
    `toCity` VARCHAR(191) NULL,
    `tripDate` DATETIME(3) NOT NULL,
    `tripTime` VARCHAR(191) NULL,
    `returnDate` DATETIME(3) NULL,
    `passengers` INTEGER NULL,
    `goodsType` VARCHAR(191) NULL,
    `goodsDescription` TEXT NULL,
    `estimatedWeight` VARCHAR(191) NULL,
    `needInsurance` BOOLEAN NOT NULL DEFAULT false,
    `needPackaging` BOOLEAN NOT NULL DEFAULT false,
    `needLabour` BOOLEAN NOT NULL DEFAULT false,
    `labourCount` INTEGER NULL,
    `customerBudget` DOUBLE NULL,
    `partnerEarning` DOUBLE NULL,
    `commission` DOUBLE NULL,
    `urgency` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    `reason` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `p2p_booking_postings_postingNumber_key`(`postingNumber`),
    INDEX `p2p_booking_postings_vendorId_idx`(`vendorId`),
    INDEX `p2p_booking_postings_serviceType_idx`(`serviceType`),
    INDEX `p2p_booking_postings_fromCity_idx`(`fromCity`),
    INDEX `p2p_booking_postings_status_idx`(`status`),
    INDEX `p2p_booking_postings_tripDate_idx`(`tripDate`),
    INDEX `p2p_booking_postings_urgency_idx`(`urgency`),
    INDEX `p2p_booking_postings_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `p2p_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `postingType` ENUM('VEHICLE', 'BOOKING') NOT NULL,
    `vehiclePostingId` VARCHAR(191) NULL,
    `bookingPostingId` VARCHAR(191) NULL,
    `requestingVendorId` VARCHAR(191) NOT NULL,
    `postingVendorId` VARCHAR(191) NOT NULL,
    `selectedVehicleId` VARCHAR(191) NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `loadType` VARCHAR(191) NULL,
    `goodsType` VARCHAR(191) NULL,
    `estimatedWeight` VARCHAR(191) NULL,
    `pickupAddress` TEXT NULL,
    `dropAddress` TEXT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `p2p_requests_requestNumber_key`(`requestNumber`),
    INDEX `p2p_requests_vehiclePostingId_idx`(`vehiclePostingId`),
    INDEX `p2p_requests_bookingPostingId_idx`(`bookingPostingId`),
    INDEX `p2p_requests_requestingVendorId_idx`(`requestingVendorId`),
    INDEX `p2p_requests_postingVendorId_idx`(`postingVendorId`),
    INDEX `p2p_requests_postingType_idx`(`postingType`),
    INDEX `p2p_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `p2p_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `transactionNumber` VARCHAR(191) NOT NULL,
    `postingType` ENUM('VEHICLE', 'BOOKING') NOT NULL,
    `vehiclePostingId` VARCHAR(191) NULL,
    `bookingPostingId` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `vendorAId` VARCHAR(191) NOT NULL,
    `vendorBId` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `fromCity` VARCHAR(191) NOT NULL,
    `toCity` VARCHAR(191) NULL,
    `tripDate` DATETIME(3) NOT NULL,
    `vehicleName` VARCHAR(191) NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `agreedAmount` DOUBLE NOT NULL,
    `platformFeePercent` DOUBLE NOT NULL DEFAULT 5.0,
    `platformFee` DOUBLE NOT NULL DEFAULT 0,
    `vendorAEarning` DOUBLE NOT NULL DEFAULT 0,
    `vendorBEarning` DOUBLE NOT NULL DEFAULT 0,
    `paymentStatus` ENUM('PENDING', 'PAID', 'SETTLED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',
    `tripStatus` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SETTLED') NOT NULL DEFAULT 'PENDING',
    `startOtp` VARCHAR(191) NULL,
    `endOtp` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `settledAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `p2p_transactions_transactionNumber_key`(`transactionNumber`),
    INDEX `p2p_transactions_vendorAId_idx`(`vendorAId`),
    INDEX `p2p_transactions_vendorBId_idx`(`vendorBId`),
    INDEX `p2p_transactions_requestId_idx`(`requestId`),
    INDEX `p2p_transactions_vehiclePostingId_idx`(`vehiclePostingId`),
    INDEX `p2p_transactions_bookingPostingId_idx`(`bookingPostingId`),
    INDEX `p2p_transactions_tripStatus_idx`(`tripStatus`),
    INDEX `p2p_transactions_paymentStatus_idx`(`paymentStatus`),
    INDEX `p2p_transactions_tripDate_idx`(`tripDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `p2p_ratings` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `raterVendorId` VARCHAR(191) NOT NULL,
    `ratedVendorId` VARCHAR(191) NOT NULL,
    `overallRating` DOUBLE NOT NULL,
    `vehicleRating` DOUBLE NULL,
    `driverRating` DOUBLE NULL,
    `communicationRating` DOUBLE NULL,
    `paymentRating` DOUBLE NULL,
    `review` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `p2p_ratings_transactionId_raterVendorId_key`(`transactionId`, `raterVendorId`),
    INDEX `p2p_ratings_transactionId_idx`(`transactionId`),
    INDEX `p2p_ratings_raterVendorId_idx`(`raterVendorId`),
    INDEX `p2p_ratings_ratedVendorId_idx`(`ratedVendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `p2p_comments` (
    `id` VARCHAR(191) NOT NULL,
    `postingType` ENUM('VEHICLE', 'BOOKING') NOT NULL,
    `vehiclePostingId` VARCHAR(191) NULL,
    `bookingPostingId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `p2p_comments_vehiclePostingId_idx`(`vehiclePostingId`),
    INDEX `p2p_comments_bookingPostingId_idx`(`bookingPostingId`),
    INDEX `p2p_comments_vendorId_idx`(`vendorId`),
    INDEX `p2p_comments_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `p2p_vehicle_postings` ADD CONSTRAINT `p2p_vehicle_postings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_vehicle_postings` ADD CONSTRAINT `p2p_vehicle_postings_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_booking_postings` ADD CONSTRAINT `p2p_booking_postings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_requests` ADD CONSTRAINT `p2p_requests_vehiclePostingId_fkey` FOREIGN KEY (`vehiclePostingId`) REFERENCES `p2p_vehicle_postings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_requests` ADD CONSTRAINT `p2p_requests_bookingPostingId_fkey` FOREIGN KEY (`bookingPostingId`) REFERENCES `p2p_booking_postings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_requests` ADD CONSTRAINT `p2p_requests_requestingVendorId_fkey` FOREIGN KEY (`requestingVendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_requests` ADD CONSTRAINT `p2p_requests_postingVendorId_fkey` FOREIGN KEY (`postingVendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_requests` ADD CONSTRAINT `p2p_requests_selectedVehicleId_fkey` FOREIGN KEY (`selectedVehicleId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_transactions` ADD CONSTRAINT `p2p_transactions_vehiclePostingId_fkey` FOREIGN KEY (`vehiclePostingId`) REFERENCES `p2p_vehicle_postings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_transactions` ADD CONSTRAINT `p2p_transactions_bookingPostingId_fkey` FOREIGN KEY (`bookingPostingId`) REFERENCES `p2p_booking_postings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_transactions` ADD CONSTRAINT `p2p_transactions_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `p2p_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_transactions` ADD CONSTRAINT `p2p_transactions_vendorAId_fkey` FOREIGN KEY (`vendorAId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_transactions` ADD CONSTRAINT `p2p_transactions_vendorBId_fkey` FOREIGN KEY (`vendorBId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_ratings` ADD CONSTRAINT `p2p_ratings_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `p2p_transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_ratings` ADD CONSTRAINT `p2p_ratings_raterVendorId_fkey` FOREIGN KEY (`raterVendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_ratings` ADD CONSTRAINT `p2p_ratings_ratedVendorId_fkey` FOREIGN KEY (`ratedVendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_comments` ADD CONSTRAINT `p2p_comments_vehiclePostingId_fkey` FOREIGN KEY (`vehiclePostingId`) REFERENCES `p2p_vehicle_postings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_comments` ADD CONSTRAINT `p2p_comments_bookingPostingId_fkey` FOREIGN KEY (`bookingPostingId`) REFERENCES `p2p_booking_postings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `p2p_comments` ADD CONSTRAINT `p2p_comments_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
