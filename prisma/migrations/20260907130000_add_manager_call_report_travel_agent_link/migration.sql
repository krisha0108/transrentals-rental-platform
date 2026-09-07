-- AlterTable
ALTER TABLE `manager_call_reports`
  ADD COLUMN `travelAgentId` VARCHAR(191) NULL,
  MODIFY COLUMN `status` ENUM('VENDOR_CREATED', 'TRAVEL_AGENT_CREATED', 'INTERESTED', 'FOLLOW_UP', 'NOT_INTERESTED', 'NO_ANSWER', 'CALLBACK_LATER', 'WRONG_NUMBER', 'CONVERTED') NOT NULL DEFAULT 'FOLLOW_UP';

-- CreateIndex
CREATE INDEX `manager_call_reports_travelAgentId_idx` ON `manager_call_reports`(`travelAgentId`);

-- AddForeignKey
ALTER TABLE `manager_call_reports` ADD CONSTRAINT `manager_call_reports_travelAgentId_fkey` FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
