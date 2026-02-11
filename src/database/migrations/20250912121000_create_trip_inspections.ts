import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const has = await knex.schema.hasTable("tripInspections");
  if (has) return;
  await knex.schema.createTable("tripInspections", (table) => {
    table.increments("id").primary();
    table.integer("contractId").notNullable().references("id").inTable("contracts").onDelete("CASCADE");
    table.enu("type", ["pre", "post"], { useNative: true, enumName: "trip_inspection_type" }).notNullable();
    table.integer("driverUserId").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.enu("status", ["started", "completed", "submitted"], { useNative: true, enumName: "trip_inspection_status" }).notNullable();
    table.timestamp("startedAt").notNullable();
    table.timestamp("completedAt");
    table.timestamp("submittedAt");
    table.jsonb("data");
    table.jsonb("defects");
    table.jsonb("photos");
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.index(["contractId", "driverUserId", "type"], "trip_inspections_contract_driver_type_idx");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tripInspections");
  await knex.raw("DROP TYPE IF EXISTS trip_inspection_type");
  await knex.raw("DROP TYPE IF EXISTS trip_inspection_status");
}


