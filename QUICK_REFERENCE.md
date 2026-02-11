# Background Geolocation - Quick Reference Card

## 🚀 Quick Commands

### Build Commands
```bash
# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

### Clean Build (If Issues)
```bash
# Android
cd android && rm -rf .gradle build app/build && cd ..
npx react-native run-android

# iOS
cd ios && pod deintegrate && pod install && cd ..
npx react-native run-ios
```

## 📝 Quick Usage

### In Your Component
```typescript
import { useLocationStore } from '@app/store/locationStore';

const {
  startBackgroundTracking,
  stopBackgroundTracking,
  changePace,
  currentLocation,
  isBackgroundTracking
} = useLocationStore();

// Start tracking
await startBackgroundTracking();
await changePace(true); // Moving

// Stop tracking
await changePace(false); // Stationary
await stopBackgroundTracking();
```

### Already Integrated in tripTracking.tsx
- Auto-starts when driver has active job
- Auto-stops when job ends
- Auto-adjusts pace based on job status
- **No manual code needed!**

## 🔍 Quick Debug

### Check if Running
```typescript
console.log('Is tracking:', isBackgroundTracking);
console.log('Location:', currentLocation);
```

### Enable Debug Mode
In `app/store/locationStore.ts`:
```typescript
debug: true,  // Shows notifications
logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE
```

### Console Logs
```bash
# iOS
npx react-native log-ios | grep "BackgroundGeo"

# Android
npx react-native log-android | grep "TSLocation"
```

## ⚙️ Quick Configuration

Edit `app/store/locationStore.ts` → `startBackgroundTracking()`:

```typescript
{
  desiredAccuracy: HIGH,        // Accuracy level
  distanceFilter: 10,           // Update every X meters
  stopTimeout: 5,               // Stationary after X min
  stopOnTerminate: false,       // Keep running
  startOnBoot: true,            // Auto-start
}
```

### Common Adjustments

**Better Battery:**
```typescript
desiredAccuracy: MEDIUM,
distanceFilter: 20,
```

**Better Accuracy:**
```typescript
desiredAccuracy: HIGH,
distanceFilter: 5,
```

## 🔋 Battery Guide

| Mode | Battery/Hour | When |
|------|--------------|------|
| High Accuracy + 5m | ~10-12% | Critical tracking |
| High Accuracy + 10m | ~5-8% | ✅ **Recommended** |
| Medium + 20m | ~3-5% | Battery saver |
| Stationary | ~1-2% | Not moving |

## 🐛 Quick Fixes

### Issue: Not tracking in background
```bash
# iOS: Check permission is "Always"
# Android: Check permission is "All the time"
```

### Issue: Build fails
```bash
cd android
rm -rf .gradle build app/build
cd ..
npx react-native run-android
```

### Issue: High battery drain
```typescript
// In locationStore.ts
desiredAccuracy: MEDIUM,
distanceFilter: 20,
```

## 📱 Platform Permissions

### iOS Info.plist (Already Added)
```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need background location for delivery tracking</string>

<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

### Android Manifest (Already Added)
```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

## 📊 Quick Status Check

### In Console:
```
✅ Good:
🌍 TripTracking: Starting background tracking
✅ BackgroundGeo: Tracking started
📍 BackgroundGeo: Location received
✅ BackgroundGeo: Location sent to server

❌ Bad:
❌ Failed to start background tracking
❌ Permission denied
⚠️ No location available
```

### In Backend:
Check for requests to: `POST /api/live-location`

## 🎯 Quick Test

1. **Start app** → Navigate to trip tracking
2. **Grant permission** → "Always" (iOS) or "All the time" (Android)
3. **Start job** → Tracking starts automatically
4. **Background app** → Tracking continues
5. **Check backend** → Should receive location updates

## 📚 Full Documentation

- `BACKGROUND_GEOLOCATION_QUICKSTART.md` - Getting started
- `BACKGROUND_GEOLOCATION_INTEGRATION.md` - Complete guide
- `FIXES_APPLIED_SUMMARY.md` - What was changed
- `app/examples/background-geolocation-usage.tsx` - Code examples

## 🆘 Need Help?

1. Check console logs
2. Enable debug mode
3. Review documentation files
4. Check: https://transistorsoft.github.io/react-native-background-geolocation/

## 💡 Pro Tips

1. **Always test on real devices** - Simulators don't support background modes properly
2. **Monitor battery** - Adjust configuration based on real-world usage
3. **Use stationary mode** - Saves battery when not moving
4. **Clean up** - Always stop tracking when not needed
5. **Production license** - Required before deploying to App Store/Play Store

## ✅ Current Status

- ✅ Library installed
- ✅ Service created
- ✅ Store updated  
- ✅ Component integrated
- ✅ iOS configured
- ✅ Android configured
- ✅ Build running (check terminal 3)

**Ready for testing after build completes!** 🎉

---

*Last Updated: December 2, 2025*

