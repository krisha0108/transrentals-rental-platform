-- CreateTable web_stories
CREATE TABLE `web_stories` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `metaDescription` VARCHAR(300) NULL,
    `coverImage` VARCHAR(191) NULL,
    `coverImageSquare` VARCHAR(191) NULL,
    `publisherName` VARCHAR(191) NULL,
    `publisherLogo` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `web_stories_slug_key`(`slug`),
    INDEX `web_stories_isPublished_idx`(`isPublished`),
    INDEX `web_stories_isArchived_idx`(`isArchived`),
    INDEX `web_stories_expiresAt_idx`(`expiresAt`),
    INDEX `web_stories_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable web_story_slides
CREATE TABLE `web_story_slides` (
    `id` VARCHAR(191) NOT NULL,
    `storyId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 7,
    `bgType` ENUM('IMAGE', 'VIDEO', 'COLOR', 'GRADIENT') NOT NULL DEFAULT 'IMAGE',
    `bgImage` VARCHAR(191) NULL,
    `bgVideo` VARCHAR(191) NULL,
    `bgColor` VARCHAR(191) NULL,
    `bgGradient` VARCHAR(191) NULL,
    `heading` VARCHAR(191) NULL,
    `headingSize` ENUM('SM', 'MD', 'LG') NOT NULL DEFAULT 'LG',
    `headingColor` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `subtext` TEXT NULL,
    `subtextColor` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `textPosition` ENUM('TOP', 'MIDDLE', 'BOTTOM') NOT NULL DEFAULT 'BOTTOM',
    `textAnimation` ENUM('NONE', 'FADE', 'SLIDE_UP', 'SLIDE_DOWN') NOT NULL DEFAULT 'FADE',
    `ctaText` VARCHAR(191) NULL,
    `ctaUrl` VARCHAR(191) NULL,
    `ctaStyle` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `web_story_slides_storyId_idx`(`storyId`),
    INDEX `web_story_slides_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable web_story_reactions
CREATE TABLE `web_story_reactions` (
    `id` VARCHAR(191) NOT NULL,
    `storyId` VARCHAR(191) NOT NULL,
    `reactionType` ENUM('HEART', 'FIRE', 'THUMBS_UP') NOT NULL,
    `userIp` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `web_story_reactions_storyId_idx`(`storyId`),
    INDEX `web_story_reactions_reactionType_idx`(`reactionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `web_story_slides` ADD CONSTRAINT `web_story_slides_storyId_fkey` FOREIGN KEY (`storyId`) REFERENCES `web_stories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `web_story_reactions` ADD CONSTRAINT `web_story_reactions_storyId_fkey` FOREIGN KEY (`storyId`) REFERENCES `web_stories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
