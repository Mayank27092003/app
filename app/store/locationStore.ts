import { create } from 'zustand';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation, { Location, State } from 'react-native-background-geolocation';
import { backgroundGeolocationService } from '@app/service/background-geolocation-service';

type LocationState = {
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
    accuracy?: number;
    speed?: number;
    altitude?: number;
  } | null;
  locationPermission: boolean;
  isTracking: boolean;
  isBackgroundTracking: boolean;
  error: string | null;
  
  // Actions
  requestLocationPermission: () => Promise<boolean>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  updateLocation: (latitude: number, longitude: number, heading?: number) => void;
  getCurrentPosition: () => Promise<void>;
  
  // Background geolocation actions
  startBackgroundTracking: () => Promise<void>;
  stopBackgroundTracking: () => Promise<void>;
  getBackgroundState: () => Promise<State | null>;
  changePace: (isMoving: boolean) => Promise<void>;
};

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  locationPermission: false,
  isTracking: false,
  isBackgroundTracking: false,
  error: null,
  
  requestLocationPermission: async () => {
    try {
      console.log('📍 LocationStore: Requesting location permission for platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        console.log('📍 LocationStore: Web platform - granting permission automatically');
        set({ locationPermission: true });
        return true;
      }
      
      let hasPermission = true;
      
      // Try to use background geolocation permission first
      try {
        const status = await backgroundGeolocationService.requestPermission();
        console.log('📍 LocationStore: Background geolocation permission status:', status);
        
        hasPermission = 
          status === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS ||
          status === BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE;
        
        if (hasPermission) {
          console.log('📍 LocationStore: Background geolocation permission granted');
          set({ locationPermission: true });
          return true;
        }
      } catch (bgError) {
        console.warn('📍 LocationStore: Background geolocation permission failed, falling back to standard', bgError);
      }
      
      // Fallback to standard permission request
      if (Platform.OS === 'ios') {
        console.log('📍 LocationStore: iOS platform - requesting authorization...');
        try {
          // Use the standard iOS authorization approach
          Geolocation.requestAuthorization();
          
          // Check if we can get location by trying to get current position
          const canGetLocation = await new Promise<boolean>((resolve) => {
            Geolocation.getCurrentPosition(
              () => {
                console.log('📍 LocationStore: iOS - Can get location');
                resolve(true);
              },
              (error) => {
                console.log('📍 LocationStore: iOS - Cannot get location, error:', error.code, error.message);
                resolve(false);
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
            );
          });
          
          hasPermission = canGetLocation;
          console.log('📍 LocationStore: iOS permission result:', hasPermission);
        } catch (error) {
          console.error('📍 LocationStore: iOS permission error:', error);
          hasPermission = false;
        }
      } else if (Platform.OS === 'android') {
        console.log('📍 LocationStore: Android platform - requesting runtime permission...');
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location to show your current position.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          console.log('📍 LocationStore: Android permission result:', granted);
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
          
          // Also request background location permission for Android 10+
          if (hasPermission && Platform.Version >= 29) {
            try {
              const bgGranted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
                {
                  title: 'Background Location Permission',
                  message: 'This app needs background location access for accurate delivery tracking.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              console.log('📍 LocationStore: Android background permission result:', bgGranted);
            } catch (bgError) {
              console.warn('📍 LocationStore: Android background permission warning:', bgError);
            }
          }
        } catch (error) {
          console.error('📍 LocationStore: Android permission error:', error);
          hasPermission = false;
        }
      }
      
      console.log('📍 LocationStore: Final permission status:', hasPermission);
      set({ locationPermission: hasPermission });
      
      if (!hasPermission) {
        console.log('📍 LocationStore: Permission denied');
        set({ error: 'Permission to access location was denied' });
      }
      return hasPermission;
    } catch (error) {
      console.error('📍 LocationStore: Error requesting permission:', error);
      set({ error: 'Error requesting location permission' });
      return false;
    }
  },
  
  startLocationTracking: async () => {
    const { locationPermission, isTracking } = get();
    
    console.log('📍 LocationStore: Starting location tracking...');
    console.log('📍 LocationStore: Permission:', locationPermission, 'Already tracking:', isTracking);
    
    if (!locationPermission) {
      console.log('📍 LocationStore: No permission, requesting...');
      const granted = await get().requestLocationPermission();
      console.log('📍 LocationStore: Permission granted:', granted);
      if (!granted) return;
    }
    
    if (isTracking) {
      console.log('📍 LocationStore: Already tracking, skipping...');
      return;
    }
    
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation API for web
        navigator.geolocation.watchPosition(
          (position) => {
            console.log('📍 LocationStore: Web - Position received:', position.coords);
            console.log('📍 LocationStore: Web - Heading from GPS:', position.coords.heading);
            set({
              currentLocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp,
                heading: position.coords.heading || undefined,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed || undefined,
                altitude: position.coords.altitude || undefined,
              },
              error: null,
            });
          },
          (error) => {
            console.error('📍 LocationStore: Web - Position error:', error);
            set({ error: error.message });
          },
          { enableHighAccuracy: true }
        );
      } else {
        // Use RN Geolocation for native platforms
        Geolocation.watchPosition(
          (position) => {
            console.log('📍 LocationStore: Native - Position received:', position.coords);
            console.log('📍 LocationStore: Heading from GPS:', position.coords.heading);
            set({
              currentLocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp,
                heading: position.coords.heading || undefined,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed || undefined,
                altitude: position.coords.altitude || undefined,
              },
              error: null,
            });
          },
          (error) => {
            console.error('📍 LocationStore: Native - Position error:', error);
            set({ error: error.message });
          },
          { enableHighAccuracy: true, distanceFilter: 1, interval: 5000, fastestInterval: 2000 }
        );
      }
      set({ isTracking: true });
    } catch (error) {
      console.error('📍 LocationStore: Error starting location tracking:', error);
      set({ error: 'Error starting location tracking', isTracking: false });
    }
  },
  
  stopLocationTracking: () => {
    // In a real app, you should clear the watch using the watchId
    set({ isTracking: false });
  },
  
  updateLocation: (latitude: number, longitude: number, heading?: number) => {
    set({
      currentLocation: {
        latitude,
        longitude,
        timestamp: Date.now(),
        heading,
      },
    });
  },
  
  getCurrentPosition: async () => {
    const { locationPermission } = get();
    
    if (!locationPermission) {
      console.log('📍 LocationStore: No permission for getCurrentPosition, requesting...');
      const granted = await get().requestLocationPermission();
      if (!granted) {
        console.log('📍 LocationStore: Permission denied for getCurrentPosition');
        return;
      }
    }
    
    try {
      console.log('📍 LocationStore: Getting current position...');
      
      // Return a Promise that resolves when location is received
      return new Promise<void>((resolve, reject) => {
        if (Platform.OS === 'web') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('📍 LocationStore: Web - Current position received:', position.coords);
              set({
                currentLocation: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: position.timestamp,
                  heading: position.coords.heading || undefined,
                  accuracy: position.coords.accuracy,
                  speed: position.coords.speed || undefined,
                  altitude: position.coords.altitude || undefined,
                },
                error: null,
              });
              resolve();
            },
            (error) => {
              console.error('📍 LocationStore: Web - Current position error:', error);
              const errorMessage = error.message || 'Failed to get location';
              set({ error: errorMessage });
              reject(new Error(errorMessage));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          Geolocation.getCurrentPosition(
            (position) => {
              console.log('📍 LocationStore: Native - Current position received:', position.coords);
              set({
                currentLocation: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: position.timestamp,
                  heading: position.coords.heading || undefined,
                  accuracy: position.coords.accuracy,
                  speed: position.coords.speed || undefined,
                  altitude: position.coords.altitude || undefined,
              },
                error: null,
              });
              resolve();
            },
            (error) => {
              console.error('📍 LocationStore: Native - Current position error:', error);
              const errorMessage = error.message || 'Failed to get location';
              set({ error: errorMessage });
              reject(new Error(errorMessage));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        }
      });
    } catch (error) {
      console.error('📍 LocationStore: Error getting current position:', error);
      set({ error: 'Error getting current position' });
      throw error;
    }
  },

  // ============================================================================
  // BACKGROUND GEOLOCATION METHODS
  // ============================================================================

  /**
   * Start background location tracking with react-native-background-geolocation
   */
  startBackgroundTracking: async () => {
    const { locationPermission, isBackgroundTracking } = get();
    
    console.log('🌍 LocationStore: Starting background tracking...');
    
    if (!locationPermission) {
      console.log('🌍 LocationStore: No permission, requesting...');
      const granted = await get().requestLocationPermission();
      if (!granted) return;
    }
    
    if (isBackgroundTracking) {
      console.log('🌍 LocationStore: Already background tracking, skipping...');
      return;
    }
    
    try {
      // Configure the background geolocation service
      await backgroundGeolocationService.configure({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10,
        stopTimeout: 5,
        debug: __DEV__,
        logLevel: __DEV__ ? BackgroundGeolocation.LOG_LEVEL_VERBOSE : BackgroundGeolocation.LOG_LEVEL_OFF,
        stopOnTerminate: false,
        startOnBoot: true,
        locationAuthorizationRequest: 'Always',
      });
      
      // Start tracking with callback
      await backgroundGeolocationService.start((location: Location) => {
        console.log('🌍 LocationStore: Background location update:', location.coords);
        
        // Update store with new location
        set({
          currentLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date(location.timestamp).getTime(),
            heading: location.coords.heading,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            altitude: location.coords.altitude,
          },
          error: null,
        });
      });
      
      set({ isBackgroundTracking: true });
      console.log('✅ LocationStore: Background tracking started successfully');
    } catch (error) {
      console.error('❌ LocationStore: Error starting background tracking:', error);
      set({ error: 'Error starting background tracking', isBackgroundTracking: false });
      throw error;
    }
  },

  /**
   * Stop background location tracking
   */
  stopBackgroundTracking: async () => {
    console.log('🌍 LocationStore: Stopping background tracking...');
    
    try {
      await backgroundGeolocationService.stop();
      set({ isBackgroundTracking: false });
      console.log('✅ LocationStore: Background tracking stopped successfully');
    } catch (error) {
      console.error('❌ LocationStore: Error stopping background tracking:', error);
      set({ error: 'Error stopping background tracking' });
      throw error;
    }
  },

  /**
   * Get current background geolocation state
   */
  getBackgroundState: async () => {
    try {
      const state = await backgroundGeolocationService.getState();
      console.log('🌍 LocationStore: Background state:', state);
      return state;
    } catch (error) {
      console.error('❌ LocationStore: Error getting background state:', error);
      return null;
    }
  },

  /**
   * Change pace (moving or stationary)
   */
  changePace: async (isMoving: boolean) => {
    try {
      console.log('🌍 LocationStore: Changing pace to:', isMoving ? 'MOVING' : 'STATIONARY');
      await backgroundGeolocationService.changePace(isMoving);
    } catch (error) {
      console.error('❌ LocationStore: Error changing pace:', error);
      throw error;
    }
  },
}));
