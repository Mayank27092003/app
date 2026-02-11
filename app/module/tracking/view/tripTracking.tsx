import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import MapView, { Marker, MarkerAnimated, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Locate,
  Route,
  Play,
  Pause,
  Square,
  Truck,
  Package,
  Home,
  ArrowLeft,
  Navigation,
  TruckElectric,
  TruckIcon,
} from "lucide-react-native";

// Screens
import { Colors, useThemedStyle } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { useJobStore } from "@app/store/jobStore";
import { useLocationStore } from "@app/store/locationStore";
import { Job } from "@app/types";
import { Button } from "@app/components/Button";
import { getStyles } from "./tripTrackingStyles";
import { GOOGLE_MAPS_API_KEY } from "@app/configs";
import {
  sendLiveLocation,
  createLiveLocationData,
} from "@app/service/location-service";
import { selectProfile } from "@app/module/common";
import { useSelector } from "react-redux";
import { socketService } from "@app/service/socket-service";
import { reverseGeocode, LocationInfo } from "@app/utils/geocoding";
import Geolocation from '@react-native-community/geolocation';
import { Platform } from 'react-native';
import { Routes } from "@app/navigator";

const { width, height } = Dimensions.get("window");

interface TripMilestone {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  timestamp?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  distance: string;
  duration: string;
  coordinates: RouteCoordinates[];
}

