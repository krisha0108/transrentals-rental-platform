-- Add `images` column to social_posts for storing a JSON array of uploaded
-- image URLs. Previously the composer/UI allowed picking images but the
-- backend dropped them (text-only posts). This persists them so both web and
-- app feeds can render post images.
ALTER TABLE `social_posts` ADD COLUMN `images` TEXT NULL;
