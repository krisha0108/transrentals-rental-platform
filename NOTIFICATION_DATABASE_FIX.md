# 🔧 Fix Bad Notification IDs in Database

## Problem Identified

Your database has notifications with **malformed IDs**:

```javascript
❌ quote_id: "cqrnfiw50koqjkng-"  // Trailing dash!
❌ booking_id: "null"               // String "null" instead of null
```

This causes 404 errors when users click notifications.

---

## Solution (2 Steps)

### Step 1: Fix Existing Bad Notifications

**Option A: Use API Endpoint (Recommended)**

1. Start your Next.js server:
   ```bash
   npm run dev
   ```

2. Open browser and go to:
   ```
   http://localhost:3000/api/fix-notifications
   ```

3. You'll see a JSON response like:
   ```json
   {
     "success": true,
     "message": "Found 5 issues, fixed 5 notifications",
     "totalChecked": 50,
     "issues": [
       {
         "notificationId": "cmlg6osyi00hzny01v46ls6ru",
         "issue": "Bad quote ID",
         "original": "cqrnfiw50koqjkng-",
         "reason": "trailing dash"
       }
     ],
     "fixes": [
       {
         "notificationId": "cmlg6osyi00hzny01v46ls6ru",
         "title": "Quote Received",
         "original": {
           "quoteId": "cqrnfiw50koqjkng-",
           "bookingId": "null"
         },
         "fixed": {
           "quoteId": "cqrnfiw50koqjkng",
           "bookingId": null
         }
       }
     ]
   }
   ```

4. ✅ All bad notifications are now fixed!

**Option B: Use Prisma Studio (Manual)**

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Go to `notifications` table

3. Find records where:
   - `quoteId` ends with `-`
   - `bookingId` equals `"null"` (string)

4. Manually edit and fix them

---

### Step 2: Prevent Future Bad Notifications

I've created a helper function that **automatically validates and cleans IDs** before saving.

**Already Applied To:**
- ✅ `/api/vendor/bike-quotes` (example implementation)

**You Need to Apply To:**
1. `/api/vendor/bus-quotes/route.ts`
2. `/api/vendor/truck-quotes/route.ts`
3. `/api/vendor/equipment-quotes/route.ts`
4. `/api/vendor/packers-quotes/route.ts`
5. `/api/vendor/luxury-quotes/route.ts`
6. `/api/vendor/self-drive-quotes/route.ts`
7. Any other files that create notifications

---

## How to Apply the Helper Function

### Example: Current Code (Bad)

```typescript
await prisma.notifications.create({
  data: {
    customerId: customer.id,
    title: 'Quote Received',
    body: 'You have a new quote',
    type: 'quote',
    quoteId: quote.id,  // Might be bad!
    isRead: false,
  },
});
```

### Example: Fixed Code (Good)

```typescript
import { prepareNotificationData } from '@/lib/utils/notification-helper';

await prisma.notifications.create({
  data: prepareNotificationData({
    customerId: customer.id,
    title: 'Quote Received',
    body: 'You have a new quote',
    type: 'quote',
    quoteId: quote.id,  // ✅ Automatically validated!
    bookingId: null,
  }),
});
```

**That's it!** The helper will:
- ✅ Remove trailing dashes
- ✅ Convert "null" strings to actual null
- ✅ Validate ID length (minimum 10 chars)
- ✅ Log warnings if IDs are cleaned

---

## Quick Search & Replace Guide

### 1. Find All Notification Creation Code

```bash
cd C:\Users\Admin\Videos\280126\tran_stable
grep -r "prisma.notifications.create" src/app/api/vendor/ --include="*.ts"
```

### 2. For Each File:

**Add Import (Top of File):**
```typescript
import { prepareNotificationData } from '@/lib/utils/notification-helper';
```

**Wrap Notification Data:**
```typescript
// Before
data: { customerId, title, body, ... }

// After
data: prepareNotificationData({ customerId, title, body, ... })
```

---

## Files Created

1. ✅ **`src/lib/utils/notification-helper.ts`**
   - Utility functions to clean and validate notification IDs
   - `cleanNotificationId()` - Validates single ID
   - `prepareNotificationData()` - Prepares full notification data

2. ✅ **`src/app/api/fix-notifications/route.ts`**
   - API endpoint to find and fix bad notifications
   - Automatically cleans trailing dashes
   - Converts "null" strings to actual null

3. ✅ **Updated: `src/app/api/vendor/bike-quotes/route.ts`**
   - Example implementation using the helper

---

## Testing the Fix

### Test 1: Check Current Notifications

**In React Native App:**
1. Open NotificationScreen
2. Tap any notification
3. Check console logs:
   ```
   ✅ [NotificationScreen] Navigating to ViewQuote: cqrnfiw50koqjkng
   ```

**If Still Seeing Bad IDs:**
- Run the fix endpoint: `http://localhost:3000/api/fix-notifications`
- Check database to ensure IDs are cleaned

### Test 2: Create New Quote

1. Have a vendor submit a new quote
2. Check notification in customer app
3. Tap notification → should navigate correctly
4. No 404 errors!

---

## Console Logs to Watch For

### Good (After Fix):
```
✅ [cleanNotificationId] ID validated: "cqrnfiw50koqjkng01234567"
✅ Notification created for bike quote { quoteId: '...', customerId: '...' }
```

### Warning (ID Cleaned):
```
⚠️  [cleanNotificationId] Invalid ID detected: "cqrnfiw50koqjkng-"
⚠️  [prepareNotificationData] Quote ID cleaned: "cqrnfiw50koqjkng-" -> "cqrnfiw50koqjkng"
```

### Error (ID Rejected):
```
⚠️  [cleanNotificationId] Invalid ID detected: "null"
⚠️  [prepareNotificationData] Booking ID cleaned: "null" -> null
```

---

## Root Cause Analysis

**Why are IDs getting trailing dashes?**

Possible causes:
1. **String concatenation bug:** `quote.id + '-'`
2. **Template literal issue:** `` `${quote.id}-` ``
3. **Database migration issue:** Old data with bad IDs
4. **External API returning bad format**

**Recommendation:**
- Search your codebase for any ID generation or manipulation
- Check if any code is appending dashes to IDs
- The helper function prevents this from being saved regardless

---

## Quick Checklist

- [ ] Run fix endpoint: `http://localhost:3000/api/fix-notifications`
- [ ] Verify all bad notifications are fixed
- [ ] Apply helper to all vendor quote routes
- [ ] Apply helper to any booking notification creation
- [ ] Test creating new quotes
- [ ] Test clicking notifications (no 404s)
- [ ] Delete fix endpoint (optional, after testing)

---

## Need Help?

If issues persist:
1. Check console logs for warnings
2. Verify database schema (quoteId and bookingId should be String, nullable)
3. Run Prisma Studio to manually inspect notifications table
4. Check if quote IDs in quote tables also have trailing dashes

---

**Last Updated:** 2026-02-10
**Status:** ✅ Helper function created, example applied, fix endpoint ready
