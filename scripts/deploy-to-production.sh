#!/bin/bash

# ================================================
# TransRentals Production Deployment Script
# Deploys code to production repository with checks
# ================================================

set -e  # Exit on any error

echo "🚀 TransRentals Production Deployment"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_REMOTE="https://github.com/saurav1702/tran_stable.git"
PRODUCTION_BRANCH="main"
CURRENT_BRANCH=$(git branch --show-current)

# ================================================
# Step 1: Pre-deployment checks
# ================================================
echo -e "${BLUE}1️⃣  Running pre-deployment checks...${NC}"
echo ""

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_message
        git add .
        git commit -m "$commit_message"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${RED}❌ Please commit or stash your changes before deploying${NC}"
        exit 1
    fi
fi

# ================================================
# Step 2: Run tests locally
# ================================================
echo ""
echo -e "${BLUE}2️⃣  Running tests locally...${NC}"
if npm run test:run; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed - fix issues before deploying${NC}"
    exit 1
fi

# ================================================
# Step 3: Run security audit
# ================================================
echo ""
echo -e "${BLUE}3️⃣  Running security audit...${NC}"
if bash scripts/security-check.sh; then
    echo -e "${GREEN}✅ Security audit passed${NC}"
else
    echo -e "${YELLOW}⚠️  Security audit found warnings${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ================================================
# Step 4: Validate Prisma schema
# ================================================
echo ""
echo -e "${BLUE}4️⃣  Validating Prisma schema...${NC}"
if npx prisma validate; then
    echo -e "${GREEN}✅ Prisma schema is valid${NC}"
else
    echo -e "${RED}❌ Prisma schema validation failed${NC}"
    exit 1
fi

# ================================================
# Step 5: Check production remote
# ================================================
echo ""
echo -e "${BLUE}5️⃣  Checking production remote...${NC}"
if git remote | grep -q "production"; then
    echo -e "${GREEN}✅ Production remote already exists${NC}"
    git remote set-url production "$PRODUCTION_REMOTE"
else
    echo "Adding production remote..."
    git remote add production "$PRODUCTION_REMOTE"
    echo -e "${GREEN}✅ Production remote added${NC}"
fi

# ================================================
# Step 6: Push to production
# ================================================
echo ""
echo -e "${BLUE}6️⃣  Pushing to production repository...${NC}"
echo "Current branch: ${CURRENT_BRANCH}"
echo "Target: production/${PRODUCTION_BRANCH}"
echo ""

read -p "Push to production? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing..."
    git push production "$CURRENT_BRANCH:$PRODUCTION_BRANCH" --force-with-lease

    echo ""
    echo -e "${GREEN}✅ Successfully pushed to production!${NC}"
    echo ""
    echo "================================================"
    echo -e "${GREEN}🎉 Deployment Initiated!${NC}"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "1. Monitor CI/CD pipeline at:"
    echo "   https://github.com/saurav1702/tran_stable/actions"
    echo ""
    echo "2. Check deployment status:"
    echo "   - All tests should pass"
    echo "   - Docker build should succeed"
    echo "   - Security checks should pass"
    echo ""
    echo "3. Once CI/CD passes, deploy with Docker:"
    echo "   cd /path/to/production/server"
    echo "   git pull origin main"
    echo "   docker-compose down"
    echo "   docker-compose up -d --build"
    echo ""
    echo "4. Verify deployment:"
    echo "   curl https://your-domain.com/api/health"
    echo ""
    echo "================================================"
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi
