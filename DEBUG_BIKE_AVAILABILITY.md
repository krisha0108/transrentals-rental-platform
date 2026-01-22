# 🐛 Debug: No Bikes Available Issue

## Problem
URL: `/bike-on-rent/ahmedabad/bikes?city=ahmedabad&pickupDate=2026-01-31`
Error: "No Bikes Available" even though vendor has added fleet

---

## Diagnostic Queries

Run these in your database to find the issue:

### Step 1: Check if Bike Service Exists

```sql
-- Check bike rental service
SELECT * FROM services WHERE id = 'SVC_1';

-- Expected: Should return bike rental service
-- If not found: Service ID is wrong or service doesn't exist
```

### Step 2: Check if Location Exists

```sql
-- Check Ahmedabad location
SELECT * FROM locations
WHERE slug = 'ahmedabad'
  OR name LIKE '%ahmedabad%';

-- Expected: Should return location with isActive = 1
-- Note the location ID for next queries
```

### Step 3: Check Vendor Status

```sql
-- Check all vendors
SELECT id, businessName, status, isActive
FROM vendors;

-- Expected: Vendors should have status = 'APPROVED'
-- If status is 'PENDING' or 'REJECTED', bikes won't show
```

### Step 4: Check Vendor Fleets

```sql
-- Check if vendor has added bikes
SELECT
  vf.id,
  vf.vendorId,
  v.businessName,
  vf.vehicleModelId,
  vm.name as modelName,
  vf.isActive,
  vf.isAvailable,
  vf.serviceId
FROM vendor_fleets vf
LEFT JOIN vendors v ON v.id = vf.vendorId
LEFT JOIN vehicle_models vm ON vm.id = vf.vehicleModelId
WHERE vf.serviceId = 'SVC_1';

-- Expected: Should return fleet entries
-- Check:
-- - isActive = 1
-- - isAvailable = 1
-- - vendorId exists
-- - vehicleModelId is valid
```

### Step 5: Check Fleet Locations

```sql
-- Check if fleet is linked to location
SELECT
  vfl.id,
  vfl.fleetId,
  vfl.locationId,
  l.name as locationName,
  vfl.isActive,
  vf.registrationNumber
FROM vendor_fleet_locations vfl
LEFT JOIN vendor_fleets vf ON vf.id = vfl.fleetId
LEFT JOIN locations l ON l.id = vfl.locationId
WHERE vfl.locationId = (SELECT id FROM locations WHERE slug = 'ahmedabad' LIMIT 1);

-- Expected: Should return fleet-location mappings
-- If empty: Fleet is not linked to Ahmedabad location!
```

### Step 6: Check Vehicle Models

```sql
-- Check if bike models exist
SELECT
  vm.id,
  vm.name,
  vm.serviceId,
  vm.isActive,
  vm.brandId,
  b.name as brandName
FROM vehicle_models vm
LEFT JOIN brands b ON b.id = vm.brandId
WHERE vm.serviceId = 'SVC_1'
  AND vm.isActive = 1;

-- Expected: Should return active bike models
-- If empty: No bike models in database!
```

### Step 7: Check Fleet Pricing

```sql
-- Check if pricing is set
SELECT
  fp.id,
  fp.fleetId,
  fp.perDayRate,
  fp.deposit,
  vf.registrationNumber
FROM fleet_pricing fp
LEFT JOIN vendor_fleets vf ON vf.id = fp.fleetId
WHERE vf.serviceId = 'SVC_1';

-- Expected: Should return pricing data
-- If empty: No pricing set for bikes!
```

---

## Common Issues & Solutions

### Issue 1: Vendor Status Not APPROVED ❌

**Symptom:**
```sql
SELECT status FROM vendors WHERE id = 'your-vendor-id';
-- Returns: PENDING or REJECTED
```

**Solution:**
```sql
-- Approve the vendor
UPDATE vendors
SET status = 'APPROVED'
WHERE id = 'your-vendor-id';
```

---

### Issue 2: Fleet Not Linked to Location ❌

**Symptom:**
```sql
-- No results from Step 5 query
SELECT COUNT(*) FROM vendor_fleet_locations
WHERE locationId = (SELECT id FROM locations WHERE slug = 'ahmedabad');
-- Returns: 0
```

**Solution:**
```sql
-- Link fleet to location
-- Replace 'your-fleet-id' and 'location-id'
INSERT INTO vendor_fleet_locations (id, fleetId, locationId, isActive, createdAt, updatedAt)
VALUES (
  CONCAT('c', SUBSTRING(MD5(RAND()), 1, 24)),  -- Generate unique ID
  'your-fleet-id',
  (SELECT id FROM locations WHERE slug = 'ahmedabad'),
  1,
  NOW(),
  NOW()
);
```

---

### Issue 3: Fleet Not Active/Available ❌

**Symptom:**
```sql
SELECT isActive, isAvailable FROM vendor_fleets WHERE id = 'your-fleet-id';
-- Returns: isActive = 0 OR isAvailable = 0
```

