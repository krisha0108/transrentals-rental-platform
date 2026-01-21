-- Insert bike brands if not exists
INSERT IGNORE INTO brands (id, name, slug, serviceId, isActive, createdAt, updatedAt)
VALUES
  ('BRAND_BIKE_HONDA', 'Honda', 'honda-bike', 'SVC_1', 1, NOW(), NOW()),
  ('BRAND_BIKE_TVS', 'TVS', 'tvs-bike', 'SVC_1', 1, NOW(), NOW()),
  ('BRAND_BIKE_RE', 'Royal Enfield', 'royal-enfield-bike', 'SVC_1', 1, NOW(), NOW());

-- Insert car brands for self-drive if not exists
INSERT IGNORE INTO brands (id, name, slug, serviceId, isActive, createdAt, updatedAt)
VALUES
  ('BRAND_CAR_MARUTI', 'Maruti Suzuki', 'maruti-suzuki', 'SVC_2', 1, NOW(), NOW()),
  ('BRAND_CAR_HYUNDAI', 'Hyundai', 'hyundai-car', 'SVC_2', 1, NOW(), NOW()),
  ('BRAND_CAR_TATA', 'Tata Motors', 'tata-motors-car', 'SVC_2', 1, NOW(), NOW()),
  ('BRAND_CAR_MAHINDRA', 'Mahindra', 'mahindra-car', 'SVC_2', 1, NOW(), NOW());

-- Insert bike models
INSERT IGNORE INTO vehicle_models (id, name, slug, serviceId, brandId, engineCC, fuelType, transmission, basePricePerDay, isPopular, isActive, rating, createdAt, updatedAt)
VALUES
  ('VM_BIKE_ACTIVA', 'Activa 6G', 'honda-activa-6g', 'SVC_1', 'BRAND_BIKE_HONDA', 110, 'Petrol', 'Automatic', 299, 1, 1, 4.5, NOW(), NOW()),
  ('VM_BIKE_DIO', 'Dio', 'honda-dio', 'SVC_1', 'BRAND_BIKE_HONDA', 110, 'Petrol', 'Automatic', 299, 0, 1, 4.3, NOW(), NOW()),
  ('VM_BIKE_JUPITER', 'Jupiter', 'tvs-jupiter', 'SVC_1', 'BRAND_BIKE_TVS', 110, 'Petrol', 'Automatic', 279, 0, 1, 4.4, NOW(), NOW()),
  ('VM_BIKE_APACHE160', 'Apache RTR 160', 'tvs-apache-rtr-160', 'SVC_1', 'BRAND_BIKE_TVS', 160, 'Petrol', 'Manual', 549, 1, 1, 4.5, NOW(), NOW()),
  ('VM_BIKE_CLASSIC350', 'Classic 350', 'royal-enfield-classic-350', 'SVC_1', 'BRAND_BIKE_RE', 349, 'Petrol', 'Manual', 1399, 1, 1, 4.7, NOW(), NOW()),
  ('VM_BIKE_HIMALAYAN', 'Himalayan', 'royal-enfield-himalayan', 'SVC_1', 'BRAND_BIKE_RE', 411, 'Petrol', 'Manual', 1699, 1, 1, 4.6, NOW(), NOW());

-- Insert self-drive car models
INSERT IGNORE INTO vehicle_models (id, name, slug, serviceId, brandId, fuelType, transmission, seatingCapacity, basePricePerDay, isActive, rating, createdAt, updatedAt)
VALUES
  ('VM_CAR_SWIFT', 'Swift', 'maruti-swift', 'SVC_2', 'BRAND_CAR_MARUTI', 'Petrol', 'Manual', 5, 1499, 1, 4.5, NOW(), NOW()),
  ('VM_CAR_BALENO', 'Baleno', 'maruti-baleno', 'SVC_2', 'BRAND_CAR_MARUTI', 'Petrol', 'Manual', 5, 1699, 1, 4.4, NOW(), NOW()),
  ('VM_CAR_DZIRE', 'Dzire', 'maruti-dzire', 'SVC_2', 'BRAND_CAR_MARUTI', 'Petrol', 'Manual', 5, 1599, 1, 4.5, NOW(), NOW()),
  ('VM_CAR_I20', 'i20', 'hyundai-i20', 'SVC_2', 'BRAND_CAR_HYUNDAI', 'Petrol', 'Manual', 5, 1799, 1, 4.6, NOW(), NOW()),
  ('VM_CAR_CRETA', 'Creta', 'hyundai-creta', 'SVC_2', 'BRAND_CAR_HYUNDAI', 'Petrol', 'Automatic', 5, 2999, 1, 4.7, NOW(), NOW()),
  ('VM_CAR_NEXON', 'Nexon', 'tata-nexon', 'SVC_2', 'BRAND_CAR_TATA', 'Petrol', 'Manual', 5, 2499, 1, 4.6, NOW(), NOW()),
  ('VM_CAR_THAR', 'Thar', 'mahindra-thar', 'SVC_2', 'BRAND_CAR_MAHINDRA', 'Diesel', 'Manual', 4, 3999, 1, 4.8, NOW(), NOW()),
  ('VM_CAR_XUV700', 'XUV700', 'mahindra-xuv700', 'SVC_2', 'BRAND_CAR_MAHINDRA', 'Diesel', 'Automatic', 7, 4999, 1, 4.8, NOW(), NOW());

SELECT 'Done! Models seeded.' AS status;
