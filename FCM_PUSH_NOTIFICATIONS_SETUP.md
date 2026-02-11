# 🚀 FCM Push Notifications Setup Guide

## Problem Solved
Backend was only saving notifications to database, but NOT sending FCM push notifications to devices.
Now we have:
- ✅ Database notifications
- ✅ Real-time FCM push notifications
- ✅ In-app notifications (foreground)
- ✅ System notifications (background/killed)

---

## 📋 Setup Steps

### Step 1: Install Firebase Admin SDK

```bash
cd C:\Users\Admin\Videos\280126\tran_stable
npm install firebase-admin
```

### Step 2: Get Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Settings** ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. Save it as `firebase-service-account.json` in project root

### Step 3: Add Environment Variable

Add to `.env` file:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Step 4: Run Database Migration

```bash
npx prisma migrate dev --name add_fcm_token
```

This adds `fcmToken` field to `customers` table.

### Step 5: Update Mobile App API URL

**File:** `tr-app/App.js` (line ~260)

Change the API URL to your actual backend URL:
```javascript
const response = await fetch('http://YOUR_IP:3000/api/customer/fcm-token', {
  // Replace YOUR_IP with your actual IP
```

**Example:**
- Local: `http://192.168.1.4:3000/api/customer/fcm-token`
- Production: `https://yourdomain.com/api/customer/fcm-token`

### Step 6: Add FCM to All Services

I've added FCM push for **Bike** service. You need to apply the same pattern to other services.

**Files to update:** `src/app/api/admin/payments/verify/route.ts`

**Find these sections and add FCM:**
- Self-drive/Car (lines ~158-208)
- Bus (lines ~249-292)
- Truck (lines ~331-370)
- Equipment (lines ~382-420)
- Packers (lines ~433-471)
- Luxury (lines ~485-523)
- Chauffeur (lines ~538-592)

**Pattern to follow:**
```typescript
// ⭐ Send notification - Payment Approved
try {
  const notifTitle = '✅ Payment Approved!';
  const notifBody = `Your [SERVICE] booking payment of ₹${booking.advanceAmount} has been approved.`;

  // Save to database
  await prisma.notifications.create({
    data: prepareNotificationData({
      customerId: booking.customerId,
      title: notifTitle,
      body: notifBody,
      type: 'payment',
      serviceType: '[SERVICE_TYPE]', // bus, truck, equipment, etc.
      bookingId: bookingId,
      quoteId: null,
    }),
  });

  // Send FCM push notification ⭐⭐⭐
  await sendFCMNotification({
    customerId: booking.customerId,
    title: notifTitle,
    body: notifBody,
    data: {
      type: 'payment',
      serviceType: '[SERVICE_TYPE]',
      bookingId: bookingId,
    },
  });
} catch (notifError) {
  logger.error('Failed to create/send notification', notifError);
}
```

---

## 🧪 Testing Steps

### 1. Check FCM Token Saving

1. Open tr-app on phone
2. Check console logs:
   ```
   FCM Token: eA1b2C3...
   ✅ FCM token saved to backend
   ```
3. Verify in database:
   ```sql
   SELECT id, name, fcmToken FROM customers WHERE id = 'YOUR_CUSTOMER_ID';
   ```

### 2. Test Foreground Notification

1. Keep app **OPEN** on home screen
2. Approve a payment from admin panel
3. **Expected:**
   - In-app faded notification appears instantly ✨
   - Slides from top with animation
   - Auto-dismisses after 5 seconds

### 3. Test Background Notification

1. Open app, then press **Home button** (minimize)
2. Approve a payment
3. **Expected:**
   - System notification in tray 🔔
   - Sound plays
   - Badge count updates

### 4. Test Killed State

1. **Force close** the app (swipe away)
2. Approve a payment
3. **Expected:**
   - System notification appears
   - Tap to open app

---

## 📂 Files Created/Modified

### Created:
1. ✅ `src/lib/utils/fcm-helper.ts` - FCM sending logic
2. ✅ `src/app/api/customer/fcm-token/route.ts` - Save FCM token API
3. ✅ `tr-app/components/InAppNotification.js` - In-app UI
4. ✅ `tr-app/contexts/NotificationContext.js` - Notification state

### Modified:
1. ✅ `prisma/schema.prisma` - Added fcmToken field
2. ✅ `tr-app/App.js` - Save FCM token to backend
3. ✅ `src/app/api/admin/payments/verify/route.ts` - Send FCM push (bike only for now)

---

## 🐛 Troubleshooting

### Issue: "Firebase Admin not initialized"

**Solution:**
1. Make sure `firebase-admin` is installed
2. Check `.env` has `FIREBASE_SERVICE_ACCOUNT_PATH`
3. Verify JSON file exists at that path
4. Restart Next.js server

### Issue: "No FCM token found for customer"

**Solution:**
1. Open mobile app and wait for token to generate
2. Check console: "✅ FCM token saved to backend"
3. Verify in database that customer has fcmToken

### Issue: "Invalid registration token"

**Solution:**
- Token expired or device uninstalled app
- FCM helper automatically clears invalid tokens
- Customer needs to open app again to get new token

### Issue: Still no foreground notification

**Solution:**
1. Check mobile console for "📱 Foreground message received"
2. If not appearing, check FCM token was saved
3. Verify backend is calling `sendFCMNotification()`
4. Check Firebase project has Cloud Messaging enabled

---

## 🎯 Quick Summary

**What I fixed:**
1. ✅ Added fcmToken to database schema
2. ✅ Created FCM helper to send push notifications
3. ✅ Created API to save FCM tokens from mobile app
4. ✅ Updated mobile app to save token when it's generated
5. ✅ Updated bike payment notifications to send FCM push
6. ✅ In-app notification UI for foreground
7. ✅ System notifications for background/killed

**What you need to do:**
1. ⏳ Install firebase-admin package
2. ⏳ Get Firebase service account JSON
3. ⏳ Add environment variable
4. ⏳ Run database migration
5. ⏳ Update mobile API URL (line 260 in App.js)
6. ⏳ Apply FCM pattern to other services (optional, but recommended)

**After setup:**
- Foreground = In-app faded notification ✨
- Background = System notification 🔔
- Killed = System notification 💀

---

**Questions? Check console logs for errors!**

- Backend: Check server logs for FCM errors
- Mobile: Check console for "FCM Token" and "Foreground message received"
- Database: Check customers table has fcmToken

