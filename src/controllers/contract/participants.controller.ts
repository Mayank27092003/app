import { Response, Request } from "express";
import { AuthenticatedRequest } from "../../types";
import { ContractParticipantService } from "../../services/contract/participants.service";
import { HttpException } from "../../utils/httpException";

export class ContractParticipantsController {
  private service = new ContractParticipantService();

  addDriver = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const { driverUserId } = req.body;
      const userId = req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);
      const participant = await this.service.addDriver(contractId, driverUserId, userId);
      res.json({ success: true, participant });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  addCarrier = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const { carrierUserId } = req.body;
      const userId = req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);
      const participant = await this.service.addCarrier(contractId, carrierUserId, userId);
      res.json({ success: true, participant });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  acceptCarrierInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const userId = req.user?.id!;
      const participant = await this.service.acceptCarrierInvite(contractId, userId);
      res.json({ success: true, participant });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  declineCarrierInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const userId = req.user?.id!;
      const { reason } = req.body || {};
      const result = await this.service.declineCarrierInvite(contractId, userId, reason);
      res.json({ ...result });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  removeDriver = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const driverUserId = parseInt(req.params.userId);
      const { reason } = req.body || {};
      const userId = req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);
      const result = await this.service.removeDriver(contractId, driverUserId, userId, reason);
      res.json(result);
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  changeDriver = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const { currentDriverUserId, newDriverUserId, reason } = req.body;
      const userId = req.user?.id;
      if (!userId) throw new HttpException("Unauthorized", 401);
      const result = await this.service.changeDriver(contractId, currentDriverUserId ?? null, newDriverUserId, userId, reason);
      res.json({  ...result });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  acceptInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const driverUserId = req.user?.id!;
      const result = await this.service.acceptInvite(contractId, driverUserId);
      res.json({ success: true, participant: result });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  declineInvite = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const driverUserId = req.user?.id!;
      const { reason } = req.body || {};
      const result = await this.service.declineInvite(contractId, driverUserId, reason);
      res.json({ ...result });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  getMyInvites = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const invites = await this.service.getMyInvites(userId, req.query);
      res.json({ success: true, data: invites });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  setDriverLocationVisibility = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const { driverUserId, isLocationVisible } = req.body;
      const userId = req.user?.id!;
      const result = await this.service.setDriverLocationVisibility(contractId, driverUserId, Boolean(isLocationVisible), userId);
      res.json({...result });
    } catch (err: any) {
      res.status(err?.status || 500).json({ success: false, message: err?.message || "Internal error" });
    }
  };
}


