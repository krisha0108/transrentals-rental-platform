-- CreateTable
CREATE TABLE `social_media_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `platform` ENUM('FACEBOOK', 'INSTAGRAM') NOT NULL,
    `pageId` VARCHAR(191) NOT NULL,
    `pageName` VARCHAR(191) NOT NULL,
    `igBusinessAccountId` VARCHAR(191) NULL,
    `igUsername` VARCHAR(191) NULL,
    `profilePictureUrl` TEXT NULL,
    `accessToken` TEXT NOT NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `followerCount` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncedAt` DATETIME(3) NULL,
    `lastSyncError` TEXT NULL,
    `connectedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `social_media_accounts_connectedById_idx`(`connectedById`),
    UNIQUE INDEX `social_media_accounts_platform_pageId_key`(`platform`, `pageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `social_media_posts` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `platform` ENUM('FACEBOOK', 'INSTAGRAM') NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `mediaType` VARCHAR(191) NULL,
    `caption` TEXT NULL,
    `permalink` TEXT NULL,
    `mediaUrl` TEXT NULL,
    `thumbnailUrl` TEXT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `commentCount` INTEGER NOT NULL DEFAULT 0,
    `shareCount` INTEGER NOT NULL DEFAULT 0,
    `savedCount` INTEGER NULL,
    `impressions` INTEGER NULL,
    `reach` INTEGER NULL,
    `engagement` INTEGER NULL,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `social_media_posts_accountId_publishedAt_idx`(`accountId`, `publishedAt`),
    UNIQUE INDEX `social_media_posts_accountId_externalId_key`(`accountId`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `social_media_daily_stats` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `followerCount` INTEGER NULL,
    `impressions` INTEGER NULL,
    `reach` INTEGER NULL,
    `profileViews` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `social_media_daily_stats_accountId_date_key`(`accountId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `social_media_accounts` ADD CONSTRAINT `social_media_accounts_connectedById_fkey` FOREIGN KEY (`connectedById`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `social_media_posts` ADD CONSTRAINT `social_media_posts_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `social_media_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `social_media_daily_stats` ADD CONSTRAINT `social_media_daily_stats_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `social_media_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
