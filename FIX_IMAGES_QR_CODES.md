# Fix QR Code and Fleet Image Display Issues

## Issues Identified

### 1. QR Code Not Showing
**Cause**: The `upiQrCode` field in database contains invalid data (like "sdasd") instead of proper URLs.

**How it works**:
- If `upiQrCode` is a valid URL → displays that image
- If `upiQrCode` is invalid AND `upiId` exists → auto-generates QR code using external API
- If neither exists → no QR code shown

### 2. Fleet Images Not Showing
**Cause**: Image files are stored in inconsistent locations and paths don't match between database and actual files.

**Found**:
- Files at: `public/uploads/fleet/` (no service slug or vendor ID)
- Files at: `public/uploads/bike-rental/fleet/` (service slug but no vendor ID)
- Files at: `public/uploads/bike-on-rent/fleet/` (different service slug)
- Expected: `public/uploads/{serviceSlug}/fleet/{vendorId}/`

## Solution

### Option 1: Automatic Fix (Recommended)

1. **Run the SQL script to clean up database:**
```bash
# From your MySQL client or command line:
mysql -u your_username -p transrentals < fix-images-and-qr.sql
```

OR

2. **Use the Admin API endpoint:**
```bash
# Check current issues
curl -X GET http://localhost:3000/api/admin/fix-image-paths \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Fix all issues
curl -X POST http://localhost:3000/api/admin/fix-image-paths \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"action":"fix-all"}'
```

### Option 2: Manual Database Fix

Run these SQL queries in your database:

```sql
-- Fix 1: Clean invalid QR code URLs
UPDATE bank_details
SET upiQrCode = NULL
WHERE upiQrCode IS NOT NULL
  AND upiQrCode != ''
  AND upiQrCode NOT LIKE 'http%'
  AND upiQrCode NOT LIKE '/uploads/%';

-- Fix 2: Ensure image paths start with /
UPDATE vehicle_models
SET sideImage = CONCAT('/', sideImage)
WHERE sideImage IS NOT NULL
  AND sideImage != ''
  AND sideImage NOT LIKE 'http%'
  AND sideImage NOT LIKE '/%';

-- Fix 3: Clean null string values in fleet images
UPDATE vendor_fleets
SET images = NULL
WHERE images = 'null' OR images = '[]' OR images = '';
```

### Option 3: Fix File Locations

If images still don't show after database fixes, you may need to move files:

```bash
# Check where files currently are
find public/uploads -type f -name "*.jpg" -o -name "*.jpeg" -o -name "*.png"

# Files should be accessible at paths matching database records
# For example, if database has: /uploads/bike-rental/fleet/VEN_123/image.jpg
# File must be at: public/uploads/bike-rental/fleet/VEN_123/image.jpg
```

## Verification Steps

### 1. Check QR Codes

1. Go to Payment Confirmation page
2. Verify QR code displays for UPI payments
3. If not showing:
   - Check if `upiId` is set in bank_details
   - Check browser console for errors

### 2. Check Fleet Images

1. Go to `/bike-on-rent/ahmedabad/bikes?city=ahmedabad&pickupDate=2026-01-31`
2. Verify bike images are displaying
3. If not showing:
   - Check browser console for 404 errors
   - Note which image URLs are failing
   - Verify those files exist in `public/` directory

### 3. Test Image Access Directly

Open browser and try accessing:
```
http://localhost:3000/uploads/fleet/download-8--1769072671652.jpeg
```

Should display the image if file exists at `public/uploads/fleet/download-8--1769072671652.jpeg`.

## Common Issues

### Issue: "404 Not Found" for images

**Solution**: Ensure files are in `public/` directory and paths in database match.

### Issue: QR code still not showing

**Causes**:
1. `upiId` is empty → Add UPI ID in bank details
2. External QR API is down → Upload a QR code image instead
3. Browser blocking external images → Check browser console

### Issue: Next.js Image component error

**Cause**: Using external URLs not in `remotePatterns` config.

**Solution**: Either:
- Store images locally in `public/uploads/`
- Add domain to `next.config.js` `remotePatterns`

## How to Add QR Code Properly

1. **Method 1: Upload QR Code Image**
   - Upload QR code image to `public/uploads/qr-codes/`
   - Set `upiQrCode` = `/uploads/qr-codes/your-qr.jpg`

2. **Method 2: Use External URL**
   - Upload to image hosting service (Imgur, Google Drive, etc.)
   - Get public URL
   - Set `upiQrCode` = full URL

3. **Method 3: Let It Auto-Generate**
   - Just set `upiId` (like `yourname@upi`)
   - Leave `upiQrCode` empty or null
   - System will auto-generate QR code using external API

## Prevention

To avoid these issues in future:

1. **For QR Codes**: Always use full URLs or local paths starting with `/`

2. **For Fleet Images**: Use the upload API which ensures proper paths:
```typescript
POST /api/vendor/fleet/upload
// Returns: ["/uploads/{serviceSlug}/fleet/{vendorId}/{filename}"]
```

3. **Validate Paths**: Before saving, ensure:
   - External URLs start with `http://` or `https://`
   - Local paths start with `/`
   - Files exist at the specified location

## Files Created

- `fix-images-and-qr.sql` - SQL script to fix database
- `src/app/api/admin/fix-image-paths/route.ts` - Admin API endpoint to fix paths programmatically

## Need Help?

If issues persist:
1. Check browser console for specific errors
2. Verify file permissions on `public/uploads/` directory
3. Ensure Next.js dev server has been restarted
4. Check Next.js logs for image optimization errors
