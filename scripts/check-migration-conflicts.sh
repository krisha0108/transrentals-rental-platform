#!/bin/bash

# ================================================
# Migration Conflict Checker
# Detects migration conflicts before deployment
# ================================================

set -e

echo "🔍 Checking for Migration Conflicts"
echo "================================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONFLICTS_FOUND=false

# Check if migrations directory exists
if [ ! -d "prisma/migrations" ]; then
  echo -e "${RED}❌ No migrations directory found${NC}"
  exit 1
fi

echo "Checking migration files..."

# Check for multiple baseline migrations
BASELINE_COUNT=$(find prisma/migrations -name "*baseline*" -type d | wc -l)
if [ "$BASELINE_COUNT" -gt 1 ]; then
  echo -e "${RED}❌ Multiple baseline migrations found!${NC}"
  echo "Found: $BASELINE_COUNT baseline migrations"
  find prisma/migrations -name "*baseline*" -type d
  CONFLICTS_FOUND=true
fi

# Check for duplicate migration timestamps
echo "Checking for duplicate timestamps..."
DUPLICATE_TIMESTAMPS=$(ls -1 prisma/migrations | cut -d'_' -f1 | sort | uniq -d)
if [ ! -z "$DUPLICATE_TIMESTAMPS" ]; then
  echo -e "${YELLOW}⚠️  Duplicate migration timestamps found:${NC}"
  echo "$DUPLICATE_TIMESTAMPS"
fi

# Check migration_lock.toml
if [ ! -f "prisma/migrations/migration_lock.toml" ]; then
  echo -e "${RED}❌ migration_lock.toml is missing!${NC}"
  CONFLICTS_FOUND=true
else
  echo -e "${GREEN}✅ migration_lock.toml exists${NC}"
fi

# Check for uncommitted migrations
if [ -d ".git" ]; then
  UNCOMMITTED=$(git ls-files --others --exclude-standard prisma/migrations)
  if [ ! -z "$UNCOMMITTED" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted migration files:${NC}"
    echo "$UNCOMMITTED"
  fi
fi

# Validate schema matches migrations
echo ""
echo "Validating Prisma schema..."
if npx prisma validate; then
  echo -e "${GREEN}✅ Schema is valid${NC}"
else
  echo -e "${RED}❌ Schema validation failed${NC}"
  CONFLICTS_FOUND=true
fi

echo ""
echo "================================================"
if [ "$CONFLICTS_FOUND" = true ]; then
  echo -e "${RED}❌ Migration conflicts detected!${NC}"
  echo "Fix conflicts before deploying"
  exit 1
else
  echo -e "${GREEN}✅ No migration conflicts found${NC}"
  exit 0
fi
