import { QRController } from "../../controllers/qr";

const controller = new QRController();

export default [
  {
    path: "/",
    controller: { get: controller.redirectToAppStore },
    docs: {
      get: {
        summary: "QR Code - Redirect to App Store or Play Store",
        description: "Detects device type (iOS/Android) from user agent and redirects to the appropriate app store. Can also accept type parameter.",
        tags: ["QR Code"],
        parameters: [
          {
            name: "type",
            in: "query",
            description: "Optional: 'ios' or 'android' to force redirect to specific store",
            required: false,
            schema: {
              type: "string",
              enum: ["ios", "android", "apple", "google"],
            },
          },
        ],
        responses: {
          301: {
            description: "Redirect to App Store or Play Store",
            headers: {
              Location: {
                description: "URL to redirect to",
                schema: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
  {
    path: "/generate",
    controller: { get: controller.generateQRCode },
    docs: {
      get: {
        summary: "Generate QR Code for App Store Redirect",
        description: "Generates a QR code image for the redirect route. Returns PNG image by default, or base64 data URL if format=dataUrl",
        tags: ["QR Code"],
        parameters: [
          {
            name: "format",
            in: "query",
            description: "Output format: 'image' (PNG) or 'dataUrl' (base64)",
            required: false,
            schema: {
              type: "string",
              enum: ["image", "dataUrl", "base64"],
              default: "image",
            },
          },
          {
            name: "size",
            in: "query",
            description: "QR code size in pixels",
            required: false,
            schema: {
              type: "integer",
              default: 300,
              minimum: 100,
              maximum: 1000,
            },
          },
          {
            name: "margin",
            in: "query",
            description: "QR code margin",
            required: false,
            schema: {
              type: "integer",
              default: 1,
              minimum: 0,
              maximum: 4,
            },
          },
        ],
        responses: {
          200: {
            description: "QR code generated successfully",
            content: {
              "image/png": {
                schema: {
                  type: "string",
                  format: "binary",
                },
                description: "PNG image when format=image",
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        qrCode: {
                          type: "string",
                          description: "Base64 data URL when format=dataUrl",
                        },
                        url: {
                          type: "string",
                          description: "The redirect URL encoded in the QR code",
                        },
                        format: { type: "string" },
                      },
                    },
                  },
                },
                description: "JSON response when format=dataUrl",
              },
            },
          },
          500: {
            description: "Error generating QR code",
          },
        },
      },
    },
  },
  {
    path: "/:type",
    controller: { get: controller.redirectToAppStore },
    docs: {
      get: {
        summary: "QR Code with Type - Redirect to specific App Store",
        description: "Redirects to App Store (ios/apple) or Play Store (android/google) based on type parameter",
        tags: ["QR Code"],
        parameters: [
          {
            name: "type",
            in: "path",
            description: "Device type: 'ios', 'android', 'apple', or 'google'",
            required: true,
            schema: {
              type: "string",
              enum: ["ios", "android", "apple", "google"],
            },
          },
        ],
        responses: {
          301: {
            description: "Redirect to specified App Store",
            headers: {
              Location: {
                description: "URL to redirect to",
                schema: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
];



