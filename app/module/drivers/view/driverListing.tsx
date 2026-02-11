/**
 * Driver Listing Screen
 * @format
 */

import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator, Image } from "react-native";
import { User, Star, CheckCircle, Search, MapPin, X, UserMinus } from "lucide-react-native";
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./driverListingStyles";
import Header from "@app/components/Header";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { selectDrivers, selectDriversPagination, selectCompany, selectProfile } from "@app/module/common";
import { fetchDrivers, assignDriver, changeDriver } from "../slice";
import { ChangeDriverModal } from "@app/components/ChangeDriverModal";
import { DriverListingSkeleton } from "@app/components/SkeletonLoader";
import { getPlacePredictions, PlacePrediction, generateSessionToken, getPlaceDetails } from "@app/utils/googlePlaces";
import { useLocationStore } from "@app/store/locationStore";
import { reverseGeocode, formatLocationDisplay } from "@app/utils/geocoding";
import { Routes } from "@app/navigator";
import { httpRequest, endPoints, socketService } from "@app/service";
import { showMessage } from "react-native-flash-message";

interface Driver {
  id: string;
  name: string;
  rating: number;
  jobsCompleted: number;
  vehicleType: string;
  profileImage?: string;
  isAvailable: boolean;
  location?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  phone?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  email?: string;
  companyId?: string;
}

