#!/bin/bash

# ================================================
# Pre-Deployment Health Check Script
# Run this before deploying to ensure readiness
# ================================================

set -e

echo "🔍 Pre-Deployment Health Check"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track status
ALL_CHECKS_PASSED=true

# ================================================
# 1. Check Environment Variables
# ================================================
echo -e "${BLUE}1️⃣  Checking Environment Variables...${NC}"

REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "NEXT_PUBLIC_APP_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}❌ Missing: $var${NC}"
    ALL_CHECKS_PASSED=false
  else
    echo -e "${GREEN}✅ Found: $var${NC}"
  fi
done

# ================================================
# 2. Check Database Connectivity
# ================================================
echo ""
echo -e "${BLUE}2️⃣  Checking Database Connectivity...${NC}"

if command -v mysql &> /dev/null; then
  # Extract DB credentials from DATABASE_URL
  # Format: mysql://user:pass@host:port/database

  if [[ $DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"

    # Test connection
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT 1;" &> /dev/null; then
      echo -e "${GREEN}✅ Database connection successful${NC}"
    else
      echo -e "${RED}❌ Cannot connect to database${NC}"
      ALL_CHECKS_PASSED=false
    fi
  else
    echo -e "${YELLOW}⚠️  Could not parse DATABASE_URL${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  MySQL client not installed, skipping DB check${NC}"
fi

# ================================================
# 3. Check Prisma Migrations
# ================================================
echo ""
echo -e "${BLUE}3️⃣  Checking Prisma Migrations...${NC}"

if npx prisma migrate status &> /dev/null; then
  echo -e "${GREEN}✅ All migrations applied${NC}"
else
  echo -e "${YELLOW}⚠️  Pending migrations detected${NC}"
  echo -e "${YELLOW}    Run: npx prisma migrate deploy${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    ALL_CHECKS_PASSED=false
  fi
fi

# ================================================
# 4. Validate Prisma Schema
# ================================================
echo ""
echo -e "${BLUE}4️⃣  Validating Prisma Schema...${NC}"

if npx prisma validate; then
  echo -e "${GREEN}✅ Prisma schema is valid${NC}"
else
  echo -e "${RED}❌ Prisma schema validation failed${NC}"
  ALL_CHECKS_PASSED=false
fi

# ================================================
# 5. Check Docker Image
# ================================================
echo ""
echo -e "${BLUE}5️⃣  Checking Docker Image...${NC}"

if command -v docker &> /dev/null; then
  IMAGE_NAME="${DOCKER_IMAGE:-transrentals:latest}"

  if docker image inspect "$IMAGE_NAME" &> /dev/null; then
    echo -e "${GREEN}✅ Docker image found: $IMAGE_NAME${NC}"

    # Check image size
    IMAGE_SIZE=$(docker image inspect "$IMAGE_NAME" --format='{{.Size}}' | awk '{print $1/1024/1024}')
    echo "   Image size: ${IMAGE_SIZE}MB"
  else
    echo -e "${YELLOW}⚠️  Docker image not found: $IMAGE_NAME${NC}"
    echo "   Build with: docker build -t $IMAGE_NAME ."
  fi
else
  echo -e "${YELLOW}⚠️  Docker not installed${NC}"
fi

# ================================================
# 6. Check Current Deployment (if exists)
# ================================================
echo ""
echo -e "${BLUE}6️⃣  Checking Current Deployment...${NC}"

HEALTH_ENDPOINT="${NEXTAUTH_URL:-http://localhost:3000}/api/health"

if curl -f -s "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Current deployment is healthy${NC}"

  # Get health status
  HEALTH_STATUS=$(curl -s "$HEALTH_ENDPOINT")
  echo "   Status: $HEALTH_STATUS"
else
  echo -e "${YELLOW}⚠️  No current deployment or unhealthy${NC}"
fi

# ================================================
# 7. Check Disk Space
# ================================================
echo ""
echo -e "${BLUE}7️⃣  Checking Disk Space...${NC}"

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -lt 80 ]; then
  echo -e "${GREEN}✅ Disk usage: ${DISK_USAGE}%${NC}"
else
  echo -e "${YELLOW}⚠️  Disk usage high: ${DISK_USAGE}%${NC}"
  echo "   Consider cleaning up old containers/images"
fi

# ================================================
# 8. Check Memory
# ================================================
echo ""
echo -e "${BLUE}8️⃣  Checking Available Memory...${NC}"

if command -v free &> /dev/null; then
  MEMORY_AVAILABLE=$(free -m | awk 'NR==2 {print $7}')

  if [ "$MEMORY_AVAILABLE" -gt 500 ]; then
    echo -e "${GREEN}✅ Available memory: ${MEMORY_AVAILABLE}MB${NC}"
  else
    echo -e "${YELLOW}⚠️  Low memory: ${MEMORY_AVAILABLE}MB${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Cannot check memory (free command not found)${NC}"
fi

# ================================================
# Final Report
# ================================================
echo ""
echo "================================================"

if [ "$ALL_CHECKS_PASSED" = true ]; then
  echo -e "${GREEN}✅ All pre-deployment checks passed!${NC}"
  echo -e "${GREEN}🚀 Ready to deploy!${NC}"
  echo "================================================"
  echo ""
  echo "Next steps:"
  echo "1. Deploy with: docker-compose -f docker-compose.coolify.yml up -d"
  echo "2. Watch logs: docker logs -f transrentals-app"
  echo "3. Verify health: curl $HEALTH_ENDPOINT"
  exit 0
else
  echo -e "${RED}❌ Pre-deployment checks failed!${NC}"
  echo -e "${RED}Please fix the issues above before deploying${NC}"
  echo "================================================"
  exit 1
fi
