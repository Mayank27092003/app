import puppeteer from "puppeteer";

/**
 * Generate simple HTML template for load booking confirmation
 */
function generateHTMLTemplate(data: LoadBookingConfirmationData): string {
  const bookingDate = data.bookingDate || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const currency = data.payment.currency || "USD";
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(data.payment.amount);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Booking Confirmation - ${data.bookingId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      padding: 40px;
      color: #111;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .gofrts-title {
      font-size: 28px;
      font-weight: bold;
      color: #3366cc;
      margin-bottom: 15px;
    }
    .info-box {
      border: 1px solid #b3b3b3;
      padding: 15px;
      text-align: center;
      margin: 0 auto;
      max-width: 500px;
      background: #f5f5f5;
    }
    .info-box div {
      margin: 5px 0;
      font-size: 12px;
    }
    .section {
      margin: 30px 0;
    }
    .section-label {
      font-size: 12px;
      font-weight: bold;
      color: #3366cc;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .section-box {
      border: 1px solid #b3b3b3;
      background: #f5f5f5;
      padding: 20px;
      margin-top: 25px;
    }
    .section-content {
      font-size: 10px;
      line-height: 1.6;
    }
    .section-content div {
      margin: 8px 0;
    }
    .label {
      font-weight: bold;
      display: inline-block;
      min-width: 120px;
    }
    .two-column {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }
    .column {
      flex: 1;
    }
    .border-bottom {
      border-bottom: 2px solid #000;
      margin: 20px 0;
    }
    .amount {
      color: #3366cc;
      font-weight: bold;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="info-box">
      <div class="gofrts-title" style="margin-bottom: 15px;">GOFRTS</div>
      <div><strong>Order #: ${data.bookingId}</strong></div>
      <div>Date: ${bookingDate}</div>
    </div>
  </div>

  <div class="border-bottom"></div>

  <!-- Pickup Location -->
  <div class="section">
    <div class="section-label">Pickup Location</div>
    <div class="section-box">
      <div class="section-content">
        <div>${data.pickup.address}, ${data.pickup.city}, ${data.pickup.state} ${data.pickup.zipCode}, ${data.pickup.country}</div>
        <div>
          <span class="label">Date:</span> ${data.pickup.date}
          <span class="label" style="margin-left: 40px;">Time:</span> ${data.pickup.time}
        </div>
      </div>
    </div>
  </div>

  <div class="border-bottom"></div>

  <!-- Delivery Location -->
  <div class="section">
    <div class="section-label">Delivery Location</div>
    <div class="section-box">
      <div class="section-content">
        <div>${data.delivery.address}, ${data.delivery.city}, ${data.delivery.state} ${data.delivery.zipCode}, ${data.delivery.country}</div>
        <div>
          <span class="label">Date:</span> ${data.delivery.date}
          <span class="label" style="margin-left: 40px;">Time:</span> ${data.delivery.time}
        </div>
      </div>
    </div>
  </div>

  <div class="border-bottom"></div>

  <!-- Commodity Details -->
  <div class="section">
    <div class="section-label">Commodity Details</div>
    <div class="section-box">
      <div class="section-content">
        <div>
          <span class="label">Type:</span> ${data.commodity.type}
        </div>
        <div>
          <span class="label">Weight:</span> ${data.commodity.weight} ${data.commodity.weightUnit}
          ${data.commodity.pieces ? `<span class="label" style="margin-left: 40px;">Pieces:</span> ${data.commodity.pieces}` : ''}
        </div>
        ${data.commodity.distance ? `
        <div>
          <span class="label">Distance:</span> ${data.commodity.distance} miles
          ${data.commodity.estimatedDuration ? `<span class="label" style="margin-left: 40px;">Estimated Duration:</span> ${data.commodity.estimatedDuration}` : ''}
        </div>
        ` : ''}
        ${data.specialRequirements ? `
        <div style="margin-top: 10px;">
          <span class="label">Special Requirements:</span> ${data.specialRequirements}
        </div>
        ` : ''}
      </div>
    </div>
  </div>

  <div class="border-bottom"></div>

  <!-- Payment Information -->
  <div class="section">
    <div class="section-label">Payment Information</div>
    <div class="section-box">
      <div class="section-content">
        <div>
          <span class="label">Agreed Rate:</span> <span class="amount">${formattedAmount}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="border-bottom"></div>

  <!-- Posted By and Accepted By -->
  <div class="two-column">
    <div class="column">
      <div class="section">
        <div class="section-label">Posted By</div>
        <div class="section-box">
          <div class="section-content">
            <div><span class="label">Name:</span> ${data.postedBy.name}</div>
            <div><span class="label">Role:</span> ${data.postedBy.role}</div>
            <div><span class="label">Email:</span> ${data.postedBy.email}</div>
            ${data.postedBy.phone ? `<div><span class="label">Phone:</span> ${data.postedBy.phone}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="section">
        <div class="section-label">Accepted By</div>
        <div class="section-box">
          <div class="section-content">
            <div><span class="label">Name:</span> ${data.acceptedBy.name}</div>
            <div><span class="label">Role:</span> ${data.acceptedBy.role}</div>
            <div><span class="label">Email:</span> ${data.acceptedBy.email}</div>
            ${data.acceptedBy.phone ? `<div><span class="label">Phone:</span> ${data.acceptedBy.phone}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
  `.trim();
}

export interface LoadBookingConfirmationData {
  // Booking/Load Info
  bookingId: string;
  loadId: string;
  
  // Pickup Information
  pickup: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    date: string;
    time: string;
  };
  
  // Delivery Information
  delivery: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    date: string;
    time: string;
  };
  
  // Commodity Details
  commodity: {
    type: string;
    weight: number;
    weightUnit: string; // "kg", "lbs", "tons"
    pieces?: number;
    distance?: number;
    estimatedDuration?: string;
  };
  
  // Payment Information
  payment: {
    amount: number;
    currency?: string; // Default: "USD"
  };
  
  // Posted By User Info
  postedBy: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  };
  
  // Accepted By User Info
  acceptedBy: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  };
  
  // Optional metadata
  bookingDate?: string;
  specialRequirements?: string;
}

/**
 * Generate HTML string for load booking confirmation
 * @param data - Load booking confirmation data
 * @returns HTML as string
 */
export function generateLoadBookingConfirmationHTML(
  data: LoadBookingConfirmationData
): string {
  return generateHTMLTemplate(data);
}

/**
 * Generate a professional PDF confirmation document for load booking using HTML-to-PDF
 * @param data - Load booking confirmation data
 * @returns PDF as Buffer
 */
export async function generateLoadBookingConfirmationPDF(
  data: LoadBookingConfirmationData
): Promise<Buffer> {
  const html = generateHTMLTemplate(data);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
      printBackground: true,
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    // Close browser
    await browser.close();
  }
}

