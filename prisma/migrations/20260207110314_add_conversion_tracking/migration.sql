-- CreateTable
CREATE TABLE `conversion_events` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `eventType` ENUM('PAGE_VISIT', 'SEARCH', 'FILTER_APPLIED', 'QUOTE_VIEW', 'QUOTE_REQUEST', 'QUOTE_RECEIVED', 'BOOKING_INITIATED', 'BOOKING_COMPLETED', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'FORM_SUBMITTED', 'CTA_CLICKED', 'CHAT_OPENED', 'PHONE_CLICKED', 'EMAIL_CLICKED') NOT NULL,
    `eventData` JSON NULL,
    `pagePath` VARCHAR(191) NOT NULL,
    `pageTitle` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `medium` VARCHAR(191) NULL,
    `campaign` VARCHAR(191) NULL,
    `keyword` VARCHAR(191) NULL,
    `landingPage` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `bookingId` VARCHAR(191) NULL,
    `bookingType` VARCHAR(191) NULL,
    `bookingValue` DOUBLE NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conversion_events_sessionId_idx`(`sessionId`),
    INDEX `conversion_events_eventType_idx`(`eventType`),
    INDEX `conversion_events_timestamp_idx`(`timestamp`),
    INDEX `conversion_events_bookingId_idx`(`bookingId`),
    INDEX `conversion_events_keyword_idx`(`keyword`),
    INDEX `conversion_events_source_idx`(`source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_attribution` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `bookingType` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `firstSource` VARCHAR(191) NULL,
    `firstMedium` VARCHAR(191) NULL,
    `firstKeyword` VARCHAR(191) NULL,
    `firstLandingPage` VARCHAR(191) NULL,
    `firstVisit` DATETIME(3) NULL,
    `lastSource` VARCHAR(191) NULL,
    `lastMedium` VARCHAR(191) NULL,
    `lastKeyword` VARCHAR(191) NULL,
    `lastLandingPage` VARCHAR(191) NULL,
    `lastVisit` DATETIME(3) NULL,
    `totalSessions` INTEGER NOT NULL DEFAULT 1,
    `totalPageViews` INTEGER NOT NULL DEFAULT 0,
    `timeToConvert` INTEGER NULL,
    `touchpoints` JSON NULL,
    `bookingValue` DOUBLE NULL,
    `commission` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `booking_attribution_bookingId_key`(`bookingId`),
    INDEX `booking_attribution_bookingId_idx`(`bookingId`),
    INDEX `booking_attribution_bookingType_idx`(`bookingType`),
    INDEX `booking_attribution_firstSource_idx`(`firstSource`),
    INDEX `booking_attribution_lastSource_idx`(`lastSource`),
    INDEX `booking_attribution_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_flow` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `fromPage` VARCHAR(191) NOT NULL,
    `toPage` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `device` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `timeOnPage` INTEGER NULL,

    INDEX `user_flow_sessionId_idx`(`sessionId`),
    INDEX `user_flow_fromPage_idx`(`fromPage`),
    INDEX `user_flow_toPage_idx`(`toPage`),
    INDEX `user_flow_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `keyword_performance` (
    `id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `visitors` INTEGER NOT NULL DEFAULT 0,
    `avgTimeOnSite` INTEGER NULL,
    `bounceRate` DOUBLE NULL,
    `pagesPerSession` DOUBLE NULL,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NULL,
    `revenue` DOUBLE NULL,
    `avgPosition` DOUBLE NULL,
    `topPage` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `keyword_performance_keyword_idx`(`keyword`),
    INDEX `keyword_performance_date_idx`(`date`),
    INDEX `keyword_performance_conversions_idx`(`conversions`),
    UNIQUE INDEX `keyword_performance_keyword_date_key`(`keyword`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funnel_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `funnelName` VARCHAR(191) NOT NULL,
    `step` VARCHAR(191) NOT NULL,
    `stepOrder` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `visitors` INTEGER NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `dropOffs` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NULL,
    `avgTimeInStep` INTEGER NULL,
    `topSource` VARCHAR(191) NULL,
    `topKeyword` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `funnel_analytics_funnelName_idx`(`funnelName`),
    INDEX `funnel_analytics_date_idx`(`date`),
    INDEX `funnel_analytics_stepOrder_idx`(`stepOrder`),
    UNIQUE INDEX `funnel_analytics_funnelName_step_date_key`(`funnelName`, `step`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
