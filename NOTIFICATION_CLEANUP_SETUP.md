# 🧹 Notification Cleanup System

Automatic cleanup for OTP notifications to prevent database bloat.

---

## 📋 What Gets Cleaned Up

### OTP Notifications (Auto-delete after 1 day):
- Trip Start OTP (🔑 Trip Start OTP)
- Trip End OTP (🔑 Trip End OTP)
- All notifications with "OTP" in the title

**Why?** OTP notifications are temporary and only valid for 15 minutes. After 1 day, they're useless and just take up database space.

---

## 🚀 Setup Methods

### Method 1: Automatic Daily Cleanup (Recommended)

#### Option A: Using Cron (Linux/Mac)

1. **Edit crontab:**
   ```bash
   crontab -e
   ```

2. **Add this line** (runs daily at 2 AM):
   ```bash
   0 2 * * * cd /path/to/tran_stable && npx tsx scripts/cleanup-notifications.ts >> /var/log/notification-cleanup.log 2>&1
   ```

3. **Save and exit**

#### Option B: Using Task Scheduler (Windows)

1. **Open Task Scheduler** (Start → Type "Task Scheduler")

2. **Create Basic Task:**
   - Name: `Notification Cleanup`
   - Description: `Daily cleanup of old OTP notifications`
   - Trigger: Daily at 2:00 AM
   - Action: Start a program
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `"C:\Users\Admin\Videos\280126\tran_stable\node_modules\.bin\tsx" "C:\Users\Admin\Videos\280126\tran_stable\scripts\cleanup-notifications.ts"`
   - Start in: `C:\Users\Admin\Videos\280126\tran_stable`

3. **Click Finish**

#### Option C: Using PM2 (If already using PM2)

1. **Install PM2 (if not installed):**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 cron job:**
   ```bash
   pm2 start scripts/cleanup-notifications.ts --cron "0 2 * * *" --no-autorestart --name notification-cleanup
   pm2 save
   ```

---

### Method 2: API Endpoint (Manual/External Trigger)

#### Test the API:
```bash
# Get cleanup statistics
curl http://localhost:3000/api/admin/cleanup/notifications

# Run OTP cleanup
curl -X POST http://localhost:3000/api/admin/cleanup/notifications \
  -H "Content-Type: application/json" \
  -d '{"action": "otp"}'

# Run all cleanups
curl -X POST http://localhost:3000/api/admin/cleanup/notifications \
  -H "Content-Type: application/json" \
  -d '{"action": "all", "daysOld": 30}'
```

#### Setup with External Cron Service:
Use services like:
- **EasyCron** (https://www.easycron.com)
- **cron-job.org** (https://cron-job.org)
- **Render Cron Jobs** (if hosting on Render)
- **Vercel Cron** (if hosting on Vercel)

Configure them to call:
```
POST https://yourdomain.com/api/admin/cleanup/notifications
Body: {"action": "otp"}
Schedule: Daily at 2:00 AM
```

---

### Method 3: Manual Script Execution

Run manually when needed:
```bash
cd C:\Users\Admin\Videos\280126\tran_stable
npx tsx scripts/cleanup-notifications.ts
```

---

## 📊 Monitoring & Stats

### Check cleanup statistics:
```bash
# Via API
curl http://localhost:3000/api/admin/cleanup/notifications

# Via script (add to cleanup script)
npx tsx scripts/cleanup-notifications.ts
```

### Expected output:
```
🧹 Starting OTP notification cleanup...
📅 Cutoff date: 2026-02-11T18:30:00.000Z
✅ Cleanup completed!
📊 Deleted 127 old OTP notifications

✨ Cleanup summary:
   - OTP notifications deleted: 127
   - Status: Success
```

---

## 🎯 Cleanup Rules

| Notification Type | Retention | Auto-Delete | Reason |
|------------------|-----------|-------------|---------|
| OTP (Trip Start/End) | 1 day | ✅ Yes | Only valid for 15 mins, useless after |
| Quote notifications | Forever | ❌ No | User might check later |
| Booking updates | Forever | ❌ No | Important for tracking |
| Payment notifications | Forever | ❌ No | Financial records |

---

## 🔧 Configuration

### Change OTP retention period:

Edit `src/lib/cleanup/notification-cleanup.ts`:
```typescript
// Change from 1 day to 2 days
const oneDayAgo = new Date();
oneDayAgo.setDate(oneDayAgo.getDate() - 2); // Change this number
```

### Add more notification types to cleanup:

Edit the `where` clause in cleanup function:
```typescript
where: {
  OR: [
    {
      title: {
        contains: 'OTP',
        mode: 'insensitive',
      },
    },
    {
      title: {
        contains: 'Verification',
        mode: 'insensitive',
      },
    },
  ],
  createdAt: {
    lt: oneDayAgo,
  },
}
```

---

## ✅ Testing

1. **Create test OTP notification:**
   - Trigger an OTP in the app
   - Check database: `SELECT COUNT(*) FROM notifications WHERE title LIKE '%OTP%'`

2. **Run cleanup script:**
   ```bash
   npx tsx scripts/cleanup-notifications.ts
   ```

3. **Verify deletion:**
   - Check database again
   - Only notifications older than 1 day should be deleted

---

## 🚨 Important Notes

1. **Database backups:** Make sure you have regular database backups before setting up auto-cleanup
2. **Test first:** Run the script manually a few times before setting up automation
3. **Monitor logs:** Check cleanup logs regularly to ensure it's working
4. **Adjust timing:** Run cleanup during low-traffic hours (2-4 AM recommended)

---

## 📞 Support

If you face issues:
1. Check Node.js is installed: `node --version`
2. Check tsx is installed: `npx tsx --version`
3. Check database connection works
4. Check logs for errors

---

## 🎉 All Set!

Your notification cleanup system is ready! OTP notifications will be automatically deleted after 1 day, keeping your database clean and fast.
