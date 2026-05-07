-- Packers & movers quote requests — full quotation overhaul.
-- Adds 18 new fields covering shifting scope, pincodes, delivery, receiver,
-- vehicle/logistics, inventory, multi-stop, and POD. All nullable / defaulted
-- so existing rows remain valid.

ALTER TABLE `packers_quote_requests`
  ADD COLUMN `expectedDeliveryDate` DATETIME(3) NULL,
  ADD COLUMN `expectedDeliveryTime` VARCHAR(191) NULL,
  ADD COLUMN `shiftingScope` ENUM('LOCAL','DOMESTIC','INTERCITY') NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN `pickupPincode` VARCHAR(191) NULL,
  ADD COLUMN `dropPincode` VARCHAR(191) NULL,
  ADD COLUMN `receiverName` VARCHAR(191) NULL,
  ADD COLUMN `receiverPhone` VARCHAR(191) NULL,
  ADD COLUMN `vehicleType` ENUM('SHARED','DEDICATED') NOT NULL DEFAULT 'DEDICATED',
  ADD COLUMN `partLoadAccepted` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `needLoading` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `needUnloading` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `labourCount` INT NULL,
  ADD COLUMN `boxesCount` INT NULL,
  ADD COLUMN `bagsCount` INT NULL,
  ADD COLUMN `estimatedWeight` DOUBLE NULL,
  ADD COLUMN `estimatedVolumeCubFt` DOUBLE NULL,
  ADD COLUMN `hasMultipleStops` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `multipleStopsDetails` TEXT NULL,
  ADD COLUMN `requiresPOD` BOOLEAN NOT NULL DEFAULT false;
