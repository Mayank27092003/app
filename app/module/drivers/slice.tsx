/**
 * Drivers slice
 * @format
 */

import { createAction } from '@reduxjs/toolkit';

// Fetch drivers action
export const fetchDrivers = createAction<{ page?: number; limit?: number }>('DRIVERS/FETCH_DRIVERS');
export const fetchCarriers = createAction<{ page?: number; limit?: number }>('DRIVERS/FETCH_CARRIERS');

// Invite driver action
export const inviteDriver = createAction<{ driverId: string; jobId?: string }>('DRIVERS/INVITE_DRIVER');

// Assign driver action
export const assignDriver = createAction<{ driverId: string; jobId: string; contractId?: string }>('DRIVERS/ASSIGN_DRIVER');

// Assign carrier action
export const assignCarrier = createAction<{ 
  carrierUserId: string; 
  contractId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}>('DRIVERS/ASSIGN_CARRIER');

// Change driver action
export const changeDriver = createAction<{ 
  contractId: string; 
  currentDriverUserId: string; 
  newDriverUserId: string; 
  reason: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}>('DRIVERS/CHANGE_DRIVER');

// Remove driver action
export const removeDriver = createAction<{ 
  contractId: string; 
  driverId: string; 
  reason: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}>('DRIVERS/REMOVE_DRIVER');
