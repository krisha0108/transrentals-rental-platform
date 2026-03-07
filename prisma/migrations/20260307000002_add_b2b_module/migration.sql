-- B2B Module Migration (Safe - uses IF NOT EXISTS throughout)
-- This migration adds all B2B-related enums, tables, and columns

-- ============================================================
-- STEP 1: Create B2B Enums (MySQL doesn't have standalone enums,
-- they are defined inline in column definitions)
-- ============================================================

-- ============================================================
-- STEP 2: Add B2B columns to customers table
-- ============================================================
ALTER TABLE `customers`
  ADD COLUMN IF NOT EXISTS `isB2B` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `companyName` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `gstin` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `businessType` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `b2bStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NULL,
  ADD COLUMN IF NOT EXISTS `b2bApprovedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `b2bApprovedById` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `b2bRejectionReason` TEXT NULL;

-- ============================================================
-- STEP 3: Add B2B columns to chauffeur_bookings table
-- ============================================================
ALTER TABLE `chauffeur_bookings`
  ADD COLUMN IF NOT EXISTS `numberOfVehicles` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `numberOfEmployees` INTEGER NULL;

-- ============================================================
-- STEP 4: Create b2b_bookings table
-- ============================================================
CREATE TABLE IF NOT EXISTS `b2b_bookings` (
  `id` VARCHAR(191) NOT NULL,
  `bookingNumber` VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191) NOT NULL,
  `customerName` VARCHAR(191) NOT NULL,
  `customerEmail` VARCHAR(191) NULL,
  `customerPhone` VARCHAR(191) NOT NULL,
  `companyName` VARCHAR(191) NOT NULL,
  `serviceType` VARCHAR(191) NOT NULL,
  `vehiclesRequired` INTEGER NOT NULL,
  `passengerCount` INTEGER NULL,
  `vehicleCategory` VARCHAR(191) NULL,
  `pickupLocation` VARCHAR(191) NOT NULL,
  `dropLocation` VARCHAR(191) NULL,
  `tripType` VARCHAR(191) NOT NULL,
  `scheduledDate` DATETIME(3) NOT NULL,
  `scheduledTime` VARCHAR(191) NOT NULL,
  `returnDate` DATETIME(3) NULL,
  `returnTime` VARCHAR(191) NULL,
  `specialNotes` TEXT NULL,
  `status` ENUM('OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'OPEN_FOR_QUOTES',
  `totalVehiclesFilled` INTEGER NOT NULL DEFAULT 0,
  `vendorCostTotal` DOUBLE NULL,
  `companyMargin` DOUBLE NULL,
  `gstAmount` DOUBLE NULL,
  `finalAmount` DOUBLE NULL,
  `acceptedSuperQuoteId` VARCHAR(191) NULL,
  `cancelledAt` DATETIME(3) NULL,
  `cancelledBy` VARCHAR(191) NULL,
  `cancellationReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `b2b_bookings_bookingNumber_key`(`bookingNumber`),
  INDEX `b2b_bookings_customerId_idx`(`customerId`),
  INDEX `b2b_bookings_status_idx`(`status`),
  INDEX `b2b_bookings_scheduledDate_idx`(`scheduledDate`),
  INDEX `b2b_bookings_createdAt_idx`(`createdAt`),
  CONSTRAINT `b2b_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- STEP 5: Create b2b_vendor_quotes table
-- ============================================================
CREATE TABLE IF NOT EXISTS `b2b_vendor_quotes` (
  `id` VARCHAR(191) NOT NULL,
  `quoteNumber` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `vendorId` VARCHAR(191) NOT NULL,
  `vehicleCount` INTEGER NOT NULL,
  `pricePerVehicle` DOUBLE NULL,
  `totalPrice` DOUBLE NOT NULL,
  `notes` TEXT NULL,
  `status` ENUM('SUBMITTED', 'REVISION_REQUESTED', 'REVISED', 'CONFIRMED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
  `revisionNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `b2b_vendor_quotes_quoteNumber_key`(`quoteNumber`),
  INDEX `b2b_vendor_quotes_bookingId_idx`(`bookingId`),
  INDEX `b2b_vendor_quotes_vendorId_idx`(`vendorId`),
  INDEX `b2b_vendor_quotes_status_idx`(`status`),
  CONSTRAINT `b2b_vendor_quotes_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `b2b_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_vendor_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- STEP 6: Create b2b_vendor_quote_vehicles table
-- ============================================================
CREATE TABLE IF NOT EXISTS `b2b_vendor_quote_vehicles` (
  `id` VARCHAR(191) NOT NULL,
  `quoteId` VARCHAR(191) NOT NULL,
  `vendorFleetId` VARCHAR(191) NOT NULL,
  `driverStaffId` VARCHAR(191) NULL,
  `vehicleName` VARCHAR(191) NULL,
  `vehicleNumber` VARCHAR(191) NULL,
  `driverName` VARCHAR(191) NULL,
  `driverPhone` VARCHAR(191) NULL,
  `basePrice` DOUBLE NULL,
  `perKmRate` DOUBLE NULL,
  `perHourRate` DOUBLE NULL,
  `perDayRate` DOUBLE NULL,
  `driverAllowance` DOUBLE NULL,
  `nightCharges` DOUBLE NULL,
  `extraKmCharge` DOUBLE NULL,
  `extraHourCharge` DOUBLE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `b2b_vendor_quote_vehicles_quoteId_idx`(`quoteId`),
  INDEX `b2b_vendor_quote_vehicles_vendorFleetId_idx`(`vendorFleetId`),
  CONSTRAINT `b2b_vendor_quote_vehicles_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `b2b_vendor_quotes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_vendor_quote_vehicles_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_vendor_quote_vehicles_driverStaffId_fkey` FOREIGN KEY (`driverStaffId`) REFERENCES `vendor_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- STEP 7: Create b2b_super_quotes table
-- ============================================================
CREATE TABLE IF NOT EXISTS `b2b_super_quotes` (
  `id` VARCHAR(191) NOT NULL,
  `quoteNumber` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `vendorCostTotal` DOUBLE NOT NULL,
  `companyMargin` DOUBLE NOT NULL,
  `gstPercent` DOUBLE NOT NULL DEFAULT 18,
  `gstAmount` DOUBLE NOT NULL,
  `finalAmount` DOUBLE NOT NULL,
  `notes` TEXT NULL,
  `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
  `sentAt` DATETIME(3) NULL,
  `acceptedAt` DATETIME(3) NULL,
  `rejectedAt` DATETIME(3) NULL,
  `rejectionReason` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `b2b_super_quotes_quoteNumber_key`(`quoteNumber`),
  INDEX `b2b_super_quotes_bookingId_idx`(`bookingId`),
  INDEX `b2b_super_quotes_status_idx`(`status`),
  CONSTRAINT `b2b_super_quotes_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `b2b_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_super_quotes_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- STEP 8: Create b2b_super_quote_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS `b2b_super_quote_items` (
  `id` VARCHAR(191) NOT NULL,
  `superQuoteId` VARCHAR(191) NOT NULL,
  `vendorQuoteId` VARCHAR(191) NOT NULL,
  `vehicleCount` INTEGER NOT NULL,
  `vendorPrice` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `b2b_super_quote_items_superQuoteId_idx`(`superQuoteId`),
  INDEX `b2b_super_quote_items_vendorQuoteId_idx`(`vendorQuoteId`),
  CONSTRAINT `b2b_super_quote_items_superQuoteId_fkey` FOREIGN KEY (`superQuoteId`) REFERENCES `b2b_super_quotes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_super_quote_items_vendorQuoteId_fkey` FOREIGN KEY (`vendorQuoteId`) REFERENCES `b2b_vendor_quotes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- STEP 9: Create b2b_trips table
-- ============================================================
CREATE TABLE IF NOT EXISTS `b2b_trips` (
  `id` VARCHAR(191) NOT NULL,
  `tripCode` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `vendorId` VARCHAR(191) NOT NULL,
  `vendorFleetId` VARCHAR(191) NOT NULL,
  `driverStaffId` VARCHAR(191) NULL,
  `vehicleName` VARCHAR(191) NULL,
  `vehicleNumber` VARCHAR(191) NULL,
  `driverName` VARCHAR(191) NULL,
  `driverPhone` VARCHAR(191) NULL,
  `pickupLocation` VARCHAR(191) NOT NULL,
  `dropLocation` VARCHAR(191) NULL,
  `scheduledDate` DATETIME(3) NOT NULL,
  `scheduledTime` VARCHAR(191) NOT NULL,
  `otp` VARCHAR(191) NULL,
  `otpGeneratedAt` DATETIME(3) NULL,
  `status` ENUM('PENDING', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED', 'VENDOR_CANCELLED') NOT NULL DEFAULT 'PENDING',
  `driverArrivedAt` DATETIME(3) NULL,
  `startedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `cancelledAt` DATETIME(3) NULL,
  `cancelledBy` VARCHAR(191) NULL,
  `cancellationReason` TEXT NULL,
  `passengerNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `b2b_trips_tripCode_key`(`tripCode`),
  INDEX `b2b_trips_bookingId_idx`(`bookingId`),
  INDEX `b2b_trips_vendorId_idx`(`vendorId`),
  INDEX `b2b_trips_tripCode_idx`(`tripCode`),
  INDEX `b2b_trips_status_idx`(`status`),
  INDEX `b2b_trips_scheduledDate_idx`(`scheduledDate`),
  CONSTRAINT `b2b_trips_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `b2b_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_trips_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_trips_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_trips_driverStaffId_fkey` FOREIGN KEY (`driverStaffId`) REFERENCES `vendor_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- STEP 10: Create b2b_invoices table
-- ============================================================
CREATE TABLE IF NOT EXISTS `b2b_invoices` (
  `id` VARCHAR(191) NOT NULL,
  `invoiceNumber` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `companyName` VARCHAR(191) NOT NULL,
  `customerEmail` VARCHAR(191) NULL,
  `customerPhone` VARCHAR(191) NULL,
  `totalVehicles` INTEGER NOT NULL,
  `tripsCompleted` INTEGER NOT NULL,
  `vendorCostTotal` DOUBLE NOT NULL,
  `companyMargin` DOUBLE NOT NULL,
  `subtotal` DOUBLE NOT NULL,
  `gstPercent` DOUBLE NOT NULL DEFAULT 18,
  `gstAmount` DOUBLE NOT NULL,
  `totalAmount` DOUBLE NOT NULL,
  `dueDate` DATETIME(3) NOT NULL,
  `paidAt` DATETIME(3) NULL,
  `paidAmount` DOUBLE NULL,
  `paymentMethod` VARCHAR(191) NULL,
  `transactionRef` VARCHAR(191) NULL,
  `pdfUrl` TEXT NULL,
  `status` ENUM('GENERATED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'GENERATED',
  `generatedById` VARCHAR(191) NOT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `b2b_invoices_invoiceNumber_key`(`invoiceNumber`),
  INDEX `b2b_invoices_bookingId_idx`(`bookingId`),
  INDEX `b2b_invoices_status_idx`(`status`),
  INDEX `b2b_invoices_dueDate_idx`(`dueDate`),
  CONSTRAINT `b2b_invoices_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `b2b_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `b2b_invoices_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
