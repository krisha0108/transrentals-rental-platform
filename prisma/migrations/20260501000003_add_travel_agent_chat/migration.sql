-- ─────────────────────────────────────────────────────────────────────────────
-- TRAVEL AGENT CHAT — direct messaging between travel agents and customers
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `travel_agent_chat_conversations` (
    `id`               VARCHAR(191) NOT NULL,
    `travelAgentId`    VARCHAR(191) NOT NULL,
    `customerId`       VARCHAR(191) NULL,
    `customerName`     VARCHAR(191) NOT NULL,
    `customerPhone`    VARCHAR(191) NOT NULL,
    `customerEmail`    VARCHAR(191) NULL,
    `leadId`           VARCHAR(191) NULL,
    `tourId`           VARCHAR(191) NULL,
    `subject`          VARCHAR(191) NULL,
    `status`           VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `customerUnread`   INTEGER NOT NULL DEFAULT 0,
    `agentUnread`      INTEGER NOT NULL DEFAULT 0,
    `lastMessageAt`    DATETIME(3) NULL,
    `lastMessageText`  TEXT NULL,
    `lastSenderType`   VARCHAR(191) NULL,
    `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`        DATETIME(3) NOT NULL,

    INDEX `travel_agent_chat_conversations_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_chat_conversations_customerId_idx`(`customerId`),
    INDEX `travel_agent_chat_conversations_customerPhone_idx`(`customerPhone`),
    INDEX `travel_agent_chat_conversations_leadId_idx`(`leadId`),
    INDEX `travel_agent_chat_conversations_status_idx`(`status`),
    INDEX `travel_agent_chat_conversations_lastMessageAt_idx`(`lastMessageAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `travel_agent_chat_messages` (
    `id`             VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderType`     VARCHAR(191) NOT NULL,
    `senderId`       VARCHAR(191) NULL,
    `senderName`     VARCHAR(191) NULL,
    `messageType`    VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    `content`        TEXT NOT NULL,
    `attachmentUrl`  VARCHAR(191) NULL,
    `attachmentName` VARCHAR(191) NULL,
    `status`         VARCHAR(191) NOT NULL DEFAULT 'SENT',
    `readAt`         DATETIME(3) NULL,
    `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `travel_agent_chat_messages_conversationId_idx`(`conversationId`),
    INDEX `travel_agent_chat_messages_senderType_idx`(`senderType`),
    INDEX `travel_agent_chat_messages_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys
ALTER TABLE `travel_agent_chat_conversations` ADD CONSTRAINT `travel_agent_chat_conversations_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `travel_agent_chat_messages` ADD CONSTRAINT `travel_agent_chat_messages_conversationId_fkey`
    FOREIGN KEY (`conversationId`) REFERENCES `travel_agent_chat_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
