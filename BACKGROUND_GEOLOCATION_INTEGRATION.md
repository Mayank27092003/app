# Background Geolocation Integration Guide

## Overview

This guide explains how to use the integrated `react-native-background-geolocation` library in your React Native app for continuous background location tracking.

## Installation

The library has already been installed and configured. If you need to reinstall:

```bash
npm install react-native-background-geolocation --save
```

### iOS Setup

1. Install pods:
```bash
cd ios && pod install && cd ..
```

2. The Info.plist has been updated with required permissions:
   - `NSLocationAlwaysAndWhenInUseUsageDescription`
   - `NSLocationAlwaysUsageDescription`
   - `NSLocationWhenInUseUsageDescription`
   - `NSMotionUsageDescription`
   - Background modes: `location`

### Android Setup

1. The AndroidManifest.xml has been updated with required permissions:
   - `ACCESS_FINE_LOCATION`
   - `ACCESS_COARSE_LOCATION`
   - `ACCESS_BACKGROUND_LOCATION` (Android 10+)
   - `FOREGROUND_SERVICE`
   - `FOREGROUND_SERVICE_LOCATION`
   - `WAKE_LOCK`
   - `RECEIVE_BOOT_COMPLETED`

2. The build.gradle files have been updated with necessary configurations.

## Usage

### Basic Usage in Components

```typescript
import { useLocationStore } from '@app/store/locationStore';

function MyComponent() {
  const {
    currentLocation,
    isBackgroundTracking,
    startBackgroundTracking,
    stopBackgroundTracking,
    changePace,
  } = useLocationStore();

  // Start tracking when component mounts or job starts
  useEffect(() => {
    const initTracking = async () => {
      try {
        await startBackgroundTracking();
        console.log('✅ Background tracking started');
      } catch (error) {
        console.error('❌ Failed to start background tracking', error);
      }
    };

    initTracking();

    // Cleanup when component unmounts
    return () => {
      stopBackgroundTracking();
    };
  }, []);

  // Change pace based on movement
  const handleStartMoving = async () => {
    await changePace(true); // Moving
  };

  const handleStopMoving = async () => {
    await changePace(false); // Stationary
  };

  return (
    <View>
      {currentLocation && (
        <Text>
          Lat: {currentLocation.latitude}, Lng: {currentLocation.longitude}
        </Text>
      )}
      <Text>Tracking: {isBackgroundTracking ? 'Active' : 'Inactive'}</Text>
    </View>
  );
}
```

### Integration in TripTracking Screen

Replace the existing location tracking in `tripTracking.tsx`:

```typescript
import { useLocationStore } from '@app/store/locationStore';

// Inside TripTrackingScreen component:
const {
  currentLocation,
  isBackgroundTracking,
  startBackgroundTracking,
  stopBackgroundTracking,
  changePace,
} = useLocationStore();

// Replace the existing location tracking effect with:
useEffect(() => {
  if (userRole === 'driver' && jobData?.status === 'in_progress') {
    console.log('🌍 TripTracking: Starting background location tracking...');
    
    const initBackgroundTracking = async () => {
      try {
        await startBackgroundTracking();
        console.log('✅ TripTracking: Background tracking started');
        
        // Set pace to moving
        await changePace(true);
      } catch (error) {
        console.error('❌ TripTracking: Failed to start background tracking', error);
      }
    };

    initBackgroundTracking();

    return () => {
      console.log('🌍 TripTracking: Stopping background tracking...');
      stopBackgroundTracking();
    };
  }
}, [userRole, jobData?.status, startBackgroundTracking, stopBackgroundTracking]);

// When job is completed or paused:
const handleJobComplete = async () => {
  // Set pace to stationary
  await changePace(false);
  
  // Or stop tracking completely
  await stopBackgroundTracking();
};
```

### Advanced Usage with Direct Service Access

For more advanced use cases, you can use the service directly:

```typescript
import { backgroundGeolocationService } from '@app/service/background-geolocation-service';
import BackgroundGeolocation from 'react-native-background-geolocation';

// Custom configuration
await backgroundGeolocationService.configure({
  desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
  distanceFilter: 10, // meters
  stopTimeout: 5, // minutes
  debug: true,
  logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
  stopOnTerminate: false,
  startOnBoot: true,
  locationAuthorizationRequest: 'Always',
});

// Start with custom callback
await backgroundGeolocationService.start((location) => {
  console.log('📍 Custom location callback:', location.coords);
  
  // Custom handling
  // ... your code here
});

// Get current position on demand
const location = await backgroundGeolocationService.getCurrentPosition({
  timeout: 30,
  maximumAge: 5000,
  desiredAccuracy: 10,
});

// Get all stored locations
const locations = await backgroundGeolocationService.getLocations();

// Clear stored locations
await backgroundGeolocationService.destroyLocations();

// Get current state
const state = await backgroundGeolocationService.getState();
console.log('Tracking enabled:', state.enabled);
console.log('Is moving:', state.isMoving);
```

## Features

### Automatic Location Updates

- The service automatically sends location updates to your backend via the `sendLiveLocation` API
- Locations include: latitude, longitude, accuracy, heading, speed, battery level, and provider
- Updates are sent every time a location change is detected

### Motion Detection

The library automatically detects when the device is moving or stationary:
- **Moving**: Higher frequency updates, better accuracy
- **Stationary**: Lower frequency updates to save battery

### Battery Optimization

- Automatically adjusts tracking based on motion
- Uses intelligent power management
- Provides battery level with each location update

