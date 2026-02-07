# Smart App Install Banner - Complete Guide

## Overview
Smart App Install Banner automatically detects user's platform (Android/iOS) and prompts them to open the app or install from the respective store.

## Features

### ✅ Implemented Features
1. **Platform Detection** - Automatically detects Android, iOS, or Desktop
2. **App Detection** - Checks if app is already installed
3. **Deep Linking** - Opens app directly if installed
4. **Store Redirect** - Redirects to Play Store (Android) or App Store (iOS) if not installed
5. **Smart Timing** - Shows popup after 2.5 seconds
6. **User Control** - "Continue in Browser" option
7. **Persistent Dismissal** - Remembers if user dismissed (24 hours)
8. **Beautiful UI** - Professional design with animations
9. **Mobile Only** - Only shows on mobile devices (not desktop)

## Configuration

### 1. Update App Store Links

Edit `src/config/app-links.ts`:

```typescript
export const APP_LINKS = {
  android: {
    // Update with your Play Store URL
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.customer',

    // Update with your package ID
    packageId: 'com.transrentals.customer',
  },

  ios: {
    // TODO: Update with actual App Store URL after iOS app is published
    appStoreUrl: 'https://apps.apple.com/app/transrentals/id123456789',

    // Update with actual App Store ID
    appId: '123456789',
  },
};
```

### 2. Configure Deep Links

#### For Android:
In your Android app's `AndroidManifest.xml`, add:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="transrentals" android:host="open" />
</intent-filter>
```

#### For iOS:
In your iOS app's `Info.plist`, add:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>transrentals</string>
        </array>
    </dict>
</array>
```

### 3. Customize Banner Content

Edit `src/config/app-links.ts`:

```typescript
export const APP_METADATA = {
  name: 'TransRentals',
  description: 'Get the best experience with our mobile app',
  rating: '4.8',
  downloads: '10K+',
  price: 'FREE',
};

export const APP_FEATURES = [
  { icon: '✓', text: 'Faster bookings & instant confirmations' },
  { icon: '✓', text: 'Real-time tracking & notifications' },
  // Add more features here
];
```

## How It Works

### User Flow:

```
1. User opens website on mobile
   ↓
2. After 2.5 seconds, banner appears
   ↓
3. User has two choices:
   ├─ "Continue in Browser" → Banner closes, remembers for 24hrs
   └─ "Open in App" →
      ├─ App Installed → Opens app directly
      └─ App Not Installed → Redirects to store
```

### Technical Flow:

#### Android:
```
1. Try Intent URL (most reliable)
   ↓
2. If fails, try Deep Link
   ↓
3. If app not detected, redirect to Play Store
```

#### iOS:
```
1. Try Deep Link
   ↓
2. Monitor page visibility
   ↓
3. If app opens, page becomes hidden
   ↓
4. If no response after 2s, redirect to App Store
```

## Testing Guide

### Test on Android:

1. **Without App Installed:**
   - Open website in Chrome/Firefox
   - After 2.5s, banner should appear
   - Click "Open in App"
   - Should redirect to Play Store

2. **With App Installed:**
   - Install the app first
   - Open website in Chrome/Firefox
   - Click "Open in App"
   - App should open directly

### Test on iOS:

1. **Without App Installed:**
   - Open website in Safari (must be Safari!)
   - After 2.5s, banner should appear
   - Click "Open in App"
   - Should redirect to App Store

2. **With App Installed:**
   - Install the app first
   - Open website in Safari
   - Click "Open in App"
   - App should open directly

### Test Dismissal:

1. Click "Continue in Browser"
2. Banner should close
3. Refresh page - banner should NOT appear
4. Clear localStorage to reset

### Test on Desktop:

- Banner should NOT appear on desktop browsers

## Customization Options

### Change Popup Timing

In `AppInstallBanner.tsx`:

```typescript
const timer = setTimeout(() => {
  setShowBanner(true);
}, 2500); // Change this value (in milliseconds)
```

### Change Dismissal Duration

In `AppInstallBanner.tsx`:

```typescript
const oneDayInMs = 24 * 60 * 60 * 1000; // Change to your preferred duration
```

### Disable for Specific Pages

You can conditionally render based on route:

```typescript
// In layout.tsx or specific pages
const pathname = usePathname();
const shouldShowBanner = !pathname.includes('/admin'); // Don't show on admin pages

{shouldShowBanner && <AppInstallBanner />}
```

## Troubleshooting

### Issue: Banner not appearing on mobile

**Solution:**
1. Check browser console for errors
2. Verify you're on a mobile device (not desktop)
3. Clear localStorage: `localStorage.removeItem('app-banner-dismissed')`
4. Check if dismissed recently (24hr cooldown)

### Issue: Deep link not working

**Solution:**
1. Verify deep link scheme in app matches config
2. Test deep link manually: Open `transrentals://open` in browser
3. Check app's AndroidManifest.xml or Info.plist

### Issue: Always redirecting to store even when app is installed

**Solution:**
1. Android: Use Intent URL instead of deep link
2. iOS: Ensure app has proper URL scheme configured
3. Test with actual device (not emulator)

### Issue: Banner showing on desktop

**Solution:**
1. Check platform detection logic
2. Verify user agent detection is working
3. Force mobile user agent in DevTools to test

## Advanced Configuration

### Custom Deep Link Routes

You can pass specific routes to the app:

```typescript
// In app-links.ts
const deepLink = `transrentals://booking/${bookingId}`;
```

Then handle in your mobile app to open specific screens.

### Analytics Tracking

Add event tracking when user interacts:

```typescript
const handleOpenInApp = async () => {
  // Track analytics
  gtag('event', 'app_banner_click', {
    platform: platform,
    action: 'open_in_app'
  });

  // Rest of the code...
};
```

### A/B Testing

Test different banner designs by creating variants.

## Files Structure

```
src/
├── components/
│   ├── AppInstallBanner.tsx          # Main banner component
│   └── IOSInstallPrompt.tsx          # iOS PWA prompt (separate)
├── config/
│   └── app-links.ts                  # Configuration file
└── app/
    └── layout.tsx                    # Banner integration
```

## Production Checklist

Before deploying to production:

- [ ] Update Play Store URL with actual link
- [ ] Update App Store URL with actual link
- [ ] Test deep links on real Android device
- [ ] Test deep links on real iOS device
- [ ] Configure app's deep link handling
- [ ] Test "Continue in Browser" flow
- [ ] Test dismissal persistence
- [ ] Verify banner doesn't show on desktop
- [ ] Add analytics tracking
- [ ] Test on various screen sizes

## Support

For issues or questions:
1. Check this documentation first
2. Test on real devices (not just emulators)
3. Verify app store links are correct
4. Check deep link configuration in mobile apps

## Future Enhancements

Possible improvements:
- [ ] Branch.io integration for better deep linking
- [ ] Dynamic app store badge images
- [ ] Deferred deep linking (remember where user was)
- [ ] QR code generation for easy app download
- [ ] Social proof (recent downloads, reviews)
- [ ] Localization support
