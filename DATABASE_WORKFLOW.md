# 🔧 DATABASE WORKFLOW - Complete Guide

## ⚠️ IMPORTANT: Read This Before Making Any Database Changes

This document explains the **PROPER** way to handle database changes to avoid issues during development and deployment.

---

## 📋 TABLE OF CONTENTS

1. [Fresh Project Setup](#fresh-project-setup)
2. [Making Schema Changes](#making-schema-changes)
3. [Deployment to Production](#deployment-to-production)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [DO's and DON'Ts](#dos-and-donts)

---

## 🚀 FRESH PROJECT SETUP

### For New Developers Cloning the Project

```bash
# Step 1: Install dependencies
npm install

# Step 2: Create .env file and set DATABASE_URL
cp .env.example .env
# Edit .env and add: DATABASE_URL="mysql://user:password@host:port/database"

# Step 3: Generate Prisma Client
npx prisma generate

# Step 4: Apply all migrations
npx prisma migrate deploy

# Step 5: Start development server
npm run dev
```

**Note:** Never use `npx prisma db push` on a shared/production database!

---

## 🔄 MAKING SCHEMA CHANGES

### ✅ CORRECT WAY (Always Follow This)

#### Step 1: Edit Schema File
```bash
# Edit prisma/schema.prisma
# Add/modify models, fields, relations, etc.
```

#### Step 2: Create Migration
```bash
npx prisma migrate dev --name descriptive_name_of_change

# Examples:
npx prisma migrate dev --name add_user_profile_table
npx prisma migrate dev --name add_email_to_bookings
npx prisma migrate dev --name update_vendor_relations
```

**What this does:**
- ✅ Creates a new migration file in `prisma/migrations/`
- ✅ Applies the migration to your local database
- ✅ Regenerates Prisma Client automatically
- ✅ Safe for existing data (Prisma handles it)

#### Step 3: Test Your Changes
```bash
# Test your application
npm run dev

# Verify in Prisma Studio
npx prisma studio
```

#### Step 4: Commit Migration to Git
```bash
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "Add: [description of schema change]"
git push
```

---

## ❌ WRONG WAYS (Never Do This)

### 1. ❌ Never Manually Add Columns to Database
```sql
-- DON'T DO THIS:
ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

**Why Wrong:**
- Schema and migrations get out of sync
- Other developers won't get the change
- Production deployment will fail
- "Column not found" errors

**Correct Way:** Edit `schema.prisma` and run `npx prisma migrate dev`

---

### 2. ❌ Never Use `db push` After Initial Setup
```bash
# DON'T DO THIS on existing database:
npx prisma db push
```

**Why Wrong:**
- Can cause data loss
- No migration history
- Can't rollback
- Unsafe for production

**When OK to use:** Only for prototype/throwaway databases

---

### 3. ❌ Never Delete Migration Files
```bash
# DON'T DO THIS:
rm -rf prisma/migrations/20250121_some_migration
```

**Why Wrong:**
- Production database will break
- Other developers' databases will break
- Migration history corrupted

**If you must:** Create a new migration that reverts the changes

---

### 4. ❌ Never Edit Old Migration Files
```sql
-- DON'T edit existing migration.sql files
```

**Why Wrong:**
- Already applied to other databases
- Checksum mismatch errors
- Production will fail

**Correct Way:** Create a new migration with changes

---

## 🚀 DEPLOYMENT TO PRODUCTION

### Initial Production Setup

```bash
# On production server:

# 1. Install dependencies
npm ci --only=production

# 2. Generate Prisma Client
npx prisma generate

# 3. Apply migrations (NEVER use migrate dev in production)
npx prisma migrate deploy

# 4. Build and start
npm run build
npm start
```

---

### Updating Production (After Schema Changes)

```bash
# On your local machine:
# 1. Make schema changes
# 2. Create migration: npx prisma migrate dev --name your_change
# 3. Test locally
# 4. Commit and push to git

# On production server:
git pull origin main

# Generate Prisma Client
npx prisma generate

# Apply new migrations
npx prisma migrate deploy

# Restart application
pm2 restart transrentals
# OR
systemctl restart transrentals
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: "Column doesn't exist" Error

**Cause:** Schema and database are out of sync

**Solution:**
```bash
# Local development:
npx prisma migrate dev

# Production:
npx prisma migrate deploy
```

---

### Issue 2: "Migration failed to apply"

**Cause:** Database has manual changes or migrations out of order

**Solution (Development Only):**
```bash
# Backup important data first!
npx prisma migrate reset --force

# Then reapply:
npx prisma migrate dev
```

**Solution (Production):**
```bash
# Check status
npx prisma migrate status

# Resolve conflicts manually
npx prisma migrate resolve --applied <migration_name>
# OR
npx prisma migrate resolve --rolled-back <migration_name>
```

---

### Issue 3: "Prisma Client is out of sync"

**Solution:**
```bash
npx prisma generate
```

Run this whenever:
- After pulling new code with schema changes
- After editing schema.prisma manually
- After applying migrations

---

### Issue 4: Migration Conflicts

**Cause:** Multiple developers changed schema simultaneously

**Solution:**
```bash
# Pull latest changes
git pull origin main

# Your migration might conflict, delete it
rm -rf prisma/migrations/[your-latest-migration]

# Recreate migration with new baseline
npx prisma migrate dev --name your_change_name
```

---

## ✅ DO's and ❌ DON'Ts

### ✅ ALWAYS DO:

1. ✅ Edit `schema.prisma` first
2. ✅ Run `npx prisma migrate dev` to create migrations
3. ✅ Test changes locally before committing
4. ✅ Commit migration files to Git
5. ✅ Use `npx prisma migrate deploy` on production
6. ✅ Run `npx prisma generate` after pulling changes
7. ✅ Backup production database before major changes
8. ✅ Use descriptive migration names
9. ✅ Review generated migration.sql files
10. ✅ Document breaking changes in commit messages

---

### ❌ NEVER DO:

1. ❌ Manually add/modify columns in database
2. ❌ Use `db push` on production
3. ❌ Delete migration files
4. ❌ Edit old migration files
5. ❌ Run `migrate dev` on production
6. ❌ Skip testing before deploying
7. ❌ Use `migrate reset` on production
8. ❌ Make schema changes directly on production
9. ❌ Ignore migration errors
10. ❌ Deploy without running migrations

---

## 📊 WORKFLOW DIAGRAM

```
LOCAL DEVELOPMENT:
1. Edit schema.prisma
   ↓
2. npx prisma migrate dev --name change_name
   ↓
3. Test locally
   ↓
4. Commit & Push (schema + migrations)
   ↓
PRODUCTION:
5. git pull
   ↓
6. npx prisma generate
   ↓
7. npx prisma migrate deploy
   ↓
8. Restart application
```

---

## 🔑 KEY COMMANDS REFERENCE

| Command | Use Case | Environment |
|---------|----------|-------------|
| `npx prisma generate` | Generate/update Prisma Client | Dev & Prod |
| `npx prisma migrate dev` | Create & apply migration | Dev Only |
| `npx prisma migrate deploy` | Apply migrations | Prod Only |
| `npx prisma migrate status` | Check migration status | Dev & Prod |
| `npx prisma studio` | View/edit data visually | Dev Only |
| `npx prisma migrate reset` | Reset database completely | Dev Only |
| `npx prisma db push` | Quick sync (no migrations) | Prototype Only |

---

## 📝 EXAMPLE: Adding a New Column

### Scenario: Add `phoneNumber` to `users` table

#### Step 1: Edit Schema
```prisma
// prisma/schema.prisma

model users {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  phoneNumber String?  // 👈 NEW FIELD
  createdAt   DateTime @default(now())
}
```

#### Step 2: Create Migration
```bash
npx prisma migrate dev --name add_phone_number_to_users
```

#### Step 3: Test
```bash
npm run dev
# Test the new field in your application
```

#### Step 4: Commit
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "Add phoneNumber field to users table"
git push origin main
```

#### Step 5: Deploy to Production
```bash
# On production server
git pull origin main
npx prisma generate
npx prisma migrate deploy
pm2 restart transrentals
```

---

## 🆘 EMERGENCY: Database is Completely Broken

### Development Database

```bash
# Nuclear option - complete reset
npx prisma migrate reset --force

# Reapply all migrations
npx prisma migrate dev
```

### Production Database

**⚠️ STOP! Don't reset production!**

1. Contact senior developer/DBA
2. Check migration status: `npx prisma migrate status`
3. Backup database first
4. Try `npx prisma migrate resolve`
5. If needed, manually fix in database then mark as applied

---

## 📞 NEED HELP?

- Check migration status: `npx prisma migrate status`
- View Prisma logs: `DEBUG=* npx prisma migrate dev`
- Prisma Docs: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Project Lead: [Your contact info]

---

## 🎯 SUMMARY

**Golden Rule:**
> Always edit `schema.prisma` first, then create migrations. Never manually change the database.

**Development Flow:**
> schema.prisma → migrate dev → test → commit

**Production Flow:**
> git pull → prisma generate → migrate deploy → restart

**When in Doubt:**
> Run `npx prisma migrate status` and ask for help!

---

*Last Updated: January 21, 2025*
*Baseline Migration: 20260121073059_baseline_fresh*
