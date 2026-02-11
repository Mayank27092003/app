/**
 * Geocoding utilities for converting coordinates to addresses
 */

import { GOOGLE_MAPS_API_KEY } from '@app/configs';

export interface LocationInfo {
  city: string;
  state: string;
  country: string;
  fullAddress: string;
}

/**
 * Reverse geocoding using Google Geocoding API
 * More reliable and accurate than free services
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<LocationInfo | null> => {
  try {
    console.log('🔍 Starting reverse geocoding for:', { latitude, longitude });
    
    // Try Google API first if key is properly configured
    if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_API_KEY_HERE') {
      console.log('🔑 Using Google API key');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      console.log('📡 Google API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Google API response data:', data);
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components;
          
          // Extract city and state from address components
          let city = 'Unknown City';
          let state = 'Unknown State';
          let country = 'Unknown Country';
          
          for (const component of addressComponents) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (component.types.includes('country')) {
              country = component.long_name;
            }
          }
          
          return {
            city,
            state,
            country,
            fullAddress: result.formatted_address
          };
        }
      }
      
      console.log('⚠️ Google API failed, falling back to free service');
    }
    
    // Fallback to free geocoding service
    console.log('🆓 Using free geocoding service');
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    
    console.log('📡 Free service response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Both Google API and free geocoding failed');
    }
    
    const data = await response.json();
    console.log('📋 Free service response data:', data);
    
    return {
      city: data.city || data.locality || 'Unknown City',
      state: data.principalSubdivision || data.administrativeArea || 'Unknown State',
      country: data.countryName || 'Unknown Country',
      fullAddress: data.localityInfo?.administrative?.[0]?.name || 'Unknown Location'
    };
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Format location for display
 */
export const formatLocationDisplay = (locationInfo: LocationInfo | null): string => {
  if (!locationInfo) {
    return 'Location not available';
  }
  
  return `${locationInfo.city}, ${locationInfo.state}`;
};

/**
 * Get a short location string for display
 */
export const getShortLocation = (locationInfo: LocationInfo | null): string => {
  if (!locationInfo) {
    return 'Unknown';
  }
  
  return locationInfo.city;
};
