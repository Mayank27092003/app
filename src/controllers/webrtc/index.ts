import { Request, Response } from "express";
import { WebRTCService } from "../../services/webrtc";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";

export class WebRTCController {
  private webrtcService: WebRTCService;

  constructor() {
    this.webrtcService = new WebRTCService();
  }

  /**
   * Initiate a call (supports both 1-on-1 and group calls)
   * POST /webrtc/calls/initiate
   */
  initiateCall = async (req: Request, res: Response) => {
    try {
      const { conversationId, callType, isGroupCall } = req.body;
      const callerId = (req as any).user?.id;

      if (!callerId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!conversationId || !callType) {
        throw new HttpException("conversationId and callType are required", 400);
      }

      if (!["audio", "video"].includes(callType)) {
        throw new HttpException("callType must be 'audio' or 'video'", 400);
      }

      const callSession = await this.webrtcService.initiateCall({
        conversationId: parseInt(conversationId),
        callerId,
        callType,
        isGroupCall: isGroupCall || undefined, // Let service determine if not specified
      });

      res.status(201).json({
        success: true,
        message: "Call initiated successfully",
        data: callSession,
      });
    } catch (error: any) {
      Logger.error(`Error in initiateCall controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Accept a call
   * POST /webrtc/calls/:callSessionId/accept
   */
  acceptCall = async (req: Request, res: Response) => {
    try {
      const callSessionId = parseInt(String(req.params.callSessionId));
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!callSessionId || isNaN(callSessionId)) {
        throw new HttpException("Valid call session ID is required", 400);
      }

      const callSession = await this.webrtcService.acceptCall(callSessionId, userId);

      res.json({
        success: true,
        message: "Call accepted successfully",
        data: callSession,
      });
    } catch (error: any) {
      Logger.error(`Error in acceptCall controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Decline a call
   * POST /webrtc/calls/:callSessionId/decline
   */
  declineCall = async (req: Request, res: Response) => {
    try {
      const callSessionId = parseInt(String(req.params.callSessionId));
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!callSessionId || isNaN(callSessionId)) {
        throw new HttpException("Valid call session ID is required", 400);
      }

      const callSession = await this.webrtcService.declineCall(callSessionId, userId, reason);

      res.json({
        success: true,
        message: "Call declined successfully",
        data: callSession,
      });
    } catch (error: any) {
      Logger.error(`Error in declineCall controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * End a call
   * POST /webrtc/calls/:callSessionId/end
   */
  endCall = async (req: Request, res: Response) => {
    try {
      const callSessionId = parseInt(String(req.params.callSessionId));
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!callSessionId || isNaN(callSessionId)) {
        throw new HttpException("Valid call session ID is required", 400);
      }

      const callSession = await this.webrtcService.endCall(callSessionId, userId);

      res.json({
        success: true,
        message: "Call ended successfully",
        data: callSession,
      });
    } catch (error: any) {
      Logger.error(`Error in endCall controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Handle WebRTC signaling
   * POST /webrtc/calls/:callSessionId/signaling
   */
  handleSignaling = async (req: Request, res: Response) => {
    try {
      const callSessionId = parseInt(String(req.params.callSessionId));
      const { type, data, toUserId } = req.body;
      const fromUserId = (req as any).user?.id;

      if (!fromUserId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!callSessionId || isNaN(callSessionId)) {
        throw new HttpException("Valid call session ID is required", 400);
      }

      if (!type || !data || !toUserId) {
        throw new HttpException("type, data, and toUserId are required", 400);
      }

      await this.webrtcService.handleSignaling({
        callSessionId,
        type,
        data,
        fromUserId,
        toUserId: parseInt(toUserId),
      });

      res.json({
        success: true,
        message: "Signaling data sent successfully",
      });
    } catch (error: any) {
      Logger.error(`Error in handleSignaling controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Join an ongoing group call
   * POST /webrtc/calls/:callSessionId/join
   */
  joinGroupCall = async (req: Request, res: Response) => {
    try {
      const callSessionId = parseInt(String(req.params.callSessionId));
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!callSessionId || isNaN(callSessionId)) {
        throw new HttpException("Valid call session ID is required", 400);
      }

      const callSession = await this.webrtcService.joinGroupCall(callSessionId, userId);

      res.json({
        success: true,
        message: "Joined group call successfully",
        data: callSession,
      });
    } catch (error: any) {
      Logger.error(`Error in joinGroupCall controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };

  /**
   * Get call history for a conversation
   * GET /webrtc/calls/history/:conversationId
   */
  getCallHistory = async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.conversationId));
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!conversationId || isNaN(conversationId)) {
        throw new HttpException("Valid conversation ID is required", 400);
      }

      const result = await this.webrtcService.getCallHistory(conversationId, userId, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      Logger.error(`Error in getCallHistory controller: ${error?.message || "Unknown error"}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  };
}
