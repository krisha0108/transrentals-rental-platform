# 🔧 CI/CD Setup Documentation

## Overview
Complete CI/CD pipeline setup for TransRentals with automated testing, security audits, and Docker deployment.

## What Was Implemented

### 1. GitHub Actions Workflow
**File:** `.github/workflows/production-deploy.yml`

**Stages:**
1. **Code Quality & Security**
   - ESLint validation
   - npm security audit
   - Vulnerability scanning
   - Security report generation

2. **Database Validation**
   - Prisma schema validation
   - Migration structure check
   - Schema-database sync verification

3. **API Endpoint Tests**
   - MySQL test database setup
   - Prisma migrations deployment
   - Critical endpoint testing
   - Health check validation

4. **Docker Build & Test**
   - Multi-stage Docker build
   - Container health verification
   - Environment validation

5. **Success/Failure Notifications**
   - Detailed build reports
   - Error logs for debugging

### 2. Testing Infrastructure
**File:** `tests/api/health.test.ts`

**Test Coverage:**
- Health check endpoint
- Database connectivity
- Public API endpoints (services, locations)
- Authentication endpoints (customer, vendor)

**Technology:** Vitest framework with Node environment

### 3. Security Audit System
**File:** `scripts/security-check.sh`

**Security Checks:**
1. NPM audit for vulnerabilities
2. Exposed secrets detection (.env files, hardcoded passwords/API keys)
3. Outdated dependencies check
4. Prisma SQL injection patterns
5. Debug statements in production code
6. Environment variables validation
7. CORS configuration check

### 4. Health Monitoring
**File:** `src/app/api/health/route.ts`

**Features:**
- Database connectivity check
- Server status monitoring
- Timestamp for uptime tracking
- Environment information
- JSON response format

**Response Example:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-21T10:00:00.000Z",
  "environment": "production"
}
```

### 5. Deployment Scripts
**File:** `scripts/deploy-to-production.sh`

**Deployment Flow:**
1. Pre-deployment checks (uncommitted changes)
2. Local test execution
3. Security audit
4. Prisma schema validation
5. Production remote verification
6. Safe push with confirmation

## Configuration Files

### package.json Scripts
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "security:audit": "bash scripts/security-audit.sh",
  "db:deploy": "npx prisma migrate deploy"
}
```

### Vitest Configuration
**File:** `vitest.config.ts`
- Node environment
- Path aliases (@/ → ./src)
- Coverage reporting (v8 provider)
- Test file patterns

### Docker Configuration
**Files:** `Dockerfile`, `docker-compose.yml`
- Multi-stage production build
- MySQL service integration
- Environment variable management
- Volume persistence

## Pipeline Triggers

The CI/CD pipeline automatically runs on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master`
- Manual workflow dispatch

## Environment Variables Required

### GitHub Secrets
Set these in: `Settings → Secrets and variables → Actions`

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
```

### Local Development
Copy `.env.example` to `.env` and configure:
```env
DATABASE_URL=mysql://root:password@localhost:3306/transrentals
NEXTAUTH_SECRET=generate-with-openssl-rand
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TransRentals
NODE_ENV=development
```

## Usage

### Automated Deployment (Recommended)
```bash
# Run the deployment script
bash scripts/deploy-to-production.sh
```

This script will:
1. Check for uncommitted changes
2. Run all tests locally
3. Perform security audit
4. Validate Prisma schema
5. Push to production repository
6. Trigger GitHub Actions pipeline

### Manual Deployment
```bash
# Run tests
npm run test:run

# Run security audit
bash scripts/security-check.sh

# Validate schema
npx prisma validate

# Push to production
git push production main
```

### Local Testing
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Test health endpoint locally
npm run dev
curl http://localhost:3000/api/health
```

### Docker Deployment
```bash
# Build image
docker build -t transrentals:latest .

# Run with docker-compose
docker-compose up -d

# Check logs
docker logs transrentals-app -f

# Check health
curl http://localhost:3000/api/health
```

## Monitoring

### GitHub Actions Dashboard
URL: `https://github.com/saurav1702/tran_stable/actions`

**What to Monitor:**
- Build status (green = pass, red = fail)
- Test results
- Security audit reports
- Docker build logs

### Health Check Endpoint
URL: `https://your-domain.com/api/health`

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Failure Response:**
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Connection failed"
}
```

## Troubleshooting

### Tests Fail in CI/CD
1. Run tests locally: `npm run test:run`
2. Check test logs in GitHub Actions
3. Verify DATABASE_URL is set correctly
4. Check if MySQL service is healthy

### Security Audit Warnings
1. Run locally: `bash scripts/security-check.sh`
2. Fix high-severity npm vulnerabilities: `npm audit fix`
3. Remove hardcoded secrets
4. Update dependencies: `npm update`

### Docker Build Fails
1. Test locally: `docker build -t test .`
2. Check Dockerfile syntax
3. Verify all dependencies are in package.json
4. Check build logs for errors

### Database Migration Issues
```bash
# Check status
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Health Check Returns Error
1. Check database connection
2. Verify DATABASE_URL is correct
3. Check Prisma Client is generated
4. Review application logs

## Best Practices

### Before Every Deployment
- ✅ Run tests locally
- ✅ Run security audit
- ✅ Validate Prisma schema
- ✅ Review uncommitted changes
- ✅ Check CI/CD status

### During Deployment
- ✅ Monitor GitHub Actions
- ✅ Watch for error notifications
- ✅ Review security reports
- ✅ Check Docker build logs

### After Deployment
- ✅ Verify health endpoint
- ✅ Test critical APIs
- ✅ Check application logs
- ✅ Monitor database connections
- ✅ Review user-facing functionality

## Security Considerations

### Automated Checks
- npm vulnerabilities (high+ severity)
- Exposed secrets in code
- SQL injection patterns
- Debug statements in production
- CORS misconfigurations

### Manual Reviews
- Review security audit reports weekly
- Update dependencies monthly
- Rotate secrets quarterly
- Review access logs regularly

## Success Metrics

### Deployment Quality
- ✅ 100% test pass rate
- ✅ Zero high-severity vulnerabilities
- ✅ Valid Prisma schema
- ✅ Successful Docker build
- ✅ Healthy API endpoints

### Performance
- ✅ Health check responds < 1s
- ✅ Database queries optimized
- ✅ Docker image size < 500MB
- ✅ Build time < 10 minutes

## Repository URLs

- **Production:** https://github.com/saurav1702/tran_stable.git
- **Development:** Current repository

## Key Files Summary

```
.github/workflows/production-deploy.yml  # Main CI/CD pipeline
tests/api/health.test.ts                 # API endpoint tests
scripts/security-check.sh                # Security audit script
scripts/deploy-to-production.sh          # Deployment automation
src/app/api/health/route.ts              # Health check endpoint
Dockerfile                               # Production container
docker-compose.yml                       # Full stack setup
vitest.config.ts                         # Test configuration
.env.example                             # Environment template
```

## Support

### Documentation
- Main Guide: `DEPLOYMENT_GUIDE.md`
- This File: `CICD_SETUP.md`
- Database: `DATABASE_README.md`

### Logs
- GitHub Actions: Check Actions tab
- Docker: `docker logs transrentals-app`
- Application: Check console output

---

**Setup Completed:** January 21, 2026
**CI/CD Status:** Ready for Production
**Documentation:** Complete
