-- Driver CRM tags.
--
-- Mirrors vendor_tag_assignments but for drivers. Drivers live in two tables —
-- standalone `drivers` and `vendor_staff` (role='DRIVER') — so the assignment is
-- polymorphic: (driverId, source) identifies the driver. Because of this we do
-- NOT add a foreign key to either driver table; assignedById still FKs
-- admin_users so the "tagged by" attribution survives.
--
-- These tags coexist with the driver's status (the formal system state used for
-- approval/booking gating). Tags are a separate, manager-managed follow-up layer.
--
-- Many-to-many: a driver can carry multiple tags. Unique constraint on
-- (driverId, source, tag) keeps the relationship a set, not a multiset.

CREATE TABLE `driver_tag_assignments` (
  `id`           VARCHAR(191) NOT NULL,
  `driverId`     VARCHAR(191) NOT NULL,
  `source`       VARCHAR(191) NOT NULL DEFAULT 'standalone',
  `tag`          ENUM(
    'FOLLOW_UP_REQUIRED',
    'CONNECTED',
    'RESPONDED',
    'DOCUMENTS_PENDING',
    'DOCUMENTS_VERIFIED',
    'WRONG_DRIVER_DETAILS',
    'NOT_INTERESTED',
    'NO_RESPONSE',
    'VEHICLE_DETAILS_PENDING',
    'ACTIVE_DRIVER',
    'SUSPENDED'
  ) NOT NULL,
  `assignedById` VARCHAR(191) NULL,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `driver_tag_assignments_driverId_source_tag_key` (`driverId`, `source`, `tag`),
  INDEX `driver_tag_assignments_tag_idx` (`tag`),
  INDEX `driver_tag_assignments_driverId_idx` (`driverId`),
  INDEX `driver_tag_assignments_assignedById_fkey` (`assignedById`),

  CONSTRAINT `driver_tag_assignments_assignedById_fkey`
    FOREIGN KEY (`assignedById`) REFERENCES `admin_users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
