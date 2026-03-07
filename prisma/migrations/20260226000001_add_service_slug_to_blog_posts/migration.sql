-- Migration: add serviceSlug to blog_posts (idempotent)
DROP PROCEDURE IF EXISTS add_service_slug;
CREATE PROCEDURE add_service_slug()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts'
        AND COLUMN_NAME = 'serviceSlug'
    ) THEN
        ALTER TABLE `blog_posts` ADD COLUMN `serviceSlug` VARCHAR(191) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blog_posts'
        AND INDEX_NAME = 'blog_posts_serviceSlug_idx'
    ) THEN
        CREATE INDEX `blog_posts_serviceSlug_idx` ON `blog_posts`(`serviceSlug`);
    END IF;
END;
CALL add_service_slug();
DROP PROCEDURE add_service_slug;
