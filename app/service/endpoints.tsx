
export const endPoints = {
  login: "/auth/login",
  signup: "/auth/signup",
  roles: "/onboarding/roles/categories",
  profile: "/user/profile",  
  upload: "/upload",
  documentTypes: "/document/required",
  documentUpload: "/document/upload",
  documentDelete: (id: number) => `/document/${id}`,
  userDocuments: "/user/documents", // Add endpoint for fetching user documents
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  verifyOTP: "/auth/verify-otp",
  resendOTP: "/auth/resend-otp",
  registerFcmToken: "/fcm/register",
  deleteAccount: "/auth/delete-account",
  truckTypes: "/truckType/truck-types",
  roleTypes: (id: number) => `rolePostingPermission/${id}/viewers`,
  // Jobs
  createJob: "/job",
  getJobs: "/job",
  getJob: (id: number) => `/job/${id}`,
  updateJob: (id: number) => `/job/${id}`,
  deleteJob: (id: number) => `/job/${id}`,
  reshareJob: (id: number) => `/job/${id}/reshare`,
  getJobApplicants: (id: number) => `/job/${id}/applicants`,
  getJobApplicant: (jobId: number, applicantId: number) => `/job/${jobId}/applicants/${applicantId}`,
  applyJob: "/jobApplication/apply",
  myApplications: "/jobApplication/my-applications",
  getJobBids: (jobId: number) => `/jobApplication/job/${jobId}`,
  acceptBid: (bidId: number) => `/jobApplication/${bidId}/accept`,
  rejectBid: (bidId: number) => `/jobApplication/${bidId}/reject`,
  withdrawJobApplication: (applicationId: number) => `/jobApplication/${applicationId}/withdraw`,
  // Drivers
  getDrivers: "/user/",
  getCarriers: "/user/",
  addUserToCompany: (companyId: number | string) => `/company/${companyId}/users`,
  removeUserFromCompany: (companyId: number | string, userId: number | string) => `/company/${companyId}/users/${userId}`,
  // Contract Invitations
  getContractInvitations: "/contract/my/invites",
  acceptContractInvitation: (contractId: number) => `/contract/${contractId}/participants/accept`,
  declineContractInvitation: (contractId: number) => `/contract/${contractId}/participants/decline`,
  // Carrier-specific endpoints
  acceptCarrierInvitation: (contractId: number) => `/contract/${contractId}/participants/carrier/accept`,
  declineCarrierInvitation: (contractId: number) => `/contract/${contractId}/participants/carrier/decline`,
  // Contract Driver Management
  changeDriver: (contractId: number) => `/contract/${contractId}/participants/change-driver`,
  removeDriver: (contractId: number, driverId: number) => `/contract/${contractId}/participants/driver/${driverId}`,
  // Contract Jobs (Picked Jobs)
  getContractJobs: "/contract",
  completeContract: (contractId: number) => `/contract/${contractId}/complete-contract`,
  rateContract: (contractId: number) => `/contract/${contractId}/rate`,
  // Contract Inspections
  startInspection: (contractId: number) => `/contract/${contractId}/inspections/start`,
  finishInspection: (contractId: number) => `/contract/${contractId}/inspections/finish`,
  completeInspection: (inspectionId: number) => `/contract/inspections/${inspectionId}/complete`,
  getMyInspections: (contractId: number) => `/contract/${contractId}/inspections/mine`,
  // Conversations
  getConversations: "/conversations",
  getConversation: (id: string, page: number = 1, limit: number = 50) => `/conversations/${id}/messages/history?page=${page}&limit=${limit}`,
  getConversationDetails: (id: string) => `/conversations/${id}`,
  createDirectConversation: "/conversations/direct",
  // Messages
  getMessages: (conversationId: string) => `/conversations/${conversationId}/messages`,
  // File Upload
  uploadFile: "/upload",
  // Location
  liveLocation: "/location/live",
  // Payment/Wallet
  walletBalance: "/payment/wallet/balance",
  // Old bank accounts endpoint (kept for compatibility; not used)
  bankAccounts: "/payment/bank-accounts",
  // New: connected bank accounts by userId
  connectedBankAccounts: (userId: string | number) => `/payment/connect/bank-accounts?userId=${userId}`,
  // New: create account link for onboarding/management
  connectAccountLink: "/payment/connect/account-link",
  addBankAccount: "/payment/bank-accounts",
  deleteBankAccount: (accountId: string) => `/payment/bank-accounts/${accountId}`,
  // Withdrawals
  createWithdrawal: "/payment/withdrawals",
  // Job Payment Retry
  retryJobPayment: (jobId: number) => `/job/${jobId}/payment/retry`,
  // Dashboard
  dashboard: "/dashboard",
  // Ratings
  getUserRatings: (userId: number) => `/rating/users/${userId}/ratings`,
  getContractRatings: (contractId: number) => `/rating/contracts/${contractId}/ratings`,
  // Notifications
  getNotifications: (limit: number = 50, offset: number = 0, unreadOnly: boolean = false) => 
    `/notification/?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`,
  markNotificationAsRead: (notificationId: string | number) => `/notification/${notificationId}/read`,
  deleteNotification: (notificationId: string | number) => `/notification/${notificationId}`,
  getUnreadNotificationCount: '/notification/unread',
  // Translations
  getLanguages: (type: string = 'mobile') => `/translation/languages?type=${type}`,
  getTranslations: (lang: string, type: string = 'mobile') => `/translation/${lang}?type=${type}`,
};
