import { Request, Response } from "express";
import { TruckTypeService } from "../../services/truckType/truckType.service";

export class TruckTypeController {
  private service = new TruckTypeService();

  list = async (req: Request, res: Response) => {
    try {
      const truckTypes = await this.service.list();
      res.json({ success: true, data: truckTypes });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const truckType = await this.service.getById(Number(id));
      if (!truckType) {
        return res.status(404).json({ success: false, message: "TruckType not found" });
      }
      res.json({ success: true, data: truckType });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const truckType = await this.service.create(req.body);
      res.status(201).json({ success: true, data: truckType });
    } catch (err) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const truckType = await this.service.update(Number(id), req.body);
      if (!truckType) {
        return res.status(404).json({ success: false, message: "TruckType not found" });
      }
      res.json({ success: true, data: truckType });
    } catch (err) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedCount = await this.service.delete(Number(id));
      if (!deletedCount) {
        return res.status(404).json({ success: false, message: "TruckType not found" });
      }
      res.json({ success: true, message: "TruckType deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };
}
