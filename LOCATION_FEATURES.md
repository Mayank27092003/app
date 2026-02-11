# Location Features Documentation

## Overview
This document describes the new location features added to the LoadRider backend, including phone number support for users, comprehensive location fields for companies, and FCM token management for multiple devices.

## New Features

### 1. User Phone Number
- Added `phoneNumber` field to the `users` table
- Users can now update their phone number through the profile update API
- Field is optional and nullable

### 2. Company Location Fields
The `companies` table now includes the following location fields:
- `phoneNumber`: Direct phone number for the company
- `address`: Street address
- `country`: Country name
- `state`: State/province name  
- `city`: City name
- `zipCode`: Postal/zip code

### 3. Location Service
A new location service that provides country, state, and city data using the `countries-states-cities` package:

#### Available Endpoints:
- `GET /v1/location/countries` - Get all countries
- `GET /v1/location/countries/search?q=query` - Search countries
- `GET /v1/location/countries/:countryCode` - Get country by ISO code
- `GET /v1/location/countries/:countryCode/states` - Get states by country
- `GET /v1/location/countries/:countryCode/states/search?q=query` - Search states
- `GET /v1/location/countries/:countryCode/states/:stateCode` - Get state by code
- `GET /v1/location/countries/:countryCode/states/:stateCode/cities` - Get cities by state
- `GET /v1/location/countries/:countryCode/states/:stateCode/cities/search?q=query` - Search cities

### 4. Enhanced Profile API
The profile update API now supports:
- Updating user phone number
- Creating/updating company information including all location fields
- Automatic company creation if it doesn't exist
- **Smart field updates**: Only fields that are provided in the payload are updated (empty strings are ignored)

#### Profile Update Request Example:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "company": {
    "companyName": "ABC Logistics",
    "industryType": "Logistics",
    "phoneNumber": "+1234567890",
    "address": "123 Main St",
    "country": "United States",
    "state": "California",
    "city": "Los Angeles",
    "zipCode": "90210"
  }
}
```

**Note**: Only fields that are provided in the payload will be updated. Empty strings or undefined values will not overwrite existing data.

### 5. FCM Token Management
A comprehensive system for managing Firebase Cloud Messaging tokens across multiple devices:

#### Features:
- Multiple device support per user
- Device identification and tracking
- Token lifecycle management
- Automatic cleanup of inactive tokens

#### Available Endpoints:
- `POST /v1/fcm/register` - Register or update FCM token
- `GET /v1/fcm/tokens` - Get user's active FCM tokens
- `DELETE /v1/fcm/tokens/:tokenId/deactivate` - Deactivate specific token
- `DELETE /v1/fcm/devices/:deviceId/deactivate` - Deactivate all tokens for a device
- `DELETE /v1/fcm/deactivate-all` - Deactivate all user tokens (logout all devices)
- `GET /v1/fcm/stats` - Get token statistics
- `POST /v1/fcm/cleanup` - Clean up inactive tokens (Admin)

#### FCM Token Registration Example:
```json
POST /v1/fcm/register
{
  "fcmToken": "fcm_token_here",
  "deviceId": "device_123",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21"
}
```

## Database Changes

### Migration: `20250115000002_add_phone_and_location_fields.ts`
- Adds `phoneNumber` column to `users` table
- Adds location fields to `companies` table:
  - `phoneNumber`
  - `address`
  - `country`
  - `state`
  - `city`
  - `zipCode`

### Migration: `20250115000003_create_fcm_tokens_table.ts`
- Creates `userFcmTokens` table with fields:
  - `userId` - Reference to users table
  - `fcmToken` - Firebase Cloud Messaging token
  - `deviceId` - Optional device identifier
  - `deviceType` - Device type (android, ios, web)
  - `deviceName` - Human-readable device name
  - `isActive` - Whether token is active
  - `lastUsedAt` - Last usage timestamp
  - Proper indexes and constraints

## Installation

### 1. Install Dependencies
```bash
npm install countries-states-cities
```

### 2. Run Migrations
```bash
npm run migrate
```

## Usage Examples

### Get All Countries
```bash
curl -X GET "http://localhost:3000/v1/location/countries"
```

### Get States for a Country
```bash
curl -X GET "http://localhost:3000/v1/location/countries/US/states"
```

### Search Cities
```bash
curl -X GET "http://localhost:3000/v1/location/countries/US/states/CA/cities/search?q=Los"
```

### Update User Profile with Company
```bash
curl -X PUT "http://localhost:3000/v1/user/profile" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "company": {
      "companyName": "ABC Logistics",
      "address": "123 Main St",
      "country": "United States",
      "state": "California",
      "city": "Los Angeles"
    }
  }'
```

### Register FCM Token
```bash
curl -X POST "http://localhost:3000/v1/fcm/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "fcm_token_here",
    "deviceId": "device_123",
    "deviceType": "android",
    "deviceName": "Samsung Galaxy"
  }'
```

### Get User FCM Tokens
```bash
curl -X GET "http://localhost:3000/v1/fcm/tokens" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Data Structure

### Country Data
```typescript
interface CountryData {
  id: number;
  name: string;
  isoCode: string;
  phoneCode: string;
  flag: string;
  currency: string;
  latitude: string;
  longitude: string;
}
```

### State Data
```typescript
interface StateData {
  id: number;
  name: string;
  stateCode: string;
  countryId: number;
  latitude: string;
  longitude: string;
}
```

### City Data
```typescript
interface CityData {
  id: number;
  name: string;
  stateId: number;
  latitude: string;
  longitude: string;
}
```

### FCM Token Data
```typescript
interface UserFcmToken {
  id: number;
  userId: number;
  fcmToken: string;
  deviceId?: string;
  deviceType?: string;
  deviceName?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

## Smart Field Updates

The profile update system now intelligently handles field updates:

- **Provided fields**: Only fields that are explicitly included in the request payload are updated
- **Empty strings**: Empty strings are treated as valid values and will overwrite existing data
- **Undefined fields**: Fields not provided in the payload remain unchanged
- **Company creation**: If company data is provided but no company exists, a new company is automatically created
- **Partial updates**: Users can update just the fields they want to change

## Notes
- All location fields are stored as strings in the database
- The location service uses the `countries-states-cities` package for accurate, up-to-date location data
- Company location fields are optional and can be updated independently
- Phone numbers are stored as strings to support international formats
- The system automatically creates a company record if one doesn't exist when updating profile with company information
- FCM tokens support multiple devices per user with proper device tracking
- Inactive FCM tokens are automatically cleaned up to maintain database performance
- All FCM token operations are properly secured with authentication
