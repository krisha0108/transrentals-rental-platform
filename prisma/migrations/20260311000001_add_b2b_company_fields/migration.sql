-- Add companyEmail, companyPhone, companyAddress to customers table (idempotent)

DROP PROCEDURE IF EXISTS add_b2b_company_fields;
CREATE PROCEDURE add_b2b_company_fields()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND COLUMN_NAME = 'companyEmail'
    ) THEN
        ALTER TABLE `customers` ADD COLUMN `companyEmail` VARCHAR(191) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND COLUMN_NAME = 'companyPhone'
    ) THEN
        ALTER TABLE `customers` ADD COLUMN `companyPhone` VARCHAR(191) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'customers'
          AND COLUMN_NAME = 'companyAddress'
    ) THEN
        ALTER TABLE `customers` ADD COLUMN `companyAddress` TEXT NULL;
    END IF;
END;
CALL add_b2b_company_fields();
DROP PROCEDURE IF EXISTS add_b2b_company_fields;
