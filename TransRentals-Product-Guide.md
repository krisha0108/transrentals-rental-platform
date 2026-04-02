# TransRentals — Complete Product Guide
### For Design & Marketing Teams
**Version 2.0 | March 2026**

---

## Table of Contents
1. Platform Overview
2. Services Offered
3. Customer Experience (Web + Mobile App)
4. Vendor Experience (Web + Mobile App)
5. Driver Experience (Web Portal)
6. Booking Flows & Journeys
7. Payment System
8. Notification System
9. Chat & Messaging
10. Special Features

---

## 1. Platform Overview

TransRentals is India's multi-service vehicle rental and logistics marketplace connecting **Customers** with verified **Vendors** across 100+ cities.

### Key Numbers
- **8 Core Services** — Bike, Car (Chauffeur), Self-Drive, Luxury Car, Bus, Truck, Equipment, Packers & Movers
- **3 User Types** — Customer, Vendor, Driver
- **2 Mobile Apps** — Customer App (Android/iOS), Vendor App (Android/iOS)
- **1 Driver Web Portal**
- **100+ Cities** across India
- **553 API Endpoints** powering the platform

### Tech Stack
- **Web:** Next.js 14, TypeScript, Tailwind CSS
- **Mobile:** React Native (Customer v0.78, Vendor v0.79)
- **Payments:** Razorpay (UPI, Cards, Net Banking, Wallets)
- **Notifications:** Firebase Push + In-App + Email
- **Real-time:** Socket.io for chat & live updates

---

## 2. Services Offered

### 2.1 Bike Rental 🏍️
- **Categories:** Scooter, Bike (100-150cc), Bike (150-200cc), Sports Bike, Cruiser
- **Use Case:** Daily commute, weekend rides, city exploration
- **Flow:** Browse fleet → Select bike → Pay advance → Pickup with OTP → Return
- **Pricing:** Hourly / Daily / Weekly / Monthly rates

### 2.2 Car Rental with Driver (Chauffeur) 🚗
- **Categories:** Hatchback, Sedan, SUV, MUV/MPV
- **Trip Types:**
  - **Local** — Hourly packages (1hr/40km, 2hr/40km, 4hr/40km, 8hr/80km, 12hr/120km)
  - **Outstation One-Way** — City to city with multi-stop support
  - **Outstation Round-Trip** — Multi-city tour with return
  - **Airport Pickup/Drop** — To/from airport transfers
- **Pricing:** Per km rate + Driver allowance per day + Toll/Parking extra
- **Special:** Multi-stop outstation with route breakdown, ~km distance estimation

### 2.3 Self-Drive Car Rental 🔑
- **Categories:** Hatchback, Sedan, SUV, MUV/MPV
- **Use Case:** Customer drives the vehicle themselves
- **Flow:** Browse vehicles → Check availability → Pay advance → OTP pickup → Drive → Return
- **Pricing:** Daily rate + Security deposit (₹2,000)
- **Special:** Damage/theft protection options, fuel policy

### 2.4 Luxury Car Rental 💎
- **Categories:** Luxury Sedan, SUV, Limousine, Convertible, Vintage/Classic
- **Use Case:** Weddings, corporate events, VIP transfers, photoshoots
- **Flow:** Quote-based — Customer requests → Vendors send quotes → Customer selects best
- **Special:** Concierge service, premium chauffeurs

### 2.5 Bus Rental 🚌
- **Categories:** Mini Bus (12-15), Tempo Traveller (17-26), Bus (30-45), Volvo Coach (45-52)
- **Trip Types:** Local, Outstation One-Way, Outstation Round-Trip, Airport
- **Use Case:** Group travel, corporate outings, pilgrimages, weddings
- **Flow:** Quote-based — Enter trip details → Receive vendor quotes → Select & pay
- **Special:** Group size recommendations, multi-day trip support

### 2.6 Truck & Tempo Rental 🚚
- **Categories:** Mini Truck (Tata Ace), Tempo (407/709), Truck (14ft-22ft), Container, Trailer
- **Use Case:** Goods transport, logistics, commercial shipping
- **Flow:** Quote-based — Describe goods + route → Vendors quote → Select & book
- **Goods Types:** Household, Electronics, Furniture, Granites/Marbles, Industrial, etc.
- **Special:** Tonnage capacity, loading/unloading support options

### 2.7 Equipment Rental 🏗️
- **Categories:** Excavator, Crane, JCB, Loader, Bulldozer, Compactor, Generator, Scaffolding
- **Use Case:** Construction sites, events, industrial projects
- **Flow:** Quote-based — Specify equipment + duration → Vendors respond → Select
- **Rental Options:** Daily, Weekly, Monthly
- **Special:** Operator included option, on-site delivery, installation support

