# TransRentals API Integration Guide

This document describes how the TransRentals Website (Next.js) connects to the TransRentals CRM Backend (Laravel).

## Architecture Overview

```
┌─────────────────────────────┐       ┌─────────────────────────────┐
│   TransRentals Website      │       │   TransRentals CRM Backend  │
│   (Next.js Frontend)        │◄─────►│   (Laravel API)             │
│   localhost:3000            │       │   app.transrentals.in/api   │
└─────────────────────────────┘       └─────────────────────────────┘
         │                                        │
         │                                        │
    Customer                               Vendors, Admins
    Booking Forms                          Dashboard
    Dashboard                              Quotations
```

## Configuration

### Environment Variables

Create a `.env.local` file in the website root:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://app.transrentals.in/api

# For local development with local backend:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## API Modules

### 1. Booking API (`src/lib/api/booking.ts`)

Create bookings for all service types:

```typescript
import { bookingAPI } from '@/lib/api';

// Bike Booking
const result = await bookingAPI.createBikeBooking({
  customer_id: '0', // 0 for new customer
  service_id: 2,
  service_name: 'Bike Rental',
  location_id: 1,
  location_name: 'Mumbai',
  destination: 'Pune',
  journey_datetime: '2024-01-15T10:00:00',
  bike_type: 'sport',
  bike_duration: 'daily',
});

// Car Booking (One-way, Round-trip, Airport)
const carResult = await bookingAPI.createRoundTripCarBooking({
  customer_id: '0',
  service_id: 3,
  service_name: 'Car Rental',
  location_id: 1,
  location_name: 'Delhi',
  destination: 'Agra',
  journey_datetime: '2024-01-15T10:00:00',
  return_datetime: '2024-01-16T18:00:00',
  car_type: 'sedan',
  trip_type: '3', // 1=oneway, 2=airport, 3=roundtrip
  total_passangers: '4',
});
```

### 2. Customer API (`src/lib/api/customer.ts`)

Handle customer authentication and dashboard:

```typescript
import { customerAPI } from '@/lib/api';

// Login
const loginResult = await customerAPI.login('email@example.com', 'password');

// Get booking stats
const stats = await customerAPI.getBookingStats('9876543210');
// Returns: { openCount: 5, completedCount: 10, upcomingCount: 3 }

// Get bookings by status
const bookings = await customerAPI.getBookingsByStatus('email@example.com', 'Open');

// Get booking detail with quotations
const detail = await customerAPI.getBookingDetail(123);
// Returns: { booking, quotations, assigned_vehicle, assigned_driver }
```

### 3. Services API (`src/lib/api/services.ts`)

Fetch services and locations from backend:

```typescript
import { servicesAPI } from '@/lib/api';

// Get all active services
const services = await servicesAPI.getServices();

// Get all active locations
const locations = await servicesAPI.getLocations();

// Get equipment types
const equipmentTypes = await servicesAPI.getEquipmentTypes();
```

## React Hooks

Use the provided hooks for easier integration:

```typescript
import { useCustomerAuth, useBooking, useServicesAndLocations } from '@/hooks';

function MyComponent() {
  // Authentication
  const { customer, isAuthenticated, login, logout } = useCustomerAuth();

  // Booking
  const { createBikeBooking, isSubmitting, error } = useBooking();

  // Services & Locations
  const { services, locations, fetchBoth } = useServicesAndLocations();

  // ...
}
```

## API Endpoints Reference

### Booking Endpoints

| Service | Endpoint | Method |
|---------|----------|--------|
| Bike Rental | `/customer-bike-booking` | POST |
| Car Round-trip | `/store-roundtrip-booking` | POST |
| Car One-way | `/store-oneway-booking` | POST |
| Car Airport | `/store-airport-booking` | POST |
| Car Self-drive | `/store-selfdrive-booking` | POST |
| Luxury Car | `/customer-luxury-booking` | POST |
| Bus Outstation | `/store-outstation-booking` | POST |
| Bus Local | `/store-local-booking` | POST |
| Truck Personal | `/customer-personal-booking` | POST |
| Truck Commercial | `/customer-commercial-booking` | POST |
| Equipment | `/store-equipment-booking` | POST |
| Packers Home | `/store-home-booking` | POST |
| Packers Office | `/store-officePackerMovers` | POST |
| Packers Vehicle | `/store-vehicle-booking` | POST |

### Customer Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Login | `/login` | POST |
| Send OTP | `/send-otp` | POST |
| Verify OTP | `/verify-otp` | POST |
| Google Login | `/google-login` | POST |
| Get Customer | `/get-customer-by-phone` | POST |
| Booking Stats | `/customer-booking-stats` | POST |
| Dashboard Stats | `/customer-dashboard-stats` | POST |
| Upcoming Bookings | `/customer-upcoming-bookings` | POST |
| Bookings by Status | `/customer-bookings-by-status` | POST |
| Booking Detail | `/customer-booking-detail/{id}` | GET |
| Recent Quotes | `/customer-recent-quotes` | POST |

