# WhatsApp Notifications — What's Needed to Go Live

**Prepared for:** General Manager review
**Purpose:** Activate customer WhatsApp notifications on transrentals.in

---

## 1. What This Functionality Does

Automatically sends a WhatsApp message to the customer at two moments:

1. **Booking Confirmation** — right after a customer completes payment for any booking (bike, car, bus, truck, packers & movers, equipment, chauffeur, luxury rental). Message includes customer name, booking number, pickup date, and service type.
2. **Inquiry Received** — right after a customer submits a contact/inquiry form on the website. Message confirms we've received their query and will respond soon.

**Current status:** The feature is already built and deployed in the codebase — it is currently inactive because it's waiting on business credentials and account setup (see below). No further development work is required to activate it; this is purely a setup/approval task.

**In addition to this**, the website already has WhatsApp "chat with us" buttons throughout customer, vendor, and agent pages that open a WhatsApp chat directly with our support number — this part is already live and working, and is not affected by anything below.

---

## 2. What We Need From the Business Side to Activate It

### A. Decisions to make
| Item | Decision needed |
|---|---|
| Official WhatsApp Business number | Which phone number should be the permanent, customer-facing "TransRentals" WhatsApp number? (Cannot be changed casually later — Meta ties verification and message history to it.) |
| Display name | Confirm "TransRentals" as the name customers will see as the sender. |
| Message wording approval | Sign-off on the exact text of the two message templates (customer-facing, so should read as we want it to). Draft text is ready for review. |
| Budget approval | Ongoing per-message cost (see below) — needs sign-off since it's a recurring operational cost. |

### B. Documents required (for business verification with Meta/WhatsApp)
These are standard documents any business submits to get an official verified WhatsApp Business account:

- [ ] GST Certificate **or** Certificate of Incorporation (legal entity proof)
- [ ] PAN Card — business PAN, not personal
- [ ] Utility bill or bank statement (last 3 months) — address proof
- [ ] ID proof of the authorized signatory (Aadhaar/Passport)
- [ ] Confirmation of business address — **must match exactly** across GST, PAN, and the utility bill/bank statement (mismatches cause rejection)
- [ ] Company website URL (transrentals.in) — already available

### C. Access needed
- Someone with authority to represent TransRentals officially with Meta (as the "authorized signatory") for the verification step.
- OTP/SMS access on the chosen WhatsApp Business number, for verification.

---

## 3. Technical Credentials Required (to be entered into the system)

Once the business is verified, Meta issues 3 pieces of technical data. These are **not created by us manually** — Meta generates and hands them out after the WhatsApp Business Account is set up and verified. Whoever handles the account setup will retrieve these and hand them to the dev team to enter into the system's configuration.

| Credential | What it looks like (format) | Where it comes from |
|---|---|---|
| `WHATSAPP_TOKEN` | A long access key, e.g. `EAAG7abc9XyZ...` (starts with `EAA`, 200+ characters) | Issued by Meta's Business Platform after the account is verified — this is the "password" that lets our system send messages |
| `WHATSAPP_PHONE_NUMBER_ID` | A numeric ID, e.g. `109876543210987` | Assigned by Meta to the specific phone number registered as our WhatsApp Business number |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | A numeric ID, e.g. `123456789012345` | Assigned by Meta to our overall WhatsApp Business Account (for reference/record-keeping) |

**Format they'll typically be received in:** a short text/email from whoever manages the Meta Business Platform account, listing the 3 values as plain key-value pairs, e.g.:

```
WHATSAPP_TOKEN=EAAG7abc9XyZ...................................
WHATSAPP_PHONE_NUMBER_ID=109876543210987
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

This is exactly the format the dev team needs — these 3 lines get placed into the system's environment configuration, and the feature switches on automatically. No code changes required at that point.

**Note:** The access token is sensitive (like a password) — it should be shared only through a secure channel (not over regular WhatsApp/email in plain text if avoidable), and only with the person doing the technical setup.

---

## 4. Cost

- ~₹0.12 per message sent (booking confirmation / inquiry received — both classified as "Utility" messages, the cheapest category).
- No monthly platform fee.
- Estimated: **~₹120/month per 1,000 bookings** — scales directly with booking volume.

---

## 5. Timeline

Approximately **2 weeks** end-to-end, mostly waiting on Meta's review/approval process (business verification + message template approval). Our internal setup effort is roughly 3-4 days spread across that period.

---

## 6. Risk / Notes

- Until verification is complete, there is zero customer-facing change or risk — the feature simply stays inactive as it is today.
- Once live, if a message fails to send for any reason, it never blocks or delays the customer's booking/inquiry — it's a background notification only.
- No changes needed to the existing WhatsApp "chat with us" buttons already on the website — they are unaffected and already functional.

---

**Next step:** Approve the decisions and provide the documents listed above — once received, the technical setup can proceed.
