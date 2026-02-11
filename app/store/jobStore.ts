import { create } from "zustand";
// import { Job, JobApplication, JobStatus, JobVerification } from "@app/types";
import { Job, JobApplication, JobStatus, JobVerification } from "../types";
import { mockJobs, mockJobApplications } from "../mocks/jobs";

type JobState = {
  jobs: Job[];
  filteredJobs: Job[];
  jobApplications: JobApplication[];
  activeJobId: string | null;

  // Filters
  locationFilter: string | null;
  truckTypeFilter: string | null;
  dateFilter: string | null;

  // Actions
  fetchJobs: () => void;
  fetchJobById: (jobId: string) => Job | undefined;
  fetchJobApplications: (jobId: string) => JobApplication[];
  applyToJob: (
    jobId: string,
    driverId: string,
    driverName: string,
    driverRating: number,
    message?: string
  ) => void;
  updateJobStatus: (
    jobId: string,
    status: JobStatus,
    driverId?: string
  ) => void;
  updateJobVerification: (
    jobId: string,
    verificationType: keyof JobVerification,
    verificationData: any
  ) => void;
  setActiveJob: (jobId: string | null) => void;
  setFilters: (
    location?: string | null,
    truckType?: string | null,
    date?: string | null
  ) => void;
  clearFilters: () => void;
  postJob: (
    job: Omit<Job, "id" | "status" | "createdAt" | "updatedAt">
  ) => void;
};

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [...mockJobs],
  filteredJobs: [...mockJobs],
  jobApplications: [...mockJobApplications],
  activeJobId: null,

  locationFilter: null,
  truckTypeFilter: null,
  dateFilter: null,

  fetchJobs: () => {
    // In a real app, this would fetch from an API
    // For now, we're using mock data
    set({ jobs: [...mockJobs] });

    // Apply any existing filters
    const { locationFilter, truckTypeFilter, dateFilter } = get();
    get().setFilters(locationFilter, truckTypeFilter, dateFilter);
  },

  fetchJobById: (jobId: string) => {
    return get().jobs.find((job) => job.id === jobId);
  },

  fetchJobApplications: (jobId: string) => {
    return get().jobApplications.filter((app) => app.jobId === jobId);
  },

  applyToJob: (
    jobId: string,
    driverId: string,
    driverName: string,
    driverRating: number,
    message?: string
  ) => {
    const newApplication: JobApplication = {
      id: `app${Date.now()}`,
      jobId,
      driverId,
      driverName,
      driverRating,
      status: "pending",
      message,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      jobApplications: [...state.jobApplications, newApplication],
    }));
  },

  updateJobStatus: (jobId: string, status: JobStatus, driverId?: string) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
            ...job,
            status,
            assignedDriverId: driverId || job.assignedDriverId,
            updatedAt: new Date().toISOString(),
          }
          : job
      ),
      filteredJobs: state.filteredJobs.map((job) =>
        job.id === jobId
          ? {
            ...job,
            status,
            assignedDriverId: driverId || job.assignedDriverId,
            updatedAt: new Date().toISOString(),
          }
          : job
      ),
    }));
  },

  updateJobVerification: (
    jobId: string,
    verificationType: keyof JobVerification,
    verificationData: any
  ) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
            ...job,
            verification: {
              ...job.verification,
              [verificationType]: verificationData,
            },
            updatedAt: new Date().toISOString(),
          }
          : job
      ),
      filteredJobs: state.filteredJobs.map((job) =>
        job.id === jobId
          ? {
            ...job,
            verification: {
              ...job.verification,
              [verificationType]: verificationData,
            },
            updatedAt: new Date().toISOString(),
          }
          : job
      ),
    }));
  },

  setActiveJob: (jobId: string | null) => {
    set({ activeJobId: jobId });
  },

  setFilters: (
    location?: string | null,
    truckType?: string | null,
    date?: string | null
  ) => {
    const newLocationFilter =
      location !== undefined ? location : get().locationFilter;
    const newTruckTypeFilter =
      truckType !== undefined ? truckType : get().truckTypeFilter;
    const newDateFilter = date !== undefined ? date : get().dateFilter;

    set({
      locationFilter: newLocationFilter,
      truckTypeFilter: newTruckTypeFilter,
      dateFilter: newDateFilter,
    });

    // Apply filters
    const { jobs } = get();
    let filtered = [...jobs];

    if (newLocationFilter) {
      filtered = filtered.filter(
        (job) =>
          job.pickup.city
            .toLowerCase()
            .includes(newLocationFilter.toLowerCase()) ||
          job.pickup.state
            .toLowerCase()
            .includes(newLocationFilter.toLowerCase()) ||
          job.delivery.city
            .toLowerCase()
            .includes(newLocationFilter.toLowerCase()) ||
          job.delivery.state
            .toLowerCase()
            .includes(newLocationFilter.toLowerCase())
      );
    }

    if (newTruckTypeFilter) {
      filtered = filtered.filter((job) =>
        job.requiredTruckType
          .toLowerCase()
          .includes(newTruckTypeFilter.toLowerCase())
      );
    }

    if (newDateFilter) {
      filtered = filtered.filter(
        (job) =>
          job.pickup.date === newDateFilter ||
          job.delivery.date === newDateFilter
      );
    }

    set({ filteredJobs: filtered });
  },

  clearFilters: () => {
    set({
      locationFilter: null,
      truckTypeFilter: null,
      dateFilter: null,
      filteredJobs: [...get().jobs],
    });
  },

  postJob: (job: Omit<Job, "id" | "status" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newJob: Job = {
      ...job,
      id: `j${Date.now()}`,
      status: "posted",
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      jobs: [...state.jobs, newJob],
      filteredJobs: [...state.filteredJobs, newJob],
    }));
  },
}));
