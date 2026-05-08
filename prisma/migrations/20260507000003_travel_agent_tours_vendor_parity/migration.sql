-- Travel agent tours — bring schema to parity with wander_listings so the
-- agent's add-tour flow can mirror the vendor side (Quick + Detailed) with
-- shared admin-managed categories, location picker, full pricing modes,
-- structured itinerary, advance payment, cancellation policy, etc.
-- All new fields are nullable / defaulted so existing rows remain valid.

ALTER TABLE `travel_agent_tours`
  ADD COLUMN `shortDescription` VARCHAR(500) NULL,
  ADD COLUMN `mainLocationId` VARCHAR(191) NULL,
  ADD COLUMN `categoryId` VARCHAR(191) NULL,
  ADD COLUMN `subCategoryId` VARCHAR(191) NULL,
  ADD COLUMN `experienceId` VARCHAR(191) NULL,
  ADD COLUMN `duration` VARCHAR(191) NULL,
  ADD COLUMN `priceType` ENUM('PER_PERSON','PER_GROUP','ON_REQUEST') NOT NULL DEFAULT 'ON_REQUEST',
  ADD COLUMN `basePrice` DOUBLE NULL,
  ADD COLUMN `priceTiers` LONGTEXT NULL,
  ADD COLUMN `highlights` LONGTEXT NULL,
  ADD COLUMN `customPlaces` LONGTEXT NULL,
  ADD COLUMN `vehicleOptions` TEXT NULL,
  ADD COLUMN `pickupType` VARCHAR(191) NULL,
  ADD COLUMN `meetingPoint` TEXT NULL,
  ADD COLUMN `guideLanguages` TEXT NULL,
  ADD COLUMN `availableDays` TEXT NULL,
  ADD COLUMN `advanceNoticeHours` INT NOT NULL DEFAULT 24,
  ADD COLUMN `cancellationPolicy` ENUM('FLEXIBLE','MODERATE','STRICT') NOT NULL DEFAULT 'MODERATE',
  ADD COLUMN `cancellationNotes` TEXT NULL,
  ADD COLUMN `requireAdvancePayment` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `advancePaymentType` VARCHAR(191) NULL,
  ADD COLUMN `advancePaymentValue` DOUBLE NULL,
  ADD COLUMN `tourStartDate` DATE NULL,
  ADD COLUMN `tourEndDate` DATE NULL,
  ADD COLUMN `status` ENUM('DRAFT','ACTIVE','PAUSED','INACTIVE') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `createMode` ENUM('QUICK','DETAILED') NOT NULL DEFAULT 'DETAILED';

-- Helpful indexes
CREATE INDEX `travel_agent_tours_categoryId_idx` ON `travel_agent_tours`(`categoryId`);
CREATE INDEX `travel_agent_tours_mainLocationId_idx` ON `travel_agent_tours`(`mainLocationId`);
CREATE INDEX `travel_agent_tours_status_idx` ON `travel_agent_tours`(`status`);
