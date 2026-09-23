-- Landscape (4:3) cover for amp-story's optional poster-landscape-src.
-- Nullable and additive: existing stories keep working and simply do not emit
-- the attribute until a landscape image is uploaded for them.
ALTER TABLE `web_stories` ADD COLUMN `coverImageLandscape` VARCHAR(191) NULL;
