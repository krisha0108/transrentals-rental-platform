-- One review per completed PROPERTY booking, submitted by the customer
-- through their existing booking-share link. `rating`/`totalRatings` on
-- `travel_agent_properties` stay as the precomputed aggregate (updated
-- whenever a review is written) so the public listing/detail pages don't
-- need to aggregate on every read.
CREATE TABLE `travel_agent_property_reviews` (
  `id` VARCHAR(191) NOT NULL,
  `propertyId` VARCHAR(191) NOT NULL,
  `bookingId` VARCHAR(191) NOT NULL,
  `customerName` VARCHAR(191) NOT NULL,
  `rating` INTEGER NOT NULL,
  `comment` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `travel_agent_property_reviews_bookingId_key` (`bookingId`),
  INDEX `travel_agent_property_reviews_propertyId_idx` (`propertyId`),

  CONSTRAINT `travel_agent_property_reviews_propertyId_fkey`
    FOREIGN KEY (`propertyId`) REFERENCES `travel_agent_properties`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `travel_agent_property_reviews_bookingId_fkey`
    FOREIGN KEY (`bookingId`) REFERENCES `travel_agent_bookings`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
