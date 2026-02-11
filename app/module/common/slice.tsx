/**
 * Common slice
 * @format
 */

import { createAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
  loader: false,
  user: {
    id: null,
    username: null,
    email: null,
  },
  activeSection: 'AuthSection', // Default to AuthSection instead of null
  authToken: null,
  deliveryAddressId: null,
  roles: [] as any[],
  profile: null as any,
  company: null as any,
  documentTypes: [] as any[],
  truckTypes: [] as any[],
  jobs: [] as any[],
  currentJob: null as any,
  drivers: [] as any[],
  carriers: [] as any[],
  driversPagination: {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasMore: false,
  } as {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasMore: boolean;
  },
};

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    changeAppSection(state, action) {
      state.activeSection = action.payload;
    },
    setAuthToken(state, action) {
      state.authToken = action.payload;
    },
    setDeliveryAddressId(state, action) {
      state.deliveryAddressId = action.payload;
    },
       setProfile(state, action) {
      state.profile = action.payload;
    },
    setCompany(state, action) {
      state.company = action.payload;
    },
    setDocumentTypes(state, action) {
      state.documentTypes = action.payload;
    },
    setTruckTypes(state, action) {
      state.truckTypes = action.payload;
    },
    setJobs(state, action) {
      state.jobs = action.payload;
    },
    setCurrentJob(state, action) {
      state.currentJob = action.payload;
    },
    setDrivers(state, action) {
      state.drivers = action.payload;
    },
    appendDrivers(state, action) {
      // Append new drivers, avoiding duplicates based on id
      const existingIds = new Set(state.drivers.map((d: any) => d.id));
      const newDrivers = action.payload.filter((d: any) => !existingIds.has(d.id));
      state.drivers = [...state.drivers, ...newDrivers];
    },
    setDriversPagination(state, action) {
      state.driversPagination = action.payload;
    },
    setCarriers(state, action) {
      state.carriers = action.payload;
    },
    appendCarriers(state, action) {
      // Append new carriers, avoiding duplicates based on id
      const existingIds = new Set(state.carriers.map((c: any) => c.id));
      const newCarriers = action.payload.filter((c: any) => !existingIds.has(c.id));
      state.carriers = [...state.carriers, ...newCarriers];
    },
    presentLoader(state) {
      console.log('presentLoader action dispatched - setting loader to true');
      state.loader = true;
    },
    dismissLoader(state) {
      console.log('dismissLoader action dispatched - setting loader to false');
      state.loader = false;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
     setRoles(state, action) {
      state.roles = action.payload;
    },
    
  },
  extraReducers: builder => {
    builder.addCase(logoutApp, () => {
      return initialState;
    });
  },
});

// Reducer )--------------------------------------
export const commonReducer = commonSlice.reducer;

// Actions )-------------------------------------
export const {
  presentLoader,
  dismissLoader,
  setUser,
  setAuthToken,
setRoles,
  changeAppSection,
  setDeliveryAddressId,
  setProfile,
  setCompany,
  setDocumentTypes,
  setTruckTypes,
  setJobs,
  setCurrentJob,
  setDrivers,
  appendDrivers,
  setDriversPagination,
  setCarriers,
  appendCarriers
} = commonSlice.actions;

//Other Actions

// Create loader
export const createLoader = () => {
  return {
    present: () => presentLoader(),
    dismiss: () => dismissLoader(),
  };
};

// Upload file action
export const uploadFile = (file: any, onSuccess?: (response: any) => void, onError?: (error: any) => void) => ({
  type: 'COMMON/UPLOAD_FILE',
  payload: { file, onSuccess, onError }
});

// Upload document action
export const uploadDocument = (documentData: any, onSuccess?: (response: any) => void, onError?: (error: any) => void) => ({
  type: 'COMMON/UPLOAD_DOCUMENT',
  payload: { documentData, onSuccess, onError }
});

export const deleteDocument = (documentId: number, onSuccess?: () => void, onError?: (error: any) => void) => ({
  type: 'COMMON/DELETE_DOCUMENT',
  payload: { documentId, onSuccess, onError }
});

// Voice message actions
export const uploadVoiceMessage = (voiceData: any, onSuccess?: (response: any) => void, onError?: (error: any) => void) => ({
  type: 'COMMON/UPLOAD_VOICE_MESSAGE',
  payload: { voiceData, onSuccess, onError }
});

export const sendVoiceMessage = (messageData: any, onSuccess?: (response: any) => void, onError?: (error: any) => void) => ({
  type: 'COMMON/SEND_VOICE_MESSAGE',
  payload: { messageData, onSuccess, onError }
});

// Create action for fetching document types
export const fetchDocumentTypes = createAction('COMMON/FETCH_DOCUMENT_TYPES');

// Create action for fetching user documents
export const fetchUserDocuments = createAction('COMMON/FETCH_USER_DOCUMENTS');

export const logoutApp = createAction('COMMON/LOGOUT');
