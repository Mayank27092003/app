export const webrtcSchema = {
  initiateCall: {
    body: {
      type: "object",
      required: ["conversationId", "callType"],
      properties: {
        conversationId: {
          type: "integer",
          minimum: 1,
          errorMessage: "Conversation ID must be a positive integer"
        },
        callType: {
          type: "string",
          enum: ["audio", "video"],
          errorMessage: "Call type must be either 'audio' or 'video'"
        },
        isGroupCall: {
          type: "boolean",
          errorMessage: "isGroupCall must be a boolean"
        }
      },
      additionalProperties: false,
      errorMessage: {
        required: {
          conversationId: "Conversation ID is required",
          callType: "Call type is required"
        }
      }
    }
  },

  handleSignaling: {
    body: {
      type: "object",
      required: ["type", "data", "toUserId"],
      properties: {
        type: {
          type: "string",
          enum: ["offer", "answer", "ice-candidate", "call-ended", "call-accepted", "call-declined"],
          errorMessage: "Signaling type must be one of: offer, answer, ice-candidate, call-ended, call-accepted, call-declined"
        },
        data: {
          type: "object",
          errorMessage: "Signaling data must be an object"
        },
        toUserId: {
          type: "integer",
          minimum: 1,
          errorMessage: "To user ID must be a positive integer"
        }
      },
      additionalProperties: false,
      errorMessage: {
        required: {
          type: "Signaling type is required",
          data: "Signaling data is required",
          toUserId: "To user ID is required"
        }
      }
    }
  },

  declineCall: {
    body: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          maxLength: 255,
          errorMessage: "Reason must be a string with maximum 255 characters"
        }
      },
      additionalProperties: false
    }
  }
};
