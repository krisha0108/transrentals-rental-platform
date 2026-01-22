# 🚀 QUICK DEPLOYMENT GUIDE
**Give this to your assistant for production deployment**

---

## 📋 Pre-Deployment Checklist
- [ ] Code tested locally
- [ ] All tests passing
- [ ] Changes committed to Git
- [ ] Database backup taken

---

## 🔄 DEPLOYMENT STEPS (Linux Server)

### Step 1: Connect to Server
```bash
ssh user@your-linode-server-ip
cd /path/to/tran_stable
```

### Step 2: Pull Latest Code
```bash
git pull origin main
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Migrations (IMPORTANT!)
```bash
# This applies new tables/columns safely
npx prisma migrate deploy
```

### Step 5: Generate Prisma Client
```bash
npx prisma generate
```

### Step 6: Build Application
```bash
npm run build
```

### Step 7: Restart Application
```bash
# If using PM2
pm2 restart transrentals

# If using systemd
sudo systemctl restart transrentals
```

### Step 8: Verify Deployment
```bash
# Check logs
pm2 logs transrentals --lines 50

# Check if running
pm2 status
```

---

## ✅ Success Indicators
- Application restarted without errors
- Logs show no errors
- Website loads correctly
- New features working

---

## 🚨 If Something Goes Wrong

### Rollback Steps
```bash
# 1. Go back to previous version
git checkout HEAD~1

# 2. Reinstall
npm install

# 3. Rebuild
npm run build

# 4. Restart
pm2 restart transrentals
```

---

## 📞 Important Commands

### Check Application Status
```bash
pm2 status
pm2 logs transrentals
```

### Check Database
```bash
npx prisma studio  # Opens database viewer
npx prisma migrate status  # Check migrations
```

### Restart Application
```bash
pm2 restart transrentals
pm2 reload transrentals  # Zero downtime restart
```

---

## ⚠️ CRITICAL RULES

1. **ALWAYS use `npx prisma migrate deploy`** for database changes
2. **NEVER skip the migration step**
3. **Take database backup before major changes**
4. **Check logs after deployment**

---

**Last Updated:** January 2026
