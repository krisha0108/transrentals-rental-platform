-- CreateTable: wander_friend_groups
CREATE TABLE IF NOT EXISTS `wander_friend_groups` (
    `id` VARCHAR(191) NOT NULL,
    `groupCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `emoji` VARCHAR(191) NULL DEFAULT '🌏',
    `avatarUrl` VARCHAR(191) NULL,
    `maxMembers` INTEGER NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wander_friend_groups_groupCode_key`(`groupCode`),
    INDEX `wander_friend_groups_createdById_idx`(`createdById`),
    INDEX `wander_friend_groups_groupCode_idx`(`groupCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_friend_group_members
CREATE TABLE IF NOT EXISTS `wander_friend_group_members` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastReadAt` DATETIME(3) NULL,

    UNIQUE INDEX `wander_friend_group_members_groupId_phone_key`(`groupId`, `phone`),
    INDEX `wander_friend_group_members_groupId_idx`(`groupId`),
    INDEX `wander_friend_group_members_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_group_trips
CREATE TABLE IF NOT EXISTS `wander_group_trips` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NULL,
    `proposedById` VARCHAR(191) NOT NULL,
    `travelDate` DATE NULL,
    `note` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PLANNING',
    `quoteRequestId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `wander_group_trips_groupId_idx`(`groupId`),
    INDEX `wander_group_trips_listingId_idx`(`listingId`),
    INDEX `wander_group_trips_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_group_trip_members
CREATE TABLE IF NOT EXISTS `wander_group_trip_members` (
    `id` VARCHAR(191) NOT NULL,
    `groupTripId` VARCHAR(191) NOT NULL,
    `groupMemberId` VARCHAR(191) NOT NULL,
    `requirements` TEXT NULL,
    `isGoing` VARCHAR(191) NOT NULL DEFAULT 'MAYBE',
    `respondedAt` DATETIME(3) NULL,

    UNIQUE INDEX `wander_group_trip_members_groupTripId_groupMemberId_key`(`groupTripId`, `groupMemberId`),
    INDEX `wander_group_trip_members_groupTripId_idx`(`groupTripId`),
    INDEX `wander_group_trip_members_groupMemberId_idx`(`groupMemberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_group_messages
CREATE TABLE IF NOT EXISTS `wander_group_messages` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wander_group_messages_groupId_idx`(`groupId`),
    INDEX `wander_group_messages_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_group_message_reactions
CREATE TABLE IF NOT EXISTS `wander_group_message_reactions` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `emoji` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wander_group_message_reactions_messageId_memberId_emoji_key`(`messageId`, `memberId`, `emoji`),
    INDEX `wander_group_message_reactions_messageId_idx`(`messageId`),
    INDEX `wander_group_message_reactions_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_trip_date_options
CREATE TABLE IF NOT EXISTS `wander_trip_date_options` (
    `id` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `addedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wander_trip_date_options_tripId_idx`(`tripId`),
    INDEX `wander_trip_date_options_addedById_idx`(`addedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: wander_trip_date_votes
CREATE TABLE IF NOT EXISTS `wander_trip_date_votes` (
    `id` VARCHAR(191) NOT NULL,
    `optionId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wander_trip_date_votes_optionId_memberId_key`(`optionId`, `memberId`),
    INDEX `wander_trip_date_votes_optionId_idx`(`optionId`),
    INDEX `wander_trip_date_votes_memberId_idx`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: wander_friend_groups -> customers
ALTER TABLE `wander_friend_groups` ADD CONSTRAINT `wander_friend_groups_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_friend_group_members -> wander_friend_groups
ALTER TABLE `wander_friend_group_members` ADD CONSTRAINT `wander_friend_group_members_groupId_fkey`
    FOREIGN KEY (`groupId`) REFERENCES `wander_friend_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_friend_group_members -> customers
ALTER TABLE `wander_friend_group_members` ADD CONSTRAINT `wander_friend_group_members_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: wander_group_trips -> wander_friend_groups
ALTER TABLE `wander_group_trips` ADD CONSTRAINT `wander_group_trips_groupId_fkey`
    FOREIGN KEY (`groupId`) REFERENCES `wander_friend_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_group_trips -> wander_listings
ALTER TABLE `wander_group_trips` ADD CONSTRAINT `wander_group_trips_listingId_fkey`
    FOREIGN KEY (`listingId`) REFERENCES `wander_listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: wander_group_trip_members -> wander_group_trips
ALTER TABLE `wander_group_trip_members` ADD CONSTRAINT `wander_group_trip_members_groupTripId_fkey`
    FOREIGN KEY (`groupTripId`) REFERENCES `wander_group_trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_group_trip_members -> wander_friend_group_members
ALTER TABLE `wander_group_trip_members` ADD CONSTRAINT `wander_group_trip_members_groupMemberId_fkey`
    FOREIGN KEY (`groupMemberId`) REFERENCES `wander_friend_group_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_group_messages -> wander_friend_groups
ALTER TABLE `wander_group_messages` ADD CONSTRAINT `wander_group_messages_groupId_fkey`
    FOREIGN KEY (`groupId`) REFERENCES `wander_friend_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_group_messages -> wander_friend_group_members
ALTER TABLE `wander_group_messages` ADD CONSTRAINT `wander_group_messages_memberId_fkey`
    FOREIGN KEY (`memberId`) REFERENCES `wander_friend_group_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_group_message_reactions -> wander_group_messages
ALTER TABLE `wander_group_message_reactions` ADD CONSTRAINT `wander_group_message_reactions_messageId_fkey`
    FOREIGN KEY (`messageId`) REFERENCES `wander_group_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_group_message_reactions -> wander_friend_group_members
ALTER TABLE `wander_group_message_reactions` ADD CONSTRAINT `wander_group_message_reactions_memberId_fkey`
    FOREIGN KEY (`memberId`) REFERENCES `wander_friend_group_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_trip_date_options -> wander_group_trips
ALTER TABLE `wander_trip_date_options` ADD CONSTRAINT `wander_trip_date_options_tripId_fkey`
    FOREIGN KEY (`tripId`) REFERENCES `wander_group_trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_trip_date_options -> wander_friend_group_members
ALTER TABLE `wander_trip_date_options` ADD CONSTRAINT `wander_trip_date_options_addedById_fkey`
    FOREIGN KEY (`addedById`) REFERENCES `wander_friend_group_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_trip_date_votes -> wander_trip_date_options
ALTER TABLE `wander_trip_date_votes` ADD CONSTRAINT `wander_trip_date_votes_optionId_fkey`
    FOREIGN KEY (`optionId`) REFERENCES `wander_trip_date_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: wander_trip_date_votes -> wander_friend_group_members
ALTER TABLE `wander_trip_date_votes` ADD CONSTRAINT `wander_trip_date_votes_memberId_fkey`
    FOREIGN KEY (`memberId`) REFERENCES `wander_friend_group_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