### 2.8 Packers & Movers 📦
- **Categories:** Local Shifting, Domestic Relocation, Office Shifting, Vehicle Transport, Storage
- **Use Case:** Home/office relocation, city-to-city moves
- **Flow:** Quote-based — Describe move details → Multiple vendor quotes → Compare & select
- **Special:** Insurance options, damage protection, packing materials included

---

## 3. Customer Experience

### 3.1 Customer Web Portal (transrentals.com)

#### Homepage
- **Auto Location Detection** — GPS + IP-based city detection with manual override
- **Service Cards** — 8 services with quick booking access
- **Smart Shivi Chatbot** — AI-powered booking assistant
  - Conversational booking creation
  - Service recommendations
  - Date/time selection with custom AM/PM picker
  - Location suggestions

#### Booking Pages (per service)
- **Local Package Selection** — Hour/KM based packages
- **Outstation Multi-Stop** — Add unlimited intermediate stops
- **Custom Time Picker** — Cross-browser AM/PM dropdown (no native input issues)
- **12-Hour Advance Validation** — Cannot book within 12 hours of current time
- **Real-time Pricing** — Instant fare calculation with breakdown
- **Route Distance Estimation** — Approximate km with "distances are approximate" note

#### Customer Dashboard
- **Booking Stats** — Active bookings, Upcoming trips, Active quotes (clickable filters)
- **My Bookings** — Filter by service type + status (Pending, Confirmed, In Progress, Completed, Cancelled)
- **Booking Details** — Full route info, pricing breakdown, payment summary, vendor details
- **Payment History** — All transactions, receipts
- **Profile Management** — Edit name, phone, email, profile photo
- **Notifications** — Real-time booking updates, quote alerts, payment confirmations

#### Helpdesk / Support
- **Create Ticket** — Title, description, attach images
- **Link Booking** — Dropdown to attach related booking (all services)
- **Track Status** — Open → In Progress → Resolved / Cancelled
- **View Admin Response** — Green box shows resolution from support team
- **Filter Tabs** — All, Pending, Resolved, Cancelled

#### Logout
- **Confirmation Modal** — "Are you sure?" with Cancel/Yes buttons + loading spinner

---

### 3.2 Customer Mobile App (Android + iOS)

#### Home Screen (Dashboard)
- **Welcome Header** — User name, profile photo, location display
- **Browse by Category** — 8 service tiles with icons
  - Bike, Standard Car, Luxury Car, Self-Drive, Bus, Truck, Equipment, Packers & Movers
  - B2B category for corporate customers
- **Quick Stats Card** (Green gradient)
  - Active Bookings → Tap to see confirmed bookings
  - Upcoming Trips → Tap to see pending bookings
  - Active Quotes → Tap to see pending quotes
- **Upcoming Bookings Section** — Next 5 bookings with service icon, route, date, status
- **Active Quotes Section** — Pending quote requests with vendor response count
- **How TransRentals Works** — 3-step onboarding guide
- **Testimonials** — Customer reviews horizontal carousel
- **Safety Tips** — Verified Drivers, Live Tracking, 24×7 Support, Secure Payments
- **Notification Bell** — Unread count badge
- **Pull to Refresh** — Live data update

#### Booking Creation (per service)
Each service has its own booking screen with:
- **Location Dropdowns** — Search with keyboard autocomplete, trim() for clean matching
- **Multi-Stop Support** — Add intermediate cities (Outstation)
- **Date Picker** — Native date picker with 12-hour advance validation
- **Time Picker** — Native time picker
- **Advance Booking Alert** — Animated modal when pickup too soon
  - Shows earliest available pickup time
  - Red warning design with clear message
- **Continue Button Validation** — Blocks next step if date/time invalid
- **Vehicle Selection** — Fleet cards with specs (seats, AC, fuel type)
- **Pricing Display** — Per km rate, driver allowance, toll/parking info
- **Distance Note** — "Distances are approximate and may vary"

#### Booking Screens Available
1. **Bike Booking** — BikeBookingScreen, BikeFleetScreen
2. **Car Rental (Chauffeur)** — CarRentalFleetScreen
   - One-Way with multi-stop
   - Round-Trip with multi-stop
   - Airport Pickup/Drop
3. **Self-Drive** — SelfDriveBookingScreen, SelfDriveFleetScreen
4. **Luxury** — LuxuryScreen, LuxuryCarRentalScreen
5. **Bus** — BusRentalFleetScreen, LocalScreen, OutstationScreen
6. **Truck** — CommercialBookingScreen, PersonalBookingScreen
7. **Equipment** — EquipmentBookingScreen
8. **Packers & Movers** — HomeBookingScreen, OfficeBookingScreen, VehicleBookingScreen

#### My Bookings
- **Service Filter** — All, Bike, Car, Bus, Truck, Self-Drive, Equipment, Packers, Luxury
- **Status Filter** — All, Pending, Confirmed, In Progress, Completed, Cancelled
- **Search** — Find by booking number or location
- **Booking Card** — Service icon, route, date, status badge, vendor info
- **Tap for Details** — Full booking detail with fare breakdown

