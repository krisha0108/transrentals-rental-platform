-- Add fcmToken and lastLoginAt to vendor_staff (new columns - definitely don't exist)
ALTER TABLE `vendor_staff` ADD COLUMN `fcmToken` TEXT NULL;
ALTER TABLE `vendor_staff` ADD COLUMN `lastLoginAt` DATETIME(3) NULL;

-- Add fcmToken to vendors only if it doesn't already exist (may have been added manually)
SET @dbname = DATABASE();
SET @preparedStatement = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'vendors'
       AND COLUMN_NAME = 'fcmToken') > 0,
    'SELECT 1 -- vendors.fcmToken already exists, skipping',
    'ALTER TABLE `vendors` ADD COLUMN `fcmToken` TEXT NULL'
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
