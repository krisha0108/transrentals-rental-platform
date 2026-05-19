-- Vendor CRM tags.
--
-- These tags coexist with `vendors.status` (which remains the formal system
-- state used for approval/booking gating). Tags are a separate, manager-
-- managed follow-up layer for tracking outreach, document-collection state,
-- and operational quality as the vendor pool grows.
--
-- Many-to-many: a vendor can carry multiple tags (e.g. "Connected" +
-- "Vehicle Details Pending"). Unique constraint on (vendorId, tag) keeps
-- the relationship a set, not a multiset.

CREATE TABLE `vendor_tag_assignments` (
  `id`           VARCHAR(191) NOT NULL,
  `vendorId`     VARCHAR(191) NOT NULL,
  `tag`          ENUM(
    'FOLLOW_UP_REQUIRED',
    'CONNECTED',
    'RESPONDED',
    'DOCUMENTS_PENDING',
    'DOCUMENTS_VERIFIED',
    'WRONG_VENDOR_DETAILS',
    'NOT_INTERESTED',
    'NO_RESPONSE',
    'VEHICLE_DETAILS_PENDING',
    'ACTIVE_VENDOR',
    'SUSPENDED'
  ) NOT NULL,
  `assignedById` VARCHAR(191) NULL,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `vendor_tag_assignments_vendorId_tag_key` (`vendorId`, `tag`),
  INDEX `vendor_tag_assignments_tag_idx` (`tag`),
  INDEX `vendor_tag_assignments_assignedById_fkey` (`assignedById`),

  CONSTRAINT `vendor_tag_assignments_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendor_tag_assignments_assignedById_fkey`
    FOREIGN KEY (`assignedById`) REFERENCES `admin_users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
