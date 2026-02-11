import { LocationController } from "../../controllers/location";
import { authenticateToken } from "../../middlewares/authentication";
import type { RouteDefinition } from "../types";

const controller = new LocationController();

const locationRoutes: RouteDefinition[] = [
  {
    path: "/countries",
    controller: { get: controller.getCountries },
    docs: {
      get: {
        summary: "Get all countries",
        description: "Retrieve a list of all available countries with their details",
        tags: ["Location"],
        responses: {
          200: {
            description: "Countries retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          name: { type: "string", example: "United States" },
                          isoCode: { type: "string", example: "US" },
                          phoneCode: { type: "string", example: "+1" },
                          flag: { type: "string", example: "🇺🇸" },
                          currency: { type: "string", example: "USD" },
                          latitude: { type: "string", example: "38.0000" },
                          longitude: { type: "string", example: "-97.0000" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/live",
    controller: { post: controller.upsertMyLocation, get: controller.myRecentLocations },
    middlewares: { post: authenticateToken, get: authenticateToken },
    docs: {
      post: {
        summary: "Upsert my live location",
        description: "Update or insert current user's live location. This endpoint saves the location to database and emits real-time updates to subscribed clients via socket.io",
        tags: ["Location", "Live"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["lat", "lng"],
                properties: {
                  lat: {
                    type: "number",
                    format: "double",
                    minimum: -90,
                    maximum: 90,
                    example: 40.7128,
                    description: "Latitude coordinate (-90 to 90)"
                  },
                  lng: {
                    type: "number",
                    format: "double",
                    minimum: -180,
                    maximum: 180,
                    example: -74.0060,
                    description: "Longitude coordinate (-180 to 180)"
                  },
                  accuracy: {
                    type: "number",
                    format: "double",
                    minimum: 0,
                    maximum: 1000,
                    example: 5.2,
                    description: "Location accuracy in meters (0-1000)"
                  },
                  heading: {
                    type: "number",
                    format: "double",
                    minimum: 0,
                    maximum: 360,
                    example: 180,
                    description: "Direction of travel in degrees (0-360)"
                  },
                  speed: {
                    type: "number",
                    format: "double",
                    minimum: 0,
                    example: 65.5,
                    description: "Speed in km/h"
                  },
                  battery: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    example: 85,
                    description: "Battery percentage (0-100)"
                  },
                  provider: {
                    type: "string",
                    example: "gps",
                    description: "Location provider (e.g., gps, network, passive)"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Location updated successfully and broadcasted to subscribers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        userId: { type: "integer", example: 123 },
                        lat: { type: "number", example: 40.7128 },
                        lng: { type: "number", example: -74.0060 },
                        accuracy: { type: "number", example: 5.2 },
                        heading: { type: "number", example: 180 },
                        speed: { type: "number", example: 65.5 },
                        battery: { type: "integer", example: 85 },
                        provider: { type: "string", example: "gps" },
                        createdAt: { type: "string", format: "date-time", example: "2024-01-15T10:30:00.000Z" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid request data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "lat and lng are required" }
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Unauthorized" }
                  }
                }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Internal error" }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        summary: "Get my recent live locations",
        description: "Retrieve recent location history for the authenticated user",
        tags: ["Location", "Live"],
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
            description: "Number of recent locations to retrieve (1-100)"
          }
        ],
        responses: {
          200: {
            description: "Recent locations retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          userId: { type: "integer", example: 123 },
                          lat: { type: "number", example: 40.7128 },
                          lng: { type: "number", example: -74.0060 },
                          accuracy: { type: "number", example: 5.2 },
                          heading: { type: "number", example: 180 },
                          speed: { type: "number", example: 65.5 },
                          battery: { type: "integer", example: 85 },
                          provider: { type: "string", example: "gps" },
                          createdAt: { type: "string", format: "date-time", example: "2024-01-15T10:30:00.000Z" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Unauthorized" }
                  }
                }
              }
            }
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Internal error" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    path: "/countries/search",
    controller: { get: controller.searchCountries },
    docs: {
      get: {
        summary: "Search countries",
        description: "Search countries by name or ISO code",
        tags: ["Location"],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Search query for country name or ISO code"
          }
        ],
        responses: {
          200: {
            description: "Countries search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          name: { type: "string", example: "United States" },
                          isoCode: { type: "string", example: "US" },
                          phoneCode: { type: "string", example: "+1" },
                          flag: { type: "string", example: "🇺🇸" },
                          currency: { type: "string", example: "USD" },
                          latitude: { type: "string", example: "38.0000" },
                          longitude: { type: "string", example: "-97.0000" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Search query is required" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/countries/:countryCode",
    controller: { get: controller.getCountryByCode },
    docs: {
      get: {
        summary: "Get country by ISO code",
        description: "Retrieve country details by ISO code",
        tags: ["Location"],
        parameters: [
          {
            name: "countryCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ISO 3166-1 alpha-2 country code (e.g., US, CA)"
          }
        ],
        responses: {
          200: {
            description: "Country details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        name: { type: "string", example: "United States" },
                        isoCode: { type: "string", example: "US" },
                        phoneCode: { type: "string", example: "+1" },
                        flag: { type: "string", example: "🇺🇸" },
                        currency: { type: "string", example: "USD" },
                        latitude: { type: "string", example: "38.0000" },
                        longitude: { type: "string", example: "-97.0000" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Country code is required" },
          404: { description: "Country not found" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/countries/:countryCode/states",
    controller: { get: controller.getStatesByCountry },
    docs: {
      get: {
        summary: "Get states by country",
        description: "Retrieve all states/provinces for a specific country",
        tags: ["Location"],
        parameters: [
          {
            name: "countryCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ISO 3166-1 alpha-2 country code (e.g., US, CA)"
          }
        ],
        responses: {
          200: {
            description: "States retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          name: { type: "string", example: "California" },
                          stateCode: { type: "string", example: "CA" },
                          countryId: { type: "integer", example: 1 },
                          latitude: { type: "string", example: "36.7783" },
                          longitude: { type: "string", example: "-119.4179" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Country code is required" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/countries/:countryCode/states/search",
    controller: { get: controller.searchStates },
    docs: {
      get: {
        summary: "Search states within a country",
        description: "Search states/provinces by name or code within a specific country",
        tags: ["Location"],
        parameters: [
          {
            name: "countryCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ISO 3166-1 alpha-2 country code (e.g., US, CA)"
          },
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Search query for state name or code"
          }
        ],
        responses: {
          200: {
            description: "States search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          name: { type: "string", example: "California" },
                          stateCode: { type: "string", example: "CA" },
                          countryId: { type: "integer", example: 1 },
                          latitude: { type: "string", example: "36.7783" },
                          longitude: { type: "string", example: "-119.4179" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Country code and search query are required" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/countries/:countryCode/states/:stateCode",
    controller: { get: controller.getStateByCode },
    docs: {
      get: {
        summary: "Get state by code",
        description: "Retrieve state/province details by code within a specific country",
        tags: ["Location"],
        parameters: [
          {
            name: "countryCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ISO 3166-1 alpha-2 country code (e.g., US, CA)"
          },
          {
            name: "stateCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "State/province code (e.g., CA, NY, ON)"
          }
        ],
        responses: {
          200: {
            description: "State details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        name: { type: "string", example: "California" },
                        stateCode: { type: "string", example: "CA" },
                        countryId: { type: "integer", example: 1 },
                        latitude: { type: "string", example: "36.7783" },
                        longitude: { type: "string", example: "-119.4179" }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Both country code and state code are required" },
          404: { description: "State not found" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/countries/:countryCode/states/:stateCode/cities",
    controller: { get: controller.getCitiesByState },
    docs: {
      get: {
        summary: "Get cities by state",
        description: "Retrieve all cities for a specific state/province within a country",
        tags: ["Location"],
        parameters: [
          {
            name: "countryCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ISO 3166-1 alpha-2 country code (e.g., US, CA)"
          },
          {
            name: "stateCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "State/province code (e.g., CA, NY, ON)"
          }
        ],
        responses: {
          200: {
            description: "Cities retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          name: { type: "string", example: "Los Angeles" },
                          stateId: { type: "integer", example: 1 },
                          latitude: { type: "string", example: "34.0522" },
                          longitude: { type: "string", example: "-118.2437" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Both country code and state code are required" },
          500: { description: "Internal server error" }
        }
      }
    }
  },
  {
    path: "/countries/:countryCode/states/:stateCode/cities/search",
    controller: { get: controller.searchCities },
    docs: {
      get: {
        summary: "Search cities within a state",
        description: "Search cities by name within a specific state/province",
        tags: ["Location"],
        parameters: [
          {
            name: "countryCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ISO 3166-1 alpha-2 country code (e.g., US, CA)"
          },
          {
            name: "stateCode",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "State/province code (e.g., CA, NY, ON)"
          },
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Search query for city name"
          }
        ],
        responses: {
          200: {
            description: "Cities search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 1 },
                          name: { type: "string", example: "Los Angeles" },
                          stateId: { type: "integer", example: 1 },
                          latitude: { type: "string", example: "34.0522" },
                          longitude: { type: "string", example: "-118.2437" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: "Country code, state code, and search query are required" },
          500: { description: "Internal server error" }
        }
      }
    }
  }
];

export default locationRoutes;
