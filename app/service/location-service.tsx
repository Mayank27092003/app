/**
 * Location Service
 * @format
 */

import { httpRequest } from './http-service';
import { endPoints } from './endpoints';

export interface LiveLocationData {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number;
  speed: number;
  battery: number;
  provider: string;
}

/**
 * Send live location data to the server
 * @param locationData - The location data to send
 * @returns Promise<boolean> - Success status
 */
export const sendLiveLocation = async (locationData: LiveLocationData): Promise<boolean> => {
  try {
    console.log('📍 LocationService: Sending live location data:', locationData);
    console.log('📍 LocationService: Endpoint:', endPoints.liveLocation);
    
    const response = await httpRequest.post(endPoints.liveLocation, locationData);
    console.log('📍 LocationService: Live location sent successfully:', response);
    console.log('📍 LocationService: Response status:', response?.status);
    console.log('📍 LocationService: Response data:', response?.data);
    return true;
  } catch (error) {
    console.error('📍 LocationService: Error sending live location:', error);
    console.error('📍 LocationService: Error details:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    return false;
  }
};

/**
 * Create live location data from current location and device info
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @param accuracy - Location accuracy in meters
 * @param heading - Device heading in degrees
 * @param speed - Device speed in m/s
 * @param battery - Battery percentage
 * @param provider - Location provider (gps, network, etc.)
 * @returns LiveLocationData object
 */
export const createLiveLocationData = (
  latitude: number,
  longitude: number,
  accuracy: number = 5.0,
  heading: number = 0,
  speed: number = 0,
  battery: number = 100,
  provider: string = 'gps'
): LiveLocationData => {
  return {
    lat: latitude,
    lng: longitude,
    accuracy,
    heading,
    speed,
    battery,
    provider,
  };
};
