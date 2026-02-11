-- Drop existing tables to start fresh
DROP TABLE IF EXISTS "contractTransactions" CASCADE;
DROP TABLE IF EXISTS "jobCancellations" CASCADE;
DROP TABLE IF EXISTS "roleVisibilityPermissions" CASCADE;
DROP TABLE IF EXISTS "userAddHistory" CASCADE;
DROP TABLE IF EXISTS "jobTransfers" CASCADE;
DROP TABLE IF EXISTS "jobPayments" CASCADE;
DROP TABLE IF EXISTS "paymentAccounts" CASCADE;
DROP TABLE IF EXISTS "jobTrackingLocations" CASCADE;
DROP TABLE IF EXISTS "userLocations" CASCADE;
DROP TABLE IF EXISTS "jobDriverAssignments" CASCADE;
DROP TABLE IF EXISTS "withdrawals" CASCADE;
DROP TABLE IF EXISTS "walletHoldLogs" CASCADE;
DROP TABLE IF EXISTS "walletTransactions" CASCADE;
DROP TABLE IF EXISTS "wallets" CASCADE;
DROP TABLE IF EXISTS "providerPaymentIntents" CASCADE;
DROP TABLE IF EXISTS "contractPaymentFailures" CASCADE;
DROP TABLE IF EXISTS "contracts" CASCADE;
DROP TABLE IF EXISTS "jobApplications" CASCADE;
DROP TABLE IF EXISTS "jobVisibilityRoles" CASCADE;
DROP TABLE IF EXISTS "jobPostingFees" CASCADE;
DROP TABLE IF EXISTS "jobs" CASCADE;
DROP TABLE IF EXISTS "drivers" CASCADE;
DROP TABLE IF EXISTS "companyUsers" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;
DROP TABLE IF EXISTS "companyTypes" CASCADE;
DROP TABLE IF EXISTS "admins" CASCADE;
DROP TABLE IF EXISTS "userRoles" CASCADE;
DROP TABLE IF EXISTS "otpVerifications" CASCADE;
DROP TABLE IF EXISTS "userFcmTokens" CASCADE;
DROP TABLE IF EXISTS "userSessions" CASCADE;
DROP TABLE IF EXISTS "userOnlineStatus" CASCADE;
DROP TABLE IF EXISTS "callParticipants" CASCADE;
DROP TABLE IF EXISTS "callSessions" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "paymentProviders" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;

-- 1. Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(255),
    "isCompanyRole" BOOLEAN DEFAULT FALSE,
    "jobPostFee" INTEGER DEFAULT 0,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Payment Providers
CREATE TABLE "paymentProviders" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(255),
    "isEnabled" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(255) NOT NULL DEFAULT 'User',
    "middleName" VARCHAR(255),
    "lastName" VARCHAR(255) NOT NULL DEFAULT 'Name',
    "userName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(50),
    "phoneCountryCode" VARCHAR(10),
    "isEmailVerified" BOOLEAN DEFAULT FALSE,
    "emailVerifiedAt" TIMESTAMP,
    "emailVerificationToken" VARCHAR(255),
    "emailVerificationTokenExpiresAt" TIMESTAMP,
    "passwordResetToken" VARCHAR(255),
    "passwordResetTokenExpiresAt" TIMESTAMP,
    "profileImage" TEXT,
    "verificationStatus" VARCHAR(50) DEFAULT 'pending',
    "verificationStatusUpdatedAt" TIMESTAMP,
    "verifiedByUserId" INTEGER,
    "verificationNotes" TEXT,
    "lastVerificationAttemptAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- 4. Company Types
CREATE TABLE "companyTypes" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(255),
    "sortOrder" INTEGER DEFAULT 0
);

-- 5. Companies
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "companyName" VARCHAR(255) NOT NULL,
    "companyTypeId" INTEGER REFERENCES "companyTypes"(id) ON DELETE SET NULL,
    "industryType" VARCHAR(255),
    "contactNumber" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- 6. Drivers
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "licenseNumber" VARCHAR(255) NOT NULL,
    "twicNumber" VARCHAR(255),
    "medicalCertificate" VARCHAR(255),
    "drugTestResult" VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    "workRadius" INTEGER,
    "originCompanyId" INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- 6.1 Company Users
