-- AlterTable: vendor_presence moves from one row per vendor to one row per
-- (vendorId, platform), so a vendor active on both web and app at once gets
-- two independent rows instead of the two heartbeats overwriting each other.
-- Safe on existing data: today there is at most one row per vendorId, so no
-- (vendorId, platform) pair can collide.
ALTER TABLE `vendor_presence` DROP PRIMARY KEY;
ALTER TABLE `vendor_presence` ADD PRIMARY KEY (`vendorId`, `platform`);

-- CreateIndex
CREATE INDEX `vendor_presence_vendorId_idx` ON `vendor_presence`(`vendorId`);
