# 🔔 Notification Module - Bug Fixes

## Issues Fixed

### ✅ Issue #1: Invalid Quote ID Navigation (404 Error)
**Problem:** When clicking notifications with quote IDs, app was navigating but getting 404 errors due to malformed IDs (e.g., `cqrnfiw50koqjkng-`)

**Root Cause:** Quote IDs in notifications were incomplete or had trailing dashes

**Fix Applied:**
- Added ID validation function in `NotificationScreen.js`
- Validates ID format: must be at least 10 characters and no trailing dashes
- Better error logging to identify malformed IDs
- Shows user-friendly error message when ID is invalid

**File Changed:** `tr-app/screens/customer/NotificationScreen.js`

---

### ✅ Issue #2: Badge Count Not Updating After Reading Notifications
**Problem:** After reading notifications, the badge count in dashboard header wasn't updating

**Root Cause:** CustomerDashboard only fetched notification count on initial load, not when returning from NotificationScreen

**Fix Applied:**
- Added `useFocusEffect` hook to CustomerDashboard
- Automatically refreshes notification count when screen comes into focus
- Badge now updates immediately after reading notifications

**Files Changed:**
- `tr-app/screens/customer/CustomerDashboard.js`
  - Added `useFocusEffect` import
  - Added focus effect hook to refresh count

---

### ✅ Issue #3: Push Notifications Not Appearing When App in Background
**Problem:** Users weren't receiving push notifications when app was in background or killed

**Root Cause:** Missing handlers for notification taps and background state

**Fix Applied:**
- Added `pressAction` to notifications (makes them tappable)
- Added `onNotificationOpenedApp` handler (background state)
- Added `getInitialNotification` handler (killed state)
- Added proper logging for debugging
- Ensured notifications include data payload for navigation

**File Changed:** `tr-app/App.js`

---

## Testing Instructions

### Test 1: Quote ID Validation
1. Create a notification with invalid quote ID (use backend):
   ```javascript
   POST /api/customer/notifications
   {
     "customer_id": "YOUR_CUSTOMER_ID",
     "title": "Test Invalid Quote",
     "body": "This has invalid quote ID",
     "quote_id": "invalid-"
   }
   ```
2. Open NotificationScreen
3. Tap the notification
4. **Expected:** Should show error alert: "This notification does not have valid booking or quotation details."
5. Check console logs for: `[NotificationScreen] No valid booking/quote ID found`

### Test 2: Badge Count Update
1. Open CustomerDashboard - note the badge count (e.g., 3 unread)
2. Navigate to NotificationScreen
3. Tap any notification (marks as read)
4. Go back to Dashboard (press back button)
5. **Expected:** Badge count should decrease (e.g., from 3 to 2)
6. Check console logs for: `[fetchUnreadNotificationCount] Success: X unread notifications`

### Test 3: Push Notifications
#### 3a. Test Foreground Notification
1. Open the app and stay on any screen
2. Send test notification from Firebase Console or backend
3. **Expected:** Notification appears as popup at top of screen
4. Tap notification
5. **Expected:** App stays in foreground, notification marked as read

#### 3b. Test Background Notification
1. Open the app, then minimize it (press home button)
2. Send test notification
3. **Expected:** Notification appears in system notification tray
4. Tap notification from tray
5. **Expected:** App opens and shows notification screen

#### 3c. Test Killed State Notification
1. Force close the app (swipe away from recents)
2. Send test notification
3. **Expected:** Notification appears in system notification tray
4. Tap notification
5. **Expected:** App launches and shows notification screen

---

## Backend Notification Format

To ensure notifications work correctly, send them in this format:

```javascript
// For Booking Notifications
{
  "customer_id": "cm...",
  "title": "Booking Confirmed",
  "body": "Your bike booking #BK123 has been confirmed",
  "booking_id": "cmlg6osyi00hzny01v46ls6ru", // Must be valid 25+ char ID
  "quote_id": null,
  "type": "booking",
  "image": "https://example.com/image.jpg" // Optional
}

// For Quote Notifications
{
  "customer_id": "cm...",
  "title": "Quote Received",
  "body": "You have received 3 quotes for your request",
  "booking_id": null,
  "quote_id": "cqrnfiw50koqjkng01234567", // Must be valid 25+ char ID, NO trailing dash
  "type": "quote",
  "image": null
}
```

**CRITICAL:** Make sure IDs are:
- ✅ Complete (no truncation)
- ✅ No trailing dashes
- ✅ At least 10 characters long
- ✅ Not "null" strings or 0

---

## Console Log References

### Successful Flow:
```
[NotificationScreen] Marking notification cmlg6osyi00hzny01v46ls6ru as read
[NotificationScreen] Navigating to BookingDetail: cmlg6osyi00hzny01v46ls6ru
[fetchUnreadNotificationCount] Starting...
[fetchUnreadNotificationCount] Success: 2 unread notifications
```

### Invalid ID Flow:
```
[NotificationScreen] Marking notification cmlg6osyi00hzny01v46ls6ru as read
[NotificationScreen] No valid booking/quote ID found in notification
[NotificationScreen] booking_id: "null", quote_id: "invalid-"
```

### Push Notification Flow:
```
FCM Token: xxxxxxxxxxxxx
Background message received: { messageId: '...', notification: {...} }
Notification opened app from background: { messageId: '...', data: {...} }
```

---

## API Endpoints Used

1. **Get Notifications**
   - `GET /api/customer/notifications?customer_id={id}`
   - Returns all notifications with relative time

2. **Get Unread Count**
   - `GET /api/customer/notifications/unread-count?customer_id={id}`
   - Returns `{ success: true, total_unread: 3 }`

3. **Mark as Read**
   - `POST /api/customer/notifications/{notificationId}/read`
   - Marks single notification as read

4. **Get Quote Detail**
   - `GET /api/quotation-detail/{quoteId}`
   - Returns quote details (all types: bike, bus, truck, etc.)

5. **Get Booking Detail**
   - `GET /api/customer-booking-detail/{bookingId}`
   - Returns booking details

---

## Next Steps

1. ✅ Test all three scenarios above
2. ✅ Check backend to ensure notification IDs are valid
3. ✅ Verify FCM token is being saved to backend
4. ✅ Test on both Android physical device and emulator
5. 📝 Monitor console logs for any errors

---

## Troubleshooting

### Issue: Badge count still not updating
**Solution:** Check that `notificationService.getUnreadCount()` is returning correct data. Verify backend endpoint.

### Issue: Notifications not appearing in background
**Solution:**
1. Check FCM token in console
2. Verify google-services.json is in android/app/
3. Rebuild app: `cd android && ./gradlew clean && cd .. && npm run android`
4. Check Android notification permissions

### Issue: 404 on quote detail
**Solution:**
1. Check quote ID in database - ensure it's complete
2. Verify `/api/quotation-detail/{id}` endpoint exists
3. Check console logs for actual ID being used

---

## Files Modified

1. ✅ `tr-app/screens/customer/CustomerDashboard.js`
   - Added `useFocusEffect` import
   - Added focus effect hook

2. ✅ `tr-app/screens/customer/NotificationScreen.js`
   - Added ID validation function
   - Better error handling
   - Improved logging

3. ✅ `tr-app/App.js`
   - Added `pressAction` to notifications
   - Added background/killed state handlers
   - Improved logging

---

**Last Updated:** 2026-02-10
**Status:** ✅ All fixes applied, ready for testing