#### Booking Details Screen
- **Route Display** — From → Intermediate Stops → To
- **Fare Breakdown** — Distance, per km rate, driver allowance, toll/parking
- **Payment Summary** — Total, advance paid, balance due
- **Vendor Details** — Business name, phone, vehicle info
- **Status Timeline** — Visual progress of booking

#### Helpdesk
- **Create Ticket** — Title, description, photo upload
- **Booking Dropdown** — All bookings fetched (Open, Confirmed, Ongoing, Completed, Dropped)
- **Status Badges** — Color-coded (green=resolved, red=cancelled, yellow=pending)
- **Admin Response** — Green box with resolution text and date
- **Filter Tabs** — All, Pending, Resolved, Cancelled
- **Image Preview** — Full-screen image viewer for attachments

#### Profile & Settings
- **View/Edit Profile** — Name, email, phone, photo
- **Notifications** — In-app notification center
- **Expenses** — Payment history and tracking
- **B2B Registration** — Corporate customer signup
- **Logout** — Confirmation alert: "Are you sure you want to logout?"

#### Bottom Navigation
- **Home** — Dashboard
- **Payments** — Expenses & payment history
- **Bookings** — My Bookings with filters
- **Chat** — All booking conversations

---

## 4. Vendor Experience

### 4.1 Vendor Web Portal

#### Sidebar Navigation (with TransRentals logo)
- Dashboard
- Car Rental Bookings
- Bike Bookings
- Bus Bookings
- Truck Bookings
- Equipment Bookings
- Packers & Movers Bookings
- Luxury Bookings
- Self-Drive Bookings
- B2B Bookings
- Direct Bookings
- Booking Links / QR
- Fleet Management
- Staff Management
- Financials
- Notifications
- Chat
- CRM
- Reports
- Settings

#### Dashboard
- **Revenue Card** — Monthly earnings from completed bookings
- **Notifications Widget** — Latest 5 notifications with quick actions
  - New booking requests → Direct link to booking details
  - New quote requests → Link to quote response
  - Payment confirmations
- **Quick Actions** — Shortcuts to common tasks
- **Statistics** — Bookings count, active trips, pending quotes

#### Booking Management (per service)
- **Booking List** — Table with customer, route, date, status, amount
- **Status Actions:**
  - **Accept** — Green button to accept assigned booking
  - **Reject** — Red button to reject with reason
  - **Start Trip** — Begin active trip
  - **Complete** — Mark trip as finished
- **Booking Details Page** — Full customer info, route, pricing, payment status
  - Accept/Reject buttons available on detail page too

#### Quote Response System
- Receive broadcast notifications for new quote requests
- View customer requirements (route, dates, vehicle type, goods type)
- Submit competitive quote with pricing breakdown
- Track if quote was accepted/rejected
- Automated notifications on quote acceptance

#### Fleet Management
- Add vehicles (category, brand, model, registration, specs)
- Set availability and blocked dates
- Upload vehicle photos and documents
- Track vehicle assignments
- Maintenance reminders

#### Staff Management
- Add drivers, helpers, mechanics, supervisors
- Track attendance
- Assign staff to bookings
- Driver license and document management

#### Notifications Page
- All notification types with timestamps
- Click-through to relevant booking/quote
- Read/unread status
- Filter by type

#### Financials
- Earnings overview (monthly/weekly/daily)
- Booking-wise revenue breakdown
- Payout history
- Bank details management

---

### 4.2 Vendor Mobile App (Android + iOS)

#### Dashboard
- Active bookings count
- Today's trips
- Pending quotes
- Quick actions

#### Booking Management
- View all bookings across services
- Accept/Reject actions
- Trip status updates (Start/Complete)
- Customer contact info

#### Quote Requests
- New quote alerts
- Submit quotes with pricing
- Track quote status

#### Fleet
- Vehicle list and availability
- Add/edit vehicles
- Document uploads

#### P2P Marketplace (Vendor-to-Vendor)
- **Post Vehicle** — Share empty vehicle capacity with other vendors
- **Post Booking Need** — Request vehicles from other vendors
- **Browse Available** — Find vehicles posted by other vendors
- **Transactions** — Track P2P deals
- **Ratings** — Rate other vendors after P2P transactions

#### Social Feed (Vendor Community)
- Create posts with images
- SOS posts (emergency, 24-hour expiry)
- Like, comment, save posts
- Follow other vendors
- Direct messaging with vendors

#### Profile & Settings
- Business profile management
- Bank account details
- Document uploads
- Service area configuration

---

## 5. Driver Experience

### 5.1 Driver Web Portal

#### Authentication
- Phone number + OTP login (no password needed)
- Linked to vendor staff records

#### Dashboard
- Active bookings count
- Today's schedule overview

#### My Bookings
- List of assigned bookings
- Filter by status: Pending, Active, Completed
- Filter by service type

