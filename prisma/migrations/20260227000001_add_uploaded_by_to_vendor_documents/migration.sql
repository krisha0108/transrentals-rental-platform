-- Column uploadedById already exists, rename index and FK to match Prisma conventions

-- Drop old foreign key
ALTER TABLE `vendor_documents` DROP FOREIGN KEY `fk_vendor_documents_uploadedById`;

-- Drop old index
DROP INDEX `idx_vendor_documents_uploadedById` ON `vendor_documents`;

-- Recreate index with Prisma naming convention
CREATE INDEX `vendor_documents_uploadedById_idx` ON `vendor_documents`(`uploadedById`);

-- Recreate foreign key with Prisma naming convention
ALTER TABLE `vendor_documents` ADD CONSTRAINT `vendor_documents_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
