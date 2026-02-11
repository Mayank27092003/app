/**
 * Drivers sagas
 * @format
 */

import { put, takeLatest, call } from 'redux-saga/effects';
import { endPoints, httpRequest, socketService } from '@app/service';
import { showMessage } from 'react-native-flash-message';
import i18n from '@app/language/i18n';
import { presentLoader, dismissLoader, setDrivers, appendDrivers, setDriversPagination, setCarriers, appendCarriers } from '@app/module/common';
import { fetchDrivers, inviteDriver, assignDriver, assignCarrier, changeDriver, removeDriver, fetchCarriers } from './slice';
import { NavigationService } from '@app/helpers/navigation-service';
import { reverseGeocode, formatLocationDisplay } from '@app/utils/geocoding';

/**
 * Fetch drivers saga
 */
function* fetchDriversSaga(action: any): any {
  try {
    const { page = 1, limit = 10, userName, verificationStatus, sortBy, sortOrder, ownCompany, excludeCompany } = action.payload || {};
    
    console.log('fetchDriversSaga - fetching drivers with params:', { page, limit, userName, verificationStatus, sortBy, sortOrder, ownCompany, excludeCompany });
    
    // Build query parameters for the new API
    const params: Record<string, string> = {
      role: 'driver',
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    };
    
    // Add verificationStatus only if provided (if not provided, API will return all drivers)
    if (verificationStatus) {
      params.verificationStatus = verificationStatus;
    }
    
    // Add optional userName if provided
    if (userName) {
      params.userName = userName;
    }
    
    // Add ownCompany parameter if provided
    if (ownCompany !== undefined) {
      params.ownCompany = ownCompany.toString();
    }
    
    // Add excludeCompany parameter if provided
    if (excludeCompany !== undefined) {
      params.excludeCompany = excludeCompany.toString();
    }
    
    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = `${endPoints.getDrivers}?${queryString}`;
    
    console.log('fetchDriversSaga - API URL:', url);
    
    const response = yield call(httpRequest.get, url);
    
    console.log('fetchDriversSaga - API response:', response);
    console.log('fetchDriversSaga - response.success:', response?.success);
    console.log('fetchDriversSaga - response.users:', response?.users);
    console.log('fetchDriversSaga - response.data:', response?.data);
    
    if (response?.success && response?.users) {
      // Transform API response to match our Driver interface
      // First, map drivers to basic structure
      const driversWithCoords = response.users.map((driver: any) => {
        // Format phone number with country code
        const phoneNumber = driver.phoneNumber || driver.phone;
        // Get country code, default to +1 (US) if missing
        let phoneCountryCode = driver.phoneCountryCode || '';
        
        // If country code is empty or missing, use default
        if (!phoneCountryCode || phoneCountryCode.trim() === '') {
          phoneCountryCode = '+1'; // Default to US, adjust based on your app's primary market
        }
        
        // Ensure country code has + prefix
        if (phoneCountryCode && !phoneCountryCode.startsWith('+')) {
          phoneCountryCode = `+${phoneCountryCode}`;
        }
        
        const formattedPhone = phoneNumber 
          ? (phoneCountryCode ? `${phoneCountryCode} ${phoneNumber}` : phoneNumber)
          : undefined;

        // Extract location string from location object
        // The API returns location as an object with {id, userId, lat, lng, ...}
        let locationString = 'Location not available';
        let locationLat: number | null = null;
        let locationLng: number | null = null;
        
        if (driver.location) {
          if (typeof driver.location === 'string') {
            // Already a string, use it (but check if it's empty)
            locationString = driver.location.trim() || 'Location not available';
          } else if (typeof driver.location === 'object' && driver.location !== null) {
            // Handle location object - check for lat/lng
            const loc = driver.location as any;
            if (loc.lat && loc.lng) {
              // Store lat/lng for reverse geocoding
              locationLat = Number.parseFloat(loc.lat);
              locationLng = Number.parseFloat(loc.lng);
              
              // Check if lat/lng are valid numbers
              if (!Number.isNaN(locationLat) && !Number.isNaN(locationLng)) {
                // Initially show coordinates, will be updated with reverse geocode
                locationString = `${loc.lat}, ${loc.lng}`;
              } else {
                locationString = 'Location not available';
              }
            } else {
              // Location object exists but no lat/lng, use default
              locationString = 'Location not available';
            }
          }
        }
        
        // Fallback to address if location string is still default
        if (locationString === 'Location not available' && driver.address) {
          const address = String(driver.address).trim();
          locationString = address || 'Location not available';
        }
        
        // Final safety check - ensure it's always a string
        if (typeof locationString !== 'string' || !locationString.trim()) {
          locationString = 'Location not available';
        }

        // Extract vehicle type from trucks array
        let vehicleType = 'Truck Info.';
        if (driver.trucks && driver.trucks.length > 0) {
          const primaryTruck = driver.trucks.find((t: any) => t.isPrimary) || driver.trucks[0];
          if (primaryTruck?.truckType?.name) {
            vehicleType = primaryTruck.truckType.name;
          } else if (primaryTruck?.truckTypeId) {
            vehicleType = `Truck Type ${primaryTruck.truckTypeId}`;
          }
        } else if (driver.vehicleType || driver.truckType) {
          vehicleType = driver.vehicleType || driver.truckType;
        }

        // Extract jobs completed from driver object or default
        const jobsCompleted = driver.driver?.completedJobs || driver.jobsCompleted || driver.completedJobs || 0;

        return {
          id: driver.id?.toString() || driver._id?.toString(),
          name: driver.userName || driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
          rating: driver.rating || 0.0, // Default rating if not provided
          jobsCompleted: jobsCompleted,
          vehicleType: vehicleType,
          isAvailable: driver.verificationStatus === 'admin_verified', // Available if verified
          location: locationString, // Will be updated with reverse geocode
          locationLat: locationLat, // Store for reverse geocoding
          locationLng: locationLng, // Store for reverse geocoding
          profileImage: driver.profileImage || driver.avatar,
          phone: formattedPhone,
          phoneNumber: phoneNumber,
          phoneCountryCode: phoneCountryCode,
          email: driver.email,
          companyId: driver.companyId || driver.company?.id,
        };
      });

      // Reverse geocode locations in parallel for drivers that have coordinates
      const reverseGeocodePromises = driversWithCoords.map(async (driver: any) => {
        if (driver.locationLat !== null && driver.locationLng !== null && 
            !Number.isNaN(driver.locationLat) && !Number.isNaN(driver.locationLng)) {
          try {
            console.log(`📍 Reverse geocoding for driver ${driver.id}:`, { lat: driver.locationLat, lng: driver.locationLng });
            const locationInfo = await reverseGeocode(driver.locationLat, driver.locationLng);
            if (locationInfo) {
              const locationName = formatLocationDisplay(locationInfo);
              console.log(`✅ Location name for driver ${driver.id}:`, locationName);
              // Keep lat/lng for distance calculation
              return { ...driver, location: locationName };
            } else {
              // Reverse geocoding returned null, keep coordinates or show not available
              // Keep lat/lng for distance calculation
              const finalLocation = driver.location && driver.location.includes(',') 
                ? driver.location 
                : 'Location not available';
              return { ...driver, location: finalLocation };
            }
          } catch (error) {
            console.error(`❌ Reverse geocoding failed for driver ${driver.id}:`, error);
            // Keep the coordinates as fallback if we have them
            // Keep lat/lng for distance calculation
            const finalLocation = driver.location && driver.location.includes(',') 
              ? driver.location 
              : 'Location not available';
            return { ...driver, location: finalLocation };
          }
        }
        // Keep lat/lng for distance calculation
        // Ensure location is set to "Location not available" if it's still the default
        if (!driver.location || driver.location === 'Location not specified') {
          driver.location = 'Location not available';
        }
        return driver;
      });

      // Wait for all reverse geocoding to complete (using call for saga compatibility)
      const drivers = yield call(() => Promise.all(reverseGeocodePromises));
      
      // Extract pagination metadata from API response
      const currentPage = response.page || page;
      const totalPages = response.totalPages || 1;
      const totalUsers = response.totalUsers || 0;
      const hasMore = currentPage < totalPages;
      
      console.log('📄 Pagination metadata:', {
        currentPage,
        totalPages,
        totalUsers,
        hasMore,
        driversFetched: drivers.length
      });
      
      // Update pagination state
      yield put(setDriversPagination({
        currentPage,
        totalPages,
        totalUsers,
        hasMore,
      }));
      
      // If page > 1, append drivers; otherwise replace
      if (page > 1) {
        yield put(appendDrivers(drivers));
      } else {
        yield put(setDrivers(drivers));
      }
      
    } else {
      const errorMessage = response?.message || "Failed to fetch drivers";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('fetchDriversSaga - Error:', error);
    showMessage({
      message: i18n.t("common.error"),
      description: i18n.t("common.failedToFetchDrivers") || "Failed to fetch drivers. Please try again.",
      type: "danger",
    });
  }
}
function* fetchCarriersSaga(action: any): any {
  try {
    const { 
      page = 1, 
      limit = 10, 
      userName, 
      verificationStatus = 'pending', 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      ownCompany = false, 
      excludeCompany = false,
      radius = 50
    } = action.payload || {};
    
    console.log('fetchCarriersSaga - fetching carriers with params:', { 
      page, 
      limit, 
      userName, 
      verificationStatus, 
      sortBy, 
      sortOrder, 
      ownCompany, 
      excludeCompany,
      radius
    });
    
    // Build query parameters matching the curl request
    const params: Record<string, string> = {
      role: 'carrier',
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortBy,
      sortOrder: sortOrder,
      ownCompany: ownCompany.toString(),
      excludeCompany: excludeCompany.toString(),
      verificationStatus: verificationStatus,
      radius: radius.toString(),
    };
    
    // Add optional userName if provided
    if (userName) {
      params.userName = userName;
    }
    
    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = `${endPoints.getCarriers}?${queryString}`;
    
    console.log('fetchCarriersSaga - API URL:', url);
    
    const response = yield call(httpRequest.get, url);
    
    console.log('fetchCarriersSaga - API response:', response);
    console.log('fetchCarriersSaga - response.success:', response?.success);
    console.log('fetchCarriersSaga - response.users:', response?.users);
    console.log('fetchCarriersSaga - response.data:', response?.data);
    
    if (response?.success && response?.users) {
      // Transform API response to match our Carrier interface
      const carriers = response.users.map((carrier: any) => ({
        id: carrier.id?.toString() || carrier._id?.toString(),
        name: carrier.userName || carrier.name || `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim(),
        userName: carrier.userName,
        firstName: carrier.firstName,
        lastName: carrier.lastName,
        rating: carrier.rating || 0.0, // Default rating if not provided
        jobsCompleted: carrier.jobsCompleted || carrier.completedJobs || 0,
        vehicleType: carrier.vehicleType || carrier.truckType || 'Truck Info.',
        isAvailable: carrier.isAvailable !== false, // Default to true if not specified
        location: carrier.location || carrier.address || 'Location not specified',
        profileImage: carrier.profileImage || carrier.avatar,
        phone: carrier.phone,
        email: carrier.email,
      }));
      
      // If page > 1, append carriers; otherwise replace
      if (page > 1) {
        yield put(appendCarriers(carriers));
      } else {
        yield put(setCarriers(carriers));
      }
      
    } else {
      const errorMessage = response?.message || "Failed to fetch carriers";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('fetchCarriersSaga - Error:', error);
    showMessage({
      message: "Error",
      description: "Failed to fetch carriers. Please try again.",
      type: "danger",
    });
  }
}

/**
 * Invite driver saga
 */
function* inviteDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { driverId, jobId } = action.payload;
    
    console.log('inviteDriverSaga - inviting driver:', { driverId, jobId });
    
    // Note: This endpoint needs to be implemented in the backend
    const response = yield call(
      httpRequest.post, 
      '/driver/invite',
      { driverId, jobId }
    );
    
    if (response?.success) {
      showMessage({
        message: "Invitation Sent",
        description: "Driver invitation has been sent successfully!",
        type: "success",
      });
    } else {
      const errorMessage = response?.message || "Failed to send invitation";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
    }
  } catch (error) {
    console.error('inviteDriverSaga - Error:', error);
    showMessage({
      message: "Error",
      description: "Failed to send invitation. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Assign driver saga
 */
function* assignDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { driverId, jobId, contractId, driverName } = action.payload;
    
    console.log('assignDriverSaga - assigning driver:', { driverId, jobId, contractId, driverName });
    
    // Use contractId if provided, otherwise use jobId as contractId
    const actualContractId = contractId ;
    console.log('assignDriverSaga - actualContractId:', actualContractId);
    // Call the correct API endpoint
    const response = yield call(
      httpRequest.post, 
      `/contract/${actualContractId}participants/driver`,
      {
        driverUserId: parseInt(driverId)
      }
    );
    
    console.log('assignDriverSaga - API response:', response);
    
    if (response?.success) {
      // Also emit socket event for real-time updates
      const socketSuccess = socketService.assignJob(jobId, driverId);
      console.log('assignDriverSaga - Socket event emitted:', socketSuccess);
      
      showMessage({
        message: "Driver Assigned",
        description: `${driverName || 'Driver'} has been assigned successfully!`,
        type: "success",
      });
      
      // Call success callback if provided
      if (action.payload.onSuccess) {
        action.payload.onSuccess(response);
      }
      
      // Navigate back after successful assignment
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to assign driver";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (action.payload.onError) {
        action.payload.onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('assignDriverSaga - Error:', error);
    const errorMessage = error?.message || "Failed to assign driver. Please try again.";
    
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Assign carrier saga
 */
function* assignCarrierSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { carrierUserId, contractId, onSuccess, onError } = action.payload;
    
    console.log('assignCarrierSaga - assigning carrier:', { carrierUserId, contractId });
    
    const response = yield call(
      httpRequest.post, 
      `/contract/${contractId}/participants/carrier`,
      {
        carrierUserId: parseInt(carrierUserId)
      }
    );
    
    console.log('assignCarrierSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Carrier Assigned",
        description: "Carrier has been assigned successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate back after successful assignment
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to assign carrier";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('assignCarrierSaga - Error:', error);
    const errorMessage = error?.message || "Failed to assign carrier. Please try again.";
    
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Change driver saga
 */
function* changeDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { contractId, currentDriverUserId, newDriverUserId, reason, onSuccess, onError } = action.payload;
    
    console.log('changeDriverSaga - changing driver:', { contractId, currentDriverUserId, newDriverUserId, reason });
    
    const response = yield call(
      httpRequest.post, 
      endPoints.changeDriver(parseInt(contractId)),
      {
        currentDriverUserId: parseInt(currentDriverUserId),
        newDriverUserId: parseInt(newDriverUserId),
        reason: reason
      }
    );
    
    console.log('changeDriverSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Driver Changed",
        description: "Driver has been changed successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate back after successful change
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to change driver";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('changeDriverSaga - Error:', error);
    const errorMessage = error?.message || "Failed to change driver. Please try again.";
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Remove driver saga
 */
function* removeDriverSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { contractId, driverId, reason, onSuccess, onError } = action.payload;
    
    console.log('removeDriverSaga - removing driver:', { contractId, driverId, reason });
    
    const response = yield call(
      httpRequest.delete, 
      endPoints.removeDriver(parseInt(contractId), parseInt(driverId)),
      { data: { reason: reason } }
    );
    
    console.log('removeDriverSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Driver Removed",
        description: "Driver has been removed successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate back after successful removal
      yield call(NavigationService.goBack);
    } else {
      const errorMessage = response?.message || "Failed to remove driver";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('removeDriverSaga - Error:', error);
    const errorMessage = error?.message || "Failed to remove driver. Please try again.";
    showMessage({
      message: "Error",
      description: errorMessage,
      type: "danger",
    });
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Root drivers saga
 */
function* driversSagas() {
  yield takeLatest(fetchDrivers, fetchDriversSaga);
  yield takeLatest(fetchCarriers, fetchCarriersSaga);
  yield takeLatest(inviteDriver, inviteDriverSaga);
  yield takeLatest(assignDriver, assignDriverSaga);
  yield takeLatest(assignCarrier, assignCarrierSaga);
  yield takeLatest(changeDriver, changeDriverSaga);
  yield takeLatest(removeDriver, removeDriverSaga);
}

export { driversSagas };
