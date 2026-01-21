# ✅ Production Deployment Checklist

## Pre-Deployment Checklist

### Code Quality
- [ ] All code changes committed
- [ ] No uncommitted or untracked files
- [ ] Code reviewed and tested locally
- [ ] ESLint passes: `npm run lint`

### Testing
- [ ] All tests pass locally: `npm run test:run`
- [ ] Health endpoint works: `curl http://localhost:3000/api/health`
- [ ] Critical APIs tested manually
- [ ] Database migrations tested

### Security
- [ ] Security audit passes: `bash scripts/security-check.sh`
- [ ] No exposed secrets in code
- [ ] No hardcoded passwords/API keys
- [ ] Dependencies updated: `npm audit`
- [ ] High-severity vulnerabilities fixed

### Database
- [ ] Prisma schema validated: `npx prisma validate`
- [ ] Migrations generated and tested
- [ ] Database backup created (production)
- [ ] Schema changes documented

### Environment
- [ ] `.env.example` updated with new variables
- [ ] Production environment variables ready
- [ ] `NEXTAUTH_SECRET` generated (strong key)
- [ ] `DATABASE_URL` configured for production
- [ ] All required secrets added to GitHub

## Deployment Steps

### 1. Automated Deployment (Recommended)
```bash
# Run the deployment script
bash scripts/deploy-to-production.sh
```

- [ ] Script started successfully
- [ ] Pre-checks passed
- [ ] Tests passed locally
- [ ] Security audit passed
- [ ] Pushed to production repository

### 2. Monitor CI/CD Pipeline
URL: https://github.com/saurav1702/tran_stable/actions

- [ ] Workflow started
- [ ] Code quality stage passed ✅
- [ ] Database validation passed ✅
- [ ] API tests passed ✅
- [ ] Docker build passed ✅
- [ ] All stages green ✅

### 3. Review Pipeline Results
- [ ] No ESLint errors
- [ ] No security vulnerabilities
- [ ] All API endpoints responding
- [ ] Docker image built successfully
- [ ] No test failures

## Post-Deployment Verification

### Application Health
- [ ] Health endpoint returns `status: "ok"`
  ```bash
  curl https://your-domain.com/api/health
  ```
- [ ] Database connected: `"database": "connected"`
- [ ] Application loads without errors
- [ ] No 500 errors in logs

### Critical Endpoints
- [ ] `GET /api/health` → 200 OK
- [ ] `GET /api/services` → 200 OK (returns services array)
- [ ] `GET /api/locations` → 200 OK (returns locations array)
- [ ] `POST /api/customer/auth/login` → Not 404
- [ ] `POST /api/vendor/auth/login` → Not 404

### Database
- [ ] Migrations deployed: `npm run db:status`
- [ ] No pending migrations
- [ ] All relations working
- [ ] No foreign key errors

### Docker Container
```bash
docker ps  # Check container running
docker logs transrentals-app  # Check logs
```

- [ ] Container status: Up
- [ ] No error logs
- [ ] Application started successfully
- [ ] Port 3000 accessible

### Monitoring
- [ ] Health check endpoint monitored
- [ ] Error tracking configured
- [ ] Log aggregation working
- [ ] Uptime monitoring active

## Rollback Plan (If Issues Occur)

### Quick Rollback
```bash
# Revert to previous version
git revert HEAD
git push production main

# Or rollback to specific commit
git reset --hard <previous-commit-hash>
git push production main --force
```

### Docker Rollback
```bash
# Use previous image
docker pull transrentals:previous-tag
docker-compose down
docker-compose up -d
```

### Database Rollback
```bash
# Restore database backup
mysql -u user -p database < backup.sql

# Or revert migration
npx prisma migrate resolve --rolled-back <migration-name>
```

## Common Issues & Solutions

### Issue: CI/CD Pipeline Fails

**Symptoms:** Red status on GitHub Actions

**Solutions:**
1. Check logs in Actions tab
2. Run failing step locally
3. Fix issues and push again

### Issue: Health Check Returns Error

**Symptoms:** `"status": "error"` or `"database": "disconnected"`

**Solutions:**
1. Check `DATABASE_URL` is correct
2. Verify database is running
3. Check Prisma Client: `npx prisma generate`
4. Review application logs

### Issue: Docker Container Won't Start

**Symptoms:** Container immediately exits

**Solutions:**
1. Check environment variables
2. Review logs: `docker logs transrentals-app`
3. Test build locally: `docker build -t test .`
4. Verify port 3000 not in use

### Issue: Database Migration Fails

**Symptoms:** Migration error during deployment

**Solutions:**
1. Check migration status: `npx prisma migrate status`
2. Resolve manually: `npx prisma migrate resolve`
3. Deploy again: `npx prisma migrate deploy`

### Issue: API Endpoints Return 500

**Symptoms:** Endpoints that worked locally fail in production

**Solutions:**
1. Check application logs
2. Verify database relations
3. Check environment variables
4. Review Prisma Client generation

## Security Checklist

### Before Deployment
- [ ] No secrets in git history
- [ ] `.env` files in `.gitignore`
- [ ] Security audit passed
- [ ] Dependencies audited
- [ ] CORS configured properly

### After Deployment
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Authentication working
- [ ] Authorization checks in place

## Performance Checklist

### Before Deployment
- [ ] Database queries optimized
- [ ] Indexes created where needed
- [ ] Large queries paginated
- [ ] Images optimized
- [ ] Build size acceptable

### After Deployment
- [ ] Response times < 1s
- [ ] Database connections pooled
- [ ] Memory usage normal
- [ ] CPU usage reasonable
- [ ] No memory leaks

## Documentation Checklist

- [ ] README.md updated
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] CICD_SETUP.md current
- [ ] API documentation updated
- [ ] Environment variables documented

## Team Communication

### Notify Team
- [ ] Deployment scheduled/announced
- [ ] Downtime window communicated (if any)
- [ ] Rollback plan shared
- [ ] On-call person assigned
- [ ] Stakeholders informed

### Post-Deployment
- [ ] Deployment success announced
- [ ] Known issues documented
- [ ] Monitoring links shared
- [ ] Next steps communicated

## Final Verification

### Smoke Tests
- [ ] User can register/login
- [ ] Booking flow works
- [ ] Admin dashboard accessible
- [ ] Vendor portal functional
- [ ] Customer app working

### Load Testing (Optional)
- [ ] Application handles expected load
- [ ] Database performs well
- [ ] No timeout errors
- [ ] Response times acceptable

## Sign-Off

**Deployed By:** _______________
**Date/Time:** _______________
**Git Commit:** _______________
**Build Number:** _______________
**Status:** ✅ Success / ⚠️ Issues / ❌ Failed

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Quick Commands Reference

```bash
# Deployment
bash scripts/deploy-to-production.sh

# Testing
npm run test:run

# Security
bash scripts/security-check.sh

# Database
npx prisma migrate status
npx prisma migrate deploy

# Docker
docker-compose up -d
docker logs transrentals-app -f

# Health Check
curl https://your-domain.com/api/health

# Rollback
git revert HEAD && git push production main
```

---

**Last Updated:** January 21, 2026
**Version:** 1.0.0
