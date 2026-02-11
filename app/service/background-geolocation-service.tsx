/**
 * Background Geolocation Service
 * Handles background location tracking using react-native-background-geolocation
 * @format
 */

import BackgroundGeolocation, {
  Location,
  State,
  Config,
  Subscription,
  ProviderChangeEvent,
  HeartbeatEvent,
  LocationAccuracy,
  LogLevel,
} from 'react-native-background-geolocation';
import { Platform } from 'react-native';
import { sendLiveLocation, createLiveLocationData } from './location-service';

export interface BackgroundLocationConfig {
  desiredAccuracy: LocationAccuracy;
  distanceFilter: number;
  stopTimeout: number;
  debug: boolean;
  logLevel: LogLevel;
  stopOnTerminate: boolean;
  startOnBoot: boolean;
  locationAuthorizationRequest: 'Always' | 'WhenInUse' | 'Any';
  backgroundPermissionRationale?: {
    title: string;
    message: string;
    positiveAction: string;
    negativeAction: string;
  };
}

class BackgroundGeolocationService {
  private isConfigured: boolean = false;
  private isTracking: boolean = false;
  private locationSubscription: Subscription | null = null;
  private motionChangeSubscription: Subscription | null = null;
  private providerChangeSubscription: Subscription | null = null;
  private heartbeatSubscription: Subscription | null = null;
  private locationCallback: ((location: Location) => void) | null = null;

  /**
   * Configure the background geolocation plugin
   */
  async configure(config?: Partial<BackgroundLocationConfig>): Promise<State> {
    try {
      console.log('🌍 BackgroundGeo: Configuring...');

      const defaultConfig: Config = {
        // Geolocation Config
        desiredAccuracy: config?.desiredAccuracy || BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: config?.distanceFilter || 10, // meters
        stationaryRadius: 25,
        
        // Activity Recognition
        stopTimeout: config?.stopTimeout || 5, // minutes
        
        // Application config
        debug: config?.debug || __DEV__, // Enable debug sounds & notifications in development
        logLevel: config?.logLevel || ((__DEV__) ? BackgroundGeolocation.LOG_LEVEL_VERBOSE : BackgroundGeolocation.LOG_LEVEL_OFF),
        stopOnTerminate: config?.stopOnTerminate ?? false,
        startOnBoot: config?.startOnBoot ?? true,
        
        // Android specific
        foregroundService: true,
        notification: {
          title: 'Location Tracking Active',
          text: 'Tracking your location for delivery',
          color: '#4CAF50',
          channelName: 'Location Tracking',
          sticky: true,
        },
        
        // iOS specific
        preventSuspend: true,
        heartbeatInterval: 60,
        locationAuthorizationRequest: config?.locationAuthorizationRequest || 'Always',
        
        // Background permission rationale (Android 11+)
        backgroundPermissionRationale: config?.backgroundPermissionRationale || {
          title: 'Allow location access all the time?',
          message: 'This app needs background location access for accurate delivery tracking',
          positiveAction: 'Change to "Allow all the time"',
          negativeAction: 'Cancel',
        },

        // HTTP / SQLite config
        enableHeadless: true,
        
        // Geofencing
        geofenceProximityRadius: 1000,
      };

      const state = await BackgroundGeolocation.ready(defaultConfig);
      
      this.isConfigured = true;
      console.log('✅ BackgroundGeo: Configured successfully', state);
      
      return state;
    } catch (error) {
      console.error('❌ BackgroundGeo: Configuration error', error);
      throw error;
    }
  }

  /**
   * Request location permission
   */
  async requestPermission(): Promise<number> {
    try {
      console.log('🌍 BackgroundGeo: Requesting permission...');
      
      const status = await BackgroundGeolocation.requestPermission();
      console.log('📍 BackgroundGeo: Permission status:', status);
      
      return status;
    } catch (error) {
      console.error('❌ BackgroundGeo: Permission error', error);
      throw error;
    }
  }

  /**
   * Check current location permission status
   */
  async getPermissionStatus(): Promise<number> {
    try {
      const providerState = await BackgroundGeolocation.getProviderState();
      return providerState.status;
    } catch (error) {
      console.error('❌ BackgroundGeo: Error getting permission status', error);
      return BackgroundGeolocation.AUTHORIZATION_STATUS_NOT_DETERMINED;
    }
  }

