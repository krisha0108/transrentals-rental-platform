-- CreateTable: customer_wallets (idempotent)
CREATE TABLE IF NOT EXISTS `customer_wallets` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `balance` DOUBLE NOT NULL DEFAULT 0,
    `totalEarned` DOUBLE NOT NULL DEFAULT 0,
    `totalRedeemed` DOUBLE NOT NULL DEFAULT 0,
    `solanaWallet` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customer_wallets_customerId_key`(`customerId`),
    INDEX `customer_wallets_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: backr_transactions (idempotent)
CREATE TABLE IF NOT EXISTS `backr_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `balance` DOUBLE NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `bookingNumber` VARCHAR(191) NULL,
    `serviceType` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `backr_transactions_customerId_idx`(`customerId`),
    INDEX `backr_transactions_bookingId_idx`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey (idempotent via procedure)
DROP PROCEDURE IF EXISTS add_wallet_fk;
CREATE PROCEDURE add_wallet_fk()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_wallets'
        AND CONSTRAINT_NAME = 'customer_wallets_customerId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE `customer_wallets` ADD CONSTRAINT `customer_wallets_customerId_fkey`
            FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END;
CALL add_wallet_fk();
DROP PROCEDURE add_wallet_fk;