### Background Operation

- Works even when app is in background or terminated
- iOS: Uses significant location changes and region monitoring
- Android: Uses foreground service with persistent notification

### Offline Support

- Stores locations locally when network is unavailable
- Automatically syncs when connection is restored
- SQLite database for persistence

## Configuration Options

### Location Accuracy

```typescript
BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION  // Highest (Best for navigation)
BackgroundGeolocation.DESIRED_ACCURACY_HIGH        // ~10m
BackgroundGeolocation.DESIRED_ACCURACY_MEDIUM      // ~100m
BackgroundGeolocation.DESIRED_ACCURACY_LOW         // ~1km
BackgroundGeolocation.DESIRED_ACCURACY_VERY_LOW    // ~3km
```

### Distance Filter

Minimum distance (meters) before a new location is recorded:
```typescript
distanceFilter: 10 // Only record location if moved 10+ meters
```

### Stop Timeout

Minutes to wait before considering device stationary:
```typescript
stopTimeout: 5 // 5 minutes
```

### Debug Mode

Enable debug notifications and sounds (development only):
```typescript
debug: __DEV__
logLevel: __DEV__ ? BackgroundGeolocation.LOG_LEVEL_VERBOSE : BackgroundGeolocation.LOG_LEVEL_OFF
```

## Best Practices

### 1. Start Tracking at the Right Time

```typescript
// ✅ Good: Start when job begins
if (jobStatus === 'in_progress') {
  await startBackgroundTracking();
}

// ❌ Bad: Start on app launch for all users
useEffect(() => {
  startBackgroundTracking(); // Don't do this!
}, []);
```

### 2. Always Clean Up

```typescript
useEffect(() => {
  startBackgroundTracking();
  
  return () => {
    stopBackgroundTracking(); // Always clean up
  };
}, []);
```

### 3. Handle Permissions Properly

```typescript
const { requestLocationPermission } = useLocationStore();

const startTracking = async () => {
  const hasPermission = await requestLocationPermission();
  
  if (hasPermission) {
    await startBackgroundTracking();
  } else {
    // Show user a message about why permission is needed
    Alert.alert(
      'Location Permission Required',
      'Please enable location access to track deliveries'
    );
  }
};
```

### 4. Use Pace Changes

```typescript
// When starting a delivery
await changePace(true); // Moving

// When taking a break
await changePace(false); // Stationary

// When delivery is complete
await stopBackgroundTracking();
```

### 5. Monitor Battery Impact

```typescript
// Access battery level from location updates
const { currentLocation } = useLocationStore();
console.log('Battery:', currentLocation?.battery);

// Adjust tracking based on battery
if (batteryLevel < 20) {
  // Reduce accuracy or stop tracking
  await backgroundGeolocationService.configure({
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_LOW,
    distanceFilter: 50,
  });
}
```

## Troubleshooting

### iOS Issues

1. **Location not updating in background**
   - Check Info.plist has all required keys
   - Verify `UIBackgroundModes` includes `location`
   - Ensure user granted "Always" permission

2. **Permission prompt not showing**
   - Check `locationAuthorizationRequest` is set to 'Always'
   - On iOS 13+, user must first grant "When In Use", then "Always"

### Android Issues

1. **Foreground service notification not showing**
   - Check `foregroundService: true` in config
   - Verify notification channel is created
   - Check Android 12+ notification permissions

2. **Background tracking stops**
   - Check `stopOnTerminate: false`
   - Verify `RECEIVE_BOOT_COMPLETED` permission
   - Check battery optimization settings

3. **Android 10+ background permission**
   - Must request `ACCESS_BACKGROUND_LOCATION` separately
   - User must grant in Settings after foreground permission

### General Issues

1. **High battery drain**
   - Reduce `desiredAccuracy`
   - Increase `distanceFilter`
   - Use appropriate `stopTimeout`

2. **Locations not being sent to server**
   - Check network connectivity
   - Verify API endpoint is correct
   - Check authentication tokens
   - Locations are queued and retried automatically

## API Reference

### LocationStore Methods

- `startBackgroundTracking()`: Start background location tracking
- `stopBackgroundTracking()`: Stop background location tracking
- `changePace(isMoving: boolean)`: Change tracking pace
- `getBackgroundState()`: Get current tracking state
- `requestLocationPermission()`: Request location permissions
- `getCurrentPosition()`: Get one-time location update

### LocationStore State

- `currentLocation`: Current location object
- `isBackgroundTracking`: Whether background tracking is active
- `locationPermission`: Whether location permission is granted
- `error`: Error message if any

### BackgroundGeolocationService Methods

- `configure(config)`: Configure the service
- `start(callback)`: Start tracking with optional callback
- `stop()`: Stop tracking
- `getCurrentPosition(options)`: Get current position
- `changePace(isMoving)`: Change movement state
- `getState()`: Get current state
- `getLocations()`: Get all stored locations
- `destroyLocations()`: Clear stored locations
- `getCount()`: Get count of stored locations
- `reset()`: Reset configuration

## Support

For issues or questions:
1. Check the [official documentation](https://transistorsoft.github.io/react-native-background-geolocation/)
2. Review console logs (filter by "BackgroundGeo" or "LocationStore")
3. Enable debug mode to see detailed logs

## License

react-native-background-geolocation requires a license for production use. See [pricing](https://www.transistorsoft.com/shop/products/react-native-background-geolocation).

Note: The library works in development without a license.

