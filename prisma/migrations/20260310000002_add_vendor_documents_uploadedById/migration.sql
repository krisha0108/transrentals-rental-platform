-- Add uploadedById column to vendor_documents for tracking which admin uploaded a document
ALTER TABLE `vendor_documents` ADD COLUMN `uploadedById` VARCHAR(191) NULL;
ALTER TABLE `vendor_documents` ADD CONSTRAINT `fk_vendor_documents_uploadedById` FOREIGN KEY (`uploadedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX `vendor_documents_uploadedById_idx` ON `vendor_documents`(`uploadedById`);
