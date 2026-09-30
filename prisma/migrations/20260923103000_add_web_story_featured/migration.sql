-- Lets an admin hand-pick which published stories show in the homepage
-- carousel, instead of it always pulling in every published story.
ALTER TABLE `web_stories` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX `web_stories_isFeatured_idx` ON `web_stories`(`isFeatured`);
