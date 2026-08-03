-- AlterTable
ALTER TABLE `travel_agents` ADD COLUMN `tid` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `travel_agents_tid` ON `travel_agents`(`tid`);
