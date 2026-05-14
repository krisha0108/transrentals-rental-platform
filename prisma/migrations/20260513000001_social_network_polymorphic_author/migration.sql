-- Social Network — polymorphic author (vendor OR travel_agent).
--
-- Up until now every social_* row was authored by a vendor. To let travel
-- agents participate in the same feed without forking the feature, we:
--   1. relax `vendorId` to NULL on each social_* table
--   2. add a nullable `agentId` next to it
--   3. add an FK from `agentId` to travel_agents.id
--   4. add (postId, agentId) unique on likes/saves to mirror the existing
--      (postId, vendorId) unique
--   5. add an index on agentId so feed queries stay fast
--
-- App-level invariant (enforced in service.ts): exactly one of (vendorId,
-- agentId) is set per row. Existing rows already satisfy this because
-- vendorId was previously NOT NULL.

-- ── social_posts ────────────────────────────────────────────────────────────
ALTER TABLE `social_posts` DROP FOREIGN KEY `social_posts_vendorId_fkey`;
ALTER TABLE `social_posts` MODIFY COLUMN `vendorId` VARCHAR(191) NULL;
ALTER TABLE `social_posts`
  ADD CONSTRAINT `social_posts_vendorId_fkey` FOREIGN KEY (`vendorId`)
  REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `social_posts` ADD COLUMN `agentId` VARCHAR(191) NULL;
CREATE INDEX `social_posts_agentId_idx` ON `social_posts`(`agentId`);
ALTER TABLE `social_posts`
  ADD CONSTRAINT `social_posts_agentId_fkey` FOREIGN KEY (`agentId`)
  REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ── social_post_likes ───────────────────────────────────────────────────────
ALTER TABLE `social_post_likes` DROP FOREIGN KEY `social_post_likes_vendorId_fkey`;
ALTER TABLE `social_post_likes` MODIFY COLUMN `vendorId` VARCHAR(191) NULL;
ALTER TABLE `social_post_likes`
  ADD CONSTRAINT `social_post_likes_vendorId_fkey` FOREIGN KEY (`vendorId`)
  REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `social_post_likes` ADD COLUMN `agentId` VARCHAR(191) NULL;
CREATE INDEX `social_post_likes_agentId_idx` ON `social_post_likes`(`agentId`);
CREATE UNIQUE INDEX `social_post_likes_postId_agentId_key`
  ON `social_post_likes`(`postId`, `agentId`);
ALTER TABLE `social_post_likes`
  ADD CONSTRAINT `social_post_likes_agentId_fkey` FOREIGN KEY (`agentId`)
  REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ── social_post_comments ────────────────────────────────────────────────────
ALTER TABLE `social_post_comments` DROP FOREIGN KEY `social_post_comments_vendorId_fkey`;
ALTER TABLE `social_post_comments` MODIFY COLUMN `vendorId` VARCHAR(191) NULL;
ALTER TABLE `social_post_comments`
  ADD CONSTRAINT `social_post_comments_vendorId_fkey` FOREIGN KEY (`vendorId`)
  REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `social_post_comments` ADD COLUMN `agentId` VARCHAR(191) NULL;
CREATE INDEX `social_post_comments_agentId_idx` ON `social_post_comments`(`agentId`);
ALTER TABLE `social_post_comments`
  ADD CONSTRAINT `social_post_comments_agentId_fkey` FOREIGN KEY (`agentId`)
  REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ── social_post_saves ───────────────────────────────────────────────────────
ALTER TABLE `social_post_saves` DROP FOREIGN KEY `social_post_saves_vendorId_fkey`;
ALTER TABLE `social_post_saves` MODIFY COLUMN `vendorId` VARCHAR(191) NULL;
ALTER TABLE `social_post_saves`
  ADD CONSTRAINT `social_post_saves_vendorId_fkey` FOREIGN KEY (`vendorId`)
  REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `social_post_saves` ADD COLUMN `agentId` VARCHAR(191) NULL;
CREATE INDEX `social_post_saves_agentId_idx` ON `social_post_saves`(`agentId`);
CREATE UNIQUE INDEX `social_post_saves_postId_agentId_key`
  ON `social_post_saves`(`postId`, `agentId`);
ALTER TABLE `social_post_saves`
  ADD CONSTRAINT `social_post_saves_agentId_fkey` FOREIGN KEY (`agentId`)
  REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
