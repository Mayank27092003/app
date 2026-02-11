-- ============================================
-- NEON DATABASE SETUP - ESSENTIAL TABLES ONLY
-- Copy and paste this entire script into Neon's SQL Editor
-- ============================================

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

-- 2. Users table (CRITICAL for signup)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(255) NOT NULL DEFAULT 'User',
    "middleName" VARCHAR(255),
    "lastName" VARCHAR(255) NOT NULL DEFAULT 'Name',
    "userName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "isEmailVerified" BOOLEAN DEFAULT FALSE,
    "emailVerifiedAt" TIMESTAMP,
    "emailVerificationToken" VARCHAR(255),
    "emailVerificationTokenExpiresAt" TIMESTAMP,
    "passwordResetToken" VARCHAR(255),
    "passwordResetTokenExpiresAt" TIMESTAMP,
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

-- 5. Conversations (for WebRTC calls)
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

-- 7. Call Sessions (CRITICAL for WebRTC)
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

-- 9. FCM Tokens (for push notifications)
CREATE TABLE IF NOT EXISTS "userFcmTokens" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "fcmToken" TEXT NOT NULL UNIQUE,
    "deviceId" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. User Sessions (for socket connections)
CREATE TABLE IF NOT EXISTS "userSessions" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sessionId" VARCHAR(255) NOT NULL,
    "socketId" VARCHAR(255),
    "userAgent" TEXT,
    "ipAddress" VARCHAR(255),
    "lastSeen" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. User Online Status
CREATE TABLE IF NOT EXISTS "userOnlineStatus" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "isOnline" BOOLEAN DEFAULT FALSE,
    "lastOnline" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERT DEFAULT ROLES
-- ============================================
INSERT INTO roles (name, description, "isCompanyRole", "sortOrder") 
VALUES 
    ('driver', 'Driver role', FALSE, 1),
    ('carrier', 'Carrier role', TRUE, 2),
    ('admin', 'Administrator role', FALSE, 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify all tables were created:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
