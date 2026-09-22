-- Approve/reject state for reviews customers leave on their bookings. The
-- ratings themselves stay in each service's booking table; only the decision
-- lives here, so the eight booking tables are left untouched.
CREATE TABLE `booking_review_moderation` (
  `id`         VARCHAR(191) NOT NULL,
  `source`     VARCHAR(40)  NOT NULL,
  `bookingId`  VARCHAR(191) NOT NULL,
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  `isFeatured` BOOLEAN      NOT NULL DEFAULT false,
  `reviewedAt` DATETIME(3)  NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)  NOT NULL,

  UNIQUE INDEX `booking_review_moderation_source_bookingId_key` (`source`, `bookingId`),
  INDEX `booking_review_moderation_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
