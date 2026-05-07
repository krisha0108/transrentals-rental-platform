-- ─────────────────────────────────────────────────────────────────────────────
-- TRAVEL AGENT FLEET BOOKINGS — date-range availability blocks per vehicle.
-- Powers the fleet calendar (customer bookings, manual blocks, maintenance).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `travel_agent_fleet_bookings` (
    `id`              VARCHAR(191) NOT NULL,
    `travelAgentId`   VARCHAR(191) NOT NULL,
    `fleetId`         VARCHAR(191) NOT NULL,
    `startDate`       DATETIME(3) NOT NULL,
    `endDate`         DATETIME(3) NOT NULL,
    `bookingType`     ENUM('CUSTOMER','MANUAL_BLOCK','MAINTENANCE','RESERVED') NOT NULL DEFAULT 'CUSTOMER',
    `status`          ENUM('CONFIRMED','TENTATIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `customerName`    VARCHAR(191) NULL,
    `customerPhone`   VARCHAR(191) NULL,
    `pickupLocation`  VARCHAR(191) NULL,
    `dropLocation`    VARCHAR(191) NULL,
    `amount`          DOUBLE NULL,
    `bookingRefId`    VARCHAR(191) NULL,
    `notes`           TEXT NULL,
    `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`       DATETIME(3) NOT NULL,

    INDEX `travel_agent_fleet_bookings_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_fleet_bookings_fleetId_idx`(`fleetId`),
    INDEX `travel_agent_fleet_bookings_startDate_idx`(`startDate`),
    INDEX `travel_agent_fleet_bookings_endDate_idx`(`endDate`),
    INDEX `travel_agent_fleet_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Foreign Keys ───────────────────────────────────────────────────────────

ALTER TABLE `travel_agent_fleet_bookings` ADD CONSTRAINT `travel_agent_fleet_bookings_fleetId_fkey`
    FOREIGN KEY (`fleetId`) REFERENCES `travel_agent_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
