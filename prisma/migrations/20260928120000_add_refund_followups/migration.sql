-- One queue for money owed back to customers.
--
-- Each service keeps its own booking table and each works out its own
-- refundAmount when a customer cancels. That number was written and then
-- nobody saw it again: no list, no owner, no way to tell a processed refund
-- from one still waiting. This table is the queue the refunds desk works, and
-- the only place the state of a refund lives.
CREATE TABLE `refund_followups` (
  `id`              VARCHAR(191) NOT NULL,
  `source`          VARCHAR(40)  NOT NULL,
  `bookingId`       VARCHAR(191) NOT NULL,
  `bookingNumber`   VARCHAR(64)  NOT NULL,
  `serviceType`     VARCHAR(40)  NOT NULL,
  `customerId`      VARCHAR(191) NULL,
  `customerName`    VARCHAR(191) NULL,
  `amount`          DOUBLE       NOT NULL,
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  `gatewayRefundId` VARCHAR(191) NULL,
  `notes`           TEXT         NULL,
  `handledBy`       VARCHAR(191) NULL,
  `handledAt`       DATETIME(3)  NULL,
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL,

  UNIQUE INDEX `refund_followups_source_bookingId_key` (`source`, `bookingId`),
  INDEX `refund_followups_status_idx` (`status`),
  INDEX `refund_followups_createdAt_idx` (`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The refunds desk needs its own notification kind.
ALTER TABLE `manager_notifications`
  MODIFY `type` ENUM(
    'REFUND_PENDING',
    'NEW_LOCATION_REQUEST',
    'NEW_SERVICE_REQUEST',
    'NEW_CONTACT_INQUIRY',
    'NEW_TRAVEL_AGENT_REGISTRATION',
    'NEW_VENDOR_AGREEMENT_SIGNED'
  ) NOT NULL;
