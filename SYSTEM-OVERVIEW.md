# TransRentals — Complete System Overview
**Date:** 2026-03-20

---

## 1. PLATFORM AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRANSRENTALS PLATFORM                       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Web App  │  │Customer  │  │ Vendor   │  │  Admin Panel │  │
│  │(Next.js) │  │  App(RN) │  │ App (RN) │  │  (Next.js)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                        ↕ API ↕                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Next.js API Routes (543 routes)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                        ↕                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  MySQL   │  │ Razorpay │  │ Firebase │  │  Socket.io   │  │
│  │(Prisma)  │  │(Payment) │  │  (FCM)   │  │ (Real-time)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ALL ROLES & WHO CAN DO WHAT

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                           │
│                                                                 │
│   SUPER_ADMIN ──── Full control (users, money, content, all)   │
│       │                                                         │
│   ADMIN ─────────── Platform mgmt (vendors, bookings, no $$$) │
│       │                                                         │
│   SUB_ADMIN ─────── Region-specific only                       │
│       │                                                         │
│   MANAGER ───────── Location + Service specific ops            │
│       │                                                         │
│   EDITOR ────────── Content only (blog, SEO, pages)            │
│                                                                 │
│   ─ ─ ─ ─ ─ ─ ─ SEPARATE PORTALS ─ ─ ─ ─ ─ ─ ─ ─            │
│                                                                 │
│   VENDOR ────────── Own bookings, fleet, staff, earnings       │
│     └── STAFF ───── DRIVER / HELPER / MECHANIC / SUPERVISOR    │
│                                                                 │
│   CUSTOMER (B2C) ── Browse, book, pay, track                   │
│   CUSTOMER (B2B) ── Bulk bookings, wallet, invoices            │
└─────────────────────────────────────────────────────────────────┘
```

### Login Methods
| Role | Method | Portal |
|------|--------|--------|
| Admin/SubAdmin/Manager/Editor | Email + Password | `/admin/login` |
| Vendor | Email + Password | `/vendor/login` |
| Driver | Phone + OTP | `/driver/login` |
| Customer | Email/Phone + OTP | `/login` |
| B2B Customer | Email + Password | `/login` (same, different flag) |

---

## 3. CORE BOOKING FLOW (All 8 Services)

### 3A. Quote-Based Flow (Bus, Truck, Equipment, Packers, Luxury, Bike-quote)

```
CUSTOMER                    SYSTEM                      VENDOR
   │                           │                           │
   │── Create Quote Request ──▶│                           │
   │   (dates, location,        │── Broadcast to all ──────▶│
   │    requirements)           │   vendors in location     │
   │                           │                           │──── See request
   │                           │                           │──── Send quote
   │◀─────────────── Notify ───│◀──── Quote submitted ─────│
   │                           │                           │
   │── Accept Quote ──────────▶│                           │
   │                           │──── Notify vendor ───────▶│
   │                           │                           │
   │── Pay Advance (30%) ─────▶│                           │
   │   (Razorpay)               │── Auto-verify signature   │
   │                           │── status: PAYMENT_VERIFIED│
   │                           │── Notify vendor ─────────▶│
   │                           │                           │
   │                    [Admin verifies &                   │
   │                     broadcasts if                      │
   │                     no vendor assigned]                │
   │                           │                           │
   │◀──────── Confirmed ───────│──── status: ACCEPTED ────▶│
   │                           │                           │
   │                    [Vendor assigns Driver]             │
   │                           │                           │
   │                    [Trip IN_PROGRESS]                  │
   │                           │                           │
   │◀──────── Completed ───────│──── status: COMPLETED ───▶│
```

### 3B. Browse-First Flow (Car Self-Drive, Bike browse)

```
CUSTOMER                    SYSTEM                      VENDOR
   │                           │                           │
   │── Browse fleet ──────────▶│                           │
   │── Filter (location, date) │                           │
   │── Select vehicle ────────▶│                           │
   │                           │                           │
   │── Pay Advance ───────────▶│                           │
   │   (Razorpay)               │── Auto-verify signature   │
   │                           │── status: PAYMENT_VERIFIED│
   │                           │── Notify pre-assigned ───▶│
   │◀──────── Confirmed ───────│                           │
   │                           │                           │
   │── Pickup OTP ────────────▶│                           │
   │   (Customer shows OTP)     │                           │
   │                           │── Vendor scans OTP ──────▶│
   │                           │── status: IN_PROGRESS     │
   │                           │                           │
   │── Return ────────────────▶│                           │
   │                           │── status: COMPLETED ─────▶│
```

### 3C. Booking Status Chain

```
PENDING_PAYMENT
     │
     ▼ (Customer pays Razorpay)
PAYMENT_VERIFIED / ADVANCE_PAID
     │
     ▼ (Auto or Admin broadcast)
