-- Quick Bike Availability Diagnostic
-- Run this in your MySQL client

SET @location_slug = 'ahmedabad';
SET @service_id = 'SVC_1';

-- TEST 1: Service Exists?
SELECT '1. SERVICE CHECK' as Test, 
       CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL - Service not found' END as Result
FROM services WHERE id = @service_id;

-- TEST 2: Location Exists?
SELECT '2. LOCATION CHECK' as Test,
       CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL - Location not found' END as Result
FROM locations WHERE slug = @location_slug AND isActive = 1;

-- TEST 3: Approved Vendors?
SELECT '3. VENDOR STATUS' as Test,
       CASE WHEN COUNT(*) > 0 THEN CONCAT('✓ ', COUNT(*), ' approved vendors') 
            ELSE '✗ FAIL - No approved vendors' END as Result
FROM vendors WHERE status = 'APPROVED';

-- TEST 4: Fleet Exists?
SELECT '4. FLEET CHECK' as Test,
       CASE WHEN COUNT(*) > 0 THEN CONCAT('✓ ', COUNT(*), ' active bikes')
            ELSE '✗ FAIL - No fleet added' END as Result
FROM vendor_fleets
WHERE serviceId = @service_id AND isActive = 1 AND isAvailable = 1;

-- TEST 5: Fleet Linked to Location?
SELECT '5. LOCATION LINK' as Test,
       CASE WHEN COUNT(*) > 0 THEN CONCAT('✓ ', COUNT(*), ' bikes at location')
            ELSE '✗ FAIL - Fleet not linked to location' END as Result
FROM vendor_fleet_locations vfl
JOIN locations l ON l.id = vfl.locationId
WHERE l.slug = @location_slug AND vfl.isActive = 1;

-- TEST 6: Final API Query (What page sees)
SELECT '6. FINAL CHECK' as Test,
       CASE WHEN COUNT(DISTINCT vm.id) > 0 
            THEN CONCAT('✓ SUCCESS - ', COUNT(DISTINCT vm.id), ' bikes available')
            ELSE '✗ FAIL - No bikes meet all criteria' END as Result
FROM vehicle_models vm
WHERE vm.serviceId = @service_id
  AND vm.isActive = 1
  AND EXISTS (
    SELECT 1 FROM vendor_fleets vf
    JOIN vendors v ON v.id = vf.vendorId
    JOIN vendor_fleet_locations vfl ON vfl.fleetId = vf.id
    JOIN locations l ON l.id = vfl.locationId
    WHERE vf.vehicleModelId = vm.id
      AND vf.isActive = 1
      AND vf.isAvailable = 1
      AND v.status = 'APPROVED'
      AND l.slug = @location_slug
      AND vfl.isActive = 1
  );

-- DETAILED REPORT
SELECT '--- DETAILED REPORT ---' as '';

SELECT
  v.businessName as Vendor,
  v.status as VendorStatus,
  vm.name as BikeModel,
  vf.registrationNumber as RegNo,
  vf.isActive as FleetActive,
  vf.isAvailable as FleetAvailable,
  GROUP_CONCAT(DISTINCT l.name) as Locations,
  COUNT(DISTINCT fp.id) as PricingCount
FROM vendors v
LEFT JOIN vendor_fleets vf ON vf.vendorId = v.id AND vf.serviceId = @service_id
LEFT JOIN vehicle_models vm ON vm.id = vf.vehicleModelId
LEFT JOIN vendor_fleet_locations vfl ON vfl.fleetId = vf.id
LEFT JOIN locations l ON l.id = vfl.locationId
LEFT JOIN fleet_pricing fp ON fp.fleetId = vf.id
GROUP BY v.id, vf.id
ORDER BY v.businessName, vm.name;