**Solution:**
```sql
-- Activate the fleet
UPDATE vendor_fleets
SET isActive = 1, isAvailable = 1
WHERE id = 'your-fleet-id';
```

---

### Issue 4: Service ID Mismatch ❌

**Symptom:**
```sql
-- Service doesn't exist
SELECT * FROM services WHERE id = 'SVC_1';
-- Returns: Empty
```

**Solution:**
```sql
-- Check what service IDs exist
SELECT id, name, slug FROM services WHERE slug LIKE '%bike%';

-- If bike service has different ID, update constant in code
-- File: src/lib/constants/booking-services.ts
-- Change: BIKE_RENTAL: 'SVC_1' → BIKE_RENTAL: 'actual-id-from-db'
```

---

### Issue 5: No Pricing Set ❌

**Symptom:**
```sql
-- No pricing
SELECT COUNT(*) FROM fleet_pricing WHERE fleetId = 'your-fleet-id';
-- Returns: 0
```

**Solution:**
```sql
-- Add pricing
INSERT INTO fleet_pricing (id, fleetId, perDayRate, deposit, createdAt, updatedAt)
VALUES (
  CONCAT('c', SUBSTRING(MD5(RAND()), 1, 24)),
  'your-fleet-id',
  500.00,  -- Daily rate
  1000.00, -- Deposit
  NOW(),
  NOW()
);
```

---

## Quick Fix Script

Run this complete diagnostic:

```sql
-- COMPLETE DIAGNOSTIC SCRIPT
SET @location_slug = 'ahmedabad';
SET @service_id = 'SVC_1';

-- 1. Service Check
SELECT 'SERVICE CHECK' as step,
       CASE WHEN COUNT(*) > 0 THEN 'PASS ✓' ELSE 'FAIL ✗' END as status
FROM services WHERE id = @service_id;

-- 2. Location Check
SELECT 'LOCATION CHECK' as step,
       CASE WHEN COUNT(*) > 0 THEN 'PASS ✓' ELSE 'FAIL ✗' END as status,
       GROUP_CONCAT(name) as locations_found
FROM locations WHERE slug = @location_slug AND isActive = 1;

-- 3. Approved Vendors Check
SELECT 'APPROVED VENDORS' as step,
       CONCAT(COUNT(*), ' vendors') as status,
       GROUP_CONCAT(businessName) as vendor_names
FROM vendors WHERE status = 'APPROVED';

-- 4. Fleet Check
SELECT 'FLEET CHECK' as step,
       CONCAT(COUNT(*), ' bikes in fleet') as status
FROM vendor_fleets vf
WHERE vf.serviceId = @service_id
  AND vf.isActive = 1
  AND vf.isAvailable = 1;

-- 5. Fleet-Location Link Check
SELECT 'FLEET-LOCATION LINK' as step,
       CONCAT(COUNT(*), ' bikes at location') as status
FROM vendor_fleet_locations vfl
WHERE vfl.locationId = (SELECT id FROM locations WHERE slug = @location_slug LIMIT 1)
  AND vfl.isActive = 1;

-- 6. Complete Availability Check (What API sees)
SELECT 'FINAL API QUERY' as step,
       CONCAT(COUNT(DISTINCT vm.id), ' available bikes') as status
FROM vehicle_models vm
WHERE vm.serviceId = @service_id
  AND vm.isActive = 1
  AND EXISTS (
    SELECT 1 FROM vendor_fleets vf
    WHERE vf.vehicleModelId = vm.id
      AND vf.isActive = 1
      AND vf.isAvailable = 1
      AND EXISTS (
        SELECT 1 FROM vendors v
        WHERE v.id = vf.vendorId
          AND v.status = 'APPROVED'
      )
      AND EXISTS (
        SELECT 1 FROM vendor_fleet_locations vfl
        WHERE vfl.fleetId = vf.id
          AND vfl.locationId = (SELECT id FROM locations WHERE slug = @location_slug LIMIT 1)
          AND vfl.isActive = 1
      )
  );
```

---

## Expected Results

✅ **All checks should PASS**:

```
SERVICE CHECK: PASS ✓
LOCATION CHECK: PASS ✓ (Ahmedabad)
APPROVED VENDORS: 1+ vendors
FLEET CHECK: 1+ bikes in fleet
FLEET-LOCATION LINK: 1+ bikes at location
FINAL API QUERY: 1+ available bikes
```

❌ **If any check FAILS**, that's your issue!

---

## Next Steps

1. **Run the diagnostic script** above
2. **Find which check fails**
3. **Apply the corresponding solution**
4. **Refresh the page** - bikes should appear!

---

## Quick Test After Fix

```bash
# Test the API directly
curl http://localhost:3000/api/bikes/ahmedabad

# Should return JSON with bikes array
# If bikes array is empty [], issue still exists
# If bikes array has data, SUCCESS! ✓
```

