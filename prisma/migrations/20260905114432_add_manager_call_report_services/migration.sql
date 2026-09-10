-- CreateTable
CREATE TABLE `manager_call_report_services` (
  `id` varchar(191) NOT NULL,
  `callReportId` varchar(191) NOT NULL,
  `serviceId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `manager_call_report_services_callReportId_serviceId_key` (`callReportId`,`serviceId`),
  KEY `manager_call_report_services_serviceId_idx` (`serviceId`),
  KEY `manager_call_report_services_callReportId_idx` (`callReportId`),
  CONSTRAINT `manager_call_report_services_callReportId_fkey` FOREIGN KEY (`callReportId`) REFERENCES `manager_call_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `manager_call_report_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
