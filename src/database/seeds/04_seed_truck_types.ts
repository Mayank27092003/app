import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("truckTypes").del();

  // Inserts seed entries with translationKey (underscored)
  await knex("truckTypes").insert([
    { id: 1, name: "Flatbed", translationKey: "truckType_flatbed", sortIndex: 1 },
    { id: 2, name: "Refrigerated", translationKey: "truckType_refrigerated", sortIndex: 2 },
    { id: 3, name: "Dry Van", translationKey: "truckType_dryVan", sortIndex: 3 },
    { id: 4, name: "Tanker", translationKey: "truckType_tanker", sortIndex: 4 },
    { id: 5, name: "Lowboy", translationKey: "truckType_lowboy", sortIndex: 5 },
    { id: 6, name: "Box Truck", translationKey: "truckType_boxTruck", sortIndex: 6 },
    { id: 7, name: "Container Chassis", translationKey: "truckType_containerChassis", sortIndex: 7 },
  ]);

}
