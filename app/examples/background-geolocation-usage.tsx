/**
 * Background Geolocation Usage Example
 * This file shows how to integrate background geolocation in your app
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, Platform } from 'react-native';
import { useLocationStore } from '@app/store/locationStore';

/**
 * Example 1: Basic Usage in Trip Tracking
 * Use this pattern in your tripTracking.tsx screen
 */
export function BasicTripTrackingExample() {
  const {
    currentLocation,
    isBackgroundTracking,
    locationPermission,
    startBackgroundTracking,
    stopBackgroundTracking,
    changePace,
    requestLocationPermission,
  } = useLocationStore();

  const [tripStatus, setTripStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

  // Start tracking when trip begins
  const handleStartTrip = async () => {
    try {
      // First check/request permission
      if (!locationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Location permission is required to track your trip. Please enable it in settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Start background tracking
      console.log('🚗 Starting trip and background tracking...');
      await startBackgroundTracking();
      
      // Set pace to moving
      await changePace(true);
      
      setTripStatus('in_progress');
      
      Alert.alert('Trip Started', 'Background location tracking is now active');
    } catch (error) {
      console.error('❌ Failed to start trip:', error);
      Alert.alert('Error', 'Failed to start background tracking');
    }
  };

  // Stop tracking when trip ends
  const handleEndTrip = async () => {
    try {
      console.log('🛑 Ending trip and stopping background tracking...');
      
      // Set pace to stationary first
      await changePace(false);
      
      // Stop tracking
      await stopBackgroundTracking();
      
      setTripStatus('completed');
      
      Alert.alert('Trip Ended', 'Background tracking stopped');
    } catch (error) {
      console.error('❌ Failed to end trip:', error);
    }
  };

  // Pause tracking (e.g., taking a break)
  const handlePauseTrip = async () => {
    try {
      console.log('⏸️ Pausing trip...');
      await changePace(false); // Set to stationary
      Alert.alert('Trip Paused', 'Location tracking is now in stationary mode');
    } catch (error) {
      console.error('❌ Failed to pause trip:', error);
    }
  };

  // Resume tracking
  const handleResumeTrip = async () => {
    try {
      console.log('▶️ Resuming trip...');
      await changePace(true); // Set to moving
      Alert.alert('Trip Resumed', 'Location tracking is now in moving mode');
    } catch (error) {
      console.error('❌ Failed to resume trip:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Trip Status: {tripStatus}
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        Tracking: {isBackgroundTracking ? '✅ Active' : '❌ Inactive'}
      </Text>
      
      {currentLocation && (
        <View style={{ marginBottom: 20 }}>
          <Text>📍 Current Location:</Text>
          <Text>Latitude: {currentLocation.latitude.toFixed(6)}</Text>
          <Text>Longitude: {currentLocation.longitude.toFixed(6)}</Text>
          <Text>Accuracy: {currentLocation.accuracy?.toFixed(2)}m</Text>
          <Text>Speed: {currentLocation.speed?.toFixed(2)}m/s</Text>
          <Text>Heading: {currentLocation.heading?.toFixed(2)}°</Text>
        </View>
      )}
      
      {tripStatus === 'not_started' && (
        <Button title="Start Trip" onPress={handleStartTrip} />
      )}
      
      {tripStatus === 'in_progress' && (
        <>
          <Button title="Pause Trip" onPress={handlePauseTrip} />
          <Button title="Resume Trip" onPress={handleResumeTrip} />
          <Button title="End Trip" onPress={handleEndTrip} color="red" />
        </>
      )}
    </View>
  );
}

/**
 * Example 2: Integration in Existing TripTracking Component
 * Copy this code into your tripTracking.tsx
 */
export function TripTrackingIntegrationExample() {
  const {
    currentLocation,
    isBackgroundTracking,
    startBackgroundTracking,
    stopBackgroundTracking,
    changePace,
  } = useLocationStore();

  const userRole = 'driver'; // Get from your actual user context
  const jobData = { status: 'in_progress' }; // Get from your actual job data

  // Replace your existing location tracking useEffect with this:
  useEffect(() => {
    let mounted = true;

    const initBackgroundTracking = async () => {
      if (userRole === 'driver' && jobData?.status === 'in_progress') {
        try {
          console.log('🌍 TripTracking: Initializing background location tracking...');
          
          await startBackgroundTracking();
          
          if (mounted) {
            console.log('✅ TripTracking: Background tracking started successfully');
            
            // Set pace to moving
            await changePace(true);
          }
        } catch (error) {
          console.error('❌ TripTracking: Failed to start background tracking:', error);
        }
      }
    };

    initBackgroundTracking();

    // Cleanup function
    return () => {
      mounted = false;
      
      if (isBackgroundTracking) {
        console.log('🌍 TripTracking: Component unmounting, stopping background tracking...');
        stopBackgroundTracking();
      }
    };
  }, [userRole, jobData?.status]);

  // Update your map to use currentLocation from the store
  useEffect(() => {
    if (currentLocation) {
      console.log('📍 TripTracking: Location updated:', currentLocation);
      
      // Update your map marker, route, etc.
      // Example:
      // setMapRegion({
      //   latitude: currentLocation.latitude,
      //   longitude: currentLocation.longitude,
      //   latitudeDelta: 0.0922,
      //   longitudeDelta: 0.0421,
      // });
    }
  }, [currentLocation]);

  return (
    <View>
      {/* Your existing UI */}
      <Text>Tracking Status: {isBackgroundTracking ? 'Active' : 'Inactive'}</Text>
    </View>
  );
}

/**
 * Example 3: Advanced Usage with Direct Service Access
 */
export function AdvancedExample() {
  const [locations, setLocations] = useState<any[]>([]);
  
  const { backgroundGeolocationService } = require('@app/service/background-geolocation-service');
  const BackgroundGeolocation = require('react-native-background-geolocation').default;

  const configureCustom = async () => {
    try {
      await backgroundGeolocationService.configure({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 5, // Update every 5 meters
        stopTimeout: 3, // 3 minutes
        debug: true,
        logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
        stopOnTerminate: false,
        startOnBoot: true,
        locationAuthorizationRequest: 'Always',
        
        // Custom Android notification
        backgroundPermissionRationale: {
          title: 'Background Location Access',
          message: 'We need background location for accurate delivery tracking',
          positiveAction: 'Allow',
          negativeAction: 'Cancel',
        },
      });
      
      console.log('✅ Custom configuration applied');
    } catch (error) {
      console.error('❌ Configuration error:', error);
    }
  };

  const startWithCustomCallback = async () => {
    try {
      await backgroundGeolocationService.start((location) => {
        console.log('📍 Custom callback - Location:', location.coords);
        console.log('📍 Is moving:', location.is_moving);
        console.log('📍 Activity type:', location.activity.type);
        console.log('📍 Battery level:', location.battery.level);
        
        // Do custom processing
        // For example, update local state, send to different endpoint, etc.
      });
    } catch (error) {
      console.error('❌ Start error:', error);
    }
  };

  const getCurrentPosition = async () => {
    try {
      const location = await backgroundGeolocationService.getCurrentPosition({
        timeout: 30,
        maximumAge: 5000,
        desiredAccuracy: 10,
        samples: 3,
      });
      
      console.log('📍 Current position:', location.coords);
      Alert.alert(
        'Current Position',
        `Lat: ${location.coords.latitude}\nLng: ${location.coords.longitude}`
      );
    } catch (error) {
      console.error('❌ Get position error:', error);
    }
  };

  const getStoredLocations = async () => {
    try {
      const storedLocations = await backgroundGeolocationService.getLocations();
      console.log('📍 Retrieved locations:', storedLocations.length);
      setLocations(storedLocations);
    } catch (error) {
      console.error('❌ Get locations error:', error);
    }
  };

  const clearStoredLocations = async () => {
    try {
      await backgroundGeolocationService.destroyLocations();
      console.log('🗑️ Cleared stored locations');
      setLocations([]);
    } catch (error) {
      console.error('❌ Clear locations error:', error);
    }
  };

  const getState = async () => {
    try {
      const state = await backgroundGeolocationService.getState();
      console.log('📊 Background Geo State:', {
        enabled: state.enabled,
        isMoving: state.isMoving,
        trackingMode: state.trackingMode,
        odometer: state.odometer,
        didDeviceReboot: state.didDeviceReboot,
      });
      
      Alert.alert(
        'Tracking State',
        `Enabled: ${state.enabled}\nMoving: ${state.isMoving}\nOdometer: ${state.odometer}m`
      );
    } catch (error) {
      console.error('❌ Get state error:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Advanced Background Geolocation
      </Text>
      
      <Button title="Configure Custom Settings" onPress={configureCustom} />
      <Button title="Start with Custom Callback" onPress={startWithCustomCallback} />
      <Button title="Get Current Position" onPress={getCurrentPosition} />
      <Button title="Get Stored Locations" onPress={getStoredLocations} />
      <Button title="Clear Stored Locations" onPress={clearStoredLocations} />
      <Button title="Get State" onPress={getState} />
      
      {locations.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text>Stored Locations: {locations.length}</Text>
          {locations.slice(0, 5).map((loc, index) => (
            <Text key={index} style={{ fontSize: 12 }}>
              {new Date(loc.timestamp).toLocaleString()}: {loc.coords.latitude.toFixed(4)}, {loc.coords.longitude.toFixed(4)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Example 4: Handling Different Job States
 */
export function JobStateHandlingExample() {
  const { startBackgroundTracking, stopBackgroundTracking, changePace } = useLocationStore();
  
  const [jobStatus, setJobStatus] = useState<'not_started' | 'picked_up' | 'in_transit' | 'delivered'>('not_started');

  useEffect(() => {
    const handleJobStateChange = async () => {
      try {
        switch (jobStatus) {
          case 'not_started':
            // Don't track yet
            console.log('⏸️ Job not started, no tracking');
            break;
            
          case 'picked_up':
            // Start tracking when item is picked up
            console.log('📦 Item picked up, starting background tracking');
            await startBackgroundTracking();
            await changePace(false); // Stationary while loading
            break;
            
          case 'in_transit':
            // Set to moving during transit
            console.log('🚗 In transit, setting pace to moving');
            await changePace(true);
            break;
            
          case 'delivered':
            // Stop tracking when delivered
            console.log('✅ Delivered, stopping background tracking');
            await changePace(false);
            await stopBackgroundTracking();
            break;
        }
      } catch (error) {
        console.error('❌ Error handling job state change:', error);
      }
    };

    handleJobStateChange();
  }, [jobStatus]);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Current Status: {jobStatus}
      </Text>
      
      <Button 
        title="Pick Up Item" 
        onPress={() => setJobStatus('picked_up')}
        disabled={jobStatus !== 'not_started'}
      />
      <Button 
        title="Start Transit" 
        onPress={() => setJobStatus('in_transit')}
        disabled={jobStatus !== 'picked_up'}
      />
      <Button 
        title="Mark Delivered" 
        onPress={() => setJobStatus('delivered')}
        disabled={jobStatus !== 'in_transit'}
      />
    </View>
  );
}

/**
 * Example 5: Platform-Specific Handling
 */
export function PlatformSpecificExample() {
  const { startBackgroundTracking, requestLocationPermission } = useLocationStore();

  const handleStartTracking = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        if (Platform.OS === 'ios') {
          Alert.alert(
            'Location Permission Required',
            'Please enable location access in Settings:\n\n' +
            '1. Go to Settings\n' +
            '2. Find this app\n' +
            '3. Tap Location\n' +
            '4. Select "Always"',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                // Linking.openSettings();
              }},
            ]
          );
        } else {
          Alert.alert(
            'Location Permission Required',
            'Please enable location access for background tracking:\n\n' +
            '1. Grant location permission\n' +
            '2. Select "Allow all the time" for background tracking',
            [
              { text: 'OK' },
            ]
          );
        }
        return;
      }

      await startBackgroundTracking();
      
      // On iOS, user might have granted "When In Use" but not "Always"
      if (Platform.OS === 'ios') {
        // Show a reminder to change to "Always" if needed
        setTimeout(() => {
          Alert.alert(
            'Enable Background Tracking',
            'For continuous tracking, please change location permission to "Always" in Settings',
            [{ text: 'OK' }]
          );
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error starting tracking:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 20 }}>Platform: {Platform.OS}</Text>
      <Button title="Start Tracking" onPress={handleStartTracking} />
    </View>
  );
}

