-- CreateTable
CREATE TABLE `vendor_coverage_gaps` (
    `id` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_coverage_gaps_locationName_idx`(`locationName`),
    INDEX `vendor_coverage_gaps_serviceType_idx`(`serviceType`),
    INDEX `vendor_coverage_gaps_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
