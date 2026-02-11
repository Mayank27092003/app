import { Request, Response } from "express";
import { RolePostingPermissionService } from "../../services/rolePostingPermission";

export class RolePostingPermissionController {
  private service = new RolePostingPermissionService();

  list = async (req: Request, res: Response) => {
    const rows = await this.service.list();
    res.json({ success: true, data: rows });
  };

  getAllowedViewers = async (req: Request, res: Response) => {
    const posterRoleId = Number(req.params.posterRoleId);
    const viewers = await this.service.getAllowedViewers(posterRoleId);
    res.json({ success: true, data: viewers });
  };

  upsert = async (req: Request, res: Response) => {
    const { posterRoleId, viewerRoleId } = req.body;
    const row = await this.service.upsert(Number(posterRoleId), Number(viewerRoleId));
    res.json({ success: true, data: row });
  };

  bulkSet = async (req: Request, res: Response) => {
    const posterRoleId = Number(req.params.posterRoleId);
    const { viewerRoleIds } = req.body as { viewerRoleIds: number[] };
    await this.service.bulkSet(posterRoleId, viewerRoleIds || []);
    res.json({ success: true });
  };

  remove = async (req: Request, res: Response) => {
    const posterRoleId = Number(req.params.posterRoleId);
    const viewerRoleId = Number(req.params.viewerRoleId);
    await this.service.remove(posterRoleId, viewerRoleId);
    res.json({ success: true });
  };
}
