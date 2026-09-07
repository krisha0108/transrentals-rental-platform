-- CreateTable
CREATE TABLE `manager_call_report_locations` (
  `id` varchar(191) NOT NULL,
  `callReportId` varchar(191) NOT NULL,
  `locationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `manager_call_report_locations_callReportId_locationId_key` (`callReportId`,`locationId`),
  KEY `manager_call_report_locations_locationId_idx` (`locationId`),
  KEY `manager_call_report_locations_callReportId_idx` (`callReportId`),
  CONSTRAINT `manager_call_report_locations_callReportId_fkey` FOREIGN KEY (`callReportId`) REFERENCES `manager_call_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `manager_call_report_locations_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