BROADCASTED ──────────────────────── (Vendors notified)
     │
     ▼ (Vendor accepts)
ACCEPTED
     │
     ▼ (Driver assigned)
DRIVER_ASSIGNED / VEHICLE_ASSIGNED
     │
     ▼ (Trip starts, OTP verified)
IN_PROGRESS
     │
     ▼ (Trip ends)
COMPLETED

[CANCELLED] ← Can happen at any stage
[DROPPED]   ← System auto-drops if no vendor responds in time
```

---

## 4. PAYMENT FLOW

```
CUSTOMER
   │
   │── Pay ──────────────────────────────▶ RAZORPAY
   │                                           │
   │                                           │── Payment success
   │◀── razorpay_payment_id + signature ───────│
   │
   │── POST /api/payments/verify ─────────▶ SYSTEM
   │   {order_id, payment_id, signature,       │
   │    bookingId, bookingType}                │── Verify HMAC signature ✅
   │                                           │── Update DB: status=PAYMENT_VERIFIED
   │                                           │── Notify vendor (if pre-assigned)
   │◀── { success: true } ─────────────────────│

   [If manual payment:]
   │── Submit payment proof ──────────────▶ SYSTEM
   │                                           │── status: PAYMENT_SUBMITTED
   │                                           │── Admin notified
   │                                    ADMIN  │
   │                                       │───▶── Review proof
   │                                       │───▶── POST /api/admin/payments/verify
   │                                           │── status: BROADCASTED/ACCEPTED
   │◀── Confirmed ─────────────────────────────│
```

### Payment Calculation
```
Base Amount
  + GST (18%)
  = Grand Total
  × 30% = Advance Due

Security Deposit (₹2000 default) — separate
Balance = Grand Total - Advance (paid at completion)
```

---

## 5. VENDOR FLOW (Complete Lifecycle)

```
REGISTRATION
   │
   ▼
PENDING ──▶ Fill documents ──▶ DOCUMENTS_PENDING
                                      │
                               Admin reviews
                                      │
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
               UNDER_REVIEW      REJECTED         APPROVED
                     │                                 │
               (More docs)                      Can receive bookings
                                                       │
                                          ┌────────────┼────────────┐
                                          ▼            ▼            ▼
                                      SUSPENDED    BLOCKED    (Active)
```

### Vendor Daily Flow
```
Vendor App / Web Dashboard
         │
         ├── See new booking requests (notification + feed)
         │
         ├── Quote-based: Submit quote with price
         │
         ├── Browse-first: Accept/Reject booking
         │
         ├── Assign Driver from staff list
         │
         ├── Monitor trip (IN_PROGRESS)
         │
         ├── Mark complete
         │
         └── View earnings (⚠️ payout not automated yet)
```

---

## 6. B2B MODULE (Corporate Bulk Bookings)

```
B2B CUSTOMER (HR/Manager)         SYSTEM              VENDOR
        │                            │                    │
        │── Apply for B2B ──────────▶│                    │
        │                            │── Admin approves   │
        │◀── B2B Approved ───────────│                    │
        │                            │                    │
        │── Create Bulk Request ────▶│                    │
        │   (vehicles needed,         │── Broadcast ──────▶│
        │    dates, routes)           │   to vendors        │
        │                            │                    │── Submit super-quote
        │◀──────── Quotes arrive ────│◀─── super_quote ───│
        │                            │                    │
        │── Accept Quote ───────────▶│                    │
        │                            │── Create trips     │
        │                            │   (1 per vehicle)  │
        │                            │                    │
        │── Pay (wallet/Razorpay) ──▶│                    │
        │                            │── Notify vendor ──▶│
        │                            │                    │
        │                     [Vendor assigns drivers]     │
        │                            │                    │
        │── OTP verify pickup ──────▶│                    │
        │                            │                    │
        │                     [Trip IN_PROGRESS]           │
        │                            │                    │
        │◀── Invoice generated ──────│                    │
        │    (auto after completion)  │                    │

Invoice Flow:
DRAFT → ISSUED → PARTIALLY_PAID → PAID

B2B Wallet:
Recharge → Balance → BOOKING_DEBIT → REFUND (if cancel)
```

---

## 7. WANDER MODULE (Tours & Experiences)

```
CUSTOMER                    SYSTEM                   TOUR VENDOR
   │                           │                           │
   │── Browse listings ───────▶│                           │
   │   (category, location,     │                           │
   │    date, price)            │                           │
   │                           │                     [Vendor creates]
   │                           │                     [listing, pricing]
   │                           │                     [itinerary, images]
   │                           │                           │
   │── View listing ──────────▶│                           │
   │── Request quote ─────────▶│──── Notify vendor ───────▶│
   │                           │                           │── Send quote
   │◀──── Quote received ──────│◀─── Quote submitted ──────│
   │                           │                           │
   │── Accept + Pay ──────────▶│                           │
   │   (Razorpay)               │── Booking confirmed ─────▶│
   │                           │                           │
   │                    [Tour happens]                      │
   │                           │                           │
   │── Leave review ──────────▶│                           │
   │   (rating + text)          │                           │
   │                           │                           │
   │── Save to wishlist ───────▶│                           │
