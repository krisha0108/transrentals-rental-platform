-- Truck rental quote requests — full quotation overhaul.
-- Adds 11 new fields covering body type, pincodes, expected delivery,
-- trip direction, multiple stops, receiver, and POD. All nullable / defaulted
-- so existing rows remain valid.

ALTER TABLE `truck_quote_requests`
  ADD COLUMN `pickupPincode` VARCHAR(191) NULL,
  ADD COLUMN `dropPincode` VARCHAR(191) NULL,
  ADD COLUMN `expectedDeliveryDate` DATETIME(3) NULL,
  ADD COLUMN `expectedDeliveryTime` VARCHAR(191) NULL,
  ADD COLUMN `truckBodyType` ENUM('OPEN','CLOSED_BODY','CONTAINER','TRAILER','LCV','REFRIGERATED','FLATBED','OTHER') NULL,
  ADD COLUMN `tripDirection` ENUM('ONE_WAY','ROUND_TRIP') NOT NULL DEFAULT 'ONE_WAY',
  ADD COLUMN `hasMultipleStops` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `multipleStopsDetails` TEXT NULL,
  ADD COLUMN `receiverName` VARCHAR(191) NULL,
  ADD COLUMN `receiverPhone` VARCHAR(191) NULL,
  ADD COLUMN `requiresPOD` BOOLEAN NOT NULL DEFAULT false;
