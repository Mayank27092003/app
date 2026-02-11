import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { RatingService } from "../../services/rating";
import { HttpException } from "../../utils/httpException";

export class RatingController {
  private service = new RatingService();

  rate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const contractId = parseInt(req.params.contractId);
      const { rateeUserId, stars, comment } = req.body;
      const rating = await this.service.createOrUpdate(contractId, userId, Number(rateeUserId), Number(stars), comment);
      res.json({ success: true, data: rating });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  userRatings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const filterByRaterId = req.query.raterId ? parseInt(req.query.raterId as string) : undefined;
      const data = await this.service.getUserRatings(userId, filterByRaterId);
      res.json({ success: true, data });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  ratingsGivenByUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const filterByRateeId = req.query.rateeId ? parseInt(req.query.rateeId as string) : undefined;
      const data = await this.service.getRatingsGivenByUser(userId, filterByRateeId);
      res.json({ success: true, data });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  updateRating = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const ratingId = parseInt(req.params.ratingId);
      const { stars, comment } = req.body;
      const rating = await this.service.updateRating(ratingId, userId, Number(stars), comment);
      res.json({ success: true, data: rating });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  deleteRating = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const ratingId = parseInt(req.params.ratingId);
      const result = await this.service.deleteRating(ratingId, userId);
      res.json(result);
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  contractRatings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const data = await this.service.getContractRatings(contractId);
      res.json({ success: true, data });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };
}


