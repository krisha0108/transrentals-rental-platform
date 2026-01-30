# Image Upload Structure - TransRentals

## Overview
This document explains how file uploads work across the platform (web + mobile app) and ensures consistency between local development and production.

## Upload Endpoints

### 1. Admin General Upload (`/api/admin/upload`)
**Used for:** General admin uploads (service images, misc files)

**Request:**
```javascript
FormData:
  - file: File
  - folder: string (optional)
```

**Path Logic:**
- **No folder or folder="uploads"**: `public/uploads/{filename}`
- **With folder**: `public/uploads/{folder}/{filename}`

**URL Output:**
- **No folder**: `/uploads/file.png` ✅
- **With folder**: `/uploads/{folder}/file.png` ✅
- **OLD BUG**: `/uploads/uploads/file.png` ❌ (FIXED)

**Example:**
```bash
# No folder specified
POST /api/admin/upload
folder: "" or "uploads"
→ Saves to: public/uploads/car-photo-123.png
→ Returns: /uploads/car-photo-123.png

# With folder "services"
POST /api/admin/upload
folder: "services"
→ Saves to: public/uploads/services/luxury-car-456.png
→ Returns: /uploads/services/luxury-car-456.png
```

---

### 2. Fleet Upload (`/api/vendor/fleet/upload`)
**Used for:** Vehicle images (vendor fleet management)

**Request:**
```javascript
FormData:
  - files: File[]
  - serviceSlug: string (e.g., "car-rental", "bike", "bus")
```

**Path Logic:**
- **Always vendor-isolated**: `public/uploads/{serviceSlug}/fleet/{vendorId}/{filename}`

**URL Output:**
- `/uploads/{serviceSlug}/fleet/{vendorId}/file.png`

**Security Features:**
- ✅ Vendor isolation (can't access other vendor's images)
- ✅ Service-wise organization
- ✅ Image validation (magic number check)
- ✅ Malware scanning (ClamAV if available)
- ✅ Max 10 files per request
- ✅ Max 5MB per file

**Example:**
```bash
POST /api/vendor/fleet/upload
serviceSlug: "car-rental"
vendorId: "vendor123"
→ Saves to: public/uploads/car-rental/fleet/vendor123/toyota-innova-789.png
→ Returns: /uploads/car-rental/fleet/vendor123/toyota-innova-789.png
```

---

### 3. Vendor Logo Upload (`/api/vendor/profile/upload-logo`)
**Used for:** Vendor business logo/profile image

**Request:**
```javascript
FormData:
  - logo: File
```

**Path Logic:**
- **Vendor-specific**: `public/uploads/vendors/{vendorId}/logos/{filename}`

**URL Output:**
- `/uploads/vendors/{vendorId}/logos/file.png`

**Security Features:**
- ✅ Vendor isolation
- ✅ Only image types (JPEG, PNG, WebP)
- ✅ Magic number validation
- ✅ Max 5MB
- ✅ Auto-updates vendor.logo in database

**Example:**
```bash
POST /api/vendor/profile/upload-logo
vendorId: "vendor123"
→ Saves to: public/uploads/vendors/vendor123/logos/logo-456.png
→ Returns: /uploads/vendors/vendor123/logos/logo-456.png
→ Updates: vendors.logo = "/uploads/vendors/vendor123/logos/logo-456.png"
```

---

### 4. Vendor Documents (`/api/vendor/documents`)
**Used for:** KYC documents (GST, PAN, Aadhaar, etc.)

**Request:**
```javascript
FormData:
  - file: File
  - documentType: string
  - documentNumber: string (optional)
```

**Path Logic:**
- **Private storage** (outside public directory for security)
- `private-uploads/vendor-documents/{vendorId}/{documentType}/{filename}`

**URL Output:**
- **NOT publicly accessible** (requires auth to view)
- Served via API endpoint with access control

