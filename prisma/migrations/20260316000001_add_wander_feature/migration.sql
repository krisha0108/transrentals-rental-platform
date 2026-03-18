-- CreateTable: Wander Feature
-- Migration: 20260316000001_add_wander_feature

-- CreateEnum: wander_price_type
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (`id` VARCHAR(36) NOT NULL, `checksum` VARCHAR(64) NOT NULL, `finished_at` DATETIME(3) NULL, `migration_name` VARCHAR(255) NOT NULL, `logs` TEXT NULL, `rolled_back_at` DATETIME(3) NULL, `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `applied_steps_count` INTEGER UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Enums (MySQL uses VARCHAR for enums in Prisma)

-- CreateTable: wander_categories
CREATE TABLE `wander_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `coverImage` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wander_categories_slug_key`(`slug`),
    INDEX `wander_categories_isActive_idx`(`isActive`),
    INDEX `wander_categories_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_listings
CREATE TABLE `wander_listings` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `mainLocationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `highlights` TEXT NULL,
    `basePrice` DOUBLE NULL,
    `priceType` ENUM('PER_PERSON', 'PER_GROUP', 'ON_REQUEST') NOT NULL DEFAULT 'ON_REQUEST',
    `minGroupSize` INTEGER NOT NULL DEFAULT 1,
    `maxGroupSize` INTEGER NULL,
    `customPlaces` LONGTEXT NULL,
    `itinerary` LONGTEXT NULL,
    `vehicleOptions` TEXT NULL,
    `inclusions` TEXT NULL,
    `exclusions` TEXT NULL,
    `images` LONGTEXT NULL,
    `pickupType` VARCHAR(191) NULL,
    `meetingPoint` TEXT NULL,
    `guideLanguages` TEXT NULL,
    `availableDays` TEXT NULL,
    `advanceNoticeHours` INTEGER NOT NULL DEFAULT 24,
    `cancellationPolicy` ENUM('FLEXIBLE', 'MODERATE', 'STRICT') NOT NULL DEFAULT 'MODERATE',
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `totalRatings` INTEGER NOT NULL DEFAULT 0,
    `totalBookings` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wander_listings_listingId_key`(`listingId`),
    INDEX `wander_listings_vendorId_idx`(`vendorId`),
    INDEX `wander_listings_categoryId_idx`(`categoryId`),
    INDEX `wander_listings_mainLocationId_idx`(`mainLocationId`),
    INDEX `wander_listings_title_idx`(`title`),
    INDEX `wander_listings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_quote_requests
CREATE TABLE `wander_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `wanderListingId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `travelDate` DATE NOT NULL,
    `groupSize` INTEGER NOT NULL DEFAULT 1,
    `pickupLocation` VARCHAR(191) NULL,
    `requirements` TEXT NULL,
    `status` ENUM('PENDING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'DROPPED') NOT NULL DEFAULT 'PENDING',
    `droppedAt` DATETIME(3) NULL,
    `dropReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wander_quote_requests_requestId_key`(`requestId`),
    INDEX `wander_quote_requests_wanderListingId_idx`(`wanderListingId`),
    INDEX `wander_quote_requests_customerId_idx`(`customerId`),
    INDEX `wander_quote_requests_status_idx`(`status`),
    INDEX `wander_quote_requests_travelDate_idx`(`travelDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_quotes
CREATE TABLE `wander_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `quoteRequestId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `perPersonAmount` DOUBLE NULL,
    `customInclusions` TEXT NULL,
    `customExclusions` TEXT NULL,
    `validUntil` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `wander_quotes_quoteRequestId_idx`(`quoteRequestId`),
    INDEX `wander_quotes_vendorId_idx`(`vendorId`),
    INDEX `wander_quotes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_bookings
CREATE TABLE `wander_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `quoteRequestId` VARCHAR(191) NOT NULL,
    `quoteId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `travelDate` DATE NOT NULL,
    `groupSize` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `advancePaid` BOOLEAN NOT NULL DEFAULT false,
    `advancePaidAt` DATETIME(3) NULL,
    `balancePaid` BOOLEAN NOT NULL DEFAULT false,
    `balancePaidAt` DATETIME(3) NULL,
    `guideAssigned` VARCHAR(191) NULL,
    `guidePhone` VARCHAR(191) NULL,
    `startOTP` VARCHAR(191) NULL,
    `endOTP` VARCHAR(191) NULL,
    `status` ENUM('PAYMENT_PENDING', 'CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED', 'DROPPED') NOT NULL DEFAULT 'PAYMENT_PENDING',
    `droppedAt` DATETIME(3) NULL,
    `dropReason` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wander_bookings_bookingId_key`(`bookingId`),
    UNIQUE INDEX `wander_bookings_quoteRequestId_key`(`quoteRequestId`),
    UNIQUE INDEX `wander_bookings_quoteId_key`(`quoteId`),
    INDEX `wander_bookings_customerId_idx`(`customerId`),
    INDEX `wander_bookings_vendorId_idx`(`vendorId`),
    INDEX `wander_bookings_status_idx`(`status`),
    INDEX `wander_bookings_travelDate_idx`(`travelDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: wander_listings → vendors
ALTER TABLE `wander_listings` ADD CONSTRAINT `wander_listings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_listings → wander_categories
ALTER TABLE `wander_listings` ADD CONSTRAINT `wander_listings_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `wander_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: wander_listings → locations
ALTER TABLE `wander_listings` ADD CONSTRAINT `wander_listings_mainLocationId_fkey` FOREIGN KEY (`mainLocationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: wander_quote_requests → wander_listings
ALTER TABLE `wander_quote_requests` ADD CONSTRAINT `wander_quote_requests_wanderListingId_fkey` FOREIGN KEY (`wanderListingId`) REFERENCES `wander_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_quote_requests → customers
ALTER TABLE `wander_quote_requests` ADD CONSTRAINT `wander_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_quotes → wander_quote_requests
ALTER TABLE `wander_quotes` ADD CONSTRAINT `wander_quotes_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `wander_quote_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_quotes → vendors
ALTER TABLE `wander_quotes` ADD CONSTRAINT `wander_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_bookings → wander_quote_requests
ALTER TABLE `wander_bookings` ADD CONSTRAINT `wander_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `wander_quote_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_bookings → wander_quotes
ALTER TABLE `wander_bookings` ADD CONSTRAINT `wander_bookings_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `wander_quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: wander_bookings → customers
ALTER TABLE `wander_bookings` ADD CONSTRAINT `wander_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: wander_bookings → vendors
ALTER TABLE `wander_bookings` ADD CONSTRAINT `wander_bookings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
