# Booking Integration Guide

## Overview

All bookings now go through a **single unified API endpoint** for easy backend integration.

## Simplified Architecture

```
Booking Forms → useBookingSubmission Hook → bookingHelper → /api/bookings → Backend API
```

### Before (Complex - 15+ endpoints):
- ❌ Each service had its own booking function
- ❌ 15+ different API endpoints to maintain
- ❌ Complex switch statements throughout code
- ❌ Hard to add new services

### After (Simple - 1 endpoint):
- ✅ Single unified `/api/bookings` endpoint
- ✅ Automatic routing to correct backend endpoint
- ✅ Easy to add new services
- ✅ Centralized error handling and logging
- ✅ Optional local database storage

## API Endpoint

### POST `/api/bookings`

Submit a new booking of any type.

**Request:**
```json
{
  "bookingType": "bike",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919737965551"
  },
  "bookingData": {
    "service_id": 2,
    "service_name": "Bike Rental",
    "location_id": 1,
    "location_name": "Mumbai",
    "destination": "Pune",
    "journey_datetime": "2024-01-15T10:00:00",
    "return_datetime": "2024-01-15T18:00:00",
    "bike_type": "sport",
    "bike_duration": "daily",
    "other_info": "Need helmet"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking submitted successfully!",
  "booking_id": 12345,
  "customer_id": 678,
  "redirect_to": "/customer/dashboard"
}
```

## Supported Booking Types

| Booking Type | Service | Backend Endpoint |
|-------------|---------|------------------|
| `bike` | Bike Rental | `/customer-bike-booking` |
| `car-roundtrip` | Round Trip | `/store-roundtrip-booking` |
| `car-oneway` | One Way | `/store-oneway-booking` |
| `car-airport` | Airport Transfer | `/store-airport-booking` |
| `selfdrive` | Self Drive | `/store-selfdrive-booking` |
| `luxury` | Luxury Car | `/customer-luxury-booking` |
| `bus-outstation` | Outstation Bus | `/store-outstation-booking` |
| `bus-local` | Local Bus | `/store-local-booking` |
| `truck-personal` | Personal Truck | `/customer-personal-booking` |
| `truck-commercial` | Commercial Truck | `/customer-commercial-booking` |
| `equipment` | Equipment | `/store-equipment-booking` |
| `packers-home` | Home Shifting | `/store-home-booking` |
| `packers-office` | Office Shifting | `/store-officePackerMovers` |
| `packers-vehicle` | Vehicle Shifting | `/store-vehicle-booking` |
| `trailer` | Trailer Rental | `/store-trailer-booking` |

**Total: 27 Services, 15 Booking Types**

## GET `/api/bookings`

Retrieve booking information.

**Query Parameters:**
- `id` - Booking ID
- `phone` - Customer phone number (get all bookings)

**Examples:**
```bash
# Get specific booking
GET /api/bookings?id=12345

# Get all bookings for a customer
GET /api/bookings?phone=+919737965551
```

## Backend Integration Options

### Option 1: Use Existing External API (Current Setup)

The endpoint forwards all bookings to your existing backend API automatically.

**Configuration:**
Set `NEXT_PUBLIC_API_URL` in `.env`:
```env
NEXT_PUBLIC_API_URL=https://api.transrentals.in/api
```

### Option 2: Store Locally + Forward

Uncomment the database storage code in `/api/bookings/route.ts`:

```typescript
await prisma.booking.create({
  data: {
    externalId: backendData.booking_id.toString(),
    type: bookingType,
    customerName: customerInfo.name,
    customerEmail: customerInfo.email,
    customerPhone: customerInfo.phone,
    data: completeBookingData,
    status: 'PENDING',
  },
});
```

### Option 3: Local Database Only

Replace the backend forwarding section with:

```typescript
const booking = await prisma.booking.create({
  data: {
    type: bookingType,
    customerName: customerInfo.name,
    customerEmail: customerInfo.email,
    customerPhone: customerInfo.phone,
    data: completeBookingData,
    status: 'PENDING',
  },
});

return NextResponse.json({
  success: true,
  message: 'Booking submitted successfully!',
  booking_id: booking.id,
  customer_id: customerId,
  redirect_to: '/customer/dashboard',
});
```

### Option 4: Webhook Integration

Add webhook notification:

```typescript
// After successful booking
await fetch('https://your-webhook.com/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'booking.created',
    booking_id: backendData.booking_id,
    customer: customerInfo,
    data: completeBookingData,
  }),
});
```

### Option 5: Queue for Processing

Add to message queue (e.g., Redis, RabbitMQ):

```typescript
await queue.add('process-booking', {
  bookingType,
  customerInfo,
  bookingData,
  timestamp: new Date(),
});
```

## Adding New Services

To add a new service (e.g., "Yacht Rental"):

1. **Add to booking endpoint mapping** in `/api/bookings/route.ts`:
```typescript
const BOOKING_ENDPOINTS: Record<string, string> = {
  // ... existing mappings
  'yacht': '/store-yacht-booking', // Add this line
};
```

2. **Create booking form** (copy from existing):
```tsx
// src/components/booking/YachtBookingForm.tsx
export function YachtBookingForm() {
  const { submitBooking } = useBookingSubmission('yacht');
  // ... rest of form
}
```

3. **Add to Shivi chatbot** in `SmartShivi.tsx`:
```typescript
const VEHICLE_CATEGORIES = [
  // ... existing categories
  {
    id: 'yacht',
    name: 'Yacht Rental',
    icon: '⛵',
    // ...
  },
];
```

That's it! No complex switch statements or service classes needed.

## Code Simplification Summary

### Before:
- `bookingHelper.ts`: **173 lines** with giant switch statement
- Multiple service files each with their own functions
- Hard to maintain, easy to break

### After:
- `bookingHelper.ts`: **43 lines** (74% reduction!)
- Single unified endpoint handles all types
- Easy to maintain and extend

### Files Changed:
1. ✅ Created `/api/bookings/route.ts` - Unified API endpoint
2. ✅ Simplified `bookingHelper.ts` - Removed 130 lines of code
3. ✅ No changes needed to booking forms (they still work!)

## Testing

### Test the unified endpoint:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "bookingType": "bike",
    "customerInfo": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+919999999999"
    },
    "bookingData": {
      "service_id": 2,
      "service_name": "Bike Rental",
      "location_id": 1,
      "location_name": "Mumbai",
      "journey_datetime": "2024-01-20T10:00:00",
      "bike_type": "sport",
      "bike_duration": "daily"
    }
  }'
```

## Benefits

1. **Single Point of Entry**: All bookings go through one endpoint
2. **Easy Backend Switching**: Change backend by updating one file
3. **Centralized Logging**: Monitor all bookings in one place
4. **Flexible Storage**: Local DB, external API, webhooks, or queues
5. **Type Safety**: TypeScript interfaces for all booking types
6. **Error Handling**: Unified error responses
7. **Scalable**: Easy to add new services
8. **Maintainable**: Less code, clearer structure

## Monitoring & Logging

All booking attempts are logged in the API route. Add your monitoring:

```typescript
// In /api/bookings/route.ts
console.log('Booking submitted:', {
  type: bookingType,
  customer: customerInfo.phone,
  timestamp: new Date(),
});

// Add to your monitoring service
await analytics.track('booking_submitted', {
  bookingType,
  customerId,
});
```

## Questions?

The entire booking flow is now centralized in two files:
1. `/api/bookings/route.ts` - API endpoint
2. `/lib/utils/bookingHelper.ts` - Helper function

Check these files for the complete implementation.
