-- Travel agent in-app notifications.
--
-- Replaces the temporary `settings` table JSON-blob approach used on the
-- vendor side. Each row is one notification for one travel agent; readers
-- (the notifications page, the bell-badge endpoint) query by travelAgentId
-- with an isRead filter or createdAt order.

CREATE TABLE `travel_agent_notifications` (
  `id`            VARCHAR(191) NOT NULL,
  `travelAgentId` VARCHAR(191) NOT NULL,
  `type`          ENUM('LEAD', 'PAYMENT', 'BOOKING', 'CHAT', 'SYSTEM') NOT NULL,
  `title`         VARCHAR(191) NOT NULL,
  `body`          TEXT         NOT NULL,
  `link`          VARCHAR(191) NULL,
  `metadata`      TEXT         NULL,
  `isRead`        BOOLEAN      NOT NULL DEFAULT false,
  `readAt`        DATETIME(3)  NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `travel_agent_notifications_travelAgentId_createdAt_idx`
    (`travelAgentId`, `createdAt`),
  INDEX `travel_agent_notifications_travelAgentId_isRead_idx`
    (`travelAgentId`, `isRead`),

  CONSTRAINT `travel_agent_notifications_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`)
    REFERENCES `travel_agents`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
