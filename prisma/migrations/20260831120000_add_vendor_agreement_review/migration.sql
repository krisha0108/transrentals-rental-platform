-- Manager review of a vendor's signed partnership agreement.
ALTER TABLE `vendor_partnership_agreements`
  ADD COLUMN `reviewStatus` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `reviewedAt` DATETIME(3) NULL,
  ADD COLUMN `reviewedById` VARCHAR(191) NULL,
  ADD COLUMN `reviewNote` TEXT NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `vendor_partnership_agreements_reviewStatus_acceptedAt_idx`
  ON `vendor_partnership_agreements`(`reviewStatus`, `acceptedAt`);

-- Managers get an inbox entry when a vendor signs.
ALTER TABLE `manager_notifications`
  MODIFY `type` ENUM(
    'NEW_LOCATION_REQUEST',
    'NEW_SERVICE_REQUEST',
    'NEW_CONTACT_INQUIRY',
    'NEW_TRAVEL_AGENT_REGISTRATION',
    'NEW_VENDOR_AGREEMENT_SIGNED'
  ) NOT NULL;
