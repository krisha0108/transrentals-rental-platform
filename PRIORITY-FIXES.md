# TransRentals — Priority Fix Doc
**Date:** 2026-03-20

---

## 🔴 CRITICAL — Security (Fix Today)

| # | Issue | File | Fix | Time |
|---|-------|------|-----|------|
| 1 | Admin payment verify — NO AUTH | `src/app/api/admin/payments/verify/route.ts` | Add `getServerSession()` | 30 min |
| 2 | OTP = `Math.random()` — brute-forceable | `bike-bookings/route.ts`, `luxury-bookings/[id]/route.ts`, `accept-quote/route.ts` | Replace with `crypto.randomInt()` + attempt limit | 2 hrs |
| 3 | Quote accept — no ownership check | `src/app/api/customer/accept-quote/route.ts` | Validate customerId from session | 1 hr |
| 4 | Location filter OFF in prod | `src/app/api/vendor/truck-quote-requests/route.ts:58` | Uncomment 1 line | 30 min |
| 5 | Console.log leaking user phone/email | `bike-bookings/route.ts`, multiple | Remove all console.log | 2 hrs |

---

## 🟠 HIGH — Revenue/Operations (Fix This Week)

| # | Issue | File | Fix | Time |
|---|-------|------|-----|------|
| 6 | Notification fail silently after payment | `src/app/api/payments/verify/route.ts` | Add retry logic on FCM fail | 1 day |
| 7 | 6 services payment notifications missing | `src/app/api/admin/payments/verify/route.ts` | Wire existing TODO templates | 1 day |
| 8 | Browse-first: admin manual broadcast | `src/app/api/admin/payments/verify/route.ts` | Auto-broadcast on payment verify | 3 hrs |

---

## 🟡 MEDIUM — Vendor Trust (Fix This Month)

| # | Issue | File | Fix | Time |
|---|-------|------|-----|------|
| 9 | Staff payments no persistence | `src/app/api/vendor/staff/payments/route.ts:170` | Create staff_payments table | 2 days |
| 10 | Vendor payout hardcoded 0 | `src/app/vendor/(dashboard)/car-rental/earnings/page.tsx` | Build payout calculation | 3 days |
| 11 | Security deposit refund missing | `luxury-bookings/[id]/route.ts` | Add refund on completion | 2 days |

---

## 🟢 LOW — Tech Debt (Next 60 Days)

| # | Issue | Fix | Time |
|---|-------|-----|------|
| 12 | Rate limiting in-memory only | Enable existing Redis config | 4 hrs |
| 13 | Double-booking race condition | Pessimistic lock on availability check | 1 day |
| 14 | `@ts-nocheck` on 237 files | Remove gradually, payment routes first | Ongoing |
| 15 | Driver has no mobile app | Add driver section in tr-vendor-app | 1 week |

---

## 30-Day Sprint Plan

### Week 1 — Security (~6 hrs total)
- [ ] Auth on admin payment verify
- [ ] OTP → crypto.randomInt()
- [ ] Quote ownership check
- [ ] Location filter re-enable
- [ ] Remove console.log user data

### Week 2 — Notifications (~2 days)
- [ ] 6 services payment notifications
- [ ] Notification retry logic
- [ ] Auto-broadcast browse-first flow

### Week 3 — Vendor Trust (~4 days)
- [ ] Staff payments persistence
- [ ] Security deposit refund flow

### Week 4 — Payouts (~3 days)
- [ ] Vendor payout calculation
- [ ] Payout dashboard UI

---

## What Was Verified as FALSE (Remove from Concern List)
- ~~Razorpay needs webhook~~ → Already auto-verified via signature
- ~~No DB transaction = double booking~~ → Razorpay prevents duplicate payment; real risk is silent notification failure only
- ~~quotation-detail endpoint missing~~ → Already fixed, file exists at `src/app/api/quotation-detail/[id]/route.ts`
- ~~Luxury trip start/end missing~~ → Fully implemented in web driver dashboard + API

---

## System Flow (With Actual Breaks)

```
Customer pays (Razorpay)
  → Auto verify signature ✅
  → status: PAYMENT_VERIFIED ✅
  → Vendor notified IF pre-assigned ✅
  → Vendor NOT notified if browse-first ❌ (admin manual step)
  → 6 services: no notification at all ❌

Admin verifies (manual)
  → status: BROADCASTED
  → Vendors notified

Vendor accepts
  → Booking ACCEPTED
  → Trip executes

Completion
  → Security deposit: NOT refunded ❌
  → Vendor payout: NOT calculated ❌
  → Staff payment: NOT recorded ❌
```

---

## Stats
- 543 API routes | 90+ DB models | 8 services | 3 apps (web, customer app, vendor app)
- Driver: web-only (no mobile app)
- 237 files with @ts-nocheck
- Notifications missing: 6/8 services
