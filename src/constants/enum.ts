export const JobType = {
  SHORT: "short",
  MEDIUM: "medium",
  LONG: "long",
} as const;

export const JobStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const DocumentStatus = {
  UPLOADED: "uploaded",
  SUBMITTED: "submitted",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export const CommonDocumentTypes = {
  DRIVER_LICENSE: "driver_license", // Driver's license
  VEHICLE_REGISTRATION: "vehicle_registration", // Vehicle registration certificate
  INSURANCE: "insurance", // Vehicle insurance certificate
  CDL: "cdl", // Commercial Driver License
  MEDICAL_CARD: "medical_card", // Medical examiner's certificate
  HAZMAT_ENDORSEMENT: "hazmat_endorsement", // Hazardous materials endorsement
  TWIC_CARD: "twic_card", // Transportation Worker Identification Credential
  PASSPORT: "passport", // Passport for international travel
  ID_CARD: "id_card", // Government-issued ID card
  BUSINESS_LICENSE: "business_license", // Business operating license
  TAX_DOCUMENT: "tax_document", // Tax identification or clearance
  BANK_STATEMENT: "bank_statement", // Bank statement for verification
  ADDRESS_PROOF: "address_proof", // Proof of address (utility bill, lease agreement)
  BROKER_LICENSE: "broker_license", // Broker license (specific to brokers)
  CARGO_INSURANCE: "cargo_insurance", // Cargo insurance (specific to carriers)
  FUEL_TAX_EXEMPTION: "fuel_tax_exemption", // Fuel tax exemption (specific to carriers)
  SHIPPER_REGISTRATION: "shipper_registration", // Shipper registration (specific to shippers)
  DELIVERY_TERMS: "delivery_terms", // Delivery terms agreement (for shippers)
  
  // Driver-specific documents
  WORK_AUTHORIZATION: "work_authorization", // Work Permit OR Green Card OR Citizenship Card OR Permanent Resident
  DRIVING_RECORD: "driving_record", // Driving record
  DRUG_TEST_REPORT: "drug_test_report", // Drug test report
  SOCIAL_SECURITY_NUMBER: "social_security_number", // Social security number
  
  // Carrier-specific documents
  W9_FORM: "w9_form", // W-9 Form
  MC_AUTHORITY_LETTER: "mc_authority_letter", // MC Authority Letter
  CERTIFICATE_OF_INSURANCE: "certificate_of_insurance", // Certificate of Insurance (COI)
  AUTO_LIABILITY_INSURANCE: "auto_liability_insurance", // Auto Liability $1,000,000
  CARGO_INSURANCE_100K: "cargo_insurance_100k", // Cargo Insurance $100,000+
  BROKER_CARRIER_AGREEMENT: "broker_carrier_agreement", // Broker–Carrier Agreement
  OPERATING_AUTHORITY: "operating_authority", // Operating Authority
  FMCSA_STATUS: "fmcsa_status", // FMCSA status
  CARB: "carb", // CARB
  CTC: "ctc", // CTC
  MC_PERMIT: "mc_permit", // MC Permit
  
  // Additional Driver documents
  PSP: "psp", // Pre-Employment Screening Program (PSP)
  CLEARINGHOUSE: "clearinghouse", // Drug & Alcohol Clearinghouse
  ROAD_TEST: "road_test", // Road Test (optional)
  I9_FORM: "i9_form", // I-9 Form (Employment Eligibility Verification)
  EMPLOYEE_VERIFICATION: "employee_verification", // Employee verification or reference letter (optional)
  
  // Broker-specific documents
  BROKER_BOND: "broker_bond", // Broker Bond (BMC-84 or BMC-85)
} as const;


export const UserVerificationStatus = {
  PENDING: "pending",
  PROFILE_COMPLETE: "profile_complete",
  DOCUMENTS_VERIFIED: "documents_verified",
  ADMIN_VERIFIED: "admin_verified",
  FULLY_VERIFIED: "fully_verified",
  SUSPENDED: "suspended",
  REJECTED: "rejected",
} as const;

export type UserVerificationStatusType = (typeof UserVerificationStatus)[keyof typeof UserVerificationStatus];

export const NotificationType = {
  // Document notifications
  DOCUMENT_VERIFIED: "document_verified",
  DOCUMENT_REJECTED: "document_rejected",
  
  // Job notifications
  JOB_APPLICATION_ACCEPTED: "job_application_accepted",
  JOB_APPLICATION_REJECTED: "job_application_rejected",
  JOB_APPLICATION_RECEIVED: "job_application_received",
  
  // Contract notifications
  CONTRACT_CREATED: "contract_created",
  CONTRACT_COMPLETED: "contract_completed",
  
  // User verification
  USER_VERIFIED: "user_verified",
  USER_REJECTED: "user_rejected",
  
  // Chat/Message
  NEW_MESSAGE: "new_message",
  
  // Payment
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_FAILED: "payment_failed",
} as const;

export type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType];
