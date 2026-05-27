-- Make customers.phone optional (nullable) to support Google login
-- Google OAuth does not provide a phone number, so new customers created
-- via Google login would fail with a NOT NULL constraint violation.
ALTER TABLE `customers` MODIFY COLUMN `phone` VARCHAR(191) NULL;
