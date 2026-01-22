# 🚀 TransRentals - Production Deployment Guide

**Complete guide for deploying to Linux/Windows servers without data loss**

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Workflow](#development-workflow)
3. [Production Deployment](#production-deployment)
4. [Adding New Tables/Columns](#adding-new-tablescolumns)
5. [Troubleshooting](#troubleshooting)
6. [Platform-Specific Notes](#platform-specific-notes)

---

## ✅ Prerequisites

### Required Software
- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL >= 8.0
- Git

### Environment Files
Ensure you have these files:
- `.env` (local development)
- `.env.production` (production server)

---

## 🔧 Development Workflow

### When Adding New Tables or Columns

**❌ NEVER USE `prisma db push` in production!**
**✅ ALWAYS USE `prisma migrate` commands**

#### Step 1: Update Schema
Edit `prisma/schema.prisma` and add your new table/column:

```prisma
model new_table {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Step 2: Create Migration (Local)
```bash
# This creates a migration file and applies it locally
npx prisma migrate dev --name add_new_table
```

**What this does:**
- Creates a new migration file in `prisma/migrations/`
- Applies the migration to your local database
- Updates Prisma Client
- **NO DATA LOSS** - Only adds new tables/columns

#### Step 3: Commit to Git
```bash
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat: add new_table to schema"
git push origin main
```

---

## 🌐 Production Deployment (Linux - Linode)

### Complete Deployment Steps

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Navigate to project
cd /path/to/tran_stable

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm install

# 5. Apply migrations (SAFE - No data loss!)
npx prisma migrate deploy

# 6. Generate Prisma Client
npx prisma generate

# 7. Build application
npm run build

# 8. Restart application
pm2 restart transrentals
```

---

## 📦 Adding New Tables - Complete Example

### Scenario: Adding an `orders` table

**Step 1 - Development (Windows):**
```bash
# Edit schema
code prisma/schema.prisma
# Add new table

# Create migration
npx prisma migrate dev --name add_orders_table

# Test locally
npm run dev

# Commit
git add .
git commit -m "feat: add orders table"
git push origin main
```

**Step 2 - Production (Linux):**
```bash
# Pull changes
git pull origin main

# Apply migration (SAFE!)
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart transrentals
```

**✅ Result: New table added, ALL existing data preserved!**

---

## 🛠️ Migration Commands

### Development
```bash
# Create and apply migration
npx prisma migrate dev --name description

# Check status
npx prisma migrate status
```

### Production
```bash
# Apply migrations (SAFE)
npx prisma migrate deploy

# Check status
npx prisma migrate status
```

---

## 🚨 Troubleshooting

### Issue: "Migration will result in data loss"

**Solution - Two-Step Migration:**
```bash
# Step 1: Add new column, keep old
npx prisma migrate dev --name add_new_column

# Step 2: After data migration, remove old
npx prisma migrate dev --name remove_old_column
```

### Issue: "Database not in sync"

```bash
# Check what's wrong
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

---

## 🖥️ Linux vs Windows - Important Notes

### Works on Both Platforms ✅
```bash
# Commands are identical
npx prisma migrate dev
npx prisma migrate deploy
npm run build
```

### File Paths
```javascript
// ✅ Use forward slashes (works everywhere)
const path = './prisma/schema.prisma'

// ❌ Avoid backslashes (Windows only)
const path = '.\prisma\schema.prisma'
```

### Environment Variables
```bash
# Same format for both Linux and Windows
DATABASE_URL="mysql://user:pass@localhost:3306/db"
```

---

## 📊 Database Backup (Before Major Changes)

### Linux
```bash
# Backup
mysqldump -u root -p trans_stable > backup_$(date +%Y%m%d).sql

# Restore if needed
mysql -u root -p trans_stable < backup_20260122.sql
```

---

## ✅ Complete Deployment Checklist

**Give this to your assistant:**

### Before Deployment
- [ ] All changes in Git
- [ ] Migrations tested locally
- [ ] Database backup taken

### Deploy Steps
```bash
# 1. Pull code
git pull origin main

# 2. Install deps
npm install

# 3. Apply migrations (CRITICAL!)
npx prisma migrate deploy

# 4. Generate client
npx prisma generate

# 5. Build
npm run build

# 6. Restart
pm2 restart transrentals
```

### After Deployment
- [ ] Check logs: `pm2 logs transrentals`
- [ ] Verify features working
- [ ] Monitor for errors

---

## ⚡ Quick Reference

### ✅ DO's
- ✅ Use `prisma migrate dev` locally
- ✅ Use `prisma migrate deploy` on server
- ✅ Commit migration files
- ✅ Backup before big changes

### ❌ DON'Ts
- ❌ NEVER `prisma db push` in production
- ❌ Don't edit migrations after applying
- ❌ Don't delete migration files

---

## 🎯 Key Principle

> **Use MIGRATIONS for all schema changes!**
> 
> Migrations = Version controlled + Reversible + Safe for production

**For New Tables:**
1. Edit `schema.prisma`
2. `npx prisma migrate dev --name add_table`
3. Test
4. Commit
5. Production: `npx prisma migrate deploy`

**Result:** ✅ New tables added, existing data safe!

---

**Last Updated:** January 2026
