-- AlterTable: add parentId to wander_categories (self-relation for sub-categories)
ALTER TABLE `wander_categories`
  ADD COLUMN `parentId` VARCHAR(191) NULL;

ALTER TABLE `wander_categories`
  ADD INDEX `wander_categories_parentId_fkey` (`parentId`);

ALTER TABLE `wander_categories`
  ADD CONSTRAINT `wander_categories_parentId_fkey`
  FOREIGN KEY (`parentId`) REFERENCES `wander_categories`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
