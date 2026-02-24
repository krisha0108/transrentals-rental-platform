-- CreateTable: vendor_payout_batches
CREATE TABLE IF NOT EXISTS `vendor_payout_batches` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paidById` VARCHAR(191) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `vendor_payout_batches_vendorId_idx`(`vendorId`),
    INDEX `vendor_payout_batches_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: vendor_payout_batch_items
CREATE TABLE IF NOT EXISTS `vendor_payout_batch_items` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `bookingType` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NULL,
    `totalAmount` DOUBLE NOT NULL,
    `advanceAmount` DOUBLE NOT NULL,
    `commissionPercent` DOUBLE NOT NULL DEFAULT 0,
    `commissionAmount` DOUBLE NOT NULL,
    `vendorPayoutAmount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_payout_batch_items_batchId_idx`(`batchId`),
    INDEX `vendor_payout_batch_items_bookingId_idx`(`bookingId`),
    INDEX `vendor_payout_batch_items_bookingType_idx`(`bookingType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_payout_batches` ADD CONSTRAINT `vendor_payout_batches_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_payout_batches` ADD CONSTRAINT `vendor_payout_batches_paidById_fkey` FOREIGN KEY (`paidById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_payout_batch_items` ADD CONSTRAINT `vendor_payout_batch_items_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `vendor_payout_batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
