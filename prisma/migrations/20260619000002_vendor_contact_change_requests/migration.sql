-- CreateTable
CREATE TABLE `vendor_contact_change_requests` (
  `id` VARCHAR(191) NOT NULL,
  `vendorId` VARCHAR(191) NOT NULL,
  `newEmail` VARCHAR(191) NULL,
  `newPhone` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewedAt` DATETIME(3) NULL,
  `reviewedById` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  INDEX `vendor_contact_change_requests_vendorId_idx` (`vendorId`),
  CONSTRAINT `vendor_contact_change_requests_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
