-- CreateTable
CREATE TABLE `manager_call_reports` (
  `id` varchar(191) NOT NULL,
  `managerId` varchar(191) NOT NULL,
  `vendorId` varchar(191) DEFAULT NULL,
  `vendorName` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `status` enum('VENDOR_CREATED','INTERESTED','FOLLOW_UP','NOT_INTERESTED','NO_ANSWER','CALLBACK_LATER','WRONG_NUMBER','CONVERTED') NOT NULL DEFAULT 'FOLLOW_UP',
  `notes` text DEFAULT NULL,
  `callDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `manager_call_reports_managerId_callDate_idx` (`managerId`,`callDate`),
  KEY `manager_call_reports_vendorId_idx` (`vendorId`),
  KEY `manager_call_reports_status_idx` (`status`),
  CONSTRAINT `manager_call_reports_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `manager_call_reports_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