#### Booking Details
- Customer name and contact
- Pickup and drop location
- Route with intermediate stops
- Date and time
- Vehicle assigned
- Special instructions

#### Trip Management
- **Request OTP** — Generate one-time code for trip verification
- **Start Trip** — Begin after OTP verification
- **Complete Trip** — Mark as finished at destination
- **Status Flow:**
  - Assigned → OTP Verified → In Progress → Completed

#### Earnings
- Per-booking earnings
- Daily/weekly/monthly summary

#### Notifications
- New booking assignments
- Trip reminders
- Schedule changes

---

## 6. Booking Flows & Journeys

### 6.1 Browse-First Flow (Bike, Self-Drive, Car Rental)
```
Customer opens service page
    ↓
Selects trip type (Local/Outstation/Airport)
    ↓
Enters locations (From, To, Intermediate Stops)
    ↓
Selects dates and time (12-hour advance minimum)
    ↓
Views available vehicles with pricing
    ↓
Selects vehicle → Sees fare breakdown
    ↓
Confirms booking → Pays advance (30%)
    ↓
Razorpay payment (UPI/Card/Wallet)
    ↓
Booking confirmed → Vendor notified
    ↓
Vendor accepts → Driver assigned
    ↓
Customer gets notification with driver details
    ↓
Trip day: OTP verification → Trip starts
    ↓
Trip completes → Final payment → Rating
```

### 6.2 Quote-Based Flow (Bus, Truck, Equipment, Packers, Luxury)
```
Customer creates quote request
    ↓
System broadcasts to relevant vendors (location + service match)
    ↓
Multiple vendors receive notification
    ↓
Vendors submit competitive quotes
    ↓
Customer receives quotes → Compares pricing
    ↓
Customer accepts best quote
    ↓
Pays advance (30%) via Razorpay
    ↓
Booking confirmed → Vendor notified
    ↓
Vehicle/Team assigned → Customer notified
    ↓
Service delivered → Trip completed
    ↓
Final payment → Rating & review
```

### 6.3 Chat-Based Flow (via Smart Shivi)
```
Customer opens any service page
    ↓
Clicks chat widget (Smart Shivi)
    ↓
Shivi asks: What service? Where? When?
    ↓
Customer answers conversationally
    ↓
Shivi validates dates (12-hour rule)
    ↓
Creates booking/quote request
    ↓
Redirects to payment or confirmation
```

---

## 7. Payment System

### Payment Gateway: Razorpay

#### Payment Methods Supported
- Credit/Debit Cards (Visa, Mastercard, RuPay)
- UPI (Google Pay, PhonePe, Paytm)
- Net Banking (all major banks)
- Wallets (Paytm, PhonePe, Amazon Pay)

#### Payment Structure
| Component | Amount |
|-----------|--------|
| Base Fare | Per km/hr rate × distance/time |
| Driver Allowance | ₹300/day (chauffeur services) |
| Toll/Parking | Extra, as applicable |
| GST | 18% on total |
| **Advance Payment** | **30% of total** |
| Security Deposit | ₹2,000 (self-drive only) |
| Balance | Due at trip completion |

#### Payment Flow
1. Customer clicks "Pay Advance"
2. Razorpay checkout opens (embedded)
3. Customer completes payment
4. HMAC signature verification (server-side)
5. Payment verified → Booking status: CONFIRMED
6. Vendor receives "Payment Received" notification
7. Receipt generated for customer

#### Day Calculation (for multi-day trips)
- **Formula:** `ceil(total_hours / 24) = days`
- Example: 25 Mar 10 PM → 28 Mar 2 PM = 64 hours = ceil(2.67) = **3 days**
- Night bookings (10 PM+) naturally don't count first night as full day

---

## 8. Notification System

### Customer Notifications
| Event | Message Example |
|-------|----------------|
| Booking Confirmed | "Your car rental booking CB-2026-XXX has been confirmed!" |
| Quote Received | "New quote received for your bus rental request" |
| Driver Assigned | "Driver Ramesh has been assigned for your trip" |
| Payment Success | "₹3,465 advance payment received for booking CB-2026-XXX" |
| Trip Started | "Your trip has started! Have a safe journey" |
| Trip Completed | "Trip completed! Rate your experience" |
| Ticket Response | "Support team has responded to your ticket TKT000001" |

### Vendor Notifications
| Event | Message Example |
|-------|----------------|
| New Booking | "New car rental booking in Mumbai. Tap to view details" |
| New Quote Request | "Shrusti is looking for Bus Rental in Ahmedabad" |
| Quote Accepted | "Your quote for bus rental has been accepted!" |
| Payment Received | "Advance payment of ₹5,000 received for booking BUS-2026-XXX" |
| Trip Completed | "Trip CB-2026-XXX marked as completed" |
| New Review | "Customer rated your service 5 stars!" |

