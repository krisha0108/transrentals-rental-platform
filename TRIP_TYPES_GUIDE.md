# Trip Types - Complete Guide

## What are Trip Types?

**Trip Types** define different booking patterns/templates that your services can offer to customers. They control:
- What information customers must provide (pickup/drop locations, return date, etc.)
- How booking forms behave
- What pricing rules apply

## Examples of Trip Types

### 1. **One-Way Trip**
- Customer needs: From Location → To Location
- Use case: City A to City B transfer
- Fields required: `requiresFromLocation: true`, `requiresToLocation: true`, `requiresReturnDate: false`

### 2. **Round Trip**
- Customer needs: From Location → To Location → Return Date
- Use case: Airport pickup and return after 3 days
- Fields required: `requiresFromLocation: true`, `requiresToLocation: true`, `requiresReturnDate: true`

### 3. **Local / Hourly**
- Customer needs: Just one location + duration
- Use case: Local city rides, 8-hour rental within city
- Fields required: `requiresFromLocation: true`, `requiresToLocation: false`, `requiresReturnDate: false`

### 4. **Outstation**
- Customer needs: From Location → Multiple destinations (managed via itinerary)
- Use case: Multi-day road trip with flexible route
- Fields required: Custom configuration

## How Trip Types Work in Your System

```
trip_types (Master Table)
    ↓
service_trip_types (Junction Table)
    ↓
Services (Bus, Car, Bike Rental)
```

### Master Trip Types Table
Location: `/admin/booking/trip-types`

This is where you create and manage **all available trip type templates**. Think of this as your "library" of booking patterns.

**Fields:**
- **Name**: Display name (e.g., "One Way", "Round Trip")
- **Slug**: URL-friendly identifier (e.g., "one-way", "round-trip")
- **Description**: Explains when to use this trip type
- **Icon**: Optional icon name
- **requiresFromLocation**: Does customer need to specify pickup location? (usually `true`)
- **requiresToLocation**: Does customer need to specify drop location?
- **requiresReturnDate**: Does customer need to specify return date/time?
- **isActive**: Can admins use this trip type?
- **displayOrder**: Order in which trip types appear in lists

### Service-Specific Trip Types
Location: `/admin/services/{service-slug}/trip-types`

This is where you **enable/disable specific trip types for each service**.

**Example:**
- Bus Rental service might support: "One-Way", "Round-Trip", "Multi-City"
- Bike Rental might only support: "Hourly", "Daily"
- Each service can pick which trip types make sense for their business model

## Where Trip Types Are Used

### 1. **Customer Booking Forms**
When a customer wants to book a bus/car/bike, the form fields change based on trip type:
- One-way: Shows "From" and "To" fields
- Local: Only shows "Location" field
- Round-trip: Shows "From", "To", and "Return Date"

### 2. **Vendor Fleet Pricing**
Vendors can set different prices based on trip type:
```sql
fleet_pricing table has tripTypeId column
```
Example: A vendor might charge:
- ₹500/day for hourly rentals
- ₹800/day for one-way trips
- ₹700/day for round trips

### 3. **Quote Requests**
When customers request quotes, trip type determines:
- What information they must provide
- How vendors calculate pricing
- What fields appear in vendor dashboard

## How to Manage Trip Types

### Step 1: Create Master Trip Types

1. Go to `/admin/booking/trip-types`
2. Click "Add Trip Type"
3. Fill in:
   ```
   Name: One Way
   Slug: one-way (auto-generated)
   Description: Single journey from point A to B
   Requires From Location: ✓ Yes
   Requires To Location: ✓ Yes
   Requires Return Date: ✗ No
   ```
4. Click Save

### Step 2: Enable for Specific Services

1. Go to `/admin/services/bus-rental/trip-types`
2. You'll see all master trip types listed
3. Toggle ON the ones this service should support
4. Example: Enable "One Way" and "Round Trip" for Bus Rental

### Step 3: Vendors Set Pricing

When vendors add their fleet:
1. They select which trip types they support
2. They set prices for each trip type
3. Customers see the lowest price across all vendors

