ALTER TABLE `vendor_staff` ADD COLUMN `did` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `vendor_staff_did_key` ON `vendor_staff`(`did`);
