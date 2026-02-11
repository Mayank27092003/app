# Load Booking Confirmation System

This document describes the load booking confirmation system that automatically generates PDFs and sends emails when a load is booked.

## Overview

When a load is booked (application accepted), the system automatically:
1. Generates a professional PDF confirmation document
2. Sends the PDF via email to both parties:
   - The user who posted the load (Posted By)
   - The user who accepted/booked the load (Accepted By)

## Components

### 1. PDF Generation Service
**Location:** `src/services/pdf/loadBookingConfirmation.ts`

**Function:** `generateLoadBookingConfirmationPDF(data: LoadBookingConfirmationData): Promise<Buffer>`

Generates a professional PDF document with:
- Load ID / Booking ID
- Pickup location + date/time
- Delivery location + date/time
- Commodity details (type, weight, pieces)
- Payment / agreed rate
- Posted By user info (name, role, email, phone)
- Accepted By user info (name, role, email, phone)

### 2. Email Service
**Location:** `src/services/email/bookingConfirmation.service.ts`

**Function:** `sendBookingConfirmationEmails(data: LoadBookingConfirmationData)`

Sends the same email with PDF attachment to both parties.

### 3. API Route
**Location:** `src/routes/pdf/pdf.route.ts`

**Endpoint:** `POST /api/v1/pdf/load-confirmation`

Allows manual generation of PDF confirmation documents via API.

### 4. Automatic Integration
**Location:** `src/services/jobApplication/index.ts`

The `acceptApplication` method automatically triggers PDF generation and email sending after a successful booking.

## Usage

### Automatic (Recommended)

When a job application is accepted, the system automatically:
1. Completes the booking transaction
2. Generates the PDF
3. Sends emails to both parties

No additional code needed - it's fully integrated!

### Manual PDF Generation via API

```bash
POST /api/v1/pdf/load-confirmation
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "BK-2025-001234",
  "loadId": "LD-2025-005678",
  "pickup": {
    "address": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "zipCode": "90001",
    "date": "2025-02-15",
    "time": "09:00"
  },
  "delivery": {
    "address": "456 Oak Ave",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "zipCode": "94102",
    "date": "2025-02-16",
    "time": "14:00"
  },
  "commodity": {
    "type": "Electronics",
    "weight": 5000,
    "weightUnit": "lbs",
    "pieces": 50,
    "distance": 380,
    "estimatedDuration": "6 hours"
  },
  "payment": {
    "amount": 2500.0,
    "currency": "USD"
  },
  "postedBy": {
    "name": "John Smith",
    "role": "Shipper",
    "email": "john@example.com",
    "phone": "+1-555-0100"
  },
  "acceptedBy": {
    "name": "Jane Doe",
    "role": "Carrier",
    "email": "jane@example.com",
    "phone": "+1-555-0200"
  }
}
```

### Programmatic Usage

```typescript
import { generateLoadBookingConfirmationPDF } from "./services/pdf/loadBookingConfirmation";
import { BookingConfirmationEmailService } from "./services/email/bookingConfirmation.service";

// Generate PDF
const pdfBuffer = await generateLoadBookingConfirmationPDF({
  bookingId: "BK-2025-001234",
  loadId: "LD-2025-005678",
  // ... other data
});

// Send emails
await BookingConfirmationEmailService.sendBookingConfirmationEmails({
  // ... same data
});
```

## Data Structure

```typescript
interface LoadBookingConfirmationData {
  bookingId: string;
  loadId: string;
  pickup: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    date: string;
    time: string;
  };
  delivery: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    date: string;
    time: string;
  };
  commodity: {
    type: string;
    weight: number;
    weightUnit: "kg" | "lbs" | "tons";
    pieces?: number;
    distance?: number;
    estimatedDuration?: string;
  };
  payment: {
    amount: number;
    currency?: string; // Default: "USD"
  };
  postedBy: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  };
  acceptedBy: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  };
  bookingDate?: string;
  specialRequirements?: string;
}
```

## Features

✅ **Generic Labels**: Uses neutral labels like "Load Booking Confirmation", "Posted By", "Accepted By"  
✅ **Professional Design**: Clean, modern PDF layout with proper formatting  
✅ **Email Integration**: Sends HTML emails with PDF attachments  
✅ **Error Handling**: Email failures don't break the booking flow  
✅ **Production Ready**: Fully typed, validated, and tested

## Configuration

Ensure your email service is configured in `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
DEFAULT_FROM_EMAIL=noreply@loadrider.com
```

## Notes

- PDF generation uses `pdf-lib` library
- Email sending uses `nodemailer`
- Both services are non-blocking - failures are logged but don't affect the booking
- The system automatically fetches user roles and formats phone numbers

