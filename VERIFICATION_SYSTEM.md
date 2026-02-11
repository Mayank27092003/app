# User Verification System

This document describes the comprehensive user verification system implemented in the LoadRider backend application.

## Overview

The verification system provides a multi-step verification process for users, ensuring account security and compliance with platform requirements. The system tracks verification status across different aspects of user onboarding and account management.

## Verification Status Levels

The system implements a hierarchical verification status with the following levels:

1. **`pending`** - Initial state when user signs up
2. **`profile_complete`** - User has completed their basic profile
3. **`documents_verified`** - User has uploaded and verified documents
4. **`admin_verified`** - Admin has manually verified the user
5. **`fully_verified`** - All verification steps completed
6. **`suspended`** - Account suspended by admin
7. **`rejected`** - Verification rejected by admin

## Database Schema

### Users Table Additions

```sql
-- New columns added to users table
verificationStatus ENUM('pending', 'profile_complete', 'documents_verified', 'admin_verified', 'fully_verified', 'suspended', 'rejected') DEFAULT 'pending' NOT NULL,
verificationStatusUpdatedAt TIMESTAMP NULL,
verifiedByUserId INTEGER NULL REFERENCES users(id),
verificationNotes TEXT NULL,
lastVerificationAttemptAt TIMESTAMP NULL
```

## API Endpoints

### User Verification Endpoints

#### GET `/api/v1/user/verification/status`
Get the current verification status and progress for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "currentStatus": "profile_complete",
    "lastUpdated": "2024-01-15T10:30:00Z",
    "verificationNotes": null,
    "isFullyVerified": false,
    "steps": [
      {
        "step": "Email Verification",
        "status": "completed",
        "completedAt": "2024-01-15T09:00:00Z"
      },
      {
        "step": "Profile Completion",
        "status": "completed",
        "completedAt": null
      },
      {
        "step": "Document Verification",
        "status": "pending",
        "completedAt": null
      },
      {
        "step": "Admin Verification",
        "status": "pending",
        "completedAt": null,
        "verifiedBy": null
      }
    ]
  }
}
```

#### POST `/api/v1/user/verification/check-requirements`
Check if user meets verification requirements for a specific action.

**Request:**
```json
{
  "requiredStatus": "documents_verified"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isVerified": false,
    "currentStatus": "profile_complete",
    "requiredStatus": "documents_verified"
  }
}
```

#### POST `/api/v1/user/verification/auto-update`
Automatically update verification status based on user profile completion.

### Admin Verification Endpoints

#### GET `/api/v1/user/verification/pending`
Get list of users pending verification for admin review.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50, max: 100)
- `offset` (optional): Number of records to skip (default: 0)

#### PATCH `/api/v1/user/verification/:userId/status`
Update verification status for a specific user.

**Request:**
```json
{
  "status": "admin_verified",
  "notes": "Documents verified successfully"
}
```

## OTP Verification Endpoints

### POST `/api/v1/auth/verify-otp`
Verify a one-time password (OTP) for various purposes.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "email_verification"
}
```

**Available Purposes:**
- `email_verification`
- `phone_verification`
- `password_reset`
- `payment_verification`

### POST `/api/v1/auth/resend-otp`
Resend a one-time password (OTP) for various purposes.

**Request:**
```json
{
  "email": "user@example.com",
  "purpose": "email_verification"
}
```

## Middleware Usage

### Verification Requirements

Use the verification middleware to protect endpoints that require specific verification levels:

```typescript
import { requireVerification } from "../middlewares/requireVerification";

// Require documents verified for job creation
middlewares: { 
  post: [
    authenticateToken, 
    requireRole(["shipper", "company", "admin"]), 
    requireVerification("documents_verified")
  ] 
}

// Require admin verification for premium features
middlewares: { 
  post: [
    authenticateToken, 
    requireVerification("admin_verified")
  ] 
}
```

### Pre-built Middleware Functions

- `requireProfileComplete` - Requires at least profile completion
- `requireDocumentsVerified` - Requires document verification
- `requireAdminVerified` - Requires admin verification
- `requireFullyVerified` - Requires full verification

## Services

### UserVerificationService

The main service for managing user verification:

```typescript
// Update verification status
await verificationService.updateVerificationStatus(
  userId,
  "admin_verified",
  adminUserId,
  "Documents verified successfully"
);

// Check verification requirements
await verificationService.checkVerificationRequirements(
  userId,
  "documents_verified"
);

// Get verification summary
const summary = await verificationService.getVerificationSummary(userId);

// Auto-update based on profile completion
await verificationService.autoUpdateVerificationStatus(userId);
```

## Integration Examples

### Job Creation with Verification

Jobs require document verification before creation:

```typescript
// In job routes
{
  path: "/",
  controller: { post: controller.createJob },
  middlewares: { 
    post: [
      authenticateToken, 
      requireRole(["shipper", "company", "admin"]), 
      requireVerification("documents_verified")
    ] 
  }
}
```

### User Profile Update

Automatically update verification status when profile is completed:

```typescript
// In user profile update
await verificationService.autoUpdateVerificationStatus(userId);
```

## Migration

Run the migration to add verification columns to the users table:

```bash
npm run migrate
```

This will create the migration file: `20250115000001_add_user_verification_status.ts`

## Usage Examples

### Frontend Integration

```javascript
// Check verification status
const response = await fetch('/api/v1/user/verification/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Check if user can create jobs
const checkResponse = await fetch('/api/v1/user/verification/check-requirements', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ requiredStatus: 'documents_verified' })
});

// Auto-update verification status
await fetch('/api/v1/user/verification/auto-update', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Admin Dashboard

```javascript
// Get pending verifications
const pendingResponse = await fetch('/api/v1/user/verification/pending?limit=20', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Update user verification status
const updateResponse = await fetch(`/api/v1/user/verification/${userId}/status`, {
  method: 'PATCH',
  headers: { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'admin_verified',
    notes: 'Documents verified successfully'
  })
});
```

## Security Considerations

1. **Role-based Access**: Admin endpoints require admin role
2. **Authentication**: All endpoints require valid JWT token
3. **Validation**: All inputs are validated using JSON schemas
4. **Audit Trail**: Verification changes are logged with admin user ID
5. **Status Hierarchy**: Higher verification levels cannot be bypassed

## Future Enhancements

1. **Document Upload Integration**: Connect with document verification service
2. **Email Notifications**: Notify users of verification status changes
3. **Verification Expiry**: Set expiration dates for verification status
4. **Bulk Operations**: Admin bulk verification updates
5. **Verification History**: Track all verification status changes over time
