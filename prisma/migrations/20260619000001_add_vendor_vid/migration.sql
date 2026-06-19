-- AlterTable
ALTER TABLE `vendors` ADD COLUMN `vid` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `vendors_vid_key` ON `vendors`(`vid`);
