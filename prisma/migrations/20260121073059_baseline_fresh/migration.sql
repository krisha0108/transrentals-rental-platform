-- CreateTable
CREATE TABLE `active_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `currentPage` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastActivity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pageCount` INTEGER NOT NULL DEFAULT 1,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `hasInteracted` BOOLEAN NOT NULL DEFAULT false,
    `hasChatted` BOOLEAN NOT NULL DEFAULT false,
    `hasSubmittedForm` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `active_sessions_sessionId_key`(`sessionId`),
    INDEX `active_sessions_lastActivity_idx`(`lastActivity`),
    INDEX `active_sessions_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN', 'MANAGER', 'EDITOR') NOT NULL DEFAULT 'ADMIN',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,

    UNIQUE INDEX `admin_users_email_key`(`email`),
    INDEX `admin_users_createdById_fkey`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_summary` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `totalPageViews` INTEGER NOT NULL DEFAULT 0,
    `uniqueVisitors` INTEGER NOT NULL DEFAULT 0,
    `newVisitors` INTEGER NOT NULL DEFAULT 0,
    `returningVisitors` INTEGER NOT NULL DEFAULT 0,
    `avgSessionDuration` INTEGER NOT NULL DEFAULT 0,
    `avgPagesPerSession` DOUBLE NOT NULL DEFAULT 0,
    `bounceRate` DOUBLE NOT NULL DEFAULT 0,
    `totalFormViews` INTEGER NOT NULL DEFAULT 0,
    `totalFormStarts` INTEGER NOT NULL DEFAULT 0,
    `totalFormSubmissions` INTEGER NOT NULL DEFAULT 0,
    `formConversionRate` DOUBLE NOT NULL DEFAULT 0,
    `totalChatSessions` INTEGER NOT NULL DEFAULT 0,
    `totalChatMessages` INTEGER NOT NULL DEFAULT 0,
    `chatBookings` INTEGER NOT NULL DEFAULT 0,
    `chatConversionRate` DOUBLE NOT NULL DEFAULT 0,
    `totalClicks` INTEGER NOT NULL DEFAULT 0,
    `ctaClicks` INTEGER NOT NULL DEFAULT 0,
    `phoneClicks` INTEGER NOT NULL DEFAULT 0,
    `avgLcp` DOUBLE NULL,
    `avgFid` DOUBLE NULL,
    `avgCls` DOUBLE NULL,
    `pagesWithIssues` INTEGER NOT NULL DEFAULT 0,
    `topPages` LONGTEXT NULL,
    `topReferrers` LONGTEXT NULL,
    `topFormPages` LONGTEXT NULL,
    `topChatPages` LONGTEXT NULL,
    `mobileVisitors` INTEGER NOT NULL DEFAULT 0,
    `desktopVisitors` INTEGER NOT NULL DEFAULT 0,
    `tabletVisitors` INTEGER NOT NULL DEFAULT 0,
    `directTraffic` INTEGER NOT NULL DEFAULT 0,
    `organicTraffic` INTEGER NOT NULL DEFAULT 0,
    `referralTraffic` INTEGER NOT NULL DEFAULT 0,
    `socialTraffic` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `analytics_summary_date_key`(`date`),
    INDEX `analytics_summary_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backlinks` (
    `id` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `sourceDomain` VARCHAR(191) NOT NULL,
    `targetUrl` VARCHAR(191) NOT NULL,
    `anchorText` VARCHAR(191) NULL,
    `isDoFollow` BOOLEAN NOT NULL DEFAULT true,
    `isNoFollow` BOOLEAN NOT NULL DEFAULT false,
    `domainAuthority` INTEGER NULL,
    `pageAuthority` INTEGER NULL,
    `spamScore` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastChecked` DATETIME(3) NULL,
    `firstSeen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `backlinks_domainAuthority_idx`(`domainAuthority`),
    INDEX `backlinks_sourceDomain_idx`(`sourceDomain`),
    INDEX `backlinks_targetUrl_idx`(`targetUrl`),
    UNIQUE INDEX `backlinks_sourceUrl_targetUrl_key`(`sourceUrl`, `targetUrl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_details` (
    `id` VARCHAR(191) NOT NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `ifscCode` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `branchName` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NOT NULL DEFAULT 'SAVINGS',
    `upiId` VARCHAR(191) NULL,
    `upiQrCode` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `serviceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bank_details_isActive_idx`(`isActive`),
    INDEX `bank_details_isPrimary_idx`(`isPrimary`),
    INDEX `bank_details_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bike_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `requestedVehicleId` VARCHAR(191) NULL,
    `requestedVehicleName` VARCHAR(191) NOT NULL,
    `requestedBrand` VARCHAR(191) NULL,
    `requestedCategory` VARCHAR(191) NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `dropDate` DATETIME(3) NOT NULL,
    `dropTime` VARCHAR(191) NOT NULL,
    `totalDays` INTEGER NOT NULL,
    `assignedVendorId` VARCHAR(191) NULL,
    `acceptedVendorId` VARCHAR(191) NULL,
    `acceptedVehicleId` VARCHAR(191) NULL,
    `acceptedVehicleName` VARCHAR(191) NULL,
    `rejectedByVendors` LONGTEXT NULL,
    `responseDeadline` DATETIME(3) NULL,
    `broadcastedAt` DATETIME(3) NULL,
    `acceptedAt` DATETIME(3) NULL,
    `pickedUpAt` DATETIME(3) NULL,
    `returnedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `dailyRate` DOUBLE NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `gstAmount` DOUBLE NOT NULL,
    `securityDeposit` DOUBLE NOT NULL,
    `grandTotal` DOUBLE NOT NULL,
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NULL,
    `helmetsRequired` INTEGER NOT NULL DEFAULT 1,
    `addons` LONGTEXT NULL,
    `customerNotes` TEXT NULL,
    `vendorNotes` TEXT NULL,
    `adminNotes` TEXT NULL,
    `cancellationReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastPaymentError` TEXT NULL,
    `notifiedVendorIds` LONGTEXT NULL,
    `paymentAttempts` INTEGER NOT NULL DEFAULT 0,
    `razorpayOrderId` VARCHAR(191) NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `razorpaySignature` VARCHAR(191) NULL,
    `requestedModelId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `actualReturnDate` DATETIME(3) NULL,
    `advanceAmount` DOUBLE NULL,
    `advancePaymentDate` DATETIME(3) NULL,
    `advancePaymentProof` VARCHAR(191) NULL,
    `advancePaymentRef` VARCHAR(191) NULL,
    `advancePaymentVerified` BOOLEAN NOT NULL DEFAULT false,
    `advanceVerifiedAt` DATETIME(3) NULL,
    `advanceVerifiedBy` VARCHAR(191) NULL,
    `damageCharges` DOUBLE NULL,
    `finalPaymentAmount` DOUBLE NULL,
    `finalPaymentAt` DATETIME(3) NULL,
    `finalPaymentMethod` VARCHAR(191) NULL,
    `finalPaymentRef` VARCHAR(191) NULL,
    `finalPaymentVerified` BOOLEAN NOT NULL DEFAULT false,
    `lateFeeAmount` DOUBLE NULL,
    `refundAmount` DOUBLE NULL,
    `tripEndOtp` VARCHAR(191) NULL,
    `tripEndVerifiedAt` DATETIME(3) NULL,
    `tripOtpVerified` BOOLEAN NOT NULL DEFAULT false,
    `tripOtpVerifiedAt` DATETIME(3) NULL,
    `tripStartOtp` VARCHAR(191) NULL,
    `tripStartOtpExpiry` DATETIME(3) NULL,
    `tripStartOtpSentAt` DATETIME(3) NULL,
    `advancePercentage` DOUBLE NULL,
    `platformFee` DOUBLE NOT NULL DEFAULT 0,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `quoteRequestId` VARCHAR(191) NULL,

    UNIQUE INDEX `bike_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `bike_bookings_acceptedQuoteId_key`(`acceptedQuoteId`),
    UNIQUE INDEX `bike_bookings_quoteRequestId_key`(`quoteRequestId`),
    INDEX `bike_bookings_acceptedVendorId_idx`(`acceptedVendorId`),
    INDEX `bike_bookings_assignedVendorId_idx`(`assignedVendorId`),
    INDEX `bike_bookings_bookingNumber_idx`(`bookingNumber`),
    INDEX `bike_bookings_createdAt_idx`(`createdAt`),
    INDEX `bike_bookings_customerEmail_idx`(`customerEmail`),
    INDEX `bike_bookings_customerId_idx`(`customerId`),
    INDEX `bike_bookings_customerPhone_idx`(`customerPhone`),
    INDEX `bike_bookings_locationId_idx`(`locationId`),
    INDEX `bike_bookings_pickupDate_idx`(`pickupDate`),
    INDEX `bike_bookings_requestedModelId_idx`(`requestedModelId`),
    INDEX `bike_bookings_status_idx`(`status`),
    INDEX `bike_bookings_version_idx`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bike_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `acceptedQuoteId` VARCHAR(191) NULL,
    `budgetMax` DOUBLE NULL,
    `budgetMin` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerNotes` TEXT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `dropDate` DATETIME(3) NOT NULL,
    `dropTime` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `helmetsRequired` INTEGER NOT NULL DEFAULT 1,
    `locationId` VARCHAR(191) NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `quotesOpenTill` DATETIME(3) NULL,
    `quotesViewed` INTEGER NOT NULL DEFAULT 0,
    `requestNumber` VARCHAR(191) NOT NULL,
    `totalDays` INTEGER NOT NULL,
    `totalQuotesReceived` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    `vehicleBrand` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NULL,
    `vehicleCategoryName` VARCHAR(191) NULL,
    `vehicleModelId` VARCHAR(191) NULL,
    `vehicleModelName` VARCHAR(191) NULL,

    UNIQUE INDEX `bike_quote_requests_requestNumber_key`(`requestNumber`),
    INDEX `bike_quote_requests_acceptedQuoteId_fkey`(`acceptedQuoteId`),
    INDEX `bike_quote_requests_createdAt_idx`(`createdAt`),
    INDEX `bike_quote_requests_customerId_idx`(`customerId`),
    INDEX `bike_quote_requests_locationId_idx`(`locationId`),
    INDEX `bike_quote_requests_pickupDate_idx`(`pickupDate`),
    INDEX `bike_quote_requests_status_idx`(`status`),
    INDEX `bike_quote_requests_vehicleModelId_idx`(`vehicleModelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bike_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `inclusions` LONGTEXT NULL,
    `exclusions` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `advanceAmount` DOUBLE NOT NULL,
    `advancePercent` INTEGER NOT NULL DEFAULT 30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dailyRate` DOUBLE NOT NULL,
    `extraKmCharge` DOUBLE NULL,
    `grandTotal` DOUBLE NOT NULL,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `helmetsIncluded` INTEGER NOT NULL DEFAULT 1,
    `kmLimitPerDay` INTEGER NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `respondedAt` DATETIME(3) NULL,
    `securityDeposit` DOUBLE NOT NULL,
    `sentAt` DATETIME(3) NULL,
    `termsConditions` LONGTEXT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `validTill` DATETIME(3) NOT NULL,
    `validityDays` INTEGER NOT NULL DEFAULT 3,
    `vehicleBrand` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NULL,
    `vehicleFeatures` LONGTEXT NULL,
    `vehicleImages` LONGTEXT NULL,
    `vehicleModelId` VARCHAR(191) NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `vehicleYear` INTEGER NULL,
    `vendorFleetId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vendorMessage` TEXT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `viewedAt` DATETIME(3) NULL,
    `templateId` VARCHAR(191) NULL,

    UNIQUE INDEX `bike_quotes_quoteNumber_key`(`quoteNumber`),
    INDEX `bike_quotes_createdAt_idx`(`createdAt`),
    INDEX `bike_quotes_requestId_idx`(`requestId`),
    INDEX `bike_quotes_status_idx`(`status`),
    INDEX `bike_quotes_templateId_idx`(`templateId`),
    INDEX `bike_quotes_vehicleModelId_fkey`(`vehicleModelId`),
    INDEX `bike_quotes_vendorFleetId_idx`(`vendorFleetId`),
    INDEX `bike_quotes_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_posts` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `excerpt` TEXT NULL,
    `featuredImage` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `readTime` INTEGER NULL,
    `categoryId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `tags` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_posts_slug_key`(`slug`),
    INDEX `blog_posts_authorId_fkey`(`authorId`),
    INDEX `blog_posts_categoryId_fkey`(`categoryId`),
    INDEX `blog_posts_publishedAt_idx`(`publishedAt`),
    INDEX `blog_posts_slug_idx`(`slug`),
    INDEX `blog_posts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `country` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `vehicleCategoryId` VARCHAR(191) NULL,

    INDEX `brands_name_idx`(`name`),
    INDEX `brands_serviceId_idx`(`serviceId`),
    INDEX `brands_vehicleCategoryId_idx`(`vehicleCategoryId`),
    UNIQUE INDEX `brands_serviceId_slug_key`(`serviceId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `quoteRequestId` VARCHAR(191) NOT NULL,
    `acceptedQuoteId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `tripType` VARCHAR(191) NOT NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `passengers` INTEGER NOT NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NULL,
    `dropCity` VARCHAR(191) NULL,
    `dropAddress` TEXT NULL,
    `routeDetails` TEXT NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `returnDate` DATETIME(3) NULL,
    `returnTime` VARCHAR(191) NULL,
    `tripDays` INTEGER NOT NULL DEFAULT 1,
    `assignedVehicleId` VARCHAR(191) NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleModel` VARCHAR(191) NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `driverPhoto` VARCHAR(191) NULL,
    `baseAmount` DOUBLE NOT NULL,
    `additionalCharges` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `advanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `advancePaid` DOUBLE NOT NULL DEFAULT 0,
    `advancePaidAt` DATETIME(3) NULL,
    `balanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `balancePaid` DOUBLE NOT NULL DEFAULT 0,
    `balancePaidAt` DATETIME(3) NULL,
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` VARCHAR(191) NULL,
    `transactionIds` LONGTEXT NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `tripStartOtp` VARCHAR(191) NULL,
    `tripEndOtp` VARCHAR(191) NULL,
    `tripStartedAt` DATETIME(3) NULL,
    `tripEndedAt` DATETIME(3) NULL,
    `actualKmTravelled` INTEGER NULL,
    `actualDays` INTEGER NULL,
    `extraKmCharges` DOUBLE NOT NULL DEFAULT 0,
    `extraDayCharges` DOUBLE NOT NULL DEFAULT 0,
    `tollCharges` DOUBLE NOT NULL DEFAULT 0,
    `parkingCharges` DOUBLE NOT NULL DEFAULT 0,
    `otherCharges` DOUBLE NOT NULL DEFAULT 0,
    `finalAmount` DOUBLE NULL,
    `customerNotes` TEXT NULL,
    `vendorNotes` TEXT NULL,
    `adminNotes` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `cancellationReason` TEXT NULL,
    `refundAmount` DOUBLE NULL,
    `rating` INTEGER NULL,
    `review` TEXT NULL,
    `driverRating` INTEGER NULL,
    `vehicleRating` INTEGER NULL,
    `confirmedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `advancePaymentDate` DATETIME(3) NULL,
    `advancePaymentProof` VARCHAR(191) NULL,
    `advancePaymentRef` VARCHAR(191) NULL,
    `advancePaymentVerified` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `bus_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `bus_bookings_quoteRequestId_key`(`quoteRequestId`),
    UNIQUE INDEX `bus_bookings_acceptedQuoteId_key`(`acceptedQuoteId`),
    INDEX `bus_bookings_createdAt_idx`(`createdAt`),
    INDEX `bus_bookings_customerId_idx`(`customerId`),
    INDEX `bus_bookings_pickupDate_idx`(`pickupDate`),
    INDEX `bus_bookings_status_idx`(`status`),
    INDEX `bus_bookings_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `tripType` VARCHAR(191) NOT NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleCategoryName` VARCHAR(191) NOT NULL,
    `passengers` INTEGER NOT NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NULL,
    `dropCity` VARCHAR(191) NULL,
    `dropAddress` TEXT NULL,
    `routeDetails` TEXT NULL,
    `stops` LONGTEXT NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `returnDate` DATETIME(3) NULL,
    `returnTime` VARCHAR(191) NULL,
    `tripDays` INTEGER NOT NULL DEFAULT 1,
    `requirements` TEXT NULL,
    `needAC` BOOLEAN NOT NULL DEFAULT true,
    `needLuxury` BOOLEAN NOT NULL DEFAULT false,
    `needSleeper` BOOLEAN NOT NULL DEFAULT false,
    `budgetMin` DOUBLE NULL,
    `budgetMax` DOUBLE NULL,
    `locationId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `quotesOpenTill` DATETIME(3) NULL,
    `totalQuotesReceived` INTEGER NOT NULL DEFAULT 0,
    `quotesViewed` INTEGER NOT NULL DEFAULT 0,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bus_quote_requests_requestNumber_key`(`requestNumber`),
    INDEX `bus_quote_requests_acceptedQuoteId_fkey`(`acceptedQuoteId`),
    INDEX `bus_quote_requests_createdAt_idx`(`createdAt`),
    INDEX `bus_quote_requests_customerId_idx`(`customerId`),
    INDEX `bus_quote_requests_locationId_idx`(`locationId`),
    INDEX `bus_quote_requests_pickupDate_idx`(`pickupDate`),
    INDEX `bus_quote_requests_status_idx`(`status`),
    INDEX `bus_quote_requests_tripType_idx`(`tripType`),
    INDEX `bus_quote_requests_vehicleCategory_idx`(`vehicleCategory`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bus_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `fleetId` VARCHAR(191) NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleModel` VARCHAR(191) NULL,
    `vehicleYear` INTEGER NULL,
    `seats` INTEGER NOT NULL,
    `vehicleFeatures` LONGTEXT NULL,
    `vehicleImages` LONGTEXT NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `driverExperience` INTEGER NULL,
    `baseAmount` DOUBLE NOT NULL,
    `perKmRate` DOUBLE NULL,
    `perDayRate` DOUBLE NULL,
    `includedKm` INTEGER NULL,
    `includedHours` INTEGER NULL,
    `driverAllowance` DOUBLE NOT NULL DEFAULT 0,
    `nightHaltCharges` DOUBLE NOT NULL DEFAULT 0,
    `tollEstimate` DOUBLE NOT NULL DEFAULT 0,
    `permitCharges` DOUBLE NOT NULL DEFAULT 0,
    `parkingEstimate` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `extraKmRate` DOUBLE NULL,
    `extraHourRate` DOUBLE NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `validTill` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `viewedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `vendorMessage` TEXT NULL,
    `customerResponse` TEXT NULL,
    `isNegotiable` BOOLEAN NOT NULL DEFAULT true,
    `negotiatedAmount` DOUBLE NULL,
    `negotiationNotes` LONGTEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `advanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `advancePercent` INTEGER NOT NULL DEFAULT 30,

    UNIQUE INDEX `bus_quotes_quoteNumber_key`(`quoteNumber`),
    INDEX `bus_quotes_createdAt_idx`(`createdAt`),
    INDEX `bus_quotes_requestId_idx`(`requestId`),
    INDEX `bus_quotes_status_idx`(`status`),
    INDEX `bus_quotes_templateId_idx`(`templateId`),
    INDEX `bus_quotes_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `car_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `requestedVehicleId` VARCHAR(191) NULL,
    `requestedVehicleName` VARCHAR(191) NOT NULL,
    `requestedBrand` VARCHAR(191) NULL,
    `requestedCategory` VARCHAR(191) NULL,
    `requestedVehicleType` VARCHAR(191) NULL,
    `requestedTransmission` VARCHAR(191) NULL,
    `requestedFuelType` VARCHAR(191) NULL,
    `requestedSeats` INTEGER NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `dropDate` DATETIME(3) NOT NULL,
    `dropTime` VARCHAR(191) NOT NULL,
    `totalDays` INTEGER NOT NULL,
    `pickupAddress` TEXT NULL,
    `dropAddress` TEXT NULL,
    `isDeliveryRequested` BOOLEAN NOT NULL DEFAULT false,
    `assignedVendorId` VARCHAR(191) NULL,
    `acceptedVendorId` VARCHAR(191) NULL,
    `assignedVehicleId` VARCHAR(191) NULL,
    `assignedVehicleName` VARCHAR(191) NULL,
    `rejectedByVendors` LONGTEXT NULL,
    `responseDeadline` DATETIME(3) NULL,
    `broadcastedAt` DATETIME(3) NULL,
    `acceptedAt` DATETIME(3) NULL,
    `pickedUpAt` DATETIME(3) NULL,
    `returnedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `dailyRate` DOUBLE NOT NULL,
    `baseAmount` DOUBLE NOT NULL,
    `gstAmount` DOUBLE NOT NULL,
    `platformFee` DOUBLE NOT NULL DEFAULT 99,
    `securityDeposit` DOUBLE NOT NULL,
    `grandTotal` DOUBLE NOT NULL,
    `kmLimitPerDay` INTEGER NOT NULL DEFAULT 200,
    `extraKmRate` DOUBLE NOT NULL DEFAULT 10,
    `odometerStart` INTEGER NULL,
    `odometerEnd` INTEGER NULL,
    `extraKmCharges` DOUBLE NOT NULL DEFAULT 0,
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NULL,
    `refundAmount` DOUBLE NULL,
    `refundTransactionId` VARCHAR(191) NULL,
    `withFuelIncluded` BOOLEAN NOT NULL DEFAULT false,
    `fuelLevel` VARCHAR(191) NULL,
    `returnFuelLevel` VARCHAR(191) NULL,
    `addons` LONGTEXT NULL,
    `licenseNumber` VARCHAR(191) NULL,
    `licenseVerified` BOOLEAN NOT NULL DEFAULT false,
    `customerNotes` TEXT NULL,
    `vendorNotes` TEXT NULL,
    `adminNotes` TEXT NULL,
    `cancellationReason` TEXT NULL,
    `rating` INTEGER NULL,
    `review` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `advanceAmount` DOUBLE NULL,
    `advancePaymentDate` DATETIME(3) NULL,
    `advancePaymentProof` VARCHAR(191) NULL,
    `advancePaymentRef` VARCHAR(191) NULL,
    `advancePaymentVerified` BOOLEAN NOT NULL DEFAULT false,
    `notifiedVendorIds` LONGTEXT NULL,
    `tripOtpVerified` BOOLEAN NOT NULL DEFAULT false,
    `tripOtpVerifiedAt` DATETIME(3) NULL,
    `tripStartOtp` VARCHAR(191) NULL,
    `tripStartOtpExpiry` DATETIME(3) NULL,
    `tripStartOtpSentAt` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `advancePercentage` DOUBLE NULL,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `quoteRequestId` VARCHAR(191) NULL,

    UNIQUE INDEX `car_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `car_bookings_acceptedQuoteId_key`(`acceptedQuoteId`),
    UNIQUE INDEX `car_bookings_quoteRequestId_key`(`quoteRequestId`),
    INDEX `car_bookings_acceptedVendorId_idx`(`acceptedVendorId`),
    INDEX `car_bookings_assignedVendorId_idx`(`assignedVendorId`),
    INDEX `car_bookings_bookingNumber_idx`(`bookingNumber`),
    INDEX `car_bookings_createdAt_idx`(`createdAt`),
    INDEX `car_bookings_customerEmail_idx`(`customerEmail`),
    INDEX `car_bookings_customerId_idx`(`customerId`),
    INDEX `car_bookings_customerPhone_idx`(`customerPhone`),
    INDEX `car_bookings_locationId_idx`(`locationId`),
    INDEX `car_bookings_pickupDate_idx`(`pickupDate`),
    INDEX `car_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `bookingType` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `quoteId` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `customerUnread` INTEGER NOT NULL DEFAULT 0,
    `vendorUnread` INTEGER NOT NULL DEFAULT 0,
    `lastMessageAt` DATETIME(3) NULL,
    `lastMessageText` TEXT NULL,
    `lastSenderType` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chat_conversations_bookingType_idx`(`bookingType`),
    INDEX `chat_conversations_customerId_idx`(`customerId`),
    INDEX `chat_conversations_lastMessageAt_idx`(`lastMessageAt`),
    INDEX `chat_conversations_status_idx`(`status`),
    INDEX `chat_conversations_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `chat_conversations_customerId_vendorId_bookingType_bookingId_key`(`customerId`, `vendorId`, `bookingType`, `bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_interactions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `interactionType` ENUM('CHAT_OPENED', 'CHAT_CLOSED', 'MESSAGE_SENT', 'OPTION_SELECTED', 'BOOKING_STARTED', 'BOOKING_COMPLETED', 'KB_QUERY', 'HELP_REQUESTED') NOT NULL,
    `userMessage` TEXT NULL,
    `botResponse` TEXT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `serviceType` VARCHAR(191) NULL,
    `serviceName` VARCHAR(191) NULL,
    `bookingStep` VARCHAR(191) NULL,
    `kbArticleId` VARCHAR(191) NULL,
    `kbSearchQuery` VARCHAR(191) NULL,
    `kbMatchScore` DOUBLE NULL,
    `outcome` ENUM('IN_PROGRESS', 'BOOKING_SUBMITTED', 'CONTACT_INFO_SHARED', 'ABANDONED', 'RESOLVED', 'ESCALATED') NOT NULL DEFAULT 'IN_PROGRESS',
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `responseTime` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_interactions_createdAt_idx`(`createdAt`),
    INDEX `chat_interactions_interactionType_idx`(`interactionType`),
    INDEX `chat_interactions_outcome_idx`(`outcome`),
    INDEX `chat_interactions_pagePath_idx`(`pagePath`),
    INDEX `chat_interactions_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderType` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `senderName` VARCHAR(191) NULL,
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    `content` TEXT NOT NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `attachmentName` VARCHAR(191) NULL,
    `attachmentSize` INTEGER NULL,
    `attachmentType` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `locationName` VARCHAR(191) NULL,
    `quickReplyId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SENT',
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `metadata` LONGTEXT NULL,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `editedAt` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chat_messages_conversationId_idx`(`conversationId`),
    INDEX `chat_messages_createdAt_idx`(`createdAt`),
    INDEX `chat_messages_senderType_idx`(`senderType`),
    INDEX `chat_messages_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_quick_replies` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chat_quick_replies_category_idx`(`category`),
    INDEX `chat_quick_replies_isActive_idx`(`isActive`),
    INDEX `chat_quick_replies_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chauffeur_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `tripType` ENUM('LOCAL', 'OUTSTATION_ONEWAY', 'OUTSTATION_ROUNDTRIP', 'AIRPORT_PICKUP', 'AIRPORT_DROP') NOT NULL DEFAULT 'LOCAL',
    `localPackageId` VARCHAR(191) NULL,
    `localPackageHours` INTEGER NULL,
    `localPackageKm` INTEGER NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `dropCity` VARCHAR(191) NULL,
    `pickupAddress` TEXT NULL,
    `dropAddress` TEXT NULL,
    `estimatedDistance` INTEGER NULL,
    `airportName` VARCHAR(191) NULL,
    `flightNumber` VARCHAR(191) NULL,
    `terminalNumber` VARCHAR(191) NULL,
    `carCategory` VARCHAR(191) NOT NULL,
    `carCategoryName` VARCHAR(191) NOT NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `returnDate` DATETIME(3) NULL,
    `returnTime` VARCHAR(191) NULL,
    `totalDays` INTEGER NOT NULL DEFAULT 1,
    `totalHours` INTEGER NULL,
    `assignedVendorId` VARCHAR(191) NULL,
    `acceptedVendorId` VARCHAR(191) NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `driverPhoto` VARCHAR(191) NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleModel` VARCHAR(191) NULL,
    `rejectedByVendors` LONGTEXT NULL,
    `responseDeadline` DATETIME(3) NULL,
    `broadcastedAt` DATETIME(3) NULL,
    `acceptedAt` DATETIME(3) NULL,
    `driverAssignedAt` DATETIME(3) NULL,
    `tripStartedAt` DATETIME(3) NULL,
    `tripEndedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `baseFare` DOUBLE NOT NULL,
    `perKmRate` DOUBLE NOT NULL,
    `chargeableKm` INTEGER NULL,
    `kmCharges` DOUBLE NOT NULL DEFAULT 0,
    `driverBatta` DOUBLE NOT NULL DEFAULT 0,
    `nightCharges` DOUBLE NOT NULL DEFAULT 0,
    `waitingCharges` DOUBLE NOT NULL DEFAULT 0,
    `extraHourCharges` DOUBLE NOT NULL DEFAULT 0,
    `extraKmCharges` DOUBLE NOT NULL DEFAULT 0,
    `tollCharges` DOUBLE NOT NULL DEFAULT 0,
    `statePermitCharges` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL,
    `platformFee` DOUBLE NOT NULL DEFAULT 99,
    `grandTotal` DOUBLE NOT NULL,
    `actualKmTravelled` INTEGER NULL,
    `actualHours` INTEGER NULL,
    `actualTollCharges` DOUBLE NULL,
    `actualParkingCharges` DOUBLE NULL,
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NULL,
    `partialPayment` DOUBLE NULL,
    `remainingPayment` DOUBLE NULL,
    `tripStartOtp` VARCHAR(191) NULL,
    `tripEndOtp` VARCHAR(191) NULL,
    `customerNotes` TEXT NULL,
    `vendorNotes` TEXT NULL,
    `adminNotes` TEXT NULL,
    `cancellationReason` TEXT NULL,
    `rating` INTEGER NULL,
    `review` TEXT NULL,
    `driverRating` INTEGER NULL,
    `driverReview` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `refundAmount` DOUBLE NULL,
    `refundTransactionId` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chauffeur_bookings_bookingNumber_key`(`bookingNumber`),
    INDEX `chauffeur_bookings_acceptedVendorId_idx`(`acceptedVendorId`),
    INDEX `chauffeur_bookings_assignedVendorId_idx`(`assignedVendorId`),
    INDEX `chauffeur_bookings_bookingNumber_idx`(`bookingNumber`),
    INDEX `chauffeur_bookings_createdAt_idx`(`createdAt`),
    INDEX `chauffeur_bookings_customerEmail_idx`(`customerEmail`),
    INDEX `chauffeur_bookings_customerId_idx`(`customerId`),
    INDEX `chauffeur_bookings_customerPhone_idx`(`customerPhone`),
    INDEX `chauffeur_bookings_locationId_idx`(`locationId`),
    INDEX `chauffeur_bookings_pickupDate_idx`(`pickupDate`),
    INDEX `chauffeur_bookings_status_idx`(`status`),
    INDEX `chauffeur_bookings_tripType_idx`(`tripType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chauffeur_city_pricing` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleCategoryId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `baseKmRate` DOUBLE NOT NULL,
    `minKmPerDay` INTEGER NOT NULL DEFAULT 250,
    `driverDayAllowance` DOUBLE NOT NULL DEFAULT 300,
    `driverNightAllowance` DOUBLE NOT NULL DEFAULT 250,
    `nightSurcharge` DOUBLE NULL DEFAULT 0,
    `airportSurcharge` DOUBLE NULL DEFAULT 0,
    `outstationMinDays` INTEGER NOT NULL DEFAULT 1,
    `tollsIncluded` BOOLEAN NOT NULL DEFAULT false,
    `statePermitIncluded` BOOLEAN NOT NULL DEFAULT false,
    `parkingIncluded` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chauffeur_city_pricing_locationId_idx`(`locationId`),
    INDEX `chauffeur_city_pricing_vehicleCategoryId_idx`(`vehicleCategoryId`),
    UNIQUE INDEX `chauffeur_city_pricing_vehicleCategoryId_locationId_key`(`vehicleCategoryId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chauffeur_local_packages` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleCategoryId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `hours` INTEGER NOT NULL,
    `kms` INTEGER NOT NULL,
    `basePrice` DOUBLE NOT NULL,
    `extraKmCharge` DOUBLE NOT NULL,
    `extraHourCharge` DOUBLE NOT NULL,
    `nightChargesApply` BOOLEAN NOT NULL DEFAULT true,
    `nightChargeAmount` DOUBLE NULL DEFAULT 150,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chauffeur_local_packages_locationId_idx`(`locationId`),
    INDEX `chauffeur_local_packages_vehicleCategoryId_idx`(`vehicleCategoryId`),
    UNIQUE INDEX `chauffeur_local_packages_vehicleCategoryId_locationId_hours__key`(`vehicleCategoryId`, `locationId`, `hours`, `kms`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chauffeur_route_packages` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleCategoryId` VARCHAR(191) NOT NULL,
    `fromLocationId` VARCHAR(191) NOT NULL,
    `toLocationId` VARCHAR(191) NOT NULL,
    `estimatedKm` INTEGER NOT NULL,
    `estimatedDuration` VARCHAR(191) NULL,
    `routeDescription` VARCHAR(191) NULL,
    `basePrice` DOUBLE NOT NULL,
    `returnMultiplier` DOUBLE NOT NULL DEFAULT 1.8,
    `tollsEstimate` DOUBLE NULL,
    `statePermitCharge` DOUBLE NULL,
    `nightSurcharge` DOUBLE NULL DEFAULT 0,
    `airportSurcharge` DOUBLE NULL DEFAULT 0,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `chauffeur_route_packages_fromLocationId_idx`(`fromLocationId`),
    INDEX `chauffeur_route_packages_toLocationId_idx`(`toLocationId`),
    INDEX `chauffeur_route_packages_vehicleCategoryId_idx`(`vehicleCategoryId`),
    UNIQUE INDEX `chauffeur_route_packages_vehicleCategoryId_fromLocationId_to_key`(`vehicleCategoryId`, `fromLocationId`, `toLocationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chauffeur_vehicle_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `seatingCapacity` INTEGER NOT NULL DEFAULT 4,
    `luggageCapacity` VARCHAR(191) NULL,
    `acType` VARCHAR(191) NULL,
    `fuelType` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `exampleVehicles` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `bodyType` VARCHAR(191) NULL,
    `heightFt` DOUBLE NULL,
    `lengthFt` DOUBLE NULL,
    `loadCapacity` DOUBLE NULL,
    `wheels` VARCHAR(191) NULL,
    `widthFt` DOUBLE NULL,
    `dailyRate` DOUBLE NULL,
    `equipmentFuelType` VARCHAR(191) NULL,
    `monthlyRate` DOUBLE NULL,
    `operatorIncluded` BOOLEAN NULL DEFAULT false,
    `powerCapacity` VARCHAR(191) NULL,
    `securityDeposit` DOUBLE NULL,
    `specifications` TEXT NULL,
    `weeklyRate` DOUBLE NULL,
    `busType` VARCHAR(191) NULL,
    `amenities` TEXT NULL,
    `hasPushbackSeats` BOOLEAN NULL DEFAULT false,
    `hasTV` BOOLEAN NULL DEFAULT false,
    `hasCharging` BOOLEAN NULL DEFAULT false,
    `hasWifi` BOOLEAN NULL DEFAULT false,
    `engineCC` VARCHAR(191) NULL,
    `bikeType` VARCHAR(191) NULL,
    `mileage` VARCHAR(191) NULL,
    `topSpeed` VARCHAR(191) NULL,

    INDEX `chauffeur_vehicle_categories_serviceId_idx`(`serviceId`),
    UNIQUE INDEX `chauffeur_vehicle_categories_serviceId_name_key`(`serviceId`, `name`),
    UNIQUE INDEX `chauffeur_vehicle_categories_serviceId_slug_key`(`serviceId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `city_distance_matrix` (
    `id` VARCHAR(191) NOT NULL,
    `fromLocationId` VARCHAR(191) NOT NULL,
    `toLocationId` VARCHAR(191) NOT NULL,
    `distanceKm` INTEGER NOT NULL,
    `durationMinutes` INTEGER NULL,
    `durationText` VARCHAR(191) NULL,
    `routeVia` VARCHAR(191) NULL,
    `tollEstimate` DOUBLE NULL,
    `statePermit` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `source` VARCHAR(191) NULL,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `city_distance_matrix_fromLocationId_idx`(`fromLocationId`),
    INDEX `city_distance_matrix_toLocationId_idx`(`toLocationId`),
    UNIQUE INDEX `city_distance_matrix_fromLocationId_toLocationId_key`(`fromLocationId`, `toLocationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `click_events` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` ENUM('BUTTON_CLICK', 'LINK_CLICK', 'CTA_CLICK', 'NAV_CLICK', 'FORM_SUBMIT', 'CHAT_OPEN', 'PHONE_CLICK', 'EMAIL_CLICK', 'SOCIAL_CLICK', 'DOWNLOAD_CLICK', 'VIDEO_PLAY', 'IMAGE_CLICK', 'SCROLL_DEPTH', 'OTHER') NOT NULL,
    `elementId` VARCHAR(191) NULL,
    `elementClass` VARCHAR(191) NULL,
    `elementText` VARCHAR(191) NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `sectionId` VARCHAR(191) NULL,
    `targetUrl` VARCHAR(191) NULL,
    `isExternal` BOOLEAN NOT NULL DEFAULT false,
    `sessionId` VARCHAR(191) NULL,
    `positionX` INTEGER NULL,
    `positionY` INTEGER NULL,
    `scrollDepth` INTEGER NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `click_events_createdAt_idx`(`createdAt`),
    INDEX `click_events_eventType_idx`(`eventType`),
    INDEX `click_events_pagePath_idx`(`pagePath`),
    INDEX `click_events_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competitor_tracking` (
    `id` VARCHAR(191) NOT NULL,
    `competitorDomain` VARCHAR(191) NOT NULL,
    `competitorName` VARCHAR(191) NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `position` INTEGER NULL,
    `previousPosition` INTEGER NULL,
    `ourPosition` INTEGER NULL,
    `ourPage` VARCHAR(191) NULL,
    `positionGap` INTEGER NULL,
    `lastChecked` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `competitor_tracking_competitorDomain_idx`(`competitorDomain`),
    INDEX `competitor_tracking_keyword_idx`(`keyword`),
    UNIQUE INDEX `competitor_tracking_competitorDomain_keyword_key`(`competitorDomain`, `keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_inquiries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crawl_data` (
    `id` VARCHAR(191) NOT NULL,
    `crawlDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalPages` INTEGER NOT NULL DEFAULT 0,
    `indexedPages` INTEGER NOT NULL DEFAULT 0,
    `nonIndexedPages` INTEGER NOT NULL DEFAULT 0,
    `errorPages` INTEGER NOT NULL DEFAULT 0,
    `htmlPages` INTEGER NOT NULL DEFAULT 0,
    `pdfPages` INTEGER NOT NULL DEFAULT 0,
    `imagePages` INTEGER NOT NULL DEFAULT 0,
    `status200` INTEGER NOT NULL DEFAULT 0,
    `status301` INTEGER NOT NULL DEFAULT 0,
    `status302` INTEGER NOT NULL DEFAULT 0,
    `status404` INTEGER NOT NULL DEFAULT 0,
    `status500` INTEGER NOT NULL DEFAULT 0,
    `duplicateTitles` INTEGER NOT NULL DEFAULT 0,
    `duplicateDescriptions` INTEGER NOT NULL DEFAULT 0,
    `missingTitles` INTEGER NOT NULL DEFAULT 0,
    `missingDescriptions` INTEGER NOT NULL DEFAULT 0,
    `missingH1` INTEGER NOT NULL DEFAULT 0,
    `brokenLinks` INTEGER NOT NULL DEFAULT 0,
    `slowPages` INTEGER NOT NULL DEFAULT 0,
    `issues` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `crawl_data_crawlDate_idx`(`crawlDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatar` LONGTEXT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `drivingLicenseNumber` VARCHAR(191) NULL,
    `drivingLicenseExpiry` DATETIME(3) NULL,
    `drivingLicenseImage` LONGTEXT NULL,
    `aadharNumber` VARCHAR(191) NULL,
    `aadharImage` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isBanned` BOOLEAN NOT NULL DEFAULT false,
    `banReason` TEXT NULL,
    `totalBookings` INTEGER NOT NULL DEFAULT 0,
    `totalSpent` DOUBLE NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_email_key`(`email`),
    UNIQUE INDEX `customers_phone_key`(`phone`),
    INDEX `customers_email_idx`(`email`),
    INDEX `customers_isActive_idx`(`isActive`),
    INDEX `customers_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `totalViews` INTEGER NOT NULL DEFAULT 0,
    `uniqueVisitors` INTEGER NOT NULL DEFAULT 0,
    `newVisitors` INTEGER NOT NULL DEFAULT 0,
    `avgDuration` INTEGER NOT NULL DEFAULT 0,
    `bounceRate` DOUBLE NOT NULL DEFAULT 0,
    `topPages` LONGTEXT NULL,
    `topReferrers` LONGTEXT NULL,
    `deviceBreakdown` LONGTEXT NULL,
    `countryBreakdown` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_analytics_date_key`(`date`),
    INDEX `daily_analytics_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `quoteRequestId` VARCHAR(191) NOT NULL,
    `acceptedQuoteId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `equipmentCategory` VARCHAR(191) NOT NULL,
    `equipmentType` VARCHAR(191) NOT NULL,
    `equipmentName` VARCHAR(191) NOT NULL,
    `equipmentModel` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `rentalDays` INTEGER NOT NULL,
    `actualReturnDate` DATETIME(3) NULL,
    `deliveryCity` VARCHAR(191) NOT NULL,
    `deliveryAddress` TEXT NOT NULL,
    `deliveredAt` DATETIME(3) NULL,
    `deliveryNotes` VARCHAR(191) NULL,
    `operatorName` VARCHAR(191) NULL,
    `operatorPhone` VARCHAR(191) NULL,
    `baseAmount` DOUBLE NOT NULL,
    `operatorCharges` DOUBLE NOT NULL DEFAULT 0,
    `deliveryCharges` DOUBLE NOT NULL DEFAULT 0,
    `pickupCharges` DOUBLE NOT NULL DEFAULT 0,
    `installationCharges` DOUBLE NOT NULL DEFAULT 0,
    `securityDeposit` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `advanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `advancePaid` DOUBLE NOT NULL DEFAULT 0,
    `advancePaidAt` DATETIME(3) NULL,
    `depositPaid` DOUBLE NOT NULL DEFAULT 0,
    `depositPaidAt` DATETIME(3) NULL,
    `balanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `balancePaid` DOUBLE NOT NULL DEFAULT 0,
    `balancePaidAt` DATETIME(3) NULL,
    `depositRefunded` DOUBLE NOT NULL DEFAULT 0,
    `depositRefundedAt` DATETIME(3) NULL,
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `status` ENUM('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `deliveryOtp` VARCHAR(191) NULL,
    `returnOtp` VARCHAR(191) NULL,
    `scheduledDelivery` DATETIME(3) NULL,
    `deliveredAt2` DATETIME(3) NULL,
    `inUseFrom` DATETIME(3) NULL,
    `scheduledPickup` DATETIME(3) NULL,
    `returnedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `isExtended` BOOLEAN NOT NULL DEFAULT false,
    `extensionDays` INTEGER NULL,
    `extensionCharges` DOUBLE NULL,
    `damageReported` BOOLEAN NOT NULL DEFAULT false,
    `damageDescription` TEXT NULL,
    `damagePhotos` LONGTEXT NULL,
    `damageDeduction` DOUBLE NOT NULL DEFAULT 0,
    `extraUsageCharges` DOUBLE NOT NULL DEFAULT 0,
    `lateReturnCharges` DOUBLE NOT NULL DEFAULT 0,
    `finalAmount` DOUBLE NULL,
    `customerNotes` TEXT NULL,
    `vendorNotes` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `cancellationReason` TEXT NULL,
    `refundAmount` DOUBLE NULL,
    `rating` INTEGER NULL,
    `review` TEXT NULL,
    `equipmentRating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `equipment_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `equipment_bookings_quoteRequestId_key`(`quoteRequestId`),
    UNIQUE INDEX `equipment_bookings_acceptedQuoteId_key`(`acceptedQuoteId`),
    INDEX `equipment_bookings_customerId_idx`(`customerId`),
    INDEX `equipment_bookings_startDate_idx`(`startDate`),
    INDEX `equipment_bookings_status_idx`(`status`),
    INDEX `equipment_bookings_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `equipmentCategory` VARCHAR(191) NOT NULL,
    `equipmentType` VARCHAR(191) NOT NULL,
    `equipmentName` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `rentalDuration` VARCHAR(191) NOT NULL,
    `rentalDays` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `deliveryCity` VARCHAR(191) NOT NULL,
    `deliveryAddress` TEXT NOT NULL,
    `siteType` VARCHAR(191) NULL,
    `needOperator` BOOLEAN NOT NULL DEFAULT false,
    `needDelivery` BOOLEAN NOT NULL DEFAULT true,
    `needInstallation` BOOLEAN NOT NULL DEFAULT false,
    `requirements` TEXT NULL,
    `budgetMin` DOUBLE NULL,
    `budgetMax` DOUBLE NULL,
    `locationId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `quotesOpenTill` DATETIME(3) NULL,
    `totalQuotesReceived` INTEGER NOT NULL DEFAULT 0,
    `quotesViewed` INTEGER NOT NULL DEFAULT 0,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `equipment_quote_requests_requestNumber_key`(`requestNumber`),
    INDEX `equipment_quote_requests_customerId_idx`(`customerId`),
    INDEX `equipment_quote_requests_locationId_idx`(`locationId`),
    INDEX `equipment_quote_requests_startDate_idx`(`startDate`),
    INDEX `equipment_quote_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `equipmentName` VARCHAR(191) NOT NULL,
    `equipmentModel` VARCHAR(191) NULL,
    `equipmentYear` INTEGER NULL,
    `equipmentCondition` VARCHAR(191) NULL,
    `equipmentImages` LONGTEXT NULL,
    `specifications` LONGTEXT NULL,
    `dailyRate` DOUBLE NULL,
    `weeklyRate` DOUBLE NULL,
    `monthlyRate` DOUBLE NULL,
    `baseAmount` DOUBLE NOT NULL DEFAULT 0,
    `operatorCharges` DOUBLE NOT NULL DEFAULT 0,
    `deliveryCharges` DOUBLE NOT NULL DEFAULT 0,
    `pickupCharges` DOUBLE NOT NULL DEFAULT 0,
    `installationCharges` DOUBLE NOT NULL DEFAULT 0,
    `securityDeposit` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `inclusions` LONGTEXT NULL,
    `exclusions` LONGTEXT NULL,
    `termsConditions` LONGTEXT NULL,
    `validTill` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `viewedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `fuelCharges` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `templateId` VARCHAR(191) NULL,

    UNIQUE INDEX `equipment_quotes_quoteNumber_key`(`quoteNumber`),
    INDEX `equipment_quotes_requestId_idx`(`requestId`),
    INDEX `equipment_quotes_status_idx`(`status`),
    INDEX `equipment_quotes_templateId_idx`(`templateId`),
    INDEX `equipment_quotes_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fleet` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NULL,
    `vehicleType` VARCHAR(191) NOT NULL,
    `basePrice` DOUBLE NOT NULL,
    `description` TEXT NULL,
    `shortDesc` VARCHAR(191) NULL,
    `specs` LONGTEXT NULL,
    `features` LONGTEXT NULL,
    `primaryImage` VARCHAR(191) NULL,
    `images` LONGTEXT NULL,
    `availabilityType` ENUM('ALL_INDIA', 'SPECIFIC_LOCATIONS') NOT NULL DEFAULT 'ALL_INDIA',
    `seoKeywords` LONGTEXT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `priority` INTEGER NOT NULL DEFAULT 5,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `bookingCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fleet_slug_key`(`slug`),
    INDEX `fleet_categoryId_idx`(`categoryId`),
    INDEX `fleet_isActive_idx`(`isActive`),
    INDEX `fleet_isFeatured_idx`(`isFeatured`),
    INDEX `fleet_slug_idx`(`slug`),
    INDEX `fleet_typeId_idx`(`typeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fleet_availability` (
    `id` VARCHAR(191) NOT NULL,
    `fleetId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fleet_availability_fleetId_idx`(`fleetId`),
    INDEX `fleet_availability_locationId_idx`(`locationId`),
    UNIQUE INDEX `fleet_availability_fleetId_locationId_key`(`fleetId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fleet_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `specFields` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fleet_categories_name_key`(`name`),
    UNIQUE INDEX `fleet_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fleet_location_rates` (
    `id` VARCHAR(191) NOT NULL,
    `fleetId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `dailyRate` DOUBLE NOT NULL,
    `weeklyRate` DOUBLE NULL,
    `monthlyRate` DOUBLE NULL,
    `kmLimit` INTEGER NOT NULL DEFAULT 100,
    `extraKmRate` DOUBLE NOT NULL DEFAULT 5,
    `securityDeposit` DOUBLE NOT NULL DEFAULT 2000,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fleet_location_rates_fleetId_idx`(`fleetId`),
    INDEX `fleet_location_rates_locationId_idx`(`locationId`),
    UNIQUE INDEX `fleet_location_rates_fleetId_locationId_key`(`fleetId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fleet_locations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `stateCode` VARCHAR(191) NULL,
    `tier` INTEGER NOT NULL DEFAULT 2,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `timezone` VARCHAR(191) NULL DEFAULT 'Asia/Kolkata',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fleet_locations_slug_key`(`slug`),
    INDEX `fleet_locations_slug_idx`(`slug`),
    INDEX `fleet_locations_state_idx`(`state`),
    INDEX `fleet_locations_tier_idx`(`tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fleet_pricing` (
    `id` VARCHAR(191) NOT NULL,
    `vendorFleetId` VARCHAR(191) NOT NULL,
    `tripTypeId` VARCHAR(191) NOT NULL,
    `localPackageId` VARCHAR(191) NULL,
    `priceType` ENUM('FIXED', 'PER_KM', 'PER_HOUR', 'PER_DAY') NOT NULL DEFAULT 'PER_DAY',
    `basePrice` DOUBLE NOT NULL,
    `perKmRate` DOUBLE NULL,
    `perHourRate` DOUBLE NULL,
    `perDayRate` DOUBLE NULL,
    `kmLimitPerDay` INTEGER NULL,
    `extraKmCharge` DOUBLE NULL,
    `extraHourCharge` DOUBLE NULL,
    `driverAllowance` DOUBLE NULL,
    `nightCharges` DOUBLE NULL,
    `deposit` DOUBLE NULL,
    `minKm` INTEGER NULL,
    `minDays` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `locationId` VARCHAR(191) NULL,

    INDEX `fleet_pricing_localPackageId_idx`(`localPackageId`),
    INDEX `fleet_pricing_locationId_fkey`(`locationId`),
    INDEX `fleet_pricing_tripTypeId_idx`(`tripTypeId`),
    INDEX `fleet_pricing_vendorFleetId_idx`(`vendorFleetId`),
    UNIQUE INDEX `fleet_pricing_vendorFleetId_tripTypeId_localPackageId_locati_key`(`vendorFleetId`, `tripTypeId`, `localPackageId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fleet_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fleet_types_categoryId_idx`(`categoryId`),
    UNIQUE INDEX `fleet_types_slug_categoryId_key`(`slug`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `formType` ENUM('BOOKING', 'CONTACT', 'CUSTOM_BOOKING', 'NEWSLETTER', 'CALLBACK', 'VENDOR', 'OTHER') NOT NULL,
    `formName` VARCHAR(191) NOT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `serviceType` VARCHAR(191) NULL,
    `pickupLocation` VARCHAR(191) NULL,
    `dropLocation` VARCHAR(191) NULL,
    `status` ENUM('SUBMITTED', 'FAILED', 'PENDING', 'CONVERTED') NOT NULL DEFAULT 'SUBMITTED',
    `errorMessage` TEXT NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `timeToFill` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `form_submissions_createdAt_idx`(`createdAt`),
    INDEX `form_submissions_formType_idx`(`formType`),
    INDEX `form_submissions_pagePath_idx`(`pagePath`),
    INDEX `form_submissions_sessionId_idx`(`sessionId`),
    INDEX `form_submissions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `helpdesk_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `ticketNo` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `heading` VARCHAR(191) NOT NULL,
    `problem` TEXT NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `bookingType` VARCHAR(191) NULL,
    `status` ENUM('OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `images` TEXT NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolution` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `helpdesk_tickets_ticketNo_key`(`ticketNo`),
    INDEX `helpdesk_tickets_createdAt_idx`(`createdAt`),
    INDEX `helpdesk_tickets_customerId_idx`(`customerId`),
    INDEX `helpdesk_tickets_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `keyword_rankings` (
    `id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `position` INTEGER NULL,
    `previousPosition` INTEGER NULL,
    `bestPosition` INTEGER NULL,
    `searchEngine` VARCHAR(191) NOT NULL DEFAULT 'google',
    `searchVolume` INTEGER NULL,
    `difficulty` INTEGER NULL,
    `cpc` DOUBLE NULL,
    `hasFeaturedSnippet` BOOLEAN NOT NULL DEFAULT false,
    `hasLocalPack` BOOLEAN NOT NULL DEFAULT false,
    `hasImagePack` BOOLEAN NOT NULL DEFAULT false,
    `hasVideoPack` BOOLEAN NOT NULL DEFAULT false,
    `hasPeopleAlsoAsk` BOOLEAN NOT NULL DEFAULT false,
    `isTracking` BOOLEAN NOT NULL DEFAULT true,
    `lastChecked` DATETIME(3) NULL,
    `checkFrequency` VARCHAR(191) NOT NULL DEFAULT 'daily',
    `rankHistory` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `keyword_rankings_keyword_idx`(`keyword`),
    INDEX `keyword_rankings_pagePath_idx`(`pagePath`),
    INDEX `keyword_rankings_position_idx`(`position`),
    UNIQUE INDEX `keyword_rankings_keyword_pagePath_searchEngine_key`(`keyword`, `pagePath`, `searchEngine`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledge_base` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `keywords` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `useCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `knowledge_base_category_idx`(`category`),
    INDEX `knowledge_base_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `local_packages` (
    `id` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `tripTypeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `hours` INTEGER NOT NULL,
    `kms` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `local_packages_serviceId_idx`(`serviceId`),
    INDEX `local_packages_tripTypeId_idx`(`tripTypeId`),
    UNIQUE INDEX `local_packages_serviceId_hours_kms_key`(`serviceId`, `hours`, `kms`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('COUNTRY', 'STATE', 'CITY', 'AREA', 'AIRPORT') NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `code` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `timezone` VARCHAR(191) NULL DEFAULT 'Asia/Kolkata',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locations_slug_key`(`slug`),
    INDEX `locations_isActive_idx`(`isActive`),
    INDEX `locations_parentId_idx`(`parentId`),
    INDEX `locations_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `luxury_bids` (
    `id` VARCHAR(191) NOT NULL,
    `bidNumber` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleYear` INTEGER NULL,
    `vehicleColor` VARCHAR(191) NULL,
    `vehicleImages` LONGTEXT NULL,
    `baseRate` DOUBLE NOT NULL DEFAULT 0,
    `perKmRate` DOUBLE NOT NULL DEFAULT 0,
    `driverAllowance` DOUBLE NOT NULL DEFAULT 0,
    `decorationCharges` DOUBLE NOT NULL DEFAULT 0,
    `photographerCharges` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `inclusions` LONGTEXT NULL,
    `exclusions` LONGTEXT NULL,
    `termsConditions` TEXT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `viewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `luxury_bids_bidNumber_key`(`bidNumber`),
    INDEX `luxury_bids_bookingId_idx`(`bookingId`),
    INDEX `luxury_bids_status_idx`(`status`),
    INDEX `luxury_bids_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `luxury_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NULL,
    `locationName` VARCHAR(191) NULL,
    `tripType` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NULL,
    `occasion` VARCHAR(191) NULL,
    `carCategory` VARCHAR(191) NOT NULL,
    `carCategoryName` VARCHAR(191) NULL,
    `preferredBrands` LONGTEXT NULL,
    `preferredModels` LONGTEXT NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NULL,
    `dropCity` VARCHAR(191) NULL,
    `dropAddress` TEXT NULL,
    `venueName` VARCHAR(191) NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `returnDate` DATETIME(3) NULL,
    `returnTime` VARCHAR(191) NULL,
    `totalHours` INTEGER NULL,
    `totalDays` INTEGER NOT NULL DEFAULT 1,
    `needDecoration` BOOLEAN NOT NULL DEFAULT false,
    `decorationType` VARCHAR(191) NULL,
    `needChauffeur` BOOLEAN NOT NULL DEFAULT true,
    `chauffeurAttire` VARCHAR(191) NULL,
    `customerNotes` TEXT NULL,
    `baseFare` DOUBLE NOT NULL,
    `decorationCharges` DOUBLE NOT NULL DEFAULT 0,
    `chauffeurCharges` DOUBLE NOT NULL DEFAULT 0,
    `extraHourRate` DOUBLE NULL,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `platformFee` DOUBLE NOT NULL DEFAULT 0,
    `grandTotal` DOUBLE NOT NULL,
    `assignedVendorId` VARCHAR(191) NULL,
    `acceptedVendorId` VARCHAR(191) NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleModel` VARCHAR(191) NULL,
    `vehicleBrand` VARCHAR(191) NULL,
    `vehicleColor` VARCHAR(191) NULL,
    `vehicleImages` LONGTEXT NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `driverPhoto` VARCHAR(191) NULL,
    `status` ENUM('PENDING_PAYMENT', 'ADVANCE_PAID', 'CONFIRMED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'PAYMENT_SUBMITTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `broadcastedAt` DATETIME(3) NULL,
    `responseDeadline` DATETIME(3) NULL,
    `rejectedByVendors` LONGTEXT NULL,
    `tripStartOtp` VARCHAR(191) NULL,
    `tripEndOtp` VARCHAR(191) NULL,
    `tripStartedAt` DATETIME(3) NULL,
    `tripEndedAt` DATETIME(3) NULL,
    `actualHours` INTEGER NULL,
    `extraHourCharges` DOUBLE NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,
    `finalAmount` DOUBLE NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `cancellationReason` TEXT NULL,
    `rating` INTEGER NULL,
    `review` TEXT NULL,
    `driverRating` INTEGER NULL,
    `vehicleRating` INTEGER NULL,
    `acceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `advanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `advancePaid` DOUBLE NOT NULL DEFAULT 0,
    `advancePaidAt` DATETIME(3) NULL,
    `advancePaymentDate` DATETIME(3) NULL,
    `advancePaymentMethod` VARCHAR(191) NULL,
    `advancePaymentProof` VARCHAR(191) NULL,
    `advancePaymentRef` VARCHAR(191) NULL,
    `advancePaymentVerified` BOOLEAN NOT NULL DEFAULT false,
    `advancePercent` INTEGER NOT NULL DEFAULT 30,
    `advanceVerifiedAt` DATETIME(3) NULL,
    `advanceVerifiedBy` VARCHAR(191) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `paymentProof` VARCHAR(191) NULL,
    `paymentSubmittedAt` DATETIME(3) NULL,
    `paymentTransactionId` VARCHAR(191) NULL,
    `quoteRequestId` VARCHAR(191) NULL,
    `refundAmount` DOUBLE NULL,

    UNIQUE INDEX `luxury_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `luxury_bookings_acceptedQuoteId_key`(`acceptedQuoteId`),
    UNIQUE INDEX `luxury_bookings_quoteRequestId_key`(`quoteRequestId`),
    INDEX `luxury_bookings_acceptedVendorId_idx`(`acceptedVendorId`),
    INDEX `luxury_bookings_assignedVendorId_idx`(`assignedVendorId`),
    INDEX `luxury_bookings_customerId_idx`(`customerId`),
    INDEX `luxury_bookings_locationId_idx`(`locationId`),
    INDEX `luxury_bookings_pickupDate_idx`(`pickupDate`),
    INDEX `luxury_bookings_quoteRequestId_idx`(`quoteRequestId`),
    INDEX `luxury_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `luxury_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `tripType` VARCHAR(191) NOT NULL,
    `occasion` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleCategoryName` VARCHAR(191) NULL,
    `passengers` INTEGER NOT NULL DEFAULT 4,
    `specificModel` VARCHAR(191) NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NULL,
    `dropCity` VARCHAR(191) NULL,
    `dropAddress` TEXT NULL,
    `routeDetails` TEXT NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL DEFAULT '10:00',
    `returnDate` DATETIME(3) NULL,
    `returnTime` VARCHAR(191) NULL,
    `tripDays` INTEGER NOT NULL DEFAULT 1,
    `tripHours` INTEGER NULL,
    `packageType` VARCHAR(191) NULL,
    `requirements` TEXT NULL,
    `needChauffeur` BOOLEAN NOT NULL DEFAULT true,
    `needDecoration` BOOLEAN NOT NULL DEFAULT false,
    `decorationType` VARCHAR(191) NULL,
    `budgetMin` INTEGER NULL,
    `budgetMax` INTEGER NULL,
    `locationId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `quotesOpenTill` DATETIME(3) NOT NULL,
    `totalQuotesReceived` INTEGER NOT NULL DEFAULT 0,
    `quotesViewed` INTEGER NOT NULL DEFAULT 0,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `luxury_quote_requests_requestNumber_key`(`requestNumber`),
    UNIQUE INDEX `luxury_quote_requests_acceptedQuoteId_key`(`acceptedQuoteId`),
    INDEX `luxury_quote_requests_customerEmail_idx`(`customerEmail`),
    INDEX `luxury_quote_requests_customerId_idx`(`customerId`),
    INDEX `luxury_quote_requests_customerPhone_idx`(`customerPhone`),
    INDEX `luxury_quote_requests_expiresAt_idx`(`expiresAt`),
    INDEX `luxury_quote_requests_locationId_idx`(`locationId`),
    INDEX `luxury_quote_requests_pickupDate_idx`(`pickupDate`),
    INDEX `luxury_quote_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `luxury_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleModel` VARCHAR(191) NULL,
    `vehicleYear` INTEGER NULL,
    `vehicleFeatures` LONGTEXT NULL,
    `vehicleImages` LONGTEXT NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `driverExperience` INTEGER NULL,
    `baseAmount` INTEGER NOT NULL,
    `chauffeurCharges` INTEGER NOT NULL DEFAULT 0,
    `decorationCharges` INTEGER NOT NULL DEFAULT 0,
    `perKmRate` INTEGER NULL,
    `perHourRate` INTEGER NULL,
    `includedKm` INTEGER NULL,
    `includedHours` INTEGER NULL,
    `fuelCharges` INTEGER NOT NULL DEFAULT 0,
    `tollEstimate` INTEGER NOT NULL DEFAULT 0,
    `parkingEstimate` INTEGER NOT NULL DEFAULT 0,
    `nightHaltCharges` INTEGER NOT NULL DEFAULT 0,
    `gstAmount` INTEGER NOT NULL DEFAULT 0,
    `totalAmount` INTEGER NOT NULL,
    `advanceAmount` INTEGER NULL,
    `advancePercent` INTEGER NOT NULL DEFAULT 30,
    `extraKmRate` INTEGER NULL,
    `extraHourRate` INTEGER NULL,
    `inclusions` LONGTEXT NULL,
    `exclusions` LONGTEXT NULL,
    `termsConditions` LONGTEXT NULL,
    `validTill` DATETIME(3) NOT NULL,
    `validityDays` INTEGER NOT NULL DEFAULT 3,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `viewedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `templateId` VARCHAR(191) NULL,
    `fleetId` VARCHAR(191) NULL,
    `vendorMessage` TEXT NULL,
    `isNegotiable` BOOLEAN NOT NULL DEFAULT false,
    `negotiatedAmount` INTEGER NULL,
    `negotiationNotes` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `luxury_quotes_quoteNumber_key`(`quoteNumber`),
    INDEX `luxury_quotes_fleetId_fkey`(`fleetId`),
    INDEX `luxury_quotes_requestId_idx`(`requestId`),
    INDEX `luxury_quotes_status_idx`(`status`),
    INDEX `luxury_quotes_templateId_fkey`(`templateId`),
    INDEX `luxury_quotes_validTill_idx`(`validTill`),
    INDEX `luxury_quotes_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `luxury_quotes_requestId_vendorId_key`(`requestId`, `vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `luxury_vendor_rates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(50) NOT NULL,
    `locationId` VARCHAR(50) NOT NULL,
    `carCategory` VARCHAR(50) NOT NULL,
    `packageType` VARCHAR(30) NOT NULL,
    `packageHours` INTEGER NOT NULL,
    `packageKm` INTEGER NOT NULL,
    `basePrice` DOUBLE NOT NULL,
    `extraKmRate` DOUBLE NOT NULL DEFAULT 0,
    `extraHourRate` DOUBLE NOT NULL DEFAULT 0,
    `vehicleName` VARCHAR(191) NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleYear` INTEGER NULL,
    `vehicleColor` VARCHAR(191) NULL,
    `vehicleImages` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `minBookingHours` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `luxury_vendor_rates_carCategory_idx`(`carCategory`),
    INDEX `luxury_vendor_rates_isActive_idx`(`isActive`),
    INDEX `luxury_vendor_rates_locationId_idx`(`locationId`),
    INDEX `luxury_vendor_rates_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `luxury_vendor_rates_vendorId_locationId_carCategory_packageT_key`(`vendorId`, `locationId`, `carCategory`, `packageType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manager_locations` (
    `id` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `manager_locations_locationId_fkey`(`locationId`),
    UNIQUE INDEX `manager_locations_managerId_locationId_key`(`managerId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manager_services` (
    `id` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `manager_services_serviceId_fkey`(`serviceId`),
    UNIQUE INDEX `manager_services_managerId_serviceId_key`(`managerId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `alt` VARCHAR(191) NULL,
    `caption` VARCHAR(191) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `folder` VARCHAR(191) NULL DEFAULT 'uploads',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `vendorId` VARCHAR(191) NULL,

    INDEX `media_folder_idx`(`folder`),
    INDEX `media_mimeType_idx`(`mimeType`),
    INDEX `media_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packers_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `quoteRequestId` VARCHAR(191) NOT NULL,
    `acceptedQuoteId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `shiftingType` VARCHAR(191) NOT NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NOT NULL,
    `pickupFloor` INTEGER NULL,
    `dropCity` VARCHAR(191) NOT NULL,
    `dropAddress` TEXT NOT NULL,
    `dropFloor` INTEGER NULL,
    `scheduledDate` DATETIME(3) NOT NULL,
    `scheduledTime` VARCHAR(191) NULL,
    `teamLeaderName` VARCHAR(191) NULL,
    `teamLeaderPhone` VARCHAR(191) NULL,
    `teamSize` INTEGER NULL,
    `vehicleNumbers` LONGTEXT NULL,
    `packingCharges` DOUBLE NOT NULL DEFAULT 0,
    `loadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `transportCharges` DOUBLE NOT NULL,
    `unloadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `unpackingCharges` DOUBLE NOT NULL DEFAULT 0,
    `storageCharges` DOUBLE NOT NULL DEFAULT 0,
    `insuranceCharges` DOUBLE NOT NULL DEFAULT 0,
    `materialCharges` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `advanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `advancePaid` DOUBLE NOT NULL DEFAULT 0,
    `advancePaidAt` DATETIME(3) NULL,
    `balanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `balancePaid` DOUBLE NOT NULL DEFAULT 0,
    `balancePaidAt` DATETIME(3) NULL,
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `status` ENUM('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `packingOtp` VARCHAR(191) NULL,
    `loadingOtp` VARCHAR(191) NULL,
    `deliveryOtp` VARCHAR(191) NULL,
    `packingStartedAt` DATETIME(3) NULL,
    `packingEndedAt` DATETIME(3) NULL,
    `loadingStartedAt` DATETIME(3) NULL,
    `loadingEndedAt` DATETIME(3) NULL,
    `transitStartedAt` DATETIME(3) NULL,
    `transitEndedAt` DATETIME(3) NULL,
    `unloadingStartedAt` DATETIME(3) NULL,
    `unloadingEndedAt` DATETIME(3) NULL,
    `unpackingStartedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `itemsPacked` INTEGER NULL,
    `itemsDelivered` INTEGER NULL,
    `damagedItems` LONGTEXT NULL,
    `extraCharges` DOUBLE NOT NULL DEFAULT 0,
    `extraChargesReason` VARCHAR(191) NULL,
    `finalAmount` DOUBLE NULL,
    `customerNotes` TEXT NULL,
    `vendorNotes` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `cancellationReason` TEXT NULL,
    `refundAmount` DOUBLE NULL,
    `rating` INTEGER NULL,
    `review` TEXT NULL,
    `teamRating` INTEGER NULL,
    `packingRating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deliveryOtpSent` BOOLEAN NOT NULL DEFAULT false,
    `loadingOtpSent` BOOLEAN NOT NULL DEFAULT false,
    `packingOtpSent` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `packers_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `packers_bookings_quoteRequestId_key`(`quoteRequestId`),
    UNIQUE INDEX `packers_bookings_acceptedQuoteId_key`(`acceptedQuoteId`),
    INDEX `packers_bookings_customerId_idx`(`customerId`),
    INDEX `packers_bookings_scheduledDate_idx`(`scheduledDate`),
    INDEX `packers_bookings_status_idx`(`status`),
    INDEX `packers_bookings_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packers_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `shiftingType` VARCHAR(191) NOT NULL,
    `propertySize` VARCHAR(191) NULL,
    `inventoryList` LONGTEXT NULL,
    `hasHeavyItems` BOOLEAN NOT NULL DEFAULT false,
    `heavyItemsDesc` TEXT NULL,
    `hasFragileItems` BOOLEAN NOT NULL DEFAULT false,
    `fragileItemsDesc` TEXT NULL,
    `hasVehicle` BOOLEAN NOT NULL DEFAULT false,
    `vehicleDetails` VARCHAR(191) NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NOT NULL,
    `pickupFloor` INTEGER NULL,
    `hasPickupLift` BOOLEAN NOT NULL DEFAULT false,
    `pickupParkingDist` VARCHAR(191) NULL,
    `dropCity` VARCHAR(191) NOT NULL,
    `dropAddress` TEXT NOT NULL,
    `dropFloor` INTEGER NULL,
    `hasDropLift` BOOLEAN NOT NULL DEFAULT false,
    `dropParkingDist` VARCHAR(191) NULL,
    `preferredDate` DATETIME(3) NOT NULL,
    `isFlexibleDate` BOOLEAN NOT NULL DEFAULT false,
    `flexibleDateRange` VARCHAR(191) NULL,
    `needPacking` BOOLEAN NOT NULL DEFAULT true,
    `needUnpacking` BOOLEAN NOT NULL DEFAULT false,
    `needStorage` BOOLEAN NOT NULL DEFAULT false,
    `storageDays` INTEGER NULL,
    `needInsurance` BOOLEAN NOT NULL DEFAULT false,
    `insuranceValue` DOUBLE NULL,
    `requirements` TEXT NULL,
    `budgetMin` DOUBLE NULL,
    `budgetMax` DOUBLE NULL,
    `locationId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `quotesOpenTill` DATETIME(3) NULL,
    `totalQuotesReceived` INTEGER NOT NULL DEFAULT 0,
    `quotesViewed` INTEGER NOT NULL DEFAULT 0,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `packers_quote_requests_requestNumber_key`(`requestNumber`),
    INDEX `packers_quote_requests_customerId_idx`(`customerId`),
    INDEX `packers_quote_requests_locationId_idx`(`locationId`),
    INDEX `packers_quote_requests_preferredDate_idx`(`preferredDate`),
    INDEX `packers_quote_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packers_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vehicleType` VARCHAR(191) NOT NULL,
    `teamSize` INTEGER NOT NULL,
    `estimatedDuration` VARCHAR(191) NOT NULL,
    `packingCharges` DOUBLE NOT NULL DEFAULT 0,
    `loadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `transportCharges` DOUBLE NOT NULL,
    `unloadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `unpackingCharges` DOUBLE NOT NULL DEFAULT 0,
    `storageCharges` DOUBLE NOT NULL DEFAULT 0,
    `insuranceCharges` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `packingMaterials` LONGTEXT NULL,
    `materialCharges` DOUBLE NOT NULL DEFAULT 0,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `validTill` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `viewedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `templateId` VARCHAR(191) NULL,

    UNIQUE INDEX `packers_quotes_quoteNumber_key`(`quoteNumber`),
    INDEX `packers_quotes_requestId_idx`(`requestId`),
    INDEX `packers_quotes_status_idx`(`status`),
    INDEX `packers_quotes_templateId_idx`(`templateId`),
    INDEX `packers_quotes_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `pageViews` INTEGER NOT NULL DEFAULT 0,
    `uniqueVisitors` INTEGER NOT NULL DEFAULT 0,
    `entrances` INTEGER NOT NULL DEFAULT 0,
    `exits` INTEGER NOT NULL DEFAULT 0,
    `bounces` INTEGER NOT NULL DEFAULT 0,
    `avgTimeOnPage` DOUBLE NULL,
    `scrollDepth25` INTEGER NOT NULL DEFAULT 0,
    `scrollDepth50` INTEGER NOT NULL DEFAULT 0,
    `scrollDepth75` INTEGER NOT NULL DEFAULT 0,
    `scrollDepth100` INTEGER NOT NULL DEFAULT 0,
    `formStarts` INTEGER NOT NULL DEFAULT 0,
    `formSubmissions` INTEGER NOT NULL DEFAULT 0,
    `chatOpened` INTEGER NOT NULL DEFAULT 0,
    `chatBookings` INTEGER NOT NULL DEFAULT 0,
    `ctaClicks` INTEGER NOT NULL DEFAULT 0,
    `phoneClicks` INTEGER NOT NULL DEFAULT 0,
    `directTraffic` INTEGER NOT NULL DEFAULT 0,
    `organicTraffic` INTEGER NOT NULL DEFAULT 0,
    `referralTraffic` INTEGER NOT NULL DEFAULT 0,
    `socialTraffic` INTEGER NOT NULL DEFAULT 0,
    `mobileViews` INTEGER NOT NULL DEFAULT 0,
    `desktopViews` INTEGER NOT NULL DEFAULT 0,
    `tabletViews` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `page_analytics_date_idx`(`date`),
    INDEX `page_analytics_pagePath_idx`(`pagePath`),
    INDEX `page_analytics_pageViews_idx`(`pageViews`),
    UNIQUE INDEX `page_analytics_pagePath_date_key`(`pagePath`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_performance` (
    `id` VARCHAR(191) NOT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `totalViews` INTEGER NOT NULL DEFAULT 0,
    `avgLcp` DOUBLE NULL,
    `avgFid` DOUBLE NULL,
    `avgCls` DOUBLE NULL,
    `avgFcp` DOUBLE NULL,
    `avgTtfb` DOUBLE NULL,
    `avgInp` DOUBLE NULL,
    `lcpGood` INTEGER NOT NULL DEFAULT 0,
    `lcpNeedsWork` INTEGER NOT NULL DEFAULT 0,
    `lcpPoor` INTEGER NOT NULL DEFAULT 0,
    `fidGood` INTEGER NOT NULL DEFAULT 0,
    `fidNeedsWork` INTEGER NOT NULL DEFAULT 0,
    `fidPoor` INTEGER NOT NULL DEFAULT 0,
    `clsGood` INTEGER NOT NULL DEFAULT 0,
    `clsNeedsWork` INTEGER NOT NULL DEFAULT 0,
    `clsPoor` INTEGER NOT NULL DEFAULT 0,
    `overallStatus` ENUM('HEALTHY', 'NEEDS_IMPROVEMENT', 'POOR', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `issues` LONGTEXT NULL,
    `bounceRate` DOUBLE NULL,
    `avgTimeOnPage` INTEGER NULL,
    `exitRate` DOUBLE NULL,
    `lastMeasured` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `page_performance_pagePath_key`(`pagePath`),
    INDEX `page_performance_overallStatus_idx`(`overallStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_views` (
    `id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `referrer` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `page_views_createdAt_idx`(`createdAt`),
    INDEX `page_views_path_idx`(`path`),
    INDEX `page_views_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `excerpt` TEXT NULL,
    `featuredImage` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `pages_slug_key`(`slug`),
    INDEX `pages_authorId_fkey`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_settings` (
    `id` VARCHAR(191) NOT NULL,
    `defaultGst` DOUBLE NOT NULL DEFAULT 18,
    `defaultPlatformFee` DOUBLE NOT NULL DEFAULT 99,
    `defaultAdvance` DOUBLE NOT NULL DEFAULT 20,
    `defaultSecurityDeposit` DOUBLE NOT NULL DEFAULT 2000,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redirects` (
    `id` VARCHAR(191) NOT NULL,
    `fromPath` VARCHAR(191) NOT NULL,
    `toPath` VARCHAR(191) NOT NULL,
    `type` ENUM('PERMANENT', 'TEMPORARY') NOT NULL DEFAULT 'PERMANENT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `hitCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `redirects_fromPath_key`(`fromPath`),
    INDEX `redirects_fromPath_idx`(`fromPath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_pricing` (
    `id` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(50) NOT NULL,
    `subServiceId` VARCHAR(50) NULL,
    `tripTypeId` VARCHAR(50) NOT NULL,
    `fromLocationId` VARCHAR(50) NOT NULL,
    `toLocationId` VARCHAR(50) NOT NULL,
    `basePrice` DOUBLE NOT NULL,
    `estimatedKm` INTEGER NULL,
    `estimatedTime` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `route_pricing_fromLocationId_idx`(`fromLocationId`),
    INDEX `route_pricing_serviceId_idx`(`serviceId`),
    INDEX `route_pricing_toLocationId_idx`(`toLocationId`),
    INDEX `route_pricing_tripTypeId_fkey`(`tripTypeId`),
    UNIQUE INDEX `route_pricing_serviceId_subServiceId_tripTypeId_fromLocation_key`(`serviceId`, `subServiceId`, `tripTypeId`, `fromLocationId`, `toLocationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_queries` (
    `id` VARCHAR(191) NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `ctr` DOUBLE NULL,
    `avgPosition` DOUBLE NULL,
    `date` DATE NOT NULL,
    `device` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `search_queries_clicks_idx`(`clicks`),
    INDEX `search_queries_date_idx`(`date`),
    INDEX `search_queries_pagePath_idx`(`pagePath`),
    INDEX `search_queries_query_idx`(`query`),
    UNIQUE INDEX `search_queries_query_pagePath_date_device_key`(`query`, `pagePath`, `date`, `device`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `self_drive_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `transmission` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `acceptedQuoteId` VARCHAR(191) NULL,
    `budgetMax` DOUBLE NULL,
    `budgetMin` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerNotes` TEXT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `dropAddress` TEXT NULL,
    `dropDate` DATETIME(3) NOT NULL,
    `dropTime` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `fuelType` VARCHAR(191) NULL,
    `isDeliveryRequested` BOOLEAN NOT NULL DEFAULT false,
    `licenseNumber` VARCHAR(191) NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `locationName` VARCHAR(191) NOT NULL,
    `minSeats` INTEGER NULL,
    `pickupAddress` TEXT NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `quotesOpenTill` DATETIME(3) NULL,
    `quotesViewed` INTEGER NOT NULL DEFAULT 0,
    `requestNumber` VARCHAR(191) NOT NULL,
    `totalDays` INTEGER NOT NULL,
    `totalQuotesReceived` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    `vehicleBrand` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NULL,
    `vehicleCategoryName` VARCHAR(191) NULL,
    `vehicleModelId` VARCHAR(191) NULL,
    `vehicleModelName` VARCHAR(191) NULL,
    `vehicleType` VARCHAR(191) NULL,

    UNIQUE INDEX `self_drive_quote_requests_requestNumber_key`(`requestNumber`),
    INDEX `self_drive_quote_requests_acceptedQuoteId_fkey`(`acceptedQuoteId`),
    INDEX `self_drive_quote_requests_createdAt_idx`(`createdAt`),
    INDEX `self_drive_quote_requests_customerId_idx`(`customerId`),
    INDEX `self_drive_quote_requests_locationId_idx`(`locationId`),
    INDEX `self_drive_quote_requests_pickupDate_idx`(`pickupDate`),
    INDEX `self_drive_quote_requests_status_idx`(`status`),
    INDEX `self_drive_quote_requests_vehicleModelId_idx`(`vehicleModelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `self_drive_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `transmission` VARCHAR(191) NULL,
    `seats` INTEGER NULL,
    `inclusions` LONGTEXT NULL,
    `exclusions` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `advanceAmount` DOUBLE NOT NULL,
    `advancePercent` INTEGER NOT NULL DEFAULT 30,
    `baseAmount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dailyRate` DOUBLE NOT NULL,
    `deliveryCharges` DOUBLE NOT NULL DEFAULT 0,
    `extraKmRate` DOUBLE NOT NULL DEFAULT 10,
    `fuelType` VARCHAR(191) NULL,
    `grandTotal` DOUBLE NOT NULL,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `kmLimitPerDay` INTEGER NOT NULL DEFAULT 200,
    `pickupCharges` DOUBLE NOT NULL DEFAULT 0,
    `platformFee` DOUBLE NOT NULL DEFAULT 99,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `respondedAt` DATETIME(3) NULL,
    `securityDeposit` DOUBLE NOT NULL,
    `sentAt` DATETIME(3) NULL,
    `termsConditions` LONGTEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `validTill` DATETIME(3) NOT NULL,
    `validityDays` INTEGER NOT NULL DEFAULT 3,
    `vehicleBrand` VARCHAR(191) NULL,
    `vehicleCategory` VARCHAR(191) NULL,
    `vehicleFeatures` LONGTEXT NULL,
    `vehicleImages` LONGTEXT NULL,
    `vehicleModelId` VARCHAR(191) NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `vehicleType` VARCHAR(191) NULL,
    `vehicleYear` INTEGER NULL,
    `vendorFleetId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vendorMessage` TEXT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `viewedAt` DATETIME(3) NULL,
    `templateId` VARCHAR(191) NULL,

    UNIQUE INDEX `self_drive_quotes_quoteNumber_key`(`quoteNumber`),
    INDEX `self_drive_quotes_createdAt_idx`(`createdAt`),
    INDEX `self_drive_quotes_requestId_idx`(`requestId`),
    INDEX `self_drive_quotes_status_idx`(`status`),
    INDEX `self_drive_quotes_templateId_idx`(`templateId`),
    INDEX `self_drive_quotes_vehicleModelId_fkey`(`vehicleModelId`),
    INDEX `self_drive_quotes_vendorFleetId_idx`(`vendorFleetId`),
    INDEX `self_drive_quotes_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_audits` (
    `id` VARCHAR(191) NOT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `lastAuditDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `overallScore` INTEGER NOT NULL DEFAULT 0,
    `technicalScore` INTEGER NOT NULL DEFAULT 0,
    `contentScore` INTEGER NOT NULL DEFAULT 0,
    `onPageScore` INTEGER NOT NULL DEFAULT 0,
    `hasTitle` BOOLEAN NOT NULL DEFAULT false,
    `titleLength` INTEGER NULL,
    `titleIssue` VARCHAR(191) NULL,
    `hasMetaDesc` BOOLEAN NOT NULL DEFAULT false,
    `metaDescLength` INTEGER NULL,
    `metaDescIssue` VARCHAR(191) NULL,
    `hasCanonical` BOOLEAN NOT NULL DEFAULT false,
    `canonicalUrl` VARCHAR(191) NULL,
    `hasH1` BOOLEAN NOT NULL DEFAULT false,
    `h1Count` INTEGER NOT NULL DEFAULT 0,
    `h1Text` VARCHAR(191) NULL,
    `h2Count` INTEGER NOT NULL DEFAULT 0,
    `h3Count` INTEGER NOT NULL DEFAULT 0,
    `wordCount` INTEGER NOT NULL DEFAULT 0,
    `readingTime` INTEGER NULL,
    `hasImages` BOOLEAN NOT NULL DEFAULT false,
    `imageCount` INTEGER NOT NULL DEFAULT 0,
    `imagesWithAlt` INTEGER NOT NULL DEFAULT 0,
    `imagesMissingAlt` INTEGER NOT NULL DEFAULT 0,
    `internalLinks` INTEGER NOT NULL DEFAULT 0,
    `externalLinks` INTEGER NOT NULL DEFAULT 0,
    `brokenLinks` INTEGER NOT NULL DEFAULT 0,
    `isIndexable` BOOLEAN NOT NULL DEFAULT true,
    `hasRobotsMeta` VARCHAR(191) NULL,
    `hasStructuredData` BOOLEAN NOT NULL DEFAULT false,
    `structuredDataTypes` LONGTEXT NULL,
    `hasOpenGraph` BOOLEAN NOT NULL DEFAULT false,
    `hasTwitterCard` BOOLEAN NOT NULL DEFAULT false,
    `isMobileFriendly` BOOLEAN NOT NULL DEFAULT true,
    `viewportMeta` BOOLEAN NOT NULL DEFAULT false,
    `pageSize` INTEGER NULL,
    `loadTime` DOUBLE NULL,
    `issues` LONGTEXT NULL,
    `warnings` LONGTEXT NULL,
    `passed` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `seo_audits_pagePath_key`(`pagePath`),
    INDEX `seo_audits_lastAuditDate_idx`(`lastAuditDate`),
    INDEX `seo_audits_overallScore_idx`(`overallScore`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seo_meta` (
    `id` VARCHAR(191) NOT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `metaKeywords` TEXT NULL,
    `ogTitle` VARCHAR(191) NULL,
    `ogDescription` TEXT NULL,
    `ogImage` VARCHAR(191) NULL,
    `ogType` VARCHAR(191) NULL DEFAULT 'website',
    `twitterCard` VARCHAR(191) NULL DEFAULT 'summary_large_image',
    `twitterTitle` VARCHAR(191) NULL,
    `twitterDescription` TEXT NULL,
    `twitterImage` VARCHAR(191) NULL,
    `canonicalUrl` VARCHAR(191) NULL,
    `noindex` BOOLEAN NOT NULL DEFAULT false,
    `nofollow` BOOLEAN NOT NULL DEFAULT false,
    `pageId` VARCHAR(191) NULL,
    `blogPostId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `seo_meta_pageId_key`(`pageId`),
    UNIQUE INDEX `seo_meta_blogPostId_key`(`blogPostId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_locations` (
    `id` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `basePriceOverride` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `service_locations_locationId_idx`(`locationId`),
    INDEX `service_locations_serviceId_idx`(`serviceId`),
    UNIQUE INDEX `service_locations_serviceId_locationId_key`(`serviceId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_payment_configs` (
    `id` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `serviceName` VARCHAR(191) NOT NULL,
    `gst` DOUBLE NULL,
    `platformFee` DOUBLE NULL,
    `advancePercentage` DOUBLE NULL,
    `securityDeposit` DOUBLE NULL,
    `minBookingDays` INTEGER NULL DEFAULT 1,
    `maxBookingDays` INTEGER NULL DEFAULT 30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_payment_configs_serviceId_key`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_trip_types` (
    `id` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `tripTypeId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `service_trip_types_serviceId_idx`(`serviceId`),
    INDEX `service_trip_types_tripTypeId_idx`(`tripTypeId`),
    UNIQUE INDEX `service_trip_types_serviceId_tripTypeId_key`(`serviceId`, `tripTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `shortDesc` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `flowType` ENUM('BROWSE_FIRST', 'TRIP_FIRST', 'QUOTE_BASED') NOT NULL DEFAULT 'QUOTE_BASED',
    `config` LONGTEXT NULL,
    `formFields` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_slug_key`(`slug`),
    INDEX `services_flowType_idx`(`flowType`),
    INDEX `services_isActive_idx`(`isActive`),
    INDEX `services_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `type` ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'BOOLEAN', 'JSON', 'URL', 'EMAIL') NOT NULL DEFAULT 'TEXT',
    `group` VARCHAR(191) NULL,
    `label` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    INDEX `settings_group_idx`(`group`),
    INDEX `settings_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY') NOT NULL DEFAULT 'PRESENT',
    `checkIn` VARCHAR(191) NULL,
    `checkOut` VARCHAR(191) NULL,
    `leaveType` VARCHAR(191) NULL,
    `leaveReason` TEXT NULL,
    `notes` TEXT NULL,
    `markedBy` VARCHAR(191) NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `staff_attendance_date_idx`(`date`),
    INDEX `staff_attendance_staffId_idx`(`staffId`),
    INDEX `staff_attendance_status_idx`(`status`),
    UNIQUE INDEX `staff_attendance_staffId_date_key`(`staffId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `requiresFromLocation` BOOLEAN NOT NULL DEFAULT true,
    `requiresToLocation` BOOLEAN NOT NULL DEFAULT false,
    `requiresReturnDate` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `trip_types_name_key`(`name`),
    UNIQUE INDEX `trip_types_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `truck_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `bookingNumber` VARCHAR(191) NOT NULL,
    `quoteRequestId` VARCHAR(191) NOT NULL,
    `acceptedQuoteId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `goodsType` VARCHAR(191) NOT NULL,
    `goodsDescription` TEXT NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NULL,
    `pickupFloor` INTEGER NULL,
    `dropCity` VARCHAR(191) NOT NULL,
    `dropAddress` TEXT NULL,
    `dropFloor` INTEGER NULL,
    `estimatedDistance` DOUBLE NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `labourCount` INTEGER NULL,
    `labourNames` LONGTEXT NULL,
    `baseAmount` DOUBLE NOT NULL,
    `labourCharges` DOUBLE NOT NULL DEFAULT 0,
    `loadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `unloadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `packagingCharges` DOUBLE NOT NULL DEFAULT 0,
    `insuranceCharges` DOUBLE NOT NULL DEFAULT 0,
    `tollCharges` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `advanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `advancePaid` DOUBLE NOT NULL DEFAULT 0,
    `advancePaidAt` DATETIME(3) NULL,
    `balanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `balancePaid` DOUBLE NOT NULL DEFAULT 0,
    `balancePaidAt` DATETIME(3) NULL,
    `paymentStatus` ENUM('PENDING', 'SUBMITTED', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `status` ENUM('PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `loadingOtp` VARCHAR(191) NULL,
    `deliveryOtp` VARCHAR(191) NULL,
    `loadingStartedAt` DATETIME(3) NULL,
    `loadingEndedAt` DATETIME(3) NULL,
    `transitStartedAt` DATETIME(3) NULL,
    `transitEndedAt` DATETIME(3) NULL,
    `unloadingStartedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `actualDistance` DOUBLE NULL,
    `extraCharges` DOUBLE NOT NULL DEFAULT 0,
    `extraChargesReason` VARCHAR(191) NULL,
    `finalAmount` DOUBLE NULL,
    `customerNotes` TEXT NULL,
    `vendorNotes` TEXT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelledBy` VARCHAR(191) NULL,
    `cancellationReason` TEXT NULL,
    `refundAmount` DOUBLE NULL,
    `rating` INTEGER NULL,
    `review` TEXT NULL,
    `driverRating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `advancePaymentDate` DATETIME(3) NULL,
    `advancePaymentProof` VARCHAR(191) NULL,
    `advancePaymentRef` VARCHAR(191) NULL,
    `advancePaymentVerified` BOOLEAN NOT NULL DEFAULT false,
    `assignedDriverId` VARCHAR(191) NULL,
    `assignedVehicleId` VARCHAR(191) NULL,
    `paymentMethod` VARCHAR(191) NULL,

    UNIQUE INDEX `truck_bookings_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `truck_bookings_quoteRequestId_key`(`quoteRequestId`),
    UNIQUE INDEX `truck_bookings_acceptedQuoteId_key`(`acceptedQuoteId`),
    INDEX `truck_bookings_assignedDriverId_idx`(`assignedDriverId`),
    INDEX `truck_bookings_assignedVehicleId_idx`(`assignedVehicleId`),
    INDEX `truck_bookings_customerId_idx`(`customerId`),
    INDEX `truck_bookings_pickupDate_idx`(`pickupDate`),
    INDEX `truck_bookings_status_idx`(`status`),
    INDEX `truck_bookings_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `truck_quote_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleCategoryName` VARCHAR(191) NOT NULL,
    `goodsType` VARCHAR(191) NOT NULL,
    `goodsDescription` TEXT NULL,
    `estimatedWeight` DOUBLE NULL,
    `estimatedVolume` VARCHAR(191) NULL,
    `requiresLabour` BOOLEAN NOT NULL DEFAULT false,
    `labourCount` INTEGER NULL,
    `pickupCity` VARCHAR(191) NOT NULL,
    `pickupAddress` TEXT NULL,
    `pickupFloor` INTEGER NULL,
    `hasPickupLift` BOOLEAN NOT NULL DEFAULT false,
    `dropCity` VARCHAR(191) NOT NULL,
    `dropAddress` TEXT NULL,
    `dropFloor` INTEGER NULL,
    `hasDropLift` BOOLEAN NOT NULL DEFAULT false,
    `estimatedDistance` DOUBLE NULL,
    `pickupDate` DATETIME(3) NOT NULL,
    `pickupTime` VARCHAR(191) NOT NULL,
    `isFlexibleDate` BOOLEAN NOT NULL DEFAULT false,
    `requirements` TEXT NULL,
    `needInsurance` BOOLEAN NOT NULL DEFAULT false,
    `needPackaging` BOOLEAN NOT NULL DEFAULT false,
    `budgetMin` DOUBLE NULL,
    `budgetMax` DOUBLE NULL,
    `locationId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'QUOTES_RECEIVED', 'QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `quotesOpenTill` DATETIME(3) NULL,
    `totalQuotesReceived` INTEGER NOT NULL DEFAULT 0,
    `quotesViewed` INTEGER NOT NULL DEFAULT 0,
    `acceptedQuoteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `truck_quote_requests_requestNumber_key`(`requestNumber`),
    INDEX `truck_quote_requests_customerId_idx`(`customerId`),
    INDEX `truck_quote_requests_locationId_idx`(`locationId`),
    INDEX `truck_quote_requests_pickupDate_idx`(`pickupDate`),
    INDEX `truck_quote_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `truck_quotes` (
    `id` VARCHAR(191) NOT NULL,
    `quoteNumber` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vehicleCategory` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NULL,
    `vehicleCapacity` VARCHAR(191) NULL,
    `driverName` VARCHAR(191) NULL,
    `driverPhone` VARCHAR(191) NULL,
    `labourIncluded` BOOLEAN NOT NULL DEFAULT false,
    `labourCount` INTEGER NULL,
    `labourCharges` DOUBLE NOT NULL DEFAULT 0,
    `baseAmount` DOUBLE NOT NULL,
    `perKmRate` DOUBLE NULL,
    `loadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `unloadingCharges` DOUBLE NOT NULL DEFAULT 0,
    `packagingCharges` DOUBLE NOT NULL DEFAULT 0,
    `insuranceCharges` DOUBLE NOT NULL DEFAULT 0,
    `tollEstimate` DOUBLE NOT NULL DEFAULT 0,
    `gstAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `validTill` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `viewedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `templateId` VARCHAR(191) NULL,

    UNIQUE INDEX `truck_quotes_quoteNumber_key`(`quoteNumber`),
    INDEX `truck_quotes_requestId_idx`(`requestId`),
    INDEX `truck_quotes_status_idx`(`status`),
    INDEX `truck_quotes_templateId_idx`(`templateId`),
    INDEX `truck_quotes_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_model_locations` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleModelId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `basePricePerDay` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vehicle_model_locations_isActive_idx`(`isActive`),
    INDEX `vehicle_model_locations_locationId_idx`(`locationId`),
    INDEX `vehicle_model_locations_vehicleModelId_idx`(`vehicleModelId`),
    UNIQUE INDEX `vehicle_model_locations_vehicleModelId_locationId_key`(`vehicleModelId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_models` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `subServiceId` VARCHAR(191) NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `sideImage` VARCHAR(191) NULL,
    `fuelType` VARCHAR(191) NULL,
    `transmission` VARCHAR(191) NULL,
    `seatingCapacity` INTEGER NULL,
    `engineCC` INTEGER NULL,
    `mileage` VARCHAR(191) NULL,
    `specs` LONGTEXT NULL,
    `features` LONGTEXT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `basePricePerDay` DOUBLE NULL,
    `monthlyDiscount` DOUBLE NULL,
    `weeklyDiscount` DOUBLE NULL,
    `vehicleCategoryId` VARCHAR(191) NULL,
    `bodyType` VARCHAR(191) NULL,
    `heightFt` DOUBLE NULL,
    `lengthFt` DOUBLE NULL,
    `loadCapacity` DOUBLE NULL,
    `wheels` VARCHAR(191) NULL,
    `widthFt` DOUBLE NULL,
    `highlight` VARCHAR(191) NULL,
    `horsepower` VARCHAR(191) NULL,
    `images` LONGTEXT NULL,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `rating` DOUBLE NULL DEFAULT 4.9,
    `tagline` VARCHAR(191) NULL,

    INDEX `vehicle_models_brandId_idx`(`brandId`),
    INDEX `vehicle_models_isActive_idx`(`isActive`),
    INDEX `vehicle_models_serviceId_idx`(`serviceId`),
    INDEX `vehicle_models_subServiceId_idx`(`subServiceId`),
    INDEX `vehicle_models_vehicleCategoryId_idx`(`vehicleCategoryId`),
    UNIQUE INDEX `vehicle_models_serviceId_slug_key`(`serviceId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_approved_locations` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_approved_locations_locationId_idx`(`locationId`),
    INDEX `vendor_approved_locations_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `vendor_approved_locations_vendorId_locationId_key`(`vendorId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_approved_services` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vendor_approved_services_serviceId_idx`(`serviceId`),
    INDEX `vendor_approved_services_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `vendor_approved_services_vendorId_serviceId_key`(`vendorId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_bike_templates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `bikeTypes` LONGTEXT NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `dailyRateHint` DOUBLE NULL,
    `weeklyRateHint` DOUBLE NULL,
    `monthlyRateHint` DOUBLE NULL,
    `securityDepositHint` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_bike_templates_category_idx`(`category`),
    INDEX `vendor_bike_templates_isActive_idx`(`isActive`),
    INDEX `vendor_bike_templates_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_bus_templates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `vehicleTypes` LONGTEXT NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `baseRateHint` DOUBLE NULL,
    `perKmRateHint` DOUBLE NULL,
    `perDayRateHint` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_bus_templates_category_idx`(`category`),
    INDEX `vendor_bus_templates_isActive_idx`(`isActive`),
    INDEX `vendor_bus_templates_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_documents` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `documentType` ENUM('GST_CERTIFICATE', 'PAN_CARD', 'BUSINESS_REGISTRATION', 'ADDRESS_PROOF', 'BANK_DETAILS', 'CANCELLED_CHEQUE', 'OWNER_AADHAAR', 'OWNER_PAN', 'OTHER') NOT NULL,
    `documentName` VARCHAR(191) NOT NULL,
    `documentUrl` VARCHAR(191) NOT NULL,
    `documentNumber` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `verifiedAt` DATETIME(3) NULL,
    `verifiedById` VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_documents_documentType_idx`(`documentType`),
    INDEX `vendor_documents_status_idx`(`status`),
    INDEX `vendor_documents_vendorId_idx`(`vendorId`),
    INDEX `vendor_documents_verifiedById_fkey`(`verifiedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_equipment_templates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `equipmentTypes` LONGTEXT NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `dailyRateHint` DOUBLE NULL,
    `weeklyRateHint` DOUBLE NULL,
    `monthlyRateHint` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_equipment_templates_category_idx`(`category`),
    INDEX `vendor_equipment_templates_isActive_idx`(`isActive`),
    INDEX `vendor_equipment_templates_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_fleet_locations` (
    `id` VARCHAR(191) NOT NULL,
    `vendorFleetId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_fleet_locations_locationId_idx`(`locationId`),
    INDEX `vendor_fleet_locations_vendorFleetId_idx`(`vendorFleetId`),
    UNIQUE INDEX `vendor_fleet_locations_vendorFleetId_locationId_key`(`vendorFleetId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_fleets` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `vehicleModelId` VARCHAR(191) NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `subServiceId` VARCHAR(191) NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `yearOfManufacture` INTEGER NULL,
    `color` VARCHAR(191) NULL,
    `images` LONGTEXT NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `availableFrom` DATETIME(3) NULL,
    `availableTo` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `brandId` VARCHAR(191) NULL,
    `vehicleCategoryId` VARCHAR(191) NULL,
    `advanceBookingDays` INTEGER NULL,
    `amenities` LONGTEXT NULL,
    `availableForAirport` BOOLEAN NOT NULL DEFAULT true,
    `availableForCorporate` BOOLEAN NOT NULL DEFAULT true,
    `availableForLocal` BOOLEAN NOT NULL DEFAULT true,
    `availableForOutstation` BOOLEAN NOT NULL DEFAULT true,
    `availableForPhotoshoot` BOOLEAN NOT NULL DEFAULT true,
    `availableForWedding` BOOLEAN NOT NULL DEFAULT true,
    `avgRating` DOUBLE NULL DEFAULT 4.5,
    `baseLocation` VARCHAR(191) NULL,
    `cancellationPolicy` VARCHAR(191) NULL,
    `chauffeurIncluded` BOOLEAN NOT NULL DEFAULT true,
    `chauffeurLanguages` LONGTEXT NULL,
    `chauffeurName` VARCHAR(191) NULL,
    `chauffeurPhone` VARCHAR(191) NULL,
    `chauffeurPhoto` VARCHAR(191) NULL,
    `fitnessValidity` DATETIME(3) NULL,
    `fuelType` VARCHAR(191) NULL,
    `insuranceProvider` VARCHAR(191) NULL,
    `insuranceValidity` DATETIME(3) NULL,
    `interiorColor` VARCHAR(191) NULL,
    `lastServiceDate` DATETIME(3) NULL,
    `luggageCapacity` INTEGER NULL,
    `luxuryCertified` BOOLEAN NOT NULL DEFAULT false,
    `luxuryFeatures` LONGTEXT NULL,
    `minimumBookingHours` INTEGER NULL,
    `operatingCities` LONGTEXT NULL,
    `parkingCity` VARCHAR(191) NULL,
    `permitType` VARCHAR(191) NULL,
    `safetyFeatures` LONGTEXT NULL,
    `seatingCapacity` INTEGER NULL,
    `totalRatings` INTEGER NULL DEFAULT 0,
    `totalTrips` INTEGER NULL DEFAULT 0,
    `transmission` VARCHAR(191) NULL,
    `vehicleCondition` VARCHAR(191) NULL,
    `vehicleDescription` TEXT NULL,
    `vehicleName` VARCHAR(191) NULL,

    INDEX `vendor_fleets_brandId_idx`(`brandId`),
    INDEX `vendor_fleets_isActive_idx`(`isActive`),
    INDEX `vendor_fleets_isAvailable_idx`(`isAvailable`),
    INDEX `vendor_fleets_serviceId_idx`(`serviceId`),
    INDEX `vendor_fleets_vehicleCategoryId_idx`(`vehicleCategoryId`),
    INDEX `vendor_fleets_vehicleModelId_idx`(`vehicleModelId`),
    INDEX `vendor_fleets_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_location_requests` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `localAddress` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_location_requests_locationId_idx`(`locationId`),
    INDEX `vendor_location_requests_reviewedById_fkey`(`reviewedById`),
    INDEX `vendor_location_requests_status_idx`(`status`),
    INDEX `vendor_location_requests_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `vendor_location_requests_vendorId_locationId_key`(`vendorId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_luxury_templates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `baseAmount` INTEGER NOT NULL,
    `chauffeurCharges` INTEGER NOT NULL DEFAULT 0,
    `decorationCharges` INTEGER NOT NULL DEFAULT 0,
    `perKmRate` INTEGER NULL,
    `perHourRate` INTEGER NULL,
    `includedKm` INTEGER NULL,
    `includedHours` INTEGER NULL,
    `extraKmRate` INTEGER NULL,
    `extraHourRate` INTEGER NULL,
    `inclusions` LONGTEXT NULL,
    `exclusions` LONGTEXT NULL,
    `termsConditions` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `tripTypes` LONGTEXT NULL,
    `occasions` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_luxury_templates_category_idx`(`category`),
    INDEX `vendor_luxury_templates_isActive_idx`(`isActive`),
    INDEX `vendor_luxury_templates_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_packers_templates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `shiftingTypes` LONGTEXT NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `baseRateHint` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_packers_templates_category_idx`(`category`),
    INDEX `vendor_packers_templates_isActive_idx`(`isActive`),
    INDEX `vendor_packers_templates_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_self_drive_templates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `vehicleTypes` LONGTEXT NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `dailyRateHint` DOUBLE NULL,
    `kmLimitPerDayHint` INTEGER NULL,
    `extraKmRateHint` DOUBLE NULL,
    `securityDepositHint` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_self_drive_templates_category_idx`(`category`),
    INDEX `vendor_self_drive_templates_isActive_idx`(`isActive`),
    INDEX `vendor_self_drive_templates_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_service_requests` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `experience` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_service_requests_reviewedById_fkey`(`reviewedById`),
    INDEX `vendor_service_requests_serviceId_idx`(`serviceId`),
    INDEX `vendor_service_requests_status_idx`(`status`),
    INDEX `vendor_service_requests_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `vendor_service_requests_vendorId_serviceId_key`(`vendorId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_staff` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `joiningDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `profilePhoto` VARCHAR(191) NULL,
    `role` ENUM('DRIVER', 'HELPER', 'MECHANIC', 'SUPERVISOR', 'OFFICE_STAFF') NOT NULL DEFAULT 'DRIVER',
    `status` ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `aadharNumber` VARCHAR(191) NULL,
    `aadharDocument` VARCHAR(191) NULL,
    `panNumber` VARCHAR(191) NULL,
    `panDocument` VARCHAR(191) NULL,
    `licenseNumber` VARCHAR(191) NULL,
    `licenseType` VARCHAR(191) NULL,
    `licenseExpiry` DATETIME(3) NULL,
    `licenseDocument` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `accountHolderName` VARCHAR(191) NULL,
    `salary` DOUBLE NOT NULL DEFAULT 0,
    `emergencyContact` VARCHAR(191) NULL,
    `emergencyPhone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `password` VARCHAR(191) NULL,

    UNIQUE INDEX `vendor_staff_email_key`(`email`),
    INDEX `vendor_staff_email_idx`(`email`),
    INDEX `vendor_staff_role_idx`(`role`),
    INDEX `vendor_staff_status_idx`(`status`),
    INDEX `vendor_staff_vendorId_idx`(`vendorId`),
    UNIQUE INDEX `vendor_staff_vendorId_phone_key`(`vendorId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_truck_templates` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `truckTypes` LONGTEXT NULL,
    `inclusions` LONGTEXT NOT NULL,
    `exclusions` LONGTEXT NOT NULL,
    `termsConditions` LONGTEXT NOT NULL,
    `ratePerKm` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vendor_truck_templates_category_idx`(`category`),
    INDEX `vendor_truck_templates_isActive_idx`(`isActive`),
    INDEX `vendor_truck_templates_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendors` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `businessType` VARCHAR(191) NULL,
    `ownerName` VARCHAR(191) NOT NULL,
    `gstNumber` VARCHAR(191) NULL,
    `panNumber` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `website` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `accountHolderName` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `isPhoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `approvedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `rating` DOUBLE NULL DEFAULT 0,
    `totalRatings` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vendors_email_key`(`email`),
    UNIQUE INDEX `vendors_phone_key`(`phone`),
    INDEX `vendors_approvedById_fkey`(`approvedById`),
    INDEX `vendors_email_idx`(`email`),
    INDEX `vendors_phone_idx`(`phone`),
    INDEX `vendors_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `web_vitals` (
    `id` VARCHAR(191) NOT NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `lcp` DOUBLE NULL,
    `fid` DOUBLE NULL,
    `cls` DOUBLE NULL,
    `fcp` DOUBLE NULL,
    `ttfb` DOUBLE NULL,
    `inp` DOUBLE NULL,
    `domLoad` DOUBLE NULL,
    `windowLoad` DOUBLE NULL,
    `resourceCount` INTEGER NULL,
    `resourceSize` INTEGER NULL,
    `connectionType` VARCHAR(191) NULL,
    `effectiveType` VARCHAR(191) NULL,
    `downlink` DOUBLE NULL,
    `rtt` INTEGER NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `browserVersion` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `screenWidth` INTEGER NULL,
    `screenHeight` INTEGER NULL,
    `sessionId` VARCHAR(191) NULL,
    `lcpRating` ENUM('GOOD', 'NEEDS_IMPROVEMENT', 'POOR') NULL,
    `fidRating` ENUM('GOOD', 'NEEDS_IMPROVEMENT', 'POOR') NULL,
    `clsRating` ENUM('GOOD', 'NEEDS_IMPROVEMENT', 'POOR') NULL,
    `fcpRating` ENUM('GOOD', 'NEEDS_IMPROVEMENT', 'POOR') NULL,
    `inpRating` ENUM('GOOD', 'NEEDS_IMPROVEMENT', 'POOR') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `web_vitals_createdAt_idx`(`createdAt`),
    INDEX `web_vitals_lcpRating_idx`(`lcpRating`),
    INDEX `web_vitals_pagePath_idx`(`pagePath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_details` ADD CONSTRAINT `bank_details_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_bookings` ADD CONSTRAINT `bike_bookings_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `bike_quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_bookings` ADD CONSTRAINT `bike_bookings_acceptedVendorId_fkey` FOREIGN KEY (`acceptedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_bookings` ADD CONSTRAINT `bike_bookings_assignedVendorId_fkey` FOREIGN KEY (`assignedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_bookings` ADD CONSTRAINT `bike_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_bookings` ADD CONSTRAINT `bike_bookings_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_bookings` ADD CONSTRAINT `bike_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `bike_quote_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_bookings` ADD CONSTRAINT `bike_bookings_requestedModelId_fkey` FOREIGN KEY (`requestedModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quote_requests` ADD CONSTRAINT `bike_quote_requests_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `bike_quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quote_requests` ADD CONSTRAINT `bike_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quote_requests` ADD CONSTRAINT `bike_quote_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quote_requests` ADD CONSTRAINT `bike_quote_requests_vehicleModelId_fkey` FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quotes` ADD CONSTRAINT `bike_quotes_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `bike_quote_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quotes` ADD CONSTRAINT `bike_quotes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `vendor_bike_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quotes` ADD CONSTRAINT `bike_quotes_vehicleModelId_fkey` FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quotes` ADD CONSTRAINT `bike_quotes_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bike_quotes` ADD CONSTRAINT `bike_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brands` ADD CONSTRAINT `brands_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brands` ADD CONSTRAINT `brands_vehicleCategoryId_fkey` FOREIGN KEY (`vehicleCategoryId`) REFERENCES `chauffeur_vehicle_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_bookings` ADD CONSTRAINT `bus_bookings_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `bus_quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_bookings` ADD CONSTRAINT `bus_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_bookings` ADD CONSTRAINT `bus_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `bus_quote_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_bookings` ADD CONSTRAINT `bus_bookings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_quote_requests` ADD CONSTRAINT `bus_quote_requests_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `bus_quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_quote_requests` ADD CONSTRAINT `bus_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_quote_requests` ADD CONSTRAINT `bus_quote_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_quotes` ADD CONSTRAINT `bus_quotes_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `bus_quote_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_quotes` ADD CONSTRAINT `bus_quotes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `vendor_bus_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bus_quotes` ADD CONSTRAINT `bus_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `car_bookings` ADD CONSTRAINT `car_bookings_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `self_drive_quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `car_bookings` ADD CONSTRAINT `car_bookings_acceptedVendorId_fkey` FOREIGN KEY (`acceptedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `car_bookings` ADD CONSTRAINT `car_bookings_assignedVendorId_fkey` FOREIGN KEY (`assignedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `car_bookings` ADD CONSTRAINT `car_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `car_bookings` ADD CONSTRAINT `car_bookings_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `car_bookings` ADD CONSTRAINT `car_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `self_drive_quote_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `chat_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_quick_replies` ADD CONSTRAINT `chat_quick_replies_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_bookings` ADD CONSTRAINT `chauffeur_bookings_acceptedVendorId_fkey` FOREIGN KEY (`acceptedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_bookings` ADD CONSTRAINT `chauffeur_bookings_assignedVendorId_fkey` FOREIGN KEY (`assignedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_bookings` ADD CONSTRAINT `chauffeur_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_bookings` ADD CONSTRAINT `chauffeur_bookings_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_city_pricing` ADD CONSTRAINT `chauffeur_city_pricing_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_city_pricing` ADD CONSTRAINT `chauffeur_city_pricing_vehicleCategoryId_fkey` FOREIGN KEY (`vehicleCategoryId`) REFERENCES `chauffeur_vehicle_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_local_packages` ADD CONSTRAINT `chauffeur_local_packages_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_local_packages` ADD CONSTRAINT `chauffeur_local_packages_vehicleCategoryId_fkey` FOREIGN KEY (`vehicleCategoryId`) REFERENCES `chauffeur_vehicle_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_route_packages` ADD CONSTRAINT `chauffeur_route_packages_fromLocationId_fkey` FOREIGN KEY (`fromLocationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_route_packages` ADD CONSTRAINT `chauffeur_route_packages_toLocationId_fkey` FOREIGN KEY (`toLocationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_route_packages` ADD CONSTRAINT `chauffeur_route_packages_vehicleCategoryId_fkey` FOREIGN KEY (`vehicleCategoryId`) REFERENCES `chauffeur_vehicle_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chauffeur_vehicle_categories` ADD CONSTRAINT `chauffeur_vehicle_categories_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `city_distance_matrix` ADD CONSTRAINT `city_distance_matrix_fromLocationId_fkey` FOREIGN KEY (`fromLocationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `city_distance_matrix` ADD CONSTRAINT `city_distance_matrix_toLocationId_fkey` FOREIGN KEY (`toLocationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_bookings` ADD CONSTRAINT `equipment_bookings_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `equipment_quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_bookings` ADD CONSTRAINT `equipment_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_bookings` ADD CONSTRAINT `equipment_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `equipment_quote_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_bookings` ADD CONSTRAINT `equipment_bookings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_quote_requests` ADD CONSTRAINT `equipment_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_quote_requests` ADD CONSTRAINT `equipment_quote_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_quotes` ADD CONSTRAINT `equipment_quotes_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `equipment_quote_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_quotes` ADD CONSTRAINT `equipment_quotes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `vendor_equipment_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_quotes` ADD CONSTRAINT `equipment_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet` ADD CONSTRAINT `fleet_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `fleet_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet` ADD CONSTRAINT `fleet_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `fleet_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_availability` ADD CONSTRAINT `fleet_availability_fleetId_fkey` FOREIGN KEY (`fleetId`) REFERENCES `fleet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_availability` ADD CONSTRAINT `fleet_availability_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `fleet_locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_location_rates` ADD CONSTRAINT `fleet_location_rates_fleetId_fkey` FOREIGN KEY (`fleetId`) REFERENCES `fleet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_location_rates` ADD CONSTRAINT `fleet_location_rates_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `fleet_locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_pricing` ADD CONSTRAINT `fleet_pricing_localPackageId_fkey` FOREIGN KEY (`localPackageId`) REFERENCES `local_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_pricing` ADD CONSTRAINT `fleet_pricing_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_pricing` ADD CONSTRAINT `fleet_pricing_tripTypeId_fkey` FOREIGN KEY (`tripTypeId`) REFERENCES `trip_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_pricing` ADD CONSTRAINT `fleet_pricing_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fleet_types` ADD CONSTRAINT `fleet_types_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `fleet_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `helpdesk_tickets` ADD CONSTRAINT `helpdesk_tickets_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `local_packages` ADD CONSTRAINT `local_packages_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `local_packages` ADD CONSTRAINT `local_packages_tripTypeId_fkey` FOREIGN KEY (`tripTypeId`) REFERENCES `trip_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bids` ADD CONSTRAINT `luxury_bids_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `luxury_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bids` ADD CONSTRAINT `luxury_bids_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bookings` ADD CONSTRAINT `luxury_bookings_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `luxury_quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bookings` ADD CONSTRAINT `luxury_bookings_acceptedVendorId_fkey` FOREIGN KEY (`acceptedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bookings` ADD CONSTRAINT `luxury_bookings_assignedVendorId_fkey` FOREIGN KEY (`assignedVendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bookings` ADD CONSTRAINT `luxury_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bookings` ADD CONSTRAINT `luxury_bookings_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_bookings` ADD CONSTRAINT `luxury_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `luxury_quote_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_quote_requests` ADD CONSTRAINT `luxury_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_quote_requests` ADD CONSTRAINT `luxury_quote_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_quotes` ADD CONSTRAINT `luxury_quotes_fleetId_fkey` FOREIGN KEY (`fleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_quotes` ADD CONSTRAINT `luxury_quotes_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `luxury_quote_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_quotes` ADD CONSTRAINT `luxury_quotes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `vendor_luxury_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_quotes` ADD CONSTRAINT `luxury_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_vendor_rates` ADD CONSTRAINT `luxury_vendor_rates_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luxury_vendor_rates` ADD CONSTRAINT `luxury_vendor_rates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_locations` ADD CONSTRAINT `manager_locations_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_locations` ADD CONSTRAINT `manager_locations_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_services` ADD CONSTRAINT `manager_services_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_services` ADD CONSTRAINT `manager_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_bookings` ADD CONSTRAINT `packers_bookings_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `packers_quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_bookings` ADD CONSTRAINT `packers_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_bookings` ADD CONSTRAINT `packers_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `packers_quote_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_bookings` ADD CONSTRAINT `packers_bookings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_quote_requests` ADD CONSTRAINT `packers_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_quote_requests` ADD CONSTRAINT `packers_quote_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_quotes` ADD CONSTRAINT `packers_quotes_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `packers_quote_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_quotes` ADD CONSTRAINT `packers_quotes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `vendor_packers_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packers_quotes` ADD CONSTRAINT `packers_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pages` ADD CONSTRAINT `pages_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `admin_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pricing` ADD CONSTRAINT `route_pricing_fromLocationId_fkey` FOREIGN KEY (`fromLocationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pricing` ADD CONSTRAINT `route_pricing_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pricing` ADD CONSTRAINT `route_pricing_toLocationId_fkey` FOREIGN KEY (`toLocationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pricing` ADD CONSTRAINT `route_pricing_tripTypeId_fkey` FOREIGN KEY (`tripTypeId`) REFERENCES `trip_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quote_requests` ADD CONSTRAINT `self_drive_quote_requests_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `self_drive_quotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quote_requests` ADD CONSTRAINT `self_drive_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quote_requests` ADD CONSTRAINT `self_drive_quote_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quote_requests` ADD CONSTRAINT `self_drive_quote_requests_vehicleModelId_fkey` FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quotes` ADD CONSTRAINT `self_drive_quotes_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `self_drive_quote_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quotes` ADD CONSTRAINT `self_drive_quotes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `vendor_self_drive_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quotes` ADD CONSTRAINT `self_drive_quotes_vehicleModelId_fkey` FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quotes` ADD CONSTRAINT `self_drive_quotes_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_drive_quotes` ADD CONSTRAINT `self_drive_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_meta` ADD CONSTRAINT `seo_meta_blogPostId_fkey` FOREIGN KEY (`blogPostId`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seo_meta` ADD CONSTRAINT `seo_meta_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_locations` ADD CONSTRAINT `service_locations_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_locations` ADD CONSTRAINT `service_locations_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_trip_types` ADD CONSTRAINT `service_trip_types_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_trip_types` ADD CONSTRAINT `service_trip_types_tripTypeId_fkey` FOREIGN KEY (`tripTypeId`) REFERENCES `trip_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `vendor_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_bookings` ADD CONSTRAINT `truck_bookings_acceptedQuoteId_fkey` FOREIGN KEY (`acceptedQuoteId`) REFERENCES `truck_quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_bookings` ADD CONSTRAINT `truck_bookings_assignedDriverId_fkey` FOREIGN KEY (`assignedDriverId`) REFERENCES `vendor_staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_bookings` ADD CONSTRAINT `truck_bookings_assignedVehicleId_fkey` FOREIGN KEY (`assignedVehicleId`) REFERENCES `vendor_fleets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_bookings` ADD CONSTRAINT `truck_bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_bookings` ADD CONSTRAINT `truck_bookings_quoteRequestId_fkey` FOREIGN KEY (`quoteRequestId`) REFERENCES `truck_quote_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_bookings` ADD CONSTRAINT `truck_bookings_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_quote_requests` ADD CONSTRAINT `truck_quote_requests_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_quote_requests` ADD CONSTRAINT `truck_quote_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_quotes` ADD CONSTRAINT `truck_quotes_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `truck_quote_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_quotes` ADD CONSTRAINT `truck_quotes_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `vendor_truck_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `truck_quotes` ADD CONSTRAINT `truck_quotes_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_model_locations` ADD CONSTRAINT `vehicle_model_locations_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_model_locations` ADD CONSTRAINT `vehicle_model_locations_vehicleModelId_fkey` FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_subServiceId_fkey` FOREIGN KEY (`subServiceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_vehicleCategoryId_fkey` FOREIGN KEY (`vehicleCategoryId`) REFERENCES `chauffeur_vehicle_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_approved_locations` ADD CONSTRAINT `vendor_approved_locations_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_approved_locations` ADD CONSTRAINT `vendor_approved_locations_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_approved_services` ADD CONSTRAINT `vendor_approved_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_approved_services` ADD CONSTRAINT `vendor_approved_services_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_bike_templates` ADD CONSTRAINT `vendor_bike_templates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_bus_templates` ADD CONSTRAINT `vendor_bus_templates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_documents` ADD CONSTRAINT `vendor_documents_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_documents` ADD CONSTRAINT `vendor_documents_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_equipment_templates` ADD CONSTRAINT `vendor_equipment_templates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_fleet_locations` ADD CONSTRAINT `vendor_fleet_locations_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_fleet_locations` ADD CONSTRAINT `vendor_fleet_locations_vendorFleetId_fkey` FOREIGN KEY (`vendorFleetId`) REFERENCES `vendor_fleets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_fleets` ADD CONSTRAINT `vendor_fleets_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_fleets` ADD CONSTRAINT `vendor_fleets_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_fleets` ADD CONSTRAINT `vendor_fleets_vehicleCategoryId_fkey` FOREIGN KEY (`vehicleCategoryId`) REFERENCES `chauffeur_vehicle_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_fleets` ADD CONSTRAINT `vendor_fleets_vehicleModelId_fkey` FOREIGN KEY (`vehicleModelId`) REFERENCES `vehicle_models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_fleets` ADD CONSTRAINT `vendor_fleets_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_location_requests` ADD CONSTRAINT `vendor_location_requests_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_location_requests` ADD CONSTRAINT `vendor_location_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_location_requests` ADD CONSTRAINT `vendor_location_requests_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_luxury_templates` ADD CONSTRAINT `vendor_luxury_templates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_packers_templates` ADD CONSTRAINT `vendor_packers_templates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_self_drive_templates` ADD CONSTRAINT `vendor_self_drive_templates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_service_requests` ADD CONSTRAINT `vendor_service_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_service_requests` ADD CONSTRAINT `vendor_service_requests_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_service_requests` ADD CONSTRAINT `vendor_service_requests_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_staff` ADD CONSTRAINT `vendor_staff_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_truck_templates` ADD CONSTRAINT `vendor_truck_templates_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
