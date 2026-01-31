# Customer App API Endpoints - Live API Check

## Authentication Endpoints
- ✅ `POST /customer/auth` - Customer authentication
- ✅ `POST /customer/fcm-token` - FCM token update

## Customer Profile
- ✅ `GET /customer/stats` - Get customer statistics
- ✅ `PUT /customer/profile` - Update customer profile
- ✅ `POST /customer/update-profile` - Update profile (multipart)
- ✅ `POST /customer/location` - Update location

## Booking Retrieval
- ✅ `GET /customer/bookings` - Get customer bookings with filters
- ✅ `GET /customer/bookings/{id}` - Get specific booking
- ✅ `GET /customer-booking-detail/{id}` - Legacy booking detail endpoint

## Quote Requests (New Structure)
- ✅ `GET /bike-quote-requests/{id}` - Get bike quote request
- ✅ `GET /bus-quote-requests/{id}` - Get bus quote request
- ✅ `GET /truck-quote-requests/{id}` - Get truck quote request
- ✅ `GET /equipment-quote-requests/{id}` - Get equipment quote request
- ✅ `GET /packers-quote-requests/{id}` - Get packers quote request
- ✅ `GET /self-drive-quote-requests/{id}` - Get self-drive quote request
- ✅ `GET /customer/quote-requests/bus/{id}` - Customer bus quote detail
- ✅ `GET /customer/quote-requests/truck/{id}` - Customer truck quote detail
- ✅ `GET /customer/quote-requests/equipment/{id}` - Customer equipment quote detail
- ✅ `GET /customer/quote-requests/packers/{id}` - Customer packers quote detail

## Booking Details (By Type)
- ✅ `GET /bike-bookings/{id}` - Get bike booking
- ✅ `GET /bus-bookings/{id}` - Get bus booking
- ✅ `GET /truck-bookings/{id}` - Get truck booking
- ✅ `GET /equipment-bookings/{id}` - Get equipment booking
- ✅ `GET /packers-bookings/{id}` - Get packers booking
- ✅ `GET /self-drive-bookings/{id}` - Get self-drive booking
- ✅ `GET /car-rental/bookings/{id}` - Get car rental booking

## Luxury Services
- ✅ `GET /customer/luxury-fleet` - Get luxury fleet
- ✅ `GET /customer/luxury-quote-requests` - Get luxury quote requests
- ✅ `GET /customer/luxury-quote-requests/{id}` - Get luxury quote request detail
- ✅ `POST /customer/luxury-quote-requests` - Create luxury quote request
- ✅ `POST /customer/luxury-quote-requests/{id}/accept` - Accept luxury quote
- ✅ `GET /customer/luxury-bookings/{id}` - Get luxury booking

## Quote Actions
- ✅ `POST /customer/accept-quote` - Accept a quote

## Payments
- ✅ `POST /customer/submit-payment` - Submit payment proof
- ✅ `POST /payments/store` - Store payment details

## Chat & Communication
- ✅ `GET /customer/chat/bookings` - Get chat bookings
- ✅ `GET /customer/chat/live-chats` - Get live chats
- ✅ `GET /customer/all-booking-chats` - Get all booking chats
- ✅ `GET /customer/bookings/{bookingId}/vendors` - Get vendors for booking
- ✅ `GET /customer/bookings/{bookingId}/chats/{vendorId}` - Get chat messages
- ✅ `POST /customer/bookings/{bookingId}/chats/{vendorId}` - Send message
- ✅ `POST /customer/bookings/{bookingId}/vendor/{vendorId}/read-messages` - Mark as read
- ✅ `GET /chats/contact-list` - Get contact list
- ✅ `GET /chats/{contactId}/messages` - Get chat messages
- ✅ `POST /chat/send` - Send chat message
- ✅ `POST /chat/mark-read` - Mark chat as read

## Helpdesk
- ✅ `GET /customer/helpdesk/store` - Get helpdesk tickets
- ✅ `POST /customer/helpdesk/store` - Create helpdesk ticket

## Gamification
- ✅ `GET /backr` - Get Backr tokens
- ✅ `POST /backr/update-wallet` - Update wallet
- ✅ `POST /backr/redeem` - Redeem tokens
- ✅ `POST /spin/start` - Start spin wheel
- ✅ `POST /spin/result` - Get spin result
- ✅ `POST /spin/confirm` - Confirm spin prize

## Misc
- ✅ `GET /vendor-services/{id}` - Get vendor service details
- ✅ `GET /customer/expenses` - Get customer expenses
- ✅ `GET /geocode` - Reverse geocode location
- ✅ `GET /services/luxury-car-rental/locations` - Get luxury service locations

## 🔴 MISSING / DEPRECATED ENDPOINTS

### ❌ CRITICAL - Called but doesn't exist:
1. **`GET /quotation-detail/{quoteId}`**
   - **Used in:** `ViewQuoteScreen.js:812`
   - **Status:** 404 - Endpoint doesn't exist
   - **Fix:** This is a legacy endpoint. Need to either:
     - Create it as a backward-compatible endpoint, OR
     - Update app to use new structure: `/customer/quote-requests/{type}/{id}`

## Summary
- **Total Endpoints Called:** ~80+
- **Missing Endpoints:** 1 critical (`/quotation-detail`)
- **Backend Status:** Most endpoints exist in new structure
- **Issue:** Customer app using old endpoint that doesn't exist on live API

## Recommended Fix:
Create `/quotation-detail/{id}` endpoint that intelligently routes to the correct quote type endpoint based on the ID structure or database lookup.