**Security Features:**
- ✅ Private storage (not in public/)
- ✅ Vendor isolation
- ✅ Document type validation
- ✅ Magic number validation
- ✅ Malware scanning
- ✅ Max 5MB
- ✅ One document per type (can't upload duplicate GST)

**Document Types:**
- GST_CERTIFICATE
- PAN_CARD
- BUSINESS_REGISTRATION
- ADDRESS_PROOF
- CANCELLED_CHEQUE
- OWNER_AADHAAR
- OWNER_PAN
- OTHER

---

## File Validation

### Image Validation (validateImage)
```javascript
- Allowed types: JPEG, PNG, GIF, WebP, SVG
- Max size: 5MB
- Magic number verification (prevents file extension spoofing)
- Filename sanitization (removes special characters)
```

### Document Validation (validateVendorDocument)
```javascript
- Allowed types: PDF, JPEG, PNG
- Max size: 5MB
- Magic number verification
- Filename sanitization
```

### Malware Scanning (ClamAV)
```javascript
- Optional (if ClamAV installed)
- Scans all uploaded files
- Blocks infected files
- Logs security events
```

---

## Directory Structure

```
public/
└── uploads/
    ├── {filename}                                    # General admin uploads (no folder)
    ├── {folder}/
    │   └── {filename}                                # Admin uploads with folder
    ├── car-rental/
    │   └── fleet/
    │       └── {vendorId}/
    │           └── {filename}                        # Car rental fleet images
    ├── bike/
    │   └── fleet/
    │       └── {vendorId}/
    │           └── {filename}                        # Bike fleet images
    ├── bus/
    │   └── fleet/
    │       └── {vendorId}/
    │           └── {filename}                        # Bus fleet images
    └── vendors/
        └── {vendorId}/
            └── logos/
                └── {filename}                        # Vendor logos

private-uploads/                                      # NOT in public/
└── vendor-documents/
    └── {vendorId}/
        └── {documentType}/
            └── {filename}                            # Secure documents
```

---

## URL Access Patterns

### Public URLs (Direct Access)
```javascript
// Admin uploads
/uploads/file.png
/uploads/services/luxury-car.png

// Fleet images
/uploads/car-rental/fleet/vendor123/toyota.png
/uploads/bike/fleet/vendor456/honda.png

// Vendor logos
/uploads/vendors/vendor123/logos/logo.png
```

### Private URLs (Auth Required)
```javascript
// Documents - served via API
GET /api/vendor/documents/{docId}/download
→ Checks vendor ownership
→ Serves file from private storage
```

---

## Best Practices

### ✅ DO:
- Use vendor-isolated paths for vendor-specific uploads
- Validate file types using magic numbers (not just extensions)
- Limit file sizes (5MB default)
- Sanitize filenames
- Use timestamps in filenames to avoid conflicts
- Scan for malware when possible

### ❌ DON'T:
- Set `folder: "uploads"` (causes double /uploads/uploads/)
- Trust file extensions (use magic number validation)
- Allow unlimited file sizes
- Store sensitive documents in public/
- Use user-provided filenames directly

---

## Mobile App Integration

### React Native FormData
```javascript
const formData = new FormData();
formData.append('file', {
  uri: fileUri,
  type: 'image/jpeg',
  name: 'photo.jpg',
});

// ❌ DON'T manually set Content-Type
// headers: { 'Content-Type': 'multipart/form-data' }

// ✅ DO let axios handle it automatically
await apiPost('/vendor/fleet/upload', formData);
```

### Client Configuration
```javascript
// API interceptor automatically handles FormData
if (config.data instanceof FormData) {
  delete config.headers['Content-Type'];  // Let axios add boundary
}
```

---

## Testing

### Local Testing
```bash
# Make sure Next.js server is running
npm run dev

# Upload test
curl -X POST http://localhost:3000/api/admin/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "folder=test"
```

### Production Testing
```bash
# Same URLs work in production
curl -X POST https://transrentals.in/api/admin/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"
```

---

## Troubleshooting

### Issue: Images uploaded but not displaying
**Cause:** Double /uploads/uploads/ path
**Fix:** Applied in commit d5efaf7 - no longer an issue

### Issue: Network Error on mobile
**Cause:** Manual Content-Type header interferes with FormData
**Fix:** Applied in commit 4d2e889 - interceptor deletes Content-Type

### Issue: File upload works locally but not in production
**Cause:** File size or permission issues
**Check:**
- File size < 5MB
- public/uploads/ directory writable
- Correct auth token

---

## Summary

| Feature | Path | Public/Private | Vendor Isolated |
|---------|------|----------------|-----------------|
| Admin Upload | `/uploads/` or `/uploads/{folder}/` | Public | ❌ |
| Fleet Upload | `/uploads/{service}/fleet/{vendorId}/` | Public | ✅ |
| Logo Upload | `/uploads/vendors/{vendorId}/logos/` | Public | ✅ |
| Documents | `private-uploads/vendor-documents/{vendorId}/` | Private | ✅ |

**All upload paths are now consistent across local and production environments!** 🎉
