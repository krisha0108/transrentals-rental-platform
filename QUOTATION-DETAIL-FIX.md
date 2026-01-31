# Quotation Detail API Fix

## 🐛 **Issue**
```
TypeError: Cannot read property 'location_name' of undefined
```

**Error Location:** QuoteDetailScreen (ViewQuoteScreen.js)
**API Endpoint:** `/api/quotation-detail/[id]`

## 🔍 **Root Cause**

The ViewQuoteScreen was trying to access:
```javascript
quote.booking?.location_name  // Line 455
quote.booking.location_name   // Line 970
```

But the API was returning:
```json
{
  "success": true,
  "quotation": {
    "id": "...",
    "type": "bus",
    "pickupCity": "Ahmedabad",  // ❌ Different field names for different services
    // No location_name field
    // No booking object
  },
  "quotes": [ ... ]
}
```

**Problems:**
1. ❌ No `booking` object in response
2. ❌ No `location_name` field
3. ❌ Different field names for each service (pickupCity, pickupLocation, location, etc.)

## ✅ **Solution**

Updated `/api/quotation-detail/[id]/route.ts` to add consistent fields for ALL service types:

### Updated Response Structure
```json
{
  "success": true,
  "quotation": {
    "id": "...",
    "type": "bus",
    "pickupCity": "Ahmedabad",
    "location_name": "Ahmedabad",  // ✅ Added
    // ... other fields
  },
  "quotes": [ ... ],
  "booking": {                      // ✅ Added
    "location_name": "Ahmedabad"
  }
}
```

### Service-wise Location Mapping

| Service Type | Location Field(s) | Mapped to `location_name` |
|--------------|-------------------|---------------------------|
| **Bike** | pickupLocation, locationName | pickupLocation \|\| locationName \|\| 'N/A' |
| **Bus** | pickupCity | pickupCity \|\| 'N/A' |
| **Truck** | pickupLocation, pickupCity | pickupLocation \|\| pickupCity \|\| 'N/A' |
| **Equipment** | location, locationName | location \|\| locationName \|\| 'N/A' |
| **Packers** | pickupLocation, pickupCity | pickupLocation \|\| pickupCity \|\| 'N/A' |
| **Self-Drive** | pickupLocation, locationName | pickupLocation \|\| locationName \|\| 'N/A' |
| **Luxury** | pickupLocation, locationName | pickupLocation \|\| locationName \|\| 'N/A' |

## 🔧 **Changes Made**

Updated all 7 quote request responses to include:
1. `quotation.location_name` - Direct field in quotation object
2. `booking.location_name` - Backward compatibility for screens expecting booking object

### Example: Bus Quote Request
```typescript
return NextResponse.json({
  success: true,
  quotation: {
    // ... existing fields
    location_name: busQuote.pickupCity || 'N/A',  // ✅ Added
  },
  quotes: quotes,
  service_images: [],
  booking: {                                       // ✅ Added
    location_name: busQuote.pickupCity || 'N/A',
  },
});
```

## ✅ **Result**

**Before:**
```javascript
quote.booking?.location_name  // undefined → ERROR
```

**After:**
```javascript
quote.booking?.location_name  // "Ahmedabad" ✅
quote.quotation?.location_name // "Ahmedabad" ✅
```

## 📝 **Testing**

Test with any quote request ID:
```bash
curl http://localhost:3000/api/quotation-detail/cml0lgb4y0001uwjopw3vuuz6
```

Expected output:
```json
{
  "success": true,
  "quotation": {
    "id": "cml0lgb4y0001uwjopw3vuuz6",
    "type": "bus",
    "pickupCity": "Ahmedabad",
    "location_name": "Ahmedabad",  // ✅
    ...
  },
  "booking": {
    "location_name": "Ahmedabad"   // ✅
  },
  "quotes": [...]
}
```

## 📋 **Files Modified**

1. `src/app/api/quotation-detail/[id]/route.ts` - Added location_name and booking object to all 7 service types

## 🎯 **Impact**

- ✅ No more "Cannot read property 'location_name' of undefined" error
- ✅ Quote detail screens now display location properly
- ✅ Backward compatible with existing code
- ✅ Consistent API response across all service types
