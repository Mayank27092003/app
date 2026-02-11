-- Drop existing tables to start fresh
DROP TABLE IF EXISTS "callParticipants" CASCADE;
DROP TABLE IF EXISTS "callSessions" CASCADE;
DROP TABLE IF EXISTS "conversationParticipants" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "userRoles" CASCADE;
DROP TABLE IF EXISTS "otpVerifications" CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS "userFcmTokens" CASCADE;
DROP TABLE IF EXISTS "userSessions" CASCADE;
DROP TABLE IF EXISTS "userOnlineStatus" CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(255),
    "isCompanyRole" BOOLEAN DEFAULT FALSE,
    "jobPostFee" INTEGER DEFAULT 0,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users table (FULL definition matching model)
CREATE TABLE IF NOT EXISTS users (
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

-- 3. OTP Verifications
CREATE TABLE IF NOT EXISTS "otpVerifications" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'email',
    purpose VARCHAR(50) NOT NULL,
    "otpCode" VARCHAR(255) NOT NULL,
    "isUsed" BOOLEAN DEFAULT FALSE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Roles junction table
CREATE TABLE IF NOT EXISTS "userRoles" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "roleId" INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    "sortOrder" INTEGER DEFAULT 0,
    "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    "isGroupConversation" BOOLEAN DEFAULT FALSE,
    "conversationName" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Conversation Participants
CREATE TABLE IF NOT EXISTS "conversationParticipants" (
    id SERIAL PRIMARY KEY,
    "conversationId" INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP,
    UNIQUE("conversationId", "userId")
);

-- 7. Call Sessions
CREATE TABLE IF NOT EXISTS "callSessions" (
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

-- 8. Call Participants
CREATE TABLE IF NOT EXISTS "callParticipants" (
    id SERIAL PRIMARY KEY,
    "callSessionId" INTEGER NOT NULL REFERENCES "callSessions"(id) ON DELETE CASCADE,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ringing',
    "joinedAt" TIMESTAMP,
    "leftAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("callSessionId", "userId")
);

-- Insert default roles
INSERT INTO roles (name, description, "isCompanyRole", "sortOrder") 
VALUES 
    ('driver', 'Driver role', FALSE, 1),
    ('carrier', 'Carrier role', TRUE, 2),
    ('admin', 'Administrator role', FALSE, 3)
ON CONFLICT (name) DO NOTHING;
