#!/bin/bash
#
# Security Audit Script for TransRentals
# Runs npm audit and checks for known malicious packages
#

set -e

echo "🔒 Running Security Audit for TransRentals..."
echo ""

# 1. Check for known malicious package versions
echo "[1/4] Checking for known malicious packages..."
if grep -q '"bcrypt".*"6.0.0"' package.json 2>/dev/null; then
  echo "⚠️  WARNING: Suspicious bcrypt version detected"
fi

# 2. Run npm audit
echo ""
echo "[2/4] Running npm audit..."
npm audit --audit-level=moderate || {
  echo "❌ Security vulnerabilities found!"
  echo "Run: npm audit fix"
  exit 1
}

# 3. Check for suspicious postinstall scripts
echo ""
echo "[3/4] Checking for suspicious lifecycle scripts..."
npm ls --depth=0 --json | grep -i "postinstall\|preinstall" || echo "✅ No suspicious install scripts"

# 4. Check package-lock.json exists
echo ""
echo "[4/4] Verifying package-lock.json..."
if [ ! -f "package-lock.json" ]; then
  echo "❌ package-lock.json missing! Run: npm install"
  exit 1
fi

echo ""
echo "✅ Security audit passed!"
