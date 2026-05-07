-- AlterTable: add VILLAGE to locations.type enum
ALTER TABLE `locations`
  MODIFY COLUMN `type` ENUM('COUNTRY', 'STATE', 'UNION_TERRITORY', 'CITY', 'AREA', 'AIRPORT', 'VILLAGE') NOT NULL;