### Driver Notifications
| Event | Message Example |
|-------|----------------|
| New Assignment | "You've been assigned to booking CB-2026-XXX" |
| Trip Reminder | "Upcoming trip tomorrow at 10:00 AM" |
| OTP Generated | "Trip OTP generated. Share with customer for verification" |

### Notification Channels
- **Push Notifications** — Firebase Cloud Messaging (Android + iOS)
- **In-App** — Notification center with read/unread
- **Email** — Booking confirmations, payment receipts
- **Real-time** — Socket.io for instant updates

---

## 9. Chat & Messaging

### Customer ↔ Vendor Chat
- **Booking-specific** — Each booking has its own conversation
- **Real-time** — Instant message delivery via Socket.io
- **Media Support** — Send images, documents
- **Read Receipts** — See when messages are read

### Smart Shivi (AI Chatbot)
- Available on all service pages
- Conversational booking assistant
- Date/time selection with validation
- Service recommendations based on needs
- Hands-free booking creation

### Vendor ↔ Vendor (Social DM)
- Direct messaging between vendors
- Community interaction
- P2P deal negotiations

---

## 10. Special Features

### 10.1 Multi-Stop Outstation
- Add unlimited intermediate stops on outstation trips
- Each stop shows as a route leg with approximate distance
- Route breakdown: From → Stop 1 → Stop 2 → ... → Destination
- KM calculated per leg, total minimum KM applied

### 10.2 12-Hour Advance Booking Rule
- Pickup must be at least 12 hours from booking time
- Animated warning alert with earliest available pickup time
- Applied across all 8 services (web + app)
- Blocks form submission, not just date picker

### 10.3 Custom Time Picker
- Cross-browser consistent (replaces native `<input type="time">`)
- Explicit AM/PM toggle
- Hour (01-12) and Minute (00-55) dropdowns
- Works identically in Chrome, Firefox, Safari, Edge

### 10.4 B2B Corporate Bookings
- Corporate customer registration with approval workflow
- Bulk booking with multiple vehicles
- Pre-loaded wallet for quick payments
- Auto-generated invoices
- Dedicated support channel

### 10.5 Vendor P2P Marketplace
- Vendors share excess vehicle capacity
- Other vendors can book available vehicles
- Rating system for vendor-to-vendor trust
- Reduces empty return trips

### 10.6 Location Intelligence
- GPS-based auto-detection on app load
- IP-based fallback when GPS unavailable
- 100+ Indian cities supported
- Location-specific pricing and availability
- Service pages for every city × service combination

### 10.7 Wander (Tours & Experiences)
- Tour packages created by vendors
- Customer quote requests for custom itineraries
- Booking + review system
- Wishlist feature for saving tours

### 10.8 Vendor Social Feed
- Instagram-style posts with images
- SOS emergency posts (24-hour expiry)
- Like, comment, save functionality
- Vendor following system
- Community building among vendors

### 10.9 Booking Links & QR Codes
- Vendors generate shareable booking links
- QR code for offline-to-online conversion
- Direct checkout from shared link
- Analytics on link usage

### 10.10 Web Stories
- Visual stories (like Instagram Stories) on website
- Multiple slides with text overlays
- Emoji reactions from visitors
- Auto-expiry after 24 hours
- SEO-optimized for Google Discover

---

## Brand & Design Notes

### Color Palette
| Role | Primary | Secondary |
|------|---------|-----------|
| Global Brand | `#09B368` (Teal Green) | `#064E3B` (Deep Green) |
| Customer App | `#09B368` → `#047857` gradient | White backgrounds |
| Vendor Portal | `#1E293B` (Dark sidebar) | Indigo accents |
| Admin/Manager | Indigo `#4F46E5` | Purple `#7C3AED` |

### Typography
- **Headings:** Bold, tight tracking
- **Body:** 13-14px, medium weight
- **Labels:** 11px, uppercase, wider tracking
- **Status Badges:** Rounded pills, color-coded per status

### Status Color Coding
| Status | Color | Hex |
|--------|-------|-----|
| Pending | Yellow/Amber | `#F59E0B` |
| Confirmed | Green | `#09B368` |
| In Progress | Blue | `#3B82F6` |
| Completed | Dark Green | `#059669` |
| Cancelled | Red | `#EF4444` |

---

## 11. Key Feature Deep-Dives

### 11.1 OTP-Based Trip Verification
Ensures secure vehicle handover between driver/vendor and customer.

**How it works:**
1. Driver clicks "Request OTP" on assigned booking
2. System generates 4-digit OTP → sent to customer via notification
3. Customer shares OTP with driver at pickup point
4. Driver enters OTP → System verifies → Trip status changes to "In Progress"
5. At drop-off, similar verification for trip completion

**Applied to:** Car Rental (Chauffeur), Self-Drive, Luxury, Bus
**Security:** OTP has expiry time, one-time use, cannot be reused

### 11.2 Rating & Review System
After every completed booking, both parties can rate each other.

