-- Adds a manager-review step in front of admin execution: the manager
-- decides whether a refund is owed, how much, and whether the vendor keeps
-- their share, then sends that decision to the admin desk to actually move
-- the money. `MANAGER_REVIEWED` joins the existing status values.
ALTER TABLE `refund_followups`
  ADD COLUMN `customerRefundApproved` BOOLEAN NULL,
  ADD COLUMN `approvedAmount` DOUBLE NULL,
  ADD COLUMN `vendorPayoutApproved` BOOLEAN NULL,
  ADD COLUMN `managerNotes` TEXT NULL,
  ADD COLUMN `reviewedBy` VARCHAR(191) NULL,
  ADD COLUMN `reviewedAt` DATETIME(3) NULL;
