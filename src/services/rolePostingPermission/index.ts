import { RolePostingPermission } from "../../models/rolePostingPermission";

export class RolePostingPermissionService {
  async list(): Promise<RolePostingPermission[]> {
    return RolePostingPermission.query().withGraphFetched("[posterRole, viewerRole]");
  }

  async getAllowedViewers(posterRoleId: number): Promise<any[]> {
    const rows = await RolePostingPermission.query().where({ posterRoleId }).withGraphFetched("[viewerRole]");
    return rows;
  }

  async upsert(posterRoleId: number, viewerRoleId: number): Promise<RolePostingPermission> {
    const found = await RolePostingPermission.query().findOne({ posterRoleId, viewerRoleId });
    if (found) {
      return found;
    }
    return RolePostingPermission.query().insertAndFetch({ posterRoleId, viewerRoleId });
  }

  async bulkSet(posterRoleId: number, viewerRoleIds: number[]): Promise<void> {
    await RolePostingPermission.query().delete().where({ posterRoleId });
    if (viewerRoleIds.length === 0) return;
    await RolePostingPermission.query().insert(viewerRoleIds.map(id => ({ posterRoleId, viewerRoleId: id })));
  }

  async remove(posterRoleId: number, viewerRoleId: number): Promise<number> {
    return RolePostingPermission.query().delete().where({ posterRoleId, viewerRoleId });
  }
}
