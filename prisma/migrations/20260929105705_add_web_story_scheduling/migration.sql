-- Lets an admin set a future date/time for a draft story to auto-publish,
-- instead of only being able to publish it manually right away.
ALTER TABLE `web_stories` ADD COLUMN `scheduledAt` DATETIME(3) NULL;
CREATE INDEX `web_stories_scheduledAt_idx` ON `web_stories`(`scheduledAt`);