CREATE TABLE "companyUsers" (
    id SERIAL PRIMARY KEY,
    "companyId" INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "isPrimary" BOOLEAN DEFAULT FALSE,
    "roleId" INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Roles
CREATE TABLE "userRoles" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "roleId" INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    "sortOrder" INTEGER DEFAULT 0,
    "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. OTP Verifications
CREATE TABLE "otpVerifications" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'email',
    purpose VARCHAR(50) NOT NULL,
    "otpCode" VARCHAR(255) NOT NULL,
    "isUsed" BOOLEAN DEFAULT FALSE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Conversations
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    "isGroupConversation" BOOLEAN DEFAULT FALSE,
    "conversationName" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Conversation Participants
CREATE TABLE "conversationParticipants" (
    id SERIAL PRIMARY KEY,
    "conversationId" INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP,
    UNIQUE("conversationId", "userId")
);

-- 11. Call Sessions
CREATE TABLE "callSessions" (
    id SERIAL PRIMARY KEY,
    "conversationId" INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    "initiatedByUserId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "callType" VARCHAR(50) NOT NULL DEFAULT 'audio',
    "isGroupCall" BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'ringing',
    "startedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP,
    duration INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Call Participants
CREATE TABLE "callParticipants" (
    id SERIAL PRIMARY KEY,
    "callSessionId" INTEGER NOT NULL REFERENCES "callSessions"(id) ON DELETE CASCADE,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ringing',
    "joinedAt" TIMESTAMP,
    "leftAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("callSessionId", "userId")
);

-- 12.1 Document Types
CREATE TABLE "documentTypes" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    description TEXT,
    "requiresExpiry" BOOLEAN DEFAULT FALSE,
    "requiresSides" BOOLEAN DEFAULT FALSE,
    "acceptsTextInput" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12.2 Documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "documentTypeId" INTEGER NOT NULL REFERENCES "documentTypes"(id) ON DELETE CASCADE,
    "fileUrl" TEXT,
    "textValue" TEXT,
    side VARCHAR(50),
    status VARCHAR(50) DEFAULT 'submitted',
    "expiryDate" TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    "verifiedAt" TIMESTAMP,
    "rejectedAt" TIMESTAMP,
    "verifiedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "rejectedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- 12.3 Document Type Role Requirements
CREATE TABLE "documentTypeRoleRequirements" (
    id SERIAL PRIMARY KEY,
    "documentTypeId" INTEGER NOT NULL REFERENCES "documentTypes"(id) ON DELETE CASCADE,
    "roleId" INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    "isOptional" BOOLEAN DEFAULT FALSE,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Jobs
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    "companyId" INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "payAmount" DECIMAL(10, 2),
    "jobType" VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    "startDate" TIMESTAMP,
    "endDate" TIMESTAMP,
    "tonuAmount" DECIMAL(10, 2),
    "isTonuEligible" BOOLEAN DEFAULT FALSE,
    "pickupLocation" JSONB,
    "dropoffLocation" JSONB,
    "payoutStatus" VARCHAR(50) DEFAULT 'pending',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- 14. Job Applications
CREATE TABLE "jobApplications" (
    id SERIAL PRIMARY KEY,
    "jobId" INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    "applicantUserId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "driverId" INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'applied',
    "appliedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP
);

-- 15. Contracts
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    "jobId" INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    "hiredByUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "hiredUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    "billingCycle" VARCHAR(50) DEFAULT 'weekly',
    status VARCHAR(50) DEFAULT 'active',
    "nextBillingDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER DEFAULT 0,
    "lastAttemptedAt" TIMESTAMP,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15.1 Contract Participants
CREATE TABLE "contractParticipants" (
    id SERIAL PRIMARY KEY,
    "contractId" INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP,
    "addedByUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "removedByUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "reasonForChange" TEXT,
    notes TEXT,
    "isLocationVisible" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15.2 User Ratings
CREATE TABLE "userRatings" (
    id SERIAL PRIMARY KEY,
    "contractId" INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    "raterUserId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "rateeUserId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("contractId", "raterUserId", "rateeUserId")
);

-- 15.3 Wallets
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0,
    "heldBalance" DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15.4 Wallet Transactions
CREATE TABLE "walletTransactions" (
    id SERIAL PRIMARY KEY,
    "walletId" INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    description TEXT,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Final Seed Data
INSERT INTO roles (name, description, "isCompanyRole", "sortOrder") 
VALUES 
    ('driver', 'Driver role', FALSE, 1),
    ('carrier', 'Carrier role', TRUE, 2),
    ('admin', 'Administrator role', FALSE, 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO "companyTypes" (name, description, "sortOrder")
VALUES 
    ('shipper', 'Shipper company', 1),
    ('broker', 'Broker company', 2),
    ('carrier', 'Carrier company', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO "paymentProviders" (name, description, "isEnabled")
VALUES 
    ('stripe', 'Stripe payment provider', TRUE),
    ('paypal', 'PayPal payment provider', TRUE)
ON CONFLICT (name) DO NOTHING;
