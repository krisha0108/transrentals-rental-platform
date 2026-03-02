-- Migration: add serviceSlug to blog_posts
-- Created manually (db push already applied this change)

ALTER TABLE `blog_posts` ADD COLUMN `serviceSlug` VARCHAR(191) NULL;

ALTER TABLE `blog_posts` ADD INDEX `blog_posts_serviceSlug_idx` (`serviceSlug`);
