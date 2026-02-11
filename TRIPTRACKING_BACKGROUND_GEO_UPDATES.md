# Trip Tracking Background Geolocation Updates

## Summary of Changes

The `tripTracking.tsx` file has been updated to use the new **react-native-background-geolocation** service instead of manual location polling.

## What Was Changed

### ✅ Added Background Geolocation Imports
```typescript
const {
  startBackgroundTracking,
  stopBackgroundTracking,
  changePace,
  isBackgroundTracking,
} = useLocationStore();
```

### ✅ Removed Manual Polling
**Before:**
- iOS polling every 1.5 seconds with `setInterval`
- Manual location sending every 2 seconds
- Manual `watchPosition` calls

**After:**
- Background geolocation service handles everything automatically
- Locations are sent to server automatically by the service
- No manual intervals needed

### ✅ Added Smart Tracking Management

**1. Auto-start tracking when driver has active job:**
```typescript
useEffect(() => {
  if (userRole === "driver" && selectedJob && locationPermission) {
    await startBackgroundTracking();
    
    // Set pace based on job status
    if (selectedJob.status === 'in_progress' || selectedJob.status === 'in_transit') {
      await changePace(true); // Moving
    }
  }
  
  return () => {
    stopBackgroundTracking(); // Cleanup
  };
}, [userRole, selectedJob?.id, locationPermission]);
```

**2. Auto-adjust pace based on job status:**
```typescript
useEffect(() => {
  if (selectedJob.status === 'in_progress' || selectedJob.status === 'in_transit') {
    await changePace(true);  // MOVING - high frequency updates
  } else if (selectedJob.status === 'arrived_pickup' || selectedJob.status === 'arrived_delivery') {
    await changePace(false); // STATIONARY - low frequency updates (battery saver)
  }
}, [selectedJob?.status]);
```

**3. Updated trip control handlers:**
```typescript
const handleStartTrip = async () => {
  await startBackgroundTracking();
  await changePace(true); // Moving
};

const handlePauseTrip = async () => {
  await changePace(false); // Stationary (battery saver)
};

const handleStopTrip = async () => {
  await changePace(false);
  await stopBackgroundTracking();
};
```

## Benefits

### 🔋 Better Battery Life
- Automatic motion detection
- Intelligent frequency adjustment
- Stationary mode when not moving

### 📍 More Reliable Tracking
- Works when app is closed or in background
- Automatic retry on failure
- Offline location storage with auto-sync

### 🚀 Simpler Code
- No manual polling intervals
- No manual location sending
- Automatic cleanup and memory management

### 📱 Platform-Specific Optimization
- iOS: Significant location changes, region monitoring, heartbeat
- Android: Foreground service with notification, boot auto-start

## How It Works

1. **Job Starts** → Background tracking starts automatically
2. **Driver Moving** → High-frequency location updates (every 10 meters)
3. **Driver Stops** → Low-frequency updates (battery saver)
4. **Locations Sent** → Automatically to your backend API
5. **Job Ends** → Background tracking stops, cleanup

## Location Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Background Geolocation Service                         │
│  (react-native-background-geolocation)                  │
├─────────────────────────────────────────────────────────┤
│  • GPS/Network location                                 │
│  • Motion detection                                     │
│  • Battery monitoring                                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Location Store (locationStore.ts)                      │
│  • Updates currentLocation state                        │
│  • Triggers React re-renders                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Trip Tracking Component (tripTracking.tsx)             │
│  • Updates map markers                                  │
│  • Updates distance/ETA                                 │
│  • Sends to socket for real-time tracking               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Backend API                                            │
│  • POST /api/live-location                              │
│  • Stores location history                              │
│  • Broadcasts to other users via socket                 │
└─────────────────────────────────────────────────────────┘
```

## Configuration

The background geolocation is configured in `locationStore.ts`:

```typescript
{
  desiredAccuracy: HIGH,        // Best accuracy (~10m)
  distanceFilter: 10,           // Update every 10 meters
  stopTimeout: 5,               // Stationary after 5 minutes
  debug: __DEV__,               // Debug mode in development
  stopOnTerminate: false,       // Keep running when app closes
  startOnBoot: true,            // Auto-start on device reboot
  locationAuthorizationRequest: 'Always',
}
```

You can adjust these values in `startBackgroundTracking()` method if needed.

## Testing

### To Test Background Tracking:

1. **Start the app** and navigate to trip tracking
2. **Grant "Always" permission** (iOS) or "Allow all the time" (Android)
3. **Start a job** - background tracking starts automatically
4. **Put app in background** - tracking continues
5. **Check console logs** - Filter by "BackgroundGeo" or "LocationStore"
6. **Monitor your backend** - Check for location updates at `/api/live-location`

### Expected Console Logs:

```
🌍 TripTracking: Starting background location tracking for driver
✅ TripTracking: Background tracking started successfully
✅ TripTracking: Set pace to MOVING
📍 BackgroundGeo: Location received { coords: {...}, is_moving: true }
✅ BackgroundGeo: Location sent to server
```

## Troubleshooting

### Issue: Background tracking not starting
**Solution:** 
- Check permission is "Always" (not "When In Use")
- Check console logs for errors
- Try rebuilding the app: `cd ios && pod install && cd .. && npx react-native run-ios`

### Issue: High battery drain
**Solution:**
- Reduce `desiredAccuracy` in configuration
- Increase `distanceFilter` (e.g., from 10m to 20m)
- Ensure `changePace(false)` is called when stationary

### Issue: Locations not updating
**Solution:**
- Check `isBackgroundTracking` state
- Verify location permission
- Check backend API logs
- Enable debug mode to see detailed logs

## Migration Notes

### Old Code (Removed)
- ❌ Manual `setInterval` for polling
- ❌ Manual `watchPosition` calls
- ❌ Manual `sendLiveLocationData` intervals
- ❌ iOS-specific polling workarounds

### New Code (Added)
- ✅ `startBackgroundTracking()` - Start tracking
- ✅ `stopBackgroundTracking()` - Stop tracking
- ✅ `changePace(isMoving)` - Adjust frequency
- ✅ `isBackgroundTracking` - Check status

## Files Modified

1. ✅ `app/module/tracking/view/tripTracking.tsx` - Integrated background geolocation
2. ✅ `app/store/locationStore.ts` - Added background tracking methods
3. ✅ `app/service/background-geolocation-service.tsx` - Created service wrapper

## Next Steps

1. **Rebuild your app** - Native changes require rebuild
2. **Test on real devices** - Simulators don't accurately test background tracking
3. **Monitor battery impact** - Check over time and adjust configuration
4. **Test different scenarios**:
   - App in foreground
   - App in background
   - App terminated
   - Device locked
   - Poor GPS signal

## Documentation

- **Quick Start:** `BACKGROUND_GEOLOCATION_QUICKSTART.md`
- **Complete Guide:** `BACKGROUND_GEOLOCATION_INTEGRATION.md`
- **Code Examples:** `app/examples/background-geolocation-usage.tsx`
- **Service Code:** `app/service/background-geolocation-service.tsx`

## Support

For issues or questions:
1. Check console logs (filter by "BackgroundGeo")
2. Enable debug mode in configuration
3. Review the integration guide
4. Check official docs: https://transistorsoft.github.io/react-native-background-geolocation/

---

**Status:** ✅ Integration Complete - Ready for Testing

**Last Updated:** December 2, 2025

