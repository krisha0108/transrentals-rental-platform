# Travel Agent Module — Implementation Plan & Progress

A new user type parallel to **vendors**, with their own dashboard, login,
lead management, tours, properties, and bookings.

- **Color theme:** emerald / teal (vendor uses blue / indigo)
- **Auth:** separate NextAuth credentials provider, separate cookie
  (`next-auth.session-token-travel-agent`)
- **Soft-access mode:** non-approved agents can still manage their own data
  (leads, tours, properties, bookings); only customer-facing public features
  (lead capture links, public tour/property visibility, shareable booking links)
  unlock after admin approval.

---

## Architecture Overview

```
src/
├── app/
│   ├── travel-agent/
│   │   ├── (auth)/                    # login, register, forgot-password
│   │   ├── (dashboard)/               # protected dashboard (middleware-guarded)
│   │   │   ├── dashboard/             # KPI overview
│   │   │   ├── leads/                 # lead management (CRUD + notes + edit)
│   │   │   ├── pipeline/              # drag-drop kanban
│   │   │   ├── follow-ups/            # daily / weekly buckets
│   │   │   ├── capture-links/         # shareable public form generator
│   │   │   ├── tours/                 # PHASE 3
│   │   │   ├── properties/            # PHASE 3
│   │   │   ├── bookings/              # PHASE 4
│   │   │   ├── profile/, documents/, bank-details/
│   │   │   └── ...
│   │   ├── lead/[slug]/               # PUBLIC capture form (no auth)
│   │   ├── booking/share/[token]/     # PHASE 4 — public booking-fill link
│   │   └── page.tsx                   # redirect → dashboard
│   ├── api/
│   │   ├── travel-agent/              # all travel-agent APIs
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── register/, forgot-password/, profile/
│   │   │   ├── documents/, bank-details/, dashboard/
│   │   │   ├── leads/, leads/[id]/, leads/[id]/notes/
│   │   │   ├── follow-ups/
│   │   │   ├── capture-links/, capture-links/[id]/
│   │   │   ├── lead-capture/[slug]/   # PUBLIC (no auth)
│   │   │   ├── tours/                 # PHASE 3
│   │   │   ├── properties/            # PHASE 3
│   │   │   └── bookings/              # PHASE 4
│   │   └── admin/
│   │       └── travel-agents/         # admin review/approve UI + APIs
│   └── admin/(protected)/travel-agents/  # admin pages
├── components/
│   └── travel-agent/layout/
│       ├── TravelAgentLayout.tsx      # soft-access banner + verify modal
│       └── TravelAgentSidebar.tsx     # approved vs pending nav menus
├── contexts/
│   └── TravelAgentVerificationContext.ts
└── lib/auth/
    ├── travel-agent-auth-options.ts   # NextAuth config (separate cookie)
    └── travel-agent-auth.ts           # getTravelAgentAuth() helper

prisma/migrations/20260429000001_add_travel_agents_module/migration.sql
prisma/schema.prisma                   # +9 models, +6 enums
```

---

## Database Schema

**Migration applied:** `20260429000001_add_travel_agents_module/migration.sql`

### New tables (9)

| Table                              | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `travel_agents`                    | Main user table (auth, agency info, status enum, FK to admin who approved) |
| `travel_agent_documents`           | KYC docs (GST, PAN, IATA, license, etc.) with verification flow |
| `travel_agent_bank_accounts`       | Multi-account payout setup                               |
| `travel_agent_leads`               | Customer enquiries — manual + capture-link sourced       |
| `travel_agent_lead_notes`          | Activity timeline per lead                               |
| `travel_agent_lead_capture_links`  | Shareable public form URLs                               |
| `travel_agent_tours`               | Tour/itinerary listings (Phase 3)                        |
| `travel_agent_properties`          | Resorts / hotels / rooms (Phase 3)                       |
| `travel_agent_bookings`            | Manual bookings + shareable customer-fill token (Phase 4)|

### New enums (6)

