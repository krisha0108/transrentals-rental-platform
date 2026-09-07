-- AlterTable
ALTER TABLE `manager_call_reports` ADD COLUMN `nextFollowUpDate` datetime(3) DEFAULT NULL AFTER `status`;
ALTER TABLE `manager_call_reports` ADD COLUMN `nextFollowUpTime` varchar(191) DEFAULT NULL AFTER `nextFollowUpDate`;
ALTER TABLE `manager_call_reports` ADD COLUMN `nextAction` varchar(191) DEFAULT NULL AFTER `nextFollowUpTime`;
