-- Fix QR Code and Image Display Issues
-- Run this SQL script to clean up invalid data

-- 1. Fix invalid QR code URLs in bank_details
-- Set invalid QR URLs to NULL so auto-generation works
UPDATE bank_details
SET upiQrCode = NULL
WHERE upiQrCode IS NOT NULL
  AND upiQrCode != ''
  AND upiQrCode NOT LIKE 'http%'
  AND upiQrCode NOT LIKE '/uploads/%';

-- 2. Check current image paths in vehicle_models
SELECT
    id,
    name,
    sideImage,
    CASE
        WHEN sideImage IS NULL THEN 'No image'
        WHEN sideImage LIKE 'http%' THEN 'External URL'
        WHEN sideImage LIKE '/%' THEN 'Absolute path (OK)'
        ELSE CONCAT('Relative path - needs fixing: ', sideImage)
    END as status
FROM vehicle_models
WHERE serviceId = 'SVC_1'
ORDER BY sideImage;

-- 3. Fix relative image paths to absolute paths
-- If sideImage doesn't start with /, add it
UPDATE vehicle_models
SET sideImage = CONCAT('/', sideImage)
WHERE sideImage IS NOT NULL
  AND sideImage != ''
  AND sideImage NOT LIKE 'http%'
  AND sideImage NOT LIKE '/%';

-- 4. Check fleet images in vendor_fleets
SELECT
    id,
    vehicleModelId,
    images,
    CASE
        WHEN images IS NULL THEN 'No images'
        WHEN images = 'null' THEN 'String null - needs fixing'
        WHEN images = '[]' THEN 'Empty array'
        ELSE 'Has images'
    END as status
FROM vendor_fleets
WHERE serviceId = 'SVC_1'
LIMIT 20;

-- 5. Fix 'null' string values in vendor_fleets.images
UPDATE vendor_fleets
SET images = NULL
WHERE images = 'null' OR images = '[]' OR images = '';

-- 6. Verify bank_details after fix
SELECT
    id,
    bankName,
    upiId,
    upiQrCode,
    CASE
        WHEN upiId IS NOT NULL AND upiId != '' THEN 'UPI ID exists - QR will generate'
        WHEN upiQrCode IS NOT NULL AND upiQrCode LIKE 'http%' THEN 'Valid QR URL'
        ELSE 'No UPI payment method'
    END as qr_status
FROM bank_details
ORDER BY isPrimary DESC;
