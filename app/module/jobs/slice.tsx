/**
 * Jobs slice
 * @format
 */

import { createAction } from '@reduxjs/toolkit';

export const jobs = createAction<{}>('JOB/JOB');
export const jobApply = createAction<{}>('JOB/JOBAPPLY');
export const jobDetails = createAction<{}>('JOB/JOBDETAILS');
export const create = createAction<{}>('JOB/CREATE');
export const applyjob = createAction('JOB/APPLY_JOB');

// Create job action with proper typing
export const createJob = (jobData: any, onSuccess?: (response: any) => void, onError?: (error: any) => void) => {
  const action = {
    type: 'JOB/CREATE_JOB',
    payload: { jobData, onSuccess, onError }
  };
  console.log("createJob action created:", action);
  return action;
};

// Fetch truck types action
export const fetchTruckTypes = createAction('JOB/FETCH_TRUCK_TYPES');

// Fetch jobs action
export const fetchJobs = createAction<{ jobType?: string }>('JOB/FETCH_JOBS');

// Fetch single job by ID action
export const fetchJobById = createAction<{ id: string }>('JOB/FETCH_JOB_BY_ID');

// Fetch my applications action
export const fetchMyApplications = createAction('JOB/FETCH_MY_APPLICATIONS');

// Fetch contract jobs (picked jobs) action
export const fetchContractJobs = createAction<{ lat?: number | null; lng?: number | null }>('JOB/FETCH_CONTRACT_JOBS');

// Fetch tracking contracts (active contracts for tracking screen) action
export const fetchTrackingContracts = createAction('JOB/FETCH_TRACKING_CONTRACTS');

// Fetch job bids action
export const fetchJobBids = createAction<{ jobId: string }>('JOB/FETCH_JOB_BIDS');

// Accept bid action
export const acceptBid = createAction<{ bidId: number; onSuccess?: (response: any) => void; onError?: (error: any) => void }>('JOB/ACCEPT_BID');

// Reject bid action
export const rejectBid = createAction<{ bidId: number; onSuccess?: (response: any) => void; onError?: (error: any) => void }>('JOB/REJECT_BID');

// Start inspection action
export const startInspection = createAction<{ 
  contractId: string; 
  type: string;
  data?: {
    odometer: number;
  };
  defects?: {
    lights: string;
    [key: string]: string;
  };
  photos?: Array<{
    url: string;
    label: string;
  }>;
  onSuccess?: (response: any) => void; 
  onError?: (error: any) => void;
}>('JOB/START_INSPECTION');

// Finish inspection action
export const finishInspection = createAction<{ 
  contractId: string; 
  type: string;
  onSuccess?: (response: any) => void; 
  onError?: (error: any) => void;
}>('JOB/FINISH_INSPECTION');

// Complete inspection action
export const completeInspection = createAction<{ 
  inspectionId: string; 
  data: {
    odometer: number;
  };
  defects: {
    lights: string;
    [key: string]: string;
  };
  photos: Array<{
    url: string;
    label: string;
  }>;
  podPhoto: {
    url: string;
    label: string;
  };
  onSuccess?: (response: any) => void; 
  onError?: (error: any) => void;
}>('JOB/COMPLETE_INSPECTION');

// Get my inspections action
export const getMyInspections = createAction<{ 
  contractId: string; 
  onSuccess?: (response: any) => void; 
  onError?: (error: any) => void;
}>('JOB/GET_MY_INSPECTIONS');



