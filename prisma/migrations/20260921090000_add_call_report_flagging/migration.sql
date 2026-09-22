-- AlterTable
ALTER TABLE `manager_call_reports` ADD COLUMN `isFlagged` tinyint(1) NOT NULL DEFAULT 0 AFTER `notes`;
ALTER TABLE `manager_call_reports` ADD COLUMN `flagReason` text DEFAULT NULL AFTER `isFlagged`;
ALTER TABLE `manager_call_reports` ADD COLUMN `flaggedAt` datetime(3) DEFAULT NULL AFTER `flagReason`;
ALTER TABLE `manager_call_reports` ADD COLUMN `flaggedById` varchar(191) DEFAULT NULL AFTER `flaggedAt`;

-- CreateIndex
CREATE INDEX `manager_call_reports_isFlagged_idx` ON `manager_call_reports`(`isFlagged`);
