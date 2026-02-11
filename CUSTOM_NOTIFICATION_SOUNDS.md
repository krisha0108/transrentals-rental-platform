# 🔊 Custom Notification Sounds Guide

## ✅ What's Done:
- ✅ Created 4 notification channels (default, quote, payment, booking)
- ✅ Each channel uses different sound
- ✅ Background handler selects correct channel based on type

---

## 📁 Step 1: Add Sound Files

### Create Directory:
```bash
mkdir -p "C:\Users\Admin\Videos\280126\tran_stable\tr-app\android\app\src\main\res\raw"
```

### Add These Files:
```
tr-app/android/app/src/main/res/raw/
├── notification_default.mp3     (General notifications)
├── notification_quote.mp3       (Quote received)
├── notification_payment.mp3     (Payment approved/rejected)
└── notification_booking.mp3     (Booking confirmed)
```

**File Requirements:**
- ✅ Format: `.mp3` or `.wav`
- ✅ Size: Under 500KB (smaller = better)
- ✅ Duration: 1-3 seconds max
- ✅ Lowercase names, no spaces
- ✅ Quality: 128kbps or lower

---

## 🎵 Step 2: Where to Get Sounds

### Option 1: Free Sound Libraries
- **Zapsplat** - https://www.zapsplat.com/sound-effect-categories/
- **Freesound** - https://freesound.org/
- **Notification Sounds** - https://notificationsounds.com/

### Option 2: Create Custom Sounds
Use **Audacity** (free software):
1. Record or import audio
2. Trim to 1-2 seconds
3. Export as MP3 (128kbps)

### Option 3: Use System Sounds (Temporary Testing)
Copy any MP3 file (ringtone, etc.) and rename:
```bash
# Use Windows sounds as temporary test
copy "C:\Windows\Media\Windows Notify.wav" notification_default.mp3
```

---

## 🎨 Recommended Sound Types

**Quote Notification (🏍️):**
- Light, friendly "ding" or "chime"
- Example: Soft bell sound

**Payment Notification (✅):**
- Positive, success sound
- Example: Cash register "cha-ching" or success bell

**Booking Notification (🎉):**
- Celebratory, upbeat
- Example: Short fanfare or celebration sound

**Default Notification (🔔):**
- Standard notification tone
- Example: Simple "ping" or "beep"

---

## 🔧 Step 3: Rebuild Android App

After adding sound files, rebuild:

```bash
cd tr-app
cd android
./gradlew clean
cd ..
npx react-native run-android
```

**Important:** Must rebuild for new resources!

---

## 🧪 Step 4: Test Different Sounds

### Test Quote Sound:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test/notification" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"customer_id":"CUST_1","type":"quote"}' | Select-Object -ExpandProperty Content
```

### Test Payment Sound:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test/notification" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"customer_id":"CUST_1","type":"payment"}' | Select-Object -ExpandProperty Content
```

### Test Booking Sound:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test/notification" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"customer_id":"CUST_1","type":"booking"}' | Select-Object -ExpandProperty Content
```

**Expected:** Each notification plays different sound! 🔊

---

## 🎯 Channel Mapping

| Notification Type | Channel ID | Sound File |
|------------------|------------|------------|
| Quote received | `quote` | `notification_quote.mp3` |
| Payment approved/rejected | `payment` | `notification_payment.mp3` |
| Booking confirmed | `booking` | `notification_booking.mp3` |
| General | `default` | `notification_default.mp3` |

---

## 🐛 Troubleshooting

### Issue: Sound not playing

**Solution 1:** Check file exists
```bash
ls "C:\Users\Admin\Videos\280126\tran_stable\tr-app\android\app\src\main\res\raw"
```

**Solution 2:** Rebuild app
```bash
cd tr-app
npx react-native run-android
```

**Solution 3:** Check phone volume
- Make sure media volume is up
- Check Do Not Disturb is off

**Solution 4:** Clear app data
```bash
adb shell pm clear com.transrentals.customer
```

### Issue: Still using default sound

**Check logs:**
```
🔔 Using channel: quote for type: quote
```

Should show correct channel being used.

### Issue: Sound file not found error

**Fix filename:**
- Must be lowercase
- No spaces
- No special characters
- Format: `notification_type.mp3`

---

## 📱 How It Works

```
Backend sends notification with type
          ↓
App receives FCM message
          ↓
Checks notification type (quote/payment/booking)
          ↓
Selects correct channel
          ↓
Plays corresponding sound file
          ↓
Shows notification with custom sound! 🔊
```

---

## 💡 Pro Tips

1. **Keep sounds short** (1-2 seconds)
2. **Test volume levels** - Not too loud!
3. **Use consistent audio quality** (128kbps MP3)
4. **Test on real device** - Emulator sounds may differ
5. **Consider user preferences** - Allow sound settings in app later

---

## 🎵 Quick Sound File Setup (Copy-Paste)

If you have sound files ready:

```bash
# Create directory
mkdir -p "C:\Users\Admin\Videos\280126\tran_stable\tr-app\android\app\src\main\res\raw"

# Copy your sound files there
# Then rebuild:
cd C:\Users\Admin\Videos\280126\tran_stable\tr-app
npx react-native run-android
```

---

## ✅ Final Checklist

- [ ] Sound files added to `android/app/src/main/res/raw/`
- [ ] Files named correctly (lowercase, .mp3)
- [ ] App rebuilt (`npx react-native run-android`)
- [ ] Tested quote notification sound
- [ ] Tested payment notification sound
- [ ] Tested booking notification sound
- [ ] Volume is audible on phone

---

**Different sounds = Better UX! Users will instantly know what type of notification it is! 🎵**