function DriverListingScreen({ navigation, route }) {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const drivers = useSelector(selectDrivers);
  const driversPagination = useSelector(selectDriversPagination);
  const company = useSelector(selectCompany);
  const profile = useSelector(selectProfile);
  
  const { jobId, contractId, onDriverSelect, currentDriverId, currentDriver, fromHome } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Location filter state with Google Places
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPredictions, setLocationPredictions] = useState<PlacePrediction[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [sessionToken] = useState(() => generateSessionToken());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"all" | "available" | "own">("all");
  
  // Get current location from location store
  const { currentLocation, getCurrentPosition } = useLocationStore();
  
  // Modal state for change driver
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedNewDriver, setSelectedNewDriver] = useState<Driver | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);
  // Loading state for adding user to company
  const [addingToTeam, setAddingToTeam] = useState<string | null>(null);
  // Loading state for removing user from company
  const [removingFromTeam, setRemovingFromTeam] = useState<string | null>(null);
  // Pagination state - use Redux state as source of truth
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 10;
  
  // Store latest driver locations from socket updates
  const [driverSocketLocations, setDriverSocketLocations] = useState<Record<string, {
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  }>>({});
  
  // Get pagination info from Redux (with defaults)
  const { currentPage = 1, hasMore = false } = driversPagination || {};

  console.log('DriverListingScreen - Route params:', {
    jobId,
    contractId,
    currentDriverId,
    currentDriver,
    hasOnDriverSelect: !!onDriverSelect
  });
  
  console.log('DriverListingScreen - currentDriver details:', {
    currentDriver,
    userName: currentDriver?.userName,
    user: currentDriver?.user,
    userUserName: currentDriver?.user?.userName,
    name: currentDriver?.name
  });
  useEffect(() => {
    // Fetch drivers from API
    console.log('DriverListingScreen - useEffect - dispatching fetchDrivers, activeTab:', activeTab);
    
    const fetchData = async () => {
      setLoading(true);
      // Small delay before API call
      await new Promise(resolve => setTimeout(resolve, 300));
      dispatch(fetchDrivers({ 
        page: 1, 
        limit,
        ownCompany: activeTab === "own" ? true : undefined,
        excludeCompany: (activeTab === "all" || activeTab === "available") ? true : undefined
      }));
      
      // Minimum skeleton display time to prevent flickering
      setTimeout(() => {
        setLoading(false);
      }, 800);
    };
    
    fetchData();
  }, [dispatch, activeTab]);

  // Set up socket listener for driver location updates
  useEffect(() => {
    if (!socketService.isSocketConnected()) {
      console.log('📍 DriverListingScreen: Socket not connected, skipping location listener setup');
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) {
      console.log('📍 DriverListingScreen: Socket instance not available');
      return;
    }

    console.log('📍 DriverListingScreen: Setting up location_update listener');

    // Handle location update events
    const handleLocationUpdate = (data: any) => {
      console.log('📍 DriverListingScreen: location_update event received:', data);
      
      // Extract location data from the nested structure
      const locationData = data.location || data;
      const driverId = locationData.userId || data.userId;
      const latitude = Number.parseFloat(locationData?.lat || locationData?.latitude);
      const longitude = Number.parseFloat(locationData?.lng || locationData?.longitude);
      
      // Validate coordinates
      if (
        driverId &&
        latitude &&
        longitude &&
        !Number.isNaN(latitude) &&
        !Number.isNaN(longitude)
      ) {
        console.log('📍 DriverListingScreen: Updating location for driver:', driverId, {
          latitude,
          longitude
        });
        
        // Update driver location in state
        setDriverSocketLocations((prev) => ({
          ...prev,
          [driverId.toString()]: {
            latitude,
            longitude,
            timestamp: new Date(locationData.timestamp).getTime() || Date.now(),
            heading: Number.parseFloat(locationData.heading) || undefined,
          },
        }));
      }
    };

    // Set up the listener
    socket.on("location_update", handleLocationUpdate);
    console.log('✅ DriverListingScreen: location_update listener registered');

    // Cleanup on unmount
    return () => {
      console.log('📍 DriverListingScreen: Cleaning up location_update listener');
      socket.off("location_update", handleLocationUpdate);
    };
  }, []);

  // Pagination is now managed by Redux state, no need for this effect

  // Fetch location predictions from Google Places API
  const fetchLocationPredictions = async (text: string) => {
    if (text.length < 2) {
      setLocationPredictions([]);
      setShowLocationDropdown(false);
      return;
    }

    try {
      setLoadingPredictions(true);
      console.log('🔍 Fetching location predictions for:', text);
      
      const results = await getPlacePredictions(
        text,
        sessionToken,
        currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        } : undefined
      );
      
      console.log('🔍 Received location predictions:', results.length);
      setLocationPredictions(results);
      setShowLocationDropdown(true);
    } catch (error) {
      console.error('Error fetching location predictions:', error);
      setLocationPredictions([]);
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Handle location query changes with debouncing
  const handleLocationQueryChange = (text: string) => {
    setLocationQuery(text);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If text is cleared, clear selection and predictions but keep dropdown open
    if (!text) {
      setSelectedLocation("");
      setLocationPredictions([]);
      // Don't close dropdown - keep it open to show "Current Location" option
      return;
    }

    // Debounce API calls
    debounceRef.current = setTimeout(() => {
      fetchLocationPredictions(text);
    }, 300);
  };

  // Filter drivers based on active tab, search query, and location
  // Note: When filters are active, pagination is disabled (client-side filtering)
  // For "own" tab, filtering is done server-side via API with ownCompany parameter
  const filteredDrivers = drivers.filter((driver) => {
    // Tab filtering - only "available" tab needs client-side filtering
    // "own" tab is filtered server-side via API
    if (activeTab === "available" && !driver.isAvailable) {
      return false;
    }
    
    // Search and location filtering
    const matchesName = !searchQuery || driver.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Ensure location is a string before filtering
    const locationString = typeof driver.location === 'string' 
      ? driver.location 
      : 'Location not specified';
    
    const matchesLocation = !selectedLocation || 
      locationString.toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesName && matchesLocation;
  });

  const handleTabChange = (tab: "all" | "available" | "own") => {
    setActiveTab(tab);
    // Reset search and location filters when changing tabs
    setSearchQuery("");
    setLocationQuery("");
    setSelectedLocation("");
    setLocationPredictions([]);
    setShowLocationDropdown(false);
    
    // Fetch drivers for the new tab
    setLoading(true);
    dispatch(fetchDrivers({ 
      page: 1, 
      limit,
      ownCompany: tab === "own" ? true : undefined,
      excludeCompany: (tab === "all" || tab === "available") ? true : undefined
    }));
    
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setSearchQuery("");
    setLocationQuery("");
    setSelectedLocation("");
    setLocationPredictions([]);
    setShowLocationDropdown(false);
    dispatch(fetchDrivers({ 
      page: 1, 
      limit,
      ownCompany: activeTab === "own" ? true : undefined,
      excludeCompany: activeTab === "all" ? true : undefined
    }));
    
    // Minimum skeleton display time
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleLocationSelect = async (prediction: PlacePrediction) => {
    const locationText = prediction.structured_formatting.main_text;
    setSelectedLocation(locationText);
    setLocationQuery(prediction.description);
    setShowLocationDropdown(false);
    console.log('Selected location:', locationText);
    
    // Get place details to get coordinates
    try {
      const placeDetails = await getPlaceDetails(prediction.place_id, sessionToken);
      if (placeDetails?.geometry?.location) {
        setSelectedLocationCoords({
          lat: placeDetails.geometry.location.lat,
          lng: placeDetails.geometry.location.lng
        });
        console.log('Selected location coordinates:', placeDetails.geometry.location);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      setSelectedLocationCoords(null);
    }
  };

  const handleClearLocation = () => {
    setSelectedLocation("");
    setLocationQuery("");
    setSelectedLocationCoords(null);
    setLocationPredictions([]);
    setShowLocationDropdown(false);
  };

  const handleCurrentLocationSelect = async () => {
    try {
      setLoadingCurrentLocation(true);
      console.log('📍 Getting current location...');
      
      // Get current position if not already available
      if (!currentLocation) {
        await getCurrentPosition();
      }
      
      // Wait a bit if location was just requested
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const location = useLocationStore.getState().currentLocation;
      
      if (!location) {
        Alert.alert('Location Error', 'Unable to get your current location. Please check your location permissions.');
        return;
      }
      
      console.log('📍 Current location:', location);
      
      // Reverse geocode to get location name
      const locationInfo = await reverseGeocode(location.latitude, location.longitude);
      
      if (locationInfo) {
        const locationText = formatLocationDisplay(locationInfo);
        console.log('📍 Location name:', locationText);
        
        setSelectedLocation(locationInfo.city);
        setLocationQuery(locationText);
        setSelectedLocationCoords({
          lat: location.latitude,
          lng: location.longitude
        });
        setShowLocationDropdown(false);
      } else {
        Alert.alert('Location Error', 'Unable to get location name. Please try again.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Failed to get your current location. Please try again.');
    } finally {
      setLoadingCurrentLocation(false);
    }
  };

  const loadMoreDrivers = async () => {
    // Don't load more if:
    // 1. Already loading
    // 2. No more data available (from Redux state)
    // 3. Search or filter is active (client-side filtering)
    // 4. Tab is "available" (uses client-side filtering, pagination disabled)
    if (loadingMore || !hasMore || searchQuery || selectedLocation || activeTab === "available") {
      console.log('📄 Skipping loadMore:', { loadingMore, hasMore, searchQuery, selectedLocation, activeTab });
      return;
    }
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      console.log('📄 Loading more drivers - page:', nextPage, 'current page:', currentPage);
      dispatch(fetchDrivers({ 
        page: nextPage, 
        limit,
        ownCompany: activeTab === "own" ? true : undefined,
        excludeCompany: activeTab === "all" ? true : undefined
      }));
    } catch (error) {
      console.error('Error loading more drivers:', error);
    } finally {
      setTimeout(() => {
        setLoadingMore(false);
      }, 500);
    }
  };

  const handleCloseModal = () => {
    setShowChangeModal(false);
    setSelectedNewDriver(null);
    setChangeLoading(false);
  };

  const handleDriverChange = (reason: string) => {
    if (!selectedNewDriver || !currentDriver || !contractId) {
      console.error('Missing required data for driver change');
      return;
    }

    setChangeLoading(true);
    
    dispatch(changeDriver({
      contractId: contractId.toString(),
      currentDriverUserId: currentDriver.id,
      newDriverUserId: selectedNewDriver.id,
      reason: reason,
      onSuccess: () => {
        console.log('Driver change successful');
        setChangeLoading(false);
        setShowChangeModal(false);
        setSelectedNewDriver(null);
        // Navigate back to driver assignment screen
        navigation.goBack();
      },
      onError: (error: string) => {
        console.error('Driver change failed:', error);
        setChangeLoading(false);
        Alert.alert(t("common.error"), error);
      }
    }));
  };

  const handleAddToTeam = async (driver: Driver) => {
    // Get company ID
    const companyId = company?.id || company?._id || profile?.companyId || profile?.company?.id;
    
    if (!companyId) {
      Alert.alert(
        t("common.error"),
        "Company information not found. Please try again."
      );
      return;
    }

    // Get driver's role ID - check if available in driver object or use default driver role
    // The roleId might be in the raw driver data, but for now we'll need to get it from the driver's profile
    // For now, we'll use 0 as placeholder - you may need to adjust this based on your API requirements
    const roleId = (driver as any).roleId || (driver as any).role?.id || profile?.roles?.[0]?.role?.id || 0;

    setAddingToTeam(driver.id);

    try {
      console.log('Adding user to company:', {
        companyId,
        userId: driver.id,
        roleId,
        isPrimary: true
      });

      const response: any = await httpRequest.post(
        endPoints.addUserToCompany(companyId),
        {
          userId: Number.parseInt(driver.id, 10),
          roleId: roleId,
          isPrimary: true
        }
      );

      console.log('Add user to company response:', response);

      if (response?.success) {
        showMessage({
          message: t("common.success") || "Success",
          description: `${driver.name} has been added to your team successfully.`,
          type: "success",
          duration: 3000,
        });
        
        // Refresh the drivers list with current tab filter
        dispatch(fetchDrivers({ 
          page: 1, 
          limit,
          ownCompany: activeTab === "own" ? true : undefined,
          excludeCompany: (activeTab === "all" || activeTab === "available") ? true : undefined
        }));
      } else {
        throw new Error(response?.message || "Failed to add user to company");
      }
    } catch (error: any) {
      console.error('Error adding user to company:', error);
      
      let errorMessage = "Failed to add driver to your team. Please try again.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showMessage({
        message: t("common.error") || "Error",
        description: errorMessage,
        type: "danger",
        duration: 4000,
      });
    } finally {
      setAddingToTeam(null);
    }
  };

  const handleRemoveFromTeam = async (driver: Driver) => {
    // Get company ID
    const companyId = company?.id || company?._id || profile?.companyId || profile?.company?.id;
    
    if (!companyId) {
      Alert.alert(
        t("common.error"),
        "Company information not found. Please try again."
      );
      return;
    }

    setRemovingFromTeam(driver.id);

    try {
      console.log('Removing user from company:', {
        companyId,
        userId: driver.id
      });

      const response: any = await httpRequest.delete(
        endPoints.removeUserFromCompany(companyId, driver.id)
      );

      console.log('Remove user from company response:', response);

      // DELETE requests may return 204 No Content or success response
      if (response?.success !== false || !response) {
        showMessage({
          message: t("common.success") || "Success",
          description: `${driver.name} has been removed from your team successfully.`,
          type: "success",
          duration: 3000,
        });
        
        // Refresh the drivers list with current tab filter
        dispatch(fetchDrivers({ 
          page: 1, 
          limit,
          ownCompany: activeTab === "own" ? true : undefined,
          excludeCompany: (activeTab === "all" || activeTab === "available") ? true : undefined
        }));
      } else {
        throw new Error(response?.message || "Failed to remove user from company");
      }
    } catch (error: any) {
      console.error('Error removing user from company:', error);
      
      let errorMessage = "Failed to remove driver from your team. Please try again.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showMessage({
        message: t("common.error") || "Error",
        description: errorMessage,
        type: "danger",
        duration: 4000,
      });
    } finally {
      setRemovingFromTeam(null);
    }
  };

  const handleAssignDriver = (driver: Driver) => {
    console.log('Driver selected:', driver);
    console.log('onDriverSelect available:', !!onDriverSelect);
    
    if (onDriverSelect && !!currentDriver) {
      // If called from Driver Assignment screen for change driver, show modal
      console.log('Setting up change driver modal with driver:', driver);
      setSelectedNewDriver(driver);
      setShowChangeModal(true);
      return;
    }
    
    if (onDriverSelect) {
      // If called from Driver Assignment screen for assignment, just select the driver
      console.log('Calling onDriverSelect with driver:', driver);
      onDriverSelect(driver);
      return;
    }

    // Original assignment logic for direct assignment
    Alert.alert(
      t("common.confirm"),
      `${t("common.assignDriverConfirm")} ${driver.name}?`,
      [
        { text: t("common.cancel"), style: 'cancel' },
        {
          text: t("drivers.assign") || "Assign",
          onPress: () => {
            const jobId = route?.params?.jobId;
            
            if (jobId) {
              dispatch(assignDriver({ driverId: driver.id, jobId, contractId }));
              navigation.goBack();
            } else {
              Alert.alert(t("common.error"), t("common.jobIdNotFound"));
            }
          }
        }
      ]
    );
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const handleDriverCardPress = (driver: Driver) => {
    console.log('Driver card pressed, navigating to detail screen:', driver);
    navigation.navigate(Routes.DriverDetailScreen, {
      driverId: driver.id,
      driver: driver,
    });
  };

  const renderDriverCard = ({ item: driver }: { item: Driver }) => {
    console.log('Driver location:', driver);
    
    return (
      <TouchableOpacity 
        style={styles.driverCard}
        onPress={() => handleDriverCardPress(driver)}
        activeOpacity={0.7}
      >
      {/* Driver Info Section */}
      <View style={styles.driverInfoSection}>
        <View style={styles.profileIcon}>
          {driver.profileImage && driver.profileImage.trim() !== '' ? (
            <Image 
              source={{ uri: driver.profileImage }} 
              style={styles.profileImage}
              resizeMode="cover"
              onError={() => {
                // Image failed to load, will fallback to User icon
                console.log('Profile image failed to load for driver:', driver.id);
              }}
            />
          ) : (
            <User size={24} color={Colors.white} />
          )}
        </View>
        
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{driver.name}</Text>
          
          <View style={styles.ratingSection}>
            <Star size={16} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.ratingText}>{driver.rating}</Text>
            <View style={styles.separator} />
            <Text style={styles.jobsText}>
              {driver.jobsCompleted} {driver.jobsCompleted === 1 ? t('drivers.job') : t('drivers.jobs')}
            </Text>
          </View>
          
          <Text style={styles.vehicleType}>{driver.vehicleType}</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.location}>
              {driver.location && typeof driver.location === 'string' && driver.location !== t('drivers.locationNotAvailable')
                ? driver.location 
                : t('drivers.locationNotAvailable')}
            </Text>
            {/* Show distance if location is searched and driver has location data */}
            {selectedLocationCoords && (() => {
              // Get driver location - prefer socket location, fallback to API location
              const socketLocation = driverSocketLocations[driver.id];
              const driverLat = socketLocation?.latitude ?? driver.locationLat;
              const driverLng = socketLocation?.longitude ?? driver.locationLng;
              
              // Only show distance if we have valid coordinates
              if (
                driverLat !== null && driverLat !== undefined &&
                driverLng !== null && driverLng !== undefined &&
                !Number.isNaN(driverLat) && !Number.isNaN(driverLng)
              ) {
                const distance = calculateDistance(
                  selectedLocationCoords.lat,
                  selectedLocationCoords.lng,
                  driverLat,
                  driverLng
                );
                return (
                  <Text style={styles.distanceText}>
                    {distance.toFixed(1)} miles
                    {socketLocation && (
                      <Text style={{ fontSize: 10, color: Colors.success, marginLeft: 4 }}>
                        {' • Live'}
                      </Text>
                    )}
                  </Text>
                );
              }
              return null;
            })()}
          </View>
        </View>
      </View>

      {/* Action Button Section - Hide when opened from home screen */}
      {!fromHome && (
        <View style={styles.actionButtonSection}>
          <TouchableOpacity
            style={[
              styles.assignButton,
              !driver.isAvailable && styles.disabledButton
            ]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card press when button is clicked
              handleAssignDriver(driver);
            }}
            disabled={!driver.isAvailable}
          >
            <CheckCircle size={16} color={Colors.white} />
            <Text style={styles.buttonText}>{t('drivers.assign')}</Text>
          </TouchableOpacity>
        </View>
      )}

