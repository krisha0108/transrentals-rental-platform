#!/bin/bash

# Script to remove duplicate Header and Footer imports from service pages
# Root layout already provides these globally

echo "🔧 Removing duplicate Header/Footer from service pages..."

# Find all service page files
find src/app/\(services\) -name "page.tsx" -type f | while read -r file; do
  echo "Processing: $file"

  # Remove Header import
  sed -i '' '/^import { Header } from/d' "$file"

  # Remove Footer import (both single and combined imports)
  sed -i '' '/^import { Footer } from/d' "$file"
  sed -i '' '/^import.*Footer.*from.*@\/components\/layout\/Footer/d' "$file"

  # Remove standalone <Header /> JSX
  sed -i '' '/<Header \/>/d' "$file"

  # Remove standalone <Footer /> JSX
  sed -i '' '/<Footer \/>/d' "$file"
done

echo "✅ Done! Removed duplicate layouts from all service pages"
