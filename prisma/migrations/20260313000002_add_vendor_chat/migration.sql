-- CreateTable
CREATE TABLE `vendor_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `vendor1Id` VARCHAR(191) NOT NULL,
    `vendor2Id` VARCHAR(191) NOT NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_conversations_vendor1Id_idx`(`vendor1Id`),
    INDEX `vendor_conversations_vendor2Id_idx`(`vendor2Id`),
    INDEX `vendor_conversations_lastMessageAt_idx`(`lastMessageAt`),
    UNIQUE INDEX `vendor_conversations_vendor1Id_vendor2Id_key`(`vendor1Id`, `vendor2Id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_messages_conversationId_idx`(`conversationId`),
    INDEX `vendor_messages_senderId_idx`(`senderId`),
    INDEX `vendor_messages_createdAt_idx`(`createdAt`),
    INDEX `vendor_messages_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_conversations` ADD CONSTRAINT `vendor_conversations_vendor1Id_fkey` FOREIGN KEY (`vendor1Id`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_conversations` ADD CONSTRAINT `vendor_conversations_vendor2Id_fkey` FOREIGN KEY (`vendor2Id`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_messages` ADD CONSTRAINT `vendor_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `vendor_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_messages` ADD CONSTRAINT `vendor_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