{fromHome && (
        <View style={styles.actionButtonSection}>
          {activeTab === "own" ? (
            // Remove from team button for "own" tab
            <TouchableOpacity
              style={[
                styles.assignButton,
                styles.removeButton,
                removingFromTeam === driver.id && styles.disabledButton
              ]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent card press when button is clicked
                handleRemoveFromTeam(driver);
              }}
              disabled={removingFromTeam === driver.id}
            >
              {removingFromTeam === driver.id ? (
                <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 6 }} />
              ) : (
                <UserMinus size={16} color={Colors.white} />
              )}
              <Text style={styles.buttonText}>
                {removingFromTeam === driver.id 
                  ? t("common.loading") || "Removing..." 
                  : t("common.removeFromTeam") || "Remove from your team"}
              </Text>
            </TouchableOpacity>
          ) : (
            // Add to team button for "all" and "available" tabs
            <TouchableOpacity
              style={[
                styles.assignButton,
                (!driver.isAvailable || addingToTeam === driver.id) && styles.disabledButton
              ]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent card press when button is clicked
                handleAddToTeam(driver);
              }}
              disabled={!driver.isAvailable || addingToTeam === driver.id}
            >
              {addingToTeam === driver.id ? (
                <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 6 }} />
              ) : (
                <CheckCircle size={16} color={Colors.white} />
              )}
              <Text style={styles.buttonText}>
                {addingToTeam === driver.id 
                  ? t("common.loading") || "Adding..." 
                  : t("common.addInYourTeam") || "Add in your team"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <User size={64} color={Colors.gray400} />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? t('drivers.noDriversFound') : t('drivers.noDriversAvailable')}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery 
          ? t('drivers.noDriversFoundMatching', { searchQuery })
          : t('drivers.noAvailableDriversFound')
        }
      </Text>
    </View>
  );

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={{ marginTop: 8, color: Colors.gray600, fontSize: 12 }}>
            {t('drivers.loadingMoreDrivers')}
          </Text>
        </View>
      );
    }
            if (!hasMore && drivers.length > 0 && !searchQuery && !selectedLocation && (activeTab === "all" || activeTab === "own")) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: Colors.gray600, fontSize: 12 }}>
            {t('drivers.noMoreDriversToLoad')}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Header title={t('drivers.availableDrivers')} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => handleTabChange("all")}
        >
          <Text
            style={[styles.tabText, activeTab === "all" && styles.activeTabText]}
          >
            {t("drivers.tabs.all")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "available" && styles.activeTab]}
          onPress={() => handleTabChange("available")}
        >
          <Text
            style={[styles.tabText, activeTab === "available" && styles.activeTabText]}
          >
            {t("drivers.tabs.available")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "own" && styles.activeTab]}
          onPress={() => handleTabChange("own")}
        >
          <Text
            style={[styles.tabText, activeTab === "own" && styles.activeTabText]}
          >
            {t("drivers.tabs.own")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('drivers.searchDriversByName')}
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Location Filter with Google Places */}
      <View style={styles.locationFilterContainer}>
        <View style={styles.locationInputContainer}>
          <MapPin size={20} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('drivers.searchLocation')}
            placeholderTextColor={Colors.gray400}
            value={locationQuery}
            onChangeText={handleLocationQueryChange}
            onFocus={() => {
              console.log('Location input focused - showing dropdown');
              setShowLocationDropdown(true);
            }}
            onBlur={() => {
              // Delay closing to allow tap on dropdown items
              setTimeout(() => {
                console.log('Location input blurred - hiding dropdown');
                setShowLocationDropdown(false);
              }, 200);
            }}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {(!!selectedLocation || !!locationQuery) && (
            <TouchableOpacity 
              onPress={handleClearLocation}
              style={styles.clearButton}
            >
              <X size={18} color={Colors.gray400} />
            </TouchableOpacity>
          )}
          {loadingPredictions && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
          )}
        </View>

        {/* Google Places Location Dropdown */}
        {showLocationDropdown && (
          <View style={styles.locationDropdown}>
            <ScrollView
              style={styles.dropdownScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {/* Current Location Option */}
              <TouchableOpacity
                style={[styles.locationItem, styles.currentLocationItem]}
                onPress={handleCurrentLocationSelect}
                disabled={loadingCurrentLocation}
              >
                {loadingCurrentLocation ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <MapPin size={16} color={Colors.success} fill={Colors.success} />
                )}
                <View style={styles.predictionTextContainer}>
                  <Text style={[styles.locationItemText, styles.currentLocationText]}>
                    {t('drivers.currentLocation')}
                  </Text>
                  <Text style={styles.locationSecondaryText}>
                    {t('drivers.useMyCurrentLocation')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Google Places Predictions */}
              {locationPredictions.map((prediction) => (
                <TouchableOpacity
                  key={prediction.place_id}
                  style={styles.locationItem}
                  onPress={() => handleLocationSelect(prediction)}
                >
                  <MapPin size={16} color={Colors.primary} />
                  <View style={styles.predictionTextContainer}>
                    <Text style={styles.locationItemText}>
                      {prediction.structured_formatting.main_text}
                    </Text>
                    {!!prediction.structured_formatting.secondary_text && (
                      <Text style={styles.locationSecondaryText}>
                        {prediction.structured_formatting.secondary_text}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Active Filter Badge */}
      {!!selectedLocation && (
        <View style={styles.activeFilterContainer}>
          <View style={styles.filterBadge}>
            <MapPin size={14} color={Colors.white} />
            <Text style={styles.filterBadgeText}>{selectedLocation}</Text>
            <TouchableOpacity onPress={handleClearLocation}>
              <X size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          <DriverListingSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredDrivers}
          renderItem={renderDriverCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onRefresh={handleRefresh}
          refreshing={false}
          // Enable pagination when:
          // 1. No search/filter is active (client-side filtering)
          // 2. Tab is "all" or "own" (both support server-side pagination)
          // "available" tab uses client-side filtering, so pagination is disabled
          onEndReached={(!searchQuery && !selectedLocation && (activeTab === "all" || activeTab === "own")) ? loadMoreDrivers : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderListFooter}
        />
      )}

      {/* Change Driver Modal */}
      <ChangeDriverModal
        visible={showChangeModal}
        onClose={handleCloseModal}
        onConfirm={handleDriverChange}
        currentDriverName={(() => {
          const name = currentDriver?.user?.userName || currentDriver?.userName || currentDriver?.name || 'Unknown Driver';
          console.log('Modal currentDriverName resolved to:', name);
          return name;
        })()}
        newDriverName={selectedNewDriver?.name || ''}
        loading={changeLoading}
      />
    </View>
  );
}

export default DriverListingScreen;
