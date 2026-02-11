import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { DashboardService } from "../../services/dashboard";
import { HttpException } from "../../utils/httpException";
import { requireRole } from "../../middlewares/requireRole";

export class DashboardController {
  private service = new DashboardService();

  getUserDashboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const data = await this.service.getUserDashboard(userId);
      res.json({ success: true, data });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  getAdminDashboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.service.getAdminDashboard();
      res.json({ success: true, data });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };
}

