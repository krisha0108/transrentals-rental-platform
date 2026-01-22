# Bug Fix: Service Location Assignment Failing (January 2026)

## Problem Summary

When assigning locations to services (e.g., transporter service), the API reported success but most locations were not persisting to the database.

**Symptoms:**
- API response: `{"success": true, "added": 392, "removed": 0}`
- After page reload: Only 99 locations shown as assigned
- No error messages or warnings

## Root Cause

The bug was in the ID generation logic for `service_locations` table. The code used:

```typescript
const lastSL = await prisma.service_locations.findFirst({
  orderBy: { id: 'desc' },  // ❌ ALPHABETICAL ORDERING!
  where: { id: { startsWith: 'SL_' } },
});
let nextIdNumber = parseInt(lastSL.id.replace('SL_', '')) + 1;
```

### The Issue

MySQL/Prisma's `orderBy: { id: 'desc' }` performs **alphabetical sorting** on VARCHAR/TEXT fields, NOT numeric sorting.

**Example:**
```
Alphabetical DESC order:  SL_99, SL_98, SL_97, ..., SL_2, SL_200, SL_20, SL_100, SL_10, SL_1
Correct numeric order:    SL_590, SL_589, SL_588, ..., SL_2, SL_1
```

### What Happened

1. Database had IDs: `SL_1` through `SL_590`
2. Code queried with alphabetical ordering → got `SL_99`
3. Code calculated next ID as `100`
4. Tried to create: `SL_100, SL_101, SL_102, ..., SL_491`
5. **Primary key violations** occurred (IDs already exist!)
6. `skipDuplicates: true` **silently ignored** these failures
7. Result: Almost no new records inserted

## Solution

Changed ID generation to fetch all IDs and find the maximum numerically:

```typescript
// ✅ FIXED VERSION
const allSLIds = await prisma.service_locations.findMany({
  where: { id: { startsWith: 'SL_' } },
  select: { id: true },
});

const maxIdNumber = allSLIds.reduce((max, sl) => {
  const num = parseInt(sl.id.replace('SL_', ''));
  return num > max ? num : max;
}, 0);

let nextIdNumber = maxIdNumber + 1;
```

## Files Fixed

1. **src/app/api/admin/services/[slug]/locations/route.ts**
   - Fixed `SL_` ID generation in POST endpoint

2. **src/app/api/admin/airports/route.ts**
   - Fixed `LOC_` ID generation (locations)
   - Fixed `SL_` ID generation (service_locations)
   - Fixed `CRP_` ID generation (chauffeur_route_packages)

## Testing

Run the verification script to confirm the fix:

```bash
node check-service-locations.js
```

**Expected output:**
```
Service: Truck Rental (SVC_4)
Active service_locations: 99

Last 5 IDs (alphabetical order - BUGGY):
  SL_99
  SL_98
  SL_97

Last 5 IDs (numeric order - CORRECT):
  SL_590 (590)
  SL_589 (589)
  SL_588 (588)

Highest ID number: 590
```

After fix, new IDs will start from `SL_591` (not `SL_100`).

## Prevention

**Never use `orderBy: { id: 'desc' }` on string ID fields!**

Instead:
1. Fetch all IDs and find max numerically (current solution)
2. Use database auto-increment (better for performance)
3. Use UUIDs/CUIDs (best for distributed systems)
4. Use Prisma's `@default(cuid())` or `@default(uuid())`

## Impact

This bug affected:
- Service location assignments (main issue)
- Airport creation (potential issue)
- Route package creation (potential issue)

All instances have been fixed and verified.

---

**Fixed by:** Claude Code
**Date:** January 22, 2026
**Verified:** Yes ✓
