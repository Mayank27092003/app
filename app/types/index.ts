export type UserRole = 'driver' | 'merchant' | 'carrier' | 'broker';

export type UserProfile = {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  rating: number;
  completedJobs: number;
  verified: boolean;
  languages: string[];
  createdAt: string;
  location: string
};

export type DriverProfile = UserProfile & {
  licenseNumber: string;
  licenseExpiry: string;
  truckType: string;
  truckCapacity: string;
  availableForWork: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  location: string;

  documents: Document[];
};
export type CarrierProfile = UserProfile & {
  merchantType: 'carrier';
  licenseNumber: string;
  licenseExpiry: string;
  truckType: string;
  truckCapacity: string;
  availableForWork: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  location: string;
  address: string;
  taxId: string;
  company: string;

  documents: Document[];
};
export type BrokerProfile = UserProfile & {
  merchantType: 'broker';
  licenseNumber: string;
  licenseExpiry: string;
  truckType: string;
  truckCapacity: string;
  availableForWork: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  location: string;
  address: string;
  taxId: string;
  company: string;

  documents: Document[];
};
export type MerchantProfile = UserProfile & {
  company: string;
  merchantType: 'carrier' | 'broker' | 'shipper' | 'intermodal';
  address: string;
  taxId: string;
  location: string;
  documents: Document[];
};

export type DocumentType = {
  id: number;
  name: string;
  description: string;
  requiresExpiry: boolean;
  createdAt: string;
  displayName: string;
  // We'll add a computed category field
  category?: 'driver' | 'merchant' | 'carrier' | 'broker';
};

export type Document = {
  id: string;
  type: string; // Changed from hardcoded union to string
  title: string;
  url: string;
  verified: boolean;
  uploadedAt: string;
  // New fields from API
  documentId?: number;
  name?: string;
  description?: string;
  expiryDate?: string | null;
  fileUrl?: string;
  isUploaded?: boolean;
  status?: 'pending' | 'verified' | 'rejected' | 'expired';
  requiresExpiry?: boolean;
};

export type JobStatus =
  | 'posted'
  | 'assigned'
  | 'in_progress'
  | 'arrived_pickup'
  | 'loaded'
  | 'in_transit'
  | 'arrived_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type Job = {
  id: string;
  title: string;
  description: string;
  merchantId: string;
  merchantName: string;
  merchantRating: number;
  compensation: number;
  currency: string;
  status: JobStatus;
  // Legacy fields (for backward compatibility)
  pickup?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    date: string;
    timeWindow: string;
  };
  delivery?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    date: string;
    timeWindow: string;
  };
  // New API fields
  pickupLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    lat: number;
    lng: number;
    date: string;
    time: string;
  };
  dropoffLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    lat: number;
    lng: number;
    date: string;
    time: string;
  };
  // Additional API fields
  payAmount?: string;
  jobType?: string;
  assignmentType?: string;
  startDate?: string;
  endDate?: string;
  tonuAmount?: string;
  isTonuEligible?: boolean;
  payoutStatus?: string;
  deletedAt?: string | null;
  pricePerMile?: number;
  visibilityRoles?: Array<{
    id: number;
    jobId: number;
    roleId: number;
    sortOrder: number;
  }>;
  company?: {
    id: number;
    userId: number;
    companyName: string;
    companyTypeId: number;
    industryType: string;
    contactNumber: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    phoneNumber: string;
    address: string;
    country: string;
    state: string;
    city: string;
    zipCode: string;
  };
  distance: number;
  estimatedDuration: string;
  cargoType: string;
  cargoWeight: string;
  requiredTruckType: string;
  specialRequirements?: string;
  assignedDriverId?: string;
  createdAt: string;
  updatedAt: string;
  verification?: JobVerification;
};

export type JobVerification = {
  startVerification?: {
    photoUrl: string;
    timestamp: string;
    verified: boolean;
    notes?: string;
  };
  finishVerification?: {
    photoUrl: string;
    timestamp: string;
    verified: boolean;
    notes?: string;
  };
  preTrip?: {
    photoUrls: string[];
    timestamp: string;
    verified: boolean;
    notes?: string;
  };
  postTrip?: {
    photoUrls: string[];
    timestamp: string;
    verified: boolean;
    notes?: string;
  };
};

export type JobApplication = {
  id: string;
  jobId: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
};

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Payment = {
  id: string;
  jobId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payerId: string;
  payeeId: string;
  platformFee: number;
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
};

export type Transaction = {
  id: string;
  type: "payment" | "withdrawal" | "deposit" | "refund";
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
  time: string;
  description: string;
  payerId: string;
  payeeId: string;
  fee: number;
  jobId?: string;
  jobReference?: string;
  paymentMethod?: string;
};

export type MessageType = 'text' | 'image' | 'document' | 'location' | 'voice' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Voice message specific types
export type VoiceMessageState = 'recording' | 'paused' | 'stopped' | 'playing' | 'idle';

export type VoiceRecording = {
  uri: string;
  duration: number;
  size: number;
  fileName: string;
  mimeType: string;
};

export type VoiceUploadResult = {
  url: string;
  key: string;
  size: number;
  mimetype: string;
};

export type VoiceMessageMetadata = {
  duration: number;
  fileName: string;
  fileSize: number;
  waveform?: number[]; // Optional waveform data for visualization
  transcription?: string; // Optional transcription text
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content: string;
  timestamp: string;
  read: boolean;
  delivered?: boolean;
  status?: MessageStatus;
  jobId?: string;
  replyTo?: string; // ID of the message being replied to
  metadata?: {
    duration?: number; // For voice messages
    fileName?: string; // For document messages
    fileSize?: number; // For document messages
    latitude?: number; // For location messages
    longitude?: number; // For location messages
  };
};

export type Conversation = {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
  muted?: boolean;
  pinned?: boolean;
  archived?: boolean;
};

export type CallStatus = 'incoming' | 'outgoing' | 'in_progress' | 'missed' | 'completed' | 'failed';

export type Call = {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  status: CallStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  recorded: boolean;
  recordingUrl?: string;
  jobId?: string;
};