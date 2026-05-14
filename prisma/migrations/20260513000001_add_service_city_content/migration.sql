-- Service-city content management table.
-- Stores per (service × city) page content for SEO optimization.
-- Content fields are nullable so admin/AI can populate progressively.
-- JSON-like data stored as LONGTEXT (matches existing schema convention).
--
-- Workflow flags (status, source, autoUpdate) drive admin UI filtering and
-- the daily cron that regenerates content via AI for cities where
-- autoUpdate=true. Manual edits (source='manual') are protected from
-- auto-regeneration.

-- CreateTable — `IF NOT EXISTS` makes the migration idempotent: re-applying
-- on an environment where the table already exists is a no-op rather than
-- an error.
CREATE TABLE IF NOT EXISTS `service_city_content` (
    `id` VARCHAR(191) NOT NULL,
    `serviceSlug` VARCHAR(191) NOT NULL,
    `citySlug` VARCHAR(191) NOT NULL,

    `intro` LONGTEXT NULL,
    `whyChooseUs` LONGTEXT NULL,
    `popularVehicles` LONGTEXT NULL,
    `servicesOffered` LONGTEXT NULL,
    `faqs` LONGTEXT NULL,
    `tips` LONGTEXT NULL,
    `routes` LONGTEXT NULL,

    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `metaKeywords` TEXT NULL,
    `h1Heading` VARCHAR(191) NULL,

    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `source` VARCHAR(191) NOT NULL DEFAULT 'ai',
    `autoUpdate` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,

    `aiPrompt` TEXT NULL,
    `aiModel` VARCHAR(191) NULL,
    `aiTokensUsed` INTEGER NULL,
    `lastAiUpdate` DATETIME(3) NULL,

    `lastEditedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_city_content_serviceSlug_citySlug_key`(`serviceSlug`, `citySlug`),
    INDEX `service_city_content_serviceSlug_idx`(`serviceSlug`),
    INDEX `service_city_content_citySlug_idx`(`citySlug`),
    INDEX `service_city_content_status_idx`(`status`),
    INDEX `service_city_content_autoUpdate_idx`(`autoUpdate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
