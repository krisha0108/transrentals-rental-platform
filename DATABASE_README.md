# 📚 DATABASE SETUP & WORKFLOW - Complete Guide

## 🎯 Purpose

This document is the **master index** for all database-related documentation. Follow the links below based on your needs.

---

## 📖 Documentation Files

### 1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡
**Use this for:** Daily commands and quick lookup

- Most commonly used commands
- Troubleshooting quick fixes
- DO's and DON'Ts checklist
- **Read time:** 2 minutes

### 2. **[LOCAL_SETUP_PERFECT.md](./LOCAL_SETUP_PERFECT.md)** 🚀
**Use this for:** Setting up your local environment

- Fresh project setup guide
- Daily workflow automation
- Pre-commit checklist
- Git hooks setup
- **Read time:** 10 minutes

### 3. **[DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md)** 🔧
**Use this for:** Understanding proper database practices

- Complete workflow explanation
- Making schema changes correctly
- Production deployment guide
- Common issues & solutions
- **Read time:** 15 minutes

---

## 🚀 Quick Start (New Developer)

```bash
# 1. Clone and install
git clone <repo-url>
cd transrentals-laptop
npm install

# 2. Setup database
# Create .env file with: DATABASE_URL="mysql://user:pass@host:port/db"

# 3. Setup database
npm run db:generate
npm run db:deploy

# 4. Start dev server
npm run dev
```

**Done!** Read [LOCAL_SETUP_PERFECT.md](./LOCAL_SETUP_PERFECT.md) for details.

---

## 🔄 Daily Workflow

```bash
# After git pull (ALWAYS)
npm run post-pull

# When making schema changes
npx prisma migrate dev --name your_change
```

**Details:** See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## 🎓 Learning Path

### For Beginners:
1. Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) first
2. Then read [LOCAL_SETUP_PERFECT.md](./LOCAL_SETUP_PERFECT.md)
3. Keep [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) open while working

### For Intermediate:
1. Read [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md) completely
2. Understand migration concepts
3. Practice making schema changes

### For Production Deployment:
1. Read "Deployment to Production" in [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md)
2. Follow production checklist
3. Have rollback plan ready

---

## 🛡️ Golden Rules (Never Break)

1. ✅ Always run `npm run post-pull` after `git pull`
2. ✅ Always create migrations with `npx prisma migrate dev`
3. ✅ Never manually edit the database
4. ✅ Never use `db:push` on production
5. ✅ Always test locally before deploying

**Full list:** See [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md#dos-and-donts)

---

## 📊 Current Database Status

- **Baseline Migration:** `20260121073059_baseline_fresh`
- **Total Migrations:** 1
- **Database:** MySQL
- **ORM:** Prisma v6.19.2
- **Status:** ✅ Production Ready

Check status: `npm run db:status`

---

## 🆘 Troubleshooting

### Quick Fixes:

| Problem | Solution |
|---------|----------|
| Client out of date | `npm run db:generate` |
| Column not found | `npm run db:deploy` |
| Migration failed | Check [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md#common-issues--solutions) |

### Still Stuck?

1. Run: `npm run db:status`
2. Check: [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md#common-issues--solutions)
3. Ask: Project lead

---

## 📦 Available NPM Scripts

```bash
# Database Commands
npm run db:generate      # Generate Prisma Client
npm run db:deploy        # Apply migrations (production)
npm run db:migrate       # Create migration (development)
npm run db:status        # Check migration status
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (dev only)
npm run db:update        # Generate + Deploy (after pull)
npm run post-pull        # Complete update after pull

# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
```

---

## 🔐 Environment Variables

Required in `.env`:

```env
DATABASE_URL="mysql://user:password@host:port/database"
```

See `.env.example` for all variables.

---

## 📁 Important Files

```
transrentals-laptop/
├── prisma/
│   ├── schema.prisma          # Database schema (edit this)
│   └── migrations/            # Migration history (don't delete)
├── .env                       # Database connection (don't commit)
├── DATABASE_README.md         # This file (index)
├── QUICK_REFERENCE.md         # Daily commands
├── LOCAL_SETUP_PERFECT.md     # Setup guide
└── DATABASE_WORKFLOW.md       # Complete workflow
```

---

## 🎯 Common Tasks

### Task: Pull latest code
```bash
npm run post-pull
```

### Task: Add new table
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_new_table
```

### Task: Add new column
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_column_to_table
```

### Task: View database
```bash
npm run db:studio
```

### Task: Check migration status
```bash
npm run db:status
```

### Task: Deploy to production
```bash
# On production server
git pull origin main
npm run db:generate
npm run db:deploy
pm2 restart transrentals
```

---

## ⚠️ Critical Warnings

### 🚫 NEVER do these on Production:
- ❌ `npm run db:reset`
- ❌ `npm run db:push`
- ❌ Manual database edits
- ❌ Delete migration files

### ⚠️ ALWAYS do these:
- ✅ Backup before major changes
- ✅ Test migrations locally
- ✅ Use `npm run db:deploy` on production
- ✅ Have rollback plan

---

## 📞 Support & Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **Migration Guide:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Quick Help:** See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Detailed Help:** See [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md)

---

## ✅ Checklist Before Starting

- [ ] Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [ ] Setup local database
- [ ] Created `.env` file
- [ ] Ran `npm install`
- [ ] Ran `npm run db:generate`
- [ ] Ran `npm run db:deploy`
- [ ] Verified with `npm run db:status`
- [ ] Tested with `npm run dev`
- [ ] Bookmarked this file

---

## 🎉 You're Ready!

Keep [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) open while working and refer to other guides as needed.

**Remember:** When in doubt, run `npm run db:status` and check the docs!

---

*Last Updated: January 21, 2025*
*Version: 1.0*
*Status: Production Ready ✅*
