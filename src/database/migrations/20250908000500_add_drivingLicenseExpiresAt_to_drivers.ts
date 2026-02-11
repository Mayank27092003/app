import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("drivers", "drivingLicenseExpiresAt");
  if (!hasColumn) {
    await knex.schema.alterTable("drivers", (table) => {
      table.timestamp("drivingLicenseExpiresAt").nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn("drivers", "drivingLicenseExpiresAt");
  if (hasColumn) {
    await knex.schema.alterTable("drivers", (table) => {
      table.dropColumn("drivingLicenseExpiresAt");
    });
  }
}


