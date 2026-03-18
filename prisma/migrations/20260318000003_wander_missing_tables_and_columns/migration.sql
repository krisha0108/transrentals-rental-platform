-- ============================================================
-- Create missing wander tables
-- ============================================================

-- wander_experiences (full table missing)
CREATE TABLE `wander_experiences` (
  `id`           VARCHAR(191) NOT NULL,
  `title`        VARCHAR(191) NOT NULL,
  `slug`         VARCHAR(191) NOT NULL,
  `description`  TEXT NULL,
  `duration`     VARCHAR(191) NULL,
  `categoryId`   VARCHAR(191) NOT NULL,
  `locationId`   VARCHAR(191) NOT NULL,
  `coverImage`   VARCHAR(191) NULL,
  `highlights`   TEXT NULL,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `status`       ENUM('ACTIVE','DRAFT','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `wander_experiences_slug_key` (`slug`),
  INDEX `wander_experiences_categoryId_fkey` (`categoryId`),
  INDEX `wander_experiences_locationId_fkey` (`locationId`),
  INDEX `wander_experiences_status_idx` (`status`),

  CONSTRAINT `wander_experiences_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `wander_categories`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `wander_experiences_locationId_fkey`
    FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- wander_reviews (full table missing)
CREATE TABLE `wander_reviews` (
  `id`              VARCHAR(191) NOT NULL,
  `listingId`       VARCHAR(191) NOT NULL,
  `bookingId`       VARCHAR(191) NOT NULL,
  `customerId`      VARCHAR(191) NOT NULL,
  `rating`          INT NOT NULL,
  `title`           VARCHAR(191) NULL,
  `review`          TEXT NULL,
  `images`          TEXT NULL,
  `vendorReply`     TEXT NULL,
  `vendorRepliedAt` DATETIME(3) NULL,
  `isVerified`      BOOLEAN NOT NULL DEFAULT true,
  `status`          VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `wander_reviews_bookingId_key` (`bookingId`),
  INDEX `wander_reviews_listingId_fkey` (`listingId`),
  INDEX `wander_reviews_customerId_fkey` (`customerId`),
  INDEX `wander_reviews_rating_idx` (`rating`),

  CONSTRAINT `wander_reviews_listingId_fkey`
    FOREIGN KEY (`listingId`) REFERENCES `wander_listings`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `wander_reviews_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- wander_wishlists (full table missing)
CREATE TABLE `wander_wishlists` (
  `id`         VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191) NOT NULL,
  `listingId`  VARCHAR(191) NOT NULL,
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `wander_wishlists_customerId_listingId_key` (`customerId`, `listingId`),
  INDEX `wander_wishlists_customerId_fkey` (`customerId`),
  INDEX `wander_wishlists_listingId_fkey` (`listingId`),

  CONSTRAINT `wander_wishlists_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `wander_wishlists_listingId_fkey`
    FOREIGN KEY (`listingId`) REFERENCES `wander_listings`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- Add missing columns to wander_listings
-- ============================================================
ALTER TABLE `wander_listings`
  ADD COLUMN `slug`                  VARCHAR(191) NULL,
  ADD COLUMN `experienceId`          VARCHAR(191) NULL,
  ADD COLUMN `subCategoryId`         VARCHAR(191) NULL,
  ADD COLUMN `requireAdvancePayment` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `advancePaymentType`    VARCHAR(191) NULL,
  ADD COLUMN `advancePaymentValue`   DOUBLE NULL,
  ADD COLUMN `metaTitle`             VARCHAR(191) NULL,
  ADD COLUMN `metaDescription`       TEXT NULL,
  ADD COLUMN `metaKeywords`          TEXT NULL,
  ADD COLUMN `ogImage`               VARCHAR(191) NULL,
  ADD COLUMN `tourStartDate`         DATE NULL,
  ADD COLUMN `tourEndDate`           DATE NULL;

ALTER TABLE `wander_listings`
  ADD UNIQUE INDEX `wander_listings_slug_key` (`slug`),
  ADD INDEX `wander_listings_subCategoryId_fkey` (`subCategoryId`),
  ADD INDEX `wander_listings_experienceId_fkey` (`experienceId`);

ALTER TABLE `wander_listings`
  ADD CONSTRAINT `wander_listings_subCategoryId_fkey`
    FOREIGN KEY (`subCategoryId`) REFERENCES `wander_categories`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `wander_listings_experienceId_fkey`
    FOREIGN KEY (`experienceId`) REFERENCES `wander_experiences`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Add missing columns to wander_bookings
-- ============================================================
ALTER TABLE `wander_bookings`
  ADD COLUMN `advanceAmount`       DOUBLE NULL,
  ADD COLUMN `paymentMethod`       VARCHAR(191) NULL,
  ADD COLUMN `transactionId`       VARCHAR(191) NULL,
  ADD COLUMN `advancePaymentRef`   VARCHAR(191) NULL,
  ADD COLUMN `advancePaymentProof` TEXT NULL,
  ADD COLUMN `startedAt`           DATETIME(3) NULL,
  ADD COLUMN `completedAt`         DATETIME(3) NULL;
