import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import {
  MapPin,
  TrendingUp,
  ChevronRight,
  Search,
  PlusIcon,
  MessageCircle,
  User,
  Star,
  Briefcase,
} from "lucide-react-native";
import { useAuthStore } from "@app/store/authStore";
import { useLocationStore } from "@app/store/locationStore";
import { JobCard } from "@app/components/JobCard";
import { HomeScreenSkeleton } from "@app/components/SkeletonLoader";
import { useTranslation } from "react-i18next";
import { Colors, useThemedStyle } from "@app/styles";
import { Routes } from "@app/navigator";
import { getStyles } from "./styles";
import DrawerHeader from "@app/components/DrawerHeader";
import { useDispatch, useSelector } from "react-redux";
import { selectJobs, selectProfile, selectUser } from "@app/module/common";
import { fetchProfile } from "@app/module/profile/slice";
import { fetchContractJobs, fetchJobs } from "@app/module/jobs/slice";
import { fetchContractInvitations } from "@app/module/contract-invitations";
import { useFocusEffect } from "@react-navigation/native";
import {
  reverseGeocode,
  formatLocationDisplay,
  LocationInfo,
} from "@app/utils/geocoding";
import { httpRequest, endPoints } from "@app/service";
import { sendLiveLocation } from "@app/service/location-service";

interface HomeScreenProps {
  readonly navigation: any;
}

