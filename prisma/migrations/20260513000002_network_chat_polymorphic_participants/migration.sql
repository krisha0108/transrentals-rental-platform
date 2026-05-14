-- Network chat — make `vendor_conversations` + `vendor_messages` polymorphic
-- so travel agents can participate in the same social chat surface vendors
-- already use. Existing rows stay valid: vendor1Id / vendor2Id / senderId
-- become nullable, and agent columns sit alongside them. Each conversation
-- side / message sender has EITHER a vendor or an agent ref set (enforced
-- in the service layer).

-- ── vendor_conversations: relax vendor FKs to nullable + add agent FKs ──────
ALTER TABLE `vendor_conversations` DROP FOREIGN KEY `vendor_conversations_vendor1Id_fkey`;
ALTER TABLE `vendor_conversations` DROP FOREIGN KEY `vendor_conversations_vendor2Id_fkey`;

ALTER TABLE `vendor_conversations` MODIFY COLUMN `vendor1Id` VARCHAR(191) NULL;
ALTER TABLE `vendor_conversations` MODIFY COLUMN `vendor2Id` VARCHAR(191) NULL;

ALTER TABLE `vendor_conversations`
  ADD CONSTRAINT `vendor_conversations_vendor1Id_fkey` FOREIGN KEY (`vendor1Id`)
  REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `vendor_conversations`
  ADD CONSTRAINT `vendor_conversations_vendor2Id_fkey` FOREIGN KEY (`vendor2Id`)
  REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `vendor_conversations`
  ADD COLUMN `agent1Id` VARCHAR(191) NULL,
  ADD COLUMN `agent2Id` VARCHAR(191) NULL;

CREATE INDEX `vendor_conversations_agent1Id_idx` ON `vendor_conversations`(`agent1Id`);
CREATE INDEX `vendor_conversations_agent2Id_idx` ON `vendor_conversations`(`agent2Id`);

ALTER TABLE `vendor_conversations`
  ADD CONSTRAINT `vendor_conversations_agent1Id_fkey` FOREIGN KEY (`agent1Id`)
  REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `vendor_conversations`
  ADD CONSTRAINT `vendor_conversations_agent2Id_fkey` FOREIGN KEY (`agent2Id`)
  REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Mirror the existing (vendor1Id, vendor2Id) unique key for all 4 polymorphic
-- combinations so we never insert a duplicate conversation between the same
-- two participants.
CREATE UNIQUE INDEX `vendor_conversations_vendor1Id_agent2Id_key`
  ON `vendor_conversations`(`vendor1Id`, `agent2Id`);
CREATE UNIQUE INDEX `vendor_conversations_agent1Id_vendor2Id_key`
  ON `vendor_conversations`(`agent1Id`, `vendor2Id`);
CREATE UNIQUE INDEX `vendor_conversations_agent1Id_agent2Id_key`
  ON `vendor_conversations`(`agent1Id`, `agent2Id`);

-- ── vendor_messages: relax senderId + add agent sender + senderType ─────────
ALTER TABLE `vendor_messages` DROP FOREIGN KEY `vendor_messages_senderId_fkey`;
ALTER TABLE `vendor_messages` MODIFY COLUMN `senderId` VARCHAR(191) NULL;
ALTER TABLE `vendor_messages`
  ADD CONSTRAINT `vendor_messages_senderId_fkey` FOREIGN KEY (`senderId`)
  REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `vendor_messages`
  ADD COLUMN `senderAgentId` VARCHAR(191) NULL,
  ADD COLUMN `senderType` VARCHAR(191) NOT NULL DEFAULT 'vendor';

CREATE INDEX `vendor_messages_senderAgentId_idx` ON `vendor_messages`(`senderAgentId`);
CREATE INDEX `vendor_messages_senderType_idx` ON `vendor_messages`(`senderType`);

ALTER TABLE `vendor_messages`
  ADD CONSTRAINT `vendor_messages_senderAgentId_fkey` FOREIGN KEY (`senderAgentId`)
  REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
