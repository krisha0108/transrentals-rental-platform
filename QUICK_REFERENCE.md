# ⚡ QUICK REFERENCE - Database Commands

## 🎯 Most Used Commands

```bash
# After git pull (ALWAYS run this)
npm run post-pull

# OR manually:
npm install
npm run db:update
```

---

## 📋 Daily Commands

| Command | When to Use | What it Does |
|---------|-------------|--------------|
| `npm run db:update` | After pulling code | Generates client + applies migrations |
| `npm run db:status` | Check database state | Shows pending migrations |
| `npm run db:studio` | View database | Opens visual database browser |
| `npm run db:generate` | After schema edit | Regenerates Prisma Client |

---

## 🔧 Making Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration:
npx prisma migrate dev --name your_change_name

# 3. Test:
npm run dev

# 4. Commit:
git add prisma/
git commit -m "Add: your change"
```

---

## 🚀 Production Deployment

```bash
# On production server:
git pull origin main
npm ci --only=production
npm run db:generate
npm run db:deploy
npm run build
pm2 restart transrentals
```

---

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| "Prisma Client not found" | `npm run db:generate` |
| "Column doesn't exist" | `npm run db:deploy` |
| "Migration failed" (dev) | `npm run db:reset` |
| "Out of sync" | `npm run db:status` then `npm run db:deploy` |

---

## ✅ DO | ❌ DON'T

### ✅ Always Do:
- Run `npm run post-pull` after pulling code
- Create migrations with `npx prisma migrate dev`
- Test locally before deploying
- Commit schema + migrations together

### ❌ Never Do:
- Manually edit database
- Use `db:push` on production
- Delete migration files
- Edit old migrations
- Run `db:reset` on production

---

## 🔑 Key Files

- `prisma/schema.prisma` - Database schema (edit this)
- `prisma/migrations/` - Migration history (don't delete)
- `.env` - Database connection (don't commit)

---

## 📞 Need Help?

1. Check: `npm run db:status`
2. Read: `LOCAL_SETUP_PERFECT.md`
3. Read: `DATABASE_WORKFLOW.md`

---

*Quick Ref v1.0 | Updated: Jan 21, 2025*
