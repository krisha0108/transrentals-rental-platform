-- Drop legacy vehicleId column from driver_vehicles
-- This column is not in Prisma schema and has a NOT NULL constraint
-- causing Null constraint violation on prisma.driver_vehicles.create()

ALTER TABLE `driver_vehicles` DROP COLUMN `vehicleId`;
