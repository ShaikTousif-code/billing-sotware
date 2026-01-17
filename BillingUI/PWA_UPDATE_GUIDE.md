# PWA Update Handling Guide

## Overview

The application now includes automatic update detection and notification for mobile PWA users. When a new version is deployed, users will be notified and can update immediately.

## How It Works

### 1. Service Worker Versioning

- Each build generates a unique cache version with timestamp
- Old caches are automatically cleaned up
- New service workers activate immediately when available

### 2. Update Detection

- Service worker checks for updates every hour
- When a new version is detected, users see an update notification
- Users can choose to update immediately or dismiss the notification

### 3. Update Notification

- Blue notification banner appears at bottom of screen
- Shows "New update available" message
- "Update" button refreshes the app with new version
- "X" button dismisses the notification (will show again on next update check)

## For Developers

### Building with Updates

The build process automatically:
1. Updates service worker version with timestamp
2. Clears old caches
3. Activates new service worker immediately

```bash
npm run build
```

### Manual Cache Clear (For Testing)

Users can manually clear cache:
1. Open browser DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check "Cache storage" and "Service Workers"
5. Click "Clear site data"

### Testing Updates

1. Build and deploy version 1
2. Install PWA on mobile device
3. Make changes and build version 2
4. Deploy version 2
5. Open app on mobile - should see update notification
6. Click "Update" to refresh with new version

## User Experience

### Update Flow

1. **User opens app** → Service worker checks for updates
2. **Update found** → Blue notification appears
3. **User clicks "Update"** → App refreshes with new version
4. **User clicks "X"** → Notification dismissed (will show again later)

### Update Notification

- **Position**: Bottom of screen (mobile-friendly)
- **Color**: Blue (#3b82f6)
- **Animation**: Slides up from bottom
- **Actions**: Update button (white) and Dismiss button (X icon)

## Troubleshooting

### Updates Not Showing

1. **Check service worker registration:**
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered and active

2. **Check cache version:**
   - Open DevTools → Application → Cache Storage
   - Verify new cache version exists

3. **Force update check:**
   - Close and reopen the app
   - Service worker checks for updates on app load

### Stuck on Old Version

1. **Clear cache manually:**
   - Settings → Apps → Billing Software → Clear Storage
   - Or use browser DevTools

2. **Uninstall and reinstall:**
   - Remove PWA from home screen
   - Visit website again
   - Reinstall PWA

### Update Notification Not Appearing

- Check browser console for errors
- Verify `UpdateNotification` component is in `App.tsx`
- Check service worker registration in `main.tsx`

## Technical Details

### Files Modified

1. **`public/sw.js`**: Enhanced service worker with update handling
2. **`src/hooks/useServiceWorker.ts`**: Hook for update detection
3. **`src/components/UpdateNotification.tsx`**: Update notification UI
4. **`src/main.tsx`**: Enhanced service worker registration
5. **`src/App.tsx`**: Added UpdateNotification component
6. **`scripts/update-sw-version.js`**: Build script for version updates

### Cache Strategy

- **HTML Pages**: Network first (always get latest)
- **Static Assets**: Cache first with network update
- **API Requests**: Always network (bypassed)

### Version Format

```
v{package.version}-{timestamp}
Example: v1.0.0-1705564800000
```

## Best Practices

1. **Deploy regularly**: Users get updates automatically
2. **Test updates**: Always test update flow before deploying
3. **Version bumps**: Update `package.json` version for major releases
4. **Clear old caches**: Service worker automatically handles this

## Support

If users report update issues:
1. Ask them to close and reopen the app
2. If still stuck, ask them to clear cache
3. As last resort, uninstall and reinstall PWA

