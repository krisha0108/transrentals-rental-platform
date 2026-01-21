# 🚀 TransRentals Production Deployment Guide

This guide covers the complete CI/CD setup and deployment process for TransRentals to the production repository.

## 📋 Table of Contents
- [What Has Been Set Up](#what-has-been-set-up)
- [CI/CD Pipeline Overview](#cicd-pipeline-overview)
- [Deployment Steps](#deployment-steps)
- [Environment Variables](#environment-variables)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## ✅ What Has Been Set Up

### 1. **Docker Configuration** ✓ Completed
- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Complete stack with MySQL
- Optimized for production with security best practices

### 2. **GitHub Actions CI/CD** ✓ Completed
- `.github/workflows/production-deploy.yml` - 6-stage automated pipeline
- Runs on every push to `main`/`master` branch
- Includes pull request checks

### 3. **Automated Testing** ✓ Completed
- `tests/api/health.test.ts` - API endpoint tests
- Tests critical endpoints before deployment
- Prevents broken endpoints from going live

### 4. **Security Audits** ✓ Completed
- `scripts/security-check.sh` - Comprehensive security audit
- Checks for exposed secrets, vulnerabilities, SQL injection
- Validates environment variables and CORS configuration

### 5. **Health Check API** ✓ Completed
- `src/app/api/health/route.ts` - Database connectivity check
- Used by CI/CD and monitoring systems

---

## 🔄 CI/CD Pipeline Overview

The GitHub Actions pipeline runs automatically and includes:

### **Stage 1: Code Quality & Security** 🔍
- Runs ESLint for code quality
- Performs npm security audit
- Checks for known vulnerabilities
- Uploads security reports

### **Stage 2: Database Validation** 🗄️
- Validates Prisma schema
- Checks migration structure
- Ensures schema is production-ready

### **Stage 3: API Endpoint Tests** 🧪
- Spins up test MySQL database
- Runs Prisma migrations
- Tests all critical API endpoints
- **Fails if any endpoint is broken**

### **Stage 4: Docker Build & Test** 🐳
- Builds production Docker image
- Tests container startup
- Validates environment configuration

### **Stage 5 & 6: Notifications** ✅❌
- Success notification if all checks pass
- Failure notification with detailed logs

---

## 📦 Deployment Steps

### **Step 1: Prepare Your Repository**

1. Make sure all changes are committed:
```bash
git status
git add .
git commit -m "Setup CI/CD pipeline and production deployment"
```

2. Update repository URL in package.json (optional):
```bash
# Already pointing to: https://github.com/saurav1702/tran_stable.git
```

### **Step 2: Push to Production Repository**

```bash
# Add the production remote
git remote add production https://github.com/saurav1702/tran_stable.git

# Push to production (first time)
git push production prisma-relation-fixes-jan19:main --force

# For subsequent pushes
git push production main
```

### **Step 3: Setup GitHub Secrets**

Go to: `https://github.com/saurav1702/tran_stable/settings/secrets/actions`

Add these secrets for deployment:

```
DATABASE_URL=mysql://user:password@host:3306/database
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=TransRentals
```

### **Step 4: Monitor CI/CD Pipeline**

1. Go to: `https://github.com/saurav1702/tran_stable/actions`
2. Watch the pipeline execute
3. Check each stage for success/failure
4. Review logs if any stage fails

### **Step 5: Deploy with Docker**

Once CI/CD passes, deploy using Docker:

```bash
# Build the image
docker build -t transrentals:latest .

# Or use docker-compose
docker-compose up -d

# Check container status
docker ps
docker logs transrentals-app
```

---

## 🔐 Environment Variables

### **Required Variables**

Create `.env.production` file:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/transrentals_prod

# Authentication
NEXTAUTH_SECRET=generate-strong-secret-key-here
NEXTAUTH_URL=https://your-production-domain.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_APP_NAME=TransRentals

# Node Environment
NODE_ENV=production
```

### **Generate NEXTAUTH_SECRET**

```bash
openssl rand -base64 32
```

---

## 🏥 Monitoring & Health Checks

### **Health Check Endpoint**

```bash
# Check if app is healthy
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-21T10:00:00.000Z",
  "environment": "production"
}
```

### **Database Status**

```bash
# Check migrations status
npm run db:status

# Deploy pending migrations (production)
npm run db:deploy
```

### **Security Audit**

```bash
# Run security checks locally
bash scripts/security-check.sh

# Or use npm script
npm run security:audit
```

---

## 🔧 Troubleshooting

### **Pipeline Fails: ESLint Errors**
```bash
# Fix linting issues locally
npm run lint

# Some ESLint errors can be auto-fixed
npm run lint -- --fix
```

### **Pipeline Fails: API Tests**
```bash
# Run tests locally
npm run test:run

# Run specific test file
npm run test tests/api/health.test.ts
```

### **Pipeline Fails: Docker Build**
```bash
# Test Docker build locally
docker build -t transrentals:test .

# Check for errors in build logs
docker build -t transrentals:test . 2>&1 | tee build.log
```

### **Database Migration Issues**
```bash
# Check current migration status
npx prisma migrate status

# Deploy migrations (production - no prompts)
npx prisma migrate deploy

# Reset database (development only - DANGEROUS)
npx prisma migrate reset
```

### **Container Won't Start**
```bash
# Check container logs
docker logs transrentals-app

# Common issues:
# 1. DATABASE_URL not set or incorrect
# 2. NEXTAUTH_SECRET missing
# 3. Port 3000 already in use
```

---

## 🎯 Quick Command Reference

```bash
# Development
npm run dev              # Start dev server
npm run db:migrate       # Run migrations (dev)
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run with coverage

# Production
npm run build            # Build for production
npm start                # Start production server
npm run db:deploy        # Deploy migrations (production)

# Database
npm run db:status        # Check migration status
npm run db:generate      # Generate Prisma Client
npm run post-pull        # After git pull (install + migrate)

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # Follow logs
```

---

## 📊 What Gets Checked Automatically

### ✅ **Every Git Push Triggers:**
1. Code quality checks (ESLint)
2. Security vulnerability scan
3. Prisma schema validation
4. API endpoint testing
5. Docker build verification
6. Container health check

### ❌ **Deployment Stops If:**
- Any API endpoint returns 500 error
- Database connection fails
- Docker build fails
- High-severity npm vulnerabilities found
- Prisma schema is invalid

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ All GitHub Actions stages are green
2. ✅ Health check returns `status: "ok"`
3. ✅ Database connection is stable
4. ✅ All API endpoints respond correctly
5. ✅ No security vulnerabilities found
6. ✅ Docker container runs without errors

---

## 📞 Support & Logs

### **View CI/CD Logs**
- GitHub Actions: `https://github.com/saurav1702/tran_stable/actions`

### **View Application Logs**
```bash
# Docker logs
docker logs transrentals-app --tail 100 -f

# System logs (if using PM2 or systemd)
pm2 logs transrentals
journalctl -u transrentals -f
```

### **Debug Mode**
```bash
# Run with debug logging
DEBUG=* npm run dev

# Check specific API endpoint
curl -v http://localhost:3000/api/health
```

---

## 🚨 Important Notes

1. **Never push to production without CI/CD passing** - The pipeline is your safety net
2. **Always use `migrate deploy` in production** - Never use `migrate dev`
3. **Keep secrets in environment variables** - Never commit .env files
4. **Monitor the health endpoint** - Set up uptime monitoring
5. **Review security audit regularly** - Run `npm audit` weekly

---

## 📝 Summary

You now have a **production-ready CI/CD pipeline** that:
- ✅ Automatically tests every code change
- ✅ Prevents broken endpoints from deploying
- ✅ Performs security audits
- ✅ Validates database schema
- ✅ Tests Docker builds
- ✅ Provides detailed error logs

**Next Steps:**
1. Push code to `https://github.com/saurav1702/tran_stable.git`
2. Watch GitHub Actions pipeline
3. Fix any issues that arise
4. Deploy with Docker when CI passes
5. Monitor health endpoint

---

**Created by:** Claude Code - Production CI/CD Setup
**Last Updated:** January 21, 2026
