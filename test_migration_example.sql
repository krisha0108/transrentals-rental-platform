-- Example: How to add a new table safely
-- This is just a reference, actual migrations are created by Prisma

-- Step 1: Create migration with Prisma (no need to write SQL manually)
-- npx prisma migrate dev --name add_test_table

-- The generated SQL will look like this:
CREATE TABLE `test_new_table` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- This is SAFE because:
-- 1. It only CREATES a new table
-- 2. It does NOT modify existing tables
-- 3. It does NOT delete any data
-- 4. All existing data remains untouched

-- For production deployment:
-- Just run: npx prisma migrate deploy
-- Result: New table added, all existing data preserved!
