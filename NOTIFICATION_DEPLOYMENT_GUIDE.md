# 🔔 Notification System - Production Deployment Guide

## 🎯 Quick Summary

Notification system me 3 main components hain:
1. **Backend** - FCM push notification sending
2. **Mobile App** - FCM receiving + in-app notifications
3. **Firebase** - Cloud messaging service

---

## ✅ Backend Deployment Steps

### Step 1: Firebase Admin SDK Setup

**Production Firebase Service Account:**
```bash
# 1. Go to Firebase Console → Your Production Project
# 2. Settings ⚙️ → Service Accounts
# 3. Click "Generate New Private Key"
# 4. Download JSON file
# 5. Upload to production server
```

**Server location:**
```
/home/user/transrentals/firebase-service-account.json
```

**Add to .env on server:**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Step 2: Install Dependencies

```bash
cd /path/to/backend
npm install firebase-admin
```

### Step 3: Database Migration

```bash
# Run migration to add fcmToken field
npx prisma migrate deploy

# Verify
npx prisma migrate status
```

### Step 4: Build & Deploy

```bash
# Build Next.js
npm run build

# Start with PM2
pm2 start npm --name "transrentals" -- start
pm2 save
```

### Step 5: Verify Backend

```bash
# Check logs for Firebase initialization
pm2 logs transrentals

# Should see:
# ✅ Firebase Admin initialized successfully
```

**Test endpoint:**
```bash
curl -X POST https://yourdomain.com/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST_1","type":"quote"}'
```

---

## 📱 Mobile App Deployment Steps

### Step 1: Update Firebase Config

**Production google-services.json:**
```bash
# 1. Go to Firebase Console → Production Project
# 2. Settings → General → Your Apps
# 3. Download google-services.json
# 4. Replace:
tr-app/android/app/google-services.json
```

### Step 2: Update API URLs

**File:** `tr-app/screens/api.js`

```javascript
const dev = false; // ⚠️ IMPORTANT: Set to false for production

const API_BASE_URL = dev
  ? `http://${LOCAL_HOST}:${LOCAL_PORT}/api`
  : 'https://api.transrentals.com/api'; // ← Your production domain
```

### Step 3: Add Notification Sound

```bash
# 1. Create directory
mkdir -p tr-app/android/app/src/main/res/raw

# 2. Add sound file
# Copy: notification_sound.mp3
```

### Step 4: Update Version

**File:** `tr-app/android/app/build.gradle`

```gradle
android {
    defaultConfig {
        versionCode 2         // Increment
        versionName "1.0.1"   // Update
    }
}
```

### Step 5: Build Release

**First time - Generate Keystore:**
```bash
cd tr-app/android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore transrentals-release.keystore \
  -alias transrentals \
  -keyalg RSA -keysize 2048 -validity 10000
```

**Configure signing:**
`android/gradle.properties`
```properties
MYAPP_RELEASE_STORE_FILE=transrentals-release.keystore
MYAPP_RELEASE_KEY_ALIAS=transrentals
MYAPP_RELEASE_STORE_PASSWORD=your-password
MYAPP_RELEASE_KEY_PASSWORD=your-password
```

**Build:**
```bash
cd tr-app/android
./gradlew clean
./gradlew bundleRelease

# Output:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🧪 Testing in Production

### 1. Send Test Notification

```bash
curl -X POST https://api.transrentals.com/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST_1","type":"quote"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test notification sent!",
  "notification": {
    "fcm_sent": true,
    "customer_has_fcm_token": true
  }
}
```

### 2. Check Customer Receives It

**On phone:**
- If app open → In-app faded notification
- If app background → Android notification tray
- If app closed → Android notification tray

### 3. Verify Database

```sql
-- Check FCM tokens saved
SELECT COUNT(*) FROM customers WHERE fcmToken IS NOT NULL;

-- Check recent notifications
SELECT * FROM notifications
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 🔍 Monitoring & Debugging

### Backend Logs

```bash
# PM2 logs
pm2 logs transrentals

