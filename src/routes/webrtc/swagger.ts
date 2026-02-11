export const webrtcSwaggerDocs = {
  initiateCall: {
    summary: "Initiate a call",
    tags: ["WebRTC"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["conversationId", "callType"],
            properties: {
              conversationId: {
                type: "integer",
                description: "ID of the conversation",
              },
              callType: {
                type: "string",
                enum: ["audio", "video"],
                description: "Type of call",
              },
              isGroupCall: {
                type: "boolean",
                description: "Whether this is a group call (optional, auto-determined if not specified)",
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Call initiated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      500: { description: "Internal server error" },
    },
  },

  acceptCall: {
    summary: "Accept a call",
    tags: ["WebRTC"],
    parameters: [
      {
        in: "path",
        name: "callSessionId",
        required: true,
        schema: { type: "integer" },
        description: "Call session ID",
      },
    ],
    responses: {
      200: {
        description: "Call accepted successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      404: { description: "Call session not found" },
      500: { description: "Internal server error" },
    },
  },

  declineCall: {
    summary: "Decline a call",
    tags: ["WebRTC"],
    parameters: [
      {
        in: "path",
        name: "callSessionId",
        required: true,
        schema: { type: "integer" },
        description: "Call session ID",
      },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Reason for declining the call",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Call declined successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      404: { description: "Call session not found" },
      500: { description: "Internal server error" },
    },
  },

  endCall: {
    summary: "End a call",
    tags: ["WebRTC"],
    parameters: [
      {
        in: "path",
        name: "callSessionId",
        required: true,
        schema: { type: "integer" },
        description: "Call session ID",
      },
    ],
    responses: {
      200: {
        description: "Call ended successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Call session not found" },
      500: { description: "Internal server error" },
    },
  },

  joinGroupCall: {
    summary: "Join an ongoing group call",
    tags: ["WebRTC"],
    parameters: [
      {
        in: "path",
        name: "callSessionId",
        required: true,
        schema: { type: "integer" },
        description: "Call session ID",
      },
    ],
    responses: {
      200: {
        description: "Successfully joined group call",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "object" },
              },
            },
          },
        },
      },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Call session not found" },
      500: { description: "Internal server error" },
    },
  },

  handleSignaling: {
    summary: "Handle WebRTC signaling",
    tags: ["WebRTC"],
    parameters: [
      {
        in: "path",
        name: "callSessionId",
        required: true,
        schema: { type: "integer" },
        description: "Call session ID",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["type", "data", "toUserId"],
            properties: {
              type: {
                type: "string",
                enum: ["offer", "answer", "ice-candidate", "call-ended", "call-accepted", "call-declined"],
                description: "Type of signaling data",
              },
              data: {
                type: "object",
                description: "Signaling data payload",
              },
              toUserId: {
                type: "integer",
                description: "ID of the user to send signaling data to",
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Signaling data sent successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      404: { description: "Call session not found" },
      500: { description: "Internal server error" },
    },
  },

  getCallHistory: {
    summary: "Get call history for a conversation",
    tags: ["WebRTC"],
    parameters: [
      {
        in: "path",
        name: "conversationId",
        required: true,
        schema: { type: "integer" },
        description: "Conversation ID",
      },
      {
        in: "query",
        name: "page",
        schema: { type: "integer", default: 1 },
        description: "Page number",
      },
      {
        in: "query",
        name: "limit",
        schema: { type: "integer", default: 20 },
        description: "Number of calls per page",
      },
    ],
    responses: {
      200: {
        description: "Call history retrieved successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                data: {
                  type: "object",
                  properties: {
                    calls: { type: "array" },
                    pagination: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
      400: { description: "Bad request" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      500: { description: "Internal server error" },
    },
  },
};
