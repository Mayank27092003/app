/**
 * Common selectors
 * @format
 */

import type { RootState } from '@app/redux';

const commonReducer = (state: RootState) => state.commonReducer;

export const selectLoader = (state: RootState) => commonReducer(state).loader;
export const selectProfile = (state: RootState) => commonReducer(state).profile;
export const selectCompany = (state: RootState) => commonReducer(state).company;
export const selectDocumentTypes = (state: RootState) => commonReducer(state).documentTypes;
export const selectTruckTypes = (state: RootState) => commonReducer(state).truckTypes;
export const selectJobs = (state: RootState) => commonReducer(state).jobs;
export const selectCurrentJob = (state: RootState) => commonReducer(state).currentJob;
export const selectDrivers = (state: RootState) => commonReducer(state).drivers;
export const selectDriversPagination = (state: RootState) => commonReducer(state).driversPagination;
export const selectCarriers = (state: RootState) => commonReducer(state).carriers;

export const selectUser = (state: RootState) => commonReducer(state).user;
export const selectRoles = (state: RootState) => commonReducer(state).roles;

export const selectActiveSection = (state: RootState) =>
  commonReducer(state).activeSection;

export const selectAuthToken = (state: RootState) =>
  commonReducer(state).authToken;

export const selectDeliveryAddressId = (state: RootState) =>
  commonReducer(state).deliveryAddressId;