**Customer rates:**
- Overall Experience (1-5 stars)
- Driver Rating (1-5 stars) — for chauffeur services
- Vehicle Condition Rating (1-5 stars)
- Written Review (optional text)

**Vendor sees:**
- Average rating on profile
- Per-booking reviews
- Rating trends over time

**Display:**
- Customer app: After trip completion, rating popup
- Vendor dashboard: Reviews page with all ratings
- Public: Rating shown on vendor profile for trust

### 11.3 Booking Cancellation & Refund
**Customer can cancel:**
- Before vendor accepts → Full refund
- After vendor accepts → Partial refund (depends on policy)
- Cancellation reason required

**Vendor can reject:**
- Before accepting → Booking goes back to broadcast
- After accepting → Needs manager/admin approval

**Manager/Admin can cancel:**
- Any booking at any stage
- With reason (shown to customer)
- Triggers refund process

**Refund Flow:**
- Auto-calculated refund amount
- Razorpay refund API triggered
- Customer notified of refund status
- Refund tracked in payment history

### 11.4 Invoice & Receipt Generation
**Auto-generated invoices for every completed booking:**
- Booking number, date, service type
- Customer details (name, phone, email)
- Vendor details (business name, GSTIN)
- Route details (from → stops → to)
- Fare breakdown (distance, per km, driver allowance, toll)
- GST calculation (18%)
- Payment summary (advance paid, balance, total)
- Digital format viewable in app

**Customer App:** Invoice screen accessible from booking details
**Vendor Portal:** Invoice management with download/print

### 11.5 Spin & Win (Gamification)
**Customer engagement feature:**
- Spinning wheel with discount coupons
- Available on customer dashboard
- Random discount allocation (5%, 10%, 15%, 20%)
- Coupon valid for next booking
- Limited spins per day/week
- Animated spinning wheel UI

### 11.6 Backr Tokens (Loyalty Program)
**Earn tokens on every booking:**
- Percentage of booking value earned as tokens
- Token wallet with balance display
- Transaction history (earned, redeemed, expired)
- Redeem tokens for discount on future bookings
- Token burn analytics for business tracking

### 11.7 Vendor Quote Templates
**Pre-saved pricing templates for faster quote responses:**
- Create templates per vehicle type
- Save commonly used pricing structures
- One-click apply template when responding to quote request
- Edit before sending
- **Available for:** Bus, Truck, Equipment, Packers, Luxury, Bike

### 11.8 Vendor Booking Links & QR Codes
**Offline-to-online conversion tool:**
- Vendor generates unique booking link for their fleet
- Auto-generates QR code for the link
- Customer scans QR → Opens booking page with vendor pre-selected
- Direct checkout without browsing
- Analytics: Click count, conversion tracking
- **Use case:** Vendor puts QR on vehicle, shop, business card

### 11.9 Vendor Direct Bookings
**For bookings made outside the platform:**
- Vendor manually enters booking details
- Track offline bookings in one dashboard
- Expense tracking per booking
- Revenue reporting includes direct bookings
- Maintains complete booking history

### 11.10 Vendor Calendar View
**Visual booking calendar:**
- Day/Week/Month view
- Color-coded by service type
- See all bookings across services
- Identify availability gaps
- Click booking to view details

### 11.11 Fleet Management (Detailed)
**Complete vehicle lifecycle management:**

| Feature | Description |
|---------|-------------|
| Vehicle Inventory | Add/edit vehicles with full specs |
| Availability Calendar | Set available dates, block dates |
| Document Management | Upload RC, Insurance, Permit, PUC |
| Document Alerts | Expiry reminders for insurance, permits |
| Maintenance Records | Service history, next service due |
| Fuel Records | Track fuel expenses per vehicle |
| Incident Reports | Accidents, damages, insurance claims |
| Analytics | Utilization rate, revenue per vehicle |

### 11.12 Staff Management (Vendor)
**Driver & team management:**

| Feature | Description |
|---------|-------------|
| Add Staff | Drivers, Helpers, Mechanics, Supervisors |
| Attendance | Daily attendance tracking |
| Assignment | Assign drivers to bookings |
| Documents | License, ID proof, verification |
| Performance | Trip count, ratings, complaints |

### 11.13 Vendor CRM
**Customer relationship management:**
- Lead tracking from inquiries
- Customer interaction history
- Follow-up reminders
- Conversion funnel tracking
- Communication templates (SMS, WhatsApp templates)

### 11.14 Vendor Financials Dashboard
**Complete financial overview:**
- Total earnings (monthly/weekly/daily)
- Booking-wise revenue breakdown
- Service-wise earnings comparison
- Payout history & schedule
- Bank account management
- Expense tracking
- Profit/Loss summary
- Invoice management
- Wallet balance (for B2B payouts)

