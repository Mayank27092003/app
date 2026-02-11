# Background Geolocation Quick Start

## 🚀 Quick Start (5 minutes)

### 1. Rebuild Your App

After installation, you need to rebuild the app:

**iOS:**
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

**Android:**
```bash
npx react-native run-android
```

### 2. Add to Your Component

In your `tripTracking.tsx` or any component where you need location tracking:

```typescript
import { useLocationStore } from '@app/store/locationStore';

function TripTrackingScreen() {
  const {
    currentLocation,
    isBackgroundTracking,
    startBackgroundTracking,
    stopBackgroundTracking,
    changePace,
  } = useLocationStore();

  // Get your user role and job data
  const userRole = 'driver'; // Your actual logic
  const jobData = { status: 'in_progress' }; // Your actual job data

  useEffect(() => {
    // Start tracking when driver starts a job
    if (userRole === 'driver' && jobData?.status === 'in_progress') {
      startBackgroundTracking();
      changePace(true); // Set to moving
    }

    // Cleanup
    return () => {
      stopBackgroundTracking();
    };
  }, [userRole, jobData?.status]);

  // Use currentLocation in your map or UI
  return (
    <View>
      {currentLocation && (
        <MapView
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
          />
        </MapView>
      )}
    </View>
  );
}
```

### 3. Test It

1. **Request Permissions:**
   - iOS: Grant "Always" location permission
   - Android: Grant "Allow all the time" permission

2. **Start Tracking:**
   - Start a job/trip in your app
   - Background tracking starts automatically

3. **Verify:**
   - Check console logs (filter by "BackgroundGeo" or "LocationStore")
   - Check your backend API to see location updates
   - Put app in background - tracking should continue

## 📱 Platform-Specific Setup

### iOS Requirements

1. ✅ Info.plist updated (already done)
2. ✅ Pods installed (already done)
3. ⚠️ User must grant "Always" permission

**To test on iOS:**
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### Android Requirements

1. ✅ Manifest permissions added (already done)
2. ✅ Build.gradle updated (already done)
3. ⚠️ User must grant "Allow all the time" permission

**To test on Android:**
```bash
npx react-native run-android
```

## 🔍 Common Integration Patterns

### Pattern 1: Trip/Job Tracking

```typescript
// Start when job starts
const handleStartJob = async () => {
  await startBackgroundTracking();
  await changePace(true); // Moving
};

// Stop when job ends
const handleEndJob = async () => {
  await changePace(false); // Stationary
  await stopBackgroundTracking();
};
```

### Pattern 2: Pause/Resume

```typescript
// Pause (e.g., lunch break)
const handlePause = async () => {
  await changePace(false); // Battery saver mode
};

// Resume
const handleResume = async () => {
  await changePace(true); // Active tracking
};
```

### Pattern 3: Different Job States

```typescript
useEffect(() => {
  switch (jobStatus) {
    case 'picked_up':
      startBackgroundTracking();
      changePace(false); // Loading
      break;
    case 'in_transit':
      changePace(true); // Moving
      break;
    case 'delivered':
      stopBackgroundTracking();
      break;
  }
}, [jobStatus]);
```

## 🐛 Quick Debugging

### Check if tracking is active:

```typescript
const { isBackgroundTracking, currentLocation } = useLocationStore();

console.log('Tracking:', isBackgroundTracking);
console.log('Location:', currentLocation);
```

### Enable debug mode:

In `background-geolocation-service.tsx`, set:
```typescript
debug: true,
logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
```

This will show notifications and play sounds for location events (dev only).

### Check permissions:

```typescript
import { backgroundGeolocationService } from '@app/service/background-geolocation-service';

const status = await backgroundGeolocationService.getPermissionStatus();
console.log('Permission status:', status);
```

## 📊 Monitoring

### View Location Updates

Location updates are automatically sent to your backend via:
```
POST /api/live-location
```

With data:
```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "accuracy": 5.0,
  "heading": 45.0,
  "speed": 15.5,
  "battery": 85.0,
  "provider": "gps"
}
```

### Check Stored Locations

```typescript
import { backgroundGeolocationService } from '@app/service/background-geolocation-service';

// Get count
const count = await backgroundGeolocationService.getCount();

// Get all locations
const locations = await backgroundGeolocationService.getLocations();

// Clear locations
await backgroundGeolocationService.destroyLocations();
```

## ⚙️ Configuration

Default configuration is in `locationStore.ts` > `startBackgroundTracking()`:

```typescript
{
  desiredAccuracy: HIGH,        // 10m accuracy
  distanceFilter: 10,           // Update every 10m
  stopTimeout: 5,               // Stationary after 5 min
  debug: __DEV__,               // Debug in development
  stopOnTerminate: false,       // Keep running when app closes
  startOnBoot: true,            // Start on device boot
  locationAuthorizationRequest: 'Always',
}
```

Adjust these values based on your needs:
- Lower `distanceFilter` = more frequent updates = more battery
- Higher `desiredAccuracy` = better accuracy = more battery
- Lower `stopTimeout` = faster stationary detection

## 🔋 Battery Optimization

The library automatically optimizes battery:
- **Moving**: Frequent updates, high accuracy
- **Stationary**: Rare updates, low power

Manual optimization:
```typescript
// Low battery mode
if (batteryLevel < 20) {
  await backgroundGeolocationService.configure({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_LOW,
    distanceFilter: 50,
  });
}
```

## 📚 Examples

See `app/examples/background-geolocation-usage.tsx` for complete examples:
- Basic trip tracking
- Advanced usage
- Job state handling
- Platform-specific handling

## 🆘 Troubleshooting

### "Location not updating in background"
- Check permission is "Always" (not "When In Use")
- Verify background modes in Info.plist (iOS)
- Check battery optimization settings (Android)

### "High battery drain"
- Reduce `desiredAccuracy`
- Increase `distanceFilter`
- Use `changePace(false)` when stationary

### "Locations not sent to server"
- Check network connectivity
- Verify API endpoint and authentication
- Locations are queued and retried automatically

### "Permission prompt not showing"
- Request permission explicitly:
```typescript
const { requestLocationPermission } = useLocationStore();
await requestLocationPermission();
```

## 📖 Full Documentation

- Integration Guide: `BACKGROUND_GEOLOCATION_INTEGRATION.md`
- Examples: `app/examples/background-geolocation-usage.tsx`
- Service Code: `app/service/background-geolocation-service.tsx`
- Store: `app/store/locationStore.ts`

## 🎓 Next Steps

1. ✅ Rebuild app with new library
2. ✅ Add to your trip tracking screen
3. ✅ Test in foreground and background
4. ✅ Monitor backend API for location updates
5. ✅ Adjust configuration for your use case
6. ✅ Test battery impact over time

## 💡 Pro Tips

1. **Always clean up**: Stop tracking when not needed
2. **Use pace changes**: Save battery with stationary mode
3. **Monitor battery**: Adjust settings based on battery level
4. **Test extensively**: Background tracking behaves differently than foreground
5. **Handle permissions properly**: Guide users to grant "Always" permission

## 📞 Support

For issues:
1. Check console logs (filter by "BackgroundGeo")
2. Enable debug mode
3. Review the official docs: https://transistorsoft.github.io/react-native-background-geolocation/

---

**Happy Tracking! 🚚📍**

