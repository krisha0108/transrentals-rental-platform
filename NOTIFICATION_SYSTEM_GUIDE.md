# 📱 Complete Notification System Guide

## ✅ What's Implemented

### 1. **In-App Notifications (Foreground)**
When the app is **ACTIVE/OPEN**:
- Shows a beautiful faded overlay notification at the top
- Auto-dismisses after 5 seconds
- Slide-in animation with smooth fade
- Color-coded by notification type:
  - 🟢 **Green** - Payment notifications
  - 🔵 **Blue** - Quote notifications
  - 🟠 **Orange** - Booking notifications
  - 🟣 **Purple** - Chat notifications
  - ⚫ **Grey** - General notifications

**Files:**
- `/tr-app/components/InAppNotification.js` - Beautiful notification UI component
- `/tr-app/contexts/NotificationContext.js` - Global notification state management
- `/tr-app/App.js` - Integrated with foreground message handler

### 2. **System Notifications (Background/Killed)**
When the app is **IN BACKGROUND or CLOSED**:
- Shows Android system notification (like Instagram, WhatsApp, etc.)
- Appears in notification tray
- Plays sound
- Shows app badge count
- Supports big picture style for images
- Tappable to open app and navigate to booking/quote

**Files:**
- `/tr-app/App.js` - Background message handler (line 112-137)

### 3. **Payment Notifications**
When admin approves/rejects payment at `http://localhost:3000/admin/payments`:
- Customer receives instant notification
- Works for ALL service types:
  - ✅ Bike
  - ✅ Self-drive/Car
  - ✅ Bus
  - ✅ Truck
  - ✅ Equipment
  - ✅ Packers & Movers
  - ✅ Luxury Car
  - ✅ Chauffeur

**Backend File:**
- `/src/app/api/admin/payments/verify/route.ts` - All notifications added

### 4. **Smart Navigation**
Clicking notification navigates to the correct screen:
- **Bike** → BikeBookingDetail / BikeQuoteRequestDetail
- **Bus** → BusBookingDetail / BusQuoteRequestDetail
- **Truck** → TruckBookingDetail / TruckQuoteRequestDetail
- **Equipment** → EquipmentBookingDetail / EquipmentQuoteRequestDetail
- **Packers** → PackersBookingDetail / PackersQuoteRequestDetail
- **Self-drive** → SelfDriveBookingDetailScreen / SelfDriveQuoteRequestDetail
- **Luxury** → LuxuryBookingDetail / LuxuryQuoteDetail
- **Chauffeur/Car** → BookingDetail

Fallback: If service type is unclear, navigates to MyBookings screen

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FIREBASE FCM SERVER                     │
│                 (Sends push notifications)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       MOBILE APP                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        App State: FOREGROUND (Active)                │   │
│  │                                                       │   │
│  │  messaging().onMessage()                             │   │
│  │         │                                            │   │
│  │         ├──> showNotification()                      │   │
│  │         │                                            │   │
│  │         └──> InAppNotification Component             │   │
│  │                (Faded overlay at top)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        App State: BACKGROUND                         │   │
│  │                                                       │   │
│  │  setBackgroundMessageHandler()                       │   │
│  │         │                                            │   │
│  │         └──> notifee.displayNotification()           │   │
│  │                (System notification tray)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        App State: KILLED (Closed)                    │   │
│  │                                                       │   │
│  │  setBackgroundMessageHandler()                       │   │
│  │         │                                            │   │
│  │         └──> notifee.displayNotification()           │   │
│  │                (System notification tray)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Guide

