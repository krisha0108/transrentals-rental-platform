-- CreateTable
CREATE TABLE `vendor_call_logs` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `bookingType` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'web',
    `clickedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_call_logs_vendorId_idx`(`vendorId`),
    INDEX `vendor_call_logs_bookingId_idx`(`bookingId`),
    INDEX `vendor_call_logs_bookingType_bookingId_idx`(`bookingType`, `bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_call_logs` ADD CONSTRAINT `vendor_call_logs_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
