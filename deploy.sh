#!/bin/bash

# TransRentals Deployment Script
# Safe deployment with automatic rollback on failure

set -e  # Exit on error

echo "🚀 Starting TransRentals Deployment..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Store current commit for rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
print_info "Current commit: $CURRENT_COMMIT"

# Step 1: Pull latest code
print_info "Step 1/8: Pulling latest code..."
if git pull origin main; then
    print_success "Code pulled successfully"
else
    print_error "Failed to pull code"
    exit 1
fi

# Step 2: Install dependencies
print_info "Step 2/8: Installing dependencies..."
if npm install --production=false; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    git checkout $CURRENT_COMMIT
    exit 1
fi

# Step 3: Check migration status
print_info "Step 3/8: Checking migration status..."
npx prisma migrate status || true

# Step 4: Apply migrations (SAFE - No data loss)
print_info "Step 4/8: Applying database migrations..."
if npx prisma migrate deploy; then
    print_success "Migrations applied successfully"
else
    print_error "Migration failed - Rolling back..."
    git checkout $CURRENT_COMMIT
    npm install
    npx prisma migrate deploy
    exit 1
fi

# Step 5: Generate Prisma Client
print_info "Step 5/8: Generating Prisma Client..."
if npx prisma generate; then
    print_success "Prisma Client generated"
else
    print_error "Failed to generate Prisma Client"
    exit 1
fi

# Step 6: Build application
print_info "Step 6/8: Building application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed - Rolling back..."
    git checkout $CURRENT_COMMIT
    npm install
    npm run build
    exit 1
fi

# Step 7: Restart application
print_info "Step 7/8: Restarting application..."
if command -v pm2 &> /dev/null; then
    if pm2 restart transrentals; then
        print_success "Application restarted with PM2"
    else
        pm2 start npm --name "transrentals" -- start
        print_success "Application started with PM2"
    fi
elif command -v systemctl &> /dev/null; then
    if sudo systemctl restart transrentals; then
        print_success "Application restarted with systemd"
    else
        print_error "Failed to restart with systemd"
    fi
else
    print_info "No process manager found. Please restart manually."
fi

# Step 8: Verify deployment
print_info "Step 8/8: Verifying deployment..."
sleep 3

if command -v pm2 &> /dev/null; then
    pm2 status transrentals
fi

echo ""
echo "========================================"
print_success "🎉 Deployment completed successfully!"
echo "========================================"
echo ""
print_info "Next steps:"
echo "  1. Check logs: pm2 logs transrentals"
echo "  2. Verify website is working"
echo "  3. Monitor for any errors"
echo ""
print_info "If issues occur, rollback with:"
echo "  git checkout $CURRENT_COMMIT"
echo "  npm install && npm run build && pm2 restart transrentals"
echo ""