### 11.15 Vendor Branches
**Multi-location vendor support:**
- Add multiple branch offices
- Branch-wise fleet allocation
- Location-specific pricing
- Branch manager assignment
- Per-branch analytics

### 11.16 B2B Corporate Booking (Detailed)
**Enterprise vehicle management:**

**For Corporate Customers:**
- Company registration with GST details
- Admin approval workflow
- Dedicated account manager
- Pre-loaded wallet for instant bookings
- Bulk booking creation (multiple vehicles at once)
- Monthly invoicing (instead of per-booking payment)
- Employee-wise booking tracking

**For Vendors:**
- B2B quote requests with higher volume
- Super Quote system (one quote for multiple vehicles)
- Dedicated fleet allocation for corporate clients
- Monthly settlement instead of per-trip

**B2B Booking Status Flow:**
```
DRAFT → ISSUED → PARTIALLY_PAID → PAID → TRIPS_CREATED → COMPLETED
```

### 11.17 Advance Payment & Security Deposit System
**Two-tier payment protection:**

| Component | Amount | When | Refund |
|-----------|--------|------|--------|
| Advance Payment | 30% of total fare | At booking confirmation | Refundable on cancellation (policy-based) |
| Security Deposit | ₹2,000 (configurable) | Self-drive only, at pickup | Refunded after damage inspection |
| Balance Payment | 70% remaining | At trip completion or invoice | N/A |

**Advance Payment Verification:**
1. Customer pays via Razorpay
2. Razorpay webhook triggers verification
3. HMAC signature validated (cryptographic)
4. Status auto-updates: PENDING_PAYMENT → PAYMENT_VERIFIED
5. Vendor receives instant notification
6. Booking moves to BROADCASTED (for quote-based) or ACCEPTED

### 11.18 Real-time Vendor Broadcasting
**How vendors receive booking requests:**
1. Customer creates booking/quote request
2. System identifies eligible vendors:
   - Same location/city
   - Same service type active
   - Fleet available for the dates
3. Push notification sent to all matching vendors
4. Vendor sees notification with booking details
5. First vendor to accept gets the booking (first-come-first-serve)
6. Other vendors notified that booking is taken

**Broadcast tracking:**
- System tracks which vendors received notification
- Response time analytics
- Acceptance rate per vendor

---

## 12. Screen-by-Screen Reference (Customer App)

### Authentication Screens
| Screen | Description |
|--------|-------------|
| Splash Screen | App logo, auto-login check |
| Login | Phone + OTP / Google Sign-in |
| Register | Name, email, phone, password |
| OTP Verification | 4-digit code entry |

### Main Navigation (Bottom Tabs)
| Tab | Screen | Key Features |
|-----|--------|--------------|
| Home | CustomerDashboard | Categories, stats, bookings, quotes |
| Payments | ExpensesScreen | Payment history, receipts |
| Bookings | MyBookingsScreen | All bookings with filters |
| Chat | BookingChatListScreen | All conversations |

### Service-Specific Screens
| Service | Home Screen | Fleet/Selection | Booking Detail | Quote Detail |
|---------|------------|-----------------|----------------|--------------|
| Bike | BikeRentalScreen | BikeFleetScreen | BikeBookingDetailScreen | BikeQuoteRequestDetailScreen |
| Car (Chauffeur) | — | CarRentalFleetScreen | BookingDetailScreen | — |
| Self-Drive | SelfDriveScreen | SelfDriveFleetScreen | SelfDriveBookingDetailScreen | SelfDriveQuoteRequestDetailScreen |
| Luxury | LuxuryScreen | LuxuryCarRentalScreen | LuxuryBookingDetailScreen | — |
| Bus | BusRentalScreen | BusRentalFleetScreen | BusBookingDetailScreen | BusQuoteRequestDetailScreen |
| Truck | TruckRentalScreen | — | TruckBookingDetailScreen | TruckQuoteRequestDetailScreen |
| Equipment | EquipmentScreen | — | EquipmentBookingDetailScreen | EquipmentQuoteRequestDetailScreen |
| Packers | PackerMoverScreen | — | PackersBookingDetailScreen | PackersQuoteRequestDetailScreen |

### Other Screens
| Screen | Description |
|--------|-------------|
| BookingConfirmation | Success screen after booking |
| InvoiceScreen | View/download booking invoice |
| PaymentScreen | Razorpay payment flow |
| BackrTokensScreen | Loyalty token wallet |
| SpinAndWinModal | Gamification wheel |
| NotificationScreen | All notifications |
| HelpdeskScreen | Support tickets |
| SettingScreen | Profile, preferences, logout |
| BookingChatScreen | 1-on-1 vendor chat |

---

## 13. Screen-by-Screen Reference (Vendor Web)

