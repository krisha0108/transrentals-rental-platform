-- ─────────────────────────────────────────────────────────────────────────────
-- TRAVEL AGENT FLEET — self-contained vehicle inventory for tour transport
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `travel_agent_fleets` (
    `id`                   VARCHAR(191) NOT NULL,
    `travelAgentId`        VARCHAR(191) NOT NULL,
    `vehicleType`          ENUM('SEDAN','SUV','MUV','HATCHBACK','TEMPO_TRAVELLER','MINI_BUS','BUS','LUXURY_CAR','BIKE','SCOOTER','CAMPER_VAN','OTHER') NOT NULL DEFAULT 'SEDAN',
    `vehicleName`          VARCHAR(191) NOT NULL,
    `brand`                VARCHAR(191) NULL,
    `model`                VARCHAR(191) NULL,
    `registrationNumber`   VARCHAR(191) NULL,
    `yearOfManufacture`    INTEGER NULL,
    `color`                VARCHAR(191) NULL,
    `fuelType`             ENUM('PETROL','DIESEL','CNG','LPG','EV','HYBRID','OTHER') NULL,
    `transmission`         VARCHAR(191) NULL,
    `seatingCapacity`      INTEGER NULL,
    `luggageCapacity`      INTEGER NULL,
    `chauffeurIncluded`    BOOLEAN NOT NULL DEFAULT true,
    `chauffeurName`        VARCHAR(191) NULL,
    `chauffeurPhone`       VARCHAR(191) NULL,
    `chauffeurLanguages`   TEXT NULL,
    `amenities`            LONGTEXT NULL,
    `baseLocation`         VARCHAR(191) NULL,
    `ratePerDay`           DOUBLE NULL,
    `ratePerKm`            DOUBLE NULL,
    `minimumBookingHours`  INTEGER NULL,
    `description`          TEXT NULL,
    `coverImage`           VARCHAR(191) NULL,
    `galleryImages`        LONGTEXT NULL,
    `rcImage`              VARCHAR(191) NULL,
    `insuranceImage`       VARCHAR(191) NULL,
    `fitnessImage`         VARCHAR(191) NULL,
    `permitImage`          VARCHAR(191) NULL,
    `insuranceProvider`    VARCHAR(191) NULL,
    `insuranceValidity`    DATETIME(3) NULL,
    `fitnessValidity`      DATETIME(3) NULL,
    `permitType`           VARCHAR(191) NULL,
    `isActive`             BOOLEAN NOT NULL DEFAULT true,
    `isAvailable`          BOOLEAN NOT NULL DEFAULT true,
    `totalTrips`           INTEGER NOT NULL DEFAULT 0,
    `rating`               DOUBLE NULL DEFAULT 0,
    `totalRatings`         INTEGER NOT NULL DEFAULT 0,
    `createdAt`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`            DATETIME(3) NOT NULL,

    UNIQUE INDEX `travel_agent_fleets_travelAgentId_registrationNumber_key`(`travelAgentId`, `registrationNumber`),
    INDEX `travel_agent_fleets_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_fleets_vehicleType_idx`(`vehicleType`),
    INDEX `travel_agent_fleets_isActive_idx`(`isActive`),
    INDEX `travel_agent_fleets_isAvailable_idx`(`isAvailable`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Foreign Keys ───────────────────────────────────────────────────────────

-- AddForeignKey: travel_agent_fleets.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_fleets` ADD CONSTRAINT `travel_agent_fleets_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
