# WhatsApp Cloud API integration

Direct integration with Meta WhatsApp Business Cloud API (no BSP). Costs ~₹0.12 per Utility-category message.

## Files in this folder

- `client.ts` — core API client + high-level helpers `sendBookingConfirmation()` / `sendInquiryReceived()`
- `templates.ts` — registry of template names (must match what's approved in Meta)
- `phone.ts` — Indian phone number normalizer (handles +91, 91, leading 0, plain 10-digit)

## Where it's wired up

- `src/app/api/bookings/confirm-payment/route.ts` — fires `sendBookingConfirmation` after each booking type's payment is submitted (bike, car, bus, truck, packers, equipment, chauffeur, luxury). Wander has a TODO since its schema uses a customer relation.
- `src/app/api/contact/route.ts` — fires `sendInquiryReceived` after a contact inquiry is saved.

All sends are **fire-and-forget**: a WhatsApp failure logs but never blocks the API response.

---

# 📋 Complete Integration Roadmap

## PART 1 — Credentials & Data Required

### Dev mode (testing)

| # | Credential | Where to get it |
|---|---|---|
| 1 | `WHATSAPP_TOKEN` (temporary, 24hr) | Meta dev console → WhatsApp → API Setup → "Temporary access token" |
| 2 | `WHATSAPP_PHONE_NUMBER_ID` | Same page, "From" section → Phone number ID |
| 3 | `WHATSAPP_BUSINESS_ACCOUNT_ID` | Same page (optional, for reference) |
| 4 | Test recipient numbers (max 5) | Your own numbers — whitelist them in Meta dev console |
| 5 | Meta test phone number | Auto-provisioned by Meta — no action needed |
| 6 | 2 approved templates | Submit in Meta WhatsApp Manager → wait 24-48 hr |

### Live mode (production)

| # | Credential | Difference from dev |
|---|---|---|
| 1 | `WHATSAPP_TOKEN` (**permanent** System User token) | Dev token expires in 24hr; permanent token via business.facebook.com → System Users |
| 2 | `WHATSAPP_PHONE_NUMBER_ID` (real TR number) | Replace Meta test number with actual TransRentals business number |
| 3 | `WHATSAPP_BUSINESS_ACCOUNT_ID` | Same |
| 4 | Verified business display name | "TransRentals" (Meta approves) — shown to customers as sender |
| 5 | Templates **APPROVED** & **ACTIVE** | Same templates, no resubmit needed unless edited |

When `WHATSAPP_TOKEN` is empty, all sends are silently skipped (logged at debug level). So this code is safe to deploy *before* credentials arrive.

---

## PART 2 — Meta Business Account Setup (chronological)

### Phase A: Foundation (1-2 days)

**Step 1: Meta Business Manager account**
- URL: https://business.facebook.com
- "Create Account" → TransRentals name, sauravsingh@transrentals.in, phone
- Fill business details (legal name, address, GST)

**Step 2: Facebook Developer account**
- URL: https://developers.facebook.com
- Login with same Meta credentials
- Verify phone + email

**Step 3: WhatsApp Business app**
- developers.facebook.com → My Apps → **Create App**
- Type: **Business**
- Use case: WhatsApp
- App name: "TransRentals WhatsApp"
- Link to Business Manager (TransRentals in dropdown)

**Step 4: Add WhatsApp product**
- App dashboard → "Add Product" → **WhatsApp** → Set Up
- Auto-creates a Meta WhatsApp Business Account (WABA)
- API Setup tab gives 3 things → paste into `.env`:
  - Temporary access token (24hr)
  - Phone number ID (Meta test number)
  - WhatsApp Business Account ID

### Phase B: Templates approval (24-48 hr)

**Step 5: Submit both templates**
- Meta dev console → WhatsApp → **Message Templates** → "Create Template"

**Template 1:**
- Name: `booking_confirmation`
- Category: **Utility**
- Language: **English** (en)
- Body:
  ```
  Hello {{1}}, your TransRentals booking {{2}} is confirmed!
  Pickup: {{3}} | Service: {{4}}
  Track your ride at https://transrentals.com
  ```
- Sample values: {{1}}=Saurav, {{2}}=TR-001, {{3}}=22 May 2026, {{4}}=Bike rental

**Template 2:**
- Name: `inquiry_received`
- Category: **Utility**
- Language: **English**
- Body:
  ```
  Hi {{1}}, thanks for reaching out to TransRentals!
  We've received your inquiry about "{{2}}" and our team will get back to you within a few hours.
  ```

**Step 6:** Wait 24-48 hr. Status must be `APPROVED`. If `REJECTED` → edit + resubmit.

### Phase C: Dev testing (after template approval)

**Step 7: Whitelist your personal number**
- Meta dev console → WhatsApp → **API Setup**
- "To" dropdown → **Manage phone number list** → "Add phone number"
- Enter number with +91 → verify OTP
- Max 5 numbers allowed

**Step 8: Test in 3 levels** (see Testing section below)

### Phase D: Business Verification (1 week — unlocks Live mode)

**Step 9: Start Business Verification**
- business.facebook.com → **Security Center** OR Business Settings → **Business Info**
- "Start Verification" → fill form

**Documents required:**

| Document | Purpose |
|---|---|
| GST Certificate OR Certificate of Incorporation | Legal entity proof |
| PAN Card (business, not personal) | Tax ID |
| Utility bill OR bank statement (last 3 months) | Address proof |
| Authorized signatory ID (Aadhaar/Passport) | Identity proof |
| Website URL | Online presence — transrentals.com |
| Business phone number | Verification call/SMS |

**Critical:** Business address must be **identical** across GST, utility bill, PAN. Any mismatch → rejection.

**Step 10: Verify real TR phone number**
- Meta dev console → WhatsApp → **Phone Numbers** → "Add Phone Number"
- Enter TransRentals business number → SMS/call OTP
- Set display name: **"TransRentals"** (Meta approves in 1-2 days)

**Step 11: Submit App Review**
- App dashboard → **App Review** → Permissions and Features
- Request: `whatsapp_business_messaging`
- Use case: "Send booking confirmations and inquiry responses to customers who book on transrentals.com"
- Submit → Meta review (2-5 days)

**Step 12: Generate permanent token**
- business.facebook.com → Business Settings → **Users** → **System Users**
- "Add" → name: "TransRentals API User", role: Admin
- Assign assets → select WhatsApp Business Account
- **Generate New Token** → permissions: `whatsapp_business_messaging` + `whatsapp_business_management`
- Expiry: **Never**
- **Copy token immediately — shown only once.** Save securely.

### Phase E: Production switch (1 day)

**Step 13: Toggle app to Live**
- App dashboard top header → "Development" → **"Live"**

**Step 14: Update `.env`:**
```
WHATSAPP_TOKEN=<permanent System User token from Step 12>
WHATSAPP_PHONE_NUMBER_ID=<real TR number ID from Step 10>
WHATSAPP_BUSINESS_ACCOUNT_ID=<same>
```

**Step 15: Restart production server.** Code is already wired — first real booking will trigger a message.

---

## PART 3 — Timeline

| Phase | Duration | Blocker |
|---|---|---|
| A: Business + App setup | 1-2 days | Self |
| B: Template approval | 24-48 hr | Meta |
| C: Dev testing | 1-2 days | Self |
| D: Business Verification | 5-7 days | Meta + documents |
| D: App Review | 2-5 days | Meta (parallel) |
| E: Production switch | 1 hr | Self |
| **TOTAL** | **~2 weeks** | Mostly Meta wait |

---

## PART 4 — Documents checklist

**Business Manager setup:**
- [ ] TransRentals legal name
- [ ] Business address (matches GST exactly)
- [ ] Business phone
- [ ] Business email
- [ ] Website URL

**Business Verification:**
- [ ] GST Certificate (PDF, clear scan)
- [ ] PAN Card (business)
- [ ] Incorporation/Registration certificate
- [ ] Utility bill OR bank statement (last 3 months)
- [ ] Authorized signatory ID (Aadhaar/Passport)
- [ ] Display name decided ("TransRentals")

**Templates:**
- [ ] Both bodies copy-paste ready (in this doc)
- [ ] Sample parameter values

---

## Templates to submit to Meta (reference)

Submit both in the **Utility** category (~₹0.12/msg), language **English (en)**.

### Template 1 — `booking_confirmation`

Category: **Utility** | Language: **English**

**Body:**
```
Hello {{1}}, your TransRentals booking {{2}} is confirmed!
Pickup: {{3}} | Service: {{4}}
Track your ride at https://transrentals.com
```

Parameter map (in order):
1. Customer name
2. Booking number
3. Pickup date (formatted "DD MMM YYYY")
4. Vehicle/service description

### Template 2 — `inquiry_received`

Category: **Utility** | Language: **English**

**Body:**
```
Hi {{1}}, thanks for reaching out to TransRentals!
We've received your inquiry about "{{2}}" and our team will get back to you within a few hours.
```

Parameter map (in order):
1. Customer name
2. Subject

---

## Testing approach (3 levels — don't skip)

**Pre-test verification:**
1. Both templates show `APPROVED` in Meta WhatsApp Manager → Message Templates
2. Personal WhatsApp number added to Meta dev console → API Setup "To" whitelist
3. `npm run dev` running, terminal logs visible

**Level 1 — Contact form (safest, no DB cleanup):**
Submit a contact inquiry with the whitelisted phone → verify (a) `contact_inquiries` row created, (b) terminal shows `WhatsApp message sent` with messageId, (c) message arrives on phone.

**Level 2 — Test booking (only after L1 passes):**
Bike/bus is simplest. Use own name + whitelisted phone. Manually mark booking `CANCELLED` in DB after test.

**Level 3 — Real customer traffic (only after L1 + L2 pass cleanly).**

---

## Common failures → cause mapping

| Log / Meta error | Cause | Fix |
|---|---|---|
| `WhatsApp send skipped: credentials not configured` | Server didn't reload `.env` | Full restart (Ctrl+C, new terminal, `npm run dev`) |
| `WhatsApp send skipped: invalid phone format` | DB phone not in 10-digit Indian format | Submit form with clean 10-digit number |
| Meta error `131030` | Recipient not in dev-mode whitelist | Add number to Meta API Setup "To" list |
| Meta error `131009` / `131056` | Template not approved OR recipient not whitelisted | Check both |
| Meta error `132001` / `132012` | Template name mismatch or not approved | Verify template name in Meta matches `templates.ts` exactly |
| Meta error `190` | Token invalid/expired (24hr temp token expired) | Generate permanent System User token |
| "message sent" log but no delivery | Recipient not in dev-mode whitelist | Whitelist the number |

---

## Adding a new template

1. Submit to Meta and wait for approval
2. Add entry in `templates.ts`:
   ```ts
   export const WA_TEMPLATES = {
     // ...existing...
     myNewTemplate: { name: 'my_new_template', language: 'en' },
   } as const;
   ```
3. Add a high-level wrapper in `client.ts` (mirror `sendBookingConfirmation`)
4. Call the wrapper from the relevant route

---

## Pricing

- Utility conversations: ~₹0.12 each (both templates fit here)
- Marketing conversations: ~₹0.78 each
- No monthly fee for direct Cloud API
- 1000 booking confirms/month: ~₹120 total

---

## Known limitations

- **No opt-in checkbox** on public booking/contact forms. Meta policy expects explicit opt-in for non-transactional messages. Both templates are transactional/utility (booking confirm, inquiry response) — defensible without explicit opt-in, but adding a checkbox is recommended before scaling.
- **No webhook handler** for inbound replies or delivery receipts. Phase 2 (chatbot) will need `src/app/api/whatsapp/webhook/route.ts`.
- **No idempotency tracking** — relies on booking status transition gate in the route to prevent duplicate sends.
- **Wander bookings skipped** — different schema; see TODO in confirm-payment route.
