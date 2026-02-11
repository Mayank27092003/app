/**
 * Driver Detail Screen
 * @format
 */

import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Linking, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  User,
  Star,
  MapPin,
  Phone,
  Mail,
  Truck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Briefcase,
  MessageCircle,
} from "lucide-react-native";
import { Colors, useThemedStyle } from "@app/styles";
import Header from "@app/components/Header";
import { useTranslation } from "react-i18next";
import { httpRequest, endPoints } from "@app/service";
import { showMessage } from "react-native-flash-message";
import { useAuthStore } from "@app/store/authStore";
import { createDirectConversation } from "@app/service/conversations-service";
import { useCallStore } from "@app/store/callStore";
import { webrtcService } from "@app/service/webrtc-service";
import { Routes } from "@app/navigator";
import { findCountryByCallingCode } from "@app/constants/countries";
import { reverseGeocode, formatLocationDisplay } from "@app/utils/geocoding";

interface Driver {
  id: string;
  name: string;
  rating: number;
  jobsCompleted: number;
  vehicleType: string;
  profileImage?: string;
  isAvailable: boolean;
  location?: string;
  phone?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  email?: string;
}

interface RouteParams {
  driverId?: string;
  driver?: Driver;
}

const getStyles = () => ({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray200,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statusBadgeAvailable: {
    backgroundColor: Colors.success + '20',
  },
  statusBadgeUnavailable: {
    backgroundColor: Colors.error + '20',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusTextAvailable: {
    color: Colors.success,
  },
  statusTextUnavailable: {
    color: Colors.error,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.gray600,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.warning,
    marginLeft: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray600,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  actionButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
});

function DriverDetailScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const route = useRoute();
  const navigation = useNavigation();
  const { driverId, driver: initialDriver } = route.params as RouteParams;
  const { userProfile } = useAuthStore();
  const { initiateCall } = useCallStore();

  const [driver, setDriver] = useState<Driver | null>(initialDriver || null);
  const [loading, setLoading] = useState(!initialDriver);
  const [error, setError] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  useEffect(() => {
    // If driver data was passed, use it; otherwise fetch
    if (initialDriver) {
      // Ensure phone fields are properly formatted if passed from listing
      let phoneCountryCode = initialDriver.phoneCountryCode || '';
      
      // If country code is missing, try to get from current user or use default
      if (!phoneCountryCode || phoneCountryCode.trim() === '') {
        const currentUser = useAuthStore.getState().userProfile;
        phoneCountryCode = currentUser?.phoneCountryCode || '+1';
      }
      
      // Ensure country code has + prefix
      if (phoneCountryCode && !phoneCountryCode.startsWith('+')) {
        phoneCountryCode = `+${phoneCountryCode}`;
      }
      
      const formattedPhone = initialDriver.phoneNumber 
        ? (phoneCountryCode ? `${phoneCountryCode} ${initialDriver.phoneNumber}` : initialDriver.phoneNumber)
        : initialDriver.phone;
      
      const formattedDriver = {
        ...initialDriver,
        phone: formattedPhone,
        phoneCountryCode: phoneCountryCode,
      };
      setDriver(formattedDriver);
      setLoading(false);
    } else if (driverId) {
      fetchDriverDetails();
    } else {
      setError('Driver ID is required');
      setLoading(false);
    }
  }, [driverId, initialDriver]);

  const fetchDriverDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Since there's no specific endpoint for single driver, 
      // we'll use the drivers list endpoint and filter
      const response = await httpRequest.get(endPoints.getDrivers);
      
      if (response?.success && response?.users) {
        const foundDriver = response.users.find(
          (d: any) => d.id?.toString() === driverId || d._id?.toString() === driverId
        );

        if (foundDriver) {
          // Format phone number with country code
          const phoneNumber = foundDriver.phoneNumber || foundDriver.phone;
          // Get country code, default to +1 (US) if missing
          let phoneCountryCode = foundDriver.phoneCountryCode || '';
          
          // If country code is empty or missing, try to infer or use default
          if (!phoneCountryCode || phoneCountryCode.trim() === '') {
            // Try to get from user profile if available
            const currentUser = useAuthStore.getState().userProfile;
            if (currentUser?.phoneCountryCode) {
              phoneCountryCode = currentUser.phoneCountryCode;
            } else {
              // Default to +1 (US) for 10-digit numbers, or +91 (India) as fallback
              // You can adjust this logic based on your app's primary market
              phoneCountryCode = '+1'; // Default to US
            }
          }
          
          // Ensure country code has + prefix
          if (phoneCountryCode && !phoneCountryCode.startsWith('+')) {
            phoneCountryCode = `+${phoneCountryCode}`;
          }
          
          const formattedPhone = phoneNumber 
            ? (phoneCountryCode ? `${phoneCountryCode} ${phoneNumber}` : phoneNumber)
            : undefined;

          // Extract location string from location object (same logic as saga)
          const locationNotAvailableText = t('drivers.locationNotAvailable');
          let locationString = locationNotAvailableText;
          let locationLat: number | null = null;
          let locationLng: number | null = null;
          
          if (foundDriver.location) {
            if (typeof foundDriver.location === 'string') {
              locationString = foundDriver.location.trim() || locationNotAvailableText;
            } else if (typeof foundDriver.location === 'object' && foundDriver.location !== null) {
              const loc = foundDriver.location as any;
              if (loc.lat && loc.lng) {
                locationLat = Number.parseFloat(loc.lat);
                locationLng = Number.parseFloat(loc.lng);
                // Check if lat/lng are valid numbers
                if (!Number.isNaN(locationLat) && !Number.isNaN(locationLng)) {
                  // Initially show coordinates, will be updated with reverse geocode
                  locationString = `${loc.lat}, ${loc.lng}`;
                } else {
                  locationString = locationNotAvailableText;
                }
              } else {
                locationString = locationNotAvailableText;
              }
            }
          }
          
          if (locationString === locationNotAvailableText && foundDriver.address) {
            const address = String(foundDriver.address).trim();
            locationString = address || locationNotAvailableText;
          }
          
          // Ensure locationString is always a string
          if (typeof locationString !== 'string' || !locationString.trim()) {
            locationString = locationNotAvailableText;
          }

          // Reverse geocode location if we have lat/lng
          if (locationLat !== null && locationLng !== null && 
              !Number.isNaN(locationLat) && !Number.isNaN(locationLng)) {
            try {
              console.log(`📍 Reverse geocoding for driver detail:`, { lat: locationLat, lng: locationLng });
              const locationInfo = await reverseGeocode(locationLat, locationLng);
              if (locationInfo) {
                locationString = formatLocationDisplay(locationInfo);
                console.log(`✅ Location name for driver detail:`, locationString);
              } else {
                // If reverse geocoding returns null, keep coordinates or show not available
                if (!locationString.includes(',')) {
                  locationString = locationNotAvailableText;
                }
              }
            } catch (error) {
              console.error(`❌ Reverse geocoding failed for driver detail:`, error);
              // Keep the coordinates as fallback if we have them
              if (!locationString.includes(',')) {
                locationString = locationNotAvailableText;
              }
            }
          }

          // Extract vehicle type from trucks array (same logic as saga)
          let vehicleType = 'Not specified';
          if (foundDriver.trucks && foundDriver.trucks.length > 0) {
            const primaryTruck = foundDriver.trucks.find((t: any) => t.isPrimary) || foundDriver.trucks[0];
            if (primaryTruck?.truckType?.name) {
              vehicleType = primaryTruck.truckType.name;
            } else if (primaryTruck?.truckTypeId) {
              vehicleType = `Truck Type ${primaryTruck.truckTypeId}`;
            }
          } else if (foundDriver.vehicleType || foundDriver.truckType) {
            vehicleType = foundDriver.vehicleType || foundDriver.truckType;
          }

          // Extract jobs completed from driver object
          const jobsCompleted = foundDriver.driver?.completedJobs || foundDriver.jobsCompleted || foundDriver.completedJobs || 0;

          const driverData: Driver = {
            id: foundDriver.id?.toString() || foundDriver._id?.toString(),
            name: foundDriver.userName || foundDriver.name || `${foundDriver.firstName || ''} ${foundDriver.lastName || ''}`.trim(),
            rating: foundDriver.rating || 0.0,
            jobsCompleted: jobsCompleted,
            vehicleType: vehicleType,
            isAvailable: foundDriver.verificationStatus === 'admin_verified',
            location: locationString,
            profileImage: foundDriver.profileImage || foundDriver.avatar,
            phone: formattedPhone,
            phoneNumber: phoneNumber,
            phoneCountryCode: phoneCountryCode,
            email: foundDriver.email,
          };
          setDriver(driverData);
        } else {
          setError('Driver not found');
        }
      } else {
        setError('Failed to fetch driver details');
      }
    } catch (err: any) {
      console.error('Error fetching driver details:', err);
      setError(err?.message || 'Failed to fetch driver details');
      showMessage({
        message: t("common.error"),
        description: 'Failed to load driver details. Please try again.',
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCall = () => {
    // Use phoneNumber if available, otherwise use phone
    const phoneToCall = driver?.phoneNumber || driver?.phone;
    if (phoneToCall) {
      // Remove any spaces or special characters for tel: link
      const cleanPhone = phoneToCall.replace(/[\s\-\(\)]/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    }
  };

  const handleEmail = () => {
    if (driver?.email) {
      Linking.openURL(`mailto:${driver.email}`);
    }
  };

  const handleStartChat = async () => {
    if (!driver || !driver.id) {
      Alert.alert(t("common.error"), "Driver information is missing");
      return;
    }

    try {
      setIsMessaging(true);
      
      // Convert driver.id to number - driver.id is the user ID from API
      const driverUserId = Number(driver.id);
      
      console.log('💬 Starting chat with driver:', {
        driverId: driver.id,
        driverIdType: typeof driver.id,
        driverUserId,
        driverName: driver.name,
      });

      // Validate driver ID
      if (Number.isNaN(driverUserId) || driverUserId <= 0) {
        console.error('❌ Invalid driver ID:', driver.id, 'converted to:', driverUserId);
        Alert.alert(t("common.error"), `Invalid driver ID: ${driver.id}`);
        setIsMessaging(false);
        return;
      }

      console.log('💬 Calling createDirectConversation with driverUserId:', driverUserId);

      // Create or get conversation with the driver using createDirectConversation
      const conversation = await createDirectConversation(driverUserId);
      
      console.log('💬 Conversation created/found:', conversation);
      console.log('💬 Conversation ID:', conversation?.id);
      
      if (!conversation) {
        throw new Error("No conversation data returned from server.");
      }

      if (!conversation.id) {
        console.error('❌ Conversation missing ID:', conversation);
        throw new Error("Failed to create conversation. Invalid response from server - missing conversation ID.");
      }
      
      const conversationId = conversation.id.toString();
      console.log('💬 Navigating to ChatScreen with conversationId:', conversationId);
      
      // Create selectedParticipant object with driver information for ChatScreen
      const selectedParticipant = {
        id: driver.id.toString(),
        userName: driver.name || '',
        firstName: driver.name?.split(' ')[0] || '',
        lastName: driver.name?.split(' ').slice(1).join(' ') || '',
        profileImage: driver.profileImage,
        phoneNumber: driver.phoneNumber,
        phoneCountryCode: driver.phoneCountryCode,
        role: 'driver',
        isOnline: false,
        lastSeen: undefined,
      };
      
      console.log('💬 Selected participant data:', selectedParticipant);
      
      // Navigate to chat screen with conversation details and participant info
      (navigation as any).navigate(Routes.ChatScreen, {
        conversationId: conversationId,
        id: conversationId,
        selectedParticipant: selectedParticipant,
        conversation: conversation,
      });
    } catch (error: any) {
      console.error('❌ Error starting chat:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      // Extract error message
      let errorMessage = "Failed to start chat. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert(
        t("common.error") || "Error",
        errorMessage
      );
    } finally {
      setIsMessaging(false);
    }
  };

  const handleStartCall = async () => {
    if (!driver || !driver.id) {
      Alert.alert(t("common.error"), "Driver information is missing");
      return;
    }

    try {
      setIsCalling(true);
      console.log('📞 Starting call with driver:', driver.id);

      // Convert driver.id to number - driver.id is the user ID from API
      const driverUserId = Number(driver.id);
      
      console.log('📞 Call Debug Info:', {
        driverId: driver.id,
        driverIdType: typeof driver.id,
        driverUserId,
        driverName: driver.name,
      });

      // Validate driver ID
      if (Number.isNaN(driverUserId) || driverUserId <= 0) {
        console.error('❌ Invalid driver ID:', driver.id, 'converted to:', driverUserId);
        Alert.alert(t("common.error"), `Invalid driver ID: ${driver.id}`);
        setIsCalling(false);
        return;
      }

      // First, create or get conversation
      const conversation = await createDirectConversation(driverUserId);
      console.log('📞 Conversation ID for call:', conversation.id);

      // Initiate call via backend API
      const result = await webrtcService.initiateCall(
        Number(conversation.id),
        'audio',
        false // Not a group call
      );

      console.log('✅ Call initiated successfully:', result);

      // Create selectedParticipant object with driver information for CallScreen
      const selectedParticipant = {
        id: driver.id.toString(),
        userName: driver.name || '',
        firstName: driver.name?.split(' ')[0] || '',
        lastName: driver.name?.split(' ').slice(1).join(' ') || '',
        profileImage: driver.profileImage,
        phoneNumber: driver.phoneNumber,
        phoneCountryCode: driver.phoneCountryCode,
        role: 'driver',
        isOnline: false,
        lastSeen: undefined,
      };
      
      console.log('📞 Selected participant data:', selectedParticipant);

      // Navigate to call screen with driver information
      (navigation as any).navigate(Routes.CallScreen, {
        callId: result.data.id.toString(),
        receiverId: conversation.id.toString(),
        callType: 'audio',
        isBackendCall: true,
        conversationId: Number(conversation.id),
        selectedParticipant: selectedParticipant,
        receiverName: driver.name, // Add receiver name for call screen display
      });
    } catch (error: any) {
      console.error('❌ Error starting call:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      // Extract error message
      let errorMessage = "Failed to start call. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert(
        t("common.callError") || "Call Error",
        errorMessage
      );
    } finally {
      setIsCalling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Driver Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 16, color: Colors.text }}>Loading driver details...</Text>
        </View>
      </View>
    );
  }

  if (error || !driver) {
    return (
      <View style={styles.container}>
        <Header title="Driver Details" />
        <View style={styles.errorContainer}>
          <XCircle size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error || t('drivers.driverNotFound')}</Text>
          <TouchableOpacity
            style={[styles.actionButton, { marginTop: 20 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionButtonText}>{t('drivers.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Driver Details" />
      <View style={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            {driver.profileImage ? (
              <Image
                source={{ uri: driver.profileImage }}
                style={styles.avatar}
                defaultSource={require("../../../assets/dummyImage.png")}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{driver.name}</Text>

          <View style={[
            styles.statusBadge,
            driver.isAvailable ? styles.statusBadgeAvailable : styles.statusBadgeUnavailable
          ]}>
            {driver.isAvailable ? (
              <CheckCircle size={16} color={Colors.success} />
            ) : (
              <XCircle size={16} color={Colors.error} />
            )}
            <Text style={[
              styles.statusText,
              driver.isAvailable ? styles.statusTextAvailable : styles.statusTextUnavailable
            ]}>
              {driver.isAvailable ? 'Available' : 'Not Available'}
            </Text>
          </View>
        </View>

        {/* Call and Message Actions - At the Top */}
        <View style={[styles.infoCard, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row' }}>
            {/* Message Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { 
                  flex: 1,
                  backgroundColor: Colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 0,
                  marginRight: 6,
                  padding: 14,
                }
              ]}
              onPress={handleStartChat}
              disabled={isMessaging}
              activeOpacity={0.7}
            >
              {isMessaging ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <MessageCircle size={20} color={Colors.white} />
                  <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>
                    Message
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Call Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { 
                  flex: 1,
                  backgroundColor: Colors.success,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 0,
                  marginLeft: 6,
                  padding: 14,
                }
              ]}
              onPress={handleStartCall}
              disabled={isCalling}
              activeOpacity={0.7}
            >
              {isCalling ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Phone size={20} color={Colors.white} />
                  <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>
                    Call
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Rating & Stats Card */}
        <View style={styles.infoCard}>
          <View style={[styles.infoRow, { marginBottom: 12 }]}>
            <Star size={20} color={Colors.warning} fill={Colors.warning} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rating</Text>
              <View style={styles.ratingSection}>
                <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
                <Text style={{ color: Colors.gray600, marginLeft: 8, fontSize: 14 }}>
                  ({driver.jobsCompleted} {driver.jobsCompleted === 1 ? t('drivers.job') : t('drivers.jobs')})
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{driver.jobsCompleted}</Text>
              <Text style={styles.statLabel}>{t('drivers.jobsCompleted')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{driver.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{t('drivers.rating')}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.infoCard}>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <Truck size={20} color={Colors.primary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('drivers.vehicleType')}</Text>
              <Text style={styles.infoValue}>{driver.vehicleType}</Text>
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.infoCard}>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <MapPin size={20} color={Colors.primary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('drivers.location')}</Text>
              <Text style={styles.infoValue}>
                {driver.location && typeof driver.location === 'string' && driver.location !== t('drivers.locationNotAvailable')
                  ? driver.location 
                  : t('drivers.locationNotAvailable')}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        {((driver.phone || driver.phoneNumber) || driver.email) && (
          <View style={styles.infoCard}>
            <Text style={[styles.infoLabel, { marginBottom: 10, fontSize: 14, fontWeight: '600' }]}>
              {t('drivers.contactInformation')}
            </Text>

            {(driver.phone || driver.phoneNumber) && (
              <TouchableOpacity
                style={[styles.infoRow, { marginBottom: driver.email ? 10 : 0 }]}
                onPress={handlePhoneCall}
                activeOpacity={0.7}
              >
                <Phone size={20} color={Colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('drivers.phone')}</Text>
                  <Text style={styles.infoValue}>
                    {driver.phone || (driver.phoneCountryCode && driver.phoneNumber 
                      ? `${driver.phoneCountryCode} ${driver.phoneNumber}` 
                      : driver.phoneNumber)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {driver.email && (
              <TouchableOpacity
                style={[styles.infoRow, { marginBottom: 0 }]}
                onPress={handleEmail}
                activeOpacity={0.7}
              >
                <Mail size={20} color={Colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('drivers.email')}</Text>
                  <Text style={styles.infoValue}>{driver.email}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default DriverDetailScreen;

