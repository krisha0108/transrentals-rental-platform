# Travel Agent App — Gap Closure Plan (tr-vendor-app vs Web)

> Goal: bring the mobile Travel Agent experience (`tr-vendor-app/screens/travel-agent/*`)
> to one-to-one parity with the web (`src/app/travel-agent/*`).
>
> **Key finding:** the backend and most of the API client are already in place.
> The vast majority of gaps are **app-side UI + a few `travelAgentClient.js` wrappers**.
> No new database models are required for any item below.
>
> Conventions to honour:
> - TA theme = **emerald / teal** (vendor = blue/indigo). Reuse existing TA screen styling.
> - **No cross-role screen reuse** — TA screens use the TA client + TA cookie only.
> - All new client calls go through `tr-vendor-app/screens/api/travelAgentClient.js`.

Legend — Effort: **S** ≤ half day · **M** ~1–2 days · **L** ~3–5 days.

---

## PHASE A — Deal-closing / revenue flow  🔴 CRITICAL

This is the single biggest functional hole: an agent cannot quote, collect, or
fulfil a deal from the app. All endpoints already exist.

### A1. Lead Detail — Send / Update Quote  (M)
- **Web ref:** `src/app/travel-agent/(dashboard)/leads/[id]/page.tsx` (quote modal)
- **API (exists):** `PATCH /api/travel-agent/leads/[id]` accepts
  `quotedAmount, quoteAdvanceAmount, quoteAdvancePercent, quoteValidUntil, quoteTerms`
  (`quoteSentAt` auto-set; pass `status:'QUOTED'`).
- **App target:** `tr-vendor-app/screens/travel-agent/leads/LeadDetailScreen.js`
- **Client to add:** `sendTravelAgentLeadQuote(leadId, payload)` → PATCH above.
- **Build:** "Send Quote" button → modal with amount, advance (% or fixed toggle),
  validity (days → `quoteValidUntil`), terms/inclusions textarea. On save, set
  `status:'QUOTED'`, refresh lead. Show **Active Quote card** (total / advance /
  balance / validity / terms / sentAt) when `quotedAmount` present.

### A2. Payment proof review — view + Verify / Reject  (M)  ← most critical
- **Web ref:** `leads/[id]/page.tsx` payment card + `payments/page.tsx` inline actions
- **API (exists):** `PATCH /api/travel-agent/leads/[id]` with
  `paymentAction:'VERIFY'` (→ `paymentStatus=VERIFIED`, auto `status=BOOKED`) or
  `paymentAction:'REJECT'` + `paymentRejectReason`.
- **App targets:**
  - `leads/LeadDetailScreen.js` — add payment-proof card
  - `payments/PaymentsScreen.js` — add inline Verify/Reject + proof viewer
- **Client to add:** `travelAgentLeadPaymentAction(leadId, action, reason?)`.
- **Build:** render `lead.paymentProofImages` (image thumbnails → full-screen viewer),
  show txn id / submitted-at, **Verify** and **Reject (with reason modal)** buttons.
  - ⚠️ Confirm `GET /api/travel-agent/payments` returns `paymentProofImages` &
    `paymentTransactionId`; if not, fetch the lead for the proof. (Verify endpoint
    response shape — quick read before building.)
- **Note:** today verify/reject is possible **nowhere** in the app — this unblocks
  the cash-collection step.

### A3. Lead Detail — Assign fleet vehicles  (M)
- **Web ref:** `leads/[id]/page.tsx` vehicles section + modal
- **API (exists):**
  - `GET /api/travel-agent/leads/[id]/vehicles` → `{ assignments }`
  - `POST` same → body `{ fleetId, startDate, endDate, amount, notes, status }`
    (status `CONFIRMED|TENTATIVE|COMPLETED|CANCELLED`; **409** on date conflict
    with `{ conflict }`; dates fall back to lead travel/return dates)
  - `DELETE /api/travel-agent/leads/[id]/vehicles/[bookingId]`
- **App target:** `leads/LeadDetailScreen.js` (new "Assigned Vehicles" section)
- **Client to add:** `listTravelAgentLeadVehicles(leadId)`,
  `assignTravelAgentLeadVehicle(leadId, body)`,
  `unassignTravelAgentLeadVehicle(leadId, bookingId)`.
