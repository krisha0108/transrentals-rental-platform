# TransRentals CI/CD Pipeline

## Overview

This CI/CD pipeline automates the building, testing, and deployment of the **TransRentals Web Backend** (Next.js application).

## What It Does

### 🚀 Automated Jobs

1. **Backend Tests** - Runs backend tests with MySQL database
2. **Frontend Tests** - Runs frontend tests
3. **Security Scan** - Runs npm audit for security vulnerabilities
4. **Backend Linting** - Runs ESLint to check code quality
5. **Build Application** - Builds the Next.js application
6. **Docker Build & Push** - Creates and pushes Docker image to GitHub Container Registry
7. **Deploy to Production** - Notifies Coolify for deployment

### 📱 What's Excluded

**Mobile apps are NOT included in this pipeline:**
- ✅ `tr-app/` - Customer Mobile App (React Native)
- ✅ `vendor-app/` - Vendor Mobile App (React Native)

These apps are built and deployed separately using their own build processes (e.g., EAS Build, CodePush).

### 🎯 Trigger Conditions

The pipeline runs when:
- ✅ Code is pushed to `main`, `master`, or `develop` branches
- ✅ Pull request is created/updated targeting these branches
- ❌ Only mobile app files are changed (pipeline is skipped)
- ❌ Only documentation files are changed (pipeline is skipped)

### 📊 Pipeline Stages

```
Push to main/develop
        ↓
┌───────────────────────────┐
│  Run Tests & Security     │
│  - Backend Tests          │
│  - Frontend Tests         │
│  - Security Scan          │
│  - Linting                │
└───────────────────────────┘
        ↓
┌───────────────────────────┐
│  Build Application        │
│  - Generate Prisma Client │
│  - Run Migrations         │
│  - Build Next.js          │
└───────────────────────────┘
        ↓
┌───────────────────────────┐
│  Docker Build & Push      │
│  - Build Docker Image     │
│  - Push to GHCR           │
└───────────────────────────┘
        ↓
┌───────────────────────────┐
│  Deploy to Production     │
│  - Notify Coolify         │
└───────────────────────────┘
```

### 🔧 Environment Variables

Required secrets in GitHub:
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

### 📝 Configuration Files

- `.github/workflows/ci.yml` - Main CI/CD configuration
- `Dockerfile` - Docker image build configuration
- `package.json` - Build scripts and dependencies

### 🛠️ Local Testing

To test the build locally before pushing:

```bash
# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Run tests
npm test

# Run linting
npm run lint

# Build application
npm run build
```

### 📦 Docker Registry

Built images are pushed to:
```
ghcr.io/saurav1702/tran_stable:latest
ghcr.io/saurav1702/tran_stable:<commit-sha>
```

### 🚨 Troubleshooting

If CI/CD fails:

1. **Check the logs** in GitHub Actions tab
2. **Verify environment variables** are set correctly
3. **Test locally** using the commands above
4. **Check Prisma migrations** are up to date
5. **Verify Docker build** works locally

### 📱 Mobile App Deployments

Mobile apps are deployed separately:

**Customer App (tr-app):**
- Build: React Native / Android Studio / Xcode
- Deploy: Google Play Console / Apple App Store

**Vendor App (vendor-app):**
- Build: React Native / Android Studio / Xcode
- Deploy: Google Play Console / Apple App Store

---

**Last Updated:** 2026-01-28
**Maintained By:** TransRentals Dev Team