function TripTrackingScreen() {
  const { t } = useTranslation();
  console.log('🚀 TripTrackingScreen RENDER - Component function executing');
  const styles = useThemedStyle(getStyles);
  const route = useRoute();
  const navigation = useNavigation();
  const profileData = useSelector(selectProfile);
  const userRole = profileData?.roles?.[0]?.role?.name;
  console.log('🚀 TripTrackingScreen - userRole:', userRole, 'profileId:', profileData?.id);
  const { userProfile } = useAuthStore();
  const { jobs } = useJobStore();
  const {
    currentLocation: storeCurrentLocation,
    locationPermission,
    requestLocationPermission,
    startLocationTracking,
    getCurrentPosition,
    startBackgroundTracking,
    stopBackgroundTracking,
    changePace,
    isBackgroundTracking,
  } = useLocationStore();

  // Get job data from navigation params
  const { job: passedJob } = route.params as { job?: Job; jobId?: string };
  const { hasPreTrip, hasPod1, hasPostTrip, hasPod2 } = route.params as { hasPreTrip?: boolean; hasPod1?: boolean; hasPostTrip?: boolean; hasPod2?: boolean };
  const [selectedJob, setSelectedJob] = useState(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [tripPaused, setTripPaused] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(0);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  // Initialize map region with initialDriverLocation if available, otherwise default
  // Using smaller delta values for higher zoom level (closer view)
  const [mapRegion, setMapRegion] = useState(() => {
    // Try to get initial location from contractParticipants if available
    // This will be updated when selectedJob is available
    return {
      latitude: 40.7589,
      longitude: -73.9851,
      latitudeDelta: 0.1, // Will be adjusted by fitToCoordinates to show entire route
      longitudeDelta: 0.1, // Will be adjusted by fitToCoordinates to show entire route
    };
  });
  // alert(hasPreTrip, hasPod1, hasPostTrip, hasPod2);
  // Direct location state - fetched directly in this component
  const [directLocation, setDirectLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  } | null>(null);

  // Use direct location if available, otherwise fall back to store location
  const currentLocation = directLocation || storeCurrentLocation;

  // Helper function to get driver location from contractParticipants (defined early for use in multiple places)
  const getDriverLocationFromContractParticipants = useCallback((job: any): { latitude: number; longitude: number } | null => {
    try {
      // Find driver in contractParticipants
      const participants = job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants;
      if (!participants || !Array.isArray(participants)) {
        return null;
      }

      // Find driver participant
      const driverParticipant = participants.find(
        (p: any) => p.role === "driver" && (p.status === "accepted" || p.status === "active" || p.status === "assigned")
      );

      if (driverParticipant && driverParticipant.user?.location) {
        // Parse string values to numbers (API returns strings like "30.7017622")
        const latStr = driverParticipant.user.location.lat || driverParticipant.user.location.latitude;
        const lngStr = driverParticipant.user.location.lng || driverParticipant.user.location.longitude;

        // Convert to number if string
        const lat = typeof latStr === 'string' ? parseFloat(latStr) : latStr;
        const lng = typeof lngStr === 'string' ? parseFloat(lngStr) : lngStr;

        if (lat && lng && !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
          console.log('📍 Found driver location from contractParticipants:', { lat, lng });
          return { latitude: lat, longitude: lng };
        }
      }

      // Also check if user is directly in participant (alternative structure)
      if (driverParticipant?.user?.location?.lat || driverParticipant?.user?.location?.latitude) {
        // Parse string values to numbers (API returns strings like "30.7017622")
        const latStr = driverParticipant.user.location.lat || driverParticipant.user.location.latitude;
        const lngStr = driverParticipant.user.location.lng || driverParticipant.user.location.longitude;

        // Convert to number if string
        const lat = typeof latStr === 'string' ? parseFloat(latStr) : latStr;
        const lng = typeof lngStr === 'string' ? parseFloat(lngStr) : lngStr;

        if (lat && lng && !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
          console.log('📍 Found driver location from contractParticipants (alt structure):', { lat, lng });
          return { latitude: lat, longitude: lng };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting driver location from contractParticipants:', error);
      return null;
    }
  }, []);

  // Get initial location from contractParticipants (for both drivers and non-drivers)
  const initialDriverLocation = useMemo(() => {
    if (selectedJob) {
      const contractLoc = getDriverLocationFromContractParticipants(selectedJob);
      if (contractLoc) {
        console.log('📍 Using driver location from contractParticipants as initial location:', contractLoc);
        return contractLoc;
      }
    }
    return null;
  }, [selectedJob, getDriverLocationFromContractParticipants]);

  // Update map region when driver's current location changes (only initial centering)
  const [hasInitializedMap, setHasInitializedMap] = useState(false);

  // Declare trackedDriverLocation early so it can be used in useEffect dependencies
  const [trackedDriverLocation, setTrackedDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  } | null>(null);

  // Also check location store directly to see if it's different
  useEffect(() => {
    const storeLocation = useLocationStore.getState().currentLocation;
    console.log("📍 TripTracking: Direct store check - currentLocation:", storeLocation);
    if (storeLocation && storeLocation.latitude && storeLocation.longitude) {
      console.log("✅ TripTracking: Store has valid location:", {
        lat: storeLocation.latitude,
        lng: storeLocation.longitude
      });
    } else {
      console.log("❌ TripTracking: Store location is null or invalid");
    }
  }, []);

  useEffect(() => {
    console.log("📍 TripTracking: currentLocation from store:", currentLocation);
  }, [currentLocation]);

  useEffect(() => {
    if (!hasInitializedMap && selectedJob) {
      // For drivers: Try to get location from contractParticipants first (API location), then currentLocation
      // For non-drivers: Try to get location from contractParticipants (API location), then trackedDriverLocation
      let locationToUse;
      if (userRole === "driver") {
        locationToUse = initialDriverLocation || currentLocation;
      } else {
        locationToUse = initialDriverLocation || trackedDriverLocation;
      }

      if (locationToUse && locationToUse.latitude && locationToUse.longitude) {
        const locationSource = initialDriverLocation
          ? 'contractParticipants (API)'
          : (userRole === "driver" ? 'currentLocation (GPS)' : 'trackedDriverLocation (Socket)');
        console.log(`📍 Initial map centering to ${userRole === "driver" ? "driver's" : "tracked driver's"} location (from ${locationSource}):`, locationToUse);

        // Fit map to show driver location, pickup, and dropoff locations
        const coordinatesToFit = [
          {
            latitude: locationToUse.latitude,
            longitude: locationToUse.longitude,
          },
          {
            latitude: selectedJob.pickupLocation?.lat || 0,
            longitude: selectedJob.pickupLocation?.lng || 0,
          },
          {
            latitude: selectedJob.dropoffLocation?.lat || 0,
            longitude: selectedJob.dropoffLocation?.lng || 0,
          },
        ].filter((coord) => coord.latitude !== 0 && coord.longitude !== 0);

        if (coordinatesToFit.length > 0 && mapRef.current) {
          // Use fitToCoordinates to show all important points (driver, pickup, dropoff)
          // This ensures the route will be visible once it loads
          mapRef.current.fitToCoordinates(coordinatesToFit, {
            edgePadding: { top: 150, right: 50, bottom: 300, left: 50 },
            animated: true,
          });

          // Also update map region state for reference
          setMapRegion({
            latitude: locationToUse.latitude,
            longitude: locationToUse.longitude,
            latitudeDelta: 0.1, // Reasonable zoom level that shows route
            longitudeDelta: 0.1,
          });
        } else {
          // Fallback to centering on location if coordinates are invalid
          setMapRegion({
            latitude: locationToUse.latitude,
            longitude: locationToUse.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });

          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: locationToUse.latitude,
              longitude: locationToUse.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }, 1000);
          }
        }

        setHasInitializedMap(true);
      } else if (initialDriverLocation) {
        // Even if we don't have valid coordinates, mark as initialized to prevent re-trying
        console.log('⚠️ Initial location found but invalid coordinates:', initialDriverLocation);
        setHasInitializedMap(true);
      }
    }
  }, [userRole, currentLocation, trackedDriverLocation, initialDriverLocation, hasInitializedMap, selectedJob]);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [distanceToDelivery, setDistanceToDelivery] = useState<number | null>(
    null
  );
  const [etaToPickup, setEtaToPickup] = useState<string | null>(null);
  const [etaToDelivery, setEtaToDelivery] = useState<string | null>(null);

  // Route coordinates state
  const [pickupRouteInfo, setPickupRouteInfo] = useState<RouteInfo | null>(
    null
  );
  const [deliveryRouteInfo, setDeliveryRouteInfo] = useState<RouteInfo | null>(
    null
  );
  // Route from driver's current location to drop location
  const [driverToDropRouteInfo, setDriverToDropRouteInfo] = useState<RouteInfo | null>(
    null
  );
  const [completeRouteInfo, setCompleteRouteInfo] = useState<RouteInfo | null>(
    null
  );
  console.log("coords length:", completeRouteInfo?.coordinates?.length || 0);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLocationUpdating, setIsLocationUpdating] = useState(false);

  // State for pickup radius detection
  const [isWithinPickupRadius, setIsWithinPickupRadius] = useState(false);
  const [isWithinDropoffRadius, setIsWithinDropoffRadius] = useState(false);

  const [hasShownPreTripButton, setHasShownPreTripButton] = useState(false);
  const [hasShownPostTripButton, setHasShownPostTripButton] = useState(false);

  const PICKUP_RADIUS_METERS = 1000; // 100 meters radius
  const DROPOFF_RADIUS_METERS = 1000; // 100 meters radius
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [debugLocationInfo, setDebugLocationInfo] = useState<LocationInfo | null>(null);
  const [debugLocationLoading, setDebugLocationLoading] = useState(false);

  const [driverSocketLocation, setDriverSocketLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  } | null>(null);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  // Store last valid location to prevent falling back to initial location when driver stops
  const lastValidLocationRef = useRef<{ latitude: number; longitude: number; timestamp: number; heading?: number } | null>(null);
  // Track if we've ever received a valid location (to distinguish initial load from stopped driver)
  const hasReceivedValidLocationRef = useRef(false);
  // Track if route fitting has been done to prevent re-fitting
  const routeFitDoneRef = useRef(false);
  // Track if user has manually interacted with the map (zoomed, panned, etc.)
  const hasUserInteractedWithMapRef = useRef(false);

  // Utility function to calculate bearing between two points
  // Must be defined early as it's used in useMemo calculations
  const calculateBearing = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }, []);
  const liveLocationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const continuousLocationRef = useRef<NodeJS.Timeout | null>(null);
  const locationSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to get the correct location based on user role
  const getLocationForMap = useMemo(() => {
    if (userRole === "driver") {
      // Driver uses their own current location, fallback to initialDriverLocation from API, then default
      return (
        currentLocation ||
        (initialDriverLocation ? {
          latitude: initialDriverLocation.latitude,
          longitude: initialDriverLocation.longitude,
          timestamp: Date.now(),
        } : {
          latitude: 40.7589,
          longitude: -73.9851,
          timestamp: Date.now(),
        })
      );
    } else {
      // Non-driver users use the tracked driver's location, fallback to initialDriverLocation from API, then default
      return (
        trackedDriverLocation ||
        (initialDriverLocation ? {
          latitude: initialDriverLocation.latitude,
          longitude: initialDriverLocation.longitude,
          timestamp: Date.now(),
        } : {
          latitude: 40.7589,
          longitude: -73.9851,
          timestamp: Date.now(),
        })
      );
    }
  }, [userRole, currentLocation, trackedDriverLocation, initialDriverLocation]);

  // Track driver socket location changes
  useEffect(() => {
    if (driverSocketLocation) {
      // Driver socket location updated
    }
  }, [driverSocketLocation]);

  // Utility function to calculate distance between two coordinates (needed for snapToRoute)
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }, []);

  // Helper function to find the closest point on a line segment
  const getClosestPointOnSegment = (
    point: { latitude: number; longitude: number },
    segmentStart: { latitude: number; longitude: number },
    segmentEnd: { latitude: number; longitude: number }
  ): { latitude: number; longitude: number } => {
    const A = point.latitude - segmentStart.latitude;
    const B = point.longitude - segmentStart.longitude;
    const C = segmentEnd.latitude - segmentStart.latitude;
    const D = segmentEnd.longitude - segmentStart.longitude;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx: number, yy: number;

    if (param < 0) {
      xx = segmentStart.latitude;
      yy = segmentStart.longitude;
    } else if (param > 1) {
      xx = segmentEnd.latitude;
      yy = segmentEnd.longitude;
    } else {
      xx = segmentStart.latitude + param * C;
      yy = segmentStart.longitude + param * D;
    }

    return { latitude: xx, longitude: yy };
  };

  // Function to find the closest point on a route polyline to a given location
  const snapToRoute = (
    location: { latitude: number; longitude: number },
    routeCoordinates: Array<{ latitude: number; longitude: number }>,
    maxDistance: number = 2000 // Maximum distance in meters to snap (default 2000m = 2km)
  ): { latitude: number; longitude: number } | null => {
    if (!routeCoordinates || routeCoordinates.length < 2) {
      console.log("📍 snapToRoute: Invalid route coordinates");
      return null;
    }

    if (!location || !location.latitude || !location.longitude) {
      console.log("📍 snapToRoute: Invalid location");
      return null;
    }

    let closestPoint: { latitude: number; longitude: number } | null = null;
    let minDistance = Infinity;
    let closestSegmentIndex = -1;

    // Check each segment of the route
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const p1 = routeCoordinates[i];
      const p2 = routeCoordinates[i + 1];

      if (!p1 || !p2 || !p1.latitude || !p1.longitude || !p2.latitude || !p2.longitude) {
        continue; // Skip invalid coordinates
      }

      // Calculate the closest point on this segment
      const closestOnSegment = getClosestPointOnSegment(
        location,
        p1,
        p2
      );

      // Calculate distance in meters (convert from km)
      const distanceKm = calculateDistance(
        location.latitude,
        location.longitude,
        closestOnSegment.latitude,
        closestOnSegment.longitude
      );
      const distance = distanceKm * 1000; // Convert to meters

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = closestOnSegment;
        closestSegmentIndex = i;
      }
    }

    // Only snap if within maxDistance
    if (minDistance <= maxDistance && closestPoint) {
      console.log(`📍 snapToRoute: Snapping from distance ${minDistance.toFixed(2)}m (threshold: ${maxDistance}m), segment: ${closestSegmentIndex}`);
      return closestPoint;
    }

    console.log(`📍 snapToRoute: Too far from route - distance: ${minDistance.toFixed(2)}m, threshold: ${maxDistance}m`);
    return null;
  };

  // Calculate coordinates for map markers - reactive to location changes
  const coordinates = useMemo(() => {
    // For drivers, use currentLocation directly to ensure real-time updates
    // For non-drivers, use trackedDriverLocation
    const driverLocation = userRole === "driver"
      ? currentLocation
      : (trackedDriverLocation || getLocationForMap);

    const jobToUse = selectedJob || {
      pickupLocation: {
        lat: 40.7505,
        lng: -73.9934,
        address: "123 Main St, New York, NY",
      },
      dropoffLocation: {
        lat: 40.7282,
        lng: -73.9942,
        address: "321 Corporate Plaza, Manhattan, NY 10003",
      },
    };

    console.log("📍 TripTracking: Calculating coordinates:", {
      userRole,
      driverLocation,
      trackedDriverLocation,
      currentLocation,
      currentLocationLat: currentLocation?.latitude,
      currentLocationLng: currentLocation?.longitude,
      hasValidLocation: !!(currentLocation && currentLocation.latitude && currentLocation.longitude),
      isDriver: userRole === "driver"
    });

    console.log("📍 TripTracking: Heading data:", {
      driverLocationHeading: driverLocation?.heading,
      trackedDriverLocationHeading: trackedDriverLocation?.heading,
      currentLocationHeading: currentLocation?.heading,
    });

    console.log("📍 TripTracking: Driver marker will be at:", {
      latitude: driverLocation?.latitude,
      longitude: driverLocation?.longitude,
      type: "driver",
    });

    // For drivers: show their own location + pickup + drop
    // For carriers/brokers/shippers: show only driver location + pickup + drop (no current location)
    const markers = [];

    // Add driver location marker
    if (userRole === "driver") {
      // Driver sees their own actual GPS location
      // Priority: currentLocation > lastValidLocation > storeLocation > initialDriverLocation (only on first load)
      let driverMarkerLocation: { latitude: number; longitude: number; heading?: number } | null = null;

      // Priority 1: currentLocation (real-time GPS)
      if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
        driverMarkerLocation = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          heading: currentLocation.heading,
        };
        // Update last valid location
        lastValidLocationRef.current = currentLocation;
        hasReceivedValidLocationRef.current = true;
        console.log("✅ Added driver marker at current location:", {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          heading: currentLocation?.heading,
          timestamp: currentLocation.timestamp,
          isFetching: isFetchingLocation
        });
      }
      // Priority 2: last valid location (if driver stopped but we had a location before)
      else if (lastValidLocationRef.current && hasReceivedValidLocationRef.current) {
        driverMarkerLocation = {
          latitude: lastValidLocationRef.current.latitude,
          longitude: lastValidLocationRef.current.longitude,
          heading: lastValidLocationRef.current.heading,
        };
        console.log("📍 Using last valid location for driver marker (driver stopped):", driverMarkerLocation);
      }
      // Priority 3: store location
      else {
        const storeLocation = useLocationStore.getState().currentLocation;
        if (storeLocation && storeLocation.latitude && storeLocation.longitude) {
          driverMarkerLocation = {
            latitude: storeLocation.latitude,
            longitude: storeLocation.longitude,
            heading: storeLocation?.heading,
          };
          // Update last valid location
          lastValidLocationRef.current = storeLocation;
          hasReceivedValidLocationRef.current = true;
          console.log("⚠️ Using store location as fallback:", storeLocation);
        }
        // Priority 4: initialDriverLocation (only on first load, before we've received any valid location)
        else if (initialDriverLocation && !hasReceivedValidLocationRef.current) {
          driverMarkerLocation = {
            latitude: initialDriverLocation.latitude,
            longitude: initialDriverLocation.longitude,
          };
          console.log("📍 Using initial location from contractParticipants (first load):", driverMarkerLocation);
        }
      }

      // Add marker if we have a valid location
      if (driverMarkerLocation) {
        markers.push({
          latitude: driverMarkerLocation.latitude,
          longitude: driverMarkerLocation.longitude,
          title: t("home.yourLocation"),
          description: hasReceivedValidLocationRef.current && !currentLocation
            ? "Last known driver location"
            : "Current driver location",
          type: "driver",
          heading: driverMarkerLocation.heading,
        });
      } else {
        console.log("❌ Driver marker not added - no valid location available:", {
          currentLocation,
          lastValidLocation: lastValidLocationRef.current,
          initialDriverLocation,
          hasReceivedValidLocation: hasReceivedValidLocationRef.current,
          isFetchingLocation,
          userRole,
          locationPermission
        });
      }
    } else {
      // Non-driver users see the tracked driver's location
      if (trackedDriverLocation) {
        let trackedMarkerLocation = {
          latitude: trackedDriverLocation.latitude,
          longitude: trackedDriverLocation.longitude,
        };

        // Try to snap tracked driver location to route
        if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length >= 2) {
          const snappedLocation = snapToRoute(
            trackedMarkerLocation,
            completeRouteInfo.coordinates,
            2000 // Snap if within 2000 meters (2km) of route - larger threshold for better snapping
          );
          if (snappedLocation) {
            trackedMarkerLocation = snappedLocation;
            console.log("📍 Snapped tracked driver location to route:", {
              original: { lat: trackedDriverLocation.latitude, lng: trackedDriverLocation.longitude },
              snapped: snappedLocation
            });
          } else {
            console.log("📍 Could not snap tracked driver location - too far from route");
          }
        }

        // Calculate heading for tracked driver if not available
        let trackedHeading = trackedDriverLocation?.heading;

        // If heading is not available, calculate from route
        if ((trackedHeading === undefined || trackedHeading === null) && completeRouteInfo?.coordinates && completeRouteInfo.coordinates.length >= 2) {
          // Find closest point on route
          let closestIndex = 0;
          let minDistance = Infinity;

          for (let i = 0; i < completeRouteInfo.coordinates.length; i++) {
            const routePoint = completeRouteInfo.coordinates[i];
            // Skip if routePoint is invalid
            if (!routePoint || routePoint.latitude === undefined || routePoint.longitude === undefined) {
              continue;
            }
            const distance = Math.sqrt(
              Math.pow(routePoint.latitude - trackedMarkerLocation.latitude, 2) +
              Math.pow(routePoint.longitude - trackedMarkerLocation.longitude, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = i;
            }
          }

          // Calculate bearing to next point on route
          if (closestIndex < completeRouteInfo.coordinates.length - 1) {
            const nextPoint = completeRouteInfo.coordinates[closestIndex + 1];
            // Check if nextPoint is valid before using it
            if (nextPoint && nextPoint.latitude !== undefined && nextPoint.longitude !== undefined) {
              trackedHeading = calculateBearing(
                trackedMarkerLocation.latitude,
                trackedMarkerLocation.longitude,
                nextPoint.latitude,
                nextPoint.longitude
              );
            }
          }
        }

        markers.push({
          latitude: trackedMarkerLocation.latitude,
          longitude: trackedMarkerLocation.longitude,
          title: t("common.driverLocation"),
          description: `Live driver location (${new Date(
            trackedDriverLocation.timestamp
          ).toLocaleTimeString()})`,
          type: "driver",
          heading: trackedHeading,
        });
      } else {
        // Show default driver location if no tracked location yet
        markers.push({
          latitude: driverLocation?.latitude || 40.7589,
          longitude: driverLocation?.longitude || -73.9851,
          title: t("common.driverLocation"),
          description: "Waiting for driver location",
          type: "driver",
          heading: driverLocation?.heading,
        });
      }
    }

    // Add pickup location
    markers.push({
      latitude: jobToUse?.pickupLocation?.lat,
      longitude: jobToUse?.pickupLocation?.lng,
      title: t("common.pickupLocation"),
      description: jobToUse.pickupLocation.address,
      type: "pickup",
    });

    // Add delivery location
    markers.push({
      latitude: jobToUse?.dropoffLocation?.lat,
      longitude: jobToUse?.dropoffLocation?.lng,
      title: t("common.deliveryLocation"),
      description: jobToUse.dropoffLocation.address,
      type: "delivery",
    });

    const filteredMarkers = markers.filter(
      (coord) => coord?.latitude !== 0 && coord?.longitude !== 0
    );

    console.log("📍 TripTracking: Final coordinates array:", {
      totalMarkers: markers.length,
      filteredMarkers: filteredMarkers.length,
      driverMarkers: filteredMarkers.filter(m => m.type === "driver").length,
      markers: filteredMarkers.map(m => ({ type: m.type, lat: m.latitude, lng: m.longitude }))
    });

    return filteredMarkers;
  }, [userRole, currentLocation, trackedDriverLocation, selectedJob, getLocationForMap, completeRouteInfo, isFetchingLocation]);

  // Function to send live location data with debouncing
  const sendLiveLocationData = (latitude: number | undefined, longitude: number | undefined, heading?: number) => {
    // Validate coordinates - don't send if invalid or default location
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      console.log("📍 sendLiveLocationData: Invalid coordinates, skipping:", { latitude, longitude });
      return;
    }

    // Check if it's the default location
    const isDefaultLocation =
      (latitude === 40.7589 && longitude === -73.9851) ||
      (latitude === 40.7505 && longitude === -73.9934);

    if (isDefaultLocation) {
      console.log("📍 sendLiveLocationData: Default location detected, skipping:", { latitude, longitude });
      return;
    }

    // Clear previous timeout
    if (liveLocationTimeoutRef.current) {
      clearTimeout(liveLocationTimeoutRef.current);
    }

    // Only send if user is a driver
    if (userRole === "driver") {
      // alert('last')

      // Debounce the API call to avoid too many requests
      setTimeout(async () => {
        try {
          // alert('try')

          // Get current location from store to ensure we have the latest data
          const latestLocation = useLocationStore.getState().currentLocation;
          const finalLat = latestLocation?.latitude;
          const finalLng = latestLocation?.longitude;
          const finalHeading = latestLocation?.heading || heading || 0;

          // Double-check it's not default location
          const isStillDefault =
            (finalLat === 40.7589 && finalLng === -73.9851) ||
            (finalLat === 40.7505 && finalLng === -73.9934);

          if (isStillDefault) {
            console.log("📍 sendLiveLocationData: Still default location after store check, skipping");
            return;
          }

          const locationData = {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            accuracy: 5.2,
            heading: currentLocation.heading,
            speed: 65.5,
            battery: 85,
            provider: "gps",
          };

          console.log("📍 sendLiveLocationData: Sending location to socket:", locationData);
          await sendLiveLocation(locationData);
          console.log("📍 sendLiveLocationData: Location sent successfully");
        } catch (error) {
          alert('error')
          console.error("❌ Error sending live location:", error);
        }
      }, 2000);
    }
  };

  // Trip milestones based on job status
  const tripMilestones: TripMilestone[] = [
    {
      id: "start",
      title: t("common.tripStarted"),
      description: "Begin your delivery trip",
      status: "pending",
    },
    {
      id: "enroute_pickup",
      title: t("common.enRouteToPickup"),
      description: "Heading to pickup location",
      status: "pending",
    },
    {
      id: "arrived_pickup",
      title: t("common.arrivedAtPickup"),
      description: "Reached pickup location",
      status: "pending",
    },
    {
      id: "loaded",
      title: t("common.cargoLoaded"),
      description: "Cargo has been loaded",
      status: "pending",
    },
    {
      id: "enroute_delivery",
      title: t("common.enRouteToDelivery"),
      description: "Heading to delivery location",
      status: "pending",
    },
    {
      id: "arrived_delivery",
      title: t("common.arrivedAtDelivery"),
      description: "Reached delivery location",
      status: "pending",
    },
    {
      id: "delivered",
      title: t("common.cargoDelivered"),
      description: "Cargo has been delivered",
      status: "pending",
    },
  ];

  // Replace with your actual Google Maps API Key

  // Function to get route from Google Directions API (two points)
  // const getRouteFromDirectionsAPI = async (
  //   origin: { latitude: number; longitude: number },
  //   destination: { latitude: number; longitude: number }
  // ): Promise<RouteInfo | null> => {
  //   try {
  //     const originStr = `${origin?.latitude},${origin?.longitude}`;
  //     const destinationStr = `${destination?.latitude},${destination?.longitude}`;

  //     const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

  //     console.log("Fetching route from Directions API...");
  //     const response = await fetch(url);
  //     const data = await response.json();

  //     if (data.status === "OK") {
  //       const route = data.routes[0];
  //       const leg = route.legs[0];

  //       // Decode polyline points
  //       const points = route.overview_polyline.points;
  //       const coordinates = decodePolyline(points);

  //       console.log("🗺️ Individual route details:", {
  //         coordinatesCount: coordinates.length,
  //         distance: leg.distance.text,
  //         duration: leg.duration.text,
  //       });

  //       return {
  //         distance: leg.distance.text,
  //         duration: leg.duration.text,
  //         coordinates: coordinates,
  //       };
  //     } else {
  //       console.warn("Directions API error:", data.status, data.error_message);
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error("Error fetching route from Directions API:", error);
  //     return null;
  //   }
  // };
  const getRouteFromDirectionsAPI = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    waypoints: { latitude: number; longitude: number }[] = [],
    mapRef?: React.RefObject<MapView>
  ): Promise<RouteInfo | null> => {
    try {
      const body = {
        origin: {
          location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } },
        },
        destination: {
          location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } },
        },
        intermediates: waypoints.map((w) => ({
          location: { latLng: { latitude: w.latitude, longitude: w.longitude } },
        })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE_OPTIMAL",
        // ✅ Correct field name is `vehicleInfo` → `vehicleInfo`
        // ✅ but vehicle type must be inside `routeModifiers.vehicleInfo`
        routeModifiers: {
          avoidTolls: false,
          avoidFerries: true,
          avoidHighways: false,
          vehicleInfo: {
            vehicleType: "TRUCK",
            heightMeters: 4.2,
            widthMeters: 2.5,
            lengthMeters: 12,
            weightKilograms: 10000,
          },
        },
        polylineQuality: "HIGH_QUALITY",
        computeAlternativeRoutes: false,
        // Request more detailed polyline with more intermediate points
        // Include steps for maximum accuracy
        fieldMask: "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs,routes.legs.polyline.encodedPolyline,routes.legs.steps,routes.legs.steps.polyline.encodedPolyline,routes.polyline",
        // ✅ departure_time should be RFC3339 timestamp (ISO string)
        // departureTime: new Date().toISOString(),
        languageCode: "en",
        units: "METRIC",
      };

      console.log("🚛 Fetching Truck Route using Routes API v2...");

      // Use Google Routes API v2 for truck routing with vehicle specifications
      const routesApiUrl = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${GOOGLE_MAPS_API_KEY}`;

      console.log("🚛 Routes API v2 Request Body:", JSON.stringify(body, null, 2));

      const response = await fetch(routesApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': body.fieldMask,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      console.log("🗺️ Routes API v2 Response:", data);

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        // Routes API v2 response structure
        let allCoordinates: RouteCoordinates[] = [];

        // PRIORITY 1: Extract from individual steps for maximum accuracy
        if (route.legs && route.legs.length > 0) {
          for (const leg of route.legs) {
            if (leg.steps && leg.steps.length > 0) {
              // Use step-by-step polylines for highest accuracy
              for (const step of leg.steps) {
                if (step.polyline && step.polyline.encodedPolyline) {
                  const stepCoordinates = decodePolyline(step.polyline.encodedPolyline);
                  allCoordinates = allCoordinates.concat(stepCoordinates);
                }
              }
            } else if (leg.polyline && leg.polyline.encodedPolyline) {
              // Fallback to leg polyline if steps not available
              const legCoordinates = decodePolyline(leg.polyline.encodedPolyline);
              allCoordinates = allCoordinates.concat(legCoordinates);
            }
          }

          if (allCoordinates.length > 0) {
            console.log(`✅ Using detailed step-by-step coordinates from Routes API v2: ${allCoordinates.length} points`);
            // Step-by-step coordinates are already accurate and follow roads - only optimize if extremely long to prevent crashes
            // DO NOT apply smoothing as it creates straight-line segments and destroys path accuracy
            if (allCoordinates.length > 10000) {
              console.log(`⚠️ Extremely long step-by-step route (${allCoordinates.length} points), applying minimal optimization`);
              allCoordinates = optimizeCoordinatesForRendering(allCoordinates);
            } else {
              console.log(`✅ Preserving accurate step-by-step coordinates (${allCoordinates.length} points) - no optimization needed`);
            }
          }
        }

        // PRIORITY 2: Fallback to route-level polyline if no step/leg data
        if (allCoordinates.length === 0 && route.polyline && route.polyline.encodedPolyline) {
          const polylineString = route.polyline.encodedPolyline;
          const rawCoordinates = decodePolyline(polylineString);
          allCoordinates = rawCoordinates;
          console.log(`✅ Using route-level polyline from Routes API v2: ${allCoordinates.length} points`);
          // Only optimize if very long
          if (allCoordinates.length > 5000) {
            allCoordinates = optimizeCoordinatesForRendering(allCoordinates);
          }
        }

        // Fallback to Directions API v1 if Routes API v2 doesn't provide polyline
        if (allCoordinates.length === 0) {
          console.warn("⚠️ Routes API v2 didn't provide polyline, falling back to Directions API v1");
          const waypointsParam = waypoints.length > 0 ? `&waypoints=${waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')}` : '';
          const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&mode=driving&avoid=ferries&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;

          const directionsResponse = await fetch(directionsUrl);
          const directionsData = await directionsResponse.json();

          if (directionsData.status === "OK" && directionsData.routes && directionsData.routes.length > 0) {
            const directionsRoute = directionsData.routes[0];
            for (const leg of directionsRoute.legs) {
              if (leg.steps && leg.steps.length > 0) {
                for (const step of leg.steps) {
                  if (step.polyline && step.polyline.points) {
                    const stepCoordinates = decodePolyline(step.polyline.points);
                    allCoordinates = allCoordinates.concat(stepCoordinates);
                  }
                }
              }
            }
            // Fallback to overview if no step data
            if (allCoordinates.length === 0 && directionsRoute.overview_polyline) {
              // Overview polyline is less detailed, so optimization is acceptable
              const rawCoordinates = decodePolyline(directionsRoute.overview_polyline.points);
              // Only optimize if very long to prevent crashes
              if (rawCoordinates.length > 5000) {
                allCoordinates = optimizeCoordinatesForRendering(rawCoordinates);
              } else {
                allCoordinates = rawCoordinates;
              }
            } else if (allCoordinates.length > 0) {
              // Step-by-step coordinates are already accurate and follow roads - preserve them
              // Only optimize if extremely long to prevent crashes
              if (allCoordinates.length > 10000) {
                console.log(`⚠️ Extremely long step-by-step route (${allCoordinates.length} points), applying minimal optimization`);
                allCoordinates = optimizeCoordinatesForRendering(allCoordinates);
              } else {
                console.log(`✅ Preserving accurate step-by-step coordinates (${allCoordinates.length} points) - no optimization needed`);
              }
            }

            console.log(`✅ Using Directions API v1 fallback: ${allCoordinates.length} points`);
          }
        }

        const coordinates = allCoordinates;

        // Extract distance and duration from Routes API v2
        // Routes API v2 provides distanceMeters and duration (in seconds as string)
        let totalDistance = 0;
        let totalDurationSec = 0;

        if (route.distanceMeters) {
          totalDistance = route.distanceMeters;
        } else if (route.legs) {
          totalDistance = route.legs.reduce((sum: number, leg: any) => {
            return sum + (leg.distanceMeters || 0);
          }, 0);
        }

        if (route.duration) {
          // Duration is in format "3600s" or can be an object
          if (typeof route.duration === 'string') {
            totalDurationSec = parseInt(route.duration.replace('s', ''), 10);
          } else if (route.duration.seconds) {
            totalDurationSec = parseInt(route.duration.seconds, 10);
          }
        } else if (route.legs) {
          route.legs.forEach((leg: any) => {
            if (leg.duration) {
              if (typeof leg.duration === 'string') {
                totalDurationSec += parseInt(leg.duration.replace('s', ''), 10);
              } else if (leg.duration.seconds) {
                totalDurationSec += parseInt(leg.duration.seconds, 10);
              }
            }
          });
        }

        console.log("🗺️ Routes API v2 - Coordinates:", coordinates.length);
        console.log("🗺️ Routes API v2 - Distance:", totalDistance, "meters");
        console.log("🗺️ Routes API v2 - Duration:", totalDurationSec, "seconds");

        if (mapRef?.current && coordinates.length > 0) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }

        const distanceKm = (totalDistance / 1000).toFixed(1) + " km";
        const durationMin = Math.round(totalDurationSec / 60);

        console.log("✅ Truck Route Summary (Routes API v2):", {
          distance: distanceKm,
          duration: `${durationMin} mins`,
          coordinatesCount: coordinates.length,
        });

        return {
          distance: distanceKm,
          duration: `${durationMin} mins`,
          coordinates,
        };
      } else {
        console.warn("⚠️ Routes API v2 call failed or returned no routes, trying Directions API v1 fallback");

        // Fallback to Directions API v1
        const waypointsParam = waypoints.length > 0 ? `&waypoints=${waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')}` : '';
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&mode=driving&avoid=ferries&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;

        const directionsResponse = await fetch(directionsUrl);
        const directionsData = await directionsResponse.json();

        if (directionsData.status === "OK" && directionsData.routes && directionsData.routes.length > 0) {
          const route = directionsData.routes[0];
          let allCoordinates: RouteCoordinates[] = [];

          for (const leg of route.legs) {
            if (leg.steps && leg.steps.length > 0) {
              for (const step of leg.steps) {
                if (step.polyline && step.polyline.points) {
                  const stepCoordinates = decodePolyline(step.polyline.points);
                  allCoordinates = allCoordinates.concat(stepCoordinates);
                }
              }
            }
          }

          if (allCoordinates.length === 0 && route.overview_polyline) {
            // Overview polyline is less detailed, so optimization is acceptable
            const points = route.overview_polyline.points;
            const rawCoordinates = decodePolyline(points);
            // Only optimize if very long to prevent crashes
            if (rawCoordinates.length > 5000) {
              allCoordinates = optimizeCoordinatesForRendering(rawCoordinates);
            } else {
              allCoordinates = rawCoordinates;
            }
            if (allCoordinates.length < 500) {
              allCoordinates = interpolatePolyline(allCoordinates, 0.0003);
            }
          } else if (allCoordinates.length > 0) {
            // Step-by-step coordinates are already accurate and follow roads - preserve them
            // Only optimize if extremely long to prevent crashes
            if (allCoordinates.length > 10000) {
              console.log(`⚠️ Extremely long step-by-step route (${allCoordinates.length} points), applying minimal optimization`);
              allCoordinates = optimizeCoordinatesForRendering(allCoordinates);
            } else {
              console.log(`✅ Preserving accurate step-by-step coordinates (${allCoordinates.length} points) - no optimization needed`);
            }
            // Don't interpolate step-by-step coordinates as they're already accurate
          }

          const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
          const totalDurationSec = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
          const distanceKm = (totalDistance / 1000).toFixed(1) + " km";
          const durationMin = Math.round(totalDurationSec / 60);

          return {
            distance: distanceKm,
            duration: `${durationMin} mins`,
            coordinates: allCoordinates,
          };
        }

        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching truck route:", error);
      return null;
    }
  };
  // Function to get complete route with waypoints (driver → pickup → drop-off)
  // Uses Routes API v2 for maximum accuracy
  const getCompleteRouteWithWaypoints = async (
    driverLocation: { latitude: number; longitude: number },
    pickupLocation: { latitude: number; longitude: number },
    dropoffLocation: { latitude: number; longitude: number }
  ): Promise<{
    pickupRoute: RouteInfo | null;
    deliveryRoute: RouteInfo | null;
    completeRoute: RouteInfo | null;
  }> => {
    try {
      console.log("🗺️ Fetching complete route with waypoints using Routes API v2...");

      // Get individual routes for pickup and delivery
      const pickupRoute = await getRouteFromDirectionsAPI(
        driverLocation,
        pickupLocation
      );
      const deliveryRoute = await getRouteFromDirectionsAPI(
        pickupLocation,
        dropoffLocation
      );

      // Use Routes API v2 for complete route with waypoints (more accurate)
      const body = {
        origin: {
          location: { latLng: { latitude: driverLocation.latitude, longitude: driverLocation.longitude } },
        },
        destination: {
          location: { latLng: { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude } },
        },
        intermediates: [{
          location: { latLng: { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude } },
        }],
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE_OPTIMAL",
        routeModifiers: {
          avoidTolls: false,
          avoidFerries: true,
          avoidHighways: false,
          vehicleInfo: {
            vehicleType: "TRUCK",
            heightMeters: 4.2,
            widthMeters: 2.5,
            lengthMeters: 12,
            weightKilograms: 10000,
          },
        },
        polylineQuality: "HIGH_QUALITY",
        computeAlternativeRoutes: false,
        // Request detailed step-by-step polylines for maximum accuracy
        fieldMask: "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs,routes.legs.polyline.encodedPolyline,routes.legs.steps,routes.legs.steps.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration",
        languageCode: "en",
        units: "METRIC",
      };

      const routesApiUrl = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${GOOGLE_MAPS_API_KEY}`;

      console.log("🗺️ Routes API v2 Request Body (complete route):", JSON.stringify(body, null, 2));

      const response = await fetch(routesApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': body.fieldMask,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      console.log("🗺️ Routes API v2 Response (complete route):", data);

      let completeRoute: RouteInfo | null = null;

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        // Extract coordinates with maximum accuracy - use step-by-step polylines
        let allCoordinates: RouteCoordinates[] = [];

        // PRIORITY: Extract from individual steps for maximum accuracy
        if (route.legs && route.legs.length > 0) {
          for (const leg of route.legs) {
            if (leg.steps && leg.steps.length > 0) {
              // Use step-by-step polylines for highest accuracy
              for (const step of leg.steps) {
                if (step.polyline && step.polyline.encodedPolyline) {
                  const stepCoordinates = decodePolyline(step.polyline.encodedPolyline);
                  allCoordinates = allCoordinates.concat(stepCoordinates);
                }
              }
            } else if (leg.polyline && leg.polyline.encodedPolyline) {
              // Fallback to leg polyline if steps not available
              const legCoordinates = decodePolyline(leg.polyline.encodedPolyline);
              allCoordinates = allCoordinates.concat(legCoordinates);
            }
          }

          if (allCoordinates.length > 0) {
            console.log(`✅ Using detailed step-by-step coordinates for complete route: ${allCoordinates.length} points`);
            // Step-by-step coordinates are already accurate and follow roads - only optimize if extremely long to prevent crashes
            // DO NOT apply smoothing as it creates straight-line segments and destroys path accuracy
            if (allCoordinates.length > 10000) {
              console.log(`⚠️ Extremely long step-by-step route (${allCoordinates.length} points), applying minimal optimization`);
              allCoordinates = optimizeCoordinatesForRendering(allCoordinates);
            } else {
              console.log(`✅ Preserving accurate step-by-step coordinates (${allCoordinates.length} points) - no optimization needed`);
            }
          }
        }

        // Fallback to route-level polyline if no step/leg data
        if (allCoordinates.length === 0 && route.polyline && route.polyline.encodedPolyline) {
          const polylineString = route.polyline.encodedPolyline;
          allCoordinates = decodePolyline(polylineString);
          console.log(`✅ Using route-level polyline for complete route: ${allCoordinates.length} points`);
          if (allCoordinates.length > 5000) {
            allCoordinates = optimizeCoordinatesForRendering(allCoordinates);
          }
        }

        // Extract distance and duration from Routes API v2
        let totalDistance = 0;
        let totalDurationSec = 0;

        if (route.distanceMeters) {
          totalDistance = route.distanceMeters;
        } else if (route.legs) {
          totalDistance = route.legs.reduce((sum: number, leg: any) => {
            return sum + (leg.distanceMeters || 0);
          }, 0);
        }

        if (route.duration) {
          if (typeof route.duration === 'string') {
            totalDurationSec = parseInt(route.duration.replace('s', ''), 10);
          } else if (route.duration.seconds) {
            totalDurationSec = parseInt(route.duration.seconds, 10);
          }
        } else if (route.legs) {
          route.legs.forEach((leg: any) => {
            if (leg.duration) {
              if (typeof leg.duration === 'string') {
                totalDurationSec += parseInt(leg.duration.replace('s', ''), 10);
              } else if (leg.duration.seconds) {
                totalDurationSec += parseInt(leg.duration.seconds, 10);
              }
            }
          });
        }

        const distanceKm = (totalDistance / 1000).toFixed(1) + " km";
        const durationMin = Math.round(totalDurationSec / 60);

        completeRoute = {
          distance: distanceKm,
          duration: `${durationMin} mins`,
          coordinates: allCoordinates,
        };

        console.log("🗺️ Complete route calculated (Routes API v2):", {
          totalDistance: completeRoute.distance,
          totalDuration: completeRoute.duration,
          coordinatesCount: allCoordinates.length,
        });
      } else {
        // Fallback to Directions API v1 if Routes API v2 fails
        console.warn("⚠️ Routes API v2 failed, falling back to Directions API v1");
        const originStr = `${driverLocation?.latitude},${driverLocation?.longitude}`;
        const waypointStr = `${pickupLocation?.latitude},${pickupLocation?.longitude}`;
        const destinationStr = `${dropoffLocation?.latitude},${dropoffLocation?.longitude}`;

        const completeUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&waypoints=${waypointStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

        const directionsResponse = await fetch(completeUrl);
        const directionsData = await directionsResponse.json();

        if (directionsData.status === "OK") {
          const route = directionsData.routes[0];
          const leg1 = route.legs[0];
          const leg2 = route.legs[1];

          let allCoordinates: RouteCoordinates[] = [];

          // Extract from step polylines for accuracy
          for (const leg of route.legs) {
            if (leg.steps && leg.steps.length > 0) {
              for (const step of leg.steps) {
                if (step.polyline && step.polyline.points) {
                  const stepCoordinates = decodePolyline(step.polyline.points);
                  allCoordinates = allCoordinates.concat(stepCoordinates);
                }
              }
            }
          }

          // Fallback to overview if no step data
          if (allCoordinates.length === 0 && route.overview_polyline) {
            // Overview polyline is less detailed, so optimization is acceptable
            const rawCoordinates = decodePolyline(route.overview_polyline.points);
            // Only optimize if very long to prevent crashes
            if (rawCoordinates.length > 5000) {
              allCoordinates = optimizeCoordinatesForRendering(rawCoordinates);
            } else {
              allCoordinates = rawCoordinates;
            }
          } else if (allCoordinates.length > 0) {
            // Step-by-step coordinates are already accurate and follow roads - preserve them
            // Only optimize if extremely long to prevent crashes
            if (allCoordinates.length > 10000) {
              console.log(`⚠️ Extremely long step-by-step route (${allCoordinates.length} points), applying minimal optimization`);
              allCoordinates = optimizeCoordinatesForRendering(allCoordinates);
            } else {
              console.log(`✅ Preserving accurate step-by-step coordinates (${allCoordinates.length} points) - no optimization needed`);
            }
          }

          const totalDistance = leg1.distance.value + leg2.distance.value;
          const totalDuration = leg1.duration.value + leg2.duration.value;

          completeRoute = {
            distance: `${Math.round(totalDistance / 1000)} km`,
            duration: `${Math.round(totalDuration / 60)} min`,
            coordinates: allCoordinates,
          };
        }
      }

      return {
        pickupRoute,
        deliveryRoute,
        completeRoute,
      };
    } catch (error) {
      console.error("🗺️ Error fetching complete route:", error);
      return {
        pickupRoute: null,
        deliveryRoute: null,
        completeRoute: null,
      };
    }
  };

  // Function to decode Google's polyline encoding
  const decodePolyline = (encoded: string): RouteCoordinates[] => {
    const points: RouteCoordinates[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Function to limit coordinates to prevent property storage overflow (critical for long routes)
  const limitCoordinates = (coordinates: RouteCoordinates[], maxPoints: number = 1500): RouteCoordinates[] => {
    if (coordinates.length <= maxPoints) return coordinates;

    const step = Math.ceil(coordinates.length / maxPoints);
    const limited: RouteCoordinates[] = [];

    // Always include first point
    limited.push(coordinates[0]);

    // Sample points evenly
    for (let i = step; i < coordinates.length - step; i += step) {
      limited.push(coordinates[i]);
    }

    // Always include the last point
    if (limited[limited.length - 1] !== coordinates[coordinates.length - 1]) {
      limited.push(coordinates[coordinates.length - 1]);
    }

    console.log(`📍 Limited coordinates from ${coordinates.length} to ${limited.length} points`);
    return limited;
  };

  // Function to simplify polyline using distance-based decimation (faster than Douglas-Peucker)
  // Improved version that preserves important turns and curves
  const simplifyPolyline = (coordinates: RouteCoordinates[], minDistance: number = 0.001): RouteCoordinates[] => {
    if (coordinates.length <= 2) return coordinates;

    const simplified: RouteCoordinates[] = [coordinates[0]];
    let lastPoint = coordinates[0];

    for (let i = 1; i < coordinates.length - 1; i++) {
      const point = coordinates[i];
      const nextPoint = coordinates[i + 1];

      // Calculate distance from last point
      const distance = Math.sqrt(
        Math.pow(point.latitude - lastPoint.latitude, 2) +
        Math.pow(point.longitude - lastPoint.longitude, 2)
      );

      // Calculate angle change to preserve important turns
      const angle1 = Math.atan2(
        point.longitude - lastPoint.longitude,
        point.latitude - lastPoint.latitude
      );
      const angle2 = Math.atan2(
        nextPoint.longitude - point.longitude,
        nextPoint.latitude - point.latitude
      );
      const angleChange = Math.abs(angle2 - angle1);
      const isSharpTurn = angleChange > 0.3; // ~17 degrees

      // Keep point if it's far enough OR if it's a sharp turn (preserve route accuracy)
      if (distance >= minDistance || isSharpTurn) {
        simplified.push(point);
        lastPoint = point;
      }
    }

    // Always include last point
    simplified.push(coordinates[coordinates.length - 1]);

    return simplified;
  };

  // Function to smooth polyline using linear interpolation for smoother rendering
  const smoothPolyline = (coordinates: RouteCoordinates[], smoothingFactor: number = 0.3): RouteCoordinates[] => {
    if (coordinates.length < 3) return coordinates;

    const smoothed: RouteCoordinates[] = [coordinates[0]];

    for (let i = 1; i < coordinates.length - 1; i++) {
      const curr = coordinates[i];
      const next = coordinates[i + 1];

      // Add original point
      smoothed.push(curr);

      // Add interpolated point between current and next for smoother curves
      const interpolated = {
        latitude: curr.latitude + (next.latitude - curr.latitude) * smoothingFactor,
        longitude: curr.longitude + (next.longitude - curr.longitude) * smoothingFactor,
      };
      smoothed.push(interpolated);
    }

    // Always include last point
    smoothed.push(coordinates[coordinates.length - 1]);

    return smoothed;
  };

  // Function to optimize coordinates for rendering (prevents crashes on long routes)
  // Only used when absolutely necessary - preserves accuracy for most routes
  // Now includes smoothing for better visual appearance
  const optimizeCoordinatesForRendering = (coordinates: RouteCoordinates[]): RouteCoordinates[] => {
    if (!coordinates || coordinates.length === 0) {
      console.warn('⚠️ optimizeCoordinatesForRendering: Empty or null coordinates provided');
      return coordinates || [];
    }

    // Always ensure we have at least 2 points (start and end)
    if (coordinates.length < 2) {
      console.warn('⚠️ optimizeCoordinatesForRendering: Less than 2 coordinates, returning as is');
      return coordinates;
    }

    let optimized = [...coordinates];

    // Only optimize if route is extremely long (to prevent crashes)
    // For routes under 5000 points, keep all coordinates for maximum accuracy
    if (optimized.length > 10000) {
      console.log(`⚠️ Extremely long route detected (${optimized.length} points), applying aggressive optimization`);
      // First simplify with minimal threshold to preserve accuracy
      optimized = simplifyPolyline(optimized, 0.0005);
      // Then limit to safe maximum
      optimized = limitCoordinates(optimized, 2000);
      // Apply light smoothing for better appearance
      if (optimized.length > 10) {
        optimized = smoothPolyline(optimized, 0.2);
      }
    }
    // For very long routes (5000-10000 points), use minimal optimization
    else if (optimized.length > 5000) {
      console.log(`📍 Very long route detected (${optimized.length} points), applying minimal optimization`);
      // Use smaller threshold to preserve more detail
      optimized = simplifyPolyline(optimized, 0.0003);
      optimized = limitCoordinates(optimized, 2000);
      // Apply light smoothing for better appearance
      if (optimized.length > 10) {
        optimized = smoothPolyline(optimized, 0.25);
      }
    }
    // For medium routes (1000-5000 points), apply light smoothing for better appearance
    else if (optimized.length > 1000) {
      console.log(`✅ Route has ${optimized.length} points - applying light smoothing for better appearance`);
      optimized = smoothPolyline(optimized, 0.3);
    }
    // For shorter routes, apply smoothing for smoother curves
    else if (optimized.length > 50) {
      optimized = smoothPolyline(optimized, 0.3);
    }
    // For very short routes, return as-is
    else {
      console.log(`✅ Route has ${optimized.length} points - keeping all for maximum accuracy`);
      return optimized; // Return as-is for accuracy
    }

    // Safety check: ensure we always have at least 2 points
    if (optimized.length < 2 && coordinates.length >= 2) {
      console.warn('⚠️ Optimization resulted in less than 2 points, using first and last from original');
      optimized = [coordinates[0], coordinates[coordinates.length - 1]];
    }

    console.log(`✅ Optimized coordinates: ${coordinates.length} → ${optimized.length} points`);
    return optimized;
  };

  // Function to interpolate additional points for smoother polylines (ONLY for short routes)
  const interpolatePolyline = (coordinates: RouteCoordinates[], maxDistance: number = 0.001): RouteCoordinates[] => {
    if (coordinates.length < 2) return coordinates;

    // Don't interpolate if route is already long (would make it worse)
    if (coordinates.length > 500) {
      return coordinates;
    }

    const interpolated: RouteCoordinates[] = [coordinates[0]];

    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];

      // Calculate distance between points
      const distance = Math.sqrt(
        Math.pow(curr.latitude - prev.latitude, 2) +
        Math.pow(curr.longitude - prev.longitude, 2)
      );

      // If distance is too large, interpolate intermediate points
      if (distance > maxDistance) {
        const steps = Math.ceil(distance / maxDistance);
        for (let j = 1; j < steps; j++) {
          const ratio = j / steps;
          interpolated.push({
            latitude: prev.latitude + (curr.latitude - prev.latitude) * ratio,
            longitude: prev.longitude + (curr.longitude - prev.longitude) * ratio,
          });
        }
      }

      interpolated.push(curr);
    }

    return interpolated;
  };


  // Utility function to calculate ETA based on distance and average speed (fallback)
  // Helper function to format duration string to hours and minutes
  const formatDurationToHoursMinutes = (durationString: string | undefined): string => {
    if (!durationString) return "--";

    // Extract minutes from string like "45 mins" or "120 mins"
    const minutesMatch = durationString.match(/(\d+)\s*mins?/i);
    if (minutesMatch) {
      const totalMinutes = parseInt(minutesMatch[1], 10);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    }

    // If format is different, return as is
    return durationString;
  };

  const calculateETA = (
    distance: number,
    averageSpeed: number = 30
  ): string => {
    const timeInHours = distance / averageSpeed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };



  // Cache for routes to prevent unnecessary API calls
  const routeCache = useRef<{
    pickupRoute?: any;
    deliveryRoute?: any;
    driverToDropRoute?: any;
    completeRoute?: any;
    lastJobId?: string;
    lastLocation?: string;
  }>({});

  // Update routes when location or job changes
  const updateRoutes = async () => {
    if (!selectedJob) return;

    const jobToUse = selectedJob;
    // Use appropriate location based on user role
    // For drivers: prefer driverSocketLocation (what shippers see) over currentLocation for consistency
    // For shippers: use trackedDriverLocation from socket
    let driverLocation: { latitude: number; longitude: number };

    if (userRole === "driver") {
      // For drivers: use last valid location if current location is not available
      // Only use initialDriverLocation (from contractParticipants) if we've never received a valid location
      let locationToUse: { latitude: number; longitude: number } | null = null;

      // Priority 1: driverSocketLocation (what shippers see)
      if (driverSocketLocation && driverSocketLocation.latitude && driverSocketLocation.longitude) {
        locationToUse = { latitude: driverSocketLocation.latitude, longitude: driverSocketLocation.longitude };
        // Update last valid location
        lastValidLocationRef.current = driverSocketLocation;
        hasReceivedValidLocationRef.current = true;
      }
      // Priority 2: currentLocation (GPS)
      else if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
        locationToUse = { latitude: currentLocation.latitude, longitude: currentLocation.longitude };
        // Update last valid location
        lastValidLocationRef.current = currentLocation;
        hasReceivedValidLocationRef.current = true;
      }
      // Priority 3: last valid location (if driver stopped but we had a location before)
      else if (lastValidLocationRef.current && hasReceivedValidLocationRef.current) {
        locationToUse = {
          latitude: lastValidLocationRef.current.latitude,
          longitude: lastValidLocationRef.current.longitude
        };
        console.log('📍 Using last valid location (driver stopped):', locationToUse);
      }
      // Priority 4: initialDriverLocation (only on first load, before we've received any valid location)
      else if (initialDriverLocation && !hasReceivedValidLocationRef.current) {
        locationToUse = initialDriverLocation;
        console.log('📍 Using initial location from contractParticipants (first load):', locationToUse);
      }
      // Fallback: default location
      else {
        locationToUse = { latitude: 40.7589, longitude: -73.9851 };
      }

      driverLocation = locationToUse;

      console.log('🗺️ updateRoutes (DRIVER): Using location:', {
        driverSocketLocation: driverSocketLocation ? `${driverSocketLocation.latitude}, ${driverSocketLocation.longitude}` : 'null',
        currentLocation: currentLocation ? `${currentLocation.latitude}, ${currentLocation.longitude}` : 'null',
        lastValidLocation: lastValidLocationRef.current ? `${lastValidLocationRef.current.latitude}, ${lastValidLocationRef.current.longitude}` : 'null',
        initialDriverLocation: initialDriverLocation ? `${initialDriverLocation.latitude}, ${initialDriverLocation.longitude}` : 'null',
        hasReceivedValidLocation: hasReceivedValidLocationRef.current,
        finalLocation: `${driverLocation.latitude}, ${driverLocation.longitude}`
      });
    } else {
      // For shippers, use trackedDriverLocation from socket
      // Fallback to contractParticipants location if available
      const contractLocation = getDriverLocationFromContractParticipants(jobToUse);
      driverLocation = trackedDriverLocation || contractLocation || { latitude: 40.7589, longitude: -73.9851 };
      console.log('🗺️ updateRoutes (SHIPPER): Using trackedDriverLocation:', {
        trackedDriverLocation: trackedDriverLocation ? `${trackedDriverLocation.latitude}, ${trackedDriverLocation.longitude}` : 'null',
        contractLocation: contractLocation ? `${contractLocation.latitude}, ${contractLocation.longitude}` : 'null',
        finalLocation: `${driverLocation.latitude}, ${driverLocation.longitude}`
      });
    }

    // Check if we need to update routes (job changed or significant location change)
    // Use more precise location key (4 decimal places = ~11 meters accuracy)
    const currentJobId = jobToUse.id;
    const currentLocationKey = `${driverLocation?.latitude.toFixed(
      4
    )},${driverLocation.longitude.toFixed(4)}`;

    if (
      routeCache.current.lastJobId === currentJobId &&
      routeCache.current.lastLocation === currentLocationKey &&
      routeCache.current.pickupRoute &&
      routeCache.current.deliveryRoute &&
      routeCache.current.driverToDropRoute
    ) {
      console.log("🗺️ Using cached routes, skipping API calls");

      // Restore cached route data
      if (routeCache.current.pickupRoute) {
        setPickupRouteInfo(routeCache.current.pickupRoute);
      }
      if (routeCache.current.deliveryRoute) {
        setDeliveryRouteInfo(routeCache.current.deliveryRoute);
      }
      if (routeCache.current.driverToDropRoute) {
        setDriverToDropRouteInfo(routeCache.current.driverToDropRoute);
        // Restore distance and ETA from cached route
        const distanceMatch = routeCache.current.driverToDropRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToDelivery(parseFloat(distanceMatch[1]));
        }
        setEtaToDelivery(routeCache.current.driverToDropRoute.duration);
      }
      if (routeCache.current.completeRoute) {
        setCompleteRouteInfo(routeCache.current.completeRoute);
        console.log("🗺️ Restored complete route from cache");
      }
      return;
    }

    console.log("🗺️ Fetching new routes from API");
    // Only show loading for initial load or significant changes
    if (isInitialLoad || !routeCache.current.lastJobId) {
      setIsLoadingRoutes(true);
    }

    let pickupRoute: any = null;
    let deliveryRoute: any = null;
    let driverToDropRoute: any = null;
    let completeRoute: any = null;

    try {
      // Get individual routes first (more reliable)
      const individualPickupRoute = await getRouteFromDirectionsAPI(
        driverLocation,
        {
          latitude: jobToUse.pickupLocation?.lat,
          longitude: jobToUse.pickupLocation?.lng,
        }
      );

      const individualDeliveryRoute = await getRouteFromDirectionsAPI(
        {
          latitude: jobToUse.pickupLocation?.lat,
          longitude: jobToUse.pickupLocation?.lng,
        },
        {
          latitude: jobToUse.dropoffLocation?.lat,
          longitude: jobToUse.dropoffLocation?.lng,
        }
      );

      // Try to get complete route with waypoints as well
      const routeData = await getCompleteRouteWithWaypoints(
        driverLocation,
        {
          latitude: jobToUse.pickupLocation?.lat,
          longitude: jobToUse.pickupLocation?.lng,
        },
        {
          latitude: jobToUse.dropoffLocation?.lat,
          longitude: jobToUse.dropoffLocation?.lng,
        }
      );

      // Set pickup route info - use individual route if complete route fails
      if (routeData.pickupRoute) {
        pickupRoute = routeData.pickupRoute;
        setPickupRouteInfo(pickupRoute);
        // Update distance and ETA from API response
        const distanceMatch = pickupRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToPickup(parseFloat(distanceMatch[1]));
        }
        setEtaToPickup(pickupRoute.duration);
      } else if (individualPickupRoute) {
        // Fallback to individual route
        pickupRoute = individualPickupRoute;
        setPickupRouteInfo(pickupRoute);
        const distanceMatch = pickupRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToPickup(parseFloat(distanceMatch[1]));
        }
        setEtaToPickup(pickupRoute.duration);
      } else {
        // Fallback to straight line calculation
        const pickupDistance = calculateDistance(
          driverLocation?.latitude,
          driverLocation?.longitude,
          jobToUse.pickupLocation?.lat,
          jobToUse.pickupLocation?.lng
        );
        setDistanceToPickup(pickupDistance);
        setEtaToPickup(calculateETA(pickupDistance));
      }

      // Set delivery route info (pickup to drop)
      if (routeData.deliveryRoute) {
        deliveryRoute = routeData.deliveryRoute;
        setDeliveryRouteInfo(deliveryRoute);
      } else if (individualDeliveryRoute) {
        // Fallback to individual route
        deliveryRoute = individualDeliveryRoute;
        setDeliveryRouteInfo(deliveryRoute);
      }

      // Calculate route from driver's current location to drop location
      driverToDropRoute = await getRouteFromDirectionsAPI(
        driverLocation,
        {
          latitude: jobToUse.dropoffLocation?.lat,
          longitude: jobToUse.dropoffLocation?.lng,
        }
      );

      if (driverToDropRoute) {
        setDriverToDropRouteInfo(driverToDropRoute);
        // Update distance and ETA from driver to drop
        const distanceMatch = driverToDropRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToDelivery(parseFloat(distanceMatch[1]));
        }
        setEtaToDelivery(driverToDropRoute.duration);
        console.log("✅ Driver to drop route calculated:", {
          distance: driverToDropRoute.distance,
          duration: driverToDropRoute.duration,
          coordinatesCount: driverToDropRoute.coordinates.length,
        });
      } else {
        // Fallback to straight line calculation from driver to drop
        const driverToDropDistance = calculateDistance(
          driverLocation?.latitude,
          driverLocation?.longitude,
          jobToUse.dropoffLocation?.lat,
          jobToUse.dropoffLocation?.lng
        );
        setDistanceToDelivery(driverToDropDistance);
        setEtaToDelivery(calculateETA(driverToDropDistance));
        console.log("⚠️ Using straight-line distance for driver to drop:", driverToDropDistance);
      }

      // Store complete route for potential future use
      completeRoute = routeData.completeRoute;

      // Set complete route info for map rendering
      if (routeData.completeRoute) {
        setCompleteRouteInfo(routeData.completeRoute);
        console.log("🗺️ Complete route set for map rendering:", {
          coordinatesCount: routeData.completeRoute.coordinates.length,
          distance: routeData.completeRoute.distance,
          duration: routeData.completeRoute.duration,
          firstCoordinate: routeData.completeRoute.coordinates[0],
          lastCoordinate:
            routeData.completeRoute.coordinates[
            routeData.completeRoute.coordinates.length - 1
            ],
        });
      } else {
        console.warn(
          "🗺️ No complete route available, will use individual routes"
        );
      }

      console.log("🗺️ Route data updated:", {
        pickupRoute: !!routeData.pickupRoute,
        deliveryRoute: !!routeData.deliveryRoute,
        completeRoute: !!routeData.completeRoute,
      });
    } catch (error) {
      console.error("Error updating routes:", error);
      // Fallback calculations - use same location logic as main route calculation
      const jobToUse = selectedJob;
      let driverLocation: { latitude: number; longitude: number };

      if (userRole === "driver") {
        driverLocation = driverSocketLocation || currentLocation || { latitude: 40.7589, longitude: -73.9851 };
      } else {
        driverLocation = trackedDriverLocation || { latitude: 40.7589, longitude: -73.9851 };
      }

      const pickupDistance = calculateDistance(
        driverLocation?.latitude,
        driverLocation?.longitude,
        jobToUse.pickupLocation?.lat,
        jobToUse.pickupLocation?.lng
      );
      const deliveryDistance = calculateDistance(
        driverLocation?.latitude,
        driverLocation?.longitude,
        jobToUse.dropoffLocation?.lat,
        jobToUse.dropoffLocation?.lng
      );

      setDistanceToPickup(pickupDistance);
      setDistanceToDelivery(deliveryDistance);
      setEtaToPickup(calculateETA(pickupDistance));
      setEtaToDelivery(calculateETA(deliveryDistance));
    } finally {
      setIsLoadingRoutes(false);
      setIsInitialLoad(false);

      // Update cache with successful results
      routeCache.current = {
        pickupRoute: pickupRoute,
        deliveryRoute: deliveryRoute,
        driverToDropRoute: driverToDropRoute,
        completeRoute: completeRoute,
        lastJobId: currentJobId,
        lastLocation: currentLocationKey,
      };
    }
  };

  // Update map region to fit all markers
  const fitMapToMarkers = () => {
    if (!mapRef.current) return;

    const jobToUse = selectedJob || {
      pickupLocation: { lat: 40.7505, lng: -73.9934 },
      dropoffLocation: { lat: 40.7282, lng: -73.9942 },
    };

    const locationToUse = currentLocation || {
      latitude: 40.7589,
      longitude: -73.9851,
    };

    const coordinates = [
      {
        latitude: locationToUse?.latitude,
        longitude: locationToUse?.longitude,
      },
      {
        latitude: jobToUse.pickupLocation?.lat,
        longitude: jobToUse.pickupLocation?.lng,
      },
      {
        latitude: jobToUse.dropoffLocation?.lat,
        longitude: jobToUse.dropoffLocation?.lng,
      },
    ].filter((coord) => coord?.latitude !== 0 && coord?.longitude !== 0);

    if (coordinates.length === 0) return;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  };

  // Get active jobs for the current user
  const activeJobs = jobs.filter((job) => {
    if (userRole === "driver") {
      return (
        job.assignedDriverId === userProfile?.id &&
        [
          "assigned",
          "in_progress",
          "arrived_pickup",
          "loaded",
          "in_transit",
          "arrived_delivery",
        ].includes(job.status)
      );
    } else {
      return (
        job.merchantId === userProfile?.id &&
        [
          "assigned",
          "in_progress",
          "arrived_pickup",
          "loaded",
          "in_transit",
          "arrived_delivery",
        ].includes(job.status)
      );
    }
  });

  // Mock data for UI demonstration
  const mockActiveJobs: Job[] = [
    {
      id: "mock-1",
      title: "Deliver Electronics to Downtown",
      description:
        "Transport electronic equipment from warehouse to downtown office",
      status: "in_progress",
      payAmount: "150.00",
      currency: "USD",
      assignedDriverId:
        userRole === "driver" ? userProfile?.id || "driver-1" : "driver-19", // Use different driver ID for non-drivers
      merchantId: "merchant-1",
      merchantName: "Tech Solutions Inc.",
      merchantRating: 4.5,
      compensation: 150.0,
      distance: 5.2,
      estimatedDuration: "2 hours",
      cargoType: "Electronics",
      cargoWeight: "150 kg",
      pickupLocation: {
        address: "123 Warehouse St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US",
        lat: 40.7589,
        lng: -73.9851,
        date: "2024-01-15",
        time: "09:00",
      },
      dropoffLocation: {
        address: "456 Business Ave",
        city: "New York",
        state: "NY",
        zipCode: "10002",
        country: "US",
        lat: 40.7505,
        lng: -73.9934,
        date: "2024-01-15",
        time: "11:00",
      },
      requiredTruckType: "Box Truck",
      specialRequirements: "Handle with care - fragile electronics",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Use mock data if no real active jobs
  const displayJobs = activeJobs.length > 0 ? activeJobs : mockActiveJobs;

  // ============================================================================
  // BACKGROUND GEOLOCATION INTEGRATION
  // ============================================================================

  // Start background tracking when driver has an active job
  useEffect(() => {
    if (userRole === "driver" && selectedJob && locationPermission) {
      console.log('🌍 TripTracking: Starting background location tracking for driver');

      const initBackgroundTracking = async () => {
        try {
          await startBackgroundTracking();
          console.log('✅ TripTracking: Background tracking started successfully');

          // Set pace to moving when job is in progress
          if (selectedJob.status === 'in_progress' || selectedJob.status === 'in_transit') {
            await changePace(true);
            console.log('✅ TripTracking: Set pace to MOVING');
          }
        } catch (error) {
          console.error('❌ TripTracking: Failed to start background tracking:', error);
        }
      };

      initBackgroundTracking();

      // Cleanup: stop tracking when component unmounts or job changes
      return () => {
        console.log('🌍 TripTracking: Stopping background tracking');
        stopBackgroundTracking();
      };
    }
  }, [userRole, selectedJob?.id, locationPermission, startBackgroundTracking, stopBackgroundTracking, changePace]);

  // Change pace based on job status
  useEffect(() => {
    if (userRole === "driver" && isBackgroundTracking && selectedJob) {
      const updatePace = async () => {
        try {
          // Set to moving when in transit
          if (selectedJob.status === 'in_progress' || selectedJob.status === 'in_transit') {
            await changePace(true);
            console.log('✅ TripTracking: Updated pace to MOVING');
          }
          // Set to stationary when arrived or loading
          else if (selectedJob.status === 'arrived_pickup' || selectedJob.status === 'arrived_delivery' || selectedJob.status === 'loaded') {
            await changePace(false);
            console.log('✅ TripTracking: Updated pace to STATIONARY');
          }
        } catch (error) {
          console.error('❌ TripTracking: Error updating pace:', error);
        }
      };

      updatePace();
    }
  }, [userRole, selectedJob?.status, isBackgroundTracking, changePace]);
  const sendLiveLocationFunction = async (
    latitude: number | undefined,
    longitude: number | undefined,
    heading?: number
  ) => {
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      console.log("📍 sendLiveLocationFunction: Invalid coordinates, skipping:", { latitude, longitude });
      return;
    }

    // Check if it's the default location
    const isDefaultLocation =
      (latitude === 40.7589 && longitude === -73.9851) ||
      (latitude === 40.7505 && longitude === -73.9934);

    if (isDefaultLocation) {
      console.log("📍 sendLiveLocationFunction: Default location detected, skipping");
      return;
    }

    try {
      // Get latest location from store
      const latestLocation = useLocationStore.getState().currentLocation;
      const finalLat = latestLocation?.latitude || latitude;
      const finalLng = latestLocation?.longitude || longitude;
      const finalHeading = latestLocation?.heading || heading || 0;

      const locationData = {
        lat: finalLat,
        lng: finalLng,
        accuracy: 5.2,
        heading: finalHeading,
        speed: 65.5,
        battery: 85,
        provider: "gps",
      };

      console.log("📍 sendLiveLocationFunction: Sending location to socket:", locationData);
      await sendLiveLocation(locationData);
      console.log("📍 sendLiveLocationFunction: Location sent successfully");
    } catch (err) {
      console.error("❌ Error sending live location:", err);
    }
  };
  // Store previous location to calculate heading
  const previousLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const selectedJobRef = useRef(selectedJob);
  const socketSetupDoneRef = useRef(false);

  // Keep ref in sync with selectedJob
  useEffect(() => {
    selectedJobRef.current = selectedJob;
  }, [selectedJob]);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      let heading = 0;

      // Try to get heading from location data first
      if (currentLocation.heading !== undefined && currentLocation.heading !== null) {
        heading = currentLocation.heading;
        console.log("Using heading from currentLocation:", heading);
      } else if (previousLocationRef.current) {
        // Calculate heading from previous position to current position
        heading = calculateBearing(
          previousLocationRef.current.latitude,
          previousLocationRef.current.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );
        console.log("Calculated heading from movement:", heading);
      } else if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length > 1) {
        // Calculate heading based on route direction
        const driverLocation = getLocationForMap;
        let closestIndex = 0;
        let minDistance = Infinity;

        completeRouteInfo.coordinates.forEach((routePoint, index) => {
          // Skip if routePoint is invalid
          if (!routePoint || routePoint.latitude === undefined || routePoint.longitude === undefined) {
            return;
          }
          const distance = Math.sqrt(
            Math.pow(routePoint.latitude - driverLocation.latitude, 2) +
            Math.pow(routePoint.longitude - driverLocation.longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        if (closestIndex < completeRouteInfo.coordinates.length - 1) {
          const nextPoint = completeRouteInfo.coordinates[closestIndex + 1];
          // Check if nextPoint is valid before using it
          if (nextPoint && nextPoint.latitude !== undefined && nextPoint.longitude !== undefined) {
            heading = calculateBearing(
              driverLocation.latitude,
              driverLocation.longitude,
              nextPoint.latitude,
              nextPoint.longitude
            );
            console.log("Calculated heading from route:", heading);
          }
        }
      }

      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          pitch: 45, // Slight pitch for better 3D view
          heading: heading, // Rotate map so driver direction is upward
          altitude: 1000,
          zoom: 18, // Better zoom level for navigation
        },
        { duration: 1000 }
      );

      // Store current location for next calculation
      previousLocationRef.current = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, currentLocation?.heading, completeRouteInfo]);
  // Timer effect for elapsed time
  useEffect(() => {
    if (tripStarted && !tripPaused && tripStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(
          Math.floor((Date.now() - tripStartTime.getTime()) / 1000)
        );
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tripStarted, tripPaused, tripStartTime]);

  // Cleanup function for live location timeout
  // useEffect(() => {
  //   return () => {
  //     if (liveLocationTimeoutRef.current) {
  //       clearTimeout(liveLocationTimeoutRef.current);
  //       liveLocationTimeoutRef.current = null;
  //     }
  //     if (continuousLocationRef.current) {
  //       clearInterval(continuousLocationRef.current);
  //       continuousLocationRef.current = null;
  //     }
  //     if (locationSendTimeoutRef.current) {
  //       clearTimeout(locationSendTimeoutRef.current);
  //       locationSendTimeoutRef.current = null;
  //     }
  //   };
  // }, []);

  // Location update handler function - wrapped in useCallback to prevent recreation
  const handleLocationUpdate = useCallback((data: any) => {
    console.log('🎯 ========== location_update EVENT RECEIVED ==========');
    console.log('🎯 userRole:', userRole, 'profileId:', profileData?.id);
    console.log('🎯 Event data:', {
      hasLocation: !!(data?.location || data?.lat || data?.latitude),
      userId: data?.userId || data?.location?.userId,
      dataKeys: Object.keys(data || {}),
      timestamp: new Date().toISOString()
    });

    // Extract location data from the nested structure
    const locationData = data.location || data;
    const driverId = locationData.userId || data.userId;
    const latitude = parseFloat(locationData?.lat || locationData?.latitude);
    const longitude = parseFloat(locationData?.lng || locationData?.longitude);

    console.log('📍 location_update event details:', {
      userRole,
      driverId,
      latitude,
      longitude,
      hasLocationData: !!locationData
    });

    // Update driver location on map if we have valid coordinates
    if (
      driverId &&
      latitude &&
      longitude &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      // Different handling based on user role
      if (userRole === "driver") {
        // Driver should process their own location updates from socket
        if (driverId == profileData?.id) {
          // Update driver's location state with socket data
          const newDriverLocation = {
            latitude: latitude,
            longitude: longitude,
            timestamp: new Date(locationData.timestamp).getTime() || Date.now(),
            heading: parseFloat(locationData.heading) || undefined,
          };
          // Store for
          // ging
          setDriverSocketLocation(newDriverLocation);

          // Update the currentLocation state with socket data
          const heading = parseFloat(locationData.heading) || undefined;
          useLocationStore.getState().updateLocation(latitude, longitude, heading);
        }
      } else if (["carrier", "shipper", "broker"].includes(userRole)) {
        // Non-driver users should ONLY process location updates for the assigned driver of the CURRENT trip
        // Use ref to get latest selectedJob without causing callback recreation
        const currentSelectedJob = selectedJobRef.current;

        if (!currentSelectedJob) {
          console.log('📍 Location update ignored: No selected job', {
            driverId,
            userRole
          });
          return;
        }

        // Get driver participant from contractParticipants - this is the source of truth
        let driverParticipant = null;
        let driverParticipantId = null;

        if (currentSelectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants) {
          const participants = currentSelectedJob.jobApplications[0].contracts[0].contractParticipants;
          driverParticipant = participants.find(
            (p: any) => p.role === "driver" && (p.status === "accepted" || p.status === "active")
          );

          if (driverParticipant) {
            // Use userId first, fallback to id, and handle "driver-" prefix
            driverParticipantId = driverParticipant.userId || driverParticipant.id;
            console.log('📍 Found driver participant from contractParticipants:', {
              driverParticipantId,
              participantId: driverParticipant.id,
              participantUserId: driverParticipant.userId,
              participantStatus: driverParticipant.status
            });
          }
        }

        // Fallback to assignedDriverId if no driver participant found
        if (!driverParticipantId) {
          driverParticipantId = currentSelectedJob?.assignedDriverId;
          console.log('📍 Using assignedDriverId as fallback:', driverParticipantId);
        }

        // Only process if we have a driver ID to match against
        if (!driverParticipantId) {
          console.log('📍 Location update ignored: No driver participant or assigned driver found', {
            hasSelectedJob: !!currentSelectedJob,
            hasAssignedDriverId: !!currentSelectedJob?.assignedDriverId,
            hasContractParticipants: !!currentSelectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants,
            driverId,
            jobId: currentSelectedJob?.id
          });
          return;
        }

        // Normalize driver IDs for comparison (handle string/number and "driver-" prefix)
        const normalizeDriverId = (id: any): number | string => {
          if (id === null || id === undefined) return '';
          // Convert to string and remove "driver-" prefix if present
          const idStr = String(id).replace(/^driver-/, '').trim();
          // Try to parse as number
          const numId = Number.parseInt(idStr, 10);
          // Return number if valid, otherwise return string
          return !Number.isNaN(numId) ? numId : idStr;
        };

        const normalizedDriverId = normalizeDriverId(driverId);
        const normalizedDriverParticipantId = normalizeDriverId(driverParticipantId);

        // Check if this location update is for the driver participant of the current trip
        // Compare both as numbers and as strings to handle all cases
        const isMatchingDriver =
          normalizedDriverId === normalizedDriverParticipantId ||
          String(normalizedDriverId) === String(normalizedDriverParticipantId) ||
          Number(normalizedDriverId) === Number(normalizedDriverParticipantId);

        console.log('📍 Location update check - driverParticipant ID vs socket event ID:', {
          socketEventDriverId: driverId,
          normalizedSocketId: normalizedDriverId,
          driverParticipantId: driverParticipantId,
          normalizedParticipantId: normalizedDriverParticipantId,
          isMatch: isMatchingDriver,
          jobId: currentSelectedJob.id,
          comparison: {
            strict: normalizedDriverId === normalizedDriverParticipantId,
            string: String(normalizedDriverId) === String(normalizedDriverParticipantId),
            number: Number(normalizedDriverId) === Number(normalizedDriverParticipantId)
          }
        });

        if (isMatchingDriver) {
          console.log('✅ Location update accepted: driverParticipant ID matches socket event ID', {
            driverId: normalizedDriverId,
            driverParticipantId: normalizedDriverParticipantId,
            jobId: currentSelectedJob.id,
            latitude,
            longitude
          });

          // Store the tracked driver's location
          const newTrackedLocation = {
            latitude: latitude,
            longitude: longitude,
            timestamp: new Date(locationData.timestamp).getTime() || Date.now(),
            heading: parseFloat(locationData.heading) || undefined,
          };

          setTrackedDriverLocation(newTrackedLocation);
        } else {
          console.log('❌ Location update rejected: driverParticipant ID does not match socket event ID', {
            socketEventDriverId: normalizedDriverId,
            driverParticipantId: normalizedDriverParticipantId,
            jobId: currentSelectedJob.id,
            rawSocketId: driverId,
            rawParticipantId: driverParticipantId
          });
        }
      }
    } else {
      console.warn("Invalid location data received:", data);
    }
  }, [userRole, profileData?.id]);

  // TEST: Simple effect to verify useEffect works
  useEffect(() => {
    console.log('🧪 TEST EFFECT: This should ALWAYS run on mount');
    console.log('🧪 If you see this, useEffect hooks are working');
  }, []);

  // IMMEDIATE socket setup - runs immediately after handleLocationUpdate is defined
  // This ensures the listener is set up even if useEffect has issues
  if (!socketSetupDoneRef.current && socketService.isSocketConnected() && profileData?.id && userRole) {
    const socket = socketService.getSocket();
    if (socket && handleLocationUpdate) {
      console.log('🔌 IMMEDIATE: Setting up socket listener in component body');
      console.log('🔌 IMMEDIATE: userRole:', userRole, 'profileId:', profileData?.id);

      // Set up location update listener
      const locationUpdateWrapper = (data: any) => {
        console.log('🎯 IMMEDIATE location_update wrapper called!', {
          userRole,
          timestamp: new Date().toISOString()
        });
        handleLocationUpdate(data);
      };

      // socket.off("location_update", locationUpdateWrapper);
      socket.on("location_update", locationUpdateWrapper);
      console.log('✅ IMMEDIATE: location_update listener registered');

      // Set up onAny
      const onAnyHandler = (eventName: string, ...args: any[]) => {
        if (eventName === 'location_update') {
          console.log('🔔 IMMEDIATE onAny caught location_update!', args[0]);
        }
      };
      socket.onAny(onAnyHandler);

      socketSetupDoneRef.current = true;
      console.log('✅ IMMEDIATE: Socket setup complete');
    }
  }

  // Socket event listeners setup
  useEffect(() => {
    // UNCONDITIONAL LOG - This MUST appear if the effect runs
    console.log('🔌 ========== SOCKET SETUP EFFECT START ==========');
    console.log('🔌 EFFECT EXECUTING - This log should ALWAYS appear');
    console.log('🔌 Effect running - userRole:', userRole, 'profileId:', profileData?.id);
    console.log('🔌 Socket connected?', socketService.isSocketConnected());
    console.log('🔌 Has selectedJob?', !!selectedJob, 'jobId:', selectedJob?.id);
    console.log('🔌 Effect dependencies:', {
      userRole: userRole || 'UNDEFINED',
      profileId: profileData?.id || 'UNDEFINED',
      selectedJobId: selectedJob?.id || 'UNDEFINED',
      selectedJobAssignedDriverId: selectedJob?.assignedDriverId || 'UNDEFINED'
    });

    // CRITICAL: Don't return early - set up listener even if prerequisites aren't perfect
    if (!socketService.isSocketConnected()) {
      console.log('❌ Socket not connected, but will set up listener when connected');
      // Don't return - we want to set up listener anyway
    }

    if (!profileData?.id) {
      console.log('❌ No profileData.id, cannot proceed with room join');
      // Still set up listener, just can't join room
    }

    if (!userRole) {
      console.log('❌ No userRole, cannot proceed with room join');
      // Still set up listener, just can't join room
    }

    // If socket not connected, wait for connection
    if (!socketService.isSocketConnected()) {
      const socket = socketService.getSocket();
      if (socket) {
        const connectHandler = () => {
          console.log('✅ Socket connected, re-running setup');
          // Re-run setup when connected
        };
        socket.once('connect', connectHandler);
        return () => socket.off('connect', connectHandler);
      }
      return;
    }

    // If missing critical data, return but log it
    if (!profileData?.id || !userRole) {
      console.log('❌ Missing critical data, cannot set up socket');
      return;
    }

    // Set up location update listener FIRST - this should work even without selectedJob
    const socket = socketService.getSocket();
    if (!socket) {
      console.log('❌ Socket instance not available');
      return;
    }

    console.log('📍 Setting up location_update listener for user role:', userRole);
    console.log('📍 Socket ID:', socket.id, 'Connected:', socket.connected);

    // Check existing listeners
    const existingListeners = socket.listeners('location_update');
    console.log('🔍 Existing location_update listeners before setup:', existingListeners.length);

    // Remove any existing listener first to prevent duplicates
    socket.off("location_update", handleLocationUpdate);

    // Add the listener with a unique wrapper to ensure it's called
    const locationUpdateWrapper = (data: any) => {
      console.log('🎯 Component location_update wrapper called!', {
        userRole,
        timestamp: new Date().toISOString(),
        dataKeys: Object.keys(data || {})
      });
      handleLocationUpdate(data);
    };

    socket.on("location_update", locationUpdateWrapper);
    console.log('✅ location_update listener registered for:', userRole);

    const listenersAfter = socket.listeners('location_update');
    console.log('🔍 Total location_update listeners after setup:', listenersAfter.length);

    // Also set up onAny for debugging - catch ALL socket events
    const onAnyHandler = (eventName: string, ...args: any[]) => {
      console.log('🔔 Socket onAny - Event received:', eventName, {
        argsCount: args.length,
        firstArgKeys: args[0] ? Object.keys(args[0]) : [],
        timestamp: new Date().toISOString()
      });

      if (eventName === 'location_update') {
        console.log('🔔 onAny caught location_update event!', {
          eventName,
          argsCount: args.length,
          firstArgKeys: args[0] ? Object.keys(args[0]) : [],
          firstArgPreview: args[0] ? JSON.stringify(args[0]).substring(0, 200) : 'no data',
          timestamp: new Date().toISOString()
        });
      }
    };
    socket.onAny(onAnyHandler);
    console.log('✅ onAny handler registered for debugging - will catch ALL socket events');

    // Now handle room joining (requires selectedJob for non-driver users)
    if (profileData?.id) {
      if (userRole === "driver") {
        // Driver joins their own location room
        const roomData = {
          rooms: `user_location_${profileData?.id}`,
        };
        socketService.emitJoinRoom(roomData);
        console.log('✅ Driver joined own location room:', roomData.rooms);
      } else if (["carrier", "shipper", "broker"].includes(userRole)) {
        // Other roles join the driver's location room to track them
        if (selectedJob) {
          // DEBUG: Log the full selectedJob structure to find driver ID
          console.log('🔍 DEBUG: Full selectedJob structure:', {
            jobId: selectedJob?.id,
            hasJobApplications: !!selectedJob?.jobApplications,
            jobApplicationsLength: selectedJob?.jobApplications?.length || 0,
            hasContracts: !!selectedJob?.jobApplications?.[0]?.contracts,
            contractsLength: selectedJob?.jobApplications?.[0]?.contracts?.length || 0,
            hasContractParticipants: !!selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants,
            contractParticipantsLength: selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.length || 0,
            assignedDriverId: selectedJob?.assignedDriverId,
            selectedJobKeys: Object.keys(selectedJob || {}),
            firstJobApplicationKeys: selectedJob?.jobApplications?.[0] ? Object.keys(selectedJob.jobApplications[0]) : [],
            firstContractKeys: selectedJob?.jobApplications?.[0]?.contracts?.[0] ? Object.keys(selectedJob.jobApplications[0].contracts[0]) : []
          });

          // Get driver participant ID from contractParticipants (source of truth)
          let driverParticipantId = null;

          // Try multiple paths to find driver
          // Path 1: contractParticipants
          if (selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants) {
            const participants = selectedJob.jobApplications[0].contracts[0].contractParticipants;
            console.log('🔌 Contract participants found:', participants.length);
            console.log('🔌 All participants:', participants.map((p: any) => ({
              id: p.id,
              userId: p.userId,
              role: p.role,
              status: p.status
            })));

            const driverParticipant = participants.find(
              (p: any) => p.role === "driver" && (p.status === "accepted" || p.status === "active" || p.status === "assigned")
            );
            if (driverParticipant) {
              driverParticipantId = driverParticipant.userId || driverParticipant.id;
              console.log('✅ Found driver participant ID for socket room:', {
                driverParticipantId,
                participantId: driverParticipant.id,
                participantUserId: driverParticipant.userId,
                participantStatus: driverParticipant.status
              });
            } else {
              console.log('⚠️ No driver participant found in contractParticipants');
            }
          } else {
            console.log('⚠️ No contractParticipants found in selectedJob');
          }

          // Path 2: Check all contracts for driver
          if (!driverParticipantId && selectedJob?.jobApplications?.[0]?.contracts) {
            for (const contract of selectedJob.jobApplications[0].contracts) {
              if (contract?.contractParticipants) {
                const driverParticipant = contract.contractParticipants.find(
                  (p: any) => p.role === "driver" && (p.status === "accepted" || p.status === "active" || p.status === "assigned")
                );
                if (driverParticipant) {
                  driverParticipantId = driverParticipant.userId || driverParticipant.id;
                  console.log('✅ Found driver in alternative contract:', driverParticipantId);
                  break;
                }
              }
              // Also check hiredUserId in contract
              if (contract?.hiredUserId && !driverParticipantId) {
                console.log('🔍 Found hiredUserId in contract:', contract.hiredUserId);
                // Check if this user is a driver by looking at their role
                const hiredUserParticipant = contract?.contractParticipants?.find(
                  (p: any) => (p.userId === contract.hiredUserId || p.id === contract.hiredUserId) && p.role === "driver"
                );
                if (hiredUserParticipant) {
                  driverParticipantId = contract.hiredUserId;
                  console.log('✅ Using hiredUserId as driver:', driverParticipantId);
                }
              }
            }
          }

          // Path 3: Check jobApplications directly for applicantUserId with driver role
          if (!driverParticipantId && selectedJob?.jobApplications) {
            for (const application of selectedJob.jobApplications) {
              if (application?.applicantUserId && application?.applicantRole === "driver") {
                driverParticipantId = application.applicantUserId;
                console.log('✅ Found driver in jobApplication applicantUserId:', driverParticipantId);
                break;
              }
            }
          }

          // Fallback to assignedDriverId if no driver participant found
          if (!driverParticipantId) {
            driverParticipantId = selectedJob?.assignedDriverId;
            console.log('📍 Using assignedDriverId as fallback for socket room:', driverParticipantId);
          }

          if (driverParticipantId) {
            // Ensure driverParticipantId is a string (required by emitJoinTrackingRoom)
            const driverIdString = String(driverParticipantId).replace(/^driver-/, '');

            console.log('📍 Joining tracking room for job:', {
              jobId: selectedJob?.id,
              driverParticipantId: driverParticipantId,
              driverIdString: driverIdString,
              userRole,
              userId: profileData.id,
              roomName: `user_location_${driverIdString}`
            });

            const success = socketService.emitJoinTrackingRoom(
              driverIdString,
              userRole,
              profileData.id,
              selectedJob?.id
            );
            console.log('✅ Join tracking room result:', success);

            // Also verify the room was joined by checking socket rooms
            setTimeout(() => {
              console.log('🔍 Verifying room join - checking socket state');
              console.log('🔍 Socket connected:', socket.connected);
              console.log('🔍 Socket ID:', socket.id);
            }, 1000);
          } else {
            console.log('❌ No driver participant ID found, cannot join tracking room:', {
              jobId: selectedJob?.id,
              hasSelectedJob: !!selectedJob,
              hasContractParticipants: !!selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants
            });
          }
        } else {
          console.log('⚠️ No selectedJob yet for non-driver user, listener is ready but room not joined');
          console.log('⚠️ Will join room when selectedJob becomes available');
        }
      }
    }

    // Cleanup: remove listener when effect re-runs or component unmounts
    return () => {
      console.log('📍 Cleaning up location_update listener');
      socket.off("location_update", locationUpdateWrapper);
      socket.offAny(onAnyHandler);
    };
  }, [userRole, profileData?.id, selectedJob?.id, selectedJob?.assignedDriverId, handleLocationUpdate]);

  // SEPARATE EFFECT: Join tracking room when selectedJob becomes available
  // This ensures we join the room even if selectedJob loads after the main effect runs
  useEffect(() => {
    if (!socketService.isSocketConnected()) {
      return;
    }

    if (!profileData?.id || !userRole) {
      return;
    }

    // Only for non-driver users
    if (!["carrier", "shipper", "broker"].includes(userRole)) {
      return;
    }

    if (!selectedJob) {
      console.log('⚠️ Room join effect: No selectedJob yet');
      return;
    }

    console.log('🔌 ========== ROOM JOIN EFFECT (selectedJob changed) ==========');
    console.log('🔌 selectedJob.id:', selectedJob?.id);

    const socket = socketService.getSocket();
    if (!socket) {
      console.log('❌ Room join effect: Socket instance not available');
      return;
    }

    // DEBUG: Log the full selectedJob structure to find driver ID
    console.log('🔍 DEBUG: Full selectedJob structure:', {
      jobId: selectedJob?.id,
      hasJobApplications: !!selectedJob?.jobApplications,
      jobApplicationsLength: selectedJob?.jobApplications?.length || 0,
      hasContracts: !!selectedJob?.jobApplications?.[0]?.contracts,
      contractsLength: selectedJob?.jobApplications?.[0]?.contracts?.length || 0,
      hasContractParticipants: !!selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants,
      contractParticipantsLength: selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.length || 0,
      assignedDriverId: selectedJob?.assignedDriverId,
      selectedJobKeys: Object.keys(selectedJob || {}),
      firstJobApplicationKeys: selectedJob?.jobApplications?.[0] ? Object.keys(selectedJob.jobApplications[0]) : [],
      firstContractKeys: selectedJob?.jobApplications?.[0]?.contracts?.[0] ? Object.keys(selectedJob.jobApplications[0].contracts[0]) : []
    });

    // Get driver participant ID from contractParticipants (source of truth)
    let driverParticipantId = null;

    // Try multiple paths to find driver
    // Path 1: contractParticipants
    if (selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants) {
      const participants = selectedJob.jobApplications[0].contracts[0].contractParticipants;
      console.log('🔌 Contract participants found:', participants.length);
      console.log('🔌 All participants:', participants.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        status: p.status
      })));

      const driverParticipant = participants.find(
        (p: any) => p.role === "driver" && (p.status === "accepted" || p.status === "active" || p.status === "assigned")
      );
      if (driverParticipant) {
        driverParticipantId = driverParticipant.userId || driverParticipant.id;
        console.log('✅ Found driver participant ID for socket room:', {
          driverParticipantId,
          participantId: driverParticipant.id,
          participantUserId: driverParticipant.userId,
          participantStatus: driverParticipant.status
        });
      } else {
        console.log('⚠️ No driver participant found in contractParticipants');
      }
    } else {
      console.log('⚠️ No contractParticipants found in selectedJob');
    }

    // Path 2: Check all contracts for driver
    if (!driverParticipantId && selectedJob?.jobApplications?.[0]?.contracts) {
      for (const contract of selectedJob.jobApplications[0].contracts) {
        if (contract?.contractParticipants) {
          const driverParticipant = contract.contractParticipants.find(
            (p: any) => p.role === "driver" && (p.status === "accepted" || p.status === "active" || p.status === "assigned")
          );
          if (driverParticipant) {
            driverParticipantId = driverParticipant.userId || driverParticipant.id;
            console.log('✅ Found driver in alternative contract:', driverParticipantId);
            break;
          }
        }
        // Also check hiredUserId in contract
        if (contract?.hiredUserId && !driverParticipantId) {
          console.log('🔍 Found hiredUserId in contract:', contract.hiredUserId);
          // Check if this user is a driver by looking at their role
          const hiredUserParticipant = contract?.contractParticipants?.find(
            (p: any) => (p.userId === contract.hiredUserId || p.id === contract.hiredUserId) && p.role === "driver"
          );
          if (hiredUserParticipant) {
            driverParticipantId = contract.hiredUserId;
            console.log('✅ Using hiredUserId as driver:', driverParticipantId);
          }
        }
      }
    }

    // Path 3: Check jobApplications directly for applicantUserId with driver role
    if (!driverParticipantId && selectedJob?.jobApplications) {
      for (const application of selectedJob.jobApplications) {
        if (application?.applicantUserId && application?.applicantRole === "driver") {
          driverParticipantId = application.applicantUserId;
          console.log('✅ Found driver in jobApplication applicantUserId:', driverParticipantId);
          break;
        }
      }
    }

    // Fallback to assignedDriverId if no driver participant found
    if (!driverParticipantId) {
      driverParticipantId = selectedJob?.assignedDriverId;
      console.log('📍 Using assignedDriverId as fallback for socket room:', driverParticipantId);
    }

    if (driverParticipantId) {
      // Ensure driverParticipantId is a string (required by emitJoinTrackingRoom)
      const driverIdString = String(driverParticipantId).replace(/^driver-/, '');

      console.log('📍 Joining tracking room for job (from room join effect):', {
        jobId: selectedJob?.id,
        driverParticipantId: driverParticipantId,
        driverIdString: driverIdString,
        userRole,
        userId: profileData.id,
        roomName: `user_location_${driverIdString}`
      });

      const success = socketService.emitJoinTrackingRoom(
        driverIdString,
        userRole,
        profileData.id,
        selectedJob?.id
      );
      console.log('✅ Join tracking room result (from room join effect):', success);
    } else {
      console.log('❌ Room join effect: No driver participant ID found, cannot join tracking room:', {
        jobId: selectedJob?.id,
        hasSelectedJob: !!selectedJob,
        hasContractParticipants: !!selectedJob?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants,
        fullJobStructure: JSON.stringify(selectedJob, null, 2).substring(0, 500)
      });
    }
  }, [selectedJob, userRole, profileData?.id]);

  // Update distances and ETAs when location or selected job changes - with debouncing
  useEffect(() => {
    const locationToUse = getLocationForMap;

    // Show local loading indicator for location updates
    if (locationToUse) {
      setIsLocationUpdating(true);
    }

    // Debounce location updates to prevent frequent API calls
    const debounceTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;

      const jobToUse = selectedJob || {
        pickupLocation: { lat: 40.7505, lng: -73.9934 },
        dropoffLocation: { lat: 40.7282, lng: -73.9942 },
      };

      const locationForMap = getLocationForMap;

      // Note: Map region is only set on initial load (hasInitializedMap)
      // User can manually pan/zoom and use recenter button if needed
      // This prevents continuous automatic zooming

      // Only update routes if job changed or if it's the first time
      if (selectedJob) {
        console.log("🗺️ Updating routes due to job/location change");
        updateRoutes();
      }

      // Hide location updating indicator after a short delay
      setTimeout(() => {
        setIsLocationUpdating(false);
      }, 1000);
    }, 3000); // Debounce for 3 seconds to reduce API calls

    return () => clearTimeout(debounceTimeout);
  }, [currentLocation, trackedDriverLocation, selectedJob, userRole]);

  // Update map when tracked driver location changes (for non-driver users)
  // Rotate map to keep driver direction upward
  useEffect(() => {
    if (trackedDriverLocation && userRole !== "driver" && mapRef.current) {
      // Update routes when tracked driver location changes
      if (selectedJob) {
        updateRoutes();
      }

      let heading = 0;

      // Try to get heading from tracked location data first
      if (trackedDriverLocation.heading !== undefined && trackedDriverLocation.heading !== null) {
        heading = trackedDriverLocation.heading;
      } else if (previousLocationRef.current) {
        // Calculate heading from previous position to current position
        heading = calculateBearing(
          previousLocationRef.current.latitude,
          previousLocationRef.current.longitude,
          trackedDriverLocation.latitude,
          trackedDriverLocation.longitude
        );
      } else if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length > 1) {
        // Calculate heading based on route direction
        let closestIndex = 0;
        let minDistance = Infinity;

        completeRouteInfo.coordinates.forEach((routePoint, index) => {
          // Skip if routePoint is invalid
          if (!routePoint || routePoint.latitude === undefined || routePoint.longitude === undefined) {
            return;
          }
          const distance = Math.sqrt(
            Math.pow(routePoint.latitude - trackedDriverLocation.latitude, 2) +
            Math.pow(routePoint.longitude - trackedDriverLocation.longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        if (closestIndex < completeRouteInfo.coordinates.length - 1) {
          const nextPoint = completeRouteInfo.coordinates[closestIndex + 1];
          // Check if nextPoint is valid before using it
          if (nextPoint && nextPoint.latitude !== undefined && nextPoint.longitude !== undefined) {
            heading = calculateBearing(
              trackedDriverLocation.latitude,
              trackedDriverLocation.longitude,
              nextPoint.latitude,
              nextPoint.longitude
            );
          }
        }
      }

      // Update map camera with rotation
      mapRef.current.animateCamera(
        {
          center: {
            latitude: trackedDriverLocation.latitude,
            longitude: trackedDriverLocation.longitude,
          },
          pitch: 45, // Slight pitch for better 3D view
          heading: heading, // Rotate map so driver direction is upward
          altitude: 1000,
          zoom: 18,
        },
        { duration: 500 } // Smooth rotation
      );

      // Store current location for next calculation
      previousLocationRef.current = {
        latitude: trackedDriverLocation.latitude,
        longitude: trackedDriverLocation.longitude,
      };
    }
  }, [trackedDriverLocation, userRole, completeRouteInfo, selectedJob]);

  // Update map when driver's own location changes (for driver users)
  // Rotate map to keep driver direction upward
  // Only update if user hasn't manually interacted with the map
  useEffect(() => {
    if (currentLocation && userRole === "driver" && mapRef.current && !hasUserInteractedWithMapRef.current) {
      console.log(
        "📍 TripTracking: Driver location updated:",
        currentLocation
      );

      let heading = 0;

      // Try to get heading from location data first
      if (currentLocation.heading !== undefined && currentLocation.heading !== null) {
        heading = currentLocation.heading;
      } else if (previousLocationRef.current) {
        // Calculate heading from previous position to current position
        heading = calculateBearing(
          previousLocationRef.current.latitude,
          previousLocationRef.current.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );
      } else if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length > 1) {
        // Calculate heading based on route direction
        const driverLocation = getLocationForMap;
        let closestIndex = 0;
        let minDistance = Infinity;

        completeRouteInfo.coordinates.forEach((routePoint, index) => {
          // Skip if routePoint is invalid
          if (!routePoint || routePoint.latitude === undefined || routePoint.longitude === undefined) {
            return;
          }
          const distance = Math.sqrt(
            Math.pow(routePoint.latitude - driverLocation.latitude, 2) +
            Math.pow(routePoint.longitude - driverLocation.longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        if (closestIndex < completeRouteInfo.coordinates.length - 1) {
          const nextPoint = completeRouteInfo.coordinates[closestIndex + 1];
          // Check if nextPoint is valid before using it
          if (nextPoint && nextPoint.latitude !== undefined && nextPoint.longitude !== undefined) {
            heading = calculateBearing(
              driverLocation.latitude,
              driverLocation.longitude,
              nextPoint.latitude,
              nextPoint.longitude
            );
          }
        }
      }

      // Update map camera with rotation
      // Only update position and rotation, NOT zoom if user has manually interacted
      const cameraUpdate: any = {
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        pitch: 45, // Slight pitch for better 3D view
        heading: heading, // Rotate map so driver direction is upward
      };

      // Only set zoom/altitude if user hasn't manually interacted
      // This preserves user's manual zoom level
      if (!hasUserInteractedWithMapRef.current) {
        cameraUpdate.altitude = 1000;
        cameraUpdate.zoom = 18;
      }

      mapRef.current.animateCamera(
        cameraUpdate,
        { duration: 500 } // Smooth rotation
      );

      // Store current location for next calculation
      previousLocationRef.current = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
    }
  }, [currentLocation, userRole, completeRouteInfo, getLocationForMap]);

  // Clear tracked driver location when job changes (for non-driver users)
  useEffect(() => {
    if (userRole !== "driver" && selectedJob) {
      // Clear previous driver location when switching to a new job
      setTrackedDriverLocation(null);
      console.log('📍 Cleared tracked driver location for new job:', selectedJob.id);
    }
  }, [selectedJob?.id, userRole]);

  // Fit map to markers when job changes
  useEffect(() => {
    setTimeout(() => {
      fitMapToMarkers();
    }, 1000);
  }, [selectedJob]);

  // Initialize with passed job or first available job
  useEffect(() => {
    if (passedJob) {
      setSelectedJob(passedJob);
    } else if (displayJobs.length > 0 && !selectedJob) {
      setSelectedJob(displayJobs[0]);
    }
  }, [passedJob, displayJobs, selectedJob]);

  // Check if driver is within pickup radius
  useEffect(() => {
    if (
      userRole === "driver" &&
      currentLocation &&
      currentLocation.latitude &&
      currentLocation.longitude &&
      selectedJob &&
      selectedJob.pickupLocation &&
      selectedJob.pickupLocation.lat &&
      selectedJob.pickupLocation.lng &&
      !hasShownPreTripButton
    ) {
      const distanceKm = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedJob.pickupLocation.lat,
        selectedJob.pickupLocation.lng
      );

      const distanceMeters = distanceKm * 1000; // Convert to meters
      const withinRadius = distanceMeters <= PICKUP_RADIUS_METERS;

      setIsWithinPickupRadius(withinRadius);

      if (withinRadius) {
        console.log('📍 Driver is within pickup radius:', {
          distanceMeters: distanceMeters.toFixed(2),
          radius: PICKUP_RADIUS_METERS,
          pickupLocation: {
            lat: selectedJob.pickupLocation.lat,
            lng: selectedJob.pickupLocation.lng
          },
          driverLocation: {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude
          }
        });
      }
    } else {
      setIsWithinPickupRadius(false);
    }
  }, [currentLocation, selectedJob, userRole, hasShownPreTripButton, calculateDistance]);

  // Check if driver is within dropoff radius
  useEffect(() => {
    if (
      userRole === "driver" &&
      currentLocation &&
      currentLocation.latitude &&
      currentLocation.longitude &&
      selectedJob &&
      selectedJob.dropoffLocation &&
      selectedJob.dropoffLocation.lat &&
      selectedJob.dropoffLocation.lng &&
      !hasShownPostTripButton
    ) {
      const distanceKm = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedJob.dropoffLocation.lat,
        selectedJob.dropoffLocation.lng
      );

      const distanceMeters = distanceKm * 1000; // Convert to meters
      const withinRadius = distanceMeters <= DROPOFF_RADIUS_METERS;

      setIsWithinDropoffRadius(withinRadius);

      if (withinRadius) {
        console.log('📍 Driver is within dropoff radius:', {
          distanceMeters: distanceMeters.toFixed(2),
          radius: DROPOFF_RADIUS_METERS,
          dropoffLocation: {
            lat: selectedJob.dropoffLocation.lat,
            lng: selectedJob.dropoffLocation.lng
          },
          driverLocation: {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude
          }
        });
      }
    } else {
      setIsWithinDropoffRadius(false);
    }
  }, [currentLocation, selectedJob, userRole, hasShownPostTripButton, calculateDistance]);

  // Handler to navigate to job details for pre-trip photo upload
  const handleNavigateToPreTripPhoto = useCallback(() => {
    if (selectedJob && selectedJob.id) {
      console.log('📍 Navigating to job details for pre-trip photo upload:', selectedJob.id);
      if (hasPreTrip && hasPod1) {
        setHasShownPreTripButton(true);
      }
      (navigation as any).navigate(Routes.JobDetailsScreen, {
        jobId: selectedJob.id
      });
    }
  }, [selectedJob, navigation, hasPreTrip, hasPod1]);

  // Handler to navigate to job details for post-trip photo upload
  const handleNavigateToPostTripPhoto = useCallback(() => {
    if (selectedJob && selectedJob.id) {
      console.log('📍 Navigating to job details for post-trip photo upload:', selectedJob.id);
      if (hasPostTrip && hasPod2) {
        setHasShownPostTripButton(true);
      }
      (navigation as any).navigate(Routes.JobDetailsScreen, {
        jobId: selectedJob.id
      });
    }
  }, [selectedJob, navigation, hasPostTrip, hasPod2]);

  // Monitor currentLocation changes and fetch debug location info
  useEffect(() => {
    if (userRole === "driver") {
      if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
        console.log('✅ TripTracking: currentLocation updated with valid coordinates:', {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          heading: currentLocation.heading,
          timestamp: currentLocation.timestamp,
          isFetchingLocation,
          isDefault: (currentLocation.latitude === 40.7589 && currentLocation.longitude === -73.9851) ||
            (currentLocation.latitude === 40.7505 && currentLocation.longitude === -73.9934)
        });
        // If we have a real location, stop showing the fetching state
        if (isFetchingLocation) {
          setIsFetchingLocation(false);
        }

        // Fetch location info for debug panel
        const fetchDebugLocation = async () => {
          setDebugLocationLoading(true);
          try {
            const locationInfo = await reverseGeocode(
              currentLocation.latitude,
              currentLocation.longitude
            );
            setDebugLocationInfo(locationInfo);
          } catch (error) {
            console.error('Error fetching debug location info:', error);
            setDebugLocationInfo(null);
          } finally {
            setDebugLocationLoading(false);
          }
        };

        fetchDebugLocation();
      } else {
        console.log('⚠️ TripTracking: currentLocation is null or invalid:', {
          currentLocation,
          userRole,
          isFetchingLocation
        });
        setDebugLocationInfo(null);
      }
    }
  }, [currentLocation, userRole, isFetchingLocation]);

  // Get current location when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('📍 TripTracking: Screen focused, getting current location...');
      console.log('📍 TripTracking: Current state - userRole:', userRole, 'locationPermission:', locationPermission, 'currentLocation:', currentLocation);

      if (userRole === "driver") {
        const fetchLocation = async () => {
          setIsFetchingLocation(true);
          try {
            // Request permission first if not granted
            if (!locationPermission) {
              console.log('📍 TripTracking: No location permission, requesting...');
              const granted = await requestLocationPermission();
              console.log('📍 TripTracking: Permission granted:', granted);
              if (!granted) {
                console.log('📍 TripTracking: Permission denied, cannot get location');
                setIsFetchingLocation(false);
                return;
              }
            }

            // Get fresh current position directly in this component
            console.log('📍 TripTracking: Getting current position directly...');
            try {
              await fetchLocationDirectly();
              console.log('📍 TripTracking: Direct location fetch completed');

              // Verify location was set
              await new Promise(resolve => setTimeout(resolve, 300));
              const verifyLocation = directLocation || useLocationStore.getState().currentLocation;
              console.log('📍 TripTracking: Location verification:', verifyLocation);
            } catch (posError) {
              console.error('❌ TripTracking: Error in fetchLocationDirectly:', posError);
              // Fallback to store method
              console.log('📍 TripTracking: Falling back to store method...');
              try {
                await getCurrentPosition();
                await new Promise(resolve => setTimeout(resolve, 500));
                const storeLoc = useLocationStore.getState().currentLocation;
                if (storeLoc) {
                  setDirectLocation(storeLoc);
                  console.log('📍 TripTracking: Using store location as direct location');
                }
              } catch (storeError) {
                console.error('❌ TripTracking: Store method also failed:', storeError);
              }
            }

            // Background tracking will be started automatically by the useEffect hook
            // No need to manually start it here
          } catch (error) {
            console.error('❌ TripTracking: Error fetching location:', error);
          } finally {
            setIsFetchingLocation(false);
          }
        };

        fetchLocation();
      }
    }, [userRole, locationPermission, getCurrentPosition, startLocationTracking, requestLocationPermission])
  );

  // Function to fetch location directly in this component
  const fetchLocationDirectly = useCallback(async (retryCount = 0) => {
    console.log('📍 TripTracking: fetchLocationDirectly called, permission:', locationPermission, 'retry:', retryCount);

    if (!locationPermission) {
      console.log('📍 TripTracking: No permission for direct location fetch, requesting...');
      const granted = await requestLocationPermission();
      if (!granted) {
        console.log('❌ TripTracking: Permission denied');
        return;
      }
    }

    setIsFetchingLocation(true);
    try {
      console.log('📍 TripTracking: Fetching location directly...');

      return new Promise<void>((resolve, reject) => {
        // Try with high accuracy first, then fallback to lower accuracy if timeout
        const useHighAccuracy = retryCount === 0;
        const timeout = useHighAccuracy ? 20000 : 30000; // 20s for high accuracy, 30s for low accuracy

        const options = {
          enableHighAccuracy: useHighAccuracy,
          timeout: timeout,
          maximumAge: useHighAccuracy ? 0 : 60000 // Allow cached location on retry
        };

        console.log('📍 TripTracking: Location options:', options);

        const handleSuccess = (position: any) => {
          console.log('✅ TripTracking: Direct location received:', position.coords);
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            heading: position.coords.heading || undefined,
          };
          setDirectLocation(newLocation);
          console.log('✅ TripTracking: Direct location set in state:', newLocation);
          setIsFetchingLocation(false);
          resolve();
        };

        const handleError = (error: any) => {
          console.error('❌ TripTracking: Direct location error:', error.code, error.message);

          // If timeout and we haven't retried with lower accuracy, try again
          if (error.code === 3 && retryCount === 0) {
            console.log('📍 TripTracking: Timeout with high accuracy, retrying with lower accuracy...');
            setIsFetchingLocation(false);
            fetchLocationDirectly(1).then(resolve).catch(reject);
            return;
          }

          setIsFetchingLocation(false);
          reject(new Error(`Location error: ${error.message} (code: ${error.code})`));
        };

        if (Platform.OS === 'web') {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            options
          );
        } else {
          Geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            options
          );
        }
      });
    } catch (error) {
      console.error('❌ TripTracking: Error in fetchLocationDirectly:', error);
      setIsFetchingLocation(false);
      throw error;
    }
  }, [locationPermission, requestLocationPermission]);

  // Auto-fetch location when permission is granted or when screen loads
  useEffect(() => {
    if (userRole === "driver") {
      console.log('📍 TripTracking: Auto-fetch effect triggered', {
        userRole,
        locationPermission,
        hasDirectLocation: !!directLocation,
        hasStoreLocation: !!storeCurrentLocation
      });

      if (locationPermission && !directLocation) {
        console.log('📍 TripTracking: Permission granted, auto-fetching location directly...');
        fetchLocationDirectly().catch(error => {
          console.error('❌ TripTracking: Auto-fetch error:', error);
        });
      } else if (!locationPermission) {
        console.log('📍 TripTracking: No permission, requesting...');
        requestLocationPermission().then(granted => {
          if (granted) {
            console.log('📍 TripTracking: Permission granted, fetching location...');
            fetchLocationDirectly().catch(error => {
              console.error('❌ TripTracking: Fetch error after permission:', error);
            });
          }
        });
      }
    }
  }, [userRole, locationPermission, directLocation, fetchLocationDirectly, requestLocationPermission, storeCurrentLocation]);

  // Background geolocation handles continuous tracking automatically
  // No need for manual watchPosition when using background geolocation

  // Background geolocation handles auto-start
  // No need for manual startLocationTracking

  // Initial route calculation for all users when component loads
  useEffect(() => {
    if (selectedJob) {
      updateRoutes();
    }
  }, [selectedJob]);

  // Reset route fit ref and user interaction flag when job changes
  useEffect(() => {
    routeFitDoneRef.current = false;
    hasUserInteractedWithMapRef.current = false; // Reset on new job
  }, [selectedJob?.id]);

  // Fit map to route once route is loaded (only once per job)
  // This ensures the entire route is visible on screen
  // Only do this if user hasn't manually interacted with the map
  useEffect(() => {
    if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length >= 2 && !routeFitDoneRef.current && mapRef.current && selectedJob && !hasUserInteractedWithMapRef.current) {
      console.log('📍 Fitting map to complete route:', completeRouteInfo.coordinates.length, 'points');

      // Include all important points: route coordinates, pickup, and dropoff
      const allCoordinates = [
        ...completeRouteInfo.coordinates,
        {
          latitude: selectedJob.pickupLocation?.lat || 0,
          longitude: selectedJob.pickupLocation?.lng || 0,
        },
        {
          latitude: selectedJob.dropoffLocation?.lat || 0,
          longitude: selectedJob.dropoffLocation?.lng || 0,
        },
      ].filter((coord) => coord.latitude !== 0 && coord.longitude !== 0);

      if (allCoordinates.length > 0) {
        // Fit to all coordinates with padding to ensure route is visible
        mapRef.current.fitToCoordinates(allCoordinates, {
          edgePadding: { top: 150, right: 50, bottom: 300, left: 50 },
          animated: true,
        });

        routeFitDoneRef.current = true;
        console.log('✅ Map fitted to route with', allCoordinates.length, 'coordinates');
      }
    }
  }, [completeRouteInfo, selectedJob]);

  // Update routes when tracked driver location is first received (for non-driver users)
  useEffect(() => {
    if (trackedDriverLocation && userRole !== "driver" && selectedJob) {
      updateRoutes();
    }
  }, [trackedDriverLocation, userRole, selectedJob]);

  // Update routes when driverSocketLocation changes (for drivers)
  // This ensures drivers see the same location-based routes that shippers see
  useEffect(() => {
    if (driverSocketLocation && userRole === "driver" && selectedJob) {
      console.log('🗺️ driverSocketLocation changed, updating routes for driver');
      updateRoutes();
    }
  }, [driverSocketLocation, userRole, selectedJob]);

  // Update routes when currentLocation changes significantly (for drivers)
  // This ensures distance and ETA update as the driver moves
  useEffect(() => {
    if (currentLocation && userRole === "driver" && selectedJob) {
      // Check if location has changed significantly (more than ~30 meters)
      // This prevents too frequent route recalculations while still updating regularly
      const lastLocation = routeCache.current.lastLocation;
      if (lastLocation) {
        const [lastLat, lastLng] = lastLocation.split(',').map(parseFloat);

        // Use haversine formula for accurate distance calculation
        const R = 6371000; // Earth radius in meters
        const dLat = (currentLocation.latitude - lastLat) * Math.PI / 180;
        const dLng = (currentLocation.longitude - lastLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lastLat * Math.PI / 180) * Math.cos(currentLocation.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in meters

        // Only update if moved more than 30 meters (reduced from 50m for more frequent updates)
        if (distance < 30) {
          console.log(`🗺️ Location changed by ${distance.toFixed(0)}m, skipping route update (threshold: 30m)`);
          return;
        }

        console.log(`🗺️ Location changed by ${distance.toFixed(0)}m, updating routes`);
      }

      console.log('🗺️ currentLocation changed significantly, updating routes for driver');
      updateRoutes();
    }
  }, [currentLocation?.latitude, currentLocation?.longitude, userRole, selectedJob]);

  // Background geolocation service automatically sends locations to server
  // The service handles debouncing and validation internally
  // Locations are sent via the sendLiveLocation API in background-geolocation-service.tsx

  const handleStartTrip = async () => {
    setTripStarted(true);
    setTripStartTime(new Date());
    setCurrentMilestone(0);

    // Start background tracking if driver
    if (userRole === "driver") {
      try {
        await startBackgroundTracking();
        await changePace(true); // Set to moving
        console.log('✅ Trip started with background tracking');
      } catch (error) {
        console.error('❌ Failed to start background tracking:', error);
      }
    }
  };

  const handlePauseTrip = async () => {
    setTripPaused(!tripPaused);

    // Change pace when pausing/resuming
    if (userRole === "driver") {
      try {
        await changePace(tripPaused); // If currently paused, resume (true), otherwise pause (false)
        console.log(`✅ Trip ${tripPaused ? 'resumed' : 'paused'}`);
      } catch (error) {
        console.error('❌ Failed to change pace:', error);
      }
    }
  };

  const handleStopTrip = async () => {
    setTripStarted(false);
    setTripPaused(false);
    setTripStartTime(null);
    setElapsedTime(0);
    setCurrentMilestone(0);

    // Stop background tracking if driver
    if (userRole === "driver") {
      try {
        await changePace(false); // Set to stationary
        await stopBackgroundTracking();
        console.log('✅ Trip stopped, background tracking stopped');
      } catch (error) {
        console.error('❌ Failed to stop background tracking:', error);
      }
    }
  };

  const handleNextMilestone = () => {
    if (currentMilestone < tripMilestones.length - 1) {
      setCurrentMilestone(currentMilestone + 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const renderMapView = () => {
    const jobToUse = selectedJob || {
      pickupLocation: {
        lat: 40.7505,
        lng: -73.9934,
        address: "456 Business Ave, New York, NY 10002",
      },
      dropoffLocation: {
        lat: 40.7282,
        lng: -73.9942,
        address: "321 Corporate Plaza, Manhattan, NY 10003",
      },
    };

    // Use the coordinates calculated at component level
    const darkMapStyle = [
      {
        elementType: "geometry",
        stylers: [{ color: "#212121" }],
      },
      {
        elementType: "labels.icon",
        stylers: [{ visibility: "on" }],         // icons visible
      },
      {
        elementType: "labels.text.fill",
        stylers: [{ color: "#FFFFFF" }],         // bright text
      },
      {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#000000" }],         // clean outline
      },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#FFFFFF" }],         // POI text visible
      },
      {
        featureType: "poi",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#000000" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#383838" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#FFFFFF" }],         // road names visible
      },
      {
        featureType: "road",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#000000" }],
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#373737" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f2f2f" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#000000" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#FFFFFF" }],         // water labels visible
      },
    ];
    return (
      <View style={styles.mapViewContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          provider={PROVIDER_GOOGLE}
          customMapStyle={darkMapStyle} // ← dark mode applied here
          userInterfaceStyle="dark"
          // showsUserLocation={userRole === "driver"}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
          onMapReady={() => {
            console.log("Trip tracking map is ready!");
            setTimeout(() => {
              if (!hasUserInteractedWithMapRef.current) {
                fitMapToMarkers();
              }
            }, 1000);
          }}
          onRegionChangeComplete={(region) => {
            // Update map region state when region changes
            setMapRegion(region);
          }}
          onPanDrag={() => {
            // User is manually panning/dragging the map
            hasUserInteractedWithMapRef.current = true;
            console.log('📍 User manually panned the map - stopping automatic camera updates');
          }}
          onRegionChange={(region) => {
            // This fires during any region change (including programmatic)
            // We'll detect manual changes by checking if it's not from our programmatic updates
            // The onPanDrag will catch manual interactions
          }}
          onPress={() => {
            // User tapped on the map - mark as interaction
            hasUserInteractedWithMapRef.current = true;
            console.log('📍 User tapped on the map - stopping automatic camera updates');
          }}
        >
          {coordinates.length > 0 ? (
            coordinates.map((coord, index) => {
              console.log("📍 Rendering coord:", coord);
              const getPinColor = () => {
                if (coord.type === "driver") return "#00FF00";
                if (coord.type === "pickup") return Colors.statusDelivered;
                return Colors.info;
              };

              const pinColor = getPinColor();

              // Use custom truck marker for driver
              if (coord.type === "driver") {
                console.log("🚛 Rendering truck marker at coordinates:", {
                  latitude: coord?.latitude,
                  longitude: coord?.longitude,
                  heading: coord?.heading,
                  currentLocation: currentLocation,
                });

                // Calculate bearing for truck direction
                let bearing = 0;
                const jobToUse = selectedJob || {
                  pickupLocation: { lat: 40.7505, lng: -73.9934 },
                  dropoffLocation: { lat: 40.7282, lng: -73.9942 },
                };

                // Use heading from coordinate (already calculated in coordinates array)
                // If not available, calculate from route or location data
                let truckHeading = coord?.heading;
                console.log("truckHeading:", truckHeading);
                // If heading is not available in coord, calculate it
                if ((truckHeading === undefined || truckHeading === null)) {
                  // For drivers, try driver socket location first
                  if (userRole === "driver" && driverSocketLocation?.heading !== undefined && driverSocketLocation.heading !== null) {
                    truckHeading = driverSocketLocation.heading;
                    console.log("Using heading from driverSocketLocation:", truckHeading);
                  } else if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length > 1) {
                    // Find the closest point on the route to the driver
                    let closestIndex = 0;
                    let minDistance = Infinity;

                    for (let i = 0; i < completeRouteInfo.coordinates.length; i++) {
                      const routePoint = completeRouteInfo.coordinates[i];
                      // Skip if routePoint is invalid
                      if (!routePoint || routePoint.latitude === undefined || routePoint.longitude === undefined) {
                        continue;
                      }
                      const distance = Math.sqrt(
                        Math.pow(routePoint.latitude - coord.latitude, 2) +
                        Math.pow(routePoint.longitude - coord.longitude, 2)
                      );
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = i;
                      }
                    }

                    // Calculate bearing to the next point on the route
                    if (closestIndex < completeRouteInfo.coordinates.length - 1) {
                      const nextPoint = completeRouteInfo.coordinates[closestIndex + 1];
                      // Check if nextPoint is valid before using it
                      if (nextPoint && nextPoint.latitude !== undefined && nextPoint.longitude !== undefined) {
                        truckHeading = calculateBearing(
                          coord.latitude,
                          coord.longitude,
                          nextPoint.latitude,
                          nextPoint.longitude
                        );
                        console.log("Calculated heading from route:", truckHeading);
                      }
                    }
                  } else if (jobToUse.pickupLocation) {
                    // Fallback to pickup location if no route available
                    truckHeading = calculateBearing(
                      coord.latitude,
                      coord.longitude,
                      jobToUse.pickupLocation.lat,
                      jobToUse.pickupLocation.lng
                    );
                    console.log("Calculated heading from pickup location:", truckHeading);
                  }
                }

                // Ensure heading is valid (0-360)
                if (truckHeading !== undefined && truckHeading !== null) {
                  truckHeading = (truckHeading + 360) % 360;
                } else {
                  truckHeading = 0; // Default to 0 if still not available
                }

                console.log("🚛 Final truck heading for rotation:", truckHeading, "degrees (userRole:", userRole, ", coord.heading:", coord?.heading, ")");

                return (
                  <MarkerAnimated
                    key={`truck-driver-${index}`}
                    rotation={truckHeading}
                    coordinate={{
                      latitude: coord.latitude,
                      longitude: coord.longitude,
                    }}
                    image={require("../../../assets/longtruck123.png")}
                    flat
                    title={coord.title}
                    description={`${coord.description} `}
                  />
                  //   <Marker
                  //   key={`${coord.type}-${index}`}
                  //   coordinate={{
                  //     latitude: coord?.latitude,
                  //     longitude: coord?.longitude,
                  //   }}
                  //   title={coord.title}
                  //   description={`${coord.description} (Bearing: ${Math.round(bearing)}°)`}
                  //   image={require("../../../assets/longtruck121.png")}

                  // />
                );
              }

              return (
                <Marker
                  key={`${coord.type}-${index}`}
                  coordinate={{
                    latitude: coord?.latitude,
                    longitude: coord?.longitude,
                  }}
                  title={coord.title}
                  description={coord.description}
                  pinColor={pinColor}
                />
              );
            })
          ) : (
            <View>
              <Text style={{ color: 'red', padding: 20 }}>
                No coordinates to display. currentLocation: {JSON.stringify(currentLocation)}
              </Text>
            </View>
          )}

          {/* Complete Route from Driver to Pickup to Delivery (with waypoints) */}
          {completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length >= 2 && (
            <>
              {/* Shadow/outline layer for better visibility */}
              <Polyline
                coordinates={completeRouteInfo.coordinates}
                strokeColor="#000000"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
                miterLimit={10}
                geodesic={false}
                tappable={false}
                zIndex={0}
              />
              {/* Main route line */}
              <Polyline
                coordinates={completeRouteInfo.coordinates}
                strokeColor={Colors.primary}
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
                miterLimit={10}
                geodesic={false}
                tappable={false}
                zIndex={1}
              />
            </>
          )}

          {/* Individual routes if complete route is not available */}
          {!completeRouteInfo &&
            pickupRouteInfo &&
            pickupRouteInfo.coordinates.length >= 2 && (
              <>
                {/* Shadow/outline layer for better visibility */}
                <Polyline
                  coordinates={pickupRouteInfo.coordinates}
                  strokeColor="#000000"
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                  miterLimit={10}
                  geodesic={false}
                  tappable={false}
                  zIndex={0}
                />
                {/* Main route line */}
                <Polyline
                  coordinates={pickupRouteInfo.coordinates}
                  strokeColor={Colors.primary}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                  miterLimit={10}
                  geodesic={false}
                  tappable={false}
                  zIndex={1}
                />
              </>
            )}

          {!completeRouteInfo &&
            deliveryRouteInfo &&
            deliveryRouteInfo.coordinates.length >= 2 && (
              <>
                {/* Shadow/outline layer for better visibility */}
                <Polyline
                  coordinates={deliveryRouteInfo.coordinates}
                  strokeColor="#000000"
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                  miterLimit={10}
                  geodesic={false}
                  tappable={false}
                  zIndex={0}
                />
                {/* Main route line */}
                <Polyline
                  coordinates={deliveryRouteInfo.coordinates}
                  strokeColor={Colors.primary}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                  miterLimit={10}
                  geodesic={false}
                  tappable={false}
                  zIndex={1}
                />
              </>
            )}
        </MapView>

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Debug Info Panel - Shows Current Location */}
        {/* {userRole === "driver" && (
          <View style={styles.debugInfoPanel}>
            <Text style={styles.debugTitle}>🔍 Debug Info</Text>
            <Text style={styles.debugText}>
              Current Lat: {currentLocation?.latitude?.toFixed(6) || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Current Lng: {currentLocation?.longitude?.toFixed(6) || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Map Lat: {mapRegion?.latitude?.toFixed(6)}
            </Text>
            <Text style={styles.debugText}>
              Map Lng: {mapRegion?.longitude?.toFixed(6)}
            </Text>
            <Text style={styles.debugText}>
              Heading: {currentLocation?.heading?.toFixed(0) || 'N/A'}°
            </Text>
            <Text style={styles.debugText}>
              Timestamp: {currentLocation?.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'N/A'}
            </Text>
          </View>
        )} */}

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current) {
                hasUserInteractedWithMapRef.current = true; // Mark as user interaction
                mapRef.current.animateToRegion({
                  ...mapRegion,
                  latitudeDelta: mapRegion?.latitudeDelta * 0.5,
                  longitudeDelta: mapRegion?.longitudeDelta * 0.5,
                });
              }
            }}
          >
            <ZoomIn size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current) {
                hasUserInteractedWithMapRef.current = true; // Mark as user interaction
                mapRef.current.animateToRegion({
                  ...mapRegion,
                  latitudeDelta: mapRegion?.latitudeDelta * 2,
                  longitudeDelta: mapRegion?.longitudeDelta * 2,
                });
              }
            }}
          >
            <ZoomOut size={20} color={Colors.white} />
          </TouchableOpacity>
          {/* Recenter button - Only show for drivers */}
          {userRole === "driver" && (
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={() => {
                const locationToUse = getLocationForMap;
                if (locationToUse && mapRef.current) {
                  let heading = 0;

                  // Get heading from location data or calculate from route
                  if ((locationToUse as any).heading !== undefined && (locationToUse as any).heading !== null) {
                    heading = (locationToUse as any).heading;
                  } else if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length > 1) {
                    let closestIndex = 0;
                    let minDistance = Infinity;

                    completeRouteInfo.coordinates.forEach((routePoint, index) => {
                      // Skip if routePoint is invalid
                      if (!routePoint || routePoint.latitude === undefined || routePoint.longitude === undefined) {
                        return;
                      }
                      const distance = Math.sqrt(
                        Math.pow(routePoint.latitude - locationToUse.latitude, 2) +
                        Math.pow(routePoint.longitude - locationToUse.longitude, 2)
                      );
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = index;
                      }
                    });

                    if (closestIndex < completeRouteInfo.coordinates.length - 1) {
                      const nextPoint = completeRouteInfo.coordinates[closestIndex + 1];
                      // Check if nextPoint is valid before using it
                      if (nextPoint && nextPoint.latitude !== undefined && nextPoint.longitude !== undefined) {
                        heading = calculateBearing(
                          locationToUse.latitude,
                          locationToUse.longitude,
                          nextPoint.latitude,
                          nextPoint.longitude
                        );
                      }
                    }
                  }

                  mapRef.current.animateCamera(
                    {
                      center: {
                        latitude: locationToUse.latitude,
                        longitude: locationToUse.longitude,
                      },
                      pitch: 45,
                      heading: heading,
                      altitude: 1000,
                      zoom: 18,
                    },
                    { duration: 1000 }
                  );
                }
              }}
            >
              <Locate size={20} color={Colors.white} />
            </TouchableOpacity>
          )}

          {/* Find Driver button - Only show for non-driver users */}
          {userRole !== "driver" && trackedDriverLocation && (
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={() => {
                if (trackedDriverLocation && mapRef.current) {
                  let heading = 0;

                  // Get heading from tracked driver location data or calculate from route
                  if (trackedDriverLocation.heading !== undefined && trackedDriverLocation.heading !== null) {
                    heading = trackedDriverLocation.heading;
                  } else if (completeRouteInfo && completeRouteInfo.coordinates && completeRouteInfo.coordinates.length > 1) {
                    let closestIndex = 0;
                    let minDistance = Infinity;

                    completeRouteInfo.coordinates.forEach((routePoint, index) => {
                      // Skip if routePoint is invalid
                      if (!routePoint || routePoint.latitude === undefined || routePoint.longitude === undefined) {
                        return;
                      }
                      const distance = Math.sqrt(
                        Math.pow(routePoint.latitude - trackedDriverLocation.latitude, 2) +
                        Math.pow(routePoint.longitude - trackedDriverLocation.longitude, 2)
                      );
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = index;
                      }
                    });

                    if (closestIndex < completeRouteInfo.coordinates.length - 1) {
                      const nextPoint = completeRouteInfo.coordinates[closestIndex + 1];
                      // Check if nextPoint is valid before using it
                      if (nextPoint && nextPoint.latitude !== undefined && nextPoint.longitude !== undefined) {
                        heading = calculateBearing(
                          trackedDriverLocation.latitude,
                          trackedDriverLocation.longitude,
                          nextPoint.latitude,
                          nextPoint.longitude
                        );
                      }
                    }
                  }

                  mapRef.current.animateCamera(
                    {
                      center: {
                        latitude: trackedDriverLocation.latitude,
                        longitude: trackedDriverLocation.longitude,
                      },
                      pitch: 45,
                      heading: heading,
                      altitude: 1000,
                      zoom: 18,
                    },
                    { duration: 1000 }
                  );
                }
              }}
            >
              <Navigation size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={fitMapToMarkers}
          >
            <Route size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Loading Overlay - Show when fetching location */}
        {(() => {
          const shouldShowLoader = userRole === "driver" && (isFetchingLocation || (!directLocation && !storeCurrentLocation));
          if (userRole === "driver") {
            console.log('📍 Loading overlay check:', {
              shouldShowLoader,
              isFetchingLocation,
              hasDirectLocation: !!directLocation,
              hasStoreLocation: !!storeCurrentLocation,
              userRole
            });
          }
          return shouldShowLoader;
        })() && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Getting your location...</Text>
              <Text style={[styles.loadingText, { fontSize: 12, marginTop: 8, opacity: 0.7 }]}>
                Please ensure location services are enabled
              </Text>
              {!locationPermission && (
                <Text style={[styles.loadingText, { fontSize: 11, marginTop: 4, opacity: 0.6 }]}>
                  Waiting for location permission...
                </Text>
              )}
            </View>
          )}

        {/* Loading Overlay - Only show for initial load or significant changes */}
        {isLoadingRoutes && isInitialLoad && !isFetchingLocation && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading routes...</Text>
          </View>
        )}

        {/* Location Update Indicator - Local loading for location updates */}
        {/* {isLocationUpdating && (
          <View style={styles.locationUpdateIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.locationUpdateText}>Updating location...</Text>
          </View>
        )} */}

        {/* Debug Location Panel */}
        {/* {userRole === "driver" && (
          <View style={styles.debugPanel}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.debugTitle}>📍 Location Debug</Text>
              <TouchableOpacity
                onPress={async () => {
                  console.log('🔄 Manual location refresh triggered');
                  try {
                    if (!locationPermission) {
                      const granted = await requestLocationPermission();
                      if (!granted) {
                        console.log('❌ Permission denied on manual refresh');
                        return;
                      }
                    }
                    await fetchLocationDirectly();
                    // Also update store for consistency
                    if (directLocation) {
                      useLocationStore.getState().updateLocation(
                        directLocation.latitude,
                        directLocation.longitude,
                        directLocation.heading
                      );
                    }
                    await startLocationTracking();
                  } catch (error) {
                    console.error('❌ Error on manual refresh:', error);
                  }
                }}
                style={{
                  backgroundColor: Colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '600' }}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>
            {currentLocation && currentLocation.latitude && currentLocation.longitude ? (
              <>
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Lat: </Text>
                  {currentLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Lng: </Text>
                  {currentLocation.longitude.toFixed(6)}
                </Text>
                {currentLocation.heading !== undefined && (
                  <Text style={styles.debugText}>
                    <Text style={styles.debugLabel}>Heading: </Text>
                    {currentLocation.heading.toFixed(1)}°
                  </Text>
                )}
                {debugLocationLoading ? (
                  <Text style={styles.debugText}>Loading address...</Text>
                ) : debugLocationInfo ? (
                  <Text style={styles.debugText} numberOfLines={2}>
                    <Text style={styles.debugLabel}>Address: </Text>
                    {debugLocationInfo.fullAddress || `${debugLocationInfo.city}, ${debugLocationInfo.state}`}
                  </Text>
                ) : (
                  <Text style={styles.debugText}>Address: Not available</Text>
                )}
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Permission: </Text>
                  {locationPermission ? "✅ Granted" : "❌ Denied"}
                </Text>
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Fetching: </Text>
                  {isFetchingLocation ? "⏳ Yes" : "✅ No"}
                </Text>
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Timestamp: </Text>
                  {currentLocation.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : "N/A"}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.debugText}>❌ No location available</Text>
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Permission: </Text>
                  {locationPermission ? "✅ Granted" : "❌ Denied"}
                </Text>
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Fetching: </Text>
                  {isFetchingLocation ? "⏳ Yes" : "✅ No"}
                </Text>
                <Text style={styles.debugText}>
                  <Text style={styles.debugLabel}>Store Check: </Text>
                  {useLocationStore.getState().currentLocation ? "✅ Has location" : "❌ No location in store"}
                </Text>
                {useLocationStore.getState().currentLocation && (
                  <Text style={styles.debugText}>
                    <Text style={styles.debugLabel}>Store Lat/Lng: </Text>
                    {useLocationStore.getState().currentLocation?.latitude?.toFixed(6)}, {useLocationStore.getState().currentLocation?.longitude?.toFixed(6)}
                  </Text>
                )}
              </>
            )}
          </View>
        )} */}

        {/* Trip Status Overlay */}

        {/* Map Apps Buttons - Bottom Right Corner */}
        <View style={styles.mapAppsContainer}>
          {/* Open in Google Maps button - Show for all users */}
          <TouchableOpacity
            style={styles.mapAppButton}
            onPress={() => {
              if (!selectedJob) return;

              const pickupLat = selectedJob.pickupLocation?.lat;
              const pickupLng = selectedJob.pickupLocation?.lng;
              const dropoffLat = selectedJob.dropoffLocation?.lat;
              const dropoffLng = selectedJob.dropoffLocation?.lng;

              if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
                return;
              }

              // Get current location for origin (if available)
              let originLat = pickupLat;
              let originLng = pickupLng;

              if (userRole === "driver" && currentLocation?.latitude && currentLocation?.longitude) {
                originLat = currentLocation.latitude;
                originLng = currentLocation.longitude;
              } else if (userRole !== "driver" && trackedDriverLocation) {
                originLat = trackedDriverLocation.latitude;
                originLng = trackedDriverLocation.longitude;
              } else if (initialDriverLocation) {
                originLat = initialDriverLocation.latitude;
                originLng = initialDriverLocation.longitude;
              }

              // Build Google Maps URL
              // For Android, use the web URL format which supports waypoints
              // The google.navigation: intent doesn't support waypoints, so we use the web URL
              const googleMapsUrl = Platform.select({
                ios: `comgooglemaps://?saddr=${originLat},${originLng}&daddr=${dropoffLat},${dropoffLng}&waypoints=${pickupLat},${pickupLng}&directionsmode=driving`,
                android: `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dropoffLat},${dropoffLng}&waypoints=${pickupLat},${pickupLng}&travelmode=driving`,
                default: `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dropoffLat},${dropoffLng}&waypoints=${pickupLat},${pickupLng}&travelmode=driving`,
              });

              const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${dropoffLat},${dropoffLng}&waypoints=${pickupLat},${pickupLng}&travelmode=driving`;

              if (googleMapsUrl) {
                Linking.canOpenURL(googleMapsUrl)
                  .then((supported) => {
                    if (supported) {
                      return Linking.openURL(googleMapsUrl);
                    }
                    return Linking.openURL(webUrl);
                  })
                  .catch(() => {
                    Linking.openURL(webUrl).catch(() => { });
                  });
              } else {
                Linking.openURL(webUrl).catch(() => { });
              }
            }}
          >
            <Image
              source={require('../../../assets/google-maps.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </TouchableOpacity>

          {/* Open in Apple Maps button - Show for all users (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.mapAppButton}
              onPress={() => {
                if (!selectedJob) return;

                const pickupLat = selectedJob.pickupLocation?.lat;
                const pickupLng = selectedJob.pickupLocation?.lng;
                const dropoffLat = selectedJob.dropoffLocation?.lat;
                const dropoffLng = selectedJob.dropoffLocation?.lng;

                if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
                  return;
                }

                // Get current location for origin (if available)
                let originLat = pickupLat;
                let originLng = pickupLng;

                if (userRole === "driver" && currentLocation?.latitude && currentLocation?.longitude) {
                  originLat = currentLocation.latitude;
                  originLng = currentLocation.longitude;
                } else if (userRole !== "driver" && trackedDriverLocation) {
                  originLat = trackedDriverLocation.latitude;
                  originLng = trackedDriverLocation.longitude;
                } else if (initialDriverLocation) {
                  originLat = initialDriverLocation.latitude;
                  originLng = initialDriverLocation.longitude;
                }

                // Build Apple Maps URL
                // Apple Maps supports multiple destinations by chaining daddr parameters
                // Format: origin -> pickup -> dropoff
                // Using maps:// scheme for better app integration
                const appleMapsUrl = `maps://?saddr=${originLat},${originLng}&daddr=${pickupLat},${pickupLng}&daddr=${dropoffLat},${dropoffLng}&dirflg=d`;

                // Try maps:// first, fallback to http://maps.apple.com/ if needed
                Linking.canOpenURL(appleMapsUrl)
                  .then((supported) => {
                    if (supported) {
                      return Linking.openURL(appleMapsUrl);
                    } else {
                      // Fallback to http://maps.apple.com/ format
                      const fallbackUrl = `http://maps.apple.com/?saddr=${originLat},${originLng}&daddr=${pickupLat},${pickupLng}&daddr=${dropoffLat},${dropoffLng}&dirflg=d`;
                      return Linking.openURL(fallbackUrl);
                    }
                  })
                  .catch(() => {
                    // Final fallback
                    const fallbackUrl = `http://maps.apple.com/?saddr=${originLat},${originLng}&daddr=${pickupLat},${pickupLng}&daddr=${dropoffLat},${dropoffLng}&dirflg=d`;
                    Linking.openURL(fallbackUrl).catch(() => { });
                  });
              }}
            >
              <Image
                source={require('../../../assets/apple.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTripControls = () => (
    <View style={styles.tripControlsContainer}>
      <View style={styles.tripControlsHeader}>
        <Text style={styles.tripControlsTitle}>Trip Controls</Text>
        {tripStarted && (
          <Text style={styles.tripTimeText}>{formatTime(elapsedTime)}</Text>
        )}
      </View>

      <View style={styles.tripControlsButtons}>
        {!tripStarted ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTrip}
          >
            <Play size={20} color={Colors.white} />
            <Text style={styles.startButtonText}>Start Trip</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                tripPaused ? styles.resumeButton : styles.pauseButton,
              ]}
              onPress={handlePauseTrip}
            >
              {tripPaused ? (
                <Play size={20} color={Colors.white} />
              ) : (
                <Pause size={20} color={Colors.white} />
              )}
              <Text style={styles.controlButtonText}>
                {tripPaused ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleNextMilestone}
            >
              <CheckCircle size={20} color={Colors.white} />
              <Text style={styles.controlButtonText}>Next Step</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStopTrip}
            >
              <Square size={20} color={Colors.white} />
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderTripMilestones = () => (
    <View style={styles.milestonesContainer}>
      <Text style={styles.milestonesTitle}>Trip Progress</Text>
      <ScrollView
        style={styles.milestonesScrollView}
        showsVerticalScrollIndicator={false}
      >
        {tripMilestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.milestoneItem}>
            <View
              style={[
                styles.milestoneIcon,
                index < currentMilestone && styles.milestoneIconCompleted,
                index === currentMilestone && styles.milestoneIconActive,
              ]}
            >
              {index < currentMilestone ? (
                <CheckCircle size={16} color={Colors.white} />
              ) : (
                <Text style={styles.milestoneNumber}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.milestoneContent}>
              <Text
                style={[
                  styles.milestoneTitle,
                  index < currentMilestone && styles.milestoneTitleCompleted,
                  index === currentMilestone && styles.milestoneTitleActive,
                ]}
              >
                {milestone.title}
              </Text>
              <Text style={styles.milestoneDescription}>
                {milestone.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Helper function to format distance with both km and miles
  const formatDistanceWithMiles = (
    routeInfo: RouteInfo | null,
    distanceInKm: number | null
  ): string => {
    let distanceKm: number | null = null;

    if (routeInfo?.distance) {
      // Extract numeric value from string like "5.2 km"
      const regex = /(\d+\.?\d*)/;
      const match = regex.exec(routeInfo.distance);
      if (match) {
        distanceKm = Number.parseFloat(match[1]);
      }
    } else if (distanceInKm !== null) {
      distanceKm = distanceInKm;
    }

    if (distanceKm === null) {
      return "--";
    }

    // Convert km to miles (1 km = 0.621371 miles)
    const distanceMiles = distanceKm * 0.621371;

    return `${distanceKm.toFixed(1)} km (${distanceMiles.toFixed(1)} miles)`;
  };

  const renderDistanceInfo = () => (
    <View style={styles.distanceInfoContainer}>
      <View style={styles.distanceInfoItem}>
        <Package size={20} color={Colors.primary} />
        <View style={styles.distanceInfoContent}>
          <Text style={styles.distanceInfoLabel}>To Pickup</Text>
          <Text style={styles.distanceInfoValue}>
            {formatDistanceWithMiles(pickupRouteInfo, distanceToPickup)}
          </Text>
          <Text style={styles.distanceInfoEta}>
            ETA: {pickupRouteInfo
              ? formatDurationToHoursMinutes(pickupRouteInfo.duration)
              : ` ${etaToPickup || "--"}`}
          </Text>
        </View>
      </View>

      <View style={styles.distanceInfoItem}>
        <Home size={20} color={Colors.primary} />
        <View style={styles.distanceInfoContent}>
          <Text style={styles.distanceInfoLabel}>To Delivery</Text>
          <Text style={styles.distanceInfoValue}>
            {formatDistanceWithMiles(driverToDropRouteInfo, distanceToDelivery)}
          </Text>
          <Text style={styles.distanceInfoEta}>
            ETA: {driverToDropRouteInfo
              ? formatDurationToHoursMinutes(driverToDropRouteInfo.duration)
              : `${etaToDelivery || "--"}`}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!locationPermission) {
    return (
      <View style={styles.permissionContainer}>
        <AlertCircle
          size={40}
          color={Colors.warning}
          style={styles.permissionIcon}
        />
        <Text style={styles.permissionTitle}>{t("common.locationPermissionRequired")}</Text>
        <Text style={styles.permissionText}>
          {t("common.enableLocationAccess")}
        </Text>
        <Button
          title={t("common.enableLocation")}
          variant="primary"
          onPress={requestLocationPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  if (displayJobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Truck size={40} color={Colors.gray400} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No Active Trips</Text>
        <Text style={styles.emptyText}>
          You don't have any active trips to track
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {renderMapView()}
        {/* {renderTripControls()} */}
        {renderDistanceInfo()}
        {/* {renderTripMilestones()} */}

        {/* Pre-trip Photo Upload Button - Shows when driver is within pickup radius */}
        {!hasPreTrip && !hasPod1 && userRole === "driver" && isWithinPickupRadius && !hasShownPreTripButton && (
          <View style={{
            position: 'absolute',
            bottom: 120,
            left: 20,
            right: 20,
            backgroundColor: Colors.white,
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 1000,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Package size={24} color={Colors.primary} />
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: Colors.black,
                marginLeft: 12,
                flex: 1,
              }}>
                Arrived at Pickup Location
              </Text>
            </View>
            {!hasPreTrip && <Text style={{
              fontSize: 14,
              color: Colors.gray600,
              marginBottom: 16,
            }}>
              Please upload pre-trip photo to continue.
            </Text>}{!hasPod1 && <Text style={{
              fontSize: 14,
              color: Colors.gray600,
              marginBottom: 16,
            }}>
              Please upload proof of documents to continue.
            </Text>}
            <TouchableOpacity
              onPress={handleNavigateToPreTripPhoto}
              style={{
                backgroundColor: Colors.primary,
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                color: Colors.white,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Upload Pre-Trip Requirements
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Post-trip Photo Upload Button - Shows when driver is within pickup radius */}
        {!hasPostTrip && !hasPod2 && userRole === "driver" && isWithinDropoffRadius && !hasShownPostTripButton && (
          <View style={{
            position: 'absolute',
            bottom: 120,
            left: 20,
            right: 20,
            backgroundColor: Colors.white,
            borderRadius: 12,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 1000,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Package size={24} color={Colors.primary} />
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: Colors.black,
                marginLeft: 12,
                flex: 1,
              }}>
                Arrived at Dropoff Location
              </Text>
            </View>
            {!hasPostTrip && <Text style={{
              fontSize: 14,
              color: Colors.gray600,
              marginBottom: 16,
            }}>
              Please upload post-trip photo to continue.
            </Text>}{!hasPod2 && <Text style={{
              fontSize: 14,
              color: Colors.gray600,
              marginBottom: 16,
            }}>
              Please upload proof of documents to continue.
            </Text>}
            <TouchableOpacity
              onPress={handleNavigateToPostTripPhoto}
              style={{
                backgroundColor: Colors.primary,
                borderRadius: 8,
                padding: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                color: Colors.white,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Upload Post-Trip Requirements
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export { TripTrackingScreen };