  /**
   * Start background location tracking
   */
  async start(onLocation?: (location: Location) => void): Promise<State> {
    try {
      if (!this.isConfigured) {
        console.log('⚠️ BackgroundGeo: Not configured, configuring now...');
        await this.configure();
      }

      // Check permission
      const permissionStatus = await this.getPermissionStatus();
      if (
        permissionStatus !== BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS &&
        permissionStatus !== BackgroundGeolocation.AUTHORIZATION_STATUS_WHEN_IN_USE
      ) {
        console.log('⚠️ BackgroundGeo: No permission, requesting...');
        await this.requestPermission();
      }

      console.log('🌍 BackgroundGeo: Starting tracking...');

      // Store the callback
      if (onLocation) {
        this.locationCallback = onLocation;
      }

      // Subscribe to location updates
      this.setupLocationListener();
      
      // Subscribe to motion changes
      this.setupMotionChangeListener();
      
      // Subscribe to provider changes
      this.setupProviderChangeListener();
      
      // Subscribe to heartbeat (iOS)
      if (Platform.OS === 'ios') {
        this.setupHeartbeatListener();
      }

      // Start tracking
      const state = await BackgroundGeolocation.start();
      this.isTracking = true;
      
      console.log('✅ BackgroundGeo: Tracking started', state);
      
      return state;
    } catch (error) {
      console.error('❌ BackgroundGeo: Start error', error);
      throw error;
    }
  }

  /**
   * Stop background location tracking
   */
  async stop(): Promise<State> {
    try {
      console.log('🌍 BackgroundGeo: Stopping tracking...');
      
      // Remove listeners
      this.removeAllListeners();
      
      // Stop tracking
      const state = await BackgroundGeolocation.stop();
      this.isTracking = false;
      
      console.log('✅ BackgroundGeo: Tracking stopped', state);
      
      return state;
    } catch (error) {
      console.error('❌ BackgroundGeo: Stop error', error);
      throw error;
    }
  }

  /**
   * Get current position
   */
  async getCurrentPosition(options?: any): Promise<Location> {
    try {
      console.log('🌍 BackgroundGeo: Getting current position...');
      
      const location = await BackgroundGeolocation.getCurrentPosition({
        timeout: 30,
        maximumAge: 5000,
        desiredAccuracy: 10,
        samples: 3,
        persist: true,
        ...options,
      });
      
      console.log('✅ BackgroundGeo: Current position:', location.coords);
      
      return location;
    } catch (error) {
      console.error('❌ BackgroundGeo: Get current position error', error);
      throw error;
    }
  }

  /**
   * Change pace (moving or stationary)
   */
  async changePace(isMoving: boolean): Promise<void> {
    try {
      console.log('🌍 BackgroundGeo: Changing pace to:', isMoving ? 'MOVING' : 'STATIONARY');
      await BackgroundGeolocation.changePace(isMoving);
    } catch (error) {
      console.error('❌ BackgroundGeo: Change pace error', error);
      throw error;
    }
  }

  /**
   * Setup location listener
   */
  private setupLocationListener(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }

