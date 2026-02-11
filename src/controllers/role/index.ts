import { Request, Response } from "express";
import { RoleService } from "../../services/role";

export class RoleController {
  private service = new RoleService();

  getAll = async (req: Request, res: Response) => {
    try {
      const roles = await this.service.getAll();
      res.json({ success: true, data: roles });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: "Valid role ID is required" });
      }

      const role = await this.service.getById(id);
      if (!role) {
        return res.status(404).json({ success: false, message: "Role not found" });
      }

      res.json({ success: true, data: role });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  };
}


