import { Role } from "../../models/roles";

export class RoleService {
  async getAll() {
    const roles = await Role.query()
      .orderBy("sortOrder", "asc")
      .select("roles.*")
      .select(
        Role.relatedQuery("userRoles")
          .count()
          .as("userCount")
      );

    // Convert userCount from string to number (Objection returns count as string)
    return roles.map((role: any) => ({
      ...role,
      userCount: parseInt(role.userCount || "0", 10),
    }));
  }

  async getById(id: number) {
    const role = await Role.query()
      .findById(id)
      .select("roles.*")
      .select(
        Role.relatedQuery("userRoles")
          .count()
          .as("userCount")
      );

    if (!role) {
      return null;
    }

    // Convert userCount from string to number (Objection returns count as string)
    return {
      ...role,
      userCount: parseInt((role as any).userCount || "0", 10),
    };
  }
}

export default new RoleService();