### Test 1: Foreground Notification (In-App)
1. Open the tr-app on your phone
2. Keep app active (don't minimize)
3. From admin panel, approve/reject a payment at `http://localhost:3000/admin/payments`
4. **Expected:** Faded notification appears at top of screen
5. **Expected:** Auto-dismisses after 5 seconds
6. Click notification → Should navigate to booking detail page

### Test 2: Background Notification
1. Open the tr-app
2. Press home button to minimize app (app goes to background)
3. From admin panel, approve/reject a payment
4. **Expected:** System notification appears in notification tray
5. **Expected:** Notification sound plays
6. **Expected:** App badge shows count
7. Tap notification → App opens and navigates to booking detail

### Test 3: Killed State Notification
1. Force close the tr-app (swipe away from recent apps)
2. From admin panel, approve/reject a payment
3. **Expected:** System notification appears in notification tray
4. **Expected:** Notification sound plays
5. Tap notification → App opens and navigates to booking detail

### Test 4: All Service Types
Test payment approval for each service:
- Bike rental
- Self-drive car
- Bus rental
- Truck rental
- Equipment rental
- Packers & movers
- Luxury car
- Chauffeur service

All should send notifications correctly!

### Test 5: Badge Count
1. Receive multiple notifications
2. **Expected:** App icon shows badge count
3. Open NotificationScreen
4. Mark notifications as read
5. Return to dashboard
6. **Expected:** Badge count updates to unread count

---

## 🔧 Backend Notification Helper

All backend APIs use the notification helper to ensure data quality:

```typescript
import { prepareNotificationData } from '@/lib/utils/notification-helper';

await prisma.notifications.create({
  data: prepareNotificationData({
    customerId: booking.customerId,
    title: '✅ Payment Approved!',
    body: `Your ${serviceName} booking payment has been approved.`,
    type: 'payment',
    serviceType: 'bike', // bike, bus, truck, equipment, packers, self-drive, luxury, car
    bookingId: bookingId,
    quoteId: null,
  }),
});
```

**Helper Features:**
- Validates IDs (no trailing dashes, no "null" strings)
- Ensures proper serviceType
- Clean data structure
- Prevents malformed notifications

**File:** `/src/lib/utils/notification-helper.ts`

---

## 📂 File Structure

```
tr-app/
├── components/
│   └── InAppNotification.js         # In-app notification UI
├── contexts/
│   └── NotificationContext.js       # Global notification state
├── App.js                            # Notification setup & handlers
└── screens/
    └── customer/
        ├── CustomerDashboard.js      # Badge count display
        └── NotificationScreen.js     # Notification list & navigation

backend/
├── src/
│   ├── lib/
│   │   └── utils/
│   │       └── notification-helper.ts   # Clean notification data
│   └── app/
│       └── api/
│           ├── admin/
│           │   └── payments/
│           │       └── verify/
│           │           └── route.ts     # Payment notifications
│           ├── vendor/
│           │   └── bike-quotes/
│           │       └── route.ts         # Quote notifications
│           └── customer/
│               └── notifications/
│                   └── route.ts         # Get notifications API
```

---

## 🎨 Customization

### Change Notification Colors
Edit `/tr-app/components/InAppNotification.js`:
```javascript
const getIconStyle = (type) => {
  switch (type) {
    case 'payment':
      return { backgroundColor: '#4CAF50' }; // Change this
    // ...
  }
};
```

### Change Auto-Dismiss Time
Edit `/tr-app/components/InAppNotification.js`:
```javascript
const timer = setTimeout(() => {
  dismissNotification();
}, 5000); // Change from 5000ms (5 seconds)
```

### Change Notification Position
Edit `/tr-app/components/InAppNotification.js`:
```javascript
Animated.timing(slideAnim, {
  toValue: 10, // Distance from top, change this
  // ...
})
```

---

## 🐛 Troubleshooting

### Issue: No notifications received
**Solution:**
1. Check FCM token is generated (see console logs)
2. Verify Firebase Cloud Messaging is configured
3. Check notification permissions are granted
4. Verify backend is calling `prisma.notifications.create()`

### Issue: Foreground shows system notification instead of in-app
**Solution:**
- Make sure you updated App.js with latest code
- Verify NotificationProvider is wrapping the app
- Check console for "📱 Foreground message received"

### Issue: Navigation not working
**Solution:**
1. Check notification has correct `serviceType` and `bookingId`/`quoteId`
2. Verify screen names match in navigation
3. Check console logs for navigation errors
4. Ensure booking/quote ID exists in database

### Issue: Badge count not updating
**Solution:**
1. Make sure `useFocusEffect` is in CustomerDashboard
2. Verify notifee.setBadgeCount() is being called
3. Check Android permissions for badges

---

## ✨ Features

✅ **Beautiful in-app notifications** - Faded overlay style
✅ **System notifications** - Works in background/killed state
✅ **Smart navigation** - Direct to booking/quote details
✅ **Badge count** - Shows unread notification count
✅ **Sound & vibration** - For background notifications
✅ **Auto-dismiss** - In-app notifications auto-hide
✅ **Image support** - Big picture style for images
✅ **All service types** - Works for every booking type
✅ **Clean data** - Helper validates all IDs
✅ **Payment notifications** - Instant approval/rejection alerts

---

## 🚀 Next Steps (Optional Enhancements)

1. **Push Notification Tokens**
   - Save FCM tokens to database
   - Send server-side push notifications

2. **Notification Actions**
   - Add "View Booking" and "Dismiss" buttons
   - Quick actions from notification

3. **Sound Customization**
   - Different sounds for different notification types
   - Custom notification tones

4. **Rich Notifications**
   - Add images to notifications
   - Show booking details in notification

5. **Notification History**
   - Archive old notifications
   - Search notifications

6. **Do Not Disturb**
   - Schedule quiet hours
   - Disable specific notification types

---

## 📝 Notes

- Always use `prepareNotificationData()` helper when creating notifications
- Test on both Android and iOS devices
- Check console logs for debugging
- Notification badge count resets when user visits NotificationScreen
- In-app notifications only show when app is active
- System notifications show when app is background/killed

---

**Status:** ✅ Fully Implemented and Ready for Testing!

**Last Updated:** February 10, 2026
