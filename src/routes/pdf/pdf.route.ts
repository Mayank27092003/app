import { PDFController } from "../../controllers/pdf";
import { authenticateToken } from "../../middlewares/authentication";
import { useValidator } from "../../middlewares/validate";
import type { RouteDefinition } from "../types";

const controller = new PDFController();

// Validation schema for PDF generation
const loadConfirmationSchema = {
  type: "object",
  required: [
    "bookingId",
    "loadId",
    "pickup",
    "delivery",
    "commodity",
    "payment",
    "postedBy",
    "acceptedBy",
  ],
  properties: {
    bookingId: { type: "string" },
    loadId: { type: "string" },
    pickup: {
      type: "object",
      required: ["address", "city", "state", "country", "zipCode", "date", "time"],
      properties: {
        address: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        country: { type: "string" },
        zipCode: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
      },
    },
    delivery: {
      type: "object",
      required: ["address", "city", "state", "country", "zipCode", "date", "time"],
      properties: {
        address: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        country: { type: "string" },
        zipCode: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
      },
    },
    commodity: {
      type: "object",
      required: ["type", "weight", "weightUnit"],
      properties: {
        type: { type: "string" },
        weight: { type: "number" },
        weightUnit: { type: "string", enum: ["kg", "lbs", "tons"] },
        pieces: { type: ["number", "null"] },
        distance: { type: ["number", "null"] },
        estimatedDuration: { type: ["string", "null"] },
      },
    },
    payment: {
      type: "object",
      required: ["amount"],
      properties: {
        amount: { type: "number" },
        currency: { type: ["string", "null"] },
      },
    },
    postedBy: {
      type: "object",
      required: ["name", "role", "email"],
      properties: {
        name: { type: "string" },
        role: { type: "string" },
        email: { type: "string", format: "email" },
        phone: { type: ["string", "null"] },
      },
    },
    acceptedBy: {
      type: "object",
      required: ["name", "role", "email"],
      properties: {
        name: { type: "string" },
        role: { type: "string" },
        email: { type: "string", format: "email" },
        phone: { type: ["string", "null"] },
      },
    },
    bookingDate: { type: ["string", "null"] },
    specialRequirements: { type: ["string", "null"] },
  },
  additionalProperties: false,
} as const;

const pdfRoutes: RouteDefinition[] = [
  {
    path: "/load-confirmation",
    controller: { post: controller.generateLoadConfirmationPDF },
    validators: { post: useValidator(loadConfirmationSchema) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Generate load booking confirmation PDF",
        description:
          "Generate a professional PDF confirmation document for a load booking. Returns the PDF file as a download.",
        tags: ["PDF"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "bookingId",
                  "loadId",
                  "pickup",
                  "delivery",
                  "commodity",
                  "payment",
                  "postedBy",
                  "acceptedBy",
                ],
                properties: {
                  bookingId: {
                    type: "string",
                    example: "BK-2025-001234",
                  },
                  loadId: {
                    type: "string",
                    example: "LD-2025-005678",
                  },
                  pickup: {
                    type: "object",
                    example: {
                      address: "123 Main St",
                      city: "Los Angeles",
                      state: "CA",
                      country: "USA",
                      zipCode: "90001",
                      date: "2025-02-15",
                      time: "09:00",
                    },
                  },
                  delivery: {
                    type: "object",
                    example: {
                      address: "456 Oak Ave",
                      city: "San Francisco",
                      state: "CA",
                      country: "USA",
                      zipCode: "94102",
                      date: "2025-02-16",
                      time: "14:00",
                    },
                  },
                  commodity: {
                    type: "object",
                    example: {
                      type: "Electronics",
                      weight: 5000,
                      weightUnit: "lbs",
                      pieces: 50,
                      distance: 380,
                      estimatedDuration: "6 hours",
                    },
                  },
                  payment: {
                    type: "object",
                    example: {
                      amount: 2500.0,
                      currency: "USD",
                    },
                  },
                  postedBy: {
                    type: "object",
                    example: {
                      name: "John Smith",
                      role: "Shipper",
                      email: "john@example.com",
                      phone: "+1-555-0100",
                    },
                  },
                  acceptedBy: {
                    type: "object",
                    example: {
                      name: "Jane Doe",
                      role: "Carrier",
                      email: "jane@example.com",
                      phone: "+1-555-0200",
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "PDF generated successfully",
            content: {
              "application/pdf": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          400: { description: "Invalid input data" },
          401: { description: "Unauthorized" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
];

export default pdfRoutes;

