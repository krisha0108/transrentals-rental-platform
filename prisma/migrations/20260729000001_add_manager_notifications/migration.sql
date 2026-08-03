-- Manager notification inbox — alerts a manager when a vendor within their
-- assigned location/service scope submits a new location or service
-- request. Mirrors travel_agent_notifications. Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS `manager_notifications` (
  `id` VARCHAR(191) NOT NULL,
  `managerId` VARCHAR(191) NOT NULL,
  `type` ENUM('NEW_LOCATION_REQUEST', 'NEW_SERVICE_REQUEST') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `link` VARCHAR(191) NULL,
  `metadata` TEXT NULL,
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `manager_notifications_managerId_createdAt_idx` (`managerId`, `createdAt`),
  INDEX `manager_notifications_managerId_isRead_idx` (`managerId`, `isRead`),

  CONSTRAINT `manager_notifications_managerId_fkey`
    FOREIGN KEY (`managerId`) REFERENCES `admin_users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
