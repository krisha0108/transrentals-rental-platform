-- ─────────────────────────────────────────────────────────────────────────────
-- TRAVEL AGENTS MODULE — parallel user type to vendors with their own dashboard,
-- lead management, tours, properties, and bookings.
-- ─────────────────────────────────────────────────────────────────────────────

-- CreateTable: travel_agents
CREATE TABLE IF NOT EXISTS `travel_agents` (
    `id`                VARCHAR(191) NOT NULL,
    `email`             VARCHAR(191) NOT NULL,
    `password`          VARCHAR(191) NOT NULL,
    `phone`             VARCHAR(191) NOT NULL,
    `agencyName`        VARCHAR(191) NOT NULL,
    `ownerName`         VARCHAR(191) NOT NULL,
    `agencyType`        VARCHAR(191) NULL,
    `gstNumber`         VARCHAR(191) NULL,
    `panNumber`         VARCHAR(191) NULL,
    `address`           TEXT NULL,
    `city`              VARCHAR(191) NULL,
    `state`             VARCHAR(191) NULL,
    `pincode`           VARCHAR(191) NULL,
    `logo`              VARCHAR(191) NULL,
    `description`       TEXT NULL,
    `website`           VARCHAR(191) NULL,
    `bankName`          VARCHAR(191) NULL,
    `accountNumber`     VARCHAR(191) NULL,
    `ifscCode`          VARCHAR(191) NULL,
    `accountHolderName` VARCHAR(191) NULL,
    `status`            ENUM('PENDING','DOCUMENTS_PENDING','UNDER_REVIEW','APPROVED','REJECTED','SUSPENDED','BLOCKED') NOT NULL DEFAULT 'DOCUMENTS_PENDING',
    `isEmailVerified`   BOOLEAN NOT NULL DEFAULT false,
    `isPhoneVerified`   BOOLEAN NOT NULL DEFAULT false,
    `approvedAt`        DATETIME(3) NULL,
    `approvedById`      VARCHAR(191) NULL,
    `rejectionReason`   TEXT NULL,
    `rating`            DOUBLE NULL DEFAULT 0,
    `totalRatings`      INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt`       DATETIME(3) NULL,
    `fcmToken`          TEXT NULL,
    `slug`              VARCHAR(191) NULL,
    `commissionRate`    DOUBLE NULL DEFAULT 0,
    `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`         DATETIME(3) NOT NULL,

    UNIQUE INDEX `travel_agents_email_key`(`email`),
    UNIQUE INDEX `travel_agents_phone_key`(`phone`),
    UNIQUE INDEX `travel_agents_slug`(`slug`),
    INDEX `travel_agents_approvedById_fkey`(`approvedById`),
    INDEX `travel_agents_email_idx`(`email`),
    INDEX `travel_agents_phone_idx`(`phone`),
    INDEX `travel_agents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_documents
CREATE TABLE IF NOT EXISTS `travel_agent_documents` (
    `id`              VARCHAR(191) NOT NULL,
    `travelAgentId`   VARCHAR(191) NOT NULL,
    `documentType`    ENUM('GST_CERTIFICATE','PAN_CARD','AGENCY_REGISTRATION','IATA_CERTIFICATE','TRAVEL_AGENT_LICENSE','ADDRESS_PROOF','BANK_DETAILS','CANCELLED_CHEQUE','OWNER_AADHAAR','OWNER_PAN','OTHER') NOT NULL,
    `documentName`    VARCHAR(191) NOT NULL,
    `documentUrl`     VARCHAR(191) NOT NULL,
    `documentNumber`  VARCHAR(191) NULL,
    `status`          ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
    `verifiedAt`      DATETIME(3) NULL,
    `verifiedById`    VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `uploadedById`    VARCHAR(191) NULL,
    `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`       DATETIME(3) NOT NULL,

    INDEX `travel_agent_documents_documentType_idx`(`documentType`),
    INDEX `travel_agent_documents_status_idx`(`status`),
    INDEX `travel_agent_documents_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_documents_uploadedById_idx`(`uploadedById`),
    INDEX `travel_agent_documents_verifiedById_idx`(`verifiedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_bank_accounts
CREATE TABLE IF NOT EXISTS `travel_agent_bank_accounts` (
    `id`                VARCHAR(191) NOT NULL,
    `travelAgentId`     VARCHAR(191) NOT NULL,
    `bankName`          VARCHAR(191) NOT NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `accountNumber`     VARCHAR(191) NOT NULL,
    `ifscCode`          VARCHAR(191) NOT NULL,
    `accountType`       VARCHAR(191) NOT NULL DEFAULT 'SAVINGS',
    `branchName`        VARCHAR(191) NULL,
    `upiId`             VARCHAR(191) NULL,
    `isPrimary`         BOOLEAN NOT NULL DEFAULT false,
    `isActive`          BOOLEAN NOT NULL DEFAULT true,
    `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`         DATETIME(3) NOT NULL,

    INDEX `travel_agent_bank_accounts_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_bank_accounts_isPrimary_idx`(`isPrimary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_lead_capture_links
CREATE TABLE IF NOT EXISTS `travel_agent_lead_capture_links` (
    `id`                VARCHAR(191) NOT NULL,
    `travelAgentId`     VARCHAR(191) NOT NULL,
    `slug`              VARCHAR(191) NOT NULL,
    `title`             VARCHAR(191) NOT NULL,
    `description`       TEXT NULL,
    `defaultTripType`   VARCHAR(191) NULL,
    `isActive`          BOOLEAN NOT NULL DEFAULT true,
    `totalSubmissions`  INTEGER NOT NULL DEFAULT 0,
    `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`         DATETIME(3) NOT NULL,

    UNIQUE INDEX `travel_agent_lead_capture_links_slug_key`(`slug`),
    INDEX `travel_agent_lead_capture_links_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_lead_capture_links_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_leads
CREATE TABLE IF NOT EXISTS `travel_agent_leads` (
    `id`                  VARCHAR(191) NOT NULL,
    `travelAgentId`       VARCHAR(191) NOT NULL,
    `customerName`        VARCHAR(191) NOT NULL,
    `customerPhone`       VARCHAR(191) NOT NULL,
    `customerEmail`       VARCHAR(191) NULL,
    `source`              ENUM('MANUAL','CAPTURE_LINK','WEBSITE','REFERRAL','WALK_IN','SOCIAL_MEDIA','GOOGLE_ADS','WHATSAPP','OTHER') NOT NULL DEFAULT 'MANUAL',
    `captureLinkId`       VARCHAR(191) NULL,
    `tripType`            VARCHAR(191) NULL,
    `pickupLocation`      VARCHAR(191) NULL,
    `dropLocation`        VARCHAR(191) NULL,
    `destination`         VARCHAR(191) NULL,
    `travelDate`          DATETIME(3) NULL,
    `returnDate`          DATETIME(3) NULL,
    `passengers`          INTEGER NULL DEFAULT 1,
    `requirement`         TEXT NULL,
    `estimatedValue`      DOUBLE NULL,
    `quotedAmount`        DOUBLE NULL,
    `status`              ENUM('NEW','CONTACTED','INTERESTED','QUOTED','NEGOTIATING','BOOKED','LOST','COLD') NOT NULL DEFAULT 'NEW',
    `priority`            ENUM('HOT','WARM','COLD') NOT NULL DEFAULT 'WARM',
    `assignedToName`      VARCHAR(191) NULL,
    `nextFollowUp`        DATETIME(3) NULL,
    `lastContactAt`       DATETIME(3) NULL,
    `lostReason`          TEXT NULL,
    `convertedBookingId`  VARCHAR(191) NULL,
    `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`           DATETIME(3) NOT NULL,

    INDEX `travel_agent_leads_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_leads_status_idx`(`status`),
    INDEX `travel_agent_leads_priority_idx`(`priority`),
    INDEX `travel_agent_leads_source_idx`(`source`),
    INDEX `travel_agent_leads_nextFollowUp_idx`(`nextFollowUp`),
    INDEX `travel_agent_leads_captureLinkId_idx`(`captureLinkId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_lead_notes
CREATE TABLE IF NOT EXISTS `travel_agent_lead_notes` (
    `id`         VARCHAR(191) NOT NULL,
    `leadId`     VARCHAR(191) NOT NULL,
    `note`       TEXT NOT NULL,
    `authorName` VARCHAR(191) NULL,
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `travel_agent_lead_notes_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_tours
CREATE TABLE IF NOT EXISTS `travel_agent_tours` (
    `id`              VARCHAR(191) NOT NULL,
    `travelAgentId`   VARCHAR(191) NOT NULL,
    `title`           VARCHAR(191) NOT NULL,
    `slug`            VARCHAR(191) NULL,
    `description`     TEXT NULL,
    `destination`     VARCHAR(191) NOT NULL,
    `durationDays`    INTEGER NOT NULL DEFAULT 1,
    `durationNights`  INTEGER NOT NULL DEFAULT 0,
    `startingPrice`   DOUBLE NULL,
    `inclusions`      LONGTEXT NULL,
    `exclusions`      LONGTEXT NULL,
    `itinerary`       LONGTEXT NULL,
    `termsConditions` LONGTEXT NULL,
    `coverImage`      VARCHAR(191) NULL,
    `galleryImages`   LONGTEXT NULL,
    `category`        VARCHAR(191) NULL,
    `isActive`        BOOLEAN NOT NULL DEFAULT true,
    `isPublic`        BOOLEAN NOT NULL DEFAULT false,
    `totalBookings`   INTEGER NOT NULL DEFAULT 0,
    `rating`          DOUBLE NULL DEFAULT 0,
    `totalRatings`    INTEGER NOT NULL DEFAULT 0,
    `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`       DATETIME(3) NOT NULL,

    UNIQUE INDEX `travel_agent_tours_travelAgentId_slug_key`(`travelAgentId`, `slug`),
    INDEX `travel_agent_tours_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_tours_isActive_idx`(`isActive`),
    INDEX `travel_agent_tours_destination_idx`(`destination`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_properties
CREATE TABLE IF NOT EXISTS `travel_agent_properties` (
    `id`            VARCHAR(191) NOT NULL,
    `travelAgentId` VARCHAR(191) NOT NULL,
    `name`          VARCHAR(191) NOT NULL,
    `slug`          VARCHAR(191) NULL,
    `propertyType`  ENUM('RESORT','HOTEL','HOMESTAY','APARTMENT','VILLA','GUEST_HOUSE','HOSTEL','ROOMS','OTHER') NOT NULL DEFAULT 'RESORT',
    `description`   TEXT NULL,
    `address`       TEXT NULL,
    `city`          VARCHAR(191) NULL,
    `state`         VARCHAR(191) NULL,
    `pincode`       VARCHAR(191) NULL,
    `latitude`      DOUBLE NULL,
    `longitude`     DOUBLE NULL,
    `totalRooms`    INTEGER NOT NULL DEFAULT 1,
    `startingPrice` DOUBLE NULL,
    `amenities`     LONGTEXT NULL,
    `inclusions`    LONGTEXT NULL,
    `exclusions`    LONGTEXT NULL,
    `rules`         LONGTEXT NULL,
    `checkInTime`   VARCHAR(191) NULL,
    `checkOutTime`  VARCHAR(191) NULL,
    `coverImage`    VARCHAR(191) NULL,
    `galleryImages` LONGTEXT NULL,
    `isActive`      BOOLEAN NOT NULL DEFAULT true,
    `isPublic`      BOOLEAN NOT NULL DEFAULT false,
    `totalBookings` INTEGER NOT NULL DEFAULT 0,
    `rating`        DOUBLE NULL DEFAULT 0,
    `totalRatings`  INTEGER NOT NULL DEFAULT 0,
    `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`     DATETIME(3) NOT NULL,

    UNIQUE INDEX `travel_agent_properties_travelAgentId_slug_key`(`travelAgentId`, `slug`),
    INDEX `travel_agent_properties_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_properties_propertyType_idx`(`propertyType`),
    INDEX `travel_agent_properties_city_idx`(`city`),
    INDEX `travel_agent_properties_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: travel_agent_bookings
CREATE TABLE IF NOT EXISTS `travel_agent_bookings` (
    `id`               VARCHAR(191) NOT NULL,
    `travelAgentId`    VARCHAR(191) NOT NULL,
    `bookingNumber`    VARCHAR(191) NOT NULL,
    `customerName`     VARCHAR(191) NOT NULL,
    `customerPhone`    VARCHAR(191) NOT NULL,
    `customerEmail`    VARCHAR(191) NULL,
    `bookingType`      VARCHAR(191) NOT NULL,
    `referenceId`      VARCHAR(191) NULL,
    `referenceTitle`   VARCHAR(191) NULL,
    `pickupLocation`   VARCHAR(191) NULL,
    `dropLocation`     VARCHAR(191) NULL,
    `travelDate`       DATETIME(3) NULL,
    `returnDate`       DATETIME(3) NULL,
    `checkInDate`      DATETIME(3) NULL,
    `checkOutDate`     DATETIME(3) NULL,
    `passengers`       INTEGER NULL DEFAULT 1,
    `rooms`            INTEGER NULL DEFAULT 1,
    `totalAmount`      DOUBLE NULL DEFAULT 0,
    `paidAmount`       DOUBLE NULL DEFAULT 0,
    `paymentStatus`    VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `status`           ENUM('DRAFT','PENDING_CUSTOMER','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `shareToken`       VARCHAR(191) NULL,
    `shareExpiresAt`   DATETIME(3) NULL,
    `customerFilledAt` DATETIME(3) NULL,
    `notes`            TEXT NULL,
    `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`        DATETIME(3) NOT NULL,

    UNIQUE INDEX `travel_agent_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `travel_agent_bookings_shareToken_key`(`shareToken`),
    INDEX `travel_agent_bookings_travelAgentId_idx`(`travelAgentId`),
    INDEX `travel_agent_bookings_status_idx`(`status`),
    INDEX `travel_agent_bookings_bookingNumber_idx`(`bookingNumber`),
    INDEX `travel_agent_bookings_shareToken_idx`(`shareToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Foreign Keys ───────────────────────────────────────────────────────────

-- AddForeignKey: travel_agents.approvedById -> admin_users.id
ALTER TABLE `travel_agents` ADD CONSTRAINT `travel_agents_approvedById_fkey`
    FOREIGN KEY (`approvedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_documents.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_documents` ADD CONSTRAINT `travel_agent_documents_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_documents.uploadedById -> admin_users.id
ALTER TABLE `travel_agent_documents` ADD CONSTRAINT `travel_agent_documents_uploadedById_fkey`
    FOREIGN KEY (`uploadedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_documents.verifiedById -> admin_users.id
ALTER TABLE `travel_agent_documents` ADD CONSTRAINT `travel_agent_documents_verifiedById_fkey`
    FOREIGN KEY (`verifiedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_bank_accounts.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_bank_accounts` ADD CONSTRAINT `travel_agent_bank_accounts_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_lead_capture_links.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_lead_capture_links` ADD CONSTRAINT `travel_agent_lead_capture_links_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_leads.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_leads` ADD CONSTRAINT `travel_agent_leads_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_leads.captureLinkId -> travel_agent_lead_capture_links.id
ALTER TABLE `travel_agent_leads` ADD CONSTRAINT `travel_agent_leads_captureLinkId_fkey`
    FOREIGN KEY (`captureLinkId`) REFERENCES `travel_agent_lead_capture_links`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_lead_notes.leadId -> travel_agent_leads.id
ALTER TABLE `travel_agent_lead_notes` ADD CONSTRAINT `travel_agent_lead_notes_leadId_fkey`
    FOREIGN KEY (`leadId`) REFERENCES `travel_agent_leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_tours.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_tours` ADD CONSTRAINT `travel_agent_tours_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_properties.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_properties` ADD CONSTRAINT `travel_agent_properties_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: travel_agent_bookings.travelAgentId -> travel_agents.id
ALTER TABLE `travel_agent_bookings` ADD CONSTRAINT `travel_agent_bookings_travelAgentId_fkey`
    FOREIGN KEY (`travelAgentId`) REFERENCES `travel_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
