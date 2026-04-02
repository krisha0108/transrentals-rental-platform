-- Add targetServices and targetLocations columns to web_stories
ALTER TABLE `web_stories` ADD COLUMN `targetServices` TEXT NULL;
ALTER TABLE `web_stories` ADD COLUMN `targetLocations` TEXT NULL;
