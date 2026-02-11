import { WebRTCController } from "../../controllers/webrtc";
import { authenticateToken } from "../../middlewares/authentication";
import { useValidator } from "../../middlewares/validate";
import { webrtcSchema } from "../../validators/webrtc.schema";
import { webrtcSwaggerDocs } from "./swagger";

const controller = new WebRTCController();

export default [
  // Initiate call
  {
    path: "/calls/initiate",
    controller: { post: controller.initiateCall },
    validators: { post: useValidator(webrtcSchema.initiateCall.body) },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: webrtcSwaggerDocs.initiateCall,
    },
  },

  // Accept call
  {
    path: "/calls/:callSessionId/accept",
    controller: { post: controller.acceptCall },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: webrtcSwaggerDocs.acceptCall,
    },
  },

  // Decline call
  {
    path: "/calls/:callSessionId/decline",
    controller: { post: controller.declineCall },
    validators: { post: useValidator(webrtcSchema.declineCall.body) },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: webrtcSwaggerDocs.declineCall,
    },
  },

  // End call
  {
    path: "/calls/:callSessionId/end",
    controller: { post: controller.endCall },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: webrtcSwaggerDocs.endCall,
    },
  },

  // Join group call
  {
    path: "/calls/:callSessionId/join",
    controller: { post: controller.joinGroupCall },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: webrtcSwaggerDocs.joinGroupCall,
    },
  },

  // Handle WebRTC signaling
  {
    path: "/calls/:callSessionId/signaling",
    controller: { post: controller.handleSignaling },
    validators: { post: useValidator(webrtcSchema.handleSignaling.body) },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: webrtcSwaggerDocs.handleSignaling,
    },
  },

  // Get call history
  {
    path: "/calls/history/:conversationId",
    controller: { get: controller.getCallHistory },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: webrtcSwaggerDocs.getCallHistory,
    },
  },
];