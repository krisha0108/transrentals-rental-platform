-- Luxury car booking: capture the extra details vendors need to give an
-- accurate quotation (especially for weddings). These were collected in the
-- UI gap analysis but had no DB columns.
--
--   needDressCode  -> Driver dress code required (Yes/No)
--   pickupPincode  -> Pickup location pincode
--   dropPincode    -> Drop location pincode
--   packageType    -> Duty package (e.g. "8hr/80km", "12hr/120km", "Full Day", "Outstation")
--   estimatedKm    -> Estimated total kilometres (Local / Outstation)

ALTER TABLE `luxury_bookings`
  ADD COLUMN `needDressCode` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `pickupPincode` VARCHAR(191) NULL,
  ADD COLUMN `dropPincode`   VARCHAR(191) NULL,
  ADD COLUMN `packageType`   VARCHAR(191) NULL,
  ADD COLUMN `estimatedKm`   INT NULL;