function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const user = useSelector(selectUser);

  console.log("useruser", user);
  const { userProfile } = useAuthStore();
  const {
    requestLocationPermission,
    currentLocation,
    startLocationTracking,
    getCurrentPosition,
    locationPermission,
    error: locationError,
  } = useLocationStore();
  const styles = useThemedStyle(getStyles);
  const profileData = useSelector(selectProfile);
  console.log(profileData, "userprofillleeee");
  const userRole = profileData?.roles?.[0]?.role?.name;
  const jobs = useSelector(selectJobs);
  console.log(currentLocation, "currentLocation?.latitude  in home screen");
  // Contract invitations state
  const contractInvitations = useSelector(
    (state: any) => state.contractInvitationsReducer
  );
  const pendingInvitationsCount = contractInvitations?.pendingCount || 0;

  // Debug contract invitations
  console.log("HomeScreen - Contract invitations state:", contractInvitations);
  console.log(
    "HomeScreen - Pending invitations count:",
    pendingInvitationsCount
  );

  // Location state
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(false);

  // Loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true);

  // Ref for debouncing location updates (same pattern as trip tracking)
  const locationSendTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState<{
    totalCompletedJobs: number;
    ratings: {
      average: number;
      count: number;
    };
  } | null>(null);

  // Use real contract invitations data
  const pendingInvitations = pendingInvitationsCount;
  console.log("HomeScreen - Current jobs count:", jobs?.length || 0);

  // Fetch location info when coordinates change
  const fetchLocationInfo = useCallback(
    async (latitude: number, longitude: number) => {
      console.log("🏠 HomeScreen: Starting to fetch location info for:", {
        latitude,
        longitude,
      });
      setLocationLoading(true);
      try {
        const locationData = await reverseGeocode(latitude, longitude);
        console.log("🏠 HomeScreen: Received location data:", locationData);
        setLocationInfo(locationData);
      } catch (error) {
        console.error("🏠 HomeScreen: Error fetching location info:", error);
      } finally {
        setLocationLoading(false);
      }
    },
    []
  );

  // Function to send live location data (same pattern as trip tracking)
  const sendLiveLocationData = useCallback((latitude: number | undefined, longitude: number | undefined, heading?: number) => {
    // Validate coordinates - don't send if invalid or default location
    if (!latitude || !longitude || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      console.log("📍 HomeScreen sendLiveLocationData: Invalid coordinates, skipping:", { latitude, longitude });
      return;
    }

    // Check if it's the default location
    const isDefaultLocation =
      (latitude === 40.7589 && longitude === -73.9851) ||
      (latitude === 40.7505 && longitude === -73.9934);

    if (isDefaultLocation) {
      console.log("📍 HomeScreen sendLiveLocationData: Default location detected, skipping:", { latitude, longitude });
      return;
    }

    // Clear previous timeout
    if (locationSendTimeoutRef.current) {
      clearTimeout(locationSendTimeoutRef.current);
    }

    // Only send if user is a driver
    if (userRole === "driver") {
      // Debounce the API call to avoid too many requests (same as trip tracking - 2 seconds)
      locationSendTimeoutRef.current = setTimeout(async () => {
        try {
          // Get current location from store to ensure we have the latest data
          const latestLocation = useLocationStore.getState().currentLocation;
          const finalLat = latestLocation?.latitude || latitude;
          const finalLng = latestLocation?.longitude || longitude;
          const finalHeading = latestLocation?.heading || heading || 0;

          // Double-check it's not default location
          const isStillDefault =
            (finalLat === 40.7589 && finalLng === -73.9851) ||
            (finalLat === 40.7505 && finalLng === -73.9934);

          if (isStillDefault) {
            console.log("📍 HomeScreen sendLiveLocationData: Still default location after store check, skipping");
            return;
          }

          const locationData = {
            lat: finalLat,
            lng: finalLng,
            accuracy: 5.2,
            heading: finalHeading,
            speed: 65.5,
            battery: 85,
            provider: "gps",
          };

          console.log("📍 HomeScreen sendLiveLocationData: Sending location:", locationData);
          await sendLiveLocation(locationData);
          console.log("📍 HomeScreen sendLiveLocationData: Location sent successfully");
        } catch (error) {
          console.error("❌ HomeScreen Error sending live location:", error);
        }
      }, 2000); // Same debounce time as trip tracking
    }
  }, [userRole]);

  // Location-based sending for drivers (only when location changes, with debouncing) - same pattern as trip tracking
  useEffect(() => {
    if (userRole === "driver" && currentLocation) {
      // Clear any existing timeout
      if (locationSendTimeoutRef.current) {
        clearTimeout(locationSendTimeoutRef.current);
      }

      // Validate location before sending
      if (currentLocation?.latitude && currentLocation?.longitude) {
        // Check if it's not the default location
        const isDefaultLocation =
          (currentLocation.latitude === 40.7589 && currentLocation.longitude === -73.9851) ||
          (currentLocation.latitude === 40.7505 && currentLocation.longitude === -73.9934);

        if (!isDefaultLocation) {
          console.log("📍 HomeScreen: Valid location detected, will send:", {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            heading: currentLocation.heading
          });

          // Debounce location sending to avoid too frequent API calls (same as trip tracking - 1 second)
          locationSendTimeoutRef.current = setTimeout(() => {
            sendLiveLocationData(
              currentLocation.latitude,
              currentLocation.longitude,
              currentLocation.heading
            );
          }, 1000); // Wait 1 second after last location change (same as trip tracking)
        } else {
          console.log("📍 HomeScreen: Default location detected, not sending");
        }
      } else {
        console.log("📍 HomeScreen: No valid currentLocation, not sending:", currentLocation);
      }
    }

    // Cleanup timeout on unmount or location change
    return () => {
      if (locationSendTimeoutRef.current) {
        clearTimeout(locationSendTimeoutRef.current);
      }
    };
  }, [userRole, currentLocation?.latitude, currentLocation?.longitude, currentLocation?.heading, sendLiveLocationData]);

  // Effect to fetch location info when currentLocation changes
  useEffect(() => {
    console.log("🏠 HomeScreen: currentLocation changed:", currentLocation);
    if (currentLocation?.latitude && currentLocation?.longitude) {
      // Verify it's not the default location
      const isDefaultLocation =
        (currentLocation.latitude === 40.7589 && currentLocation.longitude === -73.9851) ||
        (currentLocation.latitude === 40.7505 && currentLocation.longitude === -73.9934);

      if (!isDefaultLocation) {
        console.log(
          "🏠 HomeScreen: Fetching location info for coordinates:",
          currentLocation
        );
        fetchLocationInfo(currentLocation.latitude, currentLocation.longitude);
      } else {
        console.log("🏠 HomeScreen: Skipping default location");
      }
    } else {
      console.log("🏠 HomeScreen: No current location available");
    }
  }, [currentLocation, fetchLocationInfo]);

  // Fetch location info when screen comes into focus (ensures location is fetched on initial load)
  useFocusEffect(
    useCallback(() => {
      console.log("🏠 HomeScreen: Screen focused, checking for location");
      console.log("🏠 HomeScreen: currentLocation on focus:", currentLocation);

      // If no location, try to get it
      if (!currentLocation?.latitude || !currentLocation?.longitude) {
        console.log("🏠 HomeScreen: No current location, attempting to get position...");
        getCurrentPosition().catch((error) => {
          console.error("🏠 HomeScreen: Error getting position on focus:", error);
        });
        return;
      }

      // Verify it's not the default location
      const isDefaultLocation =
        (currentLocation.latitude === 40.7589 && currentLocation.longitude === -73.9851) ||
        (currentLocation.latitude === 40.7505 && currentLocation.longitude === -73.9934);

      if (!isDefaultLocation) {
        // Always fetch location info on focus to ensure it's up to date
        console.log(
          "🏠 HomeScreen: Fetching location info on focus for coordinates:",
          currentLocation
        );
        fetchLocationInfo(currentLocation.latitude, currentLocation.longitude);
      } else {
        console.log("🏠 HomeScreen: Default location detected on focus, skipping");
      }
    }, [currentLocation, fetchLocationInfo, getCurrentPosition])
  );

  // Initialize location for all users (get current position)
  useEffect(() => {
    const initializeLocation = async () => {
      console.log("🏠 HomeScreen: Initializing location...");
      console.log(
        "🏠 HomeScreen: Current location permission:",
        locationPermission
      );

      if (!locationPermission) {
        console.log("🏠 HomeScreen: Requesting location permission...");
        const granted = await requestLocationPermission();
        console.log("🏠 HomeScreen: Permission granted:", granted);
        if (!granted) {
          console.log("🏠 HomeScreen: Permission denied");
          return;
        }
      }

      // Get immediate current position for all users
      try {
        console.log("🏠 HomeScreen: Getting current position immediately...");
        await getCurrentPosition();
        console.log("🏠 HomeScreen: Current position received");
      } catch (error) {
        console.error("🏠 HomeScreen: Error getting current position:", error);
      }

      // Only start continuous location tracking for drivers
      if (userRole === "driver") {
        console.log("🏠 HomeScreen: Starting continuous location tracking for driver...");
        await startLocationTracking();
      }
    };

    initializeLocation();
  }, [userRole, locationPermission, requestLocationPermission, startLocationTracking, getCurrentPosition]);

  // Helper function to get location display text
  const getLocationDisplayText = () => {
    if (isLoading) {
      return "Location not available"; // Don't show loading text during skeleton
    }
    if (locationLoading) {
      return "Getting location...";
    }
    if (locationInfo) {
      return formatLocationDisplay(locationInfo);
    }
    if (locationError) {
      return "Location unavailable";
    }
    return userProfile?.location || "Location not available";
  };

  const dispatch = useDispatch();

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const response: any = await httpRequest.get(endPoints.dashboard);
      if (response?.success && response?.data) {
        setDashboardStats({
          totalCompletedJobs: response.data.totalCompletedJobs || 0,
          ratings: {
            average: response.data.ratings?.average || 0,
            count: response.data.ratings?.count || 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Only request location permission during skeleton phase
        requestLocationPermission();

        // Fetch all data immediately (skeleton will hide when data loads)
        dispatch(fetchProfile({}));

        // Fetch dashboard stats
        fetchDashboardStats();

        // Fetch jobs immediately
        dispatch(
          fetchContractJobs({
            status: "active",
            isMine: false, // Show all jobs, not just user's jobs
            lat: currentLocation?.latitude || null,
            lng: currentLocation?.longitude || null,
          })
        );
        dispatch(
          fetchJobs({
            status: "active",
            isMine: false, // Show all jobs, not just user's jobs
            lat: currentLocation?.latitude || null,
            lng: currentLocation?.longitude || null,
          })
        );

        // Fetch contract invitations for drivers
        if (userRole === "driver" || userRole === "carrier" || userRole === "broker" || userRole === "shipper") {
          dispatch(fetchContractInvitations());
        }
      } catch (error) {
        console.error("Error initializing home screen data:", error);
        setIsLoading(false);
      }
    };

    initializeData();
  }, [dispatch, userRole, fetchDashboardStats]);

  // Refresh dashboard stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();

      // Silent refresh of contract invitations when screen comes into focus
      if (
        userRole === "driver" ||
        userRole === "carrier" ||
        userRole === "broker" ||
        userRole === "shipper"
      ) {
        dispatch(fetchContractInvitations({ silent: true }));
      }

      // Silent refresh of jobs when screen comes into focus
      dispatch(
        fetchContractJobs({
          status: "active",
          isMine: false,
          lat: currentLocation?.latitude || null,
          lng: currentLocation?.longitude || null,
        })
      );
      dispatch(
        fetchJobs({
          status: "active",
          isMine: false,
          lat: currentLocation?.latitude || null,
          lng: currentLocation?.longitude || null,
        })
      );
    }, [fetchDashboardStats, userRole, dispatch, currentLocation])
  );

  // Jobs are now fetched only once during initialization after skeleton loading
  // No need for useFocusEffect to avoid triggering global loader

  // Debug: Log when jobs change (including socket updates)
  useEffect(() => {
    console.log("HomeScreen - Jobs updated:", {
      count: jobs?.length || 0,
      firstJob: jobs?.[0]?.title || t("common.noJobs"),
      timestamp: new Date().toISOString(),
    });
  }, [jobs]);

  // Hide skeleton when data is loaded
  useEffect(() => {
    if (isLoading && profileData && jobs !== undefined) {
      setIsLoading(false);
    }
  }, [isLoading, profileData, jobs]);

  // Limit jobs to 10 for home screen display
  const limitedJobs = jobs?.slice(0, 10) || [];

  // Recent Jobs: Show most recently created jobs (all statuses, sorted by date)
  const recentJobs = limitedJobs
    .sort((a, b) => {
      // Sort by createdAt or updatedAt, whichever is more recent
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    })
    .slice(0, 5);

  // Active Jobs: Show only active jobs (no sorting by date)
  const activeJobs = limitedJobs
    .filter((job) => job.status === "active")
    .slice(0, 5);

  const renderDriverDashboard = () => (
    <>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate(Routes.JobsScreen)}
        >
          <Search size={20} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>{t("home.searchJobs")}</Text>
        </TouchableOpacity>


      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: Colors.primary + "30" },
            ]}
          >
            <Briefcase size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{activeJobs.length}</Text>
          <Text style={styles.statLabel}>{t("home.activeJobs")}</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: Colors.success + "30" },
            ]}
          >
            <TrendingUp size={20} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>
            {dashboardStats?.totalCompletedJobs || 0}
          </Text>
          <Text style={styles.statLabel}>{t("home.completedJobs")}</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: Colors.warning + "30" },
            ]}
          >
            <Star size={20} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>
            {dashboardStats?.ratings?.average?.toFixed(1) || "0.0"}
          </Text>
          <Text style={styles.statLabel}>
            {t("home.rating")} ({dashboardStats?.ratings?.count || 0})
          </Text>
        </View>
      </View>

      {!!(activeJobs.length > 0 && userRole !== "driver") && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.activeJobs")}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(Routes.JobsScreen)}
            >
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {activeJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.recentJobs")}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
          </TouchableOpacity>
        </View>

        {recentJobs.length > 0 ? (
          recentJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <Text style={styles.emptyText}>{t("home.noRecentJobs")}</Text>
        )}
      </View>
    </>
  );

  const renderMerchantDashboard = () => {
    return (
      <>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => navigation.navigate(Routes.CreateJobScreen)}
          >
            <Text style={styles.primaryActionButtonText}>
              {t("home.postNewJob")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Text style={styles.secondaryActionButtonText}>
              {t("home.manageJobs")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.primary + "30" },
              ]}
            >
              <Briefcase size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>{t("home.activeJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.success + "30" },
              ]}
            >
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>
              {dashboardStats?.totalCompletedJobs || 0}
            </Text>
            <Text style={styles.statLabel}>{t("home.completedJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.warning + "30" },
              ]}
            >
              <Star size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>
              {dashboardStats?.ratings?.average?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.statLabel}>
              {t("home.rating")} ({dashboardStats?.ratings?.count || 0})
            </Text>
          </View>
        </View>

        {!!activeJobs.length && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("home.activeJobs")}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(Routes.JobsScreen)}
              >
                <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
              </TouchableOpacity>
            </View>

            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.DriverListingScreen, { fromHome: true })}
          >
            <View style={styles.quickActionIcon}>
              <Search size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.findDrivers.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.findDrivers.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.ProfileScreen)}
          >
            <View style={styles.quickActionIcon}>
              <TrendingUp size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.analytics.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.analytics.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </>
    );
  };
  const renderCarrierDashboard = () => {
    return (
      <>
        {/* Primary Actions (Merchant only) */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => navigation.navigate(Routes.CreateJobScreen)}
          >
            <PlusIcon size={20} color={Colors.white} />
            <Text style={styles.primaryActionButtonText}>
              {t("home.postNewJob")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Text style={styles.secondaryActionButtonText}>
              {t("home.manageJobs")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar (Driver only) */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Search size={20} color={Colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>{t("home.searchJobs")}</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={Colors.primary} />
          </TouchableOpacity> */}
        </View>

        {/* Shared Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.primary + "30" },
              ]}
            >
              <Briefcase size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>{t("home.activeJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.success + "30" },
              ]}
            >
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>
              {dashboardStats?.totalCompletedJobs || 0}
            </Text>
            <Text style={styles.statLabel}>{t("home.completedJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.warning + "30" },
              ]}
            >
              <Star size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>
              {dashboardStats?.ratings?.average?.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.statLabel}>
              {t("home.rating")} ({dashboardStats?.ratings?.count || 0})
            </Text>
          </View>
        </View>

        {/* Active Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.activeJobs")}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(Routes.JobsScreen)}
            >
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {activeJobs.length > 0 ? (
            activeJobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <Text style={styles.emptyText}>{t("home.noActiveJobs")}</Text>
          )}
        </View>

        {/* Recent Jobs (Driver only) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.recentJobs")}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(Routes.JobsScreen)}
            >
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {recentJobs.length > 0 ? (
            recentJobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <Text style={styles.emptyText}>{t("home.noRecentJobs")}</Text>
          )}
        </View>

        {/* Quick Actions (Merchant only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.DriverListingScreen, { fromHome: true })}
          >
            <View style={styles.quickActionIcon}>
              <Search size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.findDrivers.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.findDrivers.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.DriverListingScreen, { fromHome: true })}
          >
            <View style={styles.quickActionIcon}>
              <TrendingUp size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.analytics.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.analytics.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity> */}
        </View>
      </>
    );
  };

  const renderDashboard = () => {
    if (userRole === "merchant") {
      return renderMerchantDashboard();
    } else if (userRole === "driver") {
      return renderDriverDashboard();
    } else if (
      userRole === "carrier" ||
      userRole === "broker" ||
      userRole === "shipper"
    ) {
      return renderCarrierDashboard();
    } else {
      return <Text style={{ color: Colors.primary }}>{t("common.error")}</Text>;
    }
  };
  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <DrawerHeader title={t("common.home")} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <HomeScreenSkeleton userRole={userRole} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <DrawerHeader title="Home" />
      <View style={styles.header}>
        <View
          style={{
            borderRadius: 10,
            backgroundColor: Colors.backgroundCard,
            flexDirection: "row",
            padding: 10,
            width: "48%",
            height: 80,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate(Routes.ProfileScreen)}
          >
            {profileData?.profileImage ? (
              <Image
                source={
                  error || !profileData?.profileImage
                    ? require("../../../assets/dummyImage.png") // fallback local image
                    : { uri: profileData.profileImage }
                }
                style={styles.avatar}
                onError={() => setError(true)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={32} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ width: "60%" }}>
            <Text style={styles.greeting}>{profileData?.userName}</Text>
            <Text style={styles.userRole}>
              {profileData?.roles?.[0]?.role?.name?.toUpperCase()}
            </Text>
          </View>
        </View>
        <View
          style={{
            borderRadius: 10,
            backgroundColor: Colors.backgroundCard,
            flexDirection: "row",
            padding: 10,
            width: "48%",
            height: 80,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              fetchLocationInfo(
                currentLocation?.latitude,
                currentLocation?.longitude
              );
            }}
          >
            <View
              style={[
                styles.statIconContaineNew,
                { backgroundColor: Colors.secondaryLight },
              ]}
            >
              <MapPin size={25} color={Colors.primaryLight} />
            </View>
          </TouchableOpacity>
          <View style={{ width: "60%" }}>
            <Text style={styles.greeting}>{t("tracking.currentLocation")}</Text>
            <Text
              style={styles.userRole}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getLocationDisplayText()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!!(userRole !== "shipper" && pendingInvitations > 0) && (
          <TouchableOpacity
            style={styles.jobInvitationsTile}
            onPress={() => navigation.navigate(Routes.JobInvitationsScreen)}
          >
            <View style={styles.jobInvitationsContent}>
              <View style={styles.jobInvitationsLeft}>
                <View style={styles.jobInvitationsIconContainer}>
                  <MessageCircle size={24} color={Colors.white} />
                  <View style={styles.jobInvitationsBadge}>
                    <Text style={styles.jobInvitationsBadgeText}>
                      {pendingInvitations}
                    </Text>
                  </View>
                </View>
                <View style={styles.jobInvitationsTextContainer}>
                  <Text style={styles.jobInvitationsTitle}>
                    {t("jobs.newJobInvitations")}
                  </Text>
                  <Text style={styles.jobInvitationsSubtitle}>
                    {t("jobs.youHave")} {pendingInvitations} {t("jobs.pendingInvitations")}
                    {pendingInvitations > 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.white} />
            </View>
          </TouchableOpacity>
        )}
        {renderDashboard()}
      </ScrollView>
    </View>
  );
}

export { HomeScreen };
