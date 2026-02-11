export const updateProfileDoc = {
  put: {
    summary: "Update user profile",
    description:
      "Update basic user profile information including user, company, driver, and truck details.",
    tags: ["User Profile"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              userName: { type: "string", example: "johndoe" },
              phoneNumber: {
                type: "string",
                nullable: true,
                example: "+1234567890",
              },
              phoneCountryCode: {
                type: "string",
                nullable: true,
                example: "+1",
              },
              profileImage: {
                type: "string",
                nullable: true,
                example: "https://example.com/image.jpg",
              },
              company: {
                type: "object",
                nullable: true,
                properties: {
                  companyName: { type: "string", example: "ABC Logistics" },
                  industryType: {
                    type: "string",
                    nullable: true,
                    example: "Logistics",
                  },
                  contactNumber: {
                    type: "string",
                    nullable: true,
                    example: "+1234567890",
                  },
                  phoneNumber: {
                    type: "string",
                    nullable: true,
                    example: "+1234567890",
                  },
                  address: {
                    type: "string",
                    nullable: true,
                    example: "123 Main St",
                  },
                  country: {
                    type: "string",
                    nullable: true,
                    example: "United States",
                  },
                  state: {
                    type: "string",
                    nullable: true,
                    example: "California",
                  },
                  city: {
                    type: "string",
                    nullable: true,
                    example: "Los Angeles",
                  },
                  zipCode: {
                    type: "string",
                    nullable: true,
                    example: "90210",
                  },
                },
              },
              driver: {
                type: "object",
                nullable: true,
                properties: {
                  licenseNumber: { type: "string", example: "D123456789" },
                  drivingLicenseExpiresAt: {
                    type: "string",
                    format: "date",
                    example: "2026-12-31",
                  },
                  workRadius: { type: "integer", example: 100 },
                },
              },
              trucks: {
                type: "array",
                nullable: true,
                items: {
                  type: "object",
                  properties: {
                    truckTypeId: { type: "integer", example: 2 },
                    capacity: { type: "string", example: "20" },
                    capacityUnit: { type: "string", example: "ft" },
                    isPrimary: { type: "boolean", example: true },
                    label: {
                      type: "string",
                      nullable: true,
                      example: "Main Truck",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Profile updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        userName: { type: "string", example: "johndoe" },
                        phoneNumber: {
                          type: "string",
                          nullable: true,
                          example: "+1234567890",
                        },
                        profileImage: {
                          type: "string",
                          nullable: true,
                          example: "https://example.com/image.jpg",
                        },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                    company: {
                      type: "object",
                      nullable: true,
                      properties: {
                        id: { type: "integer", example: 1 },
                        companyName: {
                          type: "string",
                          example: "ABC Logistics",
                        },
                        industryType: {
                          type: "string",
                          nullable: true,
                          example: "Logistics",
                        },
                        contactNumber: {
                          type: "string",
                          nullable: true,
                          example: "+1234567890",
                        },
                        phoneNumber: {
                          type: "string",
                          nullable: true,
                          example: "+1234567890",
                        },
                        address: {
                          type: "string",
                          nullable: true,
                          example: "123 Main St",
                        },
                        country: {
                          type: "string",
                          nullable: true,
                          example: "United States",
                        },
                        state: {
                          type: "string",
                          nullable: true,
                          example: "California",
                        },
                        city: {
                          type: "string",
                          nullable: true,
                          example: "Los Angeles",
                        },
                        zipCode: {
                          type: "string",
                          nullable: true,
                          example: "90210",
                        },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                    driver: {
                      type: "object",
                      nullable: true,
                      properties: {
                        id: { type: "integer", example: 5 },
                        licenseNumber: {
                          type: "string",
                          example: "D123456789",
                        },
                        drivingLicenseExpiresAt: {
                          type: "string",
                          format: "date",
                          example: "2026-12-31",
                        },
                        workRadius: { type: "integer", example: 100 },
                      },
                    },
                    trucks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 10 },
                          truckTypeId: { type: "integer", example: 2 },
                          capacity: { type: "string", example: "20" },
                          capacityUnit: { type: "string", example: "ft" },
                          isPrimary: { type: "boolean", example: true },
                          label: {
                            type: "string",
                            nullable: true,
                            example: "Main Truck",
                          },
                          updatedAt: {
                            type: "string",
                            format: "date-time",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "400": { description: "Invalid input data" },
      "401": { description: "Unauthorized" },
      "500": { description: "Failed to update profile" },
    },
  },
};

export const getProfileDoc = {
  get: {
    summary: "Get comprehensive user profile",
    description:
      "Get complete user profile including verification status, roles, documents, company info, and driver details",
    tags: ["User Profile"],
    responses: {
      200: {
        description: "Profile retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    // Basic user info
                    id: { type: "integer", example: 1 },
                    firstName: { type: "string", example: "John" },
                    middleName: {
                      type: ["string", "null"],
                      example: "Michael",
                    },
                    lastName: { type: "string", example: "Doe" },
                    fullName: {
                      type: "string",
                      example: "John Michael Doe",
                    },
                    userName: { type: "string", example: "johndoe" },
                    email: { type: "string", example: "john@example.com" },
                    profileImage: {
                      type: ["string", "null"],
                      example: "https://example.com/image.jpg",
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },

                    // Email verification
                    isEmailVerified: { type: "boolean", example: true },
                    emailVerifiedAt: {
                      type: ["string", "null"],
                      format: "date-time",
                    },

                    // Verification status
                    verification: {
                      type: "object",
                      properties: {
                        userId: { type: "integer", example: 1 },
                        currentStatus: {
                          type: "string",
                          example: "profile_complete",
                        },
                        lastUpdated: {
                          type: "string",
                          format: "date-time",
                        },
                        verificationNotes: { type: ["string", "null"] },
                        isFullyVerified: {
                          type: "boolean",
                          example: false,
                        },
                        steps: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              step: {
                                type: "string",
                                example: "Email Verification",
                              },
                              status: {
                                type: "string",
                                example: "completed",
                              },
                              completedAt: {
                                type: ["string", "null"],
                                format: "date-time",
                              },
                            },
                          },
                        },
                      },
                    },

                    // Roles and permissions
                    roles: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          role: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              name: { type: "string", example: "driver" },
                              description: {
                                type: "string",
                                example: "Professional driver",
                              },
                              isCompanyRole: {
                                type: "boolean",
                                example: false,
                              },
                              jobPostFee: { type: "integer", example: 0 },
                              sortOrder: { type: "integer", example: 0 },
                            },
                          },
                          sortOrder: { type: "integer", example: 0 },
                          assignedAt: {
                            type: "string",
                            format: "date-time",
                          },
                        },
                      },
                    },

                    // Documents
                    documents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          documentType: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              name: {
                                type: "string",
                                example: "Driver License",
                              },
                              description: {
                                type: "string",
                                example: "Valid driver license",
                              },
                              requiresExpiry: {
                                type: "boolean",
                                example: true,
                              },
                            },
                          },
                          fileUrl: {
                            type: "string",
                            example: "https://example.com/license.pdf",
                          },
                          expiryDate: {
                            type: ["string", "null"],
                            format: "date",
                          },
                          verified: { type: "boolean", example: true },
                          createdAt: {
                            type: "string",
                            format: "date-time",
                          },
                          updatedAt: {
                            type: "string",
                            format: "date-time",
                          },
                        },
                      },
                    },

                    // Company information
                    company: {
                      type: ["object", "null"],
                      properties: {
                        id: { type: "integer", example: 1 },
                        companyName: {
                          type: "string",
                          example: "ABC Logistics",
                        },
                        industryType: {
                          type: ["string", "null"],
                          example: "Logistics",
                        },
                        contactNumber: {
                          type: ["string", "null"],
                          example: "+1234567890",
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },

                    // Company memberships
                    companyMemberships: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          company: {
                            type: "object",
                            properties: {
                              id: { type: "integer", example: 1 },
                              companyName: {
                                type: "string",
                                example: "XYZ Transport",
                              },
                              industryType: {
                                type: ["string", "null"],
                                example: "Transport",
                              },
                              contactNumber: {
                                type: ["string", "null"],
                                example: "+1234567890",
                              },
                            },
                          },
                          roleId: {
                            type: ["integer", "null"],
                            example: 1,
                            description: "ID of the role in the company",
                          },
                          role: {
                            type: ["object", "null"],
                            description: "Role details",
                            properties: {
                              id: { type: "integer", example: 1 },
                              name: { type: "string", example: "Manager" },
                              description: { type: "string", example: "Company manager role" },
                            },
                          },
                          isPrimary: { type: "boolean", example: true },
                        },
                      },
                    },

                    // Driver information
                    driver: {
                      type: ["object", "null"],
                      properties: {
                        id: { type: "integer", example: 1 },
                        licenseNumber: {
                          type: "string",
                          example: "DL123456789",
                        },
                        twicNumber: {
                          type: ["string", "null"],
                          example: "TWIC123456",
                        },
                        medicalCertificate: {
                          type: ["string", "null"],
                          example: "MED123456",
                        },
                        drugTestResult: {
                          type: ["string", "null"],
                          example: "DRUG123456",
                        },
                        verified: { type: "boolean", example: true },
                        workRadius: {
                          type: ["integer", "null"],
                          example: 50,
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },

                    // Verification metadata
                    verifiedBy: {
                      type: ["object", "null"],
                      properties: {
                        id: { type: "integer", example: 1 },
                        fullName: { type: "string", example: "Admin User" },
                        email: {
                          type: "string",
                          example: "admin@example.com",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      404: { description: "User not found" },
      500: { description: "Internal server error" },
    },
  },
};
