# Remaining Vendor Quote APIs - FCM Push Notifications

## ✅ Already Fixed:
1. ✅ bike-quotes/route.ts
2. ✅ bus-quotes/route.ts

## ⏳ Still Need FCM Push:
3. ⏳ equipment-quotes/route.ts
4. ⏳ luxury-quotes/route.ts
5. ⏳ packers-quotes/route.ts
6. ⏳ self-drive-quotes/route.ts
7. ⏳ truck-quotes/route.ts

---

## Quick Fix Template (Copy-Paste)

For each file, do these 2 edits:

### Edit 1: Add Imports (at top of file)

Find:
```typescript
import { prepareNotificationData } from '@/lib/utils/notification-helper';
```

Add right after it:
```typescript
import { sendFCMNotification } from '@/lib/utils/fcm-helper';
```

### Edit 2: Add FCM Push (where notification is created)

Find:
```typescript
await prisma.notifications.create({
  data: prepareNotificationData({
    customerId: quoteRequest.customerId,
    title: 'Some Title',
    body: 'Some Body',
    type: 'quote',
    serviceType: 'SERVICE_TYPE',
    quoteId: requestId or quote.id,
    bookingId: null,
  }),
});
```

Replace with:
```typescript
const notifTitle = 'Some Title';
const notifBody = 'Some Body';

// Save to database
await prisma.notifications.create({
  data: prepareNotificationData({
    customerId: quoteRequest.customerId,
    title: notifTitle,
    body: notifBody,
    type: 'quote',
    serviceType: 'SERVICE_TYPE',
    quoteId: requestId or quote.id,
    bookingId: null,
  }),
});

// Send FCM push notification ⭐
await sendFCMNotification({
  customerId: quoteRequest.customerId,
  title: notifTitle,
  body: notifBody,
  data: {
    type: 'quote',
    serviceType: 'SERVICE_TYPE',
    quoteId: requestId or quote.id,
  },
});
```

---

## Service Type Mapping:

- equipment-quotes → `serviceType: 'equipment'`
- luxury-quotes → `serviceType: 'luxury'`
- packers-quotes → `serviceType: 'packers'`
- self-drive-quotes → `serviceType: 'self-drive'`
- truck-quotes → `serviceType: 'truck'`

---

## Testing Right Now (With What's Done):

**Bike quotes already work!** Let's test:

1. Keep customer app **OPEN** on dashboard
2. Send a bike quote from vendor app
3. **Expected:** ✨ Faded notification appears!

**Bus quotes also work now!** Test the same way with bus quotes.

---

## After You Fix The Others:

Do the same test for equipment, luxury, packers, self-drive, and truck quotes!