- **Build:** list current assignments (vehicle name/reg/dates/amount/status),
  "Assign vehicle" modal (pick from agent fleet, date range pre-filled from lead,
  amount, status). Handle **409 conflict** with a clear message. Link to Fleet Calendar.

### A4. Lead Detail — Start chat from lead  (S)
- **Web ref:** `leads/[id]/page.tsx` "Start Chat"
- **API (exists):** `POST /api/travel-agent-chat/conversations`
- **App target:** `leads/LeadDetailScreen.js` → on success navigate `TAChatThread`.
- **Client to add:** `startTravelAgentChatFromLead({ leadId, customerName, customerPhone })`.

### A5. Converted lead → booking deep-link  (S)
- **App target:** `leads/LeadDetailScreen.js` — when lead is `BOOKED` and a booking
  exists, replace the disabled "Already booked" badge with a tap → `TABookingDetail { id }`.
- Requires the convert response / lead to expose the booking id (already returned by
  `POST /leads/[id]/convert`). Persist it on convert and read on detail.

---

## PHASE B — Account recovery  🔴 CRITICAL

### B1. Forgot-password / OTP reset  (M)
- **Web ref:** `src/app/travel-agent/(auth)/forgot-password/page.tsx`
  (4 steps: send-OTP → verify-OTP → reset → done, 60s resend timer)
- **API (exists):** `/api/travel-agent/forgot-password` (read route to confirm the
  send/verify/reset payload shape).
- **App targets:** new screen
  `tr-vendor-app/screens/travel-agent/auth/TravelAgentForgotPasswordScreen.js`;
  register in `App.js` stack; link from the (unified) login screen for TA users.
- **Client to add:** `requestTAPasswordOtp(email)`, `verifyTAPasswordOtp(email, otp)`,
  `resetTAPassword(email, otp, newPassword)`.

---

## PHASE C — Fleet completeness  🟠 HIGH

### C1. Fleet Insurance / compliance dashboard  (M)
- **Web ref:** `fleet/insurance/page.tsx` (summary: expired/expiring/valid/missing;
  per-vehicle table; manage-docs modal)
- **API:** reuse `GET /api/travel-agent/fleet` (+ `fleet/[id]` for doc update).
- **App targets:** new `fleet/FleetInsuranceScreen.js`; add nav entry from Fleet list /
  More; register in `App.js`.
- **Build:** compute expiry buckets client-side from fleet rows; filterable list;
  tap vehicle → edit docs (reuse the AddEditFleet doc section or a focused modal).

### C2. Fleet form — missing fields  (S–M)
- **Web ref:** `fleet/add/page.tsx`, `fleet/[id]/edit/page.tsx`
- **App target:** `fleet/AddEditFleetScreen.js`
- **Add fields (backend already accepts):** `amenities` (preset chips + custom),
  vehicle **gallery** images (currently cover-only — use `ImagePickerField` multi),
  `minimumBookingHours`, `chauffeurLanguages`, `permitType`.

---

## PHASE D — Tours editor parity  🟠 HIGH (largest single item)

The app collapses web's Quick/Detailed flow into one simplified form and drops most
rich fields. Backend (`tours` route) + `travelAgentClient.js` already accept the full
payload (itinerary JSON, `vehicleIds`, `mainLocationId`, price tiers, etc.).

- **Web ref:** `tours/add/page.tsx` (6-step wizard), `tours/add/quick/page.tsx`,
  `tours/[id]/edit*`, `categories/route.ts`, `locations/route.ts`
- **App target:** `tours/AddEditTourScreen.js` (extend; keep single-screen, collapsible)

Sub-items (can ship incrementally):
- **D1 Category / sub-category** picker (wire existing `listTravelAgentCategories`). (S)
- **D2 Main-location DB search** → set `mainLocationId` (today free-text only). (S)
- **D3 Rich itinerary builder** — day → time, activities[], emoji, break stops,
  reorder (vs current day/title/description). (M)
