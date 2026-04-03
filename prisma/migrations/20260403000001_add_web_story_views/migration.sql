CREATE TABLE `web_story_views` (
  `id` VARCHAR(191) NOT NULL,
  `storyId` VARCHAR(191) NOT NULL,
  `userIp` VARCHAR(191) NULL,
  `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `web_story_views_storyId_idx` (`storyId`),
  INDEX `web_story_views_userIp_idx` (`userIp`),
  CONSTRAINT `web_story_views_storyId_fkey` FOREIGN KEY (`storyId`) REFERENCES `web_stories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