### Data Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Get Services | `/services` | GET |
| Get Locations | `/locations` | GET |
| Equipment Types | `/equipment-types` | GET |
| Featured Vendors | `/vendors/featured` | GET |

## Booking Payload Structure

### Base Payload (All Bookings)

```typescript
{
  customer_id: number;      // 0 for new customer
  service_id: number;       // From /services endpoint
  service_name: string;
  location_id: number;      // From /locations endpoint
  location_name: string;
  destination?: string;
  journey_datetime: string; // ISO format: YYYY-MM-DDTHH:mm:ss
  return_datetime?: string;
  other_info?: string;
  // Customer info (for new customers)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}
```

### Service-Specific Fields

**Bike Booking:**
```typescript
{
  bike_type: 'sport' | 'scooter' | 'cruiser' | 'street' | 'adventure' | 'dirt';
  bike_duration: 'hourly' | 'daily' | 'weekly' | 'monthly';
}
```

**Car Booking:**
```typescript
{
  car_type: 'hatchback' | 'sedan' | 'muv' | 'suv' | 'luxury';
  trip_type: '1' | '2' | '3'; // 1=oneway, 2=airport, 3=roundtrip
  total_passangers: number;
  booking_type?: '1' | '2'; // For airport: 1=drop, 2=pickup
}
```

**Truck Booking:**
```typescript
{
  truck_mode: 1 | 2; // 1=personal, 2=commercial
  truck_type: number;
  personal_good_type?: number;
  commercial_good_type?: number;
  weight: 1 | 2; // 1=KG, 2=TON
  weight_val: string;
}
```

**Equipment Booking:**
```typescript
{
  machine_type: number; // From /equipment-types
  job_duration: '1' | '2' | '3' | '4'; // 1=1-5days, 2=6-15days, 3=16-30days, 4=30+days
  no_of_equipments: string;
}
```

**Packers & Movers:**
```typescript
{
  shifting_type: 'Home' | 'Office' | 'Vehicle';
  home_shifting?: 'BHK_1' | 'BHK_2' | 'BHK_3' | 'BHK_4' | 'BHK_More_THAN_4' | 'VILLA';
  office_shifting?: 'INDIVIDUAL_ITEMS' | 'UPTO_10_EMPLOYEES' | 'UPTO_20_EMPLOYEES' | 'MORE_THAN_20_EMPLOYEES';
  vehicle_shifting?: 'BIKE' | 'CAR' | 'SUV';
}
```

## Response Format

### Success Response

```json
{
  "status": true,
  "message": "Booking created successfully",
  "booking_id": 123
}
```

### Error Response

```json
{
  "status": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

## CORS Configuration

The backend CORS is configured to allow:
- `http://localhost:3000` (development)
- `https://transrentals.in` (production)
- `https://*.transrentals.in` (subdomains)

## Troubleshooting

### CORS Errors

If you see CORS errors in development:
1. Ensure the backend CORS config includes `http://localhost:3000`
2. Check that `supports_credentials` is `true` if using cookies
3. Verify the API URL doesn't have a trailing slash

### 401 Unauthorized

1. Check if the auth token is being sent in the `Authorization` header
2. Verify the token hasn't expired
3. Ensure the token is stored in `localStorage` as `auth_token` or `token`

### 422 Validation Error

1. Check the request payload matches the expected structure
2. Verify all required fields are present
3. Check field types (string vs number)

## File Structure

```
src/lib/api/
├── index.ts          # Unified exports
├── client.ts         # Axios client with interceptors
├── apiClient.ts      # Fetch-based client (legacy)
├── booking.ts        # Booking API functions
├── customer.ts       # Customer API functions
├── services.ts       # Services & Locations API
├── locations.ts      # Location-specific API
└── services/
    ├── authService.ts    # Auth functions
    └── bookingService.ts # Additional booking helpers

src/hooks/
├── index.ts          # Hook exports
├── useCustomer.ts    # Customer-related hooks
└── useBooking.ts     # Booking-related hooks

src/app/api/
├── bookings/route.ts        # Unified booking proxy
└── customer/
    ├── auth/route.ts        # Customer auth proxy
    └── dashboard/route.ts   # Dashboard stats proxy
```

## Next Steps

1. Implement chat/messaging integration using WebSockets (Pusher)
2. Add push notification support (FCM)
3. Integrate payment gateway
4. Add real-time booking status updates