- **D4 Group price tiers** (GROUP_BASED) alongside PER_PERSON / ON_REQUEST. (S–M)
- **D5 Vehicle attachment** (`vehicleIds` from agent fleet). (S)
- **D6 Advance-payment config** (require/type/value) + **fixed tour dates**. (S)
- **D7 Places-covered & pickup-area tags**, rich-text description, in-form preview. (M)
- Also add **attached-vehicles + terms + public-URL** to `TourPreviewScreen.js`.

---

## PHASE E — Medium parity gaps  🟡

### E1. Leads list — source filter  (S)
`leads/LeadsListScreen.js`: add Source filter control (client already supports
`source` param: MANUAL / CAPTURE_LINK / WEBSITE / REFERRAL / WALK_IN / SOCIAL / WHATSAPP).
Also show lead source on the card.

### E2. Add/Edit lead — field gaps  (S)
`leads/AddEditLeadScreen.js`:
- allow editing **`quotedAmount`** (web edit can),
- `nextFollowUp` as **datetime** (currently date-only),
- prompt for **`lostReason`** when status set to LOST (PATCH already records it).

### E3. Tour-quote-requests — filters + search  (S)
`tours/TourQuoteRequestsScreen.js`: add status stat-chips + priority filter + search
(mirror leads list; same `/leads?source=WEBSITE` data).

### E4. List-level toggles + inline delete  (M, spans 3 screens)
Add publish/active(/available) toggles + inline delete to list cards:
- `tours/ToursListScreen.js` (isPublic / isActive)
- `properties/PropertiesListScreen.js` (isActive / publish)
- `fleet/FleetListScreen.js` (**`isAvailable`** has no app control anywhere; `isActive`)
Today these are buried in the edit screens.

### E5. Bookings Add — tour/property reference picker  (S)
`bookings/AddEditBookingScreen.js`: replace free-text `referenceTitle` with a picker
that loads the agent's tours/properties and sets `referenceId` (web does this).

### E6. Social — story viewer + WhatsApp share card  (M)
- **SOS story strip + auto-advancing full-screen viewer** (web has it; app only filters).
  Targets: `social/SocialFeedScreen.js` (+ new `social/StoryViewerScreen.js`).
- **WhatsApp image-card share** (`generatePostCard` on web). App alt: render a card
  view → `react-native-view-shot` → `Share`. (Optional / nice-to-have.)

---

## PHASE F — Bugs & cleanup  🐛

### F1. Public-profile URL mismatch  (S) — verify first
Web profile share uses `/agent/{slug}`; app uses `/travel-agent/{slug}`
(`profile/AgencyProfileScreen.js`). Confirm the real public route and make both
consistent — otherwise shared links break.

### F2. Social image upload is dead UI  (S, decision needed)
`createPost` backend persists only `content` + `categoryId`; uploaded images are
silently dropped (web **and** app). Either (a) implement image persistence in
`/api/social/posts` + feed response, or (b) hide the image picker in
`social/CreatePostScreen.js` to stop misleading users. **Pick one.**

### F3. Remove stale placeholder screens  (S)
Delete unused dead code: `onboarding/TravelAgentGetStartedScreen.js` and
`onboarding/TravelAgentDocumentsScreen.js` (real flows use `GetStartedScreen.js` /
`documents/DocumentsScreen.js`). Remove any stack registrations.

---

## Suggested sequencing

1. **Phase A** (A2 → A1 → A3 → A4 → A5) — unblocks the money flow. _~1 week_
2. **Phase B** (forgot-password) — account recovery. _~½ day–1 day_
3. **Phase F1/F3** (quick bug + cleanup) — cheap wins alongside A/B.
4. **Phase C** (fleet insurance + form fields). _~2–3 days_
5. **Phase D** (tours editor) — largest; ship D1/D2/D5/D6 first, D3/D7 after. _~1 week_
6. **Phase E** (medium gaps) — incremental polish.
7. **Phase F2** (social images decision).

## Notes
- Areas where the **app is already ahead** of web (don't regress): dashboard,
  bank set-primary, notifications delete-all/grouping, follow-up quick actions,
  capture-link edit/share, chat search/filters/read-receipts, pipeline stats.
- Almost everything here is **frontend-only**; backend changes limited to F2 (if chosen)
  and any response-shape tweaks confirmed in A2.