```

---

## 8. P2P MODULE (Vendor-to-Vendor Marketplace)

```
VENDOR A                    SYSTEM                   VENDOR B
(Has empty vehicle)            │                  (Needs vehicle)
   │                           │                           │
   │── Post vehicle ──────────▶│                           │
   │   (seats, route, date,     │                           │
   │    price per seat)         │                           │
   │                           │◀── Browse vehicles ───────│
   │                           │                           │
   │                           │◀── Send request ──────────│
   │◀───────── Notified ───────│                           │
   │                           │                           │
   │── Accept/Reject ─────────▶│──── Notify Vendor B ─────▶│
   │                           │                           │
   │                    [Transaction created]               │
   │                           │                           │
   │── Start trip ────────────▶│                           │
   │                           │                           │
   │── Complete trip ─────────▶│                           │
   │                           │                           │
   │── Rate Vendor B ─────────▶│◀─── Rate Vendor A ────────│

Use Case: Vendor A has bus Delhi→Mumbai with 10 empty seats.
          Vendor B has cargo for same route.
          They share the trip, split costs.
```

---

## 9. SOCIAL MODULE (Vendor Community)

```
VENDOR
   │
   ├── CREATE POST (text, image, category)
   │     └── Regular post (tips, news, general)
   │     └── SOS post (emergency, lasts 24hrs only)
   │
   ├── FEED (all vendor posts, newest first)
   │     └── Like / Comment / Save
   │
   ├── SOS FEED (only emergency posts < 24hrs old)
   │
   ├── FOLLOW vendors (see their posts in feed)
   │
   ├── PROFILE (own posts, follower count)
   │
   └── DIRECT MESSAGE (1-on-1 with other vendors)

Admin Controls:
   └── Manage categories (add/edit/delete)
   └── Mark categories as SOS
```

---

## 10. DRIVER FLOW (Complete)

```
DRIVER (Web Dashboard — no mobile app yet)
   │
   │── Login (Phone + Password OTP)
   │      └── /driver/login
   │
   │── Dashboard (active bookings count)
   │
   │── My Bookings
   │      └── Filter: active | completed | all
   │      └── Filter: car | bus | truck | packers | equipment | all
   │
   │── Booking Detail (/driver/bookings/[bookingNumber])
   │      └── See pickup/drop details
   │      └── Request OTP (for trip start)
   │      └── Enter customer OTP → START TRIP
   │      └── Complete trip
   │
   │── Earnings (per booking)
   │
   └── Notifications

Services Driver handles:
   Car (chauffeur) → DRIVER_ASSIGNED → IN_PROGRESS → COMPLETED
   Bus             → VEHICLE_ASSIGNED → IN_PROGRESS → COMPLETED
   Truck           → VEHICLE_ASSIGNED → LOADING → IN_TRANSIT → COMPLETED
   Packers         → TEAM_ASSIGNED → PACKING → LOADING → IN_TRANSIT → COMPLETED
   Equipment       → CONFIRMED → DELIVERED → IN_USE → COMPLETED
   Luxury          → DRIVER_ASSIGNED → [OTP] → IN_PROGRESS → COMPLETED
```

---

## 11. ADMIN FLOW (Daily Operations)

```
ADMIN PORTAL
   │
   ├── DASHBOARD (KPIs: revenue, bookings, vendors, customers)
   │
   ├── BOOKINGS
   │      └── View all bookings (all services)
   │      └── Verify manual payments
   │      └── Broadcast to vendors (if browse-first)
   │      └── Cancel / refund
   │
   ├── VENDORS
   │      └── Review applications (PENDING → APPROVED/REJECTED)
   │      └── Request more documents
   │      └── Suspend / block vendors
   │      └── Assign locations + services
   │
   ├── B2B
   │      └── Approve B2B customer applications
   │      └── View corporate bookings
   │      └── Manage invoices
   │
   ├── WANDER
   │      └── Approve tour listings
   │      └── Manage categories
   │
   ├── SOCIAL
   │      └── Manage social categories
   │      └── Flag/remove posts
   │
   ├── ANALYTICS (16 endpoints)
   │      └── Traffic, sessions, conversions
   │      └── SEO rankings, backlinks
   │      └── Revenue by service
   │      └── Multi-touch attribution
   │
   ├── PAYMENTS
   │      └── Configure Razorpay
   │      └── View settlements
   │      └── Process refunds
   │
   └── CONTENT (Editor role)
          └── Blog posts, pages, SEO meta
          └── Service descriptions
          └── Location pages