# Look for:
[FCM] Sending notification to customer: CUST_1
✅ Firebase Admin initialized successfully
```

### Firebase Console

Check **Cloud Messaging** section:
- Message delivery stats
- Error rates
- Device registration

### Database Queries

```sql
-- FCM token coverage
SELECT
  COUNT(*) as total_customers,
  SUM(CASE WHEN fcmToken IS NOT NULL THEN 1 ELSE 0 END) as with_token,
  ROUND(SUM(CASE WHEN fcmToken IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as percentage
FROM customers;

-- Recent notification activity
SELECT
  type,
  serviceType,
  COUNT(*) as count,
  DATE(createdAt) as date
FROM notifications
WHERE createdAt > NOW() - INTERVAL 7 DAY
GROUP BY type, serviceType, DATE(createdAt);
```

---

## 🚨 Common Production Issues

### Issue 1: FCM Not Initialized

**Error:** `Firebase Admin not initialized`

**Fix:**
```bash
# Check file exists
ls -la firebase-service-account.json

# Check .env
cat .env | grep FIREBASE

# Restart server
pm2 restart transrentals
```

### Issue 2: No FCM Token Saved

**Error:** `No FCM token found for customer`

**Fix:**
```bash
# Check mobile app logs for:
# ✅ FCM token saved to backend

# Verify API endpoint working:
curl https://api.transrentals.com/api/customer/fcm-token
```

### Issue 3: Notification Not Received

**Checklist:**
- [ ] Customer has fcmToken in database?
- [ ] Backend sending FCM push?
- [ ] Phone has internet connection?
- [ ] App has notification permissions?
- [ ] Using correct Firebase project (prod)?

### Issue 4: Sound Not Playing

**Fix:**
- Rebuild app after adding sound file
- Check file exists in APK
- Verify filename: `notification_sound.mp3`

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] Firebase service account JSON on server
- [ ] .env configured with FIREBASE_SERVICE_ACCOUNT_PATH
- [ ] firebase-admin package installed
- [ ] Database migration applied (fcmToken field)
- [ ] Backend built and deployed
- [ ] Logs show Firebase initialized ✅

### Mobile App
- [ ] Production google-services.json added
- [ ] API URLs changed to production domain
- [ ] dev flag set to false
- [ ] Notification sound added
- [ ] Version number incremented
- [ ] Release build created
- [ ] App signed with release keystore

### Firebase
- [ ] Production Firebase project created
- [ ] Cloud Messaging enabled
- [ ] Service account generated
- [ ] google-services.json downloaded
- [ ] Budget/limits checked

---

## 🎯 Post-Deployment Verification

### Quick Tests

**1. Test notification sending:**
```bash
curl -X POST https://api.transrentals.com/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST_1","type":"quote"}'
```

**2. Check customer receives:**
- [ ] Foreground notification works
- [ ] Background notification works
- [ ] Killed state notification works
- [ ] Custom sound plays
- [ ] Navigation works

**3. Real scenario test:**
- [ ] Vendor sends quote → notification received
- [ ] Admin approves payment → notification received
- [ ] All notification types working

---

## 🔄 Rollback Plan

### If Notifications Fail

**Backend:**
```bash
# Revert to previous version
pm2 stop transrentals
git checkout previous-commit
npm install
npm run build
pm2 start transrentals
```

**Mobile App:**
- Use previous APK version
- Notifications will fall back to database-only mode
- Users can still see in NotificationScreen

---

## 📊 Success Metrics

Monitor these after deployment:

```sql
-- FCM token adoption rate
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN fcmToken IS NOT NULL THEN 1 ELSE 0 END) as with_fcm
FROM customers;

-- Notification delivery
SELECT
  COUNT(*) as sent_today
FROM notifications
WHERE DATE(createdAt) = CURDATE();

-- Notification types breakdown
SELECT type, COUNT(*) as count
FROM notifications
WHERE createdAt > NOW() - INTERVAL 24 HOUR
GROUP BY type;
```

---

## 🚀 Quick Deployment Commands

```bash
# === BACKEND ===
cd /path/to/backend
npm install firebase-admin
npx prisma migrate deploy
npm run build
pm2 restart transrentals
pm2 logs transrentals

# === MOBILE APP ===
cd /path/to/tr-app
# (Update configs first)
cd android
./gradlew clean
./gradlew bundleRelease

# === VERIFY ===
curl https://api.transrentals.com/api/health
curl -X POST https://api.transrentals.com/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST_1","type":"quote"}'
```

---

## 📞 Support & Troubleshooting

**If issues persist:**

1. **Check backend logs:** `pm2 logs transrentals`
2. **Check database:** Verify fcmToken field exists
3. **Check Firebase Console:** Look for errors
4. **Test with curl:** Verify API endpoints work
5. **Check mobile logs:** adb logcat

---

**Deployment ke baad yeh sab test karna important hai! 🚀**

**Last Updated:** Feb 10, 2026