### Main Pages (80+ pages)
| Section | Key Pages | Features |
|---------|-----------|----------|
| Dashboard | /vendor/dashboard | Revenue, notifications, quick actions |
| Car Rental | /vendor/car-rental/bookings | Accept/Reject, trip management |
| Bike Rentals | /vendor/bike-rentals/* | Bookings, requests, earnings |
| Bus | /vendor/bus/* | Fleet, requests, quotes, earnings |
| Truck | /vendor/mini-truck/* | Requests, quotes, bookings |
| Equipment | /vendor/equipment/* | Requests, quotes, templates |
| Packers | /vendor/packers/* | Requests, quotes, templates |
| Luxury | /vendor/luxury/* | Fleet, quotes, bookings, rates |
| Self-Drive | /vendor/self-drive/* | Fleet, bookings, earnings |
| Fleet | /vendor/fleet/* | Vehicles, documents, fuel, incidents, analytics |
| Staff | /vendor/staff/* | Drivers, attendance, performance |
| Calendar | /vendor/calendar | Visual booking calendar |
| Direct Bookings | /vendor/direct-bookings/* | Manual entry, expenses |
| Booking Links | /vendor/booking-links | QR codes, shareable links |
| Financials | /vendor/financials | Earnings, payouts, wallet |
| Earnings | /vendor/earnings | Revenue analytics |
| Expenses | /vendor/expenses | Cost tracking |
| Invoices | /vendor/invoices | Invoice management |
| Bank Details | /vendor/bank-details | Payout account setup |
| CRM | /vendor/crm | Leads, customer relations |
| Communication | /vendor/communication | Templates, messages |
| Reviews | /vendor/reviews | Customer feedback |
| Reports | /vendor/reports | Analytics & reports |
| Rates | /vendor/rates | Pricing configuration |
| Routes | /vendor/routes | Pre-defined routes |
| P2P | /vendor/p2p/* | Vendor-to-vendor marketplace |
| Social | /vendor/social/* | Community feed, DMs |
| Wander | /vendor/wander/* | Tour listings, quotes |
| Documents | /vendor/documents/* | Upload, alerts |
| Profile | /vendor/profile | Business info, settings |
| Notifications | /vendor/notifications | All alerts |
| Branches | /vendor/branches | Multi-location |
| Maintenance | /vendor/maintenance | Vehicle service records |
| Insurance | /vendor/insurance-claims | Claims management |
| Fines | /vendor/fines | Traffic fines tracking |
| Goals | /vendor/goals | KPI targets |
| Promotions | /vendor/promotions | Discount campaigns |
| Contracts | /vendor/contracts | Agreement management |
| Checklist | /vendor/checklist | Vehicle inspection lists |
| Audit Logs | /vendor/audit-logs | Action history |
| Media | /vendor/media | Image gallery |
| Quick Actions | /vendor/quick-actions | Shortcut buttons |
| Quotations | /vendor/quotations/* | Create/manage quotes |

---

## 14. Marketing Highlights & USPs

### For Customer Marketing
1. **"One Platform, 8 Services"** — Bike to Bus, Truck to Luxury, all in one app
2. **"Compare & Save"** — Multiple vendor quotes, choose the best price
3. **"Book 24/7"** — Online booking anytime (12-hour advance)
4. **"Verified Vendors"** — Document-verified, rated vendors only
5. **"Transparent Pricing"** — Full fare breakdown before booking, no hidden charges
6. **"Secure Payments"** — Razorpay powered, HMAC verified
7. **"Real-time Tracking"** — Know your booking status at every step
8. **"100+ Cities"** — Pan-India coverage across major cities
9. **"Smart Shivi"** — AI chatbot for effortless booking
10. **"Spin & Win"** — Gamified discounts on every visit
11. **"Backr Tokens"** — Earn loyalty points on every trip
12. **"Multi-Stop Outstation"** — Tour multiple cities in one booking
13. **"OTP Verified"** — Secure pickup with one-time code
14. **"Corporate B2B"** — Bulk bookings with wallet & invoicing

### For Vendor Marketing
1. **"Zero Commission Start"** — List your fleet for free
2. **"Auto Lead Generation"** — Receive booking requests automatically
3. **"Complete Business Suite"** — Fleet, staff, finance, CRM — all in one
4. **"P2P Marketplace"** — Fill empty seats, earn from idle capacity
5. **"Booking Links & QR"** — Convert offline customers to online bookings
6. **"Quote Templates"** — Respond to requests in seconds
7. **"Multi-Service"** — List across 8 services from one dashboard
8. **"Vendor Social"** — Network with other vendors, share SOS
9. **"Real-time Notifications"** — Never miss a booking opportunity
10. **"Analytics & Reports"** — Data-driven business decisions

### For Driver Marketing
1. **"Simple Interface"** — Just bookings, OTP, and earnings
2. **"OTP Security"** — Verified handover, no disputes
3. **"Earnings Tracking"** — See exactly what you earn per trip
4. **"Mobile Friendly"** — Web portal works on any phone browser

---

*Document prepared for TransRentals Design & Marketing Teams*
*Last updated: March 2026*
