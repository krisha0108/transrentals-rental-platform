# 🏷️ TransRentals - Naming Convention

## ✅ PERMANENT STANDARD: snake_case

---

## 📋 Why snake_case?

### Database Requirement
- MySQL/PostgreSQL: snake_case recommended
- Production stability: snake_case proven
- Team decision: Use snake_case everywhere

---

## 🎯 Current Implementation (PERMANENT)

### ✅ Prisma Schema - snake_case
```prisma
model blog_posts {
  admin_users     admin_users
  blog_categories blog_categories
  seo_meta        seo_meta
}

model fleet_location_rates {
  fleet_locations fleet_locations
}
```

### ✅ TypeScript Code - snake_case (matches schema)
```typescript
prisma.blog_posts.findMany({
  include: {
    admin_users: true,
    blog_categories: true,
    seo_meta: true
  }
})
```

### ✅ Database Tables - snake_case
```sql
blog_posts
admin_users
blog_categories
seo_meta
fleet_locations
```

**Everything is aligned! ✅**

---

## ❌ What Was Wrong Before?

### Schema was snake_case:
```prisma
model blog_posts {
  admin_users admin_users  // snake_case
}
```

### But code used camelCase:
```typescript
include: {
  author: true  // ❌ Wrong! Should be admin_users
}
```

### Result: 
```
Error: Unknown field `author`
```

---

## ✅ What We Fixed (PERMANENT)

### Changed code to match schema:
```typescript
include: {
  admin_users: true  // ✅ Correct! Matches schema
}
```

### Result:
```
No errors! Everything works! ✅
```

---

## 🔒 This is NOT a Temporary Fix

### Why This is PERMANENT:

1. **Schema is the source of truth**
   - Prisma generates code FROM schema
   - Schema names = Final names
   - No way to override (without hacks)

2. **Database uses snake_case**
   - Tables are snake_case
   - Columns are snake_case
   - Schema MUST match database

3. **Code MUST match schema**
   - Prisma enforces this
   - No choice - it's how Prisma works
   - This is the CORRECT way

4. **Production requirement**
   - You decided: snake_case for stability
   - Live server already uses snake_case
   - This matches your production DB

---

## 📊 Verification

### Check Schema:
```bash
cat prisma/schema.prisma | grep "model blog_posts" -A 20
```
Output: Relations are snake_case ✅

### Check Generated Client:
```bash
cat node_modules/@prisma/client/index.d.ts | grep "blog_posts" -A 10
```
Output: Types are snake_case ✅

### Check Code:
```bash
grep -r "admin_users: true" src/
```
Output: Code uses snake_case ✅

---

## 🎯 Future-Proof

### When adding new tables:
```bash
# 1. Add to schema (use snake_case)
model new_orders {
  order_items order_items[]  # snake_case
}

# 2. Generate client
npx prisma generate

# 3. Use in code (snake_case)
prisma.new_orders.findMany({
  include: {
    order_items: true  # snake_case
  }
})
```

**Always snake_case! ✅**

---

## ✅ Summary

**This is NOT a workaround.**
**This is NOT temporary.**
**This is the CORRECT, PERMANENT implementation.**

Your schema defines snake_case → Code uses snake_case → Everything matches → No errors! ✅

---

**Last Updated:** January 2026
