-- Reviews written from the public site's "write a review" form. Booking tables
-- already carry a rating/review for the trip that was taken; this table is for
-- the homepage form, which anyone can submit — so rows land as PENDING and are
-- only shown once an admin approves them.
CREATE TABLE `customer_reviews` (
  `id`         VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191) NULL,
  `name`       VARCHAR(120) NOT NULL,
  `email`      VARCHAR(160) NULL,
  `phone`      VARCHAR(20)  NULL,
  `city`       VARCHAR(120) NULL,
  `service`    VARCHAR(60)  NULL,
  `rating`     INTEGER      NOT NULL,
  `comment`    TEXT         NOT NULL,
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  `isFeatured` BOOLEAN      NOT NULL DEFAULT false,
  `ipAddress`  VARCHAR(64)  NULL,
  `reviewedAt` DATETIME(3)  NULL,
  `reviewedBy` VARCHAR(191) NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)  NOT NULL,

  INDEX `customer_reviews_status_idx` (`status`),
  INDEX `customer_reviews_createdAt_idx` (`createdAt`),
  INDEX `customer_reviews_customerId_idx` (`customerId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `customer_reviews`
  ADD CONSTRAINT `customer_reviews_customerId_fkey`
  FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
