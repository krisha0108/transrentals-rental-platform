-- Lets a property's public listing page generate a lead, same as a tour's
-- quote-request already does via `tourId`. Kept as a plain soft reference
-- (no FK constraint), matching how `tourId` is modeled on this table.
ALTER TABLE `travel_agent_leads`
  ADD COLUMN `propertyId` VARCHAR(191) NULL;