## Database Structure

### trip_types (Master)
```sql
id                   -- Unique ID
name                 -- Display name (e.g., "One Way")
slug                 -- URL slug (e.g., "one-way")
description          -- Explanation text
icon                 -- Icon name (optional)
requiresFromLocation -- Boolean
requiresToLocation   -- Boolean
requiresReturnDate   -- Boolean
isActive             -- Boolean
displayOrder         -- Sort order
```

### service_trip_types (Junction)
```sql
id                   -- Unique ID
serviceId            -- Which service (bus-rental, car-rental, etc.)
tripTypeId           -- Which trip type
isActive             -- Is it enabled for this service?
basePriceMultiplier  -- Optional price adjustment
```

### fleet_pricing (Vendor Pricing)
```sql
id                   -- Unique ID
fleetId              -- Which vehicle
tripTypeId           -- Which trip type this price applies to
perDayRate           -- Daily rate
perKmRate            -- Per KM rate (optional)
deposit              -- Security deposit
```

## Common Trip Type Configurations

### For Bus Rental Service
```
✓ One Way Trip
✓ Round Trip
✓ Multi-City Tour
✗ Hourly Rental (buses usually aren't hourly)
```

### For Bike Rental Service
```
✓ Daily Rental
✓ Weekly Rental
✓ Monthly Rental
✗ One Way (bikes usually returned to same location)
```

### For Car Rental Service
```
✓ Self-Drive Daily
✓ Self-Drive Weekly
✓ Chauffeur Driven - Hourly
✓ Chauffeur Driven - Full Day
✓ Airport Transfer
✓ Outstation One Way
✓ Outstation Round Trip
```

### For Taxi/Cab Service
```
✓ Local Hourly
✓ Local Full Day
✓ Airport Pickup
✓ Airport Drop
✓ Outstation One Way
✓ Outstation Round Trip
```

## Troubleshooting

### Issue: Trip type not showing in booking form

**Check:**
1. Is trip type active in master list? (`/admin/booking/trip-types`)
2. Is trip type enabled for this service? (`/admin/services/{slug}/trip-types`)
3. Do any vendors support this trip type with active pricing?

### Issue: Cannot create new trip type

**Possible causes:**
1. Slug already exists (try different name)
2. Missing ID generation (now fixed in this version)
3. Database permission issue

### Issue: Pricing not working for trip type

**Check:**
1. Vendor has added fleet pricing for this specific trip type
2. Fleet pricing table has valid `tripTypeId`
3. Vendor fleet is active and available

## API Endpoints

### Master Trip Types Management
```
GET    /api/admin/booking/trip-types           - List all
POST   /api/admin/booking/trip-types           - Create new
PUT    /api/admin/booking/trip-types/[id]      - Update
DELETE /api/admin/booking/trip-types/[id]      - Delete
```

### Service-Specific Trip Types
```
GET    /api/admin/services/[slug]/trip-types   - List with enabled status
POST   /api/admin/services/[slug]/trip-types   - Enable for service
DELETE /api/admin/services/[slug]/trip-types/[id] - Disable for service
```

## Best Practices

1. **Keep it Simple**: Don't create too many trip types. 3-5 per service is usually enough.

2. **Clear Naming**: Use names customers will understand:
   - ✓ "Airport Transfer"
   - ✗ "Type-A-Route-Config-1"

3. **Logical Requirements**:
   - If trip type is "one-way", it needs both from and to locations
   - If trip type is "local hourly", it only needs one location
   - If trip type is "round-trip", it needs from, to, AND return date

4. **Test After Changes**: After creating/enabling trip types, test the booking flow to ensure forms work correctly.

5. **Vendor Communication**: When you add new trip types, inform vendors so they can add pricing for them.

## Summary

**Trip Types = Booking Templates**

- Create templates in master table (`/admin/booking/trip-types`)
- Enable specific templates for each service (`/admin/services/{slug}/trip-types`)
- Vendors set prices per trip type
- Customers book using the trip type that fits their needs

This system gives you flexibility to support different booking patterns across different services without hardcoding everything!
