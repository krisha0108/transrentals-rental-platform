-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `did` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `drivers_did_key` ON `drivers`(`did`);
