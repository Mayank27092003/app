import type { Knex } from "knex";

// Default mapping by role name
// shipper -> driver, carrier, broker
// broker  -> carrier, driver
// carrier -> driver

export async function seed(knex: Knex): Promise<void> {
  // Get role ids by name
  const roles = await knex("roles").select("id", "name");
  const byName = new Map<string, number>();
  roles.forEach(r => byName.set(r.name, r.id));

  const shipper = byName.get("shipper");
  const broker = byName.get("broker");
  const carrier = byName.get("carrier");
  const driver = byName.get("driver");

  const rows: Array<{ posterRoleId: number; viewerRoleId: number }> = [];

  if (shipper && driver) rows.push({ posterRoleId: shipper, viewerRoleId: driver });
  if (shipper && carrier) rows.push({ posterRoleId: shipper, viewerRoleId: carrier });
  if (shipper && broker) rows.push({ posterRoleId: shipper, viewerRoleId: broker });

  if (broker && carrier) rows.push({ posterRoleId: broker, viewerRoleId: carrier });
  if (broker && driver) rows.push({ posterRoleId: broker, viewerRoleId: driver });

  if (carrier && driver) rows.push({ posterRoleId: carrier, viewerRoleId: driver });

  if (rows.length === 0) return;

  // Avoid duplicates
  for (const row of rows) {
    const exists = await knex("rolePostingPermissions")
      .where({ posterRoleId: row.posterRoleId, viewerRoleId: row.viewerRoleId })
      .first();
    if (!exists) {
      await knex("rolePostingPermissions").insert(row);
    }
  }
}
