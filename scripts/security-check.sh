#!/bin/bash

# ================================================
# TransRentals Security Audit Script
# Runs comprehensive security checks
# ================================================

echo "🔒 Starting Security Audit..."
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
SECURITY_PASSED=true

# ================================================
# 1. NPM Audit
# ================================================
echo ""
echo "1️⃣  Running NPM Security Audit..."
if npm audit --audit-level=high; then
    echo -e "${GREEN}✅ NPM audit passed${NC}"
else
    echo -e "${YELLOW}⚠️  NPM audit found vulnerabilities${NC}"
    SECURITY_PASSED=false
fi

# ================================================
# 2. Check for exposed secrets
# ================================================
echo ""
echo "2️⃣  Checking for exposed secrets..."
SECRETS_FOUND=false

# Check for .env files in git
if git ls-files | grep -q "\.env$"; then
    echo -e "${RED}❌ .env file is tracked in git!${NC}"
    SECRETS_FOUND=true
fi

# Check for hardcoded secrets in code
if grep -r "password.*=.*['\"]" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "password:" | grep -v "// " | grep -v "/\*"; then
    echo -e "${YELLOW}⚠️  Possible hardcoded passwords found${NC}"
    SECRETS_FOUND=true
fi

# Check for API keys
if grep -r "api[_-]key.*=.*['\"]" src/ --include="*.ts" --include="*.tsx" | grep -v "// " | grep -v "/\*" | grep -v "process.env"; then
    echo -e "${YELLOW}⚠️  Possible hardcoded API keys found${NC}"
    SECRETS_FOUND=true
fi

if [ "$SECRETS_FOUND" = false ]; then
    echo -e "${GREEN}✅ No exposed secrets found${NC}"
else
    SECURITY_PASSED=false
fi

# ================================================
# 3. Check Dependencies
# ================================================
echo ""
echo "3️⃣  Checking for outdated dependencies..."
npm outdated || true
echo -e "${GREEN}✅ Dependency check completed${NC}"

# ================================================
# 4. Check Prisma Security
# ================================================
echo ""
echo "4️⃣  Checking Prisma Security..."

# Check for SQL injection vulnerable patterns
if grep -r "prisma\.\$executeRaw\|prisma\.\$queryRaw" src/ --include="*.ts" | grep -v "Prisma.sql"; then
    echo -e "${YELLOW}⚠️  Found raw SQL queries - ensure they use Prisma.sql template${NC}"
    SECURITY_PASSED=false
else
    echo -e "${GREEN}✅ No unsafe raw SQL queries found${NC}"
fi

# ================================================
# 5. Check for console.logs (production)
# ================================================
echo ""
echo "5️⃣  Checking for debug statements..."
if grep -r "console\.log\|debugger" src/app --include="*.ts" --include="*.tsx" | grep -v "// " | head -5; then
    echo -e "${YELLOW}⚠️  Found console.log statements (consider removing for production)${NC}"
else
    echo -e "${GREEN}✅ No debug statements found${NC}"
fi

# ================================================
# 6. Check Environment Variables
# ================================================
echo ""
echo "6️⃣  Checking environment variable usage..."
if grep -r "process\.env\." src/ --include="*.ts" --include="*.tsx" | grep -v "NEXT_PUBLIC_" | grep -v "NODE_ENV" | head -5; then
    echo -e "${GREEN}✅ Environment variables are being used${NC}"
else
    echo -e "${YELLOW}⚠️  No server-side environment variables found${NC}"
fi

# ================================================
# 7. Check for CORS Configuration
# ================================================
echo ""
echo "7️⃣  Checking CORS configuration..."
if grep -r "cors\|Access-Control-Allow-Origin" src/ --include="*.ts"; then
    echo -e "${GREEN}✅ CORS configuration found${NC}"
else
    echo -e "${YELLOW}⚠️  No CORS configuration detected${NC}"
fi

# ================================================
# Final Report
# ================================================
echo ""
echo "================================================"
if [ "$SECURITY_PASSED" = true ]; then
    echo -e "${GREEN}✅ Security audit passed!${NC}"
    echo "================================================"
    exit 0
else
    echo -e "${YELLOW}⚠️  Security audit completed with warnings${NC}"
    echo "Please review the warnings above"
    echo "================================================"
    exit 0  # Don't fail the build, just warn
fi
