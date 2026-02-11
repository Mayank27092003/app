/**
 * Jobs sagas
 * @format
 */

import { put, takeLatest, call, select } from 'redux-saga/effects';

//Screens
import { presentLoader, dismissLoader, setTruckTypes, setJobs, setCurrentJob } from '@app/module/common';
import { jobs, jobApply, jobDetails, create, fetchTruckTypes, fetchJobs, fetchJobById, applyjob, fetchMyApplications, fetchContractJobs, fetchTrackingContracts, fetchJobBids, acceptBid, rejectBid, startInspection, finishInspection, completeInspection, getMyInspections } from './slice';
import { endPoints, httpRequest } from '@app/service';
import { showMessage } from 'react-native-flash-message';
import i18n from '@app/language/i18n';

/**
 *
 * @param {*} email
 */

function* createSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* createJobSaga(action: any): any {
  console.log("createJobSaga called with action:", action);
  console.log("Action type:", action.type);
  console.log("Action payload:", action.payload);
  
  try {
    yield put(presentLoader());
    const { jobData, onSuccess, onError } = action.payload;
    console.log(jobData,'jobData create job saga');
    const response = yield call(httpRequest.post, endPoints.createJob, jobData);
    
    if (response?.success) {
      // Emit socket event for new job
      // if (socketService.isSocketConnected()) {
      //   socketService.getSocket()?.emit('job:new', response.data || response);
      //   console.log('Job creation socket event emitted');
      // }
      
      showMessage({ message: i18n.t("common.jobCreatedSuccess"), type: "success" });
      if (onSuccess) { onSuccess(response); }
    } else {
      const errorMessage = response?.message || i18n.t("common.jobCreationFailed") || "Job creation failed. Please try again.";
      showMessage({ message: errorMessage, type: "danger" });
      if (onError) { onError(response); }
    }
  } catch (error: any) {
    const errorMessage = error?.message || "Job creation failed. Please try again.";
    showMessage({ message: errorMessage, type: "danger" });
    if (action.payload.onError) { action.payload.onError(error); }
  } finally {
    yield put(dismissLoader());
  }
}

function* fetchTruckTypesSaga(): any {
  try {
    // Removed presentLoader() - using skeleton loader on screen instead
    console.log("fetchTruckTypesSaga called");
    const response = yield call(httpRequest.get, endPoints.truckTypes);
    
    if (response?.success) {
      console.log("Truck types fetched successfully:", response.data);
      yield put(setTruckTypes(response.data));
    } else {
      console.error("Failed to fetch truck types:", response);
    }
  } catch (error: any) {
    console.error("Error fetching truck types:", error);
  }
}

function* fetchJobsSaga(action: any): any {
  try {
    // Removed presentLoader() - using skeleton loader on screen instead
    console.log("fetchJobsSaga called with action:", action);
    const { 
      jobType, 
      status, 
      minPay, 
      maxPay, 
      location, 
      showNearby, 
      lat, 
      lng, 
      isMine ,
      limit,
      page,
      truckTypeIds
    } = action.payload || {};
    
    // Build query parameters based on curl request
    const params = new URLSearchParams();
    
    // Add parameters if they exist
    if (status) params.append('status', status);
    if (jobType) params.append('jobType', jobType);
    if (minPay) params.append('minPay', minPay.toString());
    if (maxPay) params.append('maxPay', maxPay.toString());
    if (location) params.append('location', location);
    if (showNearby) params.append('showNearby', showNearby.toString());
    if (lat) params.append('lat', lat.toString());
    if (lng) params.append('lng', lng.toString());
    if (isMine !== undefined) params.append('isMine', isMine.toString());
    if (limit) params.append('limit', limit.toString());
    if (page) params.append('page', page.toString());
    if (truckTypeIds) params.append('truckTypeIds', truckTypeIds.toString());
    
    const url = params.toString() ? `${endPoints.getJobs}?${params.toString()}` : endPoints.getJobs;
    console.log("Fetching jobs from:", url);
    
    const response = yield call(httpRequest.get, url);
    
    console.log("Fetch jobs response:", response);
    
    // Handle different response structures
    let jobsData = null;
    
    if (response?.success && response?.data) {
      // Standard success response
      jobsData = response.data;
    } else if (response?.data && Array.isArray(response.data)) {
      // Direct array response
      jobsData = response.data;
    } else if (Array.isArray(response)) {
      // Response is directly an array
      jobsData = response;
    } else if (response?.jobs) {
      // Jobs nested in response
      jobsData = response.jobs;
    } else if (response?.results) {
      // Paginated response
      jobsData = response.results;
    }
    
    if (jobsData && Array.isArray(jobsData)) {
      console.log("Jobs fetched successfully:", jobsData.length);
      yield put(setJobs(jobsData));
    } else {
      console.error("Failed to extract jobs from response");
      // Still set empty array to clear any previous jobs
      yield put(setJobs([]));
    }
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
  }
}

function* jobSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* jobApplySaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* jobDetailsSaga({ payload }: any) {
  try {
  } catch (error) {}
}

function* fetchJobByIdSaga(action: any): any {
  try {
    const { id } = action.payload;
    console.log("Fetching job by ID:", id);
    
    if (!id) {
      console.error("No job ID provided");
      yield put(setCurrentJob(null));
      return;
    }
    
    const response = yield call(httpRequest.get, endPoints.getJob(id));
    console.log("Fetch job by ID response:", response);
    
    if (response?.success && response?.data) {
      console.log("Job fetched successfully:", response.data);
      yield put(setCurrentJob(response.data));
    } else {
      console.error("Failed to fetch job by ID - no data in response");
      yield put(setCurrentJob(null));
    }
  } catch (error: any) {
    console.error("Error fetching job by ID:", error);
    yield put(setCurrentJob(null));
  }
}

function* applyJobSaga(action: any): any {
  console.log("applyJobSaga called with full action:", action);
  
  try {
    yield put(presentLoader());
    // const { applicationData } = action.payload;
    // console.log("applyJobSaga - applicationData:", applicationData);
    // console.log("applyJobSaga - onSuccess:", onSuccess);
    // console.log("applyJobSaga - onError:", onError);

    
    const response = yield call(httpRequest.post, endPoints.applyJob, action.payload);
    
    if (response?.success) {
      showMessage({
        message: "Application Submitted",
        description: "Your job application has been submitted successfully!",
        type: "success",
      });
      return { success: true};
      
    } else {
      const errorMessage = response?.message || "Failed to submit application";
      showMessage({
        message: "Application Failed",
        description: errorMessage,
        type: "danger",
      });
      
      if (onError) {
        onError(response);
      }
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while submitting your application";
    showMessage({
      message: "Application Error",
      description: errorMessage,
      type: "danger",
    });
    
    if (action.payload.onError) {
      action.payload.onError(error);
    }
  } finally {
    yield put(dismissLoader());
  }
}

function* fetchMyApplicationsSaga(action: any): any {
  try {
    // Removed presentLoader() - using skeleton loader on screen instead
    console.log("fetchMyApplicationsSaga called");
    
    const response = yield call(httpRequest.get, endPoints.myApplications);
  console.log("My applications response:", response);
    
    if (response?.success || response?.status === 200) {
      console.log("My applications raw data:", JSON.stringify(response?.data, null, 2));
      
      // Transform the applications data to match Job structure
      const transformedJobs = (response?.data || []).map((application: any) => {
        const job = application.job || application;
        return {
          id: job.id?.toString() || application.id?.toString(),
          title: job.title || job.jobTitle || 'Job Title',
          description: job.description || job.jobDescription || '',
          merchantId: job.merchantId || job.userId?.toString(),
          merchantName: job.merchantName || job.companyName || job.company?.companyName || 'Company Name',
          merchantRating: job.merchantRating || job.companyRating || 0,
          compensation: job.compensation || job.payAmount || 0,
          payAmount: job.payAmount || job.compensation || 0,
          currency: job.currency || 'USD',
          status: application.status || job.status || 'assigned',
          pickupLocation: job.pickupLocation || {
            city: job.pickupCity || 'N/A',
            state: job.pickupState || 'N/A',
            address: job.pickupAddress || 'N/A',
            date: job.pickupDate || 'N/A',
            time: job.pickupTime || 'N/A'
          },
          dropoffLocation: job.dropoffLocation || {
            city: job.dropoffCity || 'N/A',
            state: job.dropoffState || 'N/A',
            address: job.dropoffAddress || 'N/A',
            date: job.dropoffDate || 'N/A',
            time: job.dropoffTime || 'N/A'
          },
          requiredTruckType: job.requiredTruckType || job.truckType || 'Any',
          distance: job.distance || 0,
          company: job.company || {
            companyName: job.companyName || job.merchantName || 'Company Name'
          },
          createdAt: job.createdAt || new Date().toISOString(),
          updatedAt: job.updatedAt || new Date().toISOString(),
          ...job // Include all other fields
        };
      });
      
      console.log("Transformed jobs for picked tab:", JSON.stringify(transformedJobs, null, 2));
      yield put(setJobs(transformedJobs));
    } else {
      console.log("My applications fetch failed - response not successful");
    }
  } catch (error: any) {
    console.error("Fetch my applications error:", error);
    console.error("Fetch my applications error response:", error?.response?.data);
  }
}

function* fetchContractJobsSaga(action: any): any {
  try {
    // Removed presentLoader() - using skeleton loader on screen instead
    console.log("fetchContractJobsSaga called");
    
    // Get location parameters from action payload if available
    const { lat, lng } = action.payload || {};
    
    // Call the contract API with isMine=false parameter and location
    const response = yield call(httpRequest.get, endPoints.getContractJobs, {
      params: { 
        isMine: false,
        lat: lat || null,
        lng: lng || null
      }
    });
    
    console.log("Contract jobs response:", response);
    
    if (response?.success || response?.status === 200) {
      console.log("Contract jobs raw data:", JSON.stringify(response?.data, null, 2));
      
      // Transform the contract data to match Job structure
      const transformedJobs = (response?.data || []).map((contract: any) => {
        const job = contract.job || contract;
        return {
          id: job.id?.toString() || contract.id?.toString(),
          title: job.title || job.jobTitle || 'Contract Job',
          description: job.description || job.jobDescription || '',
          merchantId: job.merchantId || job.userId?.toString(),
          merchantName: job.merchantName || job.companyName || job.company?.companyName || 'Company Name',
          merchantRating: job.merchantRating || job.companyRating || 0,
          compensation: job.compensation || job.payAmount || 0,
          payAmount: job.payAmount || job.compensation || 0,
          currency: job.currency || 'USD',
          status: contract.status || job.status || 'active',
          pickupLocation: job.pickupLocation || {
            city: job.pickupCity || 'N/A',
            state: job.pickupState || 'N/A',
            address: job.pickupAddress || 'N/A',
            date: job.pickupDate || 'N/A',
            time: job.pickupTime || 'N/A'
          },
          dropoffLocation: job.dropoffLocation || {
            city: job.dropoffCity || 'N/A',
            state: job.dropoffState || 'N/A',
            address: job.dropoffAddress || 'N/A',
            date: job.dropoffDate || 'N/A',
            time: job.dropoffTime || 'N/A'
          },
          requiredTruckType: job.requiredTruckType || job.truckType || 'Any',
          distance: job.distance || 0,
          company: job.company || {
            companyName: job.companyName || job.merchantName || 'Company Name'
          },
          createdAt: job.createdAt || contract.createdAt || new Date().toISOString(),
          updatedAt: job.updatedAt || contract.updatedAt || new Date().toISOString(),
          // Contract specific fields
          contractId: contract.id,
          contractStatus: contract.status,
          contractParticipants: contract.contractParticipants || [],
          ...job // Include all other fields
        };
      });
      
      console.log("Transformed contract jobs:", JSON.stringify(transformedJobs, null, 2));
      yield put(setJobs(transformedJobs));
    } else {
      console.log("Contract jobs fetch failed - response not successful");
    }
  } catch (error: any) {
    console.error("Fetch contract jobs error:", error);
    console.error("Fetch contract jobs error response:", error?.response?.data);
  }
}

function* fetchTrackingContractsSaga(action: any): any {
  try {
    console.log("fetchTrackingContractsSaga called");
    
    // Call the contract API with specific parameters for tracking screen
    const response = yield call(httpRequest.get, endPoints.getContractJobs, {
      params: { 
        isMine: false,
        status: 'active',
        participantStatus: 'active'
      }
    });
    
    console.log("Tracking contracts response:", response);
    
    if (response?.success || response?.status === 200) {
      console.log("Tracking contracts raw data:", JSON.stringify(response?.data, null, 2));
      
      // Transform the contract data to match Job structure
      // IMPORTANT: Preserve the full structure with jobApplications, contracts, and contractParticipants
      // This is needed for tripTracking.tsx to find the driver ID
      const transformedJobs = (response?.data || []).map((contract: any) => {
        const job = contract.job || contract;
        
        // Build the jobApplications structure that tripTracking.tsx expects
        const jobApplication = {
          id: contract.id || job.id,
          applicantUserId: contract.hiredUserId || job.userId,
          applicantRole: 'driver', // or determine from contractParticipants
          status: contract.status || 'active',
          contracts: [{
            id: contract.id,
            contractId: contract.id,
            status: contract.status,
            hiredUserId: contract.hiredUserId,
            contractParticipants: contract.contractParticipants || [],
            ...contract // Include all contract fields
          }]
        };
        
        return {
          id: job.id?.toString() || contract.id?.toString(),
          title: job.title || job.jobTitle || 'Contract Job',
          description: job.description || job.jobDescription || '',
          merchantId: job.merchantId || job.userId?.toString(),
          merchantName: job.merchantName || job.companyName || job.company?.companyName || 'Company Name',
          merchantRating: job.merchantRating || job.companyRating || 0,
          compensation: job.compensation || job.payAmount || 0,
          payAmount: job.payAmount || job.compensation || 0,
          currency: job.currency || 'USD',
          status: contract.status || job.status || 'active',
          pickupLocation: job.pickupLocation || {
            city: job.pickupCity || 'N/A',
            state: job.pickupState || 'N/A',
            address: job.pickupAddress || 'N/A',
            date: job.pickupDate || 'N/A',
            time: job.pickupTime || 'N/A'
          },
          dropoffLocation: job.dropoffLocation || {
            city: job.dropoffCity || 'N/A',
            state: job.dropoffState || 'N/A',
            address: job.dropoffAddress || 'N/A',
            date: job.dropoffDate || 'N/A',
            time: job.dropoffTime || 'N/A'
          },
          requiredTruckType: job.requiredTruckType || job.truckType || 'Any',
          distance: job.distance || 0,
          company: job.company || {
            companyName: job.companyName || job.merchantName || 'Company Name'
          },
          createdAt: job.createdAt || contract.createdAt || new Date().toISOString(),
          updatedAt: job.updatedAt || contract.updatedAt || new Date().toISOString(),
          // CRITICAL: Preserve the structure needed for tripTracking.tsx to find driver ID
          jobApplications: [jobApplication],
          // Also include assignedDriverId if available from contractParticipants
          assignedDriverId: (() => {
            const driverParticipant = contract.contractParticipants?.find(
              (p: any) => p.role === "driver" && (p.status === "accepted" || p.status === "active" || p.status === "assigned")
            );
            return driverParticipant?.userId || driverParticipant?.id || contract.hiredUserId || job.assignedDriverId;
          })(),
          // Contract specific fields (for backward compatibility)
          contractId: contract.id,
          contractStatus: contract.status,
          contractParticipants: contract.contractParticipants || [],
          ...job // Include all other job fields
        };
      });
      
      console.log("Transformed tracking contracts:", JSON.stringify(transformedJobs, null, 2));
      yield put(setJobs(transformedJobs));
    } else {
      console.log("Tracking contracts fetch failed - response not successful");
    }
  } catch (error: any) {
    console.error("Fetch tracking contracts error:", error);
    console.error("Fetch tracking contracts error response:", error?.response?.data);
  }
}

function* fetchJobBidsSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { jobId } = action.payload;
    console.log("Fetching job bids for job ID:", jobId);
    
    if (!jobId) {
      console.error("No job ID provided for fetching bids");
      return;
    }
    
    const response = yield call(httpRequest.get, endPoints.getJobBids(jobId));
    console.log("Fetch job bids response:", response);
    
    if (response?.success && response?.data) {
      console.log("Job bids fetched successfully:", response.data);
      // Store the bids in the current job data
      const currentJob = yield select((state: any) => state.common.currentJob);
      if (currentJob) {
        const updatedJob = {
          ...currentJob,
          jobApplications: response.data
        };
        yield put(setCurrentJob(updatedJob));
      }
    } else {
      console.error("Failed to fetch job bids - no data in response");
    }
  } catch (error: any) {
    console.error("Error fetching job bids:", error);
  } finally {
    yield put(dismissLoader());
  }
}

function* acceptBidSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { bidId, onSuccess, onError } = action.payload;
    console.log("Accepting bid with ID:", bidId);
    
    if (!bidId) {
      console.error("No bid ID provided for accepting bid");
      if (onError) onError({ message: "No bid ID provided" });
      return;
    }
    
    const response = yield call(httpRequest.post, endPoints.acceptBid(bidId), {});
    console.log("Accept bid response:", response);
    
    if (response?.success || response?.status === 200) {
      console.log("Bid accepted successfully");
      showMessage({
        message: "Bid Accepted",
        description: "The bid has been accepted successfully!",
        type: "success",
      });
      
      // Note: UI will be updated when user navigates back and screen refreshes
      
      if (onSuccess) onSuccess(response);
    } else {
      const errorMessage = response?.message || "Failed to accept bid";
      showMessage({
        message: "Accept Failed",
        description: errorMessage,
        type: "danger",
      });
      if (onError) onError(response);
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while accepting the bid";
    showMessage({
      message: "Accept Error",
      description: errorMessage,
      type: "danger",
    });
    if (action.payload.onError) action.payload.onError(error);
  } finally {
    yield put(dismissLoader());
  }
}

function* rejectBidSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { bidId, onSuccess, onError } = action.payload;
    console.log("Rejecting bid with ID:", bidId);
    
    if (!bidId) {
      console.error("No bid ID provided for rejecting bid");
      if (onError) onError({ message: "No bid ID provided" });
      return;
    }
    
    const response = yield call(httpRequest.post, endPoints.rejectBid(bidId), {});
    console.log("Reject bid response:", response);
    
    if (response?.success || response?.status === 200) {
      console.log("Bid rejected successfully");
      showMessage({
        message: "Bid Rejected",
        description: "The bid has been rejected successfully!",
        type: "success",
      });
      
      // Note: UI will be updated when user navigates back and screen refreshes
      
      if (onSuccess) onSuccess(response);
    } else {
      const errorMessage = response?.message || "Failed to reject bid";
      showMessage({
        message: "Reject Failed",
        description: errorMessage,
        type: "danger",
      });
      if (onError) onError(response);
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while rejecting the bid";
    showMessage({
      message: "Reject Error",
      description: errorMessage,
      type: "danger",
    });
    if (action.payload.onError) action.payload.onError(error);
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Start inspection saga
 */
function* startInspectionSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { contractId, type, data, defects, photos, onSuccess, onError } = action.payload;
    
    console.log('startInspectionSaga - starting inspection:', { contractId, type, data, defects, photos });
    
    const payload: any = {
      type: type
    };
    
    // Add optional data if provided
    if (data) {
      payload.data = data;
    }
    
    if (defects) {
      payload.defects = defects;
    }
    
    if (photos && photos.length > 0) {
      payload.photos = photos;
    }
    
    const response = yield call(
      httpRequest.post, 
      endPoints.startInspection(parseInt(contractId)),
      payload
    );
    
    console.log('startInspectionSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Inspection Started",
        description: "Inspection has been started successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } else {
      const errorMessage = response?.message || "Failed to start inspection";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('startInspectionSaga - Error:', error);
    const errorMessage = error?.message || "Failed to start inspection. Please try again.";
    
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
 * Finish inspection saga
 */
function* finishInspectionSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { contractId, type, onSuccess, onError } = action.payload;
    
    console.log('finishInspectionSaga - finishing inspection:', { contractId, type });
    
    const response = yield call(
      httpRequest.post, 
      endPoints.finishInspection(parseInt(contractId)),
      {
        type: type
      }
    );
    
    console.log('finishInspectionSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Inspection Completed",
        description: "Inspection has been completed successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } else {
      const errorMessage = response?.message || "Failed to finish inspection";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('finishInspectionSaga - Error:', error);
    const errorMessage = error?.message || "Failed to finish inspection. Please try again.";
    
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
 * Complete inspection saga
 */
function* completeInspectionSaga(action: any): any {
  try {
    yield put(presentLoader());
    
    const { inspectionId, data, defects, photos, podPhoto, onSuccess, onError } = action.payload;
    
    console.log('completeInspectionSaga - completing inspection:', { inspectionId, data, defects, photos, podPhoto });
    
    const payload: any = {
      data,
      defects,
      photos,
      podPhoto
    };
    
    const response = yield call(
      httpRequest.post, 
      endPoints.completeInspection(parseInt(inspectionId)),
      payload
    );
    
    console.log('completeInspectionSaga - API response:', response);
    
    if (response?.success) {
      showMessage({
        message: "Inspection Completed",
        description: "Inspection has been completed successfully!",
        type: "success",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } else {
      const errorMessage = response?.message || "Failed to complete inspection";
      showMessage({
        message: "Error",
        description: errorMessage,
        type: "danger",
      });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('completeInspectionSaga - Error:', error);
    const errorMessage = error?.message || "Failed to complete inspection. Please try again.";
    
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
 * Get my inspections saga
 */
function* getMyInspectionsSaga(action: any): any {
  try {
    const { contractId, onSuccess, onError } = action.payload;
    
    console.log('getMyInspectionsSaga - fetching inspections:', { contractId });
    
    const response = yield call(
      httpRequest.get, 
      endPoints.getMyInspections(parseInt(contractId))
    );
    
    console.log('getMyInspectionsSaga - API response:', response);
    
    if (response?.success) {
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } else {
      const errorMessage = response?.message || "Failed to fetch inspections";
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error) {
    console.error('getMyInspectionsSaga - Error:', error);
    const errorMessage = error?.message || "Failed to fetch inspections. Please try again.";
    
    // Call error callback if provided
    if (action.payload.onError) {
      action.payload.onError(errorMessage);
    }
  }
}

function* jobsSagas() {
  yield takeLatest(create, createSaga);
  yield takeLatest('JOB/CREATE_JOB', createJobSaga);
  yield takeLatest(fetchTruckTypes, fetchTruckTypesSaga);
  yield takeLatest(fetchJobs, fetchJobsSaga);
  yield takeLatest(fetchJobById, fetchJobByIdSaga);
  yield takeLatest(fetchMyApplications, fetchMyApplicationsSaga);
  yield takeLatest(fetchContractJobs, fetchContractJobsSaga);
  yield takeLatest(fetchTrackingContracts, fetchTrackingContractsSaga);
  yield takeLatest(fetchJobBids, fetchJobBidsSaga);
  yield takeLatest(acceptBid, acceptBidSaga);
  yield takeLatest(rejectBid, rejectBidSaga);
  yield takeLatest(startInspection, startInspectionSaga);
  yield takeLatest(finishInspection, finishInspectionSaga);
  yield takeLatest(completeInspection, completeInspectionSaga);
  yield takeLatest(getMyInspections, getMyInspectionsSaga);
  yield takeLatest(applyjob, applyJobSaga);
  yield takeLatest(jobs, jobSaga);
  yield takeLatest(jobApply, jobApplySaga);
  yield takeLatest(jobDetails, jobDetailsSaga);
}

export { jobsSagas };
