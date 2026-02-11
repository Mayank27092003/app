import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { TripInspectionService } from "../../services/tripInspection";
import { HttpException } from "../../utils/httpException";

export class TripInspectionController {
  private service = new TripInspectionService();

  start = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const { type } = req.body as { type: "pre" | "post" };
      const userId = req.user?.id!;
      const insp = await this.service.startInspection(contractId, userId, type);
      res.json({ success: true, data: insp });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  complete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const userId = req.user?.id!;
      const insp = await this.service.completeInspection(inspectionId, userId, req.body || {});
      res.json({ success: true, data: insp });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  submit = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const userId = req.user?.id!;
      const result = await this.service.submitForPayment(contractId, userId);
      res.json({ success: true, data:result });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  mine = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.id);
      const userId = req.user?.id!;
      const rows = await this.service.getMyInspections(contractId, userId);
      res.json({ success: true, data: rows });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };
}