| Enum                                  | Values                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `travel_agents_status`                | PENDING, DOCUMENTS_PENDING, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED, BLOCKED |
| `travel_agent_documents_documentType` | GST_CERTIFICATE, PAN_CARD, AGENCY_REGISTRATION, IATA_CERTIFICATE, ...         |
| `travel_agent_documents_status`       | PENDING, VERIFIED, REJECTED                                                  |
| `travel_agent_lead_source`            | MANUAL, CAPTURE_LINK, WEBSITE, REFERRAL, WALK_IN, SOCIAL_MEDIA, ...           |
| `travel_agent_lead_status`            | NEW, CONTACTED, INTERESTED, QUOTED, NEGOTIATING, BOOKED, LOST, COLD          |
| `travel_agent_lead_priority`          | HOT, WARM, COLD                                                              |
| `travel_agent_property_type`          | RESORT, HOTEL, HOMESTAY, APARTMENT, VILLA, GUEST_HOUSE, HOSTEL, ROOMS, OTHER |
| `travel_agent_booking_status`         | DRAFT, PENDING_CUSTOMER, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED        |

---

## Phase 1 — Foundation ✅ COMPLETE

### Database
- [x] Prisma schema: 9 models + 6 enums appended to `prisma/schema.prisma`
- [x] Migration file: `20260429000001_add_travel_agents_module/migration.sql` (idempotent CREATE TABLE IF NOT EXISTS)
- [x] FKs set up (12 foreign keys including reverse relations on `admin_users`)

### Auth
- [x] `src/lib/auth/travel-agent-auth-options.ts` — NextAuth provider `travel-agent-credentials`, separate JWT cookie
- [x] `src/lib/auth/travel-agent-auth.ts` — `getTravelAgentAuth(request)` helper (reads cookie or Bearer token)
- [x] `src/app/api/travel-agent/auth/[...nextauth]/route.ts` — login route + rate limiting
- [x] `src/middleware.ts` — `/travel-agent/*` route protection (excludes `/lead/`, `/booking/share/`, auth pages)

### Public APIs
- [x] `register` — creates agent in `DOCUMENTS_PENDING` status
- [x] `forgot-password` — 3-step OTP flow

### Auth UI
- [x] `(auth)/login/page.tsx`
- [x] `(auth)/register/page.tsx`
- [x] `(auth)/forgot-password/page.tsx` — OTP + reset flow

### Dashboard shell
- [x] `(dashboard)/layout.tsx` — wraps with `SessionProvider` + `TravelAgentLayout`
- [x] `TravelAgentLayout.tsx` — soft-access banner + verification modal (3-step checklist)
- [x] `TravelAgentSidebar.tsx` — separate `approvedNavigationItems` vs `pendingNavigationItems`
- [x] `TravelAgentVerificationContext.ts`

