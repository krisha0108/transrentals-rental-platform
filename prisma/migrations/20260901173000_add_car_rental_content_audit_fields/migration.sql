-- AlterTable
ALTER TABLE `chauffeur_local_packages` ADD COLUMN `createdById` VARCHAR(191) NULL AFTER `isActive`, ADD COLUMN `updatedById` VARCHAR(191) NULL AFTER `createdById`;

-- AlterTable
ALTER TABLE `chauffeur_route_packages` ADD COLUMN `createdById` VARCHAR(191) NULL AFTER `isActive`, ADD COLUMN `updatedById` VARCHAR(191) NULL AFTER `createdById`;

-- CreateIndex
CREATE INDEX `chauffeur_local_packages_createdById_idx` ON `chauffeur_local_packages`(`createdById`);

-- CreateIndex
CREATE INDEX `chauffeur_local_packages_updatedById_idx` ON `chauffeur_local_packages`(`updatedById`);

-- CreateIndex
CREATE INDEX `chauffeur_route_packages_createdById_idx` ON `chauffeur_route_packages`(`createdById`);

-- CreateIndex
CREATE INDEX `chauffeur_route_packages_updatedById_idx` ON `chauffeur_route_packages`(`updatedById`);

-- AddForeignKey
ALTER TABLE `chauffeur_local_packages` ADD CONSTRAINT `chauffeur_local_packages_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_local_packages` ADD CONSTRAINT `chauffeur_local_packages_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_route_packages` ADD CONSTRAINT `chauffeur_route_packages_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_route_packages` ADD CONSTRAINT `chauffeur_route_packages_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