```

---

## 12. FULL SYSTEM DIAGRAM

```
                           ┌─────────────────────────────────────┐
                           │            TRANSRENTALS              │
                           └──────────────┬──────────────────────┘
                                          │
           ┌──────────────────────────────┼──────────────────────────────┐
           │                              │                              │
    ┌──────▼──────┐              ┌────────▼────────┐           ┌────────▼────────┐
    │  CUSTOMERS  │              │    VENDORS       │           │     ADMINS      │
    │             │              │                  │           │                 │
    │ B2C         │              │ APPROVED         │           │ SUPER_ADMIN     │
    │ B2B         │              │ PENDING          │           │ ADMIN           │
    │             │              │ SUSPENDED        │           │ SUB_ADMIN       │
    └──────┬──────┘              └────────┬─────────┘           │ MANAGER         │
           │                             │                      │ EDITOR          │
           │                             │                      └────────┬────────┘
           │                    ┌────────┴─────────┐                    │
           │                    │   VENDOR STAFF    │                    │
           │                    │ DRIVER / HELPER   │                    │
           │                    │ MECHANIC          │                    │
           │                    └──────────────────┘                    │
           │                                                             │
           └────────────────────────┬────────────────────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │   8 SERVICES    │
                           │                 │
                           │ 1. Bike Rental  │
                           │ 2. Car Rental   │
                           │ 3. Bus Rental   │
                           │ 4. Truck/Cargo  │
                           │ 5. Packers      │
                           │ 6. Luxury Cars  │
                           │ 7. Equipment    │
                           │ 8. Chauffeur    │
                           └────────┬────────┘
                                    │
           ┌─────────────────────────┼──────────────────────┐
           │                         │                      │
    ┌──────▼──────┐         ┌────────▼────────┐   ┌────────▼────────┐
    │    B2B      │         │     WANDER       │   │      P2P        │
    │ Corporate   │         │ Tours &          │   │ Vendor-Vendor   │
    │ Bulk Book   │         │ Experiences      │   │ Marketplace     │
    │ Wallet      │         │                  │   │                 │
    │ Invoice     │         └────────┬─────────┘   └────────┬────────┘
    └─────────────┘                 │                      │
                                    │                      │
                           ┌────────▼─────────────────────▼────┐
                           │           SOCIAL                   │
                           │    Vendor Community Platform       │
                           │    Posts / SOS / DMs / Follow      │
                           └────────────────────────────────────┘
```

---

## 13. TECH STACK SUMMARY

```
Frontend (Web)      → Next.js 14 App Router + TypeScript + Tailwind + Shadcn
Frontend (Apps)     → React Native (Customer 0.78 / Vendor 0.79)
Auth                → NextAuth JWT (30-day sessions) + OTP for driver
Database            → MySQL + Prisma ORM (90+ models, 5622 lines schema)
Payments            → Razorpay (HMAC signature verify)
Push Notifications  → Firebase FCM (customer + vendor + driver tokens)
Real-time           → Socket.io (vendor rooms, booking rooms, location rooms)
Email               → Nodemailer
API                 → 543 Next.js API Routes
Build               → Docker + Coolify
Static Pages        → 27,209 generated (SEO — location × service combinations)
```

---

## 14. KNOWN GAPS (Current State)

```
❌ Driver has NO mobile app — uses web browser in field
❌ Vendor payout = hardcoded 0 — not calculated
❌ Security deposit refund = no logic
❌ Staff payment history = not saved (TODO in code)
❌ 6/8 services missing post-payment vendor notifications
❌ Admin must manually broadcast browse-first bookings
❌ OTP generation not cryptographically secure
❌ Admin payment verify endpoint has no auth check
❌ Rate limiting in-memory (not distributed)
❌ 237 API files with @ts-nocheck
```

---

## 15. WHAT'S WORKING WELL

```
✅ Razorpay payment + auto HMAC verification
✅ Multi-vendor broadcast system
✅ Firebase FCM push to customer + vendor + driver
✅ Socket.io real-time updates
✅ B2B full flow (wallet, invoices, trips)
✅ Wander module (listings, quotes, bookings, reviews)
✅ P2P vendor marketplace (post, request, transact, rate)
✅ Social (posts, SOS, DM, follow, feed)
✅ Driver web portal (OTP, trip start/end, earnings)
✅ 27,209 SEO-optimized static pages
✅ Rate limiting (basic)
✅ Input sanitization + XSS protection
✅ Quote-based flow (all 6 services)
✅ Admin role hierarchy + permissions
✅ Vendor approval workflow
```
