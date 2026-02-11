/**
 * Google Places Autocomplete utilities
 */

import { GOOGLE_MAPS_API_KEY } from '@app/configs';

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
}

/**
 * Get place predictions from Google Places Autocomplete API
 */
export const getPlacePredictions = async (
  input: string,
  sessionToken?: string,
  location?: { latitude: number; longitude: number }
): Promise<PlacePrediction[]> => {
  try {
    if (!input || input.length < 2) {
      return [];
    }

    // Build the API URL with location bias if available
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${GOOGLE_MAPS_API_KEY}&sessiontoken=${sessionToken || 'new'}`;

    // Add location bias if location is provided (without radius restriction)
    if (location) {
      url += `&location=${location.latitude},${location.longitude}`;
      // Remove radius parameter to get all results globally
      // url += `&radius=${radius || 50000}`;
    }

    // Add language parameter for better search results
    url += `&language=en`;

    console.log('🔍 Google Places API URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error('🔍 Google Places API request failed:', response.status, response.statusText);
      throw new Error(`Places API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('🔍 Google Places API response:', {
      status: data.status,
      predictionsCount: data.predictions?.length || 0,
      location: location ? `${location.latitude},${location.longitude}` : 'none',
      searchType: location ? 'location-biased (global)' : 'global',
      input: input,
      errorMessage: data.error_message || 'none'
    });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('🔍 Google Places API error:', data.status, data.error_message);
      throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (data.status === 'ZERO_RESULTS') {
      console.log('🔍 Google Places API: No results found for input:', input);
      
      // If we have location bias and got no results, try without location bias
      if (location) {
        console.log('🔍 Google Places API: Retrying without location bias...');
        try {
          const fallbackUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input
          )}&key=${GOOGLE_MAPS_API_KEY}&sessiontoken=${sessionToken || 'new'}&language=en`;
          
          console.log('🔍 Google Places API Fallback URL:', fallbackUrl);
          
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log('🔍 Google Places API Fallback response:', {
              status: fallbackData.status,
              predictionsCount: fallbackData.predictions?.length || 0
            });
            
            if (fallbackData.status === 'OK' && fallbackData.predictions?.length > 0) {
              return fallbackData.predictions;
            }
          }
        } catch (fallbackError) {
          console.error('🔍 Google Places API Fallback error:', fallbackError);
        }
      }
      
      return [];
    }

    return data.predictions || [];
  } catch (error) {
    console.error('Error fetching place predictions:', error);
    return [];
  }
};

/**
 * Get place details from Google Places API
 */
export const getPlaceDetails = async (
  placeId: string,
  sessionToken?: string
): Promise<PlaceDetails | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&sessiontoken=${sessionToken || 'new'}&fields=place_id,formatted_address,address_components,geometry`
    );

    if (!response.ok) {
      throw new Error('Place details API request failed');
    }

    const data = await response.json();

    console.log('🔍 getPlaceDetails - API response:', data);

    if (data.status !== 'OK') {
      throw new Error(`Place details API error: ${data.status}`);
    }

    console.log('🔍 getPlaceDetails - result:', data.result);
    console.log('🔍 getPlaceDetails - geometry:', data.result?.geometry);

    return data.result || null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

/**
 * Parse address components from Google Places API response
 */
export const parseAddressComponents = (placeDetails: PlaceDetails): ParsedAddress => {
  const components = placeDetails.address_components;
  
  let address = '';
  let city = '';
  let state = '';
  let pincode = '';
  let country = '';

  // Extract components based on types
  for (const component of components) {
    if (component.types.includes('street_number') || component.types.includes('route')) {
      address = address ? `${address} ${component.long_name}` : component.long_name;
    } else if (component.types.includes('locality')) {
      city = component.long_name;
    } else if (component.types.includes('administrative_area_level_1')) {
      state = component.long_name;
    } else if (component.types.includes('postal_code')) {
      pincode = component.long_name;
    } else if (component.types.includes('country')) {
      country = component.long_name;
    }
  }

  // If no specific address found, use the full formatted address
  if (!address) {
    address = placeDetails.formatted_address;
  }

  const parsedAddress = {
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    country: country.trim(),
    latitude: placeDetails.geometry.location.lat,
    longitude: placeDetails.geometry.location.lng,
  };

  console.log('🔍 parseAddressComponents - placeDetails.geometry:', placeDetails.geometry);
  console.log('🔍 parseAddressComponents - coordinates:', {
    lat: placeDetails.geometry.location.lat,
    lng: placeDetails.geometry.location.lng
  });
  console.log('🔍 parseAddressComponents - parsed address:', parsedAddress);

  return parsedAddress;
};

/**
 * Generate a session token for Google Places API
 */
export const generateSessionToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
