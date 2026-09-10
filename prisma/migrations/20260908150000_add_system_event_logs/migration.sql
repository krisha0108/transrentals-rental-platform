-- CreateTable
CREATE TABLE `system_event_logs` (
    `id` VARCHAR(191) NOT NULL,
    `category` ENUM('CRON', 'NOTIFICATION') NOT NULL,
    `sourceName` VARCHAR(100) NOT NULL,
    `status` ENUM('SUCCESS', 'FAILURE') NOT NULL,
    `message` TEXT NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `system_event_logs_category_sourceName_createdAt_idx`(`category`, `sourceName`, `createdAt`),
    INDEX `system_event_logs_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