    this.locationSubscription = BackgroundGeolocation.onLocation(
      async (location: Location) => {
        console.log('📍 BackgroundGeo: Location received', {
          coords: location.coords,
          timestamp: location.timestamp,
          isMoving: location.is_moving,
          activity: location.activity,
        });

        // Call the callback if provided
        if (this.locationCallback) {
          this.locationCallback(location);
        }

        // Send location to server
        try {
          const locationData = createLiveLocationData(
            location.coords.latitude,
            location.coords.longitude,
            location.coords.accuracy,
            location.coords.heading,
            location.coords.speed,
            location.battery.level * 100, // Convert to percentage
            'gps'
          );

          await sendLiveLocation(locationData);
          console.log('✅ BackgroundGeo: Location sent to server');
        } catch (error) {
          console.error('❌ BackgroundGeo: Error sending location to server', error);
        }
      },
      (error) => {
        console.error('❌ BackgroundGeo: Location error', error);
      }
    );
  }

  /**
   * Setup motion change listener
   */
  private setupMotionChangeListener(): void {
    if (this.motionChangeSubscription) {
      this.motionChangeSubscription.remove();
    }

    this.motionChangeSubscription = BackgroundGeolocation.onMotionChange((event) => {
      console.log('🚶 BackgroundGeo: Motion change', {
        isMoving: event.isMoving,
        location: event.location.coords,
      });
    });
  }

  /**
   * Setup provider change listener
   */
  private setupProviderChangeListener(): void {
    if (this.providerChangeSubscription) {
      this.providerChangeSubscription.remove();
    }

    this.providerChangeSubscription = BackgroundGeolocation.onProviderChange((event: ProviderChangeEvent) => {
      console.log('📡 BackgroundGeo: Provider change', {
        enabled: event.enabled,
        status: event.status,
        gps: event.gps,
        network: event.network,
      });

      if (!event.enabled) {
        console.warn('⚠️ BackgroundGeo: Location services disabled');
      }
    });
  }

  /**
   * Setup heartbeat listener (iOS)
   */
  private setupHeartbeatListener(): void {
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.remove();
    }

    this.heartbeatSubscription = BackgroundGeolocation.onHeartbeat(async (event: HeartbeatEvent) => {
      console.log('💓 BackgroundGeo: Heartbeat', event);
      
      // Get current position on heartbeat
      try {
        const location = await this.getCurrentPosition({
          timeout: 10,
          maximumAge: 5000,
        });
        console.log('💓 BackgroundGeo: Heartbeat location', location.coords);
      } catch (error) {
        console.error('❌ BackgroundGeo: Heartbeat location error', error);
      }
    });
  }

  /**
   * Remove all listeners
   */
  private removeAllListeners(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    if (this.motionChangeSubscription) {
      this.motionChangeSubscription.remove();
      this.motionChangeSubscription = null;
    }
    if (this.providerChangeSubscription) {
      this.providerChangeSubscription.remove();
      this.providerChangeSubscription = null;
    }
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.remove();
      this.heartbeatSubscription = null;
    }
    
    this.locationCallback = null;
  }

  /**
   * Get current state
   */
  async getState(): Promise<State> {
    try {
      const state = await BackgroundGeolocation.getState();
      return state;
    } catch (error) {
      console.error('❌ BackgroundGeo: Get state error', error);
      throw error;
    }
  }

  /**
   * Check if tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Reset configuration
   */
  async reset(): Promise<State> {
    try {
      console.log('🌍 BackgroundGeo: Resetting...');
      
      this.removeAllListeners();
      const state = await BackgroundGeolocation.reset();
      this.isConfigured = false;
      this.isTracking = false;
      
      console.log('✅ BackgroundGeo: Reset complete', state);
      
      return state;
    } catch (error) {
      console.error('❌ BackgroundGeo: Reset error', error);
      throw error;
    }
  }

  /**
   * Get locations from local database
   */
  async getLocations(): Promise<Location[]> {
    try {
      const locations = await BackgroundGeolocation.getLocations() as unknown as Location[];
      console.log('📍 BackgroundGeo: Retrieved locations', locations.length);
      return locations;
    } catch (error) {
      console.error('❌ BackgroundGeo: Get locations error', error);
      return [];
    }
  }

  /**
   * Destroy all stored locations
   */
  async destroyLocations(): Promise<boolean> {
    try {
      await BackgroundGeolocation.destroyLocations();
      console.log('🗑️ BackgroundGeo: Locations destroyed');
      return true;
    } catch (error) {
      console.error('❌ BackgroundGeo: Destroy locations error', error);
      return false;
    }
  }

  /**
   * Get location count
   */
  async getCount(): Promise<number> {
    try {
      const count = await BackgroundGeolocation.getCount();
      return count;
    } catch (error) {
      console.error('❌ BackgroundGeo: Get count error', error);
      return 0;
    }
  }

  /**
   * Play debug sound (development only)
   */
  async playSound(soundId: number): Promise<void> {
    if (__DEV__) {
      await BackgroundGeolocation.playSound(soundId);
    }
  }
}

// Export singleton instance
export const backgroundGeolocationService = new BackgroundGeolocationService();
export default backgroundGeolocationService;

