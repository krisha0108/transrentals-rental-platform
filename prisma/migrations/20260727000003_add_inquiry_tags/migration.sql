-- Inquiry (quote request) CRM tags — mirrors vendor_tag_assignments, but
-- polymorphic across the 7 quote_requests tables (no hard FK on recordId,
-- same pattern as manager_action_logs), since inquiry ids span multiple
-- tables. Idempotent: safe to re-run.

DROP PROCEDURE IF EXISTS add_inquiry_tag_assignments;
CREATE PROCEDURE add_inquiry_tag_assignments()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'inquiry_tag_assignments'
    ) THEN
        CREATE TABLE `inquiry_tag_assignments` (
          `id`           VARCHAR(191) NOT NULL,
          `serviceType`  VARCHAR(191) NOT NULL,
          `recordId`     VARCHAR(191) NOT NULL,
          `tag`          ENUM(
            'FOLLOW_UP_REQUIRED',
            'CONNECTED',
            'RESPONDED',
            'NOT_INTERESTED',
            'NO_RESPONSE',
            'WRONG_NUMBER',
            'PRICE_TOO_HIGH',
            'HOT_LEAD',
            'COLD_LEAD',
            'CONVERTED',
            'DUPLICATE_INQUIRY'
          ) NOT NULL,
          `assignedById` VARCHAR(191) NULL,
          `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

          PRIMARY KEY (`id`),
          UNIQUE KEY `inquiry_tag_assignments_recordId_tag_key` (`recordId`, `tag`),
          INDEX `inquiry_tag_assignments_recordId_idx` (`recordId`),
          INDEX `inquiry_tag_assignments_tag_idx` (`tag`),
          INDEX `inquiry_tag_assignments_assignedById_fkey` (`assignedById`),

          CONSTRAINT `inquiry_tag_assignments_assignedById_fkey`
            FOREIGN KEY (`assignedById`) REFERENCES `admin_users`(`id`)
            ON DELETE SET NULL ON UPDATE CASCADE
        ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    END IF;
END;
CALL add_inquiry_tag_assignments();
DROP PROCEDURE IF EXISTS add_inquiry_tag_assignments;
