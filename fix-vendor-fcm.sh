#!/bin/bash
# Quick script to add FCM imports to all vendor quote APIs

files=(
  "src/app/api/vendor/bus-quotes/route.ts"
  "src/app/api/vendor/equipment-quotes/route.ts"
  "src/app/api/vendor/luxury-quotes/route.ts"
  "src/app/api/vendor/packers-quotes/route.ts"
  "src/app/api/vendor/self-drive-quotes/route.ts"
  "src/app/api/vendor/truck-quotes/route.ts"
)

for file in "${files[@]}"; do
  # Check if sendFCMNotification is already imported
  if ! grep -q "sendFCMNotification" "$file"; then
    # Add import after prepareNotificationData import
    sed -i '/prepareNotificationData/a import { sendFCMNotification } from '\''@/lib/utils/fcm-helper'\'';' "$file"
    echo "✅ Added FCM import to $file"
  else
    echo "⏭️  FCM already imported in $file"
  fi
done

echo "✅ Done! Now manually add sendFCMNotification() calls after prisma.notifications.create()"