### Self-service pages + APIs
- [x] `dashboard/page.tsx` + `api/travel-agent/dashboard` (KPI stats)
- [x] `profile/page.tsx` + `api/travel-agent/profile` (GET/PUT)
- [x] `documents/page.tsx` + `api/travel-agent/documents` (list/upload/delete; can't delete VERIFIED)
- [x] `bank-details/page.tsx` + `api/travel-agent/bank-details` (multi-account, primary flag)

### Admin management
- [x] `admin/(protected)/travel-agents/page.tsx` — list with filters/search/pagination
- [x] `admin/(protected)/travel-agents/pending/page.tsx` — pending review queue
- [x] `admin/(protected)/travel-agents/[id]/page.tsx` — detail + approve/reject/suspend/block
- [x] `api/admin/travel-agents/route.ts` — list
- [x] `api/admin/travel-agents/[id]/route.ts` — get + status update (APPROVE/REJECT/SUSPEND/UNSUSPEND/BLOCK)
- [x] `api/admin/travel-agents/[id]/documents/route.ts` — verify/reject documents

---

## Phase 2 — Lead Management ✅ COMPLETE

### APIs (8 routes)
- [x] `leads/route.ts` — list (filters: status/priority/source/search/pagination), create
- [x] `leads/[id]/route.ts` — get, update (auto-logs status changes as notes), delete
- [x] `leads/[id]/notes/route.ts` — list + add notes (bumps `lastContactAt`)
- [x] `follow-ups/route.ts` — overdue / today / this-week buckets
- [x] `capture-links/route.ts` — list, create (auto unique slug)
- [x] `capture-links/[id]/route.ts` — toggle active, delete
- [x] `lead-capture/[slug]/route.ts` — **PUBLIC** GET form metadata + POST submit (rate-limited)

### Pages (7)
- [x] `leads/page.tsx` — list with status chips (clickable filters), pagination
- [x] `leads/add/page.tsx` — full creation form (3 sections)
- [x] `leads/[id]/page.tsx` — detail with status pipeline + notes timeline + quick actions (call/WhatsApp/email)
- [x] `leads/[id]/edit/page.tsx` — edit form
- [x] `pipeline/page.tsx` — drag-drop kanban (6 stages: NEW → BOOKED, optimistic UI)
- [x] `follow-ups/page.tsx` — overdue / today / this-week buckets
- [x] `capture-links/page.tsx` — list + create + share (copy-to-clipboard) + toggle/delete
- [x] `lead/[slug]/page.tsx` — **PUBLIC** branded capture form, no auth needed

### Behavioral details
- [x] Status changes auto-append a note to the timeline
- [x] LOST status requires a reason (stored on lead + auto-logged in notes)
- [x] Public form blocks submissions for SUSPENDED/REJECTED/BLOCKED agents
- [x] Public form: 10-digit Indian phone validation
- [x] Capture link creation requires APPROVED status (soft-access exception)

---

## Phase 3 — Tours + Properties ✅ COMPLETE

### Goal
Travel agent can list:
- **Tours** — full itinerary packages (destination, days/nights, inclusions, gallery, starting price)
- **Properties** — resorts / hotels / rooms / villas / homestays (address, amenities, room count, check-in times)

### APIs (4 routes)
- [x] `tours/route.ts` — list (search, isActive/isPublic filters) + stats; create with auto unique-per-agent slug
- [x] `tours/[id]/route.ts` — get, update (publish-gating: only APPROVED can set `isPublic=true`), delete
- [x] `properties/route.ts` — list (filters: propertyType, city, search, isActive/isPublic) + stats; create with auto slug
- [x] `properties/[id]/route.ts` — get, update (publish-gating), delete

### Pages (6)
- [x] `tours/page.tsx` — card grid with cover image, price, badges (PUBLIC/DRAFT/INACTIVE), inline publish/active/delete actions
- [x] `tours/add/page.tsx` — 3-section form (Basic / Images / Itinerary & Terms) with gallery URL adder
- [x] `tours/[id]/edit/page.tsx` — same form pre-filled + Visibility section (active/publish toggles, publish disabled until approved)
- [x] `properties/page.tsx` — card grid with type/price badges, type filter dropdown, search, inline actions
- [x] `properties/add/page.tsx` — 4-section form (Basic / Address / Images / Amenities & Policies)
- [x] `properties/[id]/edit/page.tsx` — pre-filled form + Visibility section

### Soft-access vs approval (working as designed)
- ✅ Tour/property creation: allowed in soft-access (agents can prep listings before getting approved)
- 🔒 `isPublic` flag: only when `APPROVED` — non-approved agents see locked badge with "Requires Verification"; clicking the publish toggle in list view opens the verification modal
- Inline publish toggle on list page also gated through verification modal

---

## Phase 4 — Bookings ✅ COMPLETE

### Goal
- Agent adds a booking manually for a customer
- Optionally generates a **shareable customer-fill link** (`shareToken`) — customer
  opens it on phone, fills missing details, submits
- Agent gets the completed booking in their dashboard
- "Convert to Booking" on lead detail page pre-fills booking with lead data

### APIs (5 routes)
- [x] `bookings/route.ts` — list (filters: status/type/search) with stats + revenue totals; create with auto-generated `bookingNumber` (`TA-YYYYMMDD-XXXX`); resolves `referenceTitle` from chosen tour/property
- [x] `bookings/[id]/route.ts` — get, update, delete (ownership-checked)
- [x] `bookings/[id]/share/route.ts` — POST generate (1–30 day expiry, defaults 7) / DELETE revoke share token; auto-promotes DRAFT → PENDING_CUSTOMER on first generation
- [x] `booking-share/[token]/route.ts` — **PUBLIC** GET stripped booking view + POST customer fill (rate-limited; locks once status moves to CONFIRMED+)
- [x] `leads/[id]/convert/route.ts` — converts lead to booking in a transaction: creates booking, sets lead.status = BOOKED + lead.convertedBookingId, appends timeline note

### Pages (5)
- [x] `bookings/page.tsx` — table view with status & type filters, search, KPI cards (booked value, received, confirmed, awaiting customer), pagination
- [x] `bookings/add/page.tsx` — 4-section form (Booking Type / Customer / Trip Dates / Pricing); auto-loads existing tours/properties for "Pick a reference" dropdown; UI adapts to PROPERTY (check-in/out) vs other types (travel/return)
- [x] `bookings/[id]/page.tsx` — detail with status pipeline, pricing card (total/paid/balance), share-link panel (generate / copy / WhatsApp send / regenerate / revoke), customer fill notification
- [x] `bookings/[id]/edit/page.tsx` — edit form
- [x] `booking/share/[token]/page.tsx` — **PUBLIC** branded customer-fill page; shows pricing summary; locks editing once CONFIRMED; provides agent contact link

### Booking lifecycle
```
DRAFT (agent created)
  ↓ generate share link
PENDING_CUSTOMER (share link active, awaiting customer fill)
  ↓ agent confirms / customer fills + agent confirms
CONFIRMED (customer no longer editable)
  ↓
IN_PROGRESS → COMPLETED  (or CANCELLED at any point)
```

### Lead → Booking conversion (working)
- "Convert to Booking" button on lead detail page (replaced with "View Booking" once converted)
- Auto-derives bookingType from lead.tripType:
  - `ACCOMMODATION` → PROPERTY (uses checkInDate/checkOutDate)
  - `TOUR_PACKAGE` → TOUR
  - `ONE_WAY` / `ROUND_TRIP` → TRANSPORT
  - else → CUSTOM
- Pre-fills customer info, dates, passenger count, requirement → notes, quotedAmount → totalAmount
- Sets lead.status = BOOKED + lead.convertedBookingId
- Auto-appends a timeline note: "Converted to booking TA-YYYYMMDD-XXXX (₹amount)"

### Share-link UX details
- 7-day default expiry (1–30 day range)
- Cryptographically random URL-safe token (32 chars)
- Public endpoint blocks: invalid token (404), expired (410), suspended/blocked agent (403)
- Customer can re-edit until status moves to CONFIRMED+
- Send-via-WhatsApp button uses `wa.me/91<phone>?text=...` with prefilled message containing the link

---

## Open Decisions (Deferred)

| Topic                  | Status   | Notes                                                                  |
| ---------------------- | -------- | ---------------------------------------------------------------------- |
| **Commission model**   | Deferred | Manual settlement for now; `commissionRate` column reserved on schema  |
| **Pricing visibility** | Deferred | Discuss whether agents see vendor base rates (for markup) or only customer-facing rates |
| **Travel agent staff** | Deferred | Phase 5+ — sub-users under one agency. For now `assignedToName` is a free-text field on leads |
| **FCM notifications**  | Deferred | Phase 5+ — push notifications for new leads, follow-up reminders       |
| **Quotation engine**   | Deferred | Phase 5+ — generate PDF quote and send to customer                     |

---

## Decisions Already Made

| Question                                             | Answer                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Commission auto-calc?                                | No — manual later                                                               |
| Lead source: manual only or also public form?        | **Both** — manual entry + shareable capture links                               |
| Tours/properties: who lists them?                    | Travel agent lists their own (separate from vendor's wander listings)            |
| Booking flow: agent-only or also customer self-fill? | **Both** — agent adds, optional shareable link for customer to complete         |
| Reuse vendor leads module?                           | **No** — built fresh for travel agent                                           |
| Approval gating: hard or soft?                       | **Soft** — agent can manage own data; only public-facing features need approval |

---

## Test Accounts (for QA)

To create a test travel agent:
1. Visit `/travel-agent/register`
2. Fill the form (status will be `DOCUMENTS_PENDING`)
3. Login at `/travel-agent/login` — soft-access mode
4. As admin, visit `/admin/travel-agents` → click into agent → click "Approve"
5. Re-login as agent — full menu unlocks

## How to Run Migrations on a Fresh DB

```bash
cd c:/Users/Admin/Videos/050326/tran_stable
# Apply travel-agent migration via mysql CLI
Get-Content prisma/migrations/20260429000001_add_travel_agents_module/migration.sql -Raw |
  & "C:\xampp\mysql\bin\mysql.exe" -h 127.0.0.1 -u root trans0503

# Regenerate Prisma client
npx prisma generate
```

---

_Last updated: 2026-04-29 — All 4 phases complete. Module is feature-complete for MVP._
